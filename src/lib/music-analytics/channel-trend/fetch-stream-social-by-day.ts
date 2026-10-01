import "server-only";

import { withRetry } from "../fan-out";
import { normalizeIsrc, songstatsRequest } from "../songstats-client";
import { addDays } from "./dates";

type HistoryPoint = Record<string, unknown> & { date?: string };

type Channel = "streaming" | "social";

// Same headline counts the STREAMING and SOCIAL MEDIA cards read, as daily
// running totals. TikTok and Instagram views cover videos using the song.
const CHANNEL_FIELDS: { source: string; field: string; channel: Channel }[] = [
  { source: "spotify", field: "streams_total", channel: "streaming" },
  { source: "youtube", field: "video_views_total", channel: "streaming" },
  { source: "soundcloud", field: "streams_total", channel: "streaming" },
  { source: "tiktok", field: "views_total", channel: "social" },
  { source: "instagram", field: "views_total", channel: "social" },
];

const SOURCES = [...new Set(CHANNEL_FIELDS.map((entry) => entry.source))];

const readTotal = (point: HistoryPoint, field: string) => {
  const raw = point[field];
  if (raw === null || raw === undefined) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

/**
 * Running totals turned into per-day gains. A missing day folds its gain into
 * the next reported day; drops from provider corrections count as zero.
 */
const toDailyGains = (history: HistoryPoint[], field: string, from: string) => {
  const points = history
    .map((point) => ({ date: point.date, value: readTotal(point, field) }))
    .filter(
      (point): point is { date: string; value: number } =>
        typeof point.date === "string" && point.value !== null,
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const gains = new Map<string, number>();
  for (let index = 1; index < points.length; index += 1) {
    const { date, value } = points[index];
    if (date < from) continue;
    gains.set(date, Math.max(0, value - points[index - 1].value));
  }
  return gains;
};

/** Daily streaming and social gains for every day in [from, to]. */
export const fetchStreamSocialByDay = async (
  isrc: string,
  from: string,
  to: string,
) => {
  // One extra day before `from` gives the first day a baseline.
  const payload = await withRetry(() =>
    songstatsRequest<{
      stats?: { source?: string; data?: { history?: HistoryPoint[] } }[];
    }>("/tracks/historic_stats", {
      isrc: normalizeIsrc(isrc),
      source: SOURCES,
      start_date: addDays(from, -1),
      end_date: to,
    }),
  );
  const histories = new Map(
    (payload.stats ?? []).map((entry) => [
      entry.source,
      entry.data?.history ?? [],
    ]),
  );

  const byChannel: Record<Channel, Map<string, number> | null> = {
    streaming: null,
    social: null,
  };
  for (const { source, field, channel } of CHANNEL_FIELDS) {
    const history = histories.get(source);
    if (!history?.length) continue;

    const totals = (byChannel[channel] ??= new Map());
    for (const [date, gain] of toDailyGains(history, field, from)) {
      totals.set(date, (totals.get(date) ?? 0) + gain);
    }
  }
  return byChannel;
};
