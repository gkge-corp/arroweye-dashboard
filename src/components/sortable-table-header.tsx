"use client";

import type { ComponentProps } from "react";

import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ColumnTone = "neutral" | "orange";

const activeBorderClassName: Record<ColumnTone, string> = {
  neutral: "border-x-neutral-600 dark:border-x-neutral-500",
  orange: "border-x-[#ee9a78] dark:border-x-[#dd6236]/70",
};

const headerRowClassName =
  "flex h-14 w-full min-w-20 items-center justify-center border-y border-neutral-200 bg-[#f6f6f6] px-2 text-center text-xs font-bold text-black uppercase outline-none transition-colors duration-150 dark:border-border dark:bg-zinc-900 dark:text-foreground";

/** Body cells of every column; keeps the highlight change smooth. */
export const sortableCellClassName = "transition-colors duration-150";

/** Body cells of the highlighted column: outlined and tinted to the last row. */
export const activeColumnClassName = (tone: ColumnTone = "neutral") =>
  cn(
    "border-x bg-[#dd6236]/[0.08] dark:bg-[#dd6236]/[0.12]",
    activeBorderClassName[tone],
  );

type SortableTableHeaderProps = {
  label: string;
  active?: boolean;
  sortDirection?: "asc" | "desc" | null;
  /** Leave out for a column that can't be sorted. */
  onSort?: () => void;
  /** Mouse and focus handlers from useActiveColumn's highlightProps. */
  highlightProps?: Pick<
    ComponentProps<"button">,
    "onMouseEnter" | "onMouseLeave" | "onFocus" | "onBlur"
  >;
  tone?: ColumnTone;
  className?: string;
};

export function SortableTableHeader({
  label,
  active = false,
  sortDirection,
  onSort,
  highlightProps,
  tone = "neutral",
  className,
}: SortableTableHeaderProps) {
  return (
    <TableHead
      aria-sort={
        sortDirection === "asc"
          ? "ascending"
          : sortDirection === "desc"
            ? "descending"
            : undefined
      }
      className={cn("z-10 h-auto bg-background p-0", className)}
    >
      {/* Band above the grey header row that holds the "Sorting by" tab. */}
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
      {onSort ? (
        <button
          type="button"
          onClick={onSort}
          {...highlightProps}
          className={cn(
            headerRowClassName,
            active &&
              cn(
                "border-x bg-[#f6e8e3] dark:bg-[#2a1d18]",
                activeBorderClassName[tone],
                tone === "neutral" && "text-[#dd6236] dark:text-[#dd6236]",
              ),
          )}
        >
          {label}
        </button>
      ) : (
        <div className={headerRowClassName}>{label}</div>
      )}
    </TableHead>
  );
}
