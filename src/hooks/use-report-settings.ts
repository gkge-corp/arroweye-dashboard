"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getReportSettings,
  updateReportSettings,
  type ReportSettings,
  type ReportSettingsUpdate,
} from "@/services/api/report-settings";

const reportSettingsKey = (campaignId?: string | number) => [
  "report-settings",
  String(campaignId),
];

/** The campaign's saved insight settings, read once and shared by every hook that needs them. */
export function useReportSettings(campaignId?: string | number) {
  const queryClient = useQueryClient();
  const queryKey = reportSettingsKey(campaignId);

  const { data, isFetched } = useQuery({
    queryKey,
    queryFn: () => getReportSettings(campaignId!),
    enabled: campaignId !== undefined,
    staleTime: 5 * 60_000,
  });

  const { mutate } = useMutation({
    mutationFn: (changes: ReportSettingsUpdate) =>
      updateReportSettings(campaignId!, changes),
    onSuccess: (saved) => queryClient.setQueryData(queryKey, saved),
    onError: (error) => {
      console.error("Saving the insight settings failed:", error);
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  // Applied locally straight away so the page reacts without waiting on the save.
  const saveSettings = useCallback(
    (changes: ReportSettingsUpdate) => {
      if (campaignId === undefined) return;
      queryClient.setQueryData<ReportSettings | undefined>(
        queryKey,
        (current) => current && { ...current, ...changes },
      );
      mutate(changes);
    },
    // queryKey is derived from campaignId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaignId, mutate, queryClient],
  );

  return {
    settings: data,
    // A failed read still counts as loaded so the page falls back to defaults.
    isLoaded: isFetched,
    saveSettings,
  };
}
