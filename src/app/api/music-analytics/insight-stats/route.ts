import { NextRequest, NextResponse } from "next/server";

import { readCountryName } from "@/lib/music-analytics/country-names";
import {
  REACH_PLATFORMS,
  fromSongstatsSource,
  parsePlatforms,
  toSongstatsSource,
} from "@/lib/music-analytics/platforms";
import {
  countPlaysInWindow,
  fetchRadioStations,
  toEpochSeconds,
} from "@/lib/music-analytics/songstats-radio";
import { withRetry } from "@/lib/music-analytics/fan-out";
import {
  normalizeIsrc,
  songstatsRequest,
} from "@/lib/music-analytics/songstats-client";
import {
  fetchTrackStats,
  readList,
  songstatsErrorResponse,
  type SourceData,
} from "@/lib/music-analytics/songstats-track-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERIOD_DAYS = 30;
const RADIO_WINDOW_DAYS = 90;

// DSP plots each platform's headline play count. Songstats reports no play
// counts for Apple Music, Amazon, Deezer or Tidal, so those only appear in
// playlist data.
const DSP_METRICS = [
  { source: "spotify", label: "Spotify", field: "streams_total" },
  { source: "youtube", label: "YouTube", field: "video_views_total" },
  { source: "soundcloud", label: "SoundCloud", field: "streams_total" },
  { source: "shazam", label: "Shazam", field: "shazams_total" },
];

type DspMetric = (typeof DSP_METRICS)[number];

/**
 * ACTIONS: engagement on the song across social video, by kind. Each source
 * names its daily running totals differently; TikTok alone reports shares.
 */
const ACTION_FIELDS: Record<string, Record<string, string>> = {
  tiktok: {
    Views: "views_total",
    Likes: "likes_total",
    Comments: "comments_total",
    Shares: "shares_total",
  },
  instagram: {
    Views: "views_total",
    Likes: "likes_total",
    Comments: "comments_total",
  },
  youtube: {
    Views: "video_views_total",
    Likes: "video_likes_total",
    Comments: "video_comments_total",
  },
};

type HistoryPoint = Record<string, unknown> & { date?: string };

interface PlaylistEntry {
  spotify_userid?: string;
  owner_name?: string;
  playlist_type?: string;
  followers_count?: number;
}

type InsightStats = Record<string, number>;

const daysAgo = (days: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
};

const readNumber = (data: SourceData | undefined, field: string) => {
  const value = Number(data?.[field] ?? 0);
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
};

/** Chart builders expect a flat map of label -> value plus a total_count. */
const withTotal = (entries: [string, number][]): InsightStats => {
  const totals = new Map<string, number>();
  for (const [label, value] of entries) {
    if (value > 0) totals.set(label, (totals.get(label) ?? 0) + value);
  }

  const stats: InsightStats = Object.fromEntries(totals);
  stats.total_count = [...totals.values()].reduce((sum, v) => sum + v, 0);
  return stats;
};

/**
 * Songstats does not tag curation, so editorial placements are recognised by
 * owner: Spotify's own account, Deezer's editors, Apple's `editorial` type.
 */
const isEditorial = (source: string, entry: PlaylistEntry) => {
  if (entry.playlist_type === "editorial") return true;
  if (source === "spotify") return entry.spotify_userid === "spotify";
  if (source === "deezer") return /deezer/i.test(entry.owner_name ?? "");
  return false;
};

/**
 * Songstats gives total reach per platform only. The editorial share is the
 * follower sum of editorial placements among the (at most 100) largest
 * current playlists; everything else counts as other playlists.
 */
const splitReach = (stats: Map<string, SourceData>, sources: string[]) => {
  let editorialReach = 0;
  let otherReach = 0;
  const platformsWithoutReach: string[] = [];

  for (const source of sources) {
    const data = stats.get(source);
    const reach = readNumber(data, "playlist_reach_current");

    // Apple Music and Amazon report placements but no reach figure, so they
    // are named rather than silently counting as zero.
    if (reach === 0) {
      if (readNumber(data, "playlists_current") > 0) {
        const platform = REACH_PLATFORMS.find(
          (entry) => entry.code === fromSongstatsSource(source),
        );
        platformsWithoutReach.push(platform?.label ?? source);
      }
      continue;
    }

    const editorial = readList<PlaylistEntry>(data, "playlists")
      .filter((entry) => isEditorial(source, entry))
      .reduce((sum, entry) => sum + Number(entry.followers_count ?? 0), 0);

    const capped = Math.min(editorial, reach);
    editorialReach += capped;
    otherReach += reach - capped;
  }

  return {
    performance: withTotal([
      ["Editorial playlists", editorialReach],
      ["Other playlists", otherReach],
    ]),
    platformsWithoutReach,
  };
};

const readMetric = (stats: Map<string, SourceData>, metric: DspMetric) =>
  readNumber(stats.get(metric.source), metric.field);

const asDate = (value: string | null) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;

/** Running totals, so the campaign's share is the last point minus the first. */
const readGrowth = (history: HistoryPoint[], field: string) => {
  const values = history
    .map((point) => Number(point[field]))
    .filter((value) => Number.isFinite(value));
  return values.length < 2 ? 0 : Math.max(0, values.at(-1)! - values[0]);
};

const readCampaignActions = async (
  isrc: string,
  startDate: string,
  endDate: string,
) => {
  const payload = await withRetry(() =>
    songstatsRequest<{
      stats?: { source?: string; data?: { history?: HistoryPoint[] } }[];
    }>("/tracks/historic_stats", {
      isrc: normalizeIsrc(isrc),
      source: Object.keys(ACTION_FIELDS),
      start_date: startDate,
      end_date: endDate,
    }),
  );

  const entries: [string, number][] = [];
  for (const entry of payload.stats ?? []) {
    const history = [...(entry.data?.history ?? [])].sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
    for (const [action, field] of Object.entries(
      ACTION_FIELDS[entry.source ?? ""] ?? {},
    )) {
      entries.push([action, readGrowth(history, field)]);
    }
  }
  return withTotal(entries);
};

/**
 * Spins per country over the window, so the markets picker can filter without
 * another call. Reads the same first page Top Radio does.
 */
const readAirplay = async (isrc: string) => {
  const stations = await fetchRadioStations(isrc);
  const from = toEpochSeconds(daysAgo(RADIO_WINDOW_DAYS));
  const to = toEpochSeconds(daysAgo(0), true);

  const byCountry: Record<string, number> = {};
  const countryCodes: Record<string, string> = {};

  for (const station of stations) {
    const name = readCountryName(station.country_code);
    if (!name) continue;

    const plays = countPlaysInWindow(station.radio_plays, from, to);
    if (plays === 0) continue;

    byCountry[name] = (byCountry[name] ?? 0) + plays;
    countryCodes[name] = station.country_code!.toUpperCase();
  }

  return { byCountry, countryCodes };
};

export async function GET(request: NextRequest) {
  const isrc = request.nextUrl.searchParams.get("isrc")?.trim();

  if (!isrc) {
    return NextResponse.json(
      { error: "Provide the song's ISRC.", code: "MISSING_ISRC" },
      { status: 400 },
    );
  }

  const wantRadio = request.nextUrl.searchParams.get("radio") !== "0";
  const wantSocial = request.nextUrl.searchParams.get("social") !== "0";
  const startDate = asDate(request.nextUrl.searchParams.get("startDate"));
  const requestedEnd = asDate(request.nextUrl.searchParams.get("endDate"));
  const today = daysAgo(0);
  const endDate = !requestedEnd || requestedEnd > today ? today : requestedEnd;
  // Before the campaign starts there is no window to measure actions over.
  const wantActions = wantSocial && Boolean(startDate && startDate <= endDate);
  const countryParam = request.nextUrl.searchParams.get("countries");
  const selectedCountries = countryParam
    ? new Set(
        countryParam
          .split(",")
          .map((country) => country.trim())
          .filter(Boolean),
      )
    : null;
  const reachSources = parsePlatforms(
    request.nextUrl.searchParams.get("reachPlatforms"),
    request.nextUrl.searchParams.has("reachPlatforms") &&
      !request.nextUrl.searchParams.get("reachPlatforms")
      ? []
      : REACH_PLATFORMS,
  ).map((platform) => toSongstatsSource(platform.code));

  // Song metrics and playlist reach come from one call covering every source.
  const statSources = [
    ...new Set([
      ...(wantSocial ? DSP_METRICS.map((metric) => metric.source) : []),
      ...reachSources,
    ]),
  ];

  try {
    const [statsResult, radioResult, actionsResult] = await Promise.allSettled([
      statSources.length > 0
        ? fetchTrackStats(isrc, statSources, {
            with_playlists: reachSources.length > 0,
            only_current: true,
            limit: 100,
          })
        : Promise.resolve(new Map<string, SourceData>()),
      wantRadio ? readAirplay(isrc) : Promise.resolve(null),
      wantActions
        ? readCampaignActions(isrc, startDate!, endDate)
        : Promise.resolve(undefined),
    ]);

    // With both halves down there is nothing to chart, so surface the error
    // (a still-indexing track, most often) rather than empty charts.
    if (
      statsResult.status === "rejected" &&
      radioResult.status === "rejected"
    ) {
      throw statsResult.reason;
    }
    if (statsResult.status === "rejected") {
      console.error("Songstats insight stats failed:", statsResult.reason);
    }
    if (radioResult.status === "rejected") {
      console.error("Songstats radio spins failed:", radioResult.reason);
    }
    if (actionsResult.status === "rejected") {
      console.error("Songstats campaign actions failed:", actionsResult.reason);
    }

    const stats =
      statsResult.status === "fulfilled"
        ? statsResult.value
        : new Map<string, SourceData>();
    const airplay =
      radioResult.status === "fulfilled" ? radioResult.value : null;

    const availableAirplayCountries = { ...(airplay?.byCountry ?? {}) };
    const airplayByCountry = Object.fromEntries(
      Object.entries(availableAirplayCountries).filter(
        ([country]) => !selectedCountries || selectedCountries.has(country),
      ),
    );
    const radioSpins = airplay
      ? Object.values(airplayByCountry).reduce((sum, v) => sum + v, 0)
      : null;

    const dspMetrics = wantSocial ? DSP_METRICS : [];

    // Every streaming platform this song has plays on, switched off ones
    // included, so the picker can still list what it is hiding.
    const availableStreamingPlatforms = dspMetrics
      .filter((metric) => readMetric(stats, metric) > 0)
      .map((metric) => ({
        code: fromSongstatsSource(metric.source),
        label: metric.label,
      }));

    const { performance, platformsWithoutReach } = splitReach(
      stats,
      reachSources,
    );

    return NextResponse.json({
      periodDays: PERIOD_DAYS,
      radioWindowDays: RADIO_WINDOW_DAYS,
      platformsWithoutReach,
      stats: {
        // SOCIAL MEDIA is the artist's follower growth over the campaign,
        // which the client already holds from the audience growth route.
        actions:
          actionsResult.status === "fulfilled"
            ? actionsResult.value
            : undefined,
        // Left unfiltered: which platforms the viewer wants shown is applied
        // on the client, so toggling one costs no further calls.
        dsp: withTotal(
          dspMetrics.map((metric) => [metric.label, readMetric(stats, metric)]),
        ),
        radioSpins,
        airplayByCountry,
        availableAirplayCountries,
        airplayCountryCodes: airplay?.countryCodes ?? {},
        availableStreamingPlatforms,
        performance,
      },
    });
  } catch (error) {
    console.error("Songstats insight stats failed:", error);
    return songstatsErrorResponse(error);
  }
}
