import "server-only";

import { withRetry } from "./fan-out";
import type { AnalyticsPlatform } from "./platforms";
import { SoundchartsError, soundchartsRequest } from "./soundcharts-client";
import { resolveSongUuid } from "./soundcharts-radio";

// Soundcharts caps limit at 100 and bills per page.
export const SOUNDCHARTS_PLAYLIST_PAGE_SIZE = 100;

interface PlaylistEntry {
  // No playlist URL is returned, so these placements carry no link.
  playlist?: {
    uuid?: string;
    identifier?: string;
    name?: string;
    latestSubscriberCount?: number;
  };
  position?: number;
  entryDate?: string;
}

/**
 * Current playlist placements on a platform Songstats does not cover. A song
 * absent from the platform is a normal 404 and returns no placements.
 */
export const fetchSoundchartsPlaylists = async (
  isrc: string,
  platform: AnalyticsPlatform,
  offset: number,
) => {
  let items: PlaylistEntry[];
  try {
    const uuid = await resolveSongUuid(isrc);
    const query = new URLSearchParams({
      offset: String(offset),
      limit: String(SOUNDCHARTS_PLAYLIST_PAGE_SIZE),
      sortBy: "position",
      sortOrder: "asc",
    });
    ({ items = [] } = await withRetry(() =>
      soundchartsRequest<{ items?: PlaylistEntry[] }>(
        `/api/v2.20/song/${uuid}/playlist/current/${platform.code}?${query}`,
      ),
    ));
  } catch (error) {
    if (error instanceof SoundchartsError && error.status === 404) return [];
    throw error;
  }

  return items.map((entry) => ({
    id: `${platform.code}-${entry.playlist?.uuid ?? entry.playlist?.identifier ?? entry.position}`,
    name: entry.playlist?.name ?? "Untitled playlist",
    platform: platform.label,
    url: undefined as string | undefined,
    position: entry.position,
    addedAt: entry.entryDate?.slice(0, 10),
    subscriberCount: entry.playlist?.latestSubscriberCount,
  }));
};
