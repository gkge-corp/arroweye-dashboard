import { fetchMusicAnalytics } from "@/services/api/music-analytics";
/** The linked song plus the campaign's artist, which picks the right credit. */
export interface ArtistQuery {
  isrc?: string;
  artist?: string;
}

export const toArtistParams = ({ isrc, artist }: ArtistQuery) => ({
  isrc: isrc ?? "",
  ...(artist ? { artist } : {}),
});

const FALLBACK_ERROR = "Could not load this data right now.";

/** GETs an artist analytics route, surfacing only the route's safe message. */
export const fetchArtistAnalytics = async <T>(
  route: string,
  params: Record<string, string>,
): Promise<T> => {
  const query = new URLSearchParams(params);
  const response = await fetchMusicAnalytics(`${route}?${query}`);
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? FALLBACK_ERROR);
  }

  return payload;
};
