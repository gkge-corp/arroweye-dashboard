"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

export type TrendChannel = "radio" | "social" | "streaming";

export interface ChannelTrendPoint {
  date: string;
  streaming: number | null;
  social: number | null;
  radio: number | null;
}

interface ChannelTrendResponse {
  points?: ChannelTrendPoint[];
  radioAvailable?: boolean;
  error?: string;
}

interface ChannelTrendOptions {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

const fetchChannelTrend = async (
  isrc: string,
  startDate: string,
  endDate?: string,
): Promise<ChannelTrendResponse> => {
  const query = new URLSearchParams({ isrc, startDate });
  if (endDate) query.set("endDate", endDate);
  const response = await fetch(`/api/music-analytics/channel-trend?${query}`);
  const payload = (await response
    .json()
    .catch(() => ({}))) as ChannelTrendResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load campaign trend.");
  }
  return payload;
};

export type TrendRange = "campaign" | "30d" | "7d";

const RANGE_DAYS: Record<Exclude<TrendRange, "campaign">, number> = {
  "30d": 30,
  "7d": 7,
};

/** Trailing window counted back from the last day in the series. */
export const filterTrendByRange = (
  points: ChannelTrendPoint[],
  range: TrendRange,
) => {
  if (range === "campaign" || points.length === 0) return points;
  return points.slice(-RANGE_DAYS[range]);
};

const CHANNELS: TrendChannel[] = ["streaming", "social", "radio"];

/** Days averaged per point; a 7-day view stays raw so single days show. */
export const SMOOTHING_DAYS: Record<TrendRange, number> = {
  campaign: 7,
  "30d": 7,
  "7d": 1,
};

/**
 * Trailing average over `days`, so bursty channels (radio spins land in
 * clumps) read as a trend instead of spikes. Missing days count as zero.
 */
export const smoothTrend = (
  points: ChannelTrendPoint[],
  days: number,
): ChannelTrendPoint[] => {
  if (days <= 1) return points;

  return points.map((point, index) => {
    const window = points.slice(Math.max(0, index - days + 1), index + 1);
    const smoothed = { ...point };
    for (const channel of CHANNELS) {
      if (point[channel] === null) continue;
      const sum = window.reduce((total, day) => total + (day[channel] ?? 0), 0);
      smoothed[channel] = Math.round(sum / window.length);
    }
    return smoothed;
  });
};

export type ScaledTrendPoint = { date: string } & Record<TrendChannel, number> &
  Record<`${TrendChannel}Raw`, number>;

/**
 * Streams run in the millions and radio in the dozens, so on one axis radio
 * flattens to the baseline. Each channel is drawn as a share of its own peak
 * in the window; the real count rides along for the tooltip.
 */
export const scaleTrendToPeak = (
  points: ChannelTrendPoint[],
  channels: TrendChannel[],
): ScaledTrendPoint[] => {
  const peaks = Object.fromEntries(
    channels.map((channel) => [
      channel,
      Math.max(0, ...points.map((point) => point[channel] ?? 0)),
    ]),
  ) as Record<TrendChannel, number>;

  return points.map((point) => {
    const scaled = { date: point.date } as ScaledTrendPoint;
    for (const channel of channels) {
      const value = point[channel] ?? 0;
      scaled[channel] = peaks[channel] > 0 ? (value / peaks[channel]) * 100 : 0;
      scaled[`${channel}Raw`] = value;
    }
    return scaled;
  });
};

export function useCampaignChannelTrend(
  isrc?: string,
  options: ChannelTrendOptions = {},
) {
  const { startDate, endDate, enabled = true } = options;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["campaign-channel-trend", isrc, startDate, endDate],
    queryFn: () => fetchChannelTrend(isrc!, startDate!, endDate),
    enabled: Boolean(isrc && startDate) && enabled,
    // Days only change once a day, so a long client cache costs nothing.
    staleTime: 30 * 60_000,
  });

  const points = useMemo(() => data?.points ?? [], [data?.points]);
  const hasTrendActivity = useMemo(
    () =>
      points.some(
        (point) =>
          (point.streaming ?? 0) > 0 ||
          (point.social ?? 0) > 0 ||
          (point.radio ?? 0) > 0,
      ),
    [points],
  );

  return {
    trendPoints: points,
    hasTrendActivity,
    radioAvailable: data?.radioAvailable ?? false,
    isTrendLoading: isLoading,
    hasTrendError: isError,
  };
}
