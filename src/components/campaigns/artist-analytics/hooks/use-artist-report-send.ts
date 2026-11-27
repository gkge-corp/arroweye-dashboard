"use client";

import { useCallback } from "react";

import { sendArtistReportEmail } from "@/services/api/campaign-emails";

export function useArtistReportSend(campaignId: string) {
  return useCallback(
    (recipient: string) => sendArtistReportEmail(campaignId, recipient),
    [campaignId],
  );
}
