"use client";

import { useCallback, useEffect, useState } from "react";

import {
  PLAYLIST_PLATFORMS,
  REACH_PLATFORMS,
} from "@/lib/music-analytics/platforms";

export interface InsightSources {
  /** One call per platform. */
  playlistPlatforms: string[];
  /** One call per platform. */
  reachPlatforms: string[];
  /** Artist follower counts. One call each, plus one to resolve the artist. */
  artistSocialPlatforms: string[];
}

export const defaultInsightSources = (): InsightSources => ({
  playlistPlatforms: PLAYLIST_PLATFORMS.map((platform) => platform.code),
  reachPlatforms: REACH_PLATFORMS.map((platform) => platform.code),
  // Off by default: these are artist figures, not song figures, and each is a
  // billable call.
  artistSocialPlatforms: [],
});

/** Every enabled source is one Soundcharts call on a cold load. */
export const countSourceCalls = (sources: InsightSources) =>
  sources.playlistPlatforms.length +
  sources.reachPlatforms.length +
  (sources.artistSocialPlatforms.length
    ? sources.artistSocialPlatforms.length + 1
    : 0);

const storageKey = (campaignId: string | number) =>
  `insight-sources:${campaignId}`;

const readSources = (campaignId: string | number): InsightSources | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(storageKey(campaignId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<InsightSources>;
    return { ...defaultInsightSources(), ...parsed };
  } catch (error) {
    console.error("Failed to read the insight sources:", error);
    return null;
  }
};

const writeSources = (
  campaignId: string | number,
  sources: InsightSources | null,
) => {
  if (typeof window === "undefined") return;

  try {
    if (sources) {
      window.localStorage.setItem(storageKey(campaignId), JSON.stringify(sources));
    } else {
      window.localStorage.removeItem(storageKey(campaignId));
    }
  } catch (error) {
    console.error("Failed to persist the insight sources:", error);
  }
};

export function useInsightSources(campaignId?: string | number) {
  const [sources, setSources] = useState<InsightSources>(
    defaultInsightSources,
  );
  // Nothing should be fetched under default settings before the stored choice
  // has loaded, or a disabled source still costs a call on every page open.
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (campaignId === undefined) return;
    setSources(readSources(campaignId) ?? defaultInsightSources());
    setIsLoaded(true);
  }, [campaignId]);

  const saveSources = useCallback(
    (next: InsightSources) => {
      if (campaignId === undefined) return;
      writeSources(campaignId, next);
      setSources(next);
    },
    [campaignId],
  );

  const resetSources = useCallback(() => {
    if (campaignId === undefined) return;
    writeSources(campaignId, null);
    setSources(defaultInsightSources());
  }, [campaignId]);

  return { sources, isLoaded, saveSources, resetSources };
}
