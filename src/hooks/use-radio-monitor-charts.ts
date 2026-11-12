"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getRadioMonitorCharts } from "@/actions/radio-monitor";

// Nested under the upload hook's key so a new upload refreshes the charts.
const RADIO_MONITOR_CHARTS_KEY = ["radio-monitor", "charts"];

export interface RadioChartRow {
  position: number;
  title: string;
  artist: string;
  plays: number;
  previousPlays: number | null;
  /** Places gained or lost since last week; null for new entries. */
  growth: number | null;
  lastWeek: number | null;
  peak: number | null;
  weeks: number | null;
  impressions: number | null;
}

export type RadioChartColumn = keyof Omit<RadioChartRow, "artist">;

interface SortConfig {
  column: RadioChartColumn;
  direction: "asc" | "desc";
}

const compareRows = (
  a: RadioChartRow,
  b: RadioChartRow,
  { column, direction }: SortConfig,
) => {
  const aValue = a[column];
  const bValue = b[column];
  // Empty cells stay at the bottom in both directions.
  if (aValue === null) return bValue === null ? 0 : 1;
  if (bValue === null) return -1;

  const order =
    typeof aValue === "string"
      ? aValue.localeCompare(String(bValue))
      : aValue - Number(bValue);
  return direction === "asc" ? order : -order;
};

export function useRadioMonitorCharts() {
  const [selectedStation, setSelectedStation] = useState<string>();
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: "position",
    direction: "asc",
  });

  const chartsQuery = useQuery({
    queryKey: RADIO_MONITOR_CHARTS_KEY,
    queryFn: async () => {
      const result = await getRadioMonitorCharts();
      if (!result.success) throw new Error(result.message);
      return result.charts;
    },
  });

  const charts = chartsQuery.data ?? [];
  const chart =
    charts.find((item) => item.station === selectedStation) ?? charts[0];

  const rows: RadioChartRow[] = (chart?.rows ?? [])
    .map((row) => ({
      ...row,
      growth: row.lastWeek === null ? null : row.lastWeek - row.position,
    }))
    .sort((a, b) => compareRows(a, b, sortConfig));

  const maxPlays = Math.max(1, ...rows.map((row) => row.plays));

  const handleSort = (column: RadioChartColumn) => {
    setSortConfig((current) => ({
      column,
      direction:
        current.column === column && current.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  return {
    charts,
    chart,
    rows,
    isLoading: chartsQuery.isLoading,
    error: chartsQuery.error?.message,
    selectStation: setSelectedStation,
    sortConfig,
    handleSort,
    playsIntensity: (plays: number) => Math.max(0.08, plays / maxPlays),
  };
}
