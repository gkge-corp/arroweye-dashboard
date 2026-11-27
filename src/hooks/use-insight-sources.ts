"use client";

import { useCallback, useMemo } from "react";

import { useReportSettings } from "@/hooks/use-report-settings";
import {
  defaultInsightSources,
  type InsightSources,
} from "@/lib/music-analytics/insight-sources";

export {
  defaultInsightSources,
  mergeStreamingPlatforms,
  resolveStreamingSelection,
  type InsightSources,
} from "@/lib/music-analytics/insight-sources";

export function useInsightSources(campaignId?: string | number) {
  const { settings, isLoaded, saveSettings } = useReportSettings(campaignId);

  // Nothing should be fetched under default settings before the saved choice
  // has loaded, or a disabled source still costs a call on every page open.
  const sources = useMemo<InsightSources>(
    () => ({ ...defaultInsightSources(), ...(settings?.insight_sources ?? {}) }),
    [settings?.insight_sources],
  );

  const saveSources = useCallback(
    (next: InsightSources) => saveSettings({ insight_sources: next }),
    [saveSettings],
  );

  const resetSources = useCallback(
    () => saveSettings({ insight_sources: null }),
    [saveSettings],
  );

  return { sources, isLoaded, saveSources, resetSources };
}
