"use client";

import { useMemo } from "react";
import { useCampaignChannelTrend } from "@/components/campaigns/campaign-insights/hooks/use-campaign-channel-trend";
import { estimateStreamingRevenue } from "@/lib/streaming-payout";

interface CampaignStreamingRevenueOptions {
  isrc?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

/**
 * Streams gained during the campaign window, priced at the low and high
 * per-stream payout. Shares its query with the channel trend card.
 */
export function useCampaignStreamingRevenue({
  isrc,
  startDate,
  endDate,
  enabled = true,
}: CampaignStreamingRevenueOptions) {
  const { trendPoints, isTrendLoading, hasTrendError } =
    useCampaignChannelTrend(isrc, { startDate, endDate, enabled });

  const canLoad = enabled && Boolean(isrc && startDate);

  const campaignStreams = useMemo(() => {
    if (!canLoad || isTrendLoading || hasTrendError) return null;
    // No finished day in the window yet: the campaign starts today or later.
    if (trendPoints.length === 0) return 0;
    const days = trendPoints.filter((point) => point.streaming !== null);
    if (days.length === 0) return null;
    return days.reduce((sum, point) => sum + (point.streaming ?? 0), 0);
  }, [canLoad, isTrendLoading, hasTrendError, trendPoints]);

  const streamingRevenue = useMemo(
    () =>
      campaignStreams === null
        ? null
        : estimateStreamingRevenue(campaignStreams),
    [campaignStreams],
  );

  return {
    campaignStreams,
    streamingRevenue,
    isStreamingRevenueLoading: isTrendLoading,
    hasStreamingRevenueError: hasTrendError,
  };
}
