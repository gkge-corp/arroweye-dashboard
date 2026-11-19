import React, { type ComponentProps } from "react";
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

const ariaSort = (direction: TableHeader["sortDirection"]) =>
  direction === "asc"
    ? "ascending"
    : direction === "desc"
      ? "descending"
      : undefined;

/** Green header cell with the orange "Sorting by" tab above it, like Spots. */
const SortableHeaderCell = ({
  header,
  active,
}: {
  header: TableHeader;
  active: boolean;
}) => {
  const rowClassName = cn(
    "flex w-full items-center gap-1 bg-[#31bc86] px-4 py-[11px] font-medium transition-colors duration-150 dark:bg-[#17954c]",
    header.align === "center" && "justify-center",
    header.align === "right" && "justify-end",
    active && "border-x border-x-[#ee9a78] dark:border-x-[#dd6236]/70",
  );

  return (
    <th
      scope="col"
      aria-sort={ariaSort(header.sortDirection)}
      className={cn(
        "sticky top-0 z-10 bg-card p-0 lg:top-[var(--table-sticky-top,0px)]",
        getAlignmentClass(header.align),
        header.className,
      )}
    >
      <div className="flex h-8 items-end">
        <span
          className={cn(
            "flex h-full w-full items-center justify-center rounded-t-lg bg-[#dd6236] text-[10px] font-semibold tracking-wide text-white transition-opacity duration-150",
            active ? "opacity-100" : "opacity-0",
          )}
          aria-hidden={!active}
        >
          SORTING BY
        </span>
      </div>
      {header.onSort ? (
        <button
          type="button"
          onClick={header.onSort}
          {...header.highlightProps}
          className={cn(rowClassName, "cursor-pointer outline-none")}
        >
          {header.content}
        </button>
      ) : (
        <div className={rowClassName}>{header.content}</div>
      )}
    </th>
  );
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
  const hasSortableHeaders = headers.some((header) => header.onSort);

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
          <tr
            className={cn(
              "rounded-2xl text-center text-[16px] text-white",
              !hasSortableHeaders && "bg-[#31bc86] dark:bg-[#17954c]",
            )}
          >
            {headers.map((header, index) =>
              hasSortableHeaders ? (
                <SortableHeaderCell
                  key={index}
                  header={header}
                  active={index === activeColumn}
                />
              ) : (
                <th
                  key={index}
                  scope="col"
                  className={cn(
                    "sticky top-0 z-10 bg-[#31bc86] px-4 py-[11px] font-medium dark:bg-[#17954c] lg:top-[var(--table-sticky-top,0px)]",
                    getAlignmentClass(header.align),
                    header.className,
                  )}
                >
                  {header.content}
                </th>
              ),
            )}
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
