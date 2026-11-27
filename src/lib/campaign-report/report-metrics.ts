import type { SocialTractionRow } from "@/components/campaigns/campaign-insights/hooks/use-campaign-social-traction";
import type { SongInsightStats } from "@/components/campaigns/campaign-insights/hooks/use-campaign-insight-stats";
import type { CampaignAudienceGrowth } from "@/hooks/use-campaign-audience-growth";
import {
  mergeStreamingPlatforms,
  resolveStreamingSelection,
  type InsightSources,
} from "@/lib/music-analytics/insight-sources";
import type { CampaignReportMetrics } from "@/types/campaign-report";

// What the campaign insights page shows, as plain functions. The page and the
// weekly report both use these, so the email always matches the page.

type Stats = Record<string, number>;

const toDateOnly = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const datePrefix = value.trim().match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (datePrefix) return datePrefix;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toISOString().slice(0, 10);
};

/** The campaign's window as YYYY-MM-DD dates; the start falls back to when it was created. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const campaignDateRange = (content: any) => ({
  startDate: toDateOnly(
    content?.start_dte ??
      content?.start_date ??
      content?.campaign?.start_date ??
      content?.created,
  ),
  endDate: toDateOnly(
    content?.end_dte ?? content?.end_date ?? content?.campaign?.end_date,
  ),
});

export interface ReportStation {
  name: string;
  country: string;
  plays: number;
}

export interface ReportCreator {
  handle?: string;
  name: string;
  platform: string;
  followers: number;
  views: number;
  url?: string;
}

export interface ReportPlaylist {
  name: string;
  platform: string;
  url?: string;
  position?: number;
  addedAt?: string;
}

/** Shazam is an all-time count; social traction only fills in when insight stats couldn't read it. */
export const pickShazamValue = (
  insightStats: SongInsightStats | undefined,
  socialTraction: SocialTractionRow[],
) => {
  if (typeof insightStats?.dsp?.Shazam === "number") {
    return insightStats.dsp.Shazam;
  }
  const shazamRow = socialTraction.find((item) => item.id === "shazam");
  return typeof shazamRow?.value === "number" ? shazamRow.value : null;
};

/**
 * The STREAMING chart's figures for the platforms the campaign shows. Songstats
 * reports plays for platforms with no playlist list (SoundCloud), so the chart
 * can show more than the playlist picker lists.
 */
export const selectStreamingData = (
  insightStats: SongInsightStats | undefined,
  sources: InsightSources,
  shazamValue: number | null,
) => {
  const streamingOptions = mergeStreamingPlatforms(
    insightStats?.availableStreamingPlatforms,
  );
  const selected = new Set(resolveStreamingSelection(sources, streamingOptions));
  const visibleLabels = new Set(
    streamingOptions
      .filter((platform) => selected.has(platform.code))
      .map((platform) => platform.label),
  );

  const dsp = insightStats?.dsp;
  let visibleDsp: Stats | undefined;
  if (dsp) {
    const kept = Object.entries(dsp).filter(
      ([label]) =>
        label !== "total_count" && label !== "Shazam" && visibleLabels.has(label),
    );
    visibleDsp = {
      ...Object.fromEntries(kept),
      total_count: kept.reduce((sum, [, value]) => sum + Number(value), 0),
    };
  }

  const discoveryData =
    visibleLabels.has("Shazam") && shazamValue !== null && shazamValue > 0
      ? { Shazam: shazamValue }
      : undefined;

  return { streamingOptions, visibleDsp, discoveryData };
};

/** AIRPLAY chart data: nothing while airplay is off, else the selected markets. */
export const selectAirplayData = (
  airplayDisabled: boolean,
  marketData: Stats,
): Stats | undefined => {
  if (airplayDisabled) return { total_count: 0 };
  return marketData.total_count > 0 ? marketData : undefined;
};

/** The headline sums every bar shown, discovery signals such as Shazam included. */
export const sumStreaming = (dsp: Stats, discoveryData?: Stats) =>
  Number(dsp.total_count ?? 0) +
  Object.values(discoveryData ?? {}).reduce((sum, value) => sum + value, 0);

export interface ReportMetricsInput {
  airplay: Stats;
  dsp: Stats;
  discoveryData?: Stats;
  audience: Stats;
  socialMedia: Stats;
  actions: Stats;
  performance: Stats;
  insightStats?: SongInsightStats;
  spinCount: number;
  stations: ReportStation[];
  audienceGrowth?: CampaignAudienceGrowth;
  socialTraction: SocialTractionRow[];
  socialTractionPeriodDays: number;
  shazamValue: number | null;
  topCreators: ReportCreator[];
  playlists: ReportPlaylist[];
}

export const buildCampaignReportMetrics = (
  input: ReportMetricsInput,
): CampaignReportMetrics => {
  // Same figure as the ACTIONS "Video creations" slice, so the report matches it.
  const videoCreations = Number(input.actions["Video creations"] ?? 0);
  const topCreationPlatform = Object.entries(
    input.insightStats?.videoCreationsByPlatform ?? {},
  )
    .filter(([label, value]) => label !== "total_count" && value > 0)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  const shazamRow = input.socialTraction.find((item) => item.id === "shazam");
  const youtubeRow = input.socialTraction.find((item) => item.id === "youtube");
  const periodDays = input.socialTractionPeriodDays;
  const growth = input.audienceGrowth;

  return {
    airplay: input.airplay,
    streaming: {
      ...input.dsp,
      ...input.discoveryData,
      total_count: sumStreaming(input.dsp, input.discoveryData),
    },
    audience: input.audience,
    socialMedia: input.socialMedia,
    actions: input.actions,
    performance: input.performance,
    performanceReach: input.insightStats?.performanceReach ?? {},
    spinCount: input.spinCount,
    topRadio: input.stations[0]?.name,
    topRadioStations: input.stations
      .slice(0, 5)
      .map(({ name, country, plays }) => ({ name, country, plays })),
    audienceGrowth:
      growth?.available && growth.totalGrowth !== null
        ? {
            totalGrowth: growth.totalGrowth,
            topPlatform:
              growth.topPlatform?.toLowerCase() === "others"
                ? undefined
                : (growth.topPlatform ?? undefined),
          }
        : undefined,
    highlights: [
      ...(videoCreations > 0
        ? [
            {
              id: "videoCreations" as const,
              value: videoCreations,
              changePercent: null,
              periodDays,
              topPlatform: topCreationPlatform,
            },
          ]
        : []),
      ...(input.shazamValue !== null
        ? [
            {
              id: "shazam" as const,
              value: input.shazamValue,
              changePercent: shazamRow?.percentEvolution ?? null,
              periodDays,
              topMarket: shazamRow?.topMarket ?? undefined,
            },
          ]
        : []),
      ...(typeof youtubeRow?.value === "number"
        ? [
            {
              id: "youtube" as const,
              value: youtubeRow.value,
              changePercent: youtubeRow.percentEvolution,
              periodDays,
            },
          ]
        : []),
    ],
    topCreators: input.topCreators.map((creator) => ({
      handle: creator.handle || creator.name,
      platform: creator.platform,
      followers: creator.followers,
      views: creator.views,
      url: creator.url,
    })),
    playlists: input.playlists.map((playlist) => ({
      name: playlist.name,
      platform: playlist.platform,
      url: playlist.url,
      position: playlist.position,
      addedAt: playlist.addedAt,
    })),
  };
};
