import { isAxiosError } from "axios";

import apiRequest from "@/Server/Api";
import type { SendCampaignReportResult } from "@/types/campaign-report";

// Emails sent from a campaign page. The API rebuilds every figure from the
// campaign's song and saved report settings; only the recipient comes from here.

const sendCampaignEmail = async (
  url: string,
  recipient: string,
  failureMessage: string,
): Promise<SendCampaignReportResult> => {
  try {
    const { message } = await apiRequest<{ message: string }>({
      method: "POST",
      url,
      data: { recipient },
      requireToken: true,
      silent: true,
    });
    return { success: true, message };
  } catch (error) {
    const data = isAxiosError(error) ? error.response?.data : undefined;
    const status = isAxiosError(error) ? error.response?.status : undefined;
    // 4xx messages are written for people; anything else gets the generic one.
    const message =
      status && status < 500 && typeof data?.message === "string"
        ? data.message
        : failureMessage;
    return { success: false, message };
  }
};

export const sendCampaignReportEmail = (
  campaignId: string | number,
  recipient: string,
) =>
  sendCampaignEmail(
    `/api/campaigns/${campaignId}/report/send`,
    recipient,
    "The report could not be sent. Please try again.",
  );

export const sendArtistReportEmail = (
  campaignId: string | number,
  recipient: string,
) =>
  sendCampaignEmail(
    `/api/campaigns/${campaignId}/artist-report/send`,
    recipient,
    "The report could not be sent. Please try again.",
  );

export const sendCampaignWelcomeEmail = (
  campaignId: string | number,
  recipient: string,
) =>
  sendCampaignEmail(
    `/api/campaigns/${campaignId}/welcome/send`,
    recipient,
    "The welcome email could not be sent.",
  );
