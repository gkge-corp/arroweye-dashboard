import "server-only";

import { getDocumentProxy } from "unpdf";

export interface Top100Row {
  position: number;
  artist: string;
  title: string;
  plays: number;
  /** Null when the song did not chart the previous week ("-"). */
  previousPlays: number | null;
  /** Null when the cell is blank or "-". */
  impressions: number | null;
}

export interface Top100Chart {
  station: string;
  chart: string;
  period: string;
  rows: Top100Row[];
}

interface Cell {
  x: number;
  text: string;
}

const COLUMNS = [
  "Pos",
  "LW",
  "Org",
  "Artist",
  "Title",
  "Owner",
  "Plays",
  "Prev",
  "Imp's",
  "Trend",
] as const;

type Column = (typeof COLUMNS)[number];

// Data cells start a few points right of their header, so a cell belongs to
// the last header that begins at or before it.
const COLUMN_TOLERANCE = 6;

// Long titles run into the Owner column, e.g. "Lovers In A Past LifeSME".
const OWNER_SUFFIX = /(UMG|SME|WMG|Ind\.?)$/;

const INTEGER_PATTERN = /^\d+$/;

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

const readHeader = (cells: Cell[]) => {
  const header = new Map<Column, number>();
  for (const cell of cells) {
    const column = COLUMNS.find((name) => name === cell.text);
    if (column) header.set(column, cell.x);
  }
  return header.size === COLUMNS.length ? header : undefined;
};

const toColumns = (cells: Cell[], header: Map<Column, number>) => {
  const values: Partial<Record<Column, string>> = {};
  for (const cell of cells) {
    const column = [...COLUMNS]
      .reverse()
      .find((name) => header.get(name)! <= cell.x + COLUMN_TOLERANCE);
    if (!column) continue;
    values[column] = [values[column], cell.text].filter(Boolean).join(" ");
  }
  return values;
};

// "3.20m", "899,324" and "12.5k" are all printed in the Imp's column.
const parseImpressions = (text: string | undefined) => {
  const match = text?.replace(/,/g, "").match(/^(\d+(?:\.\d+)?)([km]?)$/i);
  if (!match) return null;
  const scale = { "": 1, k: 1_000, m: 1_000_000 }[match[2].toLowerCase()] ?? 1;
  return Math.round(Number(match[1]) * scale);
};

const splitOwnerSuffix = (title: string, owner: string | undefined) => {
  if (owner) return title;
  return title.replace(OWNER_SUFFIX, "").trim() || title;
};

const parseRow = (
  values: Partial<Record<Column, string>>,
): Top100Row | null => {
  const { Pos, Plays, Prev, Artist } = values;
  if (
    !INTEGER_PATTERN.test(Pos ?? "") ||
    !INTEGER_PATTERN.test(Plays ?? "") ||
    !Artist
  ) {
    return null;
  }

  return {
    position: Number(Pos),
    artist: Artist,
    title: splitOwnerSuffix(values.Title ?? "", values.Owner),
    plays: Number(Plays),
    previousPlays: INTEGER_PATTERN.test(Prev ?? "") ? Number(Prev) : null,
    impressions: parseImpressions(values["Imp's"]),
  };
};

/**
 * Reads a Radiomonitor "Top 100" PDF export. The page header prints
 * "NG | Cool FM 96.9 (Lagos)" then "Top 100 | Fri 18 - Sun 20 Sep 2026".
 */
export const parseTop100Chart = async (
  data: Uint8Array,
): Promise<Top100Chart> => {
  let station = "";
  let chart = "";
  let period = "";
  let header: Map<Column, number> | undefined;
  const rows: Top100Row[] = [];

  for (const cells of await readLines(data)) {
    const text = cells.map((cell) => cell.text).join(" ");

    if (cells[0]?.text === "Pos") {
      header = readHeader(cells) ?? header;
    } else if (!header && text.includes(" | ")) {
      const [left, right] = text.split(" | ").map((part) => part.trim());
      if (/^Top \d+$/i.test(left)) {
        chart ||= left;
        period ||= right;
      } else {
        station ||= right;
      }
    } else if (header) {
      const row = parseRow(toColumns(cells, header));
      if (row) rows.push(row);
    }
  }

  if (!station || !chart || !period || rows.length === 0) {
    throw new Error(
      "The radio monitor file is not a recognised Top 100 chart.",
    );
  }

  return { station, chart, period, rows };
};
