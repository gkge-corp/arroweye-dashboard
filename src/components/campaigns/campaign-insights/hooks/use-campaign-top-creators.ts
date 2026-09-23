"use client";

import { useQuery } from "@tanstack/react-query";

import type { CreatorRow } from "../top-creators-list";

const fetchTopCreators = async (isrc: string): Promise<CreatorRow[]> => {
  const response = await fetch(
    `/api/music-analytics/top-creators?isrc=${encodeURIComponent(isrc)}`,
  );
  const payload = (await response.json().catch(() => ({}))) as {
    items?: CreatorRow[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load creators.");
  }

  return payload.items ?? [];
};

export function useCampaignTopCreators(
  isrc?: string,
  options?: { enabled?: boolean },
) {
  const { data, isLoading } = useQuery({
    queryKey: ["campaign-top-creators", isrc],
    queryFn: () => fetchTopCreators(isrc!),
    enabled: Boolean(isrc) && (options?.enabled ?? true),
    staleTime: 5 * 60_000,
  });

  return {
    topCreators: data ?? [],
    isTopCreatorsLoading: isLoading,
  };
}
