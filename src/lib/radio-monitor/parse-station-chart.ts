import "server-only";

import { getDocumentProxy } from "unpdf";

export interface StationChartRow {
  position: number;
  artist: string;
  title: string;
  plays: number;
  /** Plays per monitored station, aligned with `StationChart.stations`. */
  stationPlays: number[];
}

export interface StationChart {
  station: string;
  period: string;
  comparedPeriod: string;
  /** Empty when the merged header could not be split into one name per column. */
  stations: string[];
  rows: StationChartRow[];
}

interface Cell {
  x: number;
  text: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const COUNT_PATTERN = /^(?:\d+|-)$/;

const toCount = (text: string) => (text === "-" ? 0 : Number(text));

// Cells sharing a baseline form one table row, read left to right.
const readLines = async (data: Uint8Array) => {
  const pdf = await getDocumentProxy(data);
  const lines: Cell[][] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const { items } = await page.getTextContent();
    const byBaseline = new Map<number, Cell[]>();

    for (const item of items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const cells = byBaseline.get(y) ?? [];
      cells.push({ x: item.transform[4], text: item.str.trim() });
      byBaseline.set(y, cells);
    }

    [...byBaseline.entries()]
      .sort(([a], [b]) => b - a)
      .forEach(([, cells]) => lines.push(cells.sort((a, b) => a.x - b.x)));
  }

  return lines;
};

/**
 * The header prints every station name in one run of text, e.g.
 * "88.5 UFM (Lagos) Cool FM 96.9 (Lagos) City 105.1 FM". The first column is
 * always the chart's own station; the rest are split after each ")" and only
 * trusted when that yields one name per column.
 */
const splitStationNames = (
  header: string,
  chartStation: string,
  columnCount: number,
) => {
  if (!header.startsWith(chartStation)) return [];

  const others = header
    .slice(chartStation.length)
    .trim()
    .split(/(?<=\))\s+/)
    .filter(Boolean);
  const names = [chartStation, ...others];
  return names.length === columnCount ? names : [];
};

const parseRow = (cells: Cell[], titleX: number | undefined) => {
  const dateIndex = cells.findIndex((cell) => DATE_PATTERN.test(cell.text));
  const counts = cells.slice(dateIndex + 1).map((cell) => cell.text);
  if (
    !/^\d+$/.test(cells[0]?.text ?? "") ||
    dateIndex < 2 ||
    counts.length < 2 ||
    !counts.every((count) => COUNT_PATTERN.test(count))
  ) {
    return null;
  }

  const names = cells.slice(1, dateIndex);
  const splitAt =
    titleX === undefined
      ? 1
      : Math.max(1, names.findIndex((cell) => cell.x >= titleX - 2));

  return {
    position: Number(cells[0].text),
    artist: names
      .slice(0, splitAt)
      .map((cell) => cell.text)
      .join(" "),
    title: names
      .slice(splitAt)
      .map((cell) => cell.text)
      .join(" "),
    plays: toCount(counts[0]),
    stationPlays: counts.slice(1).map(toCount),
  };
};

/** Reads a Radiomonitor "Station Chart" PDF export into rows. */
export const parseStationChart = async (
  data: Uint8Array,
): Promise<StationChart> => {
  let station = "";
  let period = "";
  let comparedPeriod = "";
  let stationHeader = "";
  let titleX: number | undefined;
  const rows: StationChartRow[] = [];

  for (const cells of await readLines(data)) {
    const text = cells.map((cell) => cell.text).join(" ");

    if (!station && text.includes(" | ")) {
      [station, period] = text.split(" | ").map((part) => part.trim());
    } else if (!comparedPeriod && text.startsWith("Compared to ")) {
      comparedPeriod = text.slice("Compared to ".length).trim();
    } else if (cells[0]?.text === "Pos") {
      titleX = cells.find((cell) => cell.text === "Title")?.x;
      stationHeader ||= text.replace(/^.*?\bPlays\s*/, "").trim();
    } else {
      const row = parseRow(cells, titleX);
      if (row) rows.push(row);
    }
  }

  if (!station || !period || rows.length === 0) {
    throw new Error("The radio monitor file is not a recognised station chart.");
  }

  return {
    station,
    period,
    comparedPeriod,
    stations: splitStationNames(
      stationHeader,
      station,
      rows[0].stationPlays.length,
    ),
    rows,
  };
};
