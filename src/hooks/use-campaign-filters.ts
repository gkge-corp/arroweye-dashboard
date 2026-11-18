"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

export interface CampaignFilters {
  dateRange: DateRange | undefined;
}

const toDayKey = (date: Date) => format(date, "yyyy-MM-dd");

/** True when the date's day falls inside the range (or no range is set). */
export function isWithinDateRange(
  date: string | null | undefined,
  range: DateRange | undefined,
) {
  if (!range?.from) return true;
  if (!date) return false;

  const day = date.slice(0, 10);
  const from = toDayKey(range.from);
  const to = toDayKey(range.to ?? range.from);

  return day >= from && day <= to;
}

export function useCampaignFilters() {
  const [dateRange, setDateRange] = useState<DateRange>();

  const clearFilters = () => {
    setDateRange(undefined);
  };

  return {
    filters: { dateRange } satisfies CampaignFilters,
    setDateRange,
    clearFilters,
    hasFilters: dateRange?.from !== undefined,
  };
}

export type CampaignFiltersState = ReturnType<typeof useCampaignFilters>;
