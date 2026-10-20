"use client";

import { format } from "date-fns";
import { useScheduleCalendar } from "@/app/(dashboard)/schedule/hooks/use-schedule-calendar";
import { getEventStatusOption } from "@/app/(dashboard)/schedule/utils/event-status";

const formatEventDate = (value?: string | null) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? format(date, "EEE, MMM d · h:mm a")
    : "No date set";
};

export const useCampaignSchedule = (projectId?: number) => {
  const schedule = useScheduleCalendar({ projectId });

  const campaignEvents = [...schedule.events]
    .sort(
      (a, b) =>
        new Date(a.start ?? 0).getTime() - new Date(b.start ?? 0).getTime(),
    )
    .map((event) => ({
      id: event.id,
      title: event.title?.trim() || "Untitled event",
      dateLabel: formatEventDate(event.start),
      location: event.location?.trim(),
      status: getEventStatusOption(event.status),
      details: event,
    }));

  return { ...schedule, campaignEvents };
};

export type CampaignScheduleState = ReturnType<typeof useCampaignSchedule>;
