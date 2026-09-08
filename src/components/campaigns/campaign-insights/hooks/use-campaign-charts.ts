"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { ChartRow } from "../top-charts-card";

interface ChartsCursor {
  offset: number;
  platforms: string[] | null;
}

interface ChartsPage {
  items: ChartRow[];
  nextCursor: ChartsCursor | null;
  failedPlatforms: string[];
}

const fetchCharts = async (
  uuid: string,
  cursor: ChartsCursor,
): Promise<ChartsPage> => {
  const query = new URLSearchParams({ uuid, offset: String(cursor.offset) });
  if (cursor.platforms?.length) {
    query.set("platforms", cursor.platforms.join(","));
  }

  const response = await fetch(`/api/soundcharts/charts?${query}`);
  const payload = (await response.json().catch(() => ({}))) as {
    items?: ChartRow[];
    nextOffset?: number | null;
    nextPlatforms?: string[];
    failedPlatforms?: string[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load chart entries.");
  }

  return {
    items: payload.items ?? [],
    nextCursor:
      payload.nextOffset != null
        ? { offset: payload.nextOffset, platforms: payload.nextPlatforms ?? null }
        : null,
    failedPlatforms: payload.failedPlatforms ?? [],
  };
};

export function useCampaignCharts(uuid?: string) {
  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isError,
  } = useInfiniteQuery({
    queryKey: ["campaign-charts", uuid],
    queryFn: ({ pageParam }) => fetchCharts(uuid!, pageParam),
    initialPageParam: { offset: 0, platforms: null } as ChartsCursor,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(uuid),
    staleTime: 5 * 60_000,
  });

  // A song can hold several placements on one chart across pages, so rows are
  // keyed by platform, chart and position.
  const charts = useMemo(() => {
    const seen = new Set<string>();
    return (data?.pages ?? [])
      .flatMap((page) =>
        page.items.filter((row) => {
          if (seen.has(row.id)) return false;
          seen.add(row.id);
          return true;
        }),
      )
      .sort((a, b) => a.position - b.position);
  }, [data]);

  const failedPlatforms = useMemo(
    () => [
      ...new Set((data?.pages ?? []).flatMap((page) => page.failedPlatforms)),
    ],
    [data],
  );

  return {
    charts,
    failedPlatforms,
    isChartsLoading: isFetching && !isFetchingNextPage,
    isLoadingMoreCharts: isFetchingNextPage,
    hasMoreCharts: Boolean(hasNextPage),
    loadMoreCharts: () => void fetchNextPage(),
    retryCharts: () => void refetch(),
    hasChartsError: isError,
  };
}
