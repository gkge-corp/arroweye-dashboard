import "server-only";

import { fetchAudiomackPlays } from "../soundcharts-audiomack";
import { addDays } from "./dates";
import { toDailyGains } from "./fetch-stream-social-by-day";

/** Daily Audiomack play gains in [from, to]; null when it has no plays. */
export const fetchAudiomackByDay = async (
  isrc: string,
  from: string,
  to: string,
) => {
  // One extra day before `from` gives the first day a baseline.
  const points = await fetchAudiomackPlays(isrc, addDays(from, -1), to);
  return points.length > 0 ? toDailyGains(points, "plays", from) : null;
};
