import type { RadioMonitorSummary } from "@/lib/radio-monitor/radio-monitor-summary";

import { escapeHtml, formatNumber, safeUrl, sectionLabel } from "./utils";

interface SentenceFormat {
  strong: (value: string) => string;
  plain: (value: string) => string;
}

// "an" before numbers spoken with a vowel sound: 8, 11, 18, 80-89, 800...
const formatChange = (changePercent: number) => {
  const value = Math.abs(changePercent);
  const whole = Math.floor(value);
  const article =
    String(whole).startsWith("8") || whole === 11 || whole === 18 ? "an" : "a";
  return `${article} ${value.toLocaleString("en", { maximumFractionDigits: 1 })}% ${changePercent < 0 ? "decrease" : "increase"}`;
};

const describeTrend = (changePercent: number | null) => {
  if (changePercent === null) return "Radio performance was monitored";
  if (changePercent > 0) return "Radio performance remained positive";
  if (changePercent < 0) return "Radio performance softened";
  return "Radio performance held steady";
};

/**
 * Swaps the model's placeholders for figures read from the uploaded file, so
 * the model chooses the words and never the numbers.
 */
const fillWording = (
  wording: string,
  summary: RadioMonitorSummary,
  { strong, plain }: SentenceFormat,
) => {
  const values: Record<string, string> = {
    airplay: strong(formatNumber(summary.airplay)),
    change:
      summary.changePercent === null
        ? ""
        : strong(formatChange(summary.changePercent)),
    rank: strong(`#${summary.position}`),
    station: plain(summary.station),
    topStation: summary.topStation ? strong(summary.topStation) : "",
  };

  return wording
    .split(/\{([A-Za-z]+)\}/)
    .map((part, index) => (index % 2 === 1 ? (values[part] ?? "") : plain(part)))
    .join("");
};

/** The fixed fallback used when no validated model wording is available. */
export const describeRadioMonitor = (
  summary: RadioMonitorSummary,
  { strong, plain }: SentenceFormat,
) => {
  const change =
    summary.changePercent === null
      ? ""
      : summary.changePercent === 0
        ? plain(", unchanged from the previous reporting period")
        : `${plain(" and ")}${strong(formatChange(summary.changePercent))}${plain(" versus the previous reporting period")}`;
  const topStation = summary.topStation
    ? `${plain(", while ")}${strong(summary.topStation)}${plain(" was the leading monitored station")}`
    : "";

  return [
    plain(
      `${describeTrend(summary.changePercent)} during the reporting week (${summary.period}), with airplay at `,
    ),
    strong(formatNumber(summary.airplay)),
    change,
    plain(". The song ranked "),
    strong(`#${summary.position}`),
    plain(` on the ${summary.station} chart`),
    topStation,
    plain("."),
  ].join("");
};

const htmlFormat: SentenceFormat = {
  strong: (value) =>
    `<strong style="color:#111;font-weight:800;">${escapeHtml(value)}</strong>`,
  plain: escapeHtml,
};

export const textFormat: SentenceFormat = {
  strong: (value) => value,
  plain: (value) => value,
};

export const writeRadioMonitorSummary = (
  summary: RadioMonitorSummary,
  wording: string | undefined,
  format: SentenceFormat,
) =>
  wording
    ? fillWording(wording, summary, format)
    : describeRadioMonitor(summary, format);

const renderSummary = (
  summary: RadioMonitorSummary,
  wording: string | undefined,
) =>
  `<div style="background-color:#fff;padding:16px 18px;border-radius:10px;border:1px solid #e5e5e5;"><div style="font-size:11px;letter-spacing:1px;font-weight:900;text-transform:uppercase;color:#7a42e8;margin-bottom:8px;">&#10022; ${wording ? "AI summary" : "Summary"}</div><div style="font-size:14px;color:#444;line-height:1.55;">${writeRadioMonitorSummary(summary, wording, htmlFormat)}</div></div>`;

const renderFileNotice = (fileName: string | undefined) =>
  `<div style="background-color:#f9f9f9;padding:16px;border-radius:7px;border:1px solid #e5e5e5;"><div style="font-size:14px;color:#555;line-height:1.5;">The full radio monitoring report for this campaign is available to download.${fileName ? `<div style="font-size:13px;color:#777;font-weight:500;margin-top:6px;">${escapeHtml(fileName)}</div>` : ""}</div></div>`;

export const renderRadioMonitor = (
  downloadLink: string | undefined,
  fileName: string | undefined,
  summary?: RadioMonitorSummary,
  wording?: string,
) => {
  const link = safeUrl(downloadLink);
  if (!link) return "";

  return `<div style="margin-top:24px;">${sectionLabel("Radio Monitor", "Weekly radio performance covering plays and rankings across monitored stations.")}${summary ? renderSummary(summary, wording) : renderFileNotice(fileName)}<div style="text-align:right;margin-top:14px;"><a href="${link}" style="display:inline-block;font-size:14px;font-weight:700;color:#fff;background-color:#111;padding:10px 24px;text-decoration:none;border-radius:22px;">Download</a></div><p style="font-size:12px;color:#777;margin:10px 0 0;line-height:1.5;"><strong>&#9432;</strong> This download link expires in 30 days.</p></div>`;
};
