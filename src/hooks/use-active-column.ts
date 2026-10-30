"use client";

import { useState } from "react";

/**
 * Column highlighted in a sortable table: the hovered or focused header,
 * otherwise the sorted (or default) column.
 */
export function useActiveColumn<K extends string>(fallbackColumn: K | null) {
  const [hoveredColumn, setHoveredColumn] = useState<K | null>(null);

  const highlightProps = (key: K) => ({
    onMouseEnter: () => setHoveredColumn(key),
    onMouseLeave: () => setHoveredColumn(null),
    onFocus: () => setHoveredColumn(key),
    onBlur: () => setHoveredColumn(null),
  });

  return {
    activeColumn: hoveredColumn ?? fallbackColumn,
    highlightProps,
  };
}
