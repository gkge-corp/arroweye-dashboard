import type { ChannelTrendPoint } from "./types";

type TrendChannel = "streaming" | "social" | "radio";

const CHANNELS: TrendChannel[] = ["streaming", "social", "radio"];

// Thirds of the window whose averages differ by less than this read as flat.
const STEADY_BAND = 0.15;

export interface ChannelSignal {
  channel: TrendChannel;
  activity: "none" | "sparse" | "intermittent" | "consistent";
  direction: "rising" | "falling" | "steady" | "unclear";
  peak: "early" | "middle" | "late" | "none";
}

const average = (values: number[]) =>
  values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;

const describeActivity = (values: number[]): ChannelSignal["activity"] => {
  const activeShare =
    values.filter((value) => value > 0).length / values.length;
  if (activeShare === 0) return "none";
  if (activeShare >= 0.7) return "consistent";
  return activeShare >= 0.3 ? "intermittent" : "sparse";
};

/** Compares the first and last third, so one busy day does not set the trend. */
const describeDirection = (values: number[]): ChannelSignal["direction"] => {
  if (values.length < 3) return "unclear";
  const third = Math.floor(values.length / 3);
  const first = average(values.slice(0, third));
  const last = average(values.slice(-third));
  if (first === 0) return last > 0 ? "rising" : "steady";

  const ratio = last / first;
  if (ratio > 1 + STEADY_BAND) return "rising";
  return ratio < 1 - STEADY_BAND ? "falling" : "steady";
};

const describePeak = (values: number[]): ChannelSignal["peak"] => {
  const peak = Math.max(...values);
  if (peak <= 0) return "none";
  if (values.length < 3) return "middle";

  const position = values.indexOf(peak) / (values.length - 1);
  if (position < 1 / 3) return "early";
  return position < 2 / 3 ? "middle" : "late";
};

/**
 * Qualitative labels only: the model never sees a count, so it has nothing
 * to quote back and the chart stays the single source of figures.
 */
export const deriveTrendSignals = (
  points: ChannelTrendPoint[],
): ChannelSignal[] =>
  CHANNELS.flatMap((channel) => {
    const values = points
      .map((point) => point[channel])
      .filter((value): value is number => value !== null);
    if (values.length === 0) return [];

    return [
      {
        channel,
        activity: describeActivity(values),
        direction: describeDirection(values),
        peak: describePeak(values),
      },
    ];
  });
