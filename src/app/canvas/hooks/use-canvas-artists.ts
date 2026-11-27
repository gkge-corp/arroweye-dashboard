"use client";

import { useQuery } from "@tanstack/react-query";

import { useSearchFilter, useSearchQuery } from "@/hooks/use-table-search";
import { getArtists } from "@/services/api/artists";
import type { Artist } from "@/types/api";

const NO_ARTISTS: Artist[] = [];

const artistSearchText = (artist: Artist) => [artist.name, ...artist.countries];

export function useCanvasArtists() {
  const search = useSearchQuery();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["artists"],
    queryFn: getArtists,
    staleTime: 5 * 60 * 1000,
  });

  const artists = useSearchFilter(
    data?.results ?? NO_ARTISTS,
    search.deferredQuery,
    artistSearchText,
  );

  return { ...search, artists, isLoading, isError };
}
