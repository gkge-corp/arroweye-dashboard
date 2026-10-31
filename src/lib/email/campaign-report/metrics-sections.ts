import type { MetricCard, UnknownRecord } from "./types";
import {
  asNumber,
  asRecord,
  asString,
  escapeHtml,
  firstPopulatedArray,
  formatNumber,
  infoNote,
  sectionHeading,
  sectionTitle,
} from "./utils";

const COLORS = {
  airplay: "#f59e0b",
  social: "#ef3f9a",
  streaming: "#13bf7a",
};

export const renderMetricGrid = (cards: MetricCard[]) => {
  const rows = Array.from({ length: Math.ceil(cards.length / 3) }, (_, row) => {
    const rowCards = cards.slice(row * 3, row * 3 + 3);
    const cells = rowCards
      .map((card) => {
        const change = (() => {
          if (
            card.changePercent === null ||
            card.changePercent === undefined ||
            !Number.isFinite(card.changePercent)
          ) {
            return "";
          }

          const value = card.changePercent;
          const arrow =
            value > 0 ? "&#8673;" : value < 0 ? "&#8675;" : "&#8594;";
          const color = value > 0 ? "#07a83b" : value < 0 ? "#d11a2a" : "#777";
          const formatted = new Intl.NumberFormat("en", {
            maximumFractionDigits: 1,
          }).format(Math.abs(value));

          return `<div style="font-size:12px;color:${color};font-weight:bold;margin-bottom:5px;">${arrow} ${formatted}%</div>`;
        })();
        const detail = card.detailValue
          ? `<div style="font-size:11px;color:#777;">${escapeHtml(card.detailLabel)} &middot; <strong style="font-weight:bold;color:#444;">${escapeHtml(card.detailValue)}</strong></div>`
          : "";

        return `<td width="33%" style="padding:15px 14px;background:#fafafa;border:1px solid #e7e7e7;border-radius:10px;vertical-align:top;"><div style="font-size:10px;letter-spacing:1px;font-weight:bold;text-transform:uppercase;color:#666;">${escapeHtml(card.label)}</div><div style="font-size:22px;line-height:1;font-weight:bold;margin:8px 0 6px;color:#222;">${escapeHtml(card.valuePrefix)}${formatNumber(card.value)}</div>${change}${detail}</td>`;
      })
      .join("");
    const fillers = Array.from(
      { length: 3 - rowCards.length },
      () => '<td width="33%"></td>',
    ).join("");

    return `<tr>${cells}${fillers}</tr>`;
  }).join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;border-spacing:5px;text-align:left;">${rows}</table>`;
};

export const renderCampaignSnapshot = (cards: MetricCard[]) => {
  if (cards.length === 0) return "";

  const hasPercentageChange = cards.some(
    (card) => card.changePercent !== null && card.changePercent !== undefined,
  );
  const changeNote = hasPercentageChange
    ? " Percentage changes compare against the total at the start of the week."
    : "";

  return `<div style="margin-top:26px;">${sectionTitle("Campaign Snapshot", "1.2px")}${renderMetricGrid(cards)}${infoNote(`Metrics show gains over the last 7 days.${changeNote}`)}</div>`;
};

const renderTrendRow = (
  label: string,
  value: number,
  largestValue: number,
  color: string,
  index: number,
  last: boolean,
) => {
  const width =
    value > 0
      ? Math.max(
          1,
          Math.round((Math.log1p(value) / Math.log1p(largestValue)) * 100),
        )
      : 0;

  const labelPadding = `${index === 0 ? "0" : "6px"} 7px ${last ? "0" : "5px"} 0`;

  return `<tr><td style="font-size:10px;font-weight:bold;text-transform:uppercase;color:#777;width:72px;padding:${labelPadding};">${escapeHtml(label)}</td><td style="height:6px;padding:0 1px;${last ? "" : "border-bottom:1px solid #f0f0f0;"}"><span style="display:block;height:6px;background:${color};border-radius:4px;width:${width}%;"></span></td></tr>`;
};

export const renderCampaignTrend = (
  values: {
    airplay: number;
    social: number;
    streaming: number;
  },
  aiSummary: string,
) => {
  const entries = [
    { label: "Radio", value: values.airplay, color: COLORS.airplay },
    { label: "Social", value: values.social, color: COLORS.social },
    { label: "Streaming", value: values.streaming, color: COLORS.streaming },
  ].filter(({ value }) => value > 0);
  if (entries.length === 0) return "";

  const largestValue = Math.max(1, ...entries.map(({ value }) => value));
  const summaryRows = entries
    .map(
      ({ label, value, color }) =>
        `<tr><td style="font-size:11px;text-transform:capitalize;color:#444;padding:4px 0;"><span style="display:inline-block;width:9px;height:9px;background:${color};border-radius:2px;margin-right:6px;"></span>${label}</td><td style="font-size:11px;color:#444;text-align:right;font-weight:bold;">${formatNumber(value)}</td></tr>`,
    )
    .join("");
  const summary = aiSummary.trim()
    ? `<tr><td style="padding:0 14px 14px;"><div style="background:#fafafa;border:1px solid #e7e7e7;border-radius:10px;padding:14px 15px;margin-top:12px;"><div style="font-size:10px;letter-spacing:1px;font-weight:bold;text-transform:uppercase;color:#6f42c1;margin-bottom:7px;">&#10022; AI Summary</div><div style="font-size:13px;line-height:1.45;color:#555;margin-bottom:10px;">${escapeHtml(aiSummary)}</div><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">${summaryRows}</table></div></td></tr>`
    : "";

  return `<div style="margin-top:26px;">${sectionTitle("Campaign Trend", "1.2px")}<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;background:#fff;border:1px solid #e7e7e7;border-radius:10px;"><tr><td style="padding:14px 14px 8px;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">${entries.map(({ label, value, color }, index) => renderTrendRow(label, value, largestValue, color, index, index === entries.length - 1)).join("")}</table></td></tr>${summary}</table></div>`;
};

interface DjCard {
  label: string;
  value: string;
  detail?: string;
  detailColor?: string;
  isName?: boolean;
}

const renderDjCards = (cards: DjCard[]) => {
  const cells = cards
    .map(
      ({ label, value, detail, detailColor, isName }) =>
        `<td width="33%" style="padding:15px;background:#f7f7f7;border:1px solid #e7e7e7;border-radius:8px;vertical-align:top;"><div style="font-size:10px;letter-spacing:1px;font-weight:bold;text-transform:uppercase;color:#666;">${escapeHtml(label)}</div><div style="font-size:${isName ? 18 : 22}px;line-height:1;font-weight:bold;margin:8px 0 6px;color:#222;">${escapeHtml(value)}</div>${detail ? `<div style="font-size:11px;color:${detailColor ?? "#777"};font-weight:bold;margin-top:4px;">${escapeHtml(detail)}</div>` : ""}</td>`,
    )
    .join("");
  const fillers = '<td width="33%"></td>'.repeat(3 - cards.length);

  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;border-spacing:6px;margin-top:14px;"><tr>${cells}${fillers}</tr></table>`;
};

const spinsLabel = (count: number) =>
  count > 0 ? `${formatNumber(count)} spins` : undefined;

export const renderDjInsights = (project: UnknownRecord, spinCount: number) => {
  const insights = asRecord(project.dj_insights || project.spin_insights);
  const topDj = asRecord(
    firstPopulatedArray(insights.top_djs, project.top_djs)[0],
  );
  const topLocation = asRecord(
    firstPopulatedArray(insights.top_locations, project.top_locations)[0],
  );
  const topDjName = asString(topDj.dj_name || topDj.name).trim();
  const topLocationName = asString(
    topLocation.location || topLocation.name,
  ).trim();
  if (spinCount <= 0 && !topDjName && !topLocationName) return "";

  const cards: DjCard[] = [];

  if (spinCount > 0) {
    cards.push({ label: "Spins to date", value: formatNumber(spinCount) });
  }
  if (topDjName) {
    cards.push({
      label: "Top DJ",
      value: topDjName,
      isName: true,
      detail: spinsLabel(asNumber(topDj.spin_count)),
      detailColor: "#068cff",
    });
  }
  if (topLocationName) {
    cards.push({
      label: "Top Location",
      value: topLocationName,
      isName: true,
      detail: spinsLabel(asNumber(topLocation.spin_count)),
    });
  }

  return `<div style="margin-top:24px;">${sectionHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1773505122/spins-mail_lvzhxe.png", "DJ Insights")}${renderDjCards(cards)}${infoNote('DJ insights summarize recorded activity associated with this campaign. Data is collected and verified through <a href="https://arroweye.pro/product/spins" target="_blank" style="color:#777;text-decoration:underline;">Spins Pro</a>.')}</div>`;
};
