import type { CampaignReportStats } from "@/types/campaign-report";

import type { UnknownRecord } from "./types";

export const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};

export const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

export const firstPopulatedArray = (...values: unknown[]) =>
  values.find(
    (value): value is unknown[] => Array.isArray(value) && value.length > 0,
  ) ?? [];

export const asString = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

export const asNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

export const escapeHtml = (value: unknown) =>
  asString(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const safeUrl = (value: unknown) => {
  const url = asString(value).trim();
  if (!url) return "";

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? escapeHtml(parsed.toString())
      : "";
  } catch {
    return "";
  }
};

export const formatNumber = (value: unknown) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(asNumber(value));

export const formatDate = (
  value: unknown,
  fallback = "",
  month: "short" | "long" = "short",
) => {
  const date = value instanceof Date ? value : new Date(asString(value));
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en", {
    month,
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

export const formatDateTime = (value: unknown, fallback = "") => {
  const date = value instanceof Date ? value : new Date(asString(value));
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
};

const statEntries = (stats: CampaignReportStats) =>
  Object.entries(stats)
    .filter(([key, value]) => key !== "total_count" && asNumber(value) > 0)
    .sort((a, b) => asNumber(b[1]) - asNumber(a[1]));

export const total = (stats: CampaignReportStats) => {
  if (Number.isFinite(Number(stats.total_count))) {
    return asNumber(stats.total_count);
  }

  return statEntries(stats).reduce(
    (sum, [, value]) => sum + asNumber(value),
    0,
  );
};

export const topEntry = (stats: CampaignReportStats) => statEntries(stats)[0];

export const hasStats = (stats: CampaignReportStats) =>
  total(stats) > 0 || Object.keys(stats).some((key) => key !== "total_count");

export const detailRow = (label: string, value: unknown) => {
  const text = asString(value).trim();
  if (!text) return "";

  return `<tr><td style="padding:5px 0;color:#666;font-weight:700;width:140px;">${escapeHtml(label)}</td><td style="padding:5px 0;color:#666;">${escapeHtml(text)}</td></tr>`;
};

export const sectionHeading = (icon: string, title: string, iconSize = 35) =>
  `<div style="font-size:18px;font-weight:900;color:#222;line-height:${iconSize}px;"><img style="width:${iconSize}px;height:${iconSize}px;object-fit:contain;vertical-align:middle;" src="${icon}" alt=""> ${escapeHtml(title)}</div>`;

export const viewAll = (projectLink: string) =>
  `<div style="text-align:right;margin-top:20px;"><a href="${projectLink}" style="display:inline-block;font-size:14px;font-weight:700;color:#147aff;border:1px solid #147aff;padding:8px 20px;text-decoration:none;border-radius:20px;">View all</a></div>`;
