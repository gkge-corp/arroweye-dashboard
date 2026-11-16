"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useSearchFilter, useSearchQuery } from "@/hooks/use-table-search";

import { PUBLICATIONS, TV_CHANNELS } from "../spots-data";

export type SpotsTab = "radio" | "tv" | "publications";

export interface RadioStationRow {
  position: number;
  id: string;
  name: string;
  city: string;
  country: string;
  reach: number;
  imageUrl?: string;
}

const audienceFormat = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatAudience = (value: number) => audienceFormat.format(value);

// Same bands as the original Spots site.
export const engagementLabel = (score: number) =>
  score >= 7 ? "High" : score >= 4 ? "Mid" : "Low";

const byAudience = <T extends { audience: number }>(rows: T[]) =>
  [...rows].sort((a, b) => b.audience - a.audience);

const withPosition = <T>(rows: T[]) =>
  rows.map((row, index) => ({ ...row, position: index + 1 }));

const tvChannels = withPosition(byAudience(TV_CHANNELS));
const publications = withPosition(byAudience(PUBLICATIONS));

export type SpotsSortColumn =
  | "position"
  | "name"
  | "country"
  | "seoScore"
  | "audience"
  | "engagement"
  | "topPlatform";

interface SpotsSort {
  column: SpotsSortColumn | null;
  direction: "asc" | "desc";
}

const compareValues = (a: unknown, b: unknown) =>
  typeof a === "number" && typeof b === "number"
    ? a - b
    : String(a ?? "").localeCompare(String(b ?? ""));

const sortRows = <T extends Partial<Record<SpotsSortColumn, unknown>>>(
  rows: T[],
  { column, direction }: SpotsSort,
) => {
  if (!column) return rows;

  const sorted = [...rows].sort((a, b) => compareValues(a[column], b[column]));
  return direction === "asc" ? sorted : sorted.reverse();
};

const fetchRadioRanking = async (): Promise<RadioStationRow[]> => {
  const response = await fetch("/api/music-analytics/radio-ranking");
  const payload = (await response.json().catch(() => ({}))) as {
    items?: RadioStationRow[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load radio stations.");
  }

  return payload.items ?? [];
};

const radioSearchText = (row: RadioStationRow) => [
  row.name,
  row.city,
  row.country,
];

const tvSearchText = (row: (typeof tvChannels)[number]) => [
  row.name,
  row.country,
];

const publicationSearchText = (row: (typeof publications)[number]) => [
  row.name,
  row.country,
  row.topPlatform,
];

const toCsvCell = (value: string | number) =>
  `"${String(value).replace(/"/g, '""')}"`;

const downloadCsv = (fileName: string, rows: (string | number)[][]) => {
  const csv = rows.map((row) => row.map(toCsvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export function useSpots() {
  const [tab, setTab] = useState<SpotsTab>("radio");
  const [sort, setSort] = useState<SpotsSort>({
    column: null,
    direction: "asc",
  });
  const radio = useQuery({
    queryKey: ["spots-radio-ranking"],
    queryFn: fetchRadioRanking,
    staleTime: 60 * 60_000,
  });
  const radioStations = radio.data ?? [];
  const search = useSearchQuery();

  // Sorted once per data or sort change, so the search index below is only
  // rebuilt then and not on every render.
  const sortedRadio = useMemo(
    () =>
      sortRows(
        (radio.data ?? []).map((station) => ({
          ...station,
          audience: station.reach,
        })),
        sort,
      ),
    [radio.data, sort],
  );
  const sortedTv = useMemo(() => sortRows(tvChannels, sort), [sort]);
  const sortedPublications = useMemo(
    () => sortRows(publications, sort),
    [sort],
  );

  const visibleRadio = useSearchFilter(
    sortedRadio,
    search.deferredQuery,
    radioSearchText,
  );
  const visibleTv = useSearchFilter(
    sortedTv,
    search.deferredQuery,
    tvSearchText,
  );
  const visiblePublications = useSearchFilter(
    sortedPublications,
    search.deferredQuery,
    publicationSearchText,
  );

  const changeTab = (nextTab: SpotsTab) => {
    setTab(nextTab);
    setSort({ column: null, direction: "asc" });
  };

  const toggleSort = (column: SpotsSortColumn) => {
    setSort((current) => ({
      column,
      direction:
        current.column === column && current.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const exportCsv = () => {
    if (tab === "radio") {
      downloadCsv("spots-radio.csv", [
        ["Position", "Channel", "Country", "Audience"],
        ...radioStations.map((station) => [
          station.position,
          station.name,
          station.country,
          station.reach,
        ]),
      ]);
      return;
    }

    if (tab === "tv") {
      downloadCsv("spots-tv.csv", [
        ["Position", "Channel", "Country", "Audience"],
        ...tvChannels.map((channel, index) => [
          index + 1,
          channel.name,
          channel.country,
          channel.audience,
        ]),
      ]);
      return;
    }

    downloadCsv("spots-publications.csv", [
      [
        "Position",
        "Publication",
        "Country",
        "SEO score",
        "Audience",
        "Engagement",
        "Top platform",
        "Website",
      ],
      ...publications.map((publication, index) => [
        index + 1,
        publication.name,
        publication.country,
        publication.seoScore,
        publication.audience,
        engagementLabel(publication.engagement),
        publication.topPlatform,
        publication.website,
      ]),
    ]);
  };

  return {
    tab,
    setTab: changeTab,
    sort,
    toggleSort,
    searchQuery: search.query,
    setSearchQuery: search.setQuery,
    radioStations: visibleRadio,
    hasRadioData: radioStations.length > 0,
    isRadioLoading: radio.isLoading,
    hasRadioError: radio.isError,
    retryRadio: () => void radio.refetch(),
    tvChannels: visibleTv,
    publications: visiblePublications,
    exportCsv,
  };
}
