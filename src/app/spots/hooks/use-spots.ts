"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

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

const byAudience = <T extends { audience: number }>(rows: T[]) =>
  [...rows].sort((a, b) => b.audience - a.audience);

const tvChannels = byAudience(TV_CHANNELS);
const publications = byAudience(PUBLICATIONS);

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
  const radio = useQuery({
    queryKey: ["spots-radio-ranking"],
    queryFn: fetchRadioRanking,
    staleTime: 60 * 60_000,
  });
  const radioStations = radio.data ?? [];

  const exportCsv = () => {
    if (tab === "radio") {
      downloadCsv("spots-radio.csv", [
        ["Position", "Channel", "City", "Country", "Reach"],
        ...radioStations.map((station) => [
          station.position,
          station.name,
          station.city,
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
        publication.engagement,
        publication.topPlatform,
        publication.website,
      ]),
    ]);
  };

  return {
    tab,
    setTab,
    radioStations,
    isRadioLoading: radio.isLoading,
    hasRadioError: radio.isError,
    retryRadio: () => void radio.refetch(),
    tvChannels,
    publications,
    exportCsv,
  };
}
