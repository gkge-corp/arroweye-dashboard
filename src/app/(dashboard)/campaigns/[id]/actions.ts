"use server";

import { cookies } from "next/headers";

import { renderCampaignReportEmail } from "@/lib/email/campaign-report-template";
import { sendZeptoMail } from "@/lib/email/zeptomail";
import type {
  CampaignReportMetrics,
  CampaignReportStats,
  SendCampaignReportInput,
  SendCampaignReportResult,
} from "@/types/campaign-report";

type UnknownRecord = Record<string, unknown>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_STAT_ENTRIES = 50;
const MAX_METRIC_VALUE = Number.MAX_SAFE_INTEGER;

const sanitizeStats = (value: unknown): CampaignReportStats => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, MAX_STAT_ENTRIES)
      .map(([key, rawValue]) => {
        const number = Number(rawValue);
        return [
          key.slice(0, 100),
          Number.isFinite(number)
            ? Math.min(MAX_METRIC_VALUE, Math.max(0, number))
            : 0,
        ];
      }),
  );
};

const sanitizeMetrics = (
  metrics: CampaignReportMetrics,
): CampaignReportMetrics => ({
  airplay: sanitizeStats(metrics?.airplay),
  streaming: sanitizeStats(metrics?.streaming),
  audience: sanitizeStats(metrics?.audience),
  socialMedia: sanitizeStats(metrics?.socialMedia),
  actions: sanitizeStats(metrics?.actions),
  performance: sanitizeStats(metrics?.performance),
  spinCount: Math.min(
    MAX_METRIC_VALUE,
    Math.max(0, Number(metrics?.spinCount) || 0),
  ),
});

const getAuthorizedProject = async (campaignId: string) => {
  const token = (await cookies()).get("auth_token")?.value;
  const apiBaseUrl = process.env.NEXT_PUBLIC_APP_SERVER_DOMAIN?.replace(
    /\/$/,
    "",
  );

  if (!token)
    throw new Error("Your session has expired. Please sign in again.");
  if (!apiBaseUrl) throw new Error("The campaign service is not configured.");

  const response = await fetch(
    `${apiBaseUrl}/api/v1/projects/${encodeURIComponent(campaignId)}/`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (response.status === 401 || response.status === 403) {
    throw new Error("You do not have permission to send this campaign report.");
  }
  if (!response.ok) throw new Error("The campaign could not be verified.");

  return (await response.json()) as UnknownRecord;
};

export async function sendCampaignReport(
  input: SendCampaignReportInput,
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
    const project = await getAuthorizedProject(campaignId);
    const generatedAt = new Date();
    const { html, text, subject } = renderCampaignReportEmail({
      project,
      metrics: sanitizeMetrics(input.metrics),
      campaignId,
      generatedAt,
    });

    await sendZeptoMail({
      recipient,
      subject,
      html,
      text,
      clientReference: `campaign-report-${campaignId}-${generatedAt.getTime()}`,
    });

    return { success: true, message: "Report sent successfully." };
  } catch (error) {
    console.error("Campaign report email failed:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "The report could not be sent. Please try again.",
    };
  }
}
