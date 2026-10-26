"use client";

import React, { useCallback } from "react";
import type { EventClickArg, EventContentArg } from "@fullcalendar/core";
import { toast } from "react-toastify";
import { useSchedule } from "@/hooks/use-schedule";
import ScheduleEventBadge from "../component/schedule-event-badge";

interface ScheduleEventDetails {
  id?: string;
  title?: string;
  start?: Date | string | null;
  end_date?: string | null;
  vendor?: any;
  subvendor?: any;
  location?: string | null;
  project?: any;
  code?: string | null;
  description?: string | null;
  status?: string | null;
}

interface UseScheduleCalendarOptions {
  isSchedulePage?: boolean;
  isDateClickEnabled?: boolean;
  projectId?: number;
}

export const useScheduleCalendar = ({
  isSchedulePage = false,
  isDateClickEnabled = false,
  projectId,
}: UseScheduleCalendarOptions) => {
  const schedule = useSchedule({
    isSchedulePage,
    isProjectPage: Boolean(projectId),
    projectId,
    isDateClickEnabled,
  });

  const toDateInputValue = useCallback(
    (date?: Date | string | null): string => {
      if (!date) return "";

      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      return date;
    },
    [],
  );

  const openEventDetails = useCallback(
    (event: ScheduleEventDetails) => {
      schedule.setFormErrors({});
      schedule.setProjectPin(event.code ?? "");
      schedule.setFormData({
        id: event.id?.split("-")[0],
        calendarEventId: event.id,
        title: event.title,
        vendor_id: event.vendor,
        subvendor_id: event.subvendor,
        location: event.location,
        start_dte: toDateInputValue(event.start),
        end_dte: toDateInputValue(event.end_date),
        code: event.code ?? "",
        project: event.project,
        description: event.description ?? "",
        status: event.status ?? "confirmed",
      });
      schedule.setViewOnly(true);
      schedule.setIsModalVisible(true);
    },
    [schedule, toDateInputValue],
  );

  const handleCalendarEventClick = useCallback(
    ({ event }: EventClickArg) =>
      openEventDetails({
        ...event.extendedProps,
        id: event.id,
        title: event.title,
        start: event.start,
      }),
    [openEventDetails],
  );

  const renderEventContent = useCallback(
    (eventInfo: EventContentArg) => (
      <ScheduleEventBadge
        title={eventInfo.event.title}
        start={eventInfo.event.start}
        eventId={eventInfo.event.id}
        isAllDay={eventInfo.event.allDay}
        viewType={eventInfo.view.type}
      />
    ),
    [],
  );

  const { formData } = schedule;

  const canDeleteEvent = Boolean(
    formData.start_dte &&
    new Date(formData.start_dte) >= new Date(new Date().setHours(0, 0, 0, 0)),
  );

  // An event is in the past once it has ended, so it can no longer be edited.
  const canEditEvent = Boolean(
    (formData.end_dte || formData.start_dte) &&
    new Date(formData.end_dte || formData.start_dte) > new Date(),
  );

  const eventCampaign = schedule.campaignOptions.find(
    (option) =>
      (formData.project && String(option.id) === String(formData.project)) ||
      (formData.code &&
        (option.pin === formData.code || option.code === formData.code)),
  );

  const requestDeleteEvent = () => {
    schedule.setScheduleIdToBeDeleted(formData);
    schedule.setDeleteDialog(true);
  };

  const openEventProject = () => {
    if (!formData.project) {
      toast.info("No project code");
      return;
    }
    window.open(`/campaigns/${formData.project}`);
  };

  return {
    ...schedule,
    canDeleteEvent,
    canEditEvent,
    eventCampaignTitle: eventCampaign?.label,
    requestDeleteEvent,
    openEventProject,
    openEventDetails,
    handleCalendarEventClick,
    renderEventContent,
  };
};

export default useScheduleCalendar;
