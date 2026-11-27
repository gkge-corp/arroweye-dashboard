"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { getArtistPage } from "@/services/api/artists";

export function useArtistPage(slug: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["artist", slug],
    queryFn: () => getArtistPage(slug),
    staleTime: 5 * 60 * 1000,
    // An unknown slug won't appear on retry.
    retry: (count, failure) =>
      !(isAxiosError(failure) && failure.response?.status === 404) && count < 2,
  });

  return {
    artist: data,
    profile: data?.profile ?? null,
    isLoading,
    isNotFound: isAxiosError(error) && error.response?.status === 404,
    isError: Boolean(error),
  };
}
