"use client";

import { useState } from "react";

export interface TableSort<K extends string> {
  column: K | null;
  direction: "asc" | "desc";
}

const compareValues = (a: unknown, b: unknown) =>
  typeof a === "number" && typeof b === "number"
    ? a - b
    : String(a ?? "").localeCompare(String(b ?? ""));

/** Rows in the order of `sort`; unchanged when no column is sorted. */
export function sortRows<T, K extends string>(
  rows: T[],
  { column, direction }: TableSort<K>,
  getValue: (row: T, column: K) => unknown,
) {
  if (!column) return rows;

  const sorted = [...rows].sort((a, b) =>
    compareValues(getValue(a, column), getValue(b, column)),
  );
  return direction === "asc" ? sorted : sorted.reverse();
}

/** Click a column to sort ascending; click it again to flip the direction. */
export function useTableSort<K extends string>() {
  const [sort, setSort] = useState<TableSort<K>>({
    column: null,
    direction: "asc",
  });

  const toggleSort = (column: K) => {
    setSort((current) => ({
      column,
      direction:
        current.column === column && current.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  return { sort, toggleSort };
}
