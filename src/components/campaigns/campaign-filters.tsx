"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CampaignFiltersState } from "@/hooks/use-campaign-filters";

const formatDateRange = (range: DateRange | undefined) => {
  if (!range?.from) return "Start date";

  const from = format(range.from, "MMM d, yyyy");
  if (!range.to) return from;

  return `${from} - ${format(range.to, "MMM d, yyyy")}`;
};

interface CampaignFiltersProps {
  state: CampaignFiltersState;
}

export default function CampaignFilters({ state }: CampaignFiltersProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { filters, setDateRange, clearFilters, hasFilters } = state;

  return (
    <div className="my-4 flex flex-wrap items-center gap-[5px] md:gap-[10px]">
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label="Filter by start date"
            className="h-[40px] w-60 justify-start rounded-full px-4 text-left text-sm font-normal shadow-none"
          >
            <CalendarDays className="text-muted-foreground mr-2 size-4" />
            <span className="truncate">
              {formatDateRange(filters.dateRange)}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-auto max-w-[calc(100vw-2rem)] overflow-auto p-0"
        >
          <Calendar
            mode="range"
            selected={filters.dateRange}
            onSelect={setDateRange}
            defaultMonth={filters.dateRange?.from}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        disabled={!hasFilters}
        className="h-[40px] rounded-full bg-black px-4 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        onClick={clearFilters}
      >
        Clear Filters
      </Button>
    </div>
  );
}
