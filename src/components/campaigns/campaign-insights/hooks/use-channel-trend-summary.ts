"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import type { TrendRange } from "@/lib/music-analytics/channel-trend/trend-range";

interface TrendSummaryResponse {
  summary?: string | null;
  error?: string;
}

const fetchTrendSummary = async (
  campaignId: string,
  range: TrendRange,
): Promise<string | null> => {
  const query = new URLSearchParams({ campaignId, range });
  const response = await fetch(
    `/api/music-analytics/channel-trend-summary?${query}`,
  );
  const payload = (await response
    .json()
    .catch(() => ({}))) as TrendSummaryResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load the trend summary.");
  }
  return payload.summary ?? null;
};

export function useChannelTrendSummary(
  campaignId: string | number | undefined,
  range: TrendRange,
  enabled = true,
) {
  const id = campaignId === undefined ? "" : String(campaignId);
  const { data, isLoading, error } = useQuery({
    queryKey: ["campaign-channel-trend-summary", id, range],
    queryFn: () => fetchTrendSummary(id, range),
    enabled: Boolean(id) && enabled,
    // The server only rewrites it when the trend changes shape.
    staleTime: 30 * 60_000,
    retry: false,
  });

  // The card hides the summary on failure, so the reason is only logged.
  useEffect(() => {
    if (error) console.error("Campaign trend summary failed:", error);
  }, [error]);

  return {
    trendSummary: data ?? null,
    isTrendSummaryLoading: isLoading,
  };
}
