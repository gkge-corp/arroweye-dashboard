"use client";

import { useCallback } from "react";

import { sendArtistReport } from "@/actions/artist-report";

export function useArtistReportSend(campaignId: string) {
  return useCallback(
    (recipient: string) => sendArtistReport({ campaignId, recipient }),
    [campaignId],
  );
}
