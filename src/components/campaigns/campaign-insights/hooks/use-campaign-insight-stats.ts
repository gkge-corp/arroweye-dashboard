"use client";

import { useQuery } from "@tanstack/react-query";

export type InsightStats = Record<string, number>;

export interface SoundchartsInsightStats {
  /** Song activity per platform. Never artist follower counts. */
  socialMedia?: InsightStats;
  /** The same activity regrouped by kind, so it totals to socialMedia. */
  actions?: InsightStats;
  dsp?: InsightStats;
  /** Radio spins over the window; null when Soundcharts could not be read. */
  radioSpins?: number | null;
  /** Spins keyed by country name, for the airplay markets picker. */
  airplayByCountry?: Record<string, number>;
  /** Every country returned by Soundcharts, including countries not selected. */
  availableAirplayCountries?: Record<string, number>;
  airplayCountryCodes?: Record<string, string>;
  /** Streaming platforms this song has data for, switched off ones included. */
  availableStreamingPlatforms?: { code: string; label: string }[];
  /** Playlist reach split by how the placement was curated. */
  performance?: InsightStats;
}

interface InsightStatsResponse {
  stats?: SoundchartsInsightStats;
  periodDays?: number;
  radioWindowDays?: number;
  platformsWithoutReach?: string[];
  error?: string;
}

interface InsightStatsOptions {
  radio: boolean;
  social: boolean;
  reachPlatforms: string[];
  countries?: string[] | null;
}

const fetchInsightStats = async (
  uuid: string,
  options: InsightStatsOptions,
): Promise<InsightStatsResponse> => {
  const query = new URLSearchParams({ uuid });
  if (!options.radio) query.set("radio", "0");
  if (!options.social) query.set("social", "0");
  query.set("reachPlatforms", options.reachPlatforms.join(","));
  if (options.countries) {
    query.set("countries", options.countries.join(","));
  }

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
  uuid?: string,
  options?: InsightStatsOptions & { ready?: boolean },
) {
  const radio = options?.radio ?? true;
  const social = options?.social ?? true;
  const reachPlatforms = options?.reachPlatforms ?? [];
  const countries = options?.countries ?? null;
  const nothingEnabled = !radio && !social && reachPlatforms.length === 0;

  const { data, isFetching, isError } = useQuery({
    queryKey: [
      "campaign-insight-stats",
      uuid,
      radio,
      social,
      reachPlatforms,
      countries,
    ],
    queryFn: () =>
      fetchInsightStats(uuid!, {
        radio,
        social,
        reachPlatforms,
        countries,
      }),
    // Waiting for the stored settings avoids fetching disabled sources once
    // on every page open.
    enabled: Boolean(uuid) && (options?.ready ?? true) && !nothingEnabled,
    staleTime: 5 * 60_000,
  });

  return {
    insightStats: data?.stats,
    insightStatsPeriodDays: data?.periodDays ?? 30,
    radioWindowDays: data?.radioWindowDays ?? 90,
    platformsWithoutReach: data?.platformsWithoutReach ?? [],
    isInsightStatsLoading: isFetching,
    hasInsightStatsError: isError,
  };
}
