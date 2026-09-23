"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import { DataList, type DataListColumn } from "@/components/ui/data-list";
import { saveCsv, type CsvColumn } from "@/lib/csv";

import { buildSocialColumnCsv, type ColumnSummary } from "./social-column-csv";
import { TopCreatorsList, type CreatorRow } from "./top-creators-list";

export interface SocialTractionRow {
  id: string;
  platform: string;
  metric: string;
  value: number | null;
  evolution: number | null;
  percentEvolution: number | null;
  updatedAt: string | null;
  topMarket?: string | null;
}

interface SocialTractionCardProps {
  rows: SocialTractionRow[];
  periodDays?: number;
  loading?: boolean;
  hasError?: boolean;
  isLinked?: boolean;
  onRetry?: () => void;
  onLinkSong?: () => void;
  creators?: CreatorRow[];
  creatorsLoading?: boolean;
  /** Charts above the card in the same column, included in its download. */
  summaries?: ColumnSummary[];
}

const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatEvolution = (value: number) =>
  `${value > 0 ? "+" : ""}${compactNumber.format(value)}`;

const evolutionClassName = (value: number) => {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
};

const csvColumns = (periodDays: number): CsvColumn<SocialTractionRow>[] => [
  { header: "Platform", value: (row) => row.platform },
  { header: "Metric", value: (row) => row.metric },
  { header: "Current", value: (row) => row.value },
  {
    header: `${periodDays}-day growth`,
    value: (row) => row.evolution,
  },
  { header: "Updated", value: (row) => row.updatedAt },
];

const getColumns = (
  periodDays: number,
): DataListColumn<SocialTractionRow>[] => [
  {
    key: "platform",
    header: "Platform",
    render: (row) => (
      <span className="block min-w-0" title={`${row.platform} · ${row.metric}`}>
        <span className="block truncate font-[600] text-foreground">
          {row.platform}
        </span>
        <span className="block truncate text-[12px] text-muted-foreground">
          {row.metric}
        </span>
      </span>
    ),
  },
  {
    key: "audience",
    header: `Current · ${periodDays}-day growth`,
    width: "118px",
    render: (row) => {
      if (row.value === null) {
        return (
          <span className="block min-w-0">
            <span className="block truncate font-[600] text-muted-foreground">
              No data
            </span>
            <span className="block truncate text-[12px] text-muted-foreground">
              Not linked
            </span>
          </span>
        );
      }

      return (
        <span className="block min-w-0">
          <span
            className="block truncate font-[600] text-foreground"
            title={row.value.toLocaleString()}
          >
            {compactNumber.format(row.value)}
          </span>
          <span
            className={`block truncate text-[12px] ${evolutionClassName(row.evolution ?? 0)}`}
            title={(row.evolution ?? 0).toLocaleString()}
          >
            {formatEvolution(row.evolution ?? 0)}
          </span>
        </span>
      );
    },
  },
];

export function SocialTractionCard({
  rows,
  periodDays = 30,
  loading = false,
  hasError = false,
  isLinked = false,
  onRetry,
  onLinkSong,
  creators = [],
  creatorsLoading = false,
  summaries = [],
}: SocialTractionCardProps) {
  const columns = useMemo(() => getColumns(periodDays), [periodDays]);
  const visibleRows = rows.filter((row) => row.value !== null);

  const columnCsv = buildSocialColumnCsv({
    summaries,
    traction: visibleRows,
    tractionColumns: csvColumns(periodDays),
    creators,
  });

  const handleDownload = () => {
    if (!columnCsv) {
      toast.error("No data to download");
      return;
    }

    saveCsv("social-media.csv", columnCsv);
  };

  // Hidden rather than shown empty: most songs have no creators until they
  // take off on social, and an empty second list adds noise.
  const showCreators = isLinked && (creatorsLoading || creators.length > 0);

  const emptyAction = hasError
    ? onRetry
      ? { label: "Try again", onClick: onRetry }
      : undefined
    : !isLinked && onLinkSong
      ? { label: "Link this song", onClick: onLinkSong }
      : undefined;

  return (
    <DataList
      title="Social Traction"
      label="social platform"
      columns={columns}
      rows={visibleRows}
      getRowKey={(row) => row.id}
      loading={loading}
      emptyMessage={
        hasError
          ? "Social data is temporarily unavailable"
          : isLinked
            ? "No social traction data is available for this song"
            : "Link this song to load social data"
      }
      emptyAction={emptyAction}
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
    >
      {showCreators && (
        <TopCreatorsList creators={creators} loading={creatorsLoading} />
      )}
    </DataList>
  );
}

export default SocialTractionCard;
