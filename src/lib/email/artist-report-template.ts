import "server-only";

import type { ArtistReport } from "@/lib/music-analytics/artist/load-artist-report";

import {
  renderArtistIdentity,
  renderFollowerGrowth,
  renderInsights,
  renderListenerGeography,
  renderPlatformAudience,
  renderRecommendations,
  renderReportHeader,
  renderTopTracks,
} from "./artist-report/sections";
import {
  asString,
  escapeHtml,
  formatNumber,
  safeUrl,
} from "./campaign-report/utils";

interface ArtistReportTemplateInput {
  project: Record<string, unknown>;
  report: ArtistReport;
  campaignId: string;
  generatedAt: Date;
}

export function renderArtistReportEmail({
  project,
  report,
  campaignId,
}: ArtistReportTemplateInput) {
  const reportLink = safeUrl(
    `https://studio.arroweye.pro/campaigns/${campaignId}/artist`,
  );
  const artistName =
    report.profile.artist.name ||
    asString(project.artist_name || project.song_artist) ||
    "Artist";
  const campaignName = asString(project.title || project.song_title);
  const sections = [
    renderReportHeader(),
    renderArtistIdentity(artistName, report.profile.artist),
    renderInsights(report),
    renderPlatformAudience(report.profile.platforms),
    renderFollowerGrowth(report),
    renderTopTracks(report.topTracks, reportLink),
    renderListenerGeography(report.audience),
    renderRecommendations(report.recommendations, reportLink),
  ].join("");

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Artist Analytics Report | Arroweye</title></head><body style="background-color:#F6F7F8;font-family:Avenir,Arial,sans-serif;margin:0;padding:0;-webkit-font-smoothing:antialiased;color:#333;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">Artist analytics for ${escapeHtml(artistName)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#F6F7F8;"><tr><td align="center" style="padding:20px 8px;"><div style="max-width:600px;width:100%;margin:0 auto;padding:5px 1px 1px;background-color:#ff7400;background-image:linear-gradient(to right,#ff006d,#ff7f00,#ffff00,#00ff00,#147aff);box-shadow:0 8px 28px rgba(22,26,29,.05);text-align:left;box-sizing:border-box;"><div style="padding:22px 20px 36px;background-color:#FFFFFF;">${sections}<div style="text-align:center;margin-top:29px;"><a href="${reportLink}" style="display:inline-block;font-size:13px;font-weight:900;color:#FFFFFF;background:#FF7400;padding:11px 24px;text-decoration:none;border-radius:999px;line-height:20px;">View Dashboard</a></div></div></div></td></tr></table></body></html>`;

  const text = [
    `${artistName} | Artist Report`,
    campaignName ? `Campaign: ${campaignName}` : "",
    report.summary ?? "",
    ...report.profile.platforms.map((platform) => {
      const growth = report.growth.find(
        (entry) => entry.code === platform.code,
      );
      const followers =
        platform.followers === null
          ? "no linked account"
          : `${formatNumber(platform.followers)} followers`;
      const change =
        growth?.percent === null || growth?.percent === undefined
          ? ""
          : ` (${growth.percent >= 0 ? "up" : "down"} ${Math.abs(growth.percent).toLocaleString("en", { maximumFractionDigits: 1 })}% over ${report.days} days)`;
      return `${platform.label}: ${followers}${change}`;
    }),
    report.topTracks.length
      ? `Top tracks:\n${report.topTracks
          .slice(0, 5)
          .map(
            (track, index) =>
              `${index + 1}. ${track.title} (${formatNumber(track.playlists)} playlists)`,
          )
          .join("\n")}`
      : "",
    report.recommendations.length
      ? `Recommendations:\n${report.recommendations
          .map(({ title, body }) => `- ${title}: ${body}`)
          .join("\n")}`
      : "",
    `View artist dashboard: ${reportLink}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text, subject: `${artistName} | Artist Report` };
}
