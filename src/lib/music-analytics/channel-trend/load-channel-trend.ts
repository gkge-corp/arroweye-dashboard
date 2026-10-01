import "server-only";

import { normalizeIsrc } from "../songstats-client";
import { readChannelTrend, writeChannelTrend } from "./channel-trend-store";
import { addDays, listDates, maxDate, minDate, todayKey } from "./dates";
import { fetchAudiomackByDay } from "./fetch-audiomack-by-day";
import { fetchRadioByDay } from "./fetch-radio-by-day";
import { fetchStreamSocialByDay } from "./fetch-stream-social-by-day";
import type {
  ChannelDay,
  ChannelTrendPoint,
  StoredChannelTrend,
} from "./types";

// Providers backfill late plays for a couple of days, so the most recent days
// are refetched once a day until they are this old.
const SETTLE_DAYS = 3;

const EMPTY_DAY: ChannelDay = { streaming: null, social: null, radio: null };

export interface ChannelTrend {
  points: ChannelTrendPoint[];
  radioAvailable: boolean;
}

const readStored = async (isrc: string) => {
  try {
    return await readChannelTrend(isrc);
  } catch (error) {
    // A broken copy is rebuilt from the providers on this load.
    console.error(`Stored channel trend for ${isrc} could not be read:`, error);
    return null;
  }
};

/** Where provider data is needed, given what is already stored. */
const planFetch = (
  stored: StoredChannelTrend | null,
  start: string,
  today: string,
) => {
  const extendsStored =
    stored && stored.from <= start && stored.to >= addDays(start, -1);
  if (!extendsStored) return { fetchFrom: start, covered: null };

  const nextDay = addDays(stored.to, 1);
  const fetchFrom =
    stored.fetchedOn < today
      ? maxDate(start, minDate(nextDay, addDays(today, -SETTLE_DAYS)))
      : nextDay;
  return { fetchFrom, covered: { from: stored.from, to: stored.to } };
};

/** Fresh values win; a channel that came back empty keeps its stored value. */
const mergeDays = (
  stored: Record<string, ChannelDay>,
  fresh: Record<string, ChannelDay>,
) => {
  const merged = { ...stored };
  for (const [date, day] of Object.entries(fresh)) {
    const previous = stored[date] ?? EMPTY_DAY;
    merged[date] = {
      streaming: day.streaming ?? previous.streaming,
      social: day.social ?? previous.social,
      radio: day.radio ?? previous.radio,
    };
  }
  return merged;
};

/**
 * Pulls [from, to] from both providers. Either half failing still returns the
 * other, but only a complete result is safe to store.
 */
const fetchDays = async (isrc: string, from: string, to: string) => {
  const [statsResult, radioResult, audiomackResult] = await Promise.allSettled([
    fetchStreamSocialByDay(isrc, from, to),
    fetchRadioByDay(isrc, from, to),
    fetchAudiomackByDay(isrc, from, to),
  ]);
  if (statsResult.status === "rejected") {
    console.error("Streaming and social history failed:", statsResult.reason);
  }
  if (radioResult.status === "rejected") {
    console.error("Radio spin history failed:", radioResult.reason);
  }
  if (audiomackResult.status === "rejected") {
    console.error("Audiomack play history failed:", audiomackResult.reason);
  }
  if (statsResult.status === "rejected" && radioResult.status === "rejected") {
    throw statsResult.reason;
  }

  const stats = statsResult.status === "fulfilled" ? statsResult.value : null;
  const radio = radioResult.status === "fulfilled" ? radioResult.value : null;
  const audiomack =
    audiomackResult.status === "fulfilled" ? audiomackResult.value : null;
  const radioThrough = radio?.through ?? to;
  const hasStreaming = Boolean(stats?.streaming || audiomack);

  const days: Record<string, ChannelDay> = {};
  for (const date of listDates(from, to)) {
    days[date] = {
      streaming: hasStreaming
        ? (stats?.streaming?.get(date) ?? 0) + (audiomack?.get(date) ?? 0)
        : null,
      social: stats?.social ? (stats.social.get(date) ?? 0) : null,
      radio:
        radio && date <= radioThrough ? (radio.spins.get(date) ?? 0) : null,
    };
  }

  return {
    days,
    complete:
      statsResult.status === "fulfilled" &&
      radioResult.status === "fulfilled" &&
      audiomackResult.status === "fulfilled",
    completeThrough: minDate(to, radioThrough),
  };
};

const toPoints = (
  days: Record<string, ChannelDay>,
  start: string,
  end: string,
): ChannelTrend => {
  const points = listDates(start, end).map((date) => ({
    date,
    ...(days[date] ?? EMPTY_DAY),
  }));
  return {
    points,
    radioAvailable: points.some((point) => point.radio !== null),
  };
};

const loadUncached = async (
  isrc: string,
  start: string,
  end: string,
): Promise<ChannelTrend> => {
  const today = todayKey();
  const stored = await readStored(isrc);
  const { fetchFrom, covered } = planFetch(stored, start, today);

  if (fetchFrom > end) return toPoints(stored?.points ?? {}, start, end);

  let fetched: Awaited<ReturnType<typeof fetchDays>>;
  try {
    fetched = await fetchDays(isrc, fetchFrom, end);
  } catch (error) {
    // Stored days still chart when both providers are down.
    if (!stored) throw error;
    console.error(`Channel trend refresh for ${isrc} failed:`, error);
    return toPoints(stored.points, start, end);
  }

  const days = mergeDays(stored?.points ?? {}, fetched.days);
  if (fetched.complete) {
    try {
      await writeChannelTrend(isrc, {
        version: 2,
        from: covered?.from ?? start,
        to: covered
          ? maxDate(covered.to, fetched.completeThrough)
          : fetched.completeThrough,
        fetchedOn: today,
        points: days,
      });
    } catch (error) {
      console.error(`Channel trend for ${isrc} could not be stored:`, error);
    }
  }

  return toPoints(days, start, end);
};

// Concurrent viewers of one song share a single backfill.
const inFlight = new Map<string, Promise<ChannelTrend>>();

/**
 * Daily streaming, social and radio activity over [start, end]. Finished days
 * are stored per song, so after the first load only new days are fetched.
 */
export const loadChannelTrend = (
  rawIsrc: string,
  start: string,
  end: string,
) => {
  const isrc = normalizeIsrc(rawIsrc);
  const key = `${isrc}|${start}|${end}`;
  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = loadUncached(isrc, start, end).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, request);
  return request;
};
