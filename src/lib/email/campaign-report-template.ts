import "server-only";

import {
  renderDrops,
  renderEvents,
  renderMilestones,
  renderPublications,
} from "./campaign-report/activity-sections";
import {
  getAiSummary,
  renderAiRecommendations,
} from "./campaign-report/ai-sections";
import {
  renderCampaignSnapshot,
  renderCampaignTrend,
  renderDjInsights,
} from "./campaign-report/metrics-sections";
import type {
  CampaignReportTemplateInput,
  MetricCard,
} from "./campaign-report/types";
import {
  asArray,
  asNumber,
  asRecord,
  asString,
  detailRow,
  escapeHtml,
  firstPopulatedArray,
  formatDate,
  formatDateTime,
  formatNumber,
  hasStats,
  safeUrl,
  topEntry,
  total,
} from "./campaign-report/utils";

export function renderCampaignReportEmail({
  project,
  metrics,
  campaignId,
  generatedAt,
  aiInsights,
}: CampaignReportTemplateInput) {
  const subvendor = asRecord(project.subvendor);
  const owner = asRecord(subvendor.owner);
  const watchers = asArray(project.watchers).map(asRecord);
  const account =
    asString(owner.email) ||
    asString(project.account) ||
    asString(watchers.find((watcher) => asString(watcher.email))?.email);
  const projectLink = safeUrl(
    `https://studio.arroweye.pro/campaigns/${campaignId}`,
  );
  const projectName = asString(
    project.title || project.song_title || "Campaign",
  );
  const artist = asString(project.artist_name || project.song_artist);
  const aiSummary = getAiSummary(project, aiInsights);
  const airplayCount = total(metrics.airplay);
  const streamCount = total(metrics.streaming);
  const audienceCount = total(metrics.audience);
  const socialCount = total(metrics.socialMedia);
  const spinCount = asNumber(project.spin_count || metrics.spinCount);
  const topStreaming = topEntry(metrics.streaming);
  const topAudience = topEntry(metrics.audience);
  const audienceCard: MetricCard = {
    label: "Audience",
    value: audienceCount,
    detailLabel: "Top channel",
    detailValue: topAudience?.[0],
  };
  const highlightCards: MetricCard[] = metrics.highlights.map((highlight) => {
    if (highlight.id === "tiktok") {
      return {
        label: "Video creations",
        value: highlight.value,
        changePercent: highlight.changePercent,
        changePeriodDays: highlight.periodDays,
        detailLabel: "Top platform",
        detailValue: "TikTok",
      };
    }
    if (highlight.id === "youtube") {
      return {
        label: "Views",
        value: highlight.value,
        changePercent: highlight.changePercent,
        changePeriodDays: highlight.periodDays,
        detailLabel: "Top platform",
        detailValue: "YouTube",
      };
    }
    return {
      label: "Shazams",
      value: highlight.value,
      changePercent: highlight.changePercent,
      changePeriodDays: highlight.periodDays,
      detailLabel: "Top market",
      detailValue: highlight.topMarket,
    };
  });
  const metricCards: MetricCard[] = [
    ...[
      {
        stats: metrics.airplay,
        card: {
          label: "Airplay",
          value: airplayCount,
          detailLabel: "Top radio",
          detailValue: metrics.topRadio,
        },
      },
      {
        stats: metrics.streaming,
        card: {
          label: "Streams",
          value: streamCount,
          detailLabel: "Top platform",
          detailValue: topStreaming?.[0],
        },
      },
      {
        stats: metrics.audience,
        card: audienceCard,
      },
    ]
      .filter(({ stats }) => hasStats(stats))
      .map(({ card }) => card satisfies MetricCard),
    ...highlightCards,
  ];

  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Campaign Performance Report | Arroweye Pro</title></head><body style="background-color:#f9f9f9;font-family:Avenir,Arial,sans-serif;margin:0;padding:0;-webkit-font-smoothing:antialiased;color:#333;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">Performance report for ${escapeHtml(projectName)}</div><div style="max-width:640px;margin:28px auto;padding:5px 1px 1px;background-color:#ff7400;background-image:linear-gradient(to right,#ff006d,#ff7f00,#ffff00,#00ff00,#147aff);text-align:left;"><div style="padding:20px 20px 40px;background-color:#fff;"><div style="text-align:left;margin-top:20px;margin-bottom:30px;"><img src="https://res.cloudinary.com/dyueswnzk/image/upload/v1759783466/studio_2_hajzkn.png" alt="Arroweye" width="120"></div><div style="font-size:22px;line-height:1.15;font-weight:900;color:#222;">Performance Report</div><div style="background-color:#f7f7f7;padding:12px 14px;border-radius:7px;margin-top:16px;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;font-size:14px;">${detailRow("Project name", projectName)}${detailRow("Label", subvendor.organization_name)}${detailRow("Artist", artist)}${detailRow("DRI", account)}${detailRow("Start date", formatDate(project.created || project.start_date, "", "long"))}${detailRow("End date", formatDate(project.end_dte || project.end_date, "", "long"))}${detailRow("Last updated", formatDateTime(project.modified || generatedAt))}</table></div>${renderCampaignTrend({ airplay: airplayCount, spins: spinCount, social: socialCount, streaming: streamCount }, aiSummary)}${renderCampaignSnapshot(metricCards)}${renderDjInsights(project, spinCount)}${renderMilestones(project, projectLink)}${renderPublications(firstPopulatedArray(project.media, project.publications), projectLink)}${renderEvents(firstPopulatedArray(project.project_event, project.events), projectLink)}${renderDrops(firstPopulatedArray(project.dropzone, project.drops), projectLink)}${renderAiRecommendations(project, projectLink, aiInsights)}<div style="text-align:center;margin-top:35px;"><a href="${projectLink}" style="display:inline-block;font-size:14px;font-weight:900;color:#fff;background-color:#ff7400;padding:11px 26px;text-decoration:none;border-radius:25px;line-height:20px;">View Dashboard</a></div><div style="height:15px;"></div></div></div></body></html>`;

  const text = [
    `${projectName} | Marketing Report`,
    artist ? `Artist: ${artist}` : "",
    ...metricCards.map((card) => {
      const change =
        card.changePercent === null || card.changePercent === undefined
          ? ""
          : ` (${card.changePercent > 0 ? "up" : card.changePercent < 0 ? "down" : "unchanged"} ${Math.abs(card.changePercent).toLocaleString("en", { maximumFractionDigits: 1 })}% over ${card.changePeriodDays} days)`;
      const detail = card.detailValue
        ? `; ${card.detailLabel}: ${card.detailValue}`
        : "";
      return `${card.label}: ${formatNumber(card.value)}${change}${detail}`;
    }),
    spinCount > 0 ? `Spins: ${formatNumber(spinCount)}` : "",
    `View dashboard: ${projectLink}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text, subject: `${projectName} | Marketing Report` };
}
