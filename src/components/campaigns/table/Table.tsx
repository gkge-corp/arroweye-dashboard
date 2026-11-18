import React, { type ComponentProps } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { activeColumnClassName } from "@/components/sortable-table-header";

export interface TableHeader {
  content: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  /** Makes the header a button; leave out for columns that can't be sorted. */
  onSort?: () => void;
  sortDirection?: "asc" | "desc" | null;
  /** Mouse and focus handlers from useActiveColumn's highlightProps. */
  highlightProps?: Pick<
    ComponentProps<"button">,
    "onMouseEnter" | "onMouseLeave" | "onFocus" | "onBlur"
  >;
}

export interface TableRow {
  id?: string | number;
  data: React.ReactNode[];
  className?: string;
}

interface TableProps {
  headers?: TableHeader[];
  rows?: TableRow[];
  className?: string;
  emptyState?: React.ReactNode;
  highlightFirstCell?: boolean;
  /** Index of the column outlined in orange (hovered or sorted). */
  activeColumn?: number | null;
  "aria-label"?: string;
}

const getAlignmentClass = (align?: TableHeader["align"]) => {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
};

const Table: React.FC<TableProps> = ({
  headers = [],
  rows = [],
  className = "",
  emptyState = "No data available",
  highlightFirstCell = false,
  activeColumn = null,
  "aria-label": ariaLabel,
}) => {
  const columnCount = Math.max(headers.length, 1);

  // On desktop, clip instead of scroll so the sticky header follows the page scroll.
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-[8px] border border-border bg-card lg:overflow-x-clip",
        className,
      )}
    >
      <table
        className="w-full table-auto text-foreground"
        aria-label={ariaLabel}
      >
        <thead>
          <tr className="rounded-2xl bg-[#31bc86] text-center text-[16px] text-white dark:bg-[#17954c]">
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                aria-sort={
                  header.sortDirection === "asc"
                    ? "ascending"
                    : header.sortDirection === "desc"
                      ? "descending"
                      : undefined
                }
                className={cn(
                  "sticky top-0 z-10 lg:top-[var(--table-sticky-top,0px)] bg-[#31bc86] px-4 py-[11px] font-medium transition-colors duration-150 dark:bg-[#17954c]",
                  getAlignmentClass(header.align),
                  // The sort button carries the padding so the whole cell is clickable.
                  header.onSort && "p-0",
                  index === activeColumn &&
                    "border-x border-x-[#ee9a78] dark:border-x-[#dd6236]/70",
                  header.className,
                )}
              >
                {header.onSort ? (
                  <button
                    type="button"
                    onClick={header.onSort}
                    {...header.highlightProps}
                    className="flex w-full cursor-pointer items-center gap-1 px-4 py-[11px] outline-none"
                  >
                    {header.content}
                    {header.sortDirection === "asc" && (
                      <ArrowUp className="size-4" aria-hidden="true" />
                    )}
                    {header.sortDirection === "desc" && (
                      <ArrowDown className="size-4" aria-hidden="true" />
                    )}
                  </button>
                ) : (
                  header.content
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columnCount}
                className="border border-border px-4 py-[11px] text-center text-muted-foreground"
              >
                {emptyState}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={row.id ?? rowIndex}
                className={cn(
                  "bg-card text-center text-[16px] font-normal text-foreground hover:bg-muted/70",
                  row.className,
                )}
              >
                {row.data.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      "border border-border px-4 py-[12px] transition-colors duration-150",
                      highlightFirstCell && cellIndex === 0
                        ? "border-none bg-[#2ea879] text-white dark:bg-[#17954c]"
                        : "border-none bg-muted/60 text-foreground",
                      cellIndex === activeColumn &&
                        cn(activeColumnClassName("orange"), "border-solid"),
                      // The green first column keeps its fill; only the outline shows.
                      highlightFirstCell &&
                        cellIndex === 0 &&
                        "bg-[#2ea879] dark:bg-[#17954c]",
                      getAlignmentClass(headers[cellIndex]?.align),
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
