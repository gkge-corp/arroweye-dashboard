"use client";

import React from "react";

import { DataList, type DataListColumn } from "@/components/ui/data-list";

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
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onLinkSong?: () => void;
  /** Every market switched off, so no radio call was made. */
  airplayDisabled?: boolean;
  onChooseMarkets?: () => void;
}

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
  hasMore,
  isLoadingMore,
  onLoadMore,
  onLinkSong,
  airplayDisabled = false,
  onChooseMarkets,
}: TopRadioCardProps) {
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
        airplayDisabled ? "Airplay is off - no countries selected." : undefined
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
    />
  );
}

export default TopRadioCard;
