import type { MetricCard, UnknownRecord } from "./types";
import {
  asNumber,
  asRecord,
  asString,
  escapeHtml,
  firstPopulatedArray,
  formatNumber,
  sectionHeading,
} from "./utils";

const COLORS = {
  airplay: "#f59e0b",
  spins: "#147aff",
  social: "#ef3f9a",
  streaming: "#13bf7a",
};

const renderMetricGrid = (cards: MetricCard[]) => {
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
            value > 0 ? "&#8593;" : value < 0 ? "&#8595;" : "&#8594;";
          const color = value > 0 ? "#0aaa3f" : value < 0 ? "#dc2626" : "#777";
          const formatted = new Intl.NumberFormat("en", {
            maximumFractionDigits: 1,
          }).format(Math.abs(value));

          return `<div style="font-size:13px;font-weight:800;color:${color};margin:-1px 0 7px;">${arrow} ${formatted}%</div>`;
        })();
        const detail = card.detailValue
          ? `<div style="font-size:11px;color:#777;">${escapeHtml(card.detailLabel)} &middot; <strong style="font-weight:800;color:#444;">${escapeHtml(card.detailValue)}</strong></div>`
          : "";

        return `<td width="33%" style="padding:16px 14px;background:#f7f7f7;border:1px solid #e7e7e7;border-radius:8px;vertical-align:top;"><div style="font-size:10px;letter-spacing:1px;font-weight:900;text-transform:uppercase;color:#666;">${escapeHtml(card.label)}</div><div style="font-size:22px;line-height:1;font-weight:900;margin:8px 0 6px;color:#222;">${formatNumber(card.value)}</div>${change}${detail}</td>`;
      })
      .join("");
    const fillers = Array.from(
      { length: 3 - rowCards.length },
      () => '<td width="33%"></td>',
    ).join("");

    return `<tr>${cells}${fillers}</tr>`;
  }).join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;border-spacing:6px;text-align:left;">${rows}</table>`;
};

export const renderCampaignSnapshot = (cards: MetricCard[]) => {
  if (cards.length === 0) return "";

  const changePeriods = [
    ...new Set(
      cards
        .filter(
          (card) =>
            card.changePercent !== null &&
            card.changePercent !== undefined &&
            card.changePeriodDays,
        )
        .map((card) => card.changePeriodDays),
    ),
  ];
  const changeNote =
    changePeriods.length === 1
      ? ` Percentage changes show the reporting source's change over the latest ${changePeriods[0]} days.`
      : changePeriods.length > 1
        ? " Percentage changes use the reporting period shown by the source."
        : "";

  return `<div style="margin-top:26px;"><div style="font-size:11px;letter-spacing:1.2px;font-weight:900;text-transform:uppercase;color:#777;margin-bottom:10px;">Campaign snapshot</div>${renderMetricGrid(cards)}<p style="font-size:12px;color:#777;margin:10px 0 0;line-height:1.5;"><strong>&#9432;</strong> Metrics reflect current campaign performance across the selected reporting sources.${changeNote}</p></div>`;
};

const renderTrendRow = (
  label: string,
  value: number,
  largestValue: number,
  color: string,
  last = false,
) => {
  const width =
    value > 0
      ? Math.max(
          1,
          Math.round((Math.log1p(value) / Math.log1p(largestValue)) * 100),
        )
      : 0;

  return `<tr><td style="font-size:10px;font-weight:900;text-transform:uppercase;color:#777;width:72px;padding:6px 7px 5px 0;">${escapeHtml(label)}</td><td style="height:6px;padding:0 1px;${last ? "" : "border-bottom:1px solid #f0f0f0;"}"><span style="display:block;height:6px;background:${color};border-radius:4px;width:${width}%;"></span></td></tr>`;
};

export const renderCampaignTrend = (
  values: {
    airplay: number;
    spins: number;
    social: number;
    streaming: number;
  },
  aiSummary: string,
) => {
  const entries = [
    { label: "RADIO", value: values.airplay, color: COLORS.airplay },
    { label: "SPINS", value: values.spins, color: COLORS.spins },
    { label: "SOCIAL", value: values.social, color: COLORS.social },
    { label: "STREAMING", value: values.streaming, color: COLORS.streaming },
  ].filter(({ value }) => value > 0);
  if (entries.length === 0) return "";

  const largestValue = Math.max(1, ...entries.map(({ value }) => value));
  const summaryRows = entries
    .map(
      ({ label, value, color }) =>
        `<tr><td style="font-size:11px;text-transform:uppercase;color:#444;padding:4px 0;"><span style="display:inline-block;width:9px;height:9px;background:${color};border-radius:2px;margin-right:6px;"></span>${label}</td><td style="font-size:11px;color:#444;text-align:right;font-weight:800;">${formatNumber(value)}</td></tr>`,
    )
    .join("");
  const summary = aiSummary.trim()
    ? `<tr><td style="padding:0 14px 14px;"><div style="background:#fafafa;border:1px solid #e7e7e7;border-radius:8px;padding:13px 14px;margin-top:12px;"><div style="font-size:10px;letter-spacing:1px;font-weight:900;text-transform:uppercase;color:#7a42e8;margin-bottom:6px;">&#10022; AI summary</div><div style="font-size:13px;line-height:1.45;color:#555;margin-bottom:10px;">${escapeHtml(aiSummary)}</div><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">${summaryRows}</table></div></td></tr>`
    : "";

  return `<div style="margin-top:26px;"><div style="font-size:11px;letter-spacing:1.2px;font-weight:900;text-transform:uppercase;color:#777;margin-bottom:10px;">CAMPAIGN TREND</div><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;background:#fff;border:1px solid #e7e7e7;border-radius:8px;"><tr><td style="padding:14px 14px 8px;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">${entries.map(({ label, value, color }, index) => renderTrendRow(label, value, largestValue, color, index === entries.length - 1)).join("")}</table></td></tr>${summary}</table></div>`;
};

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

  const cards: MetricCard[] = [];

  if (spinCount > 0) {
    cards.push({ label: "Spins", value: spinCount });
  }
  if (topDjName) {
    cards.push({
      label: "Top DJ",
      value: asNumber(topDj.spin_count),
      detailLabel: "DJ",
      detailValue: topDjName,
    });
  }
  if (topLocationName) {
    cards.push({
      label: "Top location",
      value: asNumber(topLocation.spin_count),
      detailLabel: "Location",
      detailValue: topLocationName,
    });
  }

  return `<div style="margin-top:24px;">${sectionHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1773505122/spins-mail_lvzhxe.png", "DJ Insights")}<div style="margin-top:8px;">${renderMetricGrid(cards)}</div><p style="font-size:12px;color:#777;margin:10px 0 0;line-height:1.5;"><strong>&#9432;</strong> DJ insights summarize recorded activity associated with this campaign. Data is collected and verified through <a href="https://arroweye.pro/product/spins" target="_blank" style="color:#777;text-decoration:underline;">Spins Pro</a>.</p></div>`;
};
