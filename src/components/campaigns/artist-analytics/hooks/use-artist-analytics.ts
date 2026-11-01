"use client";

import React from "react";

import {
  DEFAULT_FOLLOWER_RANGE,
  summarizeFollowerGrowth,
} from "@/lib/music-analytics/artist/follower-growth";

import type { ArtistQuery } from "./fetch-artist-analytics";
import { useArtistAudience } from "./use-artist-audience";
import {
  useArtistFollowerHistory,
  type FollowerRange,
} from "./use-artist-follower-history";
import { useArtistProfile } from "./use-artist-profile";
import { useArtistSummary } from "./use-artist-summary";
import { useArtistTopTracks } from "./use-artist-top-tracks";

/** Every artist section, keyed off the campaign's linked song. */
export function useArtistAnalytics(campaignId: string, query: ArtistQuery) {
  const [followerRange, setFollowerRange] = React.useState<FollowerRange>(
    DEFAULT_FOLLOWER_RANGE,
  );
  const followerHistory = useArtistFollowerHistory(query, followerRange);
  const { followerPlatforms, followerPoints } = followerHistory;
  // Keyed by platform code so each stat tile can show its period growth.
  const followerGrowth = React.useMemo(
    () =>
      Object.fromEntries(
        summarizeFollowerGrowth({
          platforms: followerPlatforms,
          points: followerPoints,
        }).map((growth) => [growth.code, growth]),
      ),
    [followerPlatforms, followerPoints],
  );

  return {
    followerRange,
    setFollowerRange,
    followerGrowth,
    ...useArtistProfile(query),
    ...followerHistory,
    ...useArtistSummary(campaignId, followerRange, Boolean(query.isrc)),
    ...useArtistTopTracks(query),
    ...useArtistAudience(query),
  };
}
