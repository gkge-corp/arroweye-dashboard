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

export const downloadCsv = <Row>(
  filename: string,
  columns: CsvColumn<Row>[],
  rows: Row[],
) => {
  // The BOM keeps Excel from mangling non-ASCII station and playlist names.
  const blob = new Blob(["﻿", buildCsv(columns, rows)], {
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
