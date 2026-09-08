"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { PlaylistRow } from "../playlists-card";

interface PlaylistCursor {
  offset: number;
  platforms: string[] | null;
}

interface PlaylistPage {
  items: PlaylistRow[];
  nextCursor: PlaylistCursor | null;
  failedPlatforms: string[];
}

const fetchPlaylists = async (
  uuid: string,
  cursor: PlaylistCursor,
): Promise<PlaylistPage> => {
  const query = new URLSearchParams({
    uuid,
    offset: String(cursor.offset),
  });
  if (cursor.platforms?.length) {
    query.set("platforms", cursor.platforms.join(","));
  }

  const response = await fetch(`/api/soundcharts/playlists?${query}`);
  const payload = (await response.json().catch(() => ({}))) as {
    items?: PlaylistRow[];
    nextOffset?: number | null;
    nextPlatforms?: string[];
    failedPlatforms?: string[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load playlists.");
  }

  return {
    items: payload.items ?? [],
    nextCursor:
      payload.nextOffset != null
        ? {
            offset: payload.nextOffset,
            platforms: payload.nextPlatforms ?? null,
          }
        : null,
    failedPlatforms: payload.failedPlatforms ?? [],
  };
};

export function useCampaignPlaylists(uuid?: string) {
  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isError,
  } = useInfiniteQuery({
    queryKey: ["campaign-playlists", uuid],
    queryFn: ({ pageParam }) => fetchPlaylists(uuid!, pageParam),
    initialPageParam: { offset: 0, platforms: null } as PlaylistCursor,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(uuid),
    staleTime: 5 * 60_000,
  });

  // Soundcharts can repeat a placement across pages, so key on the row id.
  const playlists = useMemo(() => {
    const seen = new Set<string>();
    return (data?.pages ?? []).flatMap((page) =>
      page.items.filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      }),
    );
  }, [data]);

  const failedPlatforms = useMemo(
    () => [
      ...new Set((data?.pages ?? []).flatMap((page) => page.failedPlatforms)),
    ],
    [data],
  );

  return {
    playlists,
    failedPlatforms,
    isPlaylistsLoading: isFetching && !isFetchingNextPage,
    isLoadingMore: isFetchingNextPage,
    hasMorePlaylists: Boolean(hasNextPage),
    loadMorePlaylists: () => void fetchNextPage(),
    retryPlaylists: () => void refetch(),
    hasPlaylistsError: isError,
  };
}
