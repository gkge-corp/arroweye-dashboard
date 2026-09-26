"use client";

import React from "react";

import { DataList, type DataListColumn } from "@/components/ui/data-list";

export interface PlaylistRow {
  id: string;
  name: string;
  platform: string;
  url?: string;
  position?: number;
  addedAt?: string;
}

interface PlaylistsCardProps {
  playlists: PlaylistRow[];
  loading?: boolean;
  songTitle?: string;
  failedPlatforms?: string[];
  onRetry?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onLinkSong?: () => void;
}

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
  failedPlatforms = [],
  onRetry,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onLinkSong,
}: PlaylistsCardProps) {
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

export default PlaylistsCard;
