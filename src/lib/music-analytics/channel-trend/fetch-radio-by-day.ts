import "server-only";

import { withRetry } from "../fan-out";
import { SoundchartsError, soundchartsRequest } from "../soundcharts-client";
import { RADIO_PAGE_SIZE, resolveSongUuid } from "../soundcharts-radio";
import { addDays } from "./dates";

// Each page is a billed call; 50 pages covers 5,000 spins per fetch.
const MAX_PAGES = 50;

interface Broadcast {
  airedAt?: string;
}

const fetchPage = (uuid: string, from: string, to: string, offset: number) => {
  const query = new URLSearchParams({
    startDate: `${from}T00:00:00Z`,
    endDate: `${to}T23:59:59Z`,
    sort: "asc",
    offset: String(offset),
    limit: String(RADIO_PAGE_SIZE),
  });
  return withRetry(() =>
    soundchartsRequest<{ items?: Broadcast[] }>(
      `/api/v2/song/${uuid}/broadcasts?${query}`,
    ),
  );
};

export interface RadioDays {
  spins: Map<string, number>;
  /** Last day fully counted; earlier than `to` when the page cap was hit. */
  through: string;
}

/**
 * Spins per UTC day in [from, to], counted from each spin's airtime. Returns
 * null when the plan has no access to spin logs, so the chart hides radio
 * instead of failing.
 */
export const fetchRadioByDay = async (
  isrc: string,
  from: string,
  to: string,
): Promise<RadioDays | null> => {
  const uuid = await resolveSongUuid(isrc);
  const spins = new Map<string, number>();
  let lastDate = from;

  try {
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const { items = [] } = await fetchPage(
        uuid,
        from,
        to,
        page * RADIO_PAGE_SIZE,
      );
      for (const { airedAt } of items) {
        const date = airedAt?.slice(0, 10);
        if (!date) continue;
        spins.set(date, (spins.get(date) ?? 0) + 1);
        lastDate = date;
      }
      if (items.length < RADIO_PAGE_SIZE) return { spins, through: to };
    }
  } catch (error) {
    if (error instanceof SoundchartsError && error.status === 403) {
      console.error("Radio spin log is not available:", error);
      return null;
    }
    throw error;
  }

  // Spins come oldest first, so every day before the last one seen is whole.
  // The partial day is dropped and the next load resumes from it, unless it
  // is the first day, which would never advance; that day stays undercounted.
  const through = lastDate > from ? addDays(lastDate, -1) : from;
  if (lastDate > from) spins.delete(lastDate);
  console.error(
    `Radio spins for ${isrc} passed ${MAX_PAGES * RADIO_PAGE_SIZE} from ${from}; counted through ${through}.`,
  );
  return { spins, through };
};
