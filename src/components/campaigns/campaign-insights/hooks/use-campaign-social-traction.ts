"use client";

import { useQuery } from "@tanstack/react-query";

export interface SocialTractionRow {
  id: string;
  platform: string;
  metric: string;
  value: number | null;
  evolution: number | null;
  percentEvolution: number | null;
  updatedAt: string | null;
  topMarket?: string | null;
}

interface SocialTractionResponse {
  items?: SocialTractionRow[];
  periodDays?: number;
  error?: string;
}

const fetchSocialTraction = async (
  isrc: string,
): Promise<SocialTractionResponse> => {
  const response = await fetch(
    `/api/music-analytics/social-traction?isrc=${encodeURIComponent(isrc)}`,
  );
  const payload = (await response
    .json()
    .catch(() => ({}))) as SocialTractionResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load social data.");
  }

  return payload;
};

export function useCampaignSocialTraction(
  isrc?: string,
  options?: { enabled?: boolean },
) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["campaign-social-traction", isrc],
    queryFn: () => fetchSocialTraction(isrc!),
    enabled: Boolean(isrc) && (options?.enabled ?? true),
    staleTime: 5 * 60_000,
  });

  return {
    socialTraction: data?.items ?? [],
    socialTractionPeriodDays: data?.periodDays ?? 30,
    isSocialTractionLoading: isLoading,
    hasSocialTractionError: isError,
    retrySocialTraction: () => void refetch(),
  };
}
