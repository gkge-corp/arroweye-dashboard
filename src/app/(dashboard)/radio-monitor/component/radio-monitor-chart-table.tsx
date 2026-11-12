"use client";

import type { CSSProperties } from "react";

import {
  activeColumnClassName,
  SortableTableHeader,
  sortableCellClassName,
} from "@/components/sortable-table-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveColumn } from "@/hooks/use-active-column";
import { useElementHeight } from "@/hooks/use-element-height";
import {
  useRadioMonitorCharts,
  type RadioChartColumn,
  type RadioChartRow,
} from "@/hooks/use-radio-monitor-charts";
import { cn } from "@/lib/utils";

import { MovementPill } from "../../payments/component/SpinsTableComponent";

type RadioCharts = ReturnType<typeof useRadioMonitorCharts>;

// Station and national exports print different columns, so optional ones
// only show when the chart has values for them.
const tableHeaders: {
  label: string;
  key: RadioChartColumn;
  optional?: boolean;
}[] = [
  { label: "POSITION", key: "position" },
  { label: "SONG", key: "title" },
  { label: "PLAYS", key: "plays" },
  { label: "PREV", key: "previousPlays", optional: true },
  { label: "LW", key: "lastWeek", optional: true },
  { label: "PEAK", key: "peak", optional: true },
  { label: "WOC", key: "weeks", optional: true },
  { label: "GROWTH", key: "growth", optional: true },
  { label: "IMPRESSIONS", key: "impressions", optional: true },
];

const cellClassName =
  "border-b border-neutral-200 px-3 py-5 text-center text-sm whitespace-normal text-neutral-800 uppercase dark:border-border dark:text-foreground";

const numberFormat = new Intl.NumberFormat("en-US");

const formatNumber = (value: number | null) =>
  value === null ? "—" : numberFormat.format(value);

const stationLabel = (chart: { countryCode: string; station: string }) =>
  chart.countryCode ? `${chart.countryCode} · ${chart.station}` : chart.station;

const visibleHeaders = (rows: RadioChartRow[]) =>
  tableHeaders.filter(
    (header) => !header.optional || rows.some((row) => row[header.key] !== null),
  );

function ChartCell({
  row,
  column,
}: {
  row: RadioChartRow;
  column: RadioChartColumn;
}) {
  switch (column) {
    case "title":
      return (
        <>
          <span className="font-semibold">{row.title || "—"}</span>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {row.artist}
          </div>
        </>
      );
    case "growth":
      return <MovementPill movement={row.growth} />;
    default:
      return formatNumber(row[column]);
  }
}

function StationPicker({ charts }: { charts: RadioCharts }) {
  if (!charts.chart) return null;

  return (
    <div className="flex flex-col items-center gap-1 px-5 py-2 text-center">
      <Select value={charts.chart.station} onValueChange={charts.selectStation}>
        <SelectTrigger
          className="h-11 w-72 max-w-full rounded-2xl"
          aria-label="Station"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {charts.charts.map((chart) => (
            <SelectItem key={chart.station} value={chart.station}>
              {stationLabel(chart)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {[charts.chart.chart, charts.chart.period].filter(Boolean).join(" · ")}
      </p>
    </div>
  );
}

function ChartTable({ charts }: { charts: RadioCharts }) {
  const { activeColumn, highlightProps } = useActiveColumn<RadioChartColumn>(
    charts.sortConfig.column,
  );
  const headers = visibleHeaders(charts.rows);

  const columnClassName = (key: RadioChartColumn) =>
    cn(
      cellClassName,
      sortableCellClassName,
      activeColumn === key && activeColumnClassName(),
    );

  return (
    <div className="overflow-x-auto lg:overflow-x-clip">
      {/* Plain table: the ui Table wrapper scrolls, which breaks the sticky header. */}
      <table
        className="w-full min-w-[800px] table-auto text-xs lg:min-w-0"
        aria-label="Radio chart"
      >
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {headers.map((header) => (
              <SortableTableHeader
                key={header.key}
                label={header.label}
                active={activeColumn === header.key}
                sortDirection={
                  charts.sortConfig.column === header.key
                    ? charts.sortConfig.direction
                    : null
                }
                onSort={() => charts.handleSort(header.key)}
                highlightProps={highlightProps(header.key)}
                className="sticky top-[var(--radio-table-top,0px)]"
              />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {charts.rows.map((row) => (
            <TableRow
              key={`${row.position}-${row.title}-${row.artist}`}
              className="border-0 hover:bg-transparent"
            >
              {headers.map(({ key }) => (
                <TableCell
                  key={key}
                  className={cn(
                    columnClassName(key),
                    key === "plays" &&
                      "font-bold text-black dark:text-foreground",
                  )}
                  style={
                    key === "plays"
                      ? {
                          backgroundColor: `rgba(230, 90, 40, ${
                            0.08 + charts.playsIntensity(row.plays) * 0.22
                          })`,
                        }
                      : undefined
                  }
                >
                  <ChartCell row={row} column={key} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </table>
    </div>
  );
}

// The picker sticks below the page header, and the table header below both.
function ChartView({ charts }: { charts: RadioCharts }) {
  const picker = useElementHeight<HTMLDivElement>();

  return (
    <div
      style={
        {
          "--radio-table-top": `calc(var(--radio-header-height, 0px) + ${picker.height}px)`,
        } as CSSProperties
      }
    >
      <div
        ref={picker.ref}
        className="sticky top-[var(--radio-header-height,0px)] z-20 bg-background"
      >
        <StationPicker charts={charts} />
      </div>
      <ChartTable charts={charts} />
    </div>
  );
}

const SKELETON_ROWS = 8;

function ChartTableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading radio chart">
      <div className="flex flex-col items-center gap-1 px-5 py-2">
        <Skeleton className="h-11 w-72 max-w-full rounded-2xl" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="overflow-x-auto lg:overflow-x-clip">
        <table className="w-full min-w-[800px] table-auto text-xs lg:min-w-0">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {tableHeaders.map((header) => (
                <SortableTableHeader key={header.key} label={header.label} />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: SKELETON_ROWS }, (_, row) => (
              <TableRow key={row} className="border-0 hover:bg-transparent">
                {tableHeaders.map(({ key }) => (
                  <TableCell key={key} className={cellClassName}>
                    {key === "title" ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    ) : (
                      <Skeleton className="mx-auto h-4 w-10" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </table>
      </div>
    </div>
  );
}

const messageClassName =
  "rounded-[8px] border px-4 py-3 text-center text-sm text-muted-foreground";

export function RadioMonitorChartTable() {
  const charts = useRadioMonitorCharts();

  return (
    <section className="flex w-full flex-col">
      {charts.isLoading ? (
        <ChartTableSkeleton />
      ) : charts.error ? (
        <p
          className={cn(
            messageClassName,
            "m-6 border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
          )}
        >
          {charts.error}
        </p>
      ) : !charts.chart ? (
        <p className={cn(messageClassName, "m-6 border-dashed")}>
          No charts could be read from the uploaded files yet.
        </p>
      ) : (
        <ChartView charts={charts} />
      )}
    </section>
  );
}
