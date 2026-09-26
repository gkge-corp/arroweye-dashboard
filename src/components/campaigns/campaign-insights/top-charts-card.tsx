"use client";

import React from "react";

import { DataList, type DataListColumn } from "@/components/ui/data-list";

export interface ChartRow {
  id: string;
  name: string;
  platform: string;
  country: string;
  city: string;
  position: number;
  peakPosition: number;
  peakDate: string;
  url?: string;
}

interface TopChartsCardProps {
  charts: ChartRow[];
  loading?: boolean;
  songTitle?: string;
  failedPlatforms?: string[];
  onRetry?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onLinkSong?: () => void;
}

const columns: DataListColumn<ChartRow>[] = [
  {
    key: "name",
    header: "Chart",
    render: (row) => {
      const place = row.city || row.country;
      return (
        <span
          className="block min-w-0"
          title={[row.name, row.platform, place].filter(Boolean).join(" · ")}
        >
          <span className="block truncate font-[600] text-foreground">
            {row.name}
          </span>
          <span className="block truncate text-[12px] text-muted-foreground">
            {[row.platform, place].filter(Boolean).join(" · ")}
          </span>
        </span>
      );
    },
  },
  {
    key: "position",
    header: "Position",
    render: (row) => (
      <span className="block min-w-0">
        <span className="block truncate font-[600] text-foreground">
          #{row.position}
        </span>
        {row.peakPosition > 0 && row.peakPosition < row.position && (
          <span className="block truncate text-[12px] text-muted-foreground">
            peak #{row.peakPosition}
          </span>
        )}
      </span>
    ),
  },
];

export function TopChartsCard({
  charts,
  loading = false,
  songTitle,
  failedPlatforms = [],
  onRetry,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onLinkSong,
}: TopChartsCardProps) {
  return (
    <DataList
      title="Top Charts"
      label="chart"
      columns={columns}
      rows={charts}
      getRowKey={(row) => row.id}
      showRank
      loading={loading}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={onLoadMore}
      emptyAction={
        onLinkSong
          ? {
              label: songTitle ? `Link "${songTitle}"` : "Link this song",
              onClick: onLinkSong,
            }
          : undefined
      }
      footer={
        failedPlatforms.length > 0 ? (
          <div className="flex items-center justify-center gap-2">
            <p className="font-SansFlex text-[12px] text-muted-foreground">
              Unable to load some platforms
            </p>
            <button
              type="button"
              className="cursor-pointer font-SansFlex text-[12px] font-[500] text-foreground underline underline-offset-2 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onRetry}
              disabled={loading}
            >
              Try again
            </button>
          </div>
        ) : undefined
      }
    />
  );
}

export default TopChartsCard;
