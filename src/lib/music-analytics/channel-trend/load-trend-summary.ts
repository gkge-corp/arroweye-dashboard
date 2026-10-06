import "server-only";

import { addDays, todayKey } from "./dates";
import { generateTrendSummary } from "./generate-trend-summary";
import { loadChannelTrend } from "./load-channel-trend";
import { filterTrendByRange, type TrendRange } from "./trend-range";
import { deriveTrendSignals } from "./trend-signals";
import { readTrendSummary, writeTrendSummary } from "./trend-summary-store";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? (value as UnknownRecord) : {};

// Mirrors the campaign page, so the summary describes the same window.
const toDateOnly = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const datePrefix = value.trim().match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (datePrefix) return datePrefix;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toISOString().slice(0, 10);
};

const resolveTrendWindow = (project: UnknownRecord) => {
  const campaign = asRecord(project.campaign);
  const isrc = String(project.isrc || project.song_isrc || "")
    .trim()
    .toUpperCase();
  const startDate = toDateOnly(
    project.start_dte ??
      project.start_date ??
      campaign.start_date ??
      project.created,
  );
  const requestedEnd = toDateOnly(
    project.end_dte ?? project.end_date ?? campaign.end_date,
  );

  // Today is still filling in, so the series stops at yesterday.
  const yesterday = addDays(todayKey(), -1);
  const endDate =
    !requestedEnd || requestedEnd > yesterday ? yesterday : requestedEnd;

  if (!isrc || !startDate || startDate > endDate) return undefined;
  return { isrc, startDate, endDate };
};

const readCached = async (campaignId: string, range: TrendRange) => {
  try {
    return await readTrendSummary(campaignId, range);
  } catch (error) {
    // A broken copy is rewritten on this load.
    console.error(
      `Stored trend summary for ${campaignId} could not be read:`,
      error,
    );
    return null;
  }
};

/**
 * Regenerates only when the qualitative picture changes, not on every new
 * day of data, so most page loads are a single storage read.
 */
export const loadTrendSummary = async (
  campaignId: string,
  project: UnknownRecord,
  range: TrendRange,
) => {
  const window = resolveTrendWindow(project);
  if (!window) return null;

  const { points } = await loadChannelTrend(
    window.isrc,
    window.startDate,
    window.endDate,
  );
  const signals = deriveTrendSignals(filterTrendByRange(points, range));
  if (signals.every(({ activity }) => activity === "none")) return null;

  const signature = JSON.stringify({ isrc: window.isrc, range, signals });
  const cached = await readCached(campaignId, range);
  if (cached?.signature === signature) return cached.summary;

  const summary = await generateTrendSummary(signals, range);
  if (!summary) return null;

  await writeTrendSummary(campaignId, range, {
    version: 1,
    signature,
    summary,
  }).catch((error: unknown) => {
    console.error(
      `Trend summary for ${campaignId} could not be stored:`,
      error,
    );
  });
  return summary;
};
