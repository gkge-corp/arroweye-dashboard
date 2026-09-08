"use client";

import React from "react";
import { toast } from "sonner";

import { DataList, type DataListColumn } from "@/components/ui/data-list";
import { downloadCsv, type CsvColumn } from "@/lib/csv";

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
  downloadButtonText?: string;
  failedPlatforms?: string[];
  onRetry?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onLinkSong?: () => void;
}

const csvColumns: CsvColumn<ChartRow>[] = [
  { header: "#", value: (_row, index) => index + 1 },
  { header: "Chart", value: (row) => row.name },
  { header: "Platform", value: (row) => row.platform },
  { header: "Country", value: (row) => row.city || row.country },
  { header: "Position", value: (row) => row.position },
  { header: "Peak", value: (row) => row.peakPosition || "" },
  { header: "Peak date", value: (row) => row.peakDate.slice(0, 10) },
];

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
  downloadButtonText = "Download Data",
  failedPlatforms = [],
  onRetry,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onLinkSong,
}: TopChartsCardProps) {
  const handleDownload = () => {
    if (charts.length === 0) {
      toast.error("No data to download");
      return;
    }
    downloadCsv("top-charts.csv", csvColumns, charts);
  };

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
        <div className="space-y-2">
          {failedPlatforms.length > 0 && (
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
          )}
          <button
            type="button"
            className="p-2 font-SansFlex text-[16px] font-[500] w-full rounded-full text-white dark:text-zinc-950 text-center cursor-pointer hover:bg-orange-500 dark:hover:bg-orange-500 dark:hover:text-white bg-black dark:bg-zinc-100 inline-flex items-center gap-2 justify-center disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black dark:disabled:hover:bg-zinc-100"
            onClick={handleDownload}
            disabled={charts.length === 0 || loading}
          >
            <p>{downloadButtonText}</p>
          </button>
        </div>
      }
    />
  );
}

export default TopChartsCard;
