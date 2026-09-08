"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import { DataList, type DataListColumn } from "@/components/ui/data-list";
import { downloadCsv, type CsvColumn } from "@/lib/csv";

export interface SocialTractionRow {
  id: string;
  platform: string;
  metric: string;
  value: number | null;
  evolution: number | null;
  percentEvolution: number | null;
  updatedAt: string | null;
}

interface SocialTractionCardProps {
  rows: SocialTractionRow[];
  periodDays?: number;
  loading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  onLinkSong?: () => void;
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
  onRetry,
  onLinkSong,
}: SocialTractionCardProps) {
  const columns = useMemo(() => getColumns(periodDays), [periodDays]);
  const downloadableRows = rows.filter((row) => row.value !== null);

  const handleDownload = () => {
    if (downloadableRows.length === 0) {
      toast.error("No data to download");
      return;
    }

    downloadCsv(
      "social-traction.csv",
      csvColumns(periodDays),
      downloadableRows,
    );
  };

  const emptyAction = hasError
    ? onRetry
      ? { label: "Try again", onClick: onRetry }
      : undefined
    : onLinkSong
      ? { label: "Link this song", onClick: onLinkSong }
      : undefined;

  return (
    <DataList
      title="Social Traction"
      label="social platform"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loading={loading}
      emptyMessage={
        hasError
          ? "Social data is temporarily unavailable"
          : "Link this song to load social data"
      }
      emptyAction={emptyAction}
      footer={
        <button
          type="button"
          className="p-2 font-SansFlex text-[16px] font-[500] w-full rounded-full text-white dark:text-zinc-950 text-center cursor-pointer hover:bg-orange-500 dark:hover:bg-orange-500 dark:hover:text-white bg-black dark:bg-zinc-100 inline-flex items-center gap-2 justify-center disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black dark:disabled:hover:bg-zinc-100 active:scale-[0.97]"
          onClick={handleDownload}
          disabled={downloadableRows.length === 0 || loading}
        >
          <p>Download Data</p>
        </button>
      }
    />
  );
}

export default SocialTractionCard;
