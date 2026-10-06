export type TrendRange = "campaign" | "30d" | "7d";

export const TREND_RANGES: TrendRange[] = ["campaign", "30d", "7d"];

const RANGE_DAYS: Record<Exclude<TrendRange, "campaign">, number> = {
  "30d": 30,
  "7d": 7,
};

export const isTrendRange = (value: unknown): value is TrendRange =>
  TREND_RANGES.includes(value as TrendRange);

/** Trailing window counted back from the last day in the series. */
export const filterTrendByRange = <T>(points: T[], range: TrendRange) => {
  if (range === "campaign" || points.length === 0) return points;
  return points.slice(-RANGE_DAYS[range]);
};
