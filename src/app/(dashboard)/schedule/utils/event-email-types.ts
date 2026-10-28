export const EVENT_EMAIL_TYPES = [
  { value: "alert", label: "Alert" },
  { value: "reminder", label: "Reminder" },
  { value: "today", label: "Today" },
  { value: "check_in", label: "Check-in" },
  { value: "updated", label: "Updated" },
  { value: "rescheduled", label: "Rescheduled" },
] as const;

export type EventEmailType = (typeof EVENT_EMAIL_TYPES)[number]["value"];
