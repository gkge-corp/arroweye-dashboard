"use client";

import React from "react";

import { DataList, type DataListColumn } from "@/components/ui/data-list";

export interface CreatorRow {
  id: string;
  handle: string;
  name: string;
  platform: string;
  country: string;
  followers: number;
  posts: number;
  views: number;
  likes: number;
  url: string;
}

interface TopCreatorsCardProps {
  creators: CreatorRow[];
  loading?: boolean;
  isLinked?: boolean;
  onLinkSong?: () => void;
}

const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const columns: DataListColumn<CreatorRow>[] = [
  {
    key: "creator",
    header: "Creator",
    width: "minmax(0, 2fr)",
    className: "font-[600] text-foreground",
    render: (row) => (
      <a
        href={row.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block truncate hover:underline"
        title={[`@${row.handle}`, row.platform, row.country]
          .filter(Boolean)
          .join(" · ")}
      >
        @{row.handle}
        <span className="ml-1 font-[400] text-muted-foreground">
          · {row.platform}
        </span>
      </a>
    ),
  },
  {
    key: "followers",
    header: "Followers",
    className: "text-muted-foreground",
    render: (row) => (
      <span className="block truncate" title={row.followers.toLocaleString()}>
        {compactNumber.format(row.followers)}
      </span>
    ),
  },
  {
    key: "views",
    header: "Views",
    className: "text-muted-foreground",
    render: (row) => (
      <span
        className="block truncate"
        title={`${row.views.toLocaleString()} views across ${row.posts} ${row.posts === 1 ? "post" : "posts"}`}
      >
        {compactNumber.format(row.views)}
      </span>
    ),
  },
];

/** Creators who drove the most views with the song. */
export function TopCreatorsCard({
  creators,
  loading = false,
  isLinked = false,
  onLinkSong,
}: TopCreatorsCardProps) {
  return (
    <DataList
      title="Top Creators"
      label="creator"
      columns={columns}
      rows={creators}
      getRowKey={(row) => row.id}
      showRank
      loading={loading}
      emptyMessage={
        isLinked ? undefined : "Link this song to load creator data"
      }
      emptyAction={
        !isLinked && onLinkSong
          ? { label: "Link this song", onClick: onLinkSong }
          : undefined
      }
    />
  );
}

export default TopCreatorsCard;
