"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { RadioRow } from "../top-radio-card";

interface RadioPage {
  items: RadioRow[];
  nextOffset: number | null;
}

const fetchTopRadio = async (
  uuid: string,
  offset: number,
  countries: string[] | null,
): Promise<RadioPage> => {
  const query = new URLSearchParams({ uuid, offset: String(offset) });
  if (countries) query.set("countries", countries.join(","));
  const response = await fetch(`/api/soundcharts/top-radio?${query}`);
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
  uuid?: string,
  options?: { enabled?: boolean; countries?: string[] | null },
) {
  const countries = options?.countries ?? null;
  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteQuery({
    queryKey: ["campaign-top-radio", uuid, countries],
    queryFn: ({ pageParam }) => fetchTopRadio(uuid!, pageParam, countries),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: Boolean(uuid) && (options?.enabled ?? true),
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
