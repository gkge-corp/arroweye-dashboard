export interface AnalyticsPlatform {
  code: string;
  label: string;
}

/** Platforms Songstats lists individual playlist placements for. */
export const PLAYLIST_PLATFORMS: AnalyticsPlatform[] = [
  { code: "spotify", label: "Spotify" },
  { code: "apple-music", label: "Apple Music" },
  { code: "deezer", label: "Deezer" },
  { code: "amazon", label: "Amazon" },
  { code: "youtube", label: "YouTube" },
  { code: "tidal", label: "Tidal" },
];

/** Discovery metrics that can be plotted beside streams but have no playlists. */
export const DISCOVERY_PLATFORMS: AnalyticsPlatform[] = [
  { code: "shazam", label: "Shazam" },
];

/** Platforms read for the playlist reach split. */
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

/**
 * Every network whose artist follower count feeds audience growth. Apple
 * Music, Amazon and Tidal publish no follower counts, so they cannot join.
 */
export const ARTIST_FOLLOWER_PLATFORMS: AnalyticsPlatform[] = [
  ...ARTIST_SOCIAL_PLATFORMS,
  { code: "spotify", label: "Spotify" },
  { code: "deezer", label: "Deezer" },
  { code: "soundcloud", label: "SoundCloud" },
];

/**
 * App platform code -> Songstats `source`. Platforms Songstats does not cover
 * (Audiomack, Boomplay) are absent, so callers skip them.
 */
const SONGSTATS_SOURCES: Record<string, string> = {
  spotify: "spotify",
  "apple-music": "apple_music",
  amazon: "amazon",
  deezer: "deezer",
  youtube: "youtube",
  tidal: "tidal",
  soundcloud: "soundcloud",
  shazam: "shazam",
  itunes: "itunes",
  tiktok: "tiktok",
  instagram: "instagram",
  facebook: "facebook",
  twitter: "twitter",
};

export const toSongstatsSource = (code: string) => SONGSTATS_SOURCES[code];

export const fromSongstatsSource = (source: string) =>
  Object.keys(SONGSTATS_SOURCES).find(
    (code) => SONGSTATS_SOURCES[code] === source,
  ) ?? source;
