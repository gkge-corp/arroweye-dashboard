"use client";

import React from "react";
import { toast } from "sonner";

import { DataList, type DataListColumn } from "@/components/ui/data-list";
import { downloadCsv, type CsvColumn } from "@/lib/csv";

export interface RadioRow {
  id: string;
  name: string;
  country: string;
  city: string;
  plays: number;
}

interface TopRadioCardProps {
  stations: RadioRow[];
  loading?: boolean;
  songTitle?: string;
  downloadButtonText?: string;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onLinkSong?: () => void;
  /** Every market switched off, so no radio call was made. */
  airplayDisabled?: boolean;
  onChooseMarkets?: () => void;
}

const csvColumns: CsvColumn<RadioRow>[] = [
  { header: "#", value: (_row, index) => index + 1 },
  { header: "Station", value: (row) => row.name },
  { header: "City", value: (row) => row.city },
  { header: "Country", value: (row) => row.country },
  { header: "Plays", value: (row) => row.plays },
];

const columns: DataListColumn<RadioRow>[] = [
  {
    key: "name",
    header: "Station",
    className: "font-[600] text-foreground",
    render: (row) => (
      <span
        className="block truncate"
        title={[row.name, row.city, row.country].filter(Boolean).join(" · ")}
      >
        {row.name}
      </span>
    ),
  },
  {
    key: "plays",
    header: "Plays",
    className: "text-muted-foreground",
    render: (row) => (
      <span className="block truncate">{row.plays.toLocaleString()}</span>
    ),
  },
];

export function TopRadioCard({
  stations,
  loading = false,
  songTitle,
  downloadButtonText = "Download Data",
  hasMore,
  isLoadingMore,
  onLoadMore,
  onLinkSong,
  airplayDisabled = false,
  onChooseMarkets,
}: TopRadioCardProps) {
  const handleDownload = () => {
    if (stations.length === 0) {
      toast.error("No data to download");
      return;
    }
    downloadCsv("top-radio.csv", csvColumns, stations);
  };

  return (
    <DataList
      title="Top Radio"
      label="radio"
      columns={columns}
      rows={stations}
      getRowKey={(row) => row.id}
      showRank
      loading={loading}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={onLoadMore}
      emptyMessage={
        airplayDisabled ? "Airplay is off — no countries selected." : undefined
      }
      emptyAction={
        airplayDisabled
          ? onChooseMarkets
            ? { label: "Choose countries", onClick: onChooseMarkets }
            : undefined
          : onLinkSong
            ? {
                label: songTitle ? `Link "${songTitle}"` : "Link this song",
                onClick: onLinkSong,
              }
            : undefined
      }
      footer={
        <button
          type="button"
          className="p-2 font-SansFlex text-[16px] font-[500] w-full rounded-full text-white dark:text-zinc-950 text-center cursor-pointer hover:bg-orange-500 dark:hover:bg-orange-500 dark:hover:text-white bg-black dark:bg-zinc-100 inline-flex items-center gap-2 justify-center disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black dark:disabled:hover:bg-zinc-100"
          onClick={handleDownload}
          disabled={stations.length === 0 || loading}
        >
          <p>{downloadButtonText}</p>
        </button>
      }
    />
  );
}

export default TopRadioCard;
