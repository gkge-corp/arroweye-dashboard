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

const fetchAudienceGrowth = async (
  uuid: string | undefined,
  isrc: string | undefined,
  startDate: string,
  endDate?: string,
): Promise<CampaignAudienceGrowth> => {
  const query = new URLSearchParams({ startDate });
  if (uuid) query.set("uuid", uuid);
  if (isrc) query.set("isrc", isrc);
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
  uuid?: string;
  isrc?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}) {
  const { uuid, isrc, startDate, endDate, enabled = true } = options;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["campaign-audience-growth", uuid, isrc, startDate, endDate],
    queryFn: () => fetchAudienceGrowth(uuid, isrc, startDate!, endDate),
    enabled: Boolean((uuid || isrc) && startDate) && enabled,
    staleTime: 5 * 60_000,
  });

  return {
    audienceGrowth: data,
    isAudienceGrowthLoading: isLoading,
    hasAudienceGrowthError: isError,
  };
}
