"use client";

import React from "react";

import { Skeleton } from "@/components/ui/skeleton";

export interface DataListColumn<Row> {
  key: string;
  header: string;
  render: (row: Row) => React.ReactNode;
  className?: string;
  /** CSS grid track, e.g. "40px". Defaults to an equal share of the row. */
  width?: string;
}

// Podium colours for the first three, plain outline for the rest.
const rankBadgeClass = (rank: number) => {
  if (rank === 1) return "border-[#e8b93b] bg-[#f5d372] text-black";
  if (rank === 2)
    return "border-neutral-300 bg-neutral-200 text-black dark:border-neutral-500 dark:bg-neutral-400";
  if (rank === 3) return "border-[#c08457] bg-[#d79b6b] text-black";
  return "border-border bg-transparent text-muted-foreground";
};

const RankBadge = ({ rank }: { rank: number }) => (
  <span
    className={`flex size-[26px] items-center justify-center rounded-full border font-SansFlex text-[11px] font-[600] ${rankBadgeClass(rank)}`}
  >
    {rank}
  </span>
);

export interface DataListEmptyAction {
  label: string;
  onClick: () => void;
}

interface DataListProps<Row> {
  title: string;
  label: string;
  columns: DataListColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row, index: number) => React.Key;
  loading?: boolean;
  emptyAction?: DataListEmptyAction;
  emptyMessage?: string;
  footer?: React.ReactNode;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  /** Prepends a "#" column numbering the rows from 1. */
  showRank?: boolean;
}

const gridTemplate = <Row,>(columns: DataListColumn<Row>[]) => ({
  gridTemplateColumns: columns
    .map((column) => column.width ?? "minmax(0, 1fr)")
    .join(" "),
});

export function DataList<Row>({
  title,
  label,
  columns,
  rows,
  getRowKey,
  loading = false,
  emptyAction,
  emptyMessage,
  footer,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  showRank = false,
}: DataListProps<Row>) {
  const hasRows = rows.length > 0;

  const rankColumn: DataListColumn<Row> = {
    key: "__rank",
    header: "#",
    width: "38px",
    render: () => null,
  };
  const allColumns = showRank ? [rankColumn, ...columns] : columns;

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-[20px]">
      <p className="!text-[12px] font-[400] tracking-[.1rem] text-foreground font-SansFlex uppercase">
        {title}
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-[4px]" />
          ))}
        </div>
      ) : hasRows ? (
        <div className="max-h-[400px] overflow-y-auto">
          <div
            className="grid gap-4 border-b py-[10px]"
            style={gridTemplate(allColumns)}
          >
            {allColumns.map((column) => (
              <p
                key={column.key}
                className="text-[11px] font-[700] tracking-[.08rem] text-foreground font-SansFlex uppercase"
              >
                {column.header}
              </p>
            ))}
          </div>

          {rows.map((row, index) => (
            <div
              key={getRowKey(row, index)}
              className="grid items-center gap-4 border-b py-[12px] last:border-b-0"
              style={gridTemplate(allColumns)}
            >
              {allColumns.map((column) => (
                <div
                  key={column.key}
                  className={`min-w-0 font-SansFlex text-[14px] ${column.className ?? ""}`}
                >
                  {column.key === "__rank" ? (
                    <RankBadge rank={index + 1} />
                  ) : (
                    column.render(row)
                  )}
                </div>
              ))}
            </div>
          ))}

          {hasMore && onLoadMore && (
            <button
              type="button"
              className="w-full cursor-pointer py-[12px] font-SansFlex text-[13px] font-[500] text-muted-foreground hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? "Loading…" : "See more"}
            </button>
          )}
        </div>
      ) : (
        <div className="flex h-[160px] flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed px-4 text-center">
          <p className="font-SansFlex text-[14px] text-muted-foreground">
            {emptyMessage ?? `No ${label} data yet`}
          </p>
          {emptyAction && (
            <button
              type="button"
              className="cursor-pointer font-SansFlex text-[14px] font-[500] text-foreground underline underline-offset-4 hover:text-orange-500"
              onClick={emptyAction.onClick}
            >
              {emptyAction.label}
            </button>
          )}
        </div>
      )}

      {footer && <div className="mt-auto">{footer}</div>}
    </div>
  );
}

export default DataList;
