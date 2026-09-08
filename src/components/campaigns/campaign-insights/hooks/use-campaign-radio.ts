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
): Promise<RadioPage> => {
  const response = await fetch(
    `/api/soundcharts/top-radio?uuid=${encodeURIComponent(uuid)}&offset=${offset}`,
  );
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

export function useCampaignRadio(uuid?: string) {
  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteQuery({
    queryKey: ["campaign-top-radio", uuid],
    queryFn: ({ pageParam }) => fetchTopRadio(uuid!, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: Boolean(uuid),
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
