import "server-only";

import { addDays, todayKey } from "./channel-trend/dates";
import { withRetry } from "./fan-out";
import { SoundchartsError, soundchartsRequest } from "./soundcharts-client";
import { resolveSongUuid } from "./soundcharts-radio";

// Soundcharts caps limit at 100 and bills per page.
const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const LATEST_LOOKBACK_DAYS = 30;

interface AudiencePoint {
  date?: string;
  plots?: { value?: number }[];
}

export type AudiomackPlaysPoint = { date: string; plays: number };

const sumPlots = (plots: AudiencePoint["plots"] = []) =>
  plots.reduce((sum, plot) => {
    const value = Number(plot.value);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

/**
 * Audiomack's running play total for each reported day in [from, to], oldest
 * first. Soundcharts skips some days. A song Soundcharts does not know, or
 * has no Audiomack data for, returns no points rather than an error.
 */
export const fetchAudiomackPlays = async (
  isrc: string,
  from: string,
  to: string,
): Promise<AudiomackPlaysPoint[]> => {
  const points: AudiomackPlaysPoint[] = [];

  try {
    const uuid = await resolveSongUuid(isrc);
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const query = new URLSearchParams({
        startDate: from,
        endDate: to,
        offset: String(page * PAGE_SIZE),
        limit: String(PAGE_SIZE),
      });
      const { items = [] } = await withRetry(() =>
        soundchartsRequest<{ items?: AudiencePoint[] }>(
          `/api/v2/song/${uuid}/audience/audiomack?${query}`,
        ),
      );

      for (const item of items) {
        const date = item.date?.slice(0, 10);
        const plays = sumPlots(item.plots);
        if (date && plays > 0) points.push({ date, plays });
      }
      if (items.length < PAGE_SIZE) break;
    }
  } catch (error) {
    if (error instanceof SoundchartsError && error.status === 404) return [];
    throw error;
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
};

/** All-time Audiomack plays from the newest point; null when none is recent. */
export const fetchAudiomackTotal = async (isrc: string) => {
  const today = todayKey();
  const points = await fetchAudiomackPlays(
    isrc,
    addDays(today, -LATEST_LOOKBACK_DAYS),
    today,
  );
  return points.at(-1)?.plays ?? null;
};
