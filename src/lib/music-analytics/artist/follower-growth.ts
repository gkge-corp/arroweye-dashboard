export type FollowerRange = 7 | 14 | 30;

export const FOLLOWER_RANGES: FollowerRange[] = [7, 14, 30];

export const DEFAULT_FOLLOWER_RANGE: FollowerRange = 30;

export type FollowerPoint = { date: string } & Record<string, number | string>;

export interface FollowerHistory {
  days: FollowerRange;
  platforms: { code: string; label: string }[];
  points: FollowerPoint[];
}

export interface PlatformGrowth {
  code: string;
  label: string;
  start: number;
  end: number;
  gained: number;
  /** Null when the period starts from zero, where a percentage is meaningless. */
  percent: number | null;
}

export const isFollowerRange = (value: number): value is FollowerRange =>
  FOLLOWER_RANGES.includes(value as FollowerRange);

/** Followers gained per platform between its first and last point in range. */
export const summarizeFollowerGrowth = ({
  platforms,
  points,
}: Pick<FollowerHistory, "platforms" | "points">): PlatformGrowth[] =>
  platforms.flatMap((platform) => {
    const values = points
      .map((point) => point[platform.code])
      .filter((value): value is number => typeof value === "number");
    if (values.length < 2) return [];

    const start = values[0];
    const end = values[values.length - 1];
    const gained = end - start;
    return [
      {
        ...platform,
        start,
        end,
        gained,
        percent: start > 0 ? (gained / start) * 100 : null,
      },
    ];
  });
