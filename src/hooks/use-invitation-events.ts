"use client";

import { useQuery } from "@tanstack/react-query";

import { toMailerZoneParts } from "@/lib/mailer/schedule-dates";
import { getEvents } from "@/services/api/schedule";
import type { Event } from "@/types/api";
import type { InvitationFields } from "@/types/mailer";

export type InvitationEventFields = Pick<
  InvitationFields,
  "title" | "date" | "startTime" | "endTime" | "location"
>;

export const toInvitationEventFields = (event: Event): InvitationEventFields => {
  // Lagos time, not the sender's browser zone, so every sender fills the same times.
  const start = toMailerZoneParts(event.start_dte);
  const end = toMailerZoneParts(event.end_dte);

  return {
    title: event.title,
    date: start.date,
    startTime: start.time,
    // Multi-day events only show their start time; the template has one date.
    endTime: end.date === start.date ? end.time : "",
    location: event.location ?? "",
  };
};

const isUpcoming = (event: Event) =>
  new Date(event.end_dte || event.start_dte).getTime() >= Date.now();

/** Upcoming schedule events, sharing the schedule page's cached events query. */
export const useInvitationEvents = () => {
  const { data = [], isLoading } = useQuery<Event[]>({
    queryKey: ["events", "all"],
    queryFn: getEvents,
  });

  const events = data
    .filter(isUpcoming)
    .sort(
      (a, b) => new Date(a.start_dte).getTime() - new Date(b.start_dte).getTime(),
    );

  return { events, isLoading };
};
