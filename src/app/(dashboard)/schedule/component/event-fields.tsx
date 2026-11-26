"use client";

import React from "react";
import { CalendarDays, ChevronDown, CircleX, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TimeOption } from "../utils/event-date-time";

export const eventFieldClassName =
  "!h-10 !rounded-lg !border-zinc-200 !bg-white !text-[14px] !text-zinc-950 !shadow-none placeholder:!text-zinc-400 focus-visible:!ring-2 focus-visible:!ring-violet-500/25 dark:!border-zinc-700 dark:!bg-zinc-800 dark:!text-zinc-100";

export const triggerClassName =
  "flex h-10 w-full items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 text-left text-[14px] text-zinc-950 shadow-none focus:outline-none focus:ring-2 focus:ring-violet-500/25 disabled:cursor-not-allowed disabled:opacity-60 data-[placeholder]:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

export const iconClassName = "size-4 shrink-0 text-zinc-500 dark:text-zinc-400";

// Input always renders an (empty) label row above the field, offsetting it by 8px.
export const inputSlotClassName = "absolute top-2 flex h-10 items-center";

export const FieldLabel = ({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) => (
  <label
    htmlFor={htmlFor}
    className="mb-1.5 block text-[13px] text-zinc-500 dark:text-zinc-400"
  >
    {children}
  </label>
);

export const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1.5 text-sm text-red-500">{message}</p> : null;

export const ClearButton = ({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) => (
  <button
    type="button"
    onClick={onClear}
    className={cn(
      inputSlotClassName,
      "right-3 text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400",
    )}
  >
    <CircleX className="size-4" />
    <span className="sr-only">Clear {label}</span>
  </button>
);

export const TimeSelect = ({
  id,
  value,
  options,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  options: TimeOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) => (
  <Select value={value} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger id={id} className={cn(triggerClassName, "justify-between")}>
      {/* div, not span: SelectTrigger line-clamps direct span children, stacking them */}
      <div className="flex items-center gap-3">
        <Clock className={iconClassName} />
        <SelectValue placeholder="Select time" />
      </div>
    </SelectTrigger>
    <SelectContent className="max-h-64">
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

interface EventDateTimeFieldsProps {
  dateLabel: string;
  selectedDate?: Date;
  isDatePickerOpen: boolean;
  onDatePickerOpenChange: (open: boolean) => void;
  onDateSelect: (date?: Date) => void;
  startTime: string;
  endTime: string;
  startTimeOptions: TimeOption[];
  endTimeOptions: TimeOption[];
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  dateError?: string;
  endError?: string;
  fullWidthDate?: boolean;
}

export const EventDateTimeFields = ({
  dateLabel,
  selectedDate,
  isDatePickerOpen,
  onDatePickerOpenChange,
  onDateSelect,
  startTime,
  endTime,
  startTimeOptions,
  endTimeOptions,
  onStartTimeChange,
  onEndTimeChange,
  dateError,
  endError,
  fullWidthDate = false,
}: EventDateTimeFieldsProps) => (
  <>
    <div className={cn(!fullWidthDate && "sm:w-1/2 sm:pr-1.5")}>
      <FieldLabel>Date</FieldLabel>
      <Popover open={isDatePickerOpen} onOpenChange={onDatePickerOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(triggerClassName, dateError && "border-red-500")}
          >
            <CalendarDays className={iconClassName} />
            <span
              className={cn("flex-1 truncate", !dateLabel && "text-zinc-400")}
            >
              {dateLabel || "Select date"}
            </span>
            <ChevronDown className="size-4 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={onDateSelect}
            disabled={{ before: new Date() }}
            className="[--cell-size:--spacing(9)]"
          />
        </PopoverContent>
      </Popover>
      <FieldError message={dateError} />
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <FieldLabel htmlFor="event-start-time">Start time</FieldLabel>
        <TimeSelect
          id="event-start-time"
          value={startTime}
          options={startTimeOptions}
          onChange={onStartTimeChange}
        />
      </div>
      <div>
        <FieldLabel htmlFor="event-end-time">End time</FieldLabel>
        <TimeSelect
          id="event-end-time"
          value={endTime}
          options={endTimeOptions}
          onChange={onEndTimeChange}
        />
        <FieldError message={endError} />
      </div>
    </div>
  </>
);

export const CountedTextarea = ({
  id,
  name,
  label,
  value,
  maxLength,
  placeholder,
  error,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  value?: string | null;
  maxLength: number;
  placeholder?: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) => (
  <div>
    <FieldLabel htmlFor={id}>{label}</FieldLabel>
    <textarea
      id={id}
      name={name}
      rows={3}
      maxLength={maxLength}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      className="block w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[14px] text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
    />
    <div className="mt-1.5 flex justify-between gap-2">
      <FieldError message={error} />
      <span className="ml-auto text-[13px] text-zinc-400">
        {value?.length ?? 0}/{maxLength}
      </span>
    </div>
  </div>
);
