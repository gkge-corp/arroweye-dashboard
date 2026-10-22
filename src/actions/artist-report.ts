"use server";

import { renderArtistReportEmail } from "@/lib/email/artist-report-template";
import { sendZeptoMail } from "@/lib/email/zeptomail";
import { loadArtistReport } from "@/lib/music-analytics/artist/load-artist-report";
import { getAuthorizedProject } from "@/lib/server/get-authorized-project";
import type { SendArtistReportInput } from "@/types/artist-report";
import type { SendCampaignReportResult } from "@/types/campaign-report";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// The email always reports a month of follower growth, whatever range the page shows.
const REPORT_GROWTH_DAYS = 30;

/**
 * Only the campaign and recipient come from the client: every figure
 * is rebuilt on the server from the campaign's own linked song.
 */
export async function sendArtistReport(
  input: SendArtistReportInput,
): Promise<SendCampaignReportResult> {
  const campaignId = String(input?.campaignId ?? "").trim();
  const recipient = String(input?.recipient ?? "")
    .trim()
    .toLowerCase();

  if (!/^\d+$/.test(campaignId) || Number(campaignId) <= 0) {
    return { success: false, message: "A valid campaign is required." };
  }
  if (!emailPattern.test(recipient) || recipient.length > 254) {
    return {
      success: false,
      message: "Enter a valid recipient email address.",
    };
  }

  try {
    const project = await getAuthorizedProject(
      campaignId,
      "You do not have permission to send this artist report.",
    );
    const report = await loadArtistReport(project, REPORT_GROWTH_DAYS);
    if (!report) {
      return {
        success: false,
        message: "We couldn't find analytics for this campaign's artist.",
      };
    }

    const generatedAt = new Date();
    const { html, text, subject } = renderArtistReportEmail({
      project,
      report,
      campaignId,
      generatedAt,
    });

    await sendZeptoMail({
      recipient,
      subject,
      html,
      text,
      clientReference: `artist-report-${campaignId}-${generatedAt.getTime()}`,
    });

    return { success: true, message: "Report sent successfully." };
  } catch (error) {
    console.error("Artist report email failed:", error);
    return {
      success: false,
      message: "The report could not be sent. Please try again.",
    };
  }
}
