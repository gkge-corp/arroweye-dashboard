"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { RadioRow } from "../top-radio-card";

interface RadioPage {
  items: RadioRow[];
  nextOffset: number | null;
}

interface RadioWindow {
  startDate?: string;
  endDate?: string;
}

const fetchTopRadio = async (
  isrc: string,
  offset: number,
  countries: string[] | null,
  window: RadioWindow,
): Promise<RadioPage> => {
  const query = new URLSearchParams({ isrc, offset: String(offset) });
  if (countries) query.set("countries", countries.join(","));
  if (window.startDate) query.set("startDate", window.startDate);
  if (window.endDate) query.set("endDate", window.endDate);
  const response = await fetch(`/api/music-analytics/top-radio?${query}`);
  const payload = (await response.json().catch(() => ({}))) as {
    items?: RadioRow[];
    nextOffset?: number | null;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load radio data.");
  }

  return { items: payload.items ?? [], nextOffset: payload.nextOffset ?? null };
};

export function useCampaignRadio(
  isrc?: string,
  options?: { enabled?: boolean; countries?: string[] | null } & RadioWindow,
) {
  const countries = options?.countries ?? null;
  const startDate = options?.startDate;
  const endDate = options?.endDate;
  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteQuery({
    queryKey: ["campaign-top-radio", isrc, countries, startDate, endDate],
    queryFn: ({ pageParam }) =>
      fetchTopRadio(isrc!, pageParam, countries, { startDate, endDate }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: Boolean(isrc) && (options?.enabled ?? true),
    staleTime: 5 * 60_000,
  });

  // Pages are ranked per request, so a station can repeat across them.
  const stations = useMemo(() => {
    const seen = new Set<string>();
    return (data?.pages ?? []).flatMap((page) =>
      page.items.filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      }),
    );
  }, [data]);

  return {
    stations,
    isRadioLoading: isFetching && !isFetchingNextPage,
    isLoadingMoreRadio: isFetchingNextPage,
    hasMoreRadio: Boolean(hasNextPage),
    loadMoreRadio: () => void fetchNextPage(),
    hasRadioError: isError,
  };
}
