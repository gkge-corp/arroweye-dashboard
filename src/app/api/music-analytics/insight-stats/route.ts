import { NextRequest, NextResponse } from "next/server";

import { readCountryName } from "@/lib/music-analytics/country-names";
import {
  REACH_PLATFORMS,
  fromSongstatsSource,
  parsePlatforms,
  toSongstatsSource,
} from "@/lib/music-analytics/platforms";
import { fetchRadioStations } from "@/lib/music-analytics/soundcharts-radio";
import {
  fetchTrackStats,
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

const ACTION_SOURCE_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

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
 * PLAYLIST BREAKDOWN: current playlist placements per platform, the playlists behind
 * the streaming figures. Reach rides along for the tooltip; Apple Music and
 * Amazon report placements without it.
 */
const summarizePlaylists = (
  stats: Map<string, SourceData>,
  sources: string[],
) => {
  const counts: [string, number][] = [];
  const reach: Record<string, number> = {};

  for (const source of sources) {
    const data = stats.get(source);
    const label =
      REACH_PLATFORMS.find(
        (platform) => platform.code === fromSongstatsSource(source),
      )?.label ?? source;

    counts.push([label, readNumber(data, "playlists_current")]);
    const platformReach = readNumber(data, "playlist_reach_current");
    if (platformReach > 0) reach[label] = platformReach;
  }

  return { performance: withTotal(counts), performanceReach: reach };
};

const readMetric = (stats: Map<string, SourceData>, metric: DspMetric) =>
  readNumber(stats.get(metric.source), metric.field);

const asDate = (value: string | null) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;

/** Current running totals per action, so ACTIONS renders from day one. */
const summarizeActionTotals = (stats: Map<string, SourceData>) => {
  const entries: [string, number][] = [];
  for (const [source, fields] of Object.entries(ACTION_FIELDS)) {
    for (const [action, field] of Object.entries(fields)) {
      entries.push([action, readNumber(stats.get(source), field)]);
    }
  }
  return withTotal(entries);
};

/** Every action on each platform added up, so SOCIAL MEDIA splits by platform. */
const summarizePlatformTotals = (stats: Map<string, SourceData>) =>
  withTotal(
    Object.entries(ACTION_FIELDS).map(([source, fields]) => [
      ACTION_SOURCE_LABELS[source] ?? source,
      Object.values(fields).reduce(
        (sum, field) => sum + readNumber(stats.get(source), field),
        0,
      ),
    ]),
  );

/**
 * Spins per country over the window, so the markets picker can filter without
 * another call. Reads the same first page Top Radio does.
 */
const readAirplay = async (
  isrc: string,
  window: { startDate: string; endDate: string },
) => {
  const stations = await fetchRadioStations(isrc, window);

  const byCountry: Record<string, number> = {};
  const countryCodes: Record<string, string> = {};

  for (const station of stations) {
    const name = readCountryName(station.countryCode);
    if (!name || station.plays === 0) continue;

    byCountry[name] = (byCountry[name] ?? 0) + station.plays;
    countryCodes[name] = station.countryCode;
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
  const hasCampaignWindow = Boolean(startDate && startDate <= endDate);
  // Spins are counted over the campaign; before it starts there is no window,
  // so the recent RADIO_WINDOW_DAYS stand in.
  const radioWindow = hasCampaignWindow
    ? { startDate: startDate!, endDate }
    : { startDate: daysAgo(RADIO_WINDOW_DAYS), endDate: today };
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
      ...(wantSocial
        ? [
            ...DSP_METRICS.map((metric) => metric.source),
            ...Object.keys(ACTION_FIELDS),
          ]
        : []),
      ...reachSources,
    ]),
  ];

  try {
    const [statsResult, radioResult] = await Promise.allSettled([
      statSources.length > 0
        ? fetchTrackStats(isrc, statSources, {
            with_playlists: reachSources.length > 0,
            only_current: true,
            limit: 100,
          })
        : Promise.resolve(new Map<string, SourceData>()),
      wantRadio ? readAirplay(isrc, radioWindow) : Promise.resolve(null),
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
      console.error("Soundcharts radio spins failed:", radioResult.reason);
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

    const { performance, performanceReach } = summarizePlaylists(
      stats,
      reachSources,
    );

    return NextResponse.json({
      periodDays: PERIOD_DAYS,
      radioWindow,
      stats: {
        // SOCIAL MEDIA and ACTIONS read the same totals: summed per platform
        // for one, per kind of action for the other.
        socialMedia: wantSocial ? summarizePlatformTotals(stats) : undefined,
        actions: wantSocial ? summarizeActionTotals(stats) : undefined,
        // All-time plays. Left unfiltered: which platforms the viewer wants
        // shown is applied on the client, so toggling one costs no further
        // calls.
        dsp: withTotal(
          dspMetrics.map((metric) => [metric.label, readMetric(stats, metric)]),
        ),
        radioSpins,
        airplayByCountry,
        availableAirplayCountries,
        airplayCountryCodes: airplay?.countryCodes ?? {},
        availableStreamingPlatforms,
        performance,
        performanceReach,
      },
    });
  } catch (error) {
    console.error("Songstats insight stats failed:", error);
    return songstatsErrorResponse(error);
  }
}
