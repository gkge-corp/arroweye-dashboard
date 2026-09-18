export interface AnalyticsPlatform {
  code: string;
  label: string;
}

/** Each of these costs one Soundcharts call per page of playlist placements. */
export const PLAYLIST_PLATFORMS: AnalyticsPlatform[] = [
  { code: "spotify", label: "Spotify" },
  { code: "apple-music", label: "Apple Music" },
  { code: "deezer", label: "Deezer" },
  { code: "amazon", label: "Amazon" },
  { code: "youtube", label: "YouTube" },
  { code: "audiomack", label: "Audiomack" },
  { code: "boomplay", label: "Boomplay" },
  { code: "soundcloud", label: "SoundCloud" },
  { code: "tidal", label: "Tidal" },
];

/** Discovery metrics that can be plotted beside streams but have no playlists. */
export const DISCOVERY_PLATFORMS: AnalyticsPlatform[] = [
  { code: "shazam", label: "Shazam" },
];

/** Each of these costs one Soundcharts call for the playlist reach split. */
export const REACH_PLATFORMS: AnalyticsPlatform[] = [
  { code: "spotify", label: "Spotify" },
  { code: "apple-music", label: "Apple Music" },
  { code: "deezer", label: "Deezer" },
  { code: "amazon", label: "Amazon" },
  { code: "youtube", label: "YouTube" },
];

export const parsePlatforms = (
  raw: string | null | undefined,
  allowed: AnalyticsPlatform[],
) => {
  if (!raw) return allowed;

  const wanted = new Set(raw.split(",").filter(Boolean));
  const picked = allowed.filter((platform) => wanted.has(platform.code));
  return picked.length > 0 ? picked : allowed;
};

/**
 * Facebook and Twitter have no song-level metrics, only artist ones, so these
 * are artist follower counts rather than song engagement. One call each, plus
 * one to resolve the artist behind the song.
 */
export const ARTIST_SOCIAL_PLATFORMS: AnalyticsPlatform[] = [
  { code: "facebook", label: "Facebook" },
  { code: "twitter", label: "Twitter / X" },
  { code: "instagram", label: "Instagram" },
  { code: "youtube", label: "YouTube" },
  { code: "tiktok", label: "TikTok" },
];
