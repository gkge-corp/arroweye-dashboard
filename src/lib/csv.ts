export interface CsvColumn<Row> {
  header: string;
  value: (row: Row, index: number) => string | number | null | undefined;
}

// Playlist and station names routinely contain commas and quotes, so every
// field is escaped per RFC 4180 rather than joined raw.
const escapeCell = (value: string | number | null | undefined) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const buildCsv = <Row>(columns: CsvColumn<Row>[], rows: Row[]) =>
  [
    columns.map((column) => escapeCell(column.header)).join(","),
    ...rows.map((row, index) =>
      columns.map((column) => escapeCell(column.value(row, index))).join(","),
    ),
  ].join("\r\n");

export interface CsvSection {
  title: string;
  csv: string;
}

/**
 * Several tables in one file: each under its own title line, separated by a
 * blank row, so a whole insight column exports as a single download.
 */
export const buildCsvSections = (sections: CsvSection[]) =>
  sections
    .map((section) => `${escapeCell(section.title)}\r\n${section.csv}`)
    .join("\r\n\r\n");

export const saveCsv = (filename: string, csv: string) => {
  // The BOM keeps Excel from mangling non-ASCII station and playlist names.
  const blob = new Blob(["﻿", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const downloadCsv = <Row>(
  filename: string,
  columns: CsvColumn<Row>[],
  rows: Row[],
) => saveCsv(filename, buildCsv(columns, rows));
