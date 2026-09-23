"use client";

import React from "react";

import { DataList, type DataListColumn } from "@/components/ui/data-list";
import type { CsvColumn } from "@/lib/csv";

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

interface TopCreatorsListProps {
  creators: CreatorRow[];
  loading?: boolean;
}

const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const creatorCsvColumns: CsvColumn<CreatorRow>[] = [
  { header: "#", value: (_row, index) => index + 1 },
  { header: "Creator", value: (row) => row.name },
  { header: "Handle", value: (row) => `@${row.handle}` },
  { header: "Platform", value: (row) => row.platform },
  { header: "Country", value: (row) => row.country },
  { header: "Followers", value: (row) => row.followers },
  { header: "Posts", value: (row) => row.posts },
  { header: "Views", value: (row) => row.views },
  { header: "Likes", value: (row) => row.likes },
  { header: "Profile", value: (row) => row.url },
];

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

/**
 * Creators who drove the most views with the song. Rendered inside the Social
 * Traction card, under the platform table; the card's download exports it.
 */
export function TopCreatorsList({
  creators,
  loading = false,
}: TopCreatorsListProps) {
  return (
    <div className="border-t pt-[20px]">
      <DataList
        title="Top Creators"
        label="creator"
        columns={columns}
        rows={creators}
        getRowKey={(row) => row.id}
        showRank
        loading={loading}
      />
    </div>
  );
}

export default TopCreatorsList;
