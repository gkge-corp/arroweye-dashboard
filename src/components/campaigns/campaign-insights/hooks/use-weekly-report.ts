"use client";

import { useMemo } from "react";

import { fetchAudienceGrowth } from "@/hooks/use-campaign-audience-growth";
import {
  addDays,
  maxDate,
  todayKey,
} from "@/lib/music-analytics/channel-trend/dates";
import type {
  CampaignReportAudienceGrowth,
  CampaignReportHighlight,
  CampaignReportRadioStation,
  CampaignReportWeekly,
} from "@/types/campaign-report";

import type { ChannelTrendPoint } from "./use-campaign-channel-trend";
import { fetchTopRadio } from "./use-campaign-radio";
import {
  fetchSocialTraction,
  type SocialTractionRow,
} from "./use-campaign-social-traction";

const WEEK_DAYS = 7;

const sumLastWeek = (
  points: ChannelTrendPoint[],
  channel: keyof Omit<ChannelTrendPoint, "date">,
) =>
  points
    .slice(-WEEK_DAYS)
    .reduce((total, point) => total + (point[channel] ?? 0), 0);

const toWeeklyHighlights = (
  rows: SocialTractionRow[],
): CampaignReportHighlight[] => {
  const findRow = (id: string) => rows.find((row) => row.id === id);
  const shazam = findRow("shazam");
  const youtube = findRow("youtube");
  // Same platforms the Video creations figure counts: videos made with the song.
  const creations = [findRow("tiktok"), findRow("instagram")].filter(
    (row): row is SocialTractionRow => typeof row?.evolution === "number",
  );
  const creationsGained = creations.reduce(
    (total, row) => total + (row.evolution ?? 0),
    0,
  );
  const topCreationPlatform = [...creations].sort(
    (a, b) => (b.evolution ?? 0) - (a.evolution ?? 0),
  )[0]?.platform;

  const highlights: CampaignReportHighlight[] = [];
  if (creationsGained > 0) {
    highlights.push({
      id: "videoCreations",
      value: creationsGained,
      changePercent: null,
      periodDays: WEEK_DAYS,
      topPlatform: topCreationPlatform,
    });
  }
  if (typeof shazam?.evolution === "number") {
    highlights.push({
      id: "shazam",
      value: shazam.evolution,
      changePercent: shazam.percentEvolution,
      periodDays: WEEK_DAYS,
      topMarket: shazam.topMarket ?? undefined,
    });
  }
  if (typeof youtube?.evolution === "number") {
    highlights.push({
      id: "youtube",
      value: youtube.evolution,
      changePercent: youtube.percentEvolution,
      periodDays: WEEK_DAYS,
    });
  }
  return highlights;
};

interface WeeklyReportOptions {
  isrc?: string;
  trendPoints: ChannelTrendPoint[];
  campaignStartDate?: string;
  /** The airplay markets picked on the page; null means every market. */
  countries: string[] | null;
  airplayDisabled: boolean;
}

/** The 7-day figures the campaign report email shows. */
export function useWeeklyReport({
  isrc,
  trendPoints,
  campaignStartDate,
  countries,
  airplayDisabled,
}: WeeklyReportOptions) {
  // The page already holds daily streaming and social gains, so these cost no
  // extra calls.
  const trendWeek = useMemo(
    () => ({
      streaming: sumLastWeek(trendPoints, "streaming"),
      social: sumLastWeek(trendPoints, "social"),
    }),
    [trendPoints],
  );

  // Fetched only when a report is sent; the routes cache provider responses.
  const loadWeeklyFigures = async (): Promise<{
    weekly: CampaignReportWeekly;
    topRadio?: string;
    topRadioStations: CampaignReportRadioStation[];
    audienceGrowth?: CampaignReportAudienceGrowth;
    highlights: CampaignReportHighlight[];
  }> => {
    if (!isrc) {
      return {
        weekly: { ...trendWeek, airplay: 0 },
        topRadioStations: [],
        highlights: [],
      };
    }

    // Ends on the trend's last day so every 7-day figure covers the same week.
    const endDate = trendPoints.at(-1)?.date ?? todayKey();
    const clampToCampaign = (date: string) =>
      campaignStartDate ? maxDate(date, campaignStartDate) : date;
    // Growth compares two totals a week apart; spins count every day inside it.
    const growthStart = clampToCampaign(addDays(endDate, -WEEK_DAYS));
    const radioStart = clampToCampaign(addDays(endDate, -(WEEK_DAYS - 1)));

    // Same source and market filter as the page's AIRPLAY card, so the
    // per-spin trend log (capped and slower to settle) is not used here.
    const [radioResult, audienceResult, tractionResult] =
      await Promise.allSettled([
        airplayDisabled
          ? Promise.resolve({ items: [], nextOffset: null })
          : fetchTopRadio(isrc, 0, countries, {
              startDate: radioStart,
              endDate,
            }),
        fetchAudienceGrowth(isrc, growthStart, endDate),
        fetchSocialTraction(isrc, WEEK_DAYS),
      ]);

    if (radioResult.status === "rejected") {
      console.error("Weekly airplay failed:", radioResult.reason);
    }
    if (audienceResult.status === "rejected") {
      console.error("Weekly audience growth failed:", audienceResult.reason);
    }
    if (tractionResult.status === "rejected") {
      console.error("Weekly social traction failed:", tractionResult.reason);
    }

    const stations =
      radioResult.status === "fulfilled" ? radioResult.value.items : [];
    const audience =
      audienceResult.status === "fulfilled" ? audienceResult.value : undefined;
    return {
      weekly: {
        ...trendWeek,
        airplay: stations.reduce((total, station) => total + station.plays, 0),
      },
      topRadio: stations[0]?.name,
      topRadioStations: stations
        .slice(0, 5)
        .map(({ name, country, plays }) => ({ name, country, plays })),
      audienceGrowth:
        audience?.available && audience.totalGrowth !== null
          ? {
              totalGrowth: audience.totalGrowth,
              topPlatform: audience.topPlatform ?? undefined,
            }
          : undefined,
      highlights:
        tractionResult.status === "fulfilled"
          ? toWeeklyHighlights(tractionResult.value.items ?? [])
          : [],
    };
  };

  return { loadWeeklyFigures };
}
