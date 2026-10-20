import React from "react";
import { cn } from "@/lib/utils";

export interface TableHeader {
  content: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
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
                className={cn(
                  "sticky top-[var(--table-sticky-top,0px)] z-10 bg-[#31bc86] px-4 py-[11px] font-medium dark:bg-[#17954c]",
                  getAlignmentClass(header.align),
                  header.className,
                )}
              >
                {header.content}
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
                      "border border-border px-4 py-[12px]",
                      highlightFirstCell && cellIndex === 0
                        ? "border-none bg-[#2ea879] text-white dark:bg-[#17954c]"
                        : "border-none bg-muted/60 text-foreground",
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
