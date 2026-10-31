import "server-only";

import {
  renderDrops,
  renderEvents,
  renderMilestones,
  renderPublications,
} from "./campaign-report/activity-sections";
import {
  renderSectionDivider,
  renderTopCreators,
} from "./campaign-report/creator-sections";
import {
  getAiSummary,
  renderAiRecommendations,
} from "./campaign-report/ai-sections";
import {
  renderCampaignSnapshot,
  renderCampaignTrend,
  renderDjInsights,
} from "./campaign-report/metrics-sections";
import {
  renderPlaylistAdditions,
  renderPlaylistBreakdown,
} from "./campaign-report/playlist-sections";
import {
  describeRadioStations,
  renderRadioMonitor,
} from "./campaign-report/radio-monitor-section";
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
  safeUrl,
  topEntry,
} from "./campaign-report/utils";

export function renderCampaignReportEmail({
  project,
  metrics,
  campaignId,
  generatedAt,
  aiInsights,
  radioMonitorLink,
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
  const { weekly } = metrics;
  const spinCount = asNumber(project.spin_count || metrics.spinCount);
  const topStreaming = topEntry(metrics.streaming);
  const audienceGrowth = metrics.audienceGrowth;
  const audienceGrowthValue = audienceGrowth?.totalGrowth;
  const hasAudienceGrowth = Number.isFinite(audienceGrowthValue);
  const audienceCard: MetricCard = {
    label: "Audience",
    value: Math.abs(audienceGrowthValue ?? 0),
    valuePrefix:
      (audienceGrowthValue ?? 0) > 0
        ? "+ "
        : (audienceGrowthValue ?? 0) < 0
          ? "− "
          : undefined,
    detailLabel: "Top Platform",
    detailValue:
      audienceGrowth?.topPlatform?.toLowerCase() === "others"
        ? undefined
        : audienceGrowth?.topPlatform,
  };
  const highlightCards: MetricCard[] = metrics.highlights.map((highlight) => {
    if (highlight.id === "videoCreations") {
      return {
        label: "Video Creations",
        value: highlight.value,
        changePercent: highlight.changePercent,
        changePeriodDays: highlight.periodDays,
        detailLabel: "Top Platform",
        detailValue: highlight.topPlatform,
      };
    }
    if (highlight.id === "youtube") {
      return {
        label: "Views",
        value: highlight.value,
        changePercent: highlight.changePercent,
        changePeriodDays: highlight.periodDays,
        detailLabel: "Top Platform",
        detailValue: "YouTube",
      };
    }
    return {
      label: "Shazams",
      value: highlight.value,
      changePercent: highlight.changePercent,
      changePeriodDays: highlight.periodDays,
      detailLabel: "Top Market",
      detailValue: highlight.topMarket,
    };
  });
  const metricCards: MetricCard[] = [
    ...[
      {
        visible: weekly.airplay > 0,
        card: {
          label: "Airplay",
          value: weekly.airplay,
          detailLabel: "Top Channel",
          detailValue: metrics.topRadio,
        },
      },
      {
        visible: weekly.streaming > 0,
        card: {
          label: "Streams",
          value: weekly.streaming,
          detailLabel: "Top Platform",
          detailValue: topStreaming?.[0],
        },
      },
      {
        visible: hasAudienceGrowth,
        card: audienceCard,
      },
    ]
      .filter(({ visible }) => visible)
      .map(({ card }) => card satisfies MetricCard),
    ...highlightCards.filter((card) => card.label !== "Shazams"),
    ...highlightCards.filter((card) => card.label === "Shazams"),
  ];

  const playlistSections = [
    renderTopCreators(metrics.topCreators, projectLink),
    renderPlaylistAdditions(metrics.playlists, projectLink),
    renderPlaylistBreakdown(metrics.performance, metrics.performanceReach),
  ].join("");

  const radioMonitorSection = renderRadioMonitor(
    metrics.topRadioStations,
    radioMonitorLink,
  );
  // The radio monitor carries its own top rule; without it, keep a divider before the playlist block.
  const playlistBlock =
    playlistSections && !radioMonitorSection
      ? `${renderSectionDivider()}${playlistSections}`
      : playlistSections;
  const detailRows = [
    detailRow("Project name", projectName, true),
    detailRow("Label", subvendor.organization_name),
    detailRow("Artiste", artist),
    detailRow("DRI", account),
    detailRow(
      "Start date",
      formatDate(project.created || project.start_date, "", "long"),
    ),
    detailRow(
      "End date",
      formatDate(project.end_dte || project.end_date, "", "long"),
    ),
    detailRow("Last updated", formatDateTime(project.modified || generatedAt)),
  ].join("");
  const sections = [
    renderCampaignTrend(
      {
        airplay: weekly.airplay,
        social: weekly.social,
        streaming: weekly.streaming,
      },
      aiSummary,
    ),
    renderCampaignSnapshot(metricCards),
    radioMonitorSection,
    playlistBlock,
    renderDjInsights(project, spinCount),
    renderMilestones(project, projectLink),
    renderPublications(
      firstPopulatedArray(project.media, project.publications),
      projectLink,
    ),
    renderEvents(
      firstPopulatedArray(project.project_event, project.events),
      projectLink,
    ),
    renderDrops(
      firstPopulatedArray(project.dropzone, project.drops),
      projectLink,
    ),
    renderAiRecommendations(project, projectLink, aiInsights),
  ].join("");

  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Campaign Performance Report | Arroweye Pro</title></head><body style="background-color:#f9f9f9;font-family:Avenir,Arial,sans-serif;margin:0;padding:0;-webkit-font-smoothing:antialiased;color:#333;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">Performance report for ${escapeHtml(projectName)}</div><div style="max-width:600px;margin:28px auto;padding:5px 1px 1px;background-color:#ff7400;background-image:linear-gradient(to right,#ff006d,#ff7f00,#ffff00,#00ff00,#147aff);box-shadow:0 8px 30px rgba(0,0,0,.045);text-align:left;"><div style="padding:22px 20px 40px 20px;background-color:#fff;"><div style="margin-bottom:28px;padding-bottom:18px;border-bottom:1px solid #eeeeee;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;"><tr><td style="text-align:left;vertical-align:middle;padding:0;"><img src="https://res.cloudinary.com/dyueswnzk/image/upload/v1792488900/studio_pcyhb7.png" alt="Arroweye" width="170" style="display:block;width:170px;height:auto;border:0;"></td><td style="text-align:right;vertical-align:middle;padding:0 0 0 12px;white-space:nowrap;"><span style="display:inline-block;background:#FFF1E4;border:1px solid #FFD6B0;border-radius:999px;padding:6px 9px;font-size:9px;letter-spacing:.8px;font-weight:bold;color:#B95300;">7-DAY READOUT</span></td></tr></table></div><div style="font-size:24px;line-height:1.15;font-weight:bold;color:#222;">Performance Report</div><div style="background:#fafafa;padding:13px 15px;border-radius:10px;margin-top:16px;border:1px solid #e7e7e7;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;font-size:14px;">${detailRows}</table></div>${sections}<div style="text-align:center;margin-top:35px;"><a href="${projectLink}" style="display:inline-block;font-size:13px;font-weight:bold;color:#fff;background-color:#ff7400;padding:11px 24px;text-decoration:none;border-radius:999px;line-height:20px;">View Dashboard</a></div><div style="text-align:center;margin-top:20px;padding:15px 0;"></div></div></div></body></html>`;

  const text = [
    `${projectName} | Marketing Report (last 7 days)`,
    artist ? `Artiste: ${artist}` : "",
    ...metricCards.map((card) => {
      const change =
        card.changePercent === null || card.changePercent === undefined
          ? ""
          : ` (${card.changePercent > 0 ? "up" : card.changePercent < 0 ? "down" : "unchanged"} ${Math.abs(card.changePercent).toLocaleString("en", { maximumFractionDigits: 1 })}% over ${card.changePeriodDays} days)`;
      const detail = card.detailValue
        ? `; ${card.detailLabel}: ${card.detailValue}`
        : "";
      return `${card.label}: ${card.valuePrefix ?? ""}${formatNumber(card.value)}${change}${detail}`;
    }),
    spinCount > 0 ? `Spins to date: ${formatNumber(spinCount)}` : "",
    metrics.topRadioStations.length
      ? `Top radio stations:\n${describeRadioStations(metrics.topRadioStations)}`
      : "",
    radioMonitorLink ? `Download radio monitor: ${radioMonitorLink}` : "",
    `View dashboard: ${projectLink}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text, subject: `${projectName} | Marketing Report` };
}
