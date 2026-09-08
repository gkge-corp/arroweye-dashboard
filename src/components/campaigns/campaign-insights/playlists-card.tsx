"use client";

import React from "react";
import { toast } from "sonner";

import { DataList, type DataListColumn } from "@/components/ui/data-list";
import { downloadCsv, type CsvColumn } from "@/lib/csv";

export interface PlaylistRow {
  id: string;
  name: string;
  platform: string;
  url?: string;
}

interface PlaylistsCardProps {
  playlists: PlaylistRow[];
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

const csvColumns: CsvColumn<PlaylistRow>[] = [
  { header: "#", value: (_row, index) => index + 1 },
  { header: "Playlist", value: (row) => row.name },
  { header: "Platform", value: (row) => row.platform },
  { header: "URL", value: (row) => row.url ?? "" },
];

const columns: DataListColumn<PlaylistRow>[] = [
  {
    key: "name",
    header: "Playlist",
    className: "font-[600] text-foreground",
    render: (row) =>
      row.url ? (
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate hover:text-orange-500"
          title={row.name}
        >
          {row.name}
        </a>
      ) : (
        <span className="block truncate" title={row.name}>
          {row.name}
        </span>
      ),
  },
  {
    key: "platform",
    header: "Platform",
    className: "text-muted-foreground",
    render: (row) => <span className="block truncate">{row.platform}</span>,
  },
];

export function PlaylistsCard({
  playlists,
  loading = false,
  songTitle,
  downloadButtonText = "Download Data",
  failedPlatforms = [],
  onRetry,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onLinkSong,
}: PlaylistsCardProps) {
  const handleDownload = () => {
    if (playlists.length === 0) {
      toast.error("No data to download");
      return;
    }
    downloadCsv("playlists.csv", csvColumns, playlists);
  };

  return (
    <DataList
      title="Playlists"
      label="playlist"
      columns={columns}
      rows={playlists}
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
            disabled={playlists.length === 0 || loading}
          >
            <p>{downloadButtonText}</p>
          </button>
        </div>
      }
    />
  );
}

export default PlaylistsCard;
