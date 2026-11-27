import {
  DISCOVERY_PLATFORMS,
  PLAYLIST_PLATFORMS,
  REACH_PLATFORMS,
  type AnalyticsPlatform,
} from "@/lib/music-analytics/platforms";

const DISCOVERY_AND_STREAMING_PLATFORMS = [
  ...PLAYLIST_PLATFORMS,
  ...DISCOVERY_PLATFORMS,
];

export interface InsightSources {
  /** Selected discovery/DSP rows. */
  playlistPlatforms: string[];
  /** Platforms counted in the PLAYLIST BREAKDOWN chart. */
  reachPlatforms: string[];
  /**
   * Retained so stored settings from before the SOCIAL MEDIA chart moved to
   * song activity still parse. Artist follower counts are audience rather
   * than activity and no longer feed any chart here.
   * @deprecated
   */
  artistSocialPlatforms: string[];
  /**
   * Which discovery and streaming sources the picker was offering when this
   * was saved. Songstats reports plays for platforms with no playlist list
   * (SoundCloud), and that set varies per song, so a platform
   * missing from playlistPlatforms is only "switched off" if it was on offer
   * at the time. Anything newer is unseen, not declined.
   */
  knownStreamingPlatforms: string[];
}

export const defaultInsightSources = (): InsightSources => ({
  playlistPlatforms: DISCOVERY_AND_STREAMING_PLATFORMS.map(
    (platform) => platform.code,
  ),
  reachPlatforms: REACH_PLATFORMS.map((platform) => platform.code),
  artistSocialPlatforms: [],
  knownStreamingPlatforms: DISCOVERY_AND_STREAMING_PLATFORMS.map(
    (platform) => platform.code,
  ),
});

/**
 * Everything the Discovery & streaming picker should list for this song:
 * discovery signals, playlist platforms, and any extra platform Songstats
 * reports plays for.
 */
export const mergeStreamingPlatforms = (
  available: AnalyticsPlatform[] | undefined,
) => {
  const merged = new Map(
    DISCOVERY_AND_STREAMING_PLATFORMS.map((platform) => [
      platform.code,
      platform,
    ]),
  );
  for (const platform of available ?? []) {
    if (!merged.has(platform.code)) merged.set(platform.code, platform);
  }
  return [...merged.values()];
};

/**
 * Platforms to actually show, given what this song turned out to offer. A
 * platform the viewer has never been shown counts as on.
 */
export const resolveStreamingSelection = (
  sources: InsightSources,
  offered: AnalyticsPlatform[],
) => {
  const known = new Set(sources.knownStreamingPlatforms);
  const selected = new Set(sources.playlistPlatforms);

  for (const platform of offered) {
    if (!known.has(platform.code)) selected.add(platform.code);
  }

  return [...selected];
};
