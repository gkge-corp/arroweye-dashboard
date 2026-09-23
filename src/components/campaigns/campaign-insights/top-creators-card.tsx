"use client";

import React from "react";
import { toast } from "sonner";

import { DataList, type DataListColumn } from "@/components/ui/data-list";
import { saveCsv, type CsvColumn } from "@/lib/csv";

import { buildSocialColumnCsv, type ColumnSummary } from "./social-column-csv";

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
  /** Charts above the card in the same column, included in its download. */
  summaries?: ColumnSummary[];
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
 * Creators who drove the most views with the song. It closes the social
 * column, so its download exports the whole column.
 */
export function TopCreatorsCard({
  creators,
  loading = false,
  isLinked = false,
  onLinkSong,
  summaries = [],
}: TopCreatorsCardProps) {
  const columnCsv = buildSocialColumnCsv({ summaries, creators });

  const handleDownload = () => {
    if (!columnCsv) {
      toast.error("No data to download");
      return;
    }

    saveCsv("social-media.csv", columnCsv);
  };

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
      footer={
        <button
          type="button"
          className="p-2 font-SansFlex text-[16px] font-[500] w-full rounded-full text-white dark:text-zinc-950 text-center cursor-pointer hover:bg-orange-500 dark:hover:bg-orange-500 dark:hover:text-white bg-black dark:bg-zinc-100 inline-flex items-center gap-2 justify-center disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black dark:disabled:hover:bg-zinc-100 active:scale-[0.97]"
          onClick={handleDownload}
          disabled={!columnCsv || loading}
        >
          <p>Download Data</p>
        </button>
      }
    />
  );
}

export default TopCreatorsCard;
