"use client";

import { useQuery } from "@tanstack/react-query";

export type InsightStats = Record<string, number>;

export interface SongInsightStats {
  /** Views, likes, comments and shares added up per platform. */
  socialMedia?: InsightStats;
  /** Current views, likes, comments and shares on the song. */
  actions?: InsightStats;
  dsp?: InsightStats;
  /** Radio spins over the window; null when radio data could not be read. */
  radioSpins?: number | null;
  /** Spins keyed by country name, for the airplay markets picker. */
  airplayByCountry?: Record<string, number>;
  /** Every country with spins, including countries not selected. */
  availableAirplayCountries?: Record<string, number>;
  airplayCountryCodes?: Record<string, string>;
  /** Streaming platforms this song has data for, switched off ones included. */
  availableStreamingPlatforms?: { code: string; label: string }[];
  /** Current playlist placements per platform. */
  performance?: InsightStats;
  /** Follower reach of those placements, per platform, where reported. */
  performanceReach?: InsightStats;
}

interface InsightStatsResponse {
  stats?: SongInsightStats;
  periodDays?: number;
  radioWindow?: { startDate: string; endDate: string };
  error?: string;
}

interface InsightStatsOptions {
  radio: boolean;
  social: boolean;
  reachPlatforms: string[];
  countries?: string[] | null;
  /** Campaign window for ACTIONS; omitted before the campaign has dates. */
  startDate?: string;
  endDate?: string;
}

const fetchInsightStats = async (
  isrc: string,
  options: InsightStatsOptions,
): Promise<InsightStatsResponse> => {
  const query = new URLSearchParams({ isrc });
  if (!options.radio) query.set("radio", "0");
  if (!options.social) query.set("social", "0");
  query.set("reachPlatforms", options.reachPlatforms.join(","));
  if (options.countries) {
    query.set("countries", options.countries.join(","));
  }
  if (options.startDate) query.set("startDate", options.startDate);
  if (options.endDate) query.set("endDate", options.endDate);

  const response = await fetch(`/api/music-analytics/insight-stats?${query}`);
  const payload = (await response
    .json()
    .catch(() => ({}))) as InsightStatsResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load insight data.");
  }

  return payload;
};

export function useCampaignInsightStats(
  isrc?: string,
  options?: InsightStatsOptions & { ready?: boolean },
) {
  const radio = options?.radio ?? true;
  const social = options?.social ?? true;
  const reachPlatforms = options?.reachPlatforms ?? [];
  const countries = options?.countries ?? null;
  const startDate = options?.startDate;
  const endDate = options?.endDate;
  const nothingEnabled = !radio && !social && reachPlatforms.length === 0;

  const { data, isFetching, isError } = useQuery({
    queryKey: [
      "campaign-insight-stats",
      isrc,
      radio,
      social,
      reachPlatforms,
      countries,
      startDate,
      endDate,
    ],
    queryFn: () =>
      fetchInsightStats(isrc!, {
        radio,
        social,
        reachPlatforms,
        countries,
        startDate,
        endDate,
      }),
    // Waiting for the stored settings avoids fetching disabled sources once
    // on every page open.
    enabled: Boolean(isrc) && (options?.ready ?? true) && !nothingEnabled,
    staleTime: 5 * 60_000,
  });

  return {
    insightStats: data?.stats,
    insightStatsPeriodDays: data?.periodDays ?? 30,
    radioWindow: data?.radioWindow,
    isInsightStatsLoading: isFetching,
    hasInsightStatsError: isError,
  };
}
