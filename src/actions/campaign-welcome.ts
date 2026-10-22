"use server";

import { renderCampaignWelcomeEmail } from "@/lib/email/campaign-welcome-template";
import { asArray, asRecord, asString } from "@/lib/email/campaign-report/utils";
import { sendZeptoMail } from "@/lib/email/zeptomail";
import { getAuthorizedProject } from "@/lib/server/get-authorized-project";
import type { SendCampaignReportResult } from "@/types/campaign-report";

interface SendCampaignWelcomeInput {
  campaignId: string;
  recipient: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isCampaignMember = (project: Record<string, unknown>, email: string) =>
  asArray(project.watchers)
    .map(asRecord)
    .some((watcher) =>
      [watcher.email, asRecord(watcher.user_profile).staff_email].some(
        (value) => asString(value).trim().toLowerCase() === email,
      ),
    );

/**
 * Only sends to an existing member of the campaign, so the action can't be
 * used to mail campaign details to arbitrary addresses.
 */
export async function sendCampaignWelcome(
  input: SendCampaignWelcomeInput,
): Promise<SendCampaignReportResult> {
  const campaignId = String(input?.campaignId ?? "").trim();
  const recipient = String(input?.recipient ?? "")
    .trim()
    .toLowerCase();

  if (!/^\d+$/.test(campaignId) || Number(campaignId) <= 0) {
    return { success: false, message: "A valid campaign is required." };
  }
  if (!emailPattern.test(recipient) || recipient.length > 254) {
    return { success: false, message: "Enter a valid member email address." };
  }

  try {
    const project = await getAuthorizedProject(campaignId);
    if (!isCampaignMember(project, recipient)) {
      return {
        success: false,
        message: "This person is not a member of the campaign.",
      };
    }

    const generatedAt = new Date();
    const { html, text, subject } = renderCampaignWelcomeEmail({
      project,
      campaignId,
      recipient,
      generatedAt,
    });

    await sendZeptoMail({
      recipient,
      subject,
      html,
      text,
      clientReference: `campaign-welcome-${campaignId}-${generatedAt.getTime()}`,
    });

    return { success: true, message: "Welcome email sent." };
  } catch (error) {
    console.error("Campaign welcome email failed:", error);
    return {
      success: false,
      message: "The welcome email could not be sent.",
    };
  }
}
