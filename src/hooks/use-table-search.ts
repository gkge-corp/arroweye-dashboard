"use client";

import { useDeferredValue, useMemo, useState } from "react";

// Strips accents so "alte" matches "ALTÉ".
const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const toTerms = (query: string) =>
  normalize(query).split(/\s+/).filter(Boolean);

/**
 * Search box state. Rows filter against the deferred query, so typing stays
 * responsive while a long table re-renders behind it.
 */
export function useSearchQuery() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  return {
    query,
    setQuery,
    deferredQuery,
    isSearching: query.trim().length > 0,
  };
}

/**
 * Rows matching every word of `query` (in any field, any order). The text of
 * each row is normalised once per `rows` change, not on every keystroke, so
 * `rows` and `getSearchText` should be stable references.
 */
export function useSearchFilter<T>(
  rows: T[],
  query: string,
  getSearchText: (row: T) => (string | number | null | undefined)[],
) {
  const index = useMemo(
    () =>
      rows.map((row) => ({
        row,
        text: normalize(getSearchText(row).filter(Boolean).join(" ")),
      })),
    [rows, getSearchText],
  );

  return useMemo(() => {
    const terms = toTerms(query);
    if (terms.length === 0) return rows;

    return index
      .filter(({ text }) => terms.every((term) => text.includes(term)))
      .map(({ row }) => row);
  }, [index, query, rows]);
}
