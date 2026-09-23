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

/**
 * SOCIAL MEDIA pie: follower growth per network over the campaign. A pie
 * cannot show losses, so only networks that grew get a slice.
 */
export const toSocialGrowthStats = (
  growth: CampaignAudienceGrowth | undefined,
) => {
  if (!growth?.available) return undefined;

  const gains = growth.platforms.filter((entry) => entry.growth > 0);
  const stats: Record<string, number> = Object.fromEntries(
    gains.map((entry) => [entry.platform, entry.growth]),
  );
  stats.total_count = gains.reduce((sum, entry) => sum + entry.growth, 0);
  return stats;
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
