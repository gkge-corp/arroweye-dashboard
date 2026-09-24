"use client";

import { useQuery } from "@tanstack/react-query";

export interface CampaignAudienceGrowth {
  available: boolean;
  startDate: string;
  endDate: string;
  startTotal?: number;
  endTotal?: number;
  totalGrowth: number | null;
  changePercent: number | null;
  topPlatform: string | null;
  platforms: {
    platform: string;
    startValue: number;
    endValue: number;
    growth: number;
  }[];
}

export interface SocialMediaStats {
  /** Followers per network on the last day, plus their `total_count`. */
  stats: Record<string, number>;
  /** Tooltip line per network with its campaign growth. */
  notes: Record<string, string>;
}

const formatGrowth = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toLocaleString()} this campaign`;

/**
 * SOCIAL MEDIA pie: current followers per network, so the chart renders from
 * the first day; campaign growth shows in each slice's tooltip. A count
 * identical at both ends of the window is stale data, not zero growth, so it
 * gets no growth line.
 */
export const toSocialMediaStats = (
  growth: CampaignAudienceGrowth | undefined,
): SocialMediaStats | undefined => {
  if (!growth?.available) return undefined;

  const stats: Record<string, number> = {};
  const notes: Record<string, string> = {};

  for (const entry of growth.platforms) {
    if (entry.endValue <= 0) continue;
    stats[entry.platform] = entry.endValue;

    if (entry.startValue !== entry.endValue) {
      notes[entry.platform] = formatGrowth(entry.growth);
    }
  }

  stats.total_count = Object.values(stats).reduce((sum, v) => sum + v, 0);
  return { stats, notes };
};

const fetchAudienceGrowth = async (
  isrc: string,
  startDate: string,
  endDate?: string,
): Promise<CampaignAudienceGrowth> => {
  const query = new URLSearchParams({ startDate });
  query.set("isrc", isrc);
  if (endDate) query.set("endDate", endDate);

  const response = await fetch(`/api/music-analytics/audience-growth?${query}`);
  const payload = (await response.json().catch(() => ({}))) as
    | CampaignAudienceGrowth
    | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload
        ? (payload.error ?? "Could not load audience growth.")
        : "Could not load audience growth.",
    );
  }

  return payload as CampaignAudienceGrowth;
};

export function useCampaignAudienceGrowth(options: {
  isrc?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}) {
  const { isrc, startDate, endDate, enabled = true } = options;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["campaign-audience-growth", isrc, startDate, endDate],
    queryFn: () => fetchAudienceGrowth(isrc!, startDate!, endDate),
    enabled: Boolean(isrc && startDate) && enabled,
    staleTime: 5 * 60_000,
  });

  return {
    audienceGrowth: data,
    isAudienceGrowthLoading: isLoading,
    hasAudienceGrowthError: isError,
  };
}
