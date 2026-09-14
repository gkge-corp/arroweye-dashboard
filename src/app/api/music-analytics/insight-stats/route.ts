import { NextRequest, NextResponse } from "next/server";

import { mapWithConcurrency, withRetry } from "@/lib/music-analytics/fan-out";
import {
  ARTIST_SOCIAL_PLATFORMS,
  REACH_PLATFORMS,
  parsePlatforms,
} from "@/lib/music-analytics/platforms";
import {
  SoundchartsError,
  soundchartsRequest,
} from "@/lib/music-analytics/soundcharts-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERIOD_DAYS = 30;
const RADIO_WINDOW_DAYS = 90;

// PERFORMANCE breaks playlist reach down by how the placement was curated.
// Soundcharts reports reach per platform, so these are summed across them.
const REACH_CONCURRENCY = 3;

// Only the two charts that are broken down BY PLATFORM can be sourced from
// Soundcharts. AIRPLAY, ACTIONS and PERFORMANCE are broken down by channel or
// by action type (Impressions, Saves, Likes, Reshares...), which Soundcharts
// does not report, so those keep the figures ops enter by hand.
//
// This call shares its path with the Social Traction route, so a campaign that
// has rendered that card pays nothing here.
const PLATFORM_LABELS: Record<string, string> = {
  spotify: "Spotify",
  youtube: "YouTube",
  audiomack: "Audiomack",
  soundcloud: "SoundCloud",
  anghami: "Anghami",
  tiktok: "TikTok",
  instagram: "Instagram",
  genius: "Genius",
  facebook: "Facebook",
  x: "X",
  twitter: "X",
  deezer: "Deezer",
  tidal: "Tidal",
  boomplay: "Boomplay",
  amazon: "Amazon",
  "apple-music": "Apple Music",
  "line-music": "Line Music",
  "qq-music": "QQ Music",
  jiosaavn: "JioSaavn",
  kkbox: "KKBOX",
  lastfm: "Last.fm",
  vk: "VK",
  weibo: "Weibo",
  bluesky: "Bluesky",
};

// Soundcharts returns whichever platforms it holds data for, and that set
// varies per song. Its "social" referential is no help here — it lists Spotify
// and Deezer too, since it only means "has audience data". So social networks
// are named explicitly and every other platform counts as a DSP, which means a
// platform we have not seen before lands on a chart instead of vanishing.
const SOCIAL_PLATFORMS = new Set([
  "tiktok",
  "instagram",
  "facebook",
  "x",
  "twitter",
  "vk",
  "weibo",
  "bluesky",
  "pinterest",
  "twitch",
  "patreon",
  "genius",
  "mixcloud",
  "bandsintown",
  "songkick",
  "resident-advisor",
]);

const toLabel = (platform: string) =>
  PLATFORM_LABELS[platform] ??
  platform
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

interface BroadcastGroup {
  radio?: { countryCode?: string; countryName?: string };
  playCount?: number;
}

interface ArtistAudiencePlot {
  date?: string;
  followerCount?: number | null;
}

interface PlaylistReachPlot {
  date?: string;
  playlistReach?: number;
  playlistEditorialReach?: number;
  playlistUserReach?: number;
  playlistCount?: number;
  playlistEditorialCount?: number;
  playlistUserCount?: number;
}

interface StatPlot {
  platform?: string;
  value?: number;
  evolution?: number;
}

type InsightStats = Record<string, number>;

const daysAgo = (days: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
};

/** Chart builders expect a flat map of label -> value plus a total_count. */
const withTotal = (entries: [string, number][]): InsightStats => {
  const positive = entries.filter(([, value]) => value > 0);
  const stats: InsightStats = Object.fromEntries(positive);
  stats.total_count = positive.reduce((sum, [, value]) => sum + value, 0);
  return stats;
};

const pickPlatforms = (
  stats: StatPlot[],
  wantSocial: boolean,
  read: (stat: StatPlot) => number,
) =>
  withTotal(
    stats
      .filter(
        (stat) =>
          stat.platform && SOCIAL_PLATFORMS.has(stat.platform) === wantSocial,
      )
      .map((stat) => [
        toLabel(stat.platform!),
        Math.max(0, Math.round(read(stat))),
      ]),
  );

export async function GET(request: NextRequest) {
  const uuid = request.nextUrl.searchParams.get("uuid")?.trim();

  if (!uuid) {
    return NextResponse.json(
      { error: "Provide a song uuid.", code: "MISSING_UUID" },
      { status: 400 },
    );
  }

  const wantRadio = request.nextUrl.searchParams.get("radio") !== "0";
  const wantSocial = request.nextUrl.searchParams.get("social") !== "0";
  const countryParam = request.nextUrl.searchParams.get("countries");
  const selectedCountries = countryParam
    ? new Set(
        countryParam
          .split(",")
          .map((country) => country.trim())
          .filter(Boolean),
      )
    : null;
  // Absent means none: artist figures are opt-in, so a missing parameter must
  // never fall through to "all platforms".
  const artistParam = request.nextUrl.searchParams.get("artistPlatforms");
  const artistPlatforms = artistParam
    ? parsePlatforms(artistParam, ARTIST_SOCIAL_PLATFORMS)
    : [];

  const reachPlatforms = parsePlatforms(
    request.nextUrl.searchParams.get("reachPlatforms"),
    request.nextUrl.searchParams.has("reachPlatforms") &&
      !request.nextUrl.searchParams.get("reachPlatforms")
      ? []
      : REACH_PLATFORMS,
  );

  try {
    const radioQuery = new URLSearchParams({
      startDate: daysAgo(RADIO_WINDOW_DAYS),
      endDate: new Date().toISOString().slice(0, 10),
      offset: "0",
      limit: "100",
    });

    const [statsResult, radioResult] = await Promise.allSettled([
      wantSocial
        ? withRetry(() =>
            soundchartsRequest<{ audience?: StatPlot[] }>(
              `/api/v2/song/${encodeURIComponent(uuid)}/current/stats?period=${PERIOD_DAYS}`,
            ),
          )
        : Promise.resolve({ audience: [] }),
      wantRadio
        ? withRetry(() =>
            soundchartsRequest<{ items?: BroadcastGroup[] }>(
              `/api/v2/song/${uuid}/broadcast-groups?${radioQuery}`,
            ),
          )
        : Promise.resolve({ items: [] }),
    ]);

    if (statsResult.status === "rejected") {
      console.error("Soundcharts insight stats failed:", statsResult.reason);
    }
    if (radioResult.status === "rejected") {
      console.error("Soundcharts radio spins failed:", radioResult.reason);
    }

    const audience =
      statsResult.status === "fulfilled"
        ? (statsResult.value.audience ?? [])
        : [];

    // Spins grouped by country, so the markets picker can filter without
    // spending a call per country.
    const airplayByCountry: Record<string, number> = {};
    const airplayCountryCodes: Record<string, string> = {};

    if (radioResult.status === "fulfilled") {
      for (const item of radioResult.value.items ?? []) {
        const name = item.radio?.countryName ?? item.radio?.countryCode;
        if (!name) continue;

        airplayByCountry[name] =
          (airplayByCountry[name] ?? 0) + Number(item.playCount ?? 0);
        if (item.radio?.countryCode) {
          airplayCountryCodes[name] = item.radio.countryCode.toUpperCase();
        }
      }
    }

    const availableAirplayCountries = { ...airplayByCountry };

    if (selectedCountries) {
      for (const country of Object.keys(airplayByCountry)) {
        if (!selectedCountries.has(country)) delete airplayByCountry[country];
      }
    }

    const radioSpins =
      radioResult.status === "fulfilled"
        ? Object.values(airplayByCountry).reduce((sum, v) => sum + v, 0)
        : null;

    // Reach is reported per platform and only the newest point matters, so one
    // row per platform is requested rather than a full time series.
    const reachResults = await mapWithConcurrency(
      reachPlatforms,
      REACH_CONCURRENCY,
      async (platform) => {
        try {
          const payload = await withRetry(() =>
            soundchartsRequest<{ items?: PlaylistReachPlot[] }>(
              `/api/v2/song/${uuid}/playlist/reach/${platform.code}?limit=1&sortBy=date&sortOrder=desc`,
            ),
          );
          return { platform, plot: (payload.items ?? []).at(-1) ?? null };
        } catch (error) {
          if (error instanceof SoundchartsError && error.status === 404) {
            return { platform, plot: null };
          }
          console.error(
            `Soundcharts playlist reach failed for ${platform.code}:`,
            error,
          );
          return { platform, plot: null };
        }
      },
    );

    let editorialReach = 0;
    let userReach = 0;
    let totalReach = 0;
    // Apple Music and Amazon report placements but no reach figure, so they
    // are named rather than silently counting as zero.
    const platformsWithoutReach: string[] = [];

    for (const { platform, plot } of reachResults) {
      if (!plot) continue;

      const total = Number(plot.playlistReach ?? 0);
      editorialReach += Number(plot.playlistEditorialReach ?? 0);
      userReach += Number(plot.playlistUserReach ?? 0);
      totalReach += total;

      if (total === 0 && Number(plot.playlistCount ?? 0) > 0) {
        platformsWithoutReach.push(platform.label);
      }
    }

    // Soundcharts counts algorithmic and radio playlists in the total but not
    // in either named bucket, so the remainder is surfaced instead of dropped.
    const otherReach = Math.max(0, totalReach - editorialReach - userReach);

    // Facebook and Twitter only exist per artist, so the song's lead credit is
    // resolved once and reused for every selected platform.
    const artistFollowers: Record<string, number> = {};

    if (artistPlatforms.length > 0) {
      try {
        const songPayload = await withRetry(() =>
          soundchartsRequest<{
            object?: { artists?: { uuid?: string; name?: string }[] };
          }>(`/api/v2/song/${uuid}`),
        );
        const artistUuid = songPayload.object?.artists?.[0]?.uuid;

        if (artistUuid) {
          const artistResults = await mapWithConcurrency(
            artistPlatforms,
            REACH_CONCURRENCY,
            async (platform) => {
              try {
                const payload = await withRetry(() =>
                  soundchartsRequest<{ items?: ArtistAudiencePlot[] }>(
                    `/api/v2/artist/${artistUuid}/audience/${platform.code}?limit=1&sort=desc`,
                  ),
                );
                const latest = (payload.items ?? []).at(-1);
                return {
                  platform,
                  followers: Number(latest?.followerCount ?? 0),
                };
              } catch (error) {
                if (error instanceof SoundchartsError && error.status === 404) {
                  return { platform, followers: 0 };
                }
                console.error(
                  `Soundcharts artist audience failed for ${platform.code}:`,
                  error,
                );
                return { platform, followers: 0 };
              }
            },
          );

          for (const { platform, followers } of artistResults) {
            if (followers > 0) {
              artistFollowers[`${platform.label} followers`] = followers;
            }
          }
        }
      } catch (error) {
        console.error("Soundcharts artist lookup failed:", error);
      }
    }

    // Every streaming platform this song has audience for, switched off ones
    // included, so the picker can still list what it is hiding.
    const availableStreamingPlatforms = audience
      .filter(
        (stat) =>
          stat.platform &&
          !SOCIAL_PLATFORMS.has(stat.platform) &&
          Number(stat.value ?? 0) > 0,
      )
      .map((stat) => ({
        code: stat.platform!,
        label: toLabel(stat.platform!),
      }));

    const songSocial = pickPlatforms(audience, true, (s) =>
      Number(s.value ?? 0),
    );

    const performance = withTotal([
      ["Editorial playlists", editorialReach],
      ["User playlists", userReach],
      ["Algorithmic & other", otherReach],
    ]);

    return NextResponse.json({
      periodDays: PERIOD_DAYS,
      radioWindowDays: RADIO_WINDOW_DAYS,
      platformsWithoutReach,
      stats: {
        socialMedia: withTotal([
          ...Object.entries(songSocial).filter(
            ([key]) => key !== "total_count",
          ),
          // A platform the song itself reports is already on the chart, so its
          // artist follower count would sit beside it as a second, much larger
          // bar for the same logo ("Instagram" next to "Instagram followers").
          ...Object.entries(artistFollowers).filter(
            ([label]) => !songSocial[label.replace(/ followers$/, "")],
          ),
        ]),
        // Left unfiltered: which platforms the viewer wants shown is applied
        // on the client, so toggling one costs no further Soundcharts calls.
        dsp: pickPlatforms(audience, false, (s) => Number(s.value ?? 0)),
        radioSpins,
        airplayByCountry,
        availableAirplayCountries,
        airplayCountryCodes,
        availableStreamingPlatforms,
        performance,
      },
    });
  } catch (error) {
    console.error("Soundcharts insight stats failed:", error);

    if (error instanceof SoundchartsError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Could not reach the analytics provider.", code: "UNKNOWN" },
      { status: 502 },
    );
  }
}
