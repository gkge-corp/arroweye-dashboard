"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreateEvent,
  deleteEvents,
  getBusiness,
  getEvents,
  getProjectsEvents,
  getCampaignOptions,
  RescheduleEvent,
  UpdateEvent,
} from "@/services";
import { useAuth } from "@/context/auth-context";
import { DateClickArg } from "@fullcalendar/interaction";
import type { Event } from "@/types/api";
import { toast } from "sonner";
import { linkEventDrops } from "@/app/(dashboard)/schedule/hooks/use-event-drops";
import type { EventDrop } from "@/types/event-drops";

export const EVENT_DESCRIPTION_MAX_LENGTH = 500;
export const RESCHEDULE_REASON_MAX_LENGTH = 500;

const isSameInstant = (a?: string | null, b?: string | null) =>
  Boolean(a && b && new Date(a).getTime() === new Date(b).getTime());

// The create endpoint may not echo the new id, so fall back to the newest matching event.
const resolveCreatedEventId = async (
  created: unknown,
  payload: { title: string; code: string; start_dte: string },
) => {
  const echoedId = Number((created as { id?: unknown } | null)?.id);
  if (echoedId > 0) return echoedId;

  const events = await getEvents();
  const matches = events.filter(
    (event) =>
      event.title === payload.title &&
      event.code === payload.code &&
      isSameInstant(event.start_dte, payload.start_dte),
  );
  return matches.length ? Math.max(...matches.map((event) => event.id)) : null;
};

const linkPendingDrops = async (
  created: unknown,
  payload: { title: string; code: string; start_dte: string },
  drops: EventDrop[],
) => {
  if (!drops.length) return;

  const eventId = await resolveCreatedEventId(created, payload);
  if (!eventId) {
    toast.error(
      "Event created, but its attachments couldn't be added. Add them from the event details.",
    );
    return;
  }

  try {
    await linkEventDrops(eventId, drops);
  } catch (error) {
    console.error("Linking event drops failed:", error);
    toast.error(
      error instanceof Error ? error.message : "Attachments could not be added.",
    );
  }
};

// Fields shared by create and edit; dates, campaign and vendors are create-only.
const validateEventDetails = (formData: any) => {
  const errors = { title: "", location: "", description: "" };

  if (!formData.title?.trim()) {
    errors.title = "Event Title is required.";
  }

  if (!formData.location) {
    errors.location = "Location is required.";
  }

  if (formData.description?.length > EVENT_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be ${EVENT_DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }

  return errors;
};

export interface FormErrors {
  title?: string;
  vendor_id?: string;
  subvendor_id?: string;
  location?: string;
  start_dte?: string;
  end_dte?: string;
  code?: string;
  project?: string;
  description?: string;
  reason?: string;
}

interface UseScheduleProps {
  isSchedulePage?: boolean;
  isProjectPage?: boolean;
  projectId?: number;
  isDateClickEnabled?: boolean;
}

export const useSchedule = ({
  isSchedulePage = false,
  isProjectPage = false,
  projectId,
  isDateClickEnabled = false,
}: UseScheduleProps) => {
  const queryClient = useQueryClient();
  const { userProfile: userLoggedInProfile } = useAuth();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState<any>(null);
  const [pendingDrops, setPendingDrops] = useState<EventDrop[]>([]);
  const [filter, setisFilter] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [scheduleIdToBeDeleted, setScheduleIdToBeDeleted] = useState<any>("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState<any>({
    id: "",
    title: "",
    vendor_id: "",
    subvendor_id: "",
    location: "",
    start_dte: "",
    end_dte: "",
    code: "",
    project: "",
    description: "",
    status: "confirmed",
    reason: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    title: "",
    start_dte: "",
    end_dte: "",
  });

  // Ref (not mutation state) so a second click in the same tick is still blocked
  const submittingRef = useRef(false);

  const runExclusive = async (task: () => Promise<void>) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await task();
    } finally {
      submittingRef.current = false;
    }
  };

  const [projectPin, setProjectPin] = useState("");
  const [pinEntered, setPinEntered] = useState("");
  const [pinError, setPinError] = useState(false);

  // Fetch business/vendor options
  const { data: businessData = [] } = useQuery({
    queryKey: ["business"],
    queryFn: getBusiness,
  });

  const vendorOptions = businessData
    .filter((business: any) => business.type === "Vendor")
    .map((business: any) => ({
      value: business.id,
      label: business.organization_name,
    }));

  const subvendorOptions = businessData
    .filter((business: any) => business.type === "SubVendor")
    .map((business: any) => ({
      value: business.id,
      label: business.organization_name,
    }));

  const { data: campaignOptionsData = [] } = useQuery({
    queryKey: ["campaigns", "options"],
    queryFn: getCampaignOptions,
    staleTime: 5 * 60 * 1000,
  });

  const campaignOptions = (
    Array.isArray(campaignOptionsData) ? campaignOptionsData : []
  )
    .filter((campaign: any) => Boolean(campaign?.pin || campaign?.code))
    .map((campaign: any) => ({
      value: campaign.pin || campaign.code,
      label: campaign.title,
      id: campaign.id,
      pin: campaign.pin,
      code: campaign.code,
      vendorId: campaign.vendor?.id,
      subvendorId: campaign.subvendor?.id,
    }));

  // Events belong to the campaign's vendor and subvendor, so they come from the campaign.
  const campaignBusinessIds = (
    campaign?: (typeof campaignOptions)[number],
  ) => ({
    vendor_id: campaign?.vendorId ? String(campaign.vendorId) : "",
    subvendor_id: campaign?.subvendorId ? String(campaign.subvendorId) : "",
  });

  // Fetch events based on schedule page vs project page
  const { data: eventItem = [], isLoading: isEventsLoading } = useQuery<
    Event[]
  >({
    queryKey: ["events", isSchedulePage ? "all" : projectId || "project"],
    queryFn: () => {
      if (isSchedulePage) {
        return getEvents();
      }
      if (isProjectPage && projectId) {
        return getProjectsEvents(projectId);
      }
      return Promise.resolve([]);
    },
    enabled: isSchedulePage || (isProjectPage && !!projectId),
  });

  // Mutations
  const createEventMutation = useMutation({
    mutationFn: CreateEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event Created Successfully");
    },
    onError: (error: any) => {
      console.error("Error creating event:", error);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: UpdateEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event Updated");
    },
    onError: (error: any) => {
      console.error("Error updating event:", error);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: deleteEvents,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event Deleted");
    },
    onError: (error: any) => {
      console.error("Error deleting event:", error);
    },
  });

  const rescheduleEventMutation = useMutation({
    mutationFn: RescheduleEvent,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      if (response?.invoice_created) {
        toast.success(
          "Event Reschedule Request Successful, go to Invoice page to complete",
        );
      } else {
        toast.success("Event Reschedule Request Successful");
      }
    },
    onError: (error: any) => {
      console.error("Error rescheduling event:", error);
    },
  });

  const findLabelByValue = (
    options: { value: number; label: string }[],
    value: number,
  ) => {
    const found = options.find((option) => option.value === value);
    return found ? found.label : value.toString();
  };

  const eventTitles: any = {
    "Interview with Artist": {
      type: "interview",
      location: "Studio A",
      link: "https://example.com/interview-call-sheet",
    },
    "Video Shoot": {
      type: "shoot",
      location: "Studio B",
      link: "https://example.com/video-shoot-call-sheet",
    },
    "Live Performance": {
      type: "performance",
      location: "Venue X",
      link: "https://example.com/live-performance-call-sheet",
    },
    "Rehearsal Session": {
      type: "rehearsal",
      location: "Studio C",
      link: "https://example.com/rehearsal-call-sheet",
    },
    "Other Event": {
      type: "other",
      location: "Location Y",
      link: "https://example.com/other-call-sheet",
    },
  };

  const getEventDetails = () => {
    const title = formData.title.trim();
    const start = formData.start_dte;
    const end = formData.end_dte;
    const location = formData.location.trim();
    const vendor = formData.vendor_id
      ? findLabelByValue(vendorOptions, formData.vendor_id)
      : "";
    const subvendor = formData.subvendor_id
      ? findLabelByValue(subvendorOptions, formData.subvendor_id)
      : "";

    if (!title || !start || !end || !location || !vendor || !subvendor) {
      toast.error("Please fill in all fields");
      return null;
    }

    const eventDetails = eventTitles[title] || { link: null };
    return {
      title,
      start,
      end,
      extendedProps: {
        location,
        vendor,
        subvendor,
        callSheetLink: eventDetails.link,
      },
    };
  };

  const formatDateForICS = (dateString: any) => {
    const date = new Date(dateString);
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const formatDetails = (eventDetails: any, includeICSLine: any) => {
    const currentDate = new Date().toLocaleString();
    const startDate = new Date(eventDetails.start).toLocaleString();

    return (
      `Hello,\n\n` +
      `Find the call sheet for this event here: ${
        eventDetails.extendedProps.callSheetLink || "N/A"
      }\n\n` +
      `Title: ${eventDetails.title}\n` +
      `Date: ${startDate}\n` +
      `Location: ${eventDetails.extendedProps.location}\n` +
      `Vendor: ${eventDetails.extendedProps.vendor}\n` +
      `Subvendor: ${eventDetails.extendedProps.subvendor}\n\n` +
      `*********\n\n` +
      `For more information on best practices for schedules visit pinegingr.com/faqs.\n` +
      `Please be punctual, rescheduling fees apply for certain event types and timelines. For further inquiries, contact hi@pinegingr.com.\n\n` +
      `*********\n\n` +
      `Auto-generated on arroweye.pro on ${currentDate}.\n` +
      (includeICSLine ? `(Kindly attach the .ICS calendar invite)` : "")
    );
  };

  const exportICS = () => {
    const eventDetails = getEventDetails();
    if (!eventDetails) return;

    const startDate = formatDateForICS(eventDetails.start);
    const endDate = formatDateForICS(eventDetails.end);
    const description = formatDetails(eventDetails, false).replace(
      /\n/g,
      "\\n",
    );

    const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${eventDetails.title}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `LOCATION:${eventDetails.extendedProps.location}`,
      `DESCRIPTION:${description}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");

    const blob = new Blob([icsData], { type: "text/calendar" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "event.ics";
    toast.success("Calender invite is downloaded");
    link.click();
  };

  const handleDelete = async (eventID: number) => {
    setDeleteLoading(true);
    try {
      await deleteEventMutation.mutateAsync(eventID);
      setDeleteDialog(false);
      setIsModalVisible(false);
    } catch (err) {
      console.error("Error deleting event:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const projectCampaign = projectId
    ? campaignOptions.find((option) => String(option.id) === String(projectId))
    : undefined;

  // A project-scoped calendar creates events for that campaign by default.
  const openCreateModal = () => {
    if (projectCampaign) {
      setFormData((prevData: any) => ({
        ...prevData,
        code: projectCampaign.value,
        project: projectCampaign.id,
        ...campaignBusinessIds(projectCampaign),
      }));
    }
    setIsModalVisible(true);
  };

  const handleDateClick = (info: DateClickArg) => {
    if (!isDateClickEnabled) return;

    const selectedDate = info.dateStr;
    const currentDate = new Date().toISOString().split("T")[0];

    if (selectedDate >= currentDate) {
      openCreateModal();
    } else {
      toast.warning(`You cannot set events in the past`);
    }
  };

  const handleCloseModal = () => {
    setViewOnly(false);
    setIsEditing(false);
    setEditSnapshot(null);
    setPendingDrops([]);
    setIsModalVisible(false);
    setFormData({
      id: "",
      title: "",
      vendor_id: "",
      subvendor_id: "",
      location: "",
      start_dte: "",
      end_dte: "",
      code: "",
      project: "",
      description: "",
      status: "confirmed",
      reason: "",
    });
  };

  const formatDateToString = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toISOString();
  };

  const handleFormChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prevData: any) => {
      const newData = { ...prevData, [name]: value };

      if (name === "start_dte") {
        setFormErrors((prev) => ({
          ...prev,
          end_dte: newData.end_dte ? validateDates(value, newData.end_dte) : "",
        }));
      }

      if (name === "end_dte") {
        setFormErrors((prev) => ({
          ...prev,
          end_dte: validateDates(newData.start_dte, value),
        }));
      }

      return newData;
    });
  };

  const validateDates = (startDate: string, endDate: string): string => {
    if (!startDate || !endDate) return "";

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return "End date cannot be before start date";
    }
    return "";
  };

  const handleSelectChange = ({ name, value }: any) => {
    // Picked attachments are scoped to the campaign, so a new campaign starts empty.
    if (name === "code" && value !== formData.code) setPendingDrops([]);

    setFormData((prevData: any) => {
      const nextData = {
        ...prevData,
        [name]: value,
      };

      if (name === "code") {
        const matched = campaignOptions.find(
          (opt: any) =>
            String(opt.value) === String(value) ||
            String(opt.pin) === String(value) ||
            String(opt.code) === String(value),
        );
        if (matched) {
          nextData.code = matched.pin || matched.code || value;
          if (matched.id) {
            nextData.project = matched.id;
          }
        }
        Object.assign(nextData, campaignBusinessIds(matched));
      }

      return nextData;
    });
  };

  const handleFormSubmit = async (e: any) => {
    e.preventDefault();

    const newErrors = {
      title: "",
      vendor_id: "",
      subvendor_id: "",
      location: "",
      start_dte: "",
      end_dte: "",
      code: "",
      project: "",
      description: "",
    };

    Object.assign(newErrors, validateEventDetails(formData));

    if (!formData.start_dte) {
      newErrors.start_dte = "Start Date is required.";
    }

    if (!formData.code) {
      newErrors.code = "Campaign is required.";
    } else if (!formData.vendor_id || !formData.subvendor_id) {
      newErrors.code = "This campaign has no vendor or subvendor assigned.";
    }

    if (!formData.end_dte) {
      newErrors.end_dte = "End Date is required.";
    } else {
      const dateError = validateDates(formData.start_dte, formData.end_dte);
      if (dateError) {
        newErrors.end_dte = dateError;
      }
    }

    setFormErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error !== "");

    if (!hasErrors) {
      await runExclusive(async () => {
        try {
          const updatedFormData = {
            ...formData,
            vendor_id: formData.vendor_id ? parseInt(formData.vendor_id) : null,
            subvendor_id: formData.subvendor_id
              ? parseInt(formData.subvendor_id)
              : null,
            start_dte: formatDateToString(formData.start_dte),
            end_dte: formatDateToString(formData.end_dte),
            description: formData.description.trim(),
          };

          const created =
            await createEventMutation.mutateAsync(updatedFormData);
          await linkPendingDrops(created, updatedFormData, pendingDrops);
          handleCloseModal();
        } catch (error) {
          console.error("Error submitting form:", error);
        }
      });
    }
  };

  const startEdit = () => {
    setEditSnapshot(formData);
    setFormErrors({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (editSnapshot) setFormData(editSnapshot);
    setFormErrors({});
    setIsEditing(false);
  };

  const updateEvent = async (e: any) => {
    e.preventDefault();

    const newErrors = validateEventDetails(formData);
    setFormErrors(newErrors);
    if (Object.values(newErrors).some((error) => error !== "")) return;

    await runExclusive(async () => {
      try {
        await updateEventMutation.mutateAsync({
          id: Number(formData.id),
          payload: {
            title: formData.title.trim(),
            location: formData.location,
            description: formData.description.trim(),
            status: formData.status,
          },
        });
        handleCloseModal();
      } catch (error) {
        console.error("Error updating event:", error);
      }
    });
  };

  const rescheduleEvent = async () => {
    const newErrors = {
      code: "",
      start_dte: "",
      end_dte: "",
    };

    if (!formData.code) {
      newErrors.code =
        "This event has no campaign code, so it can't be rescheduled.";
    }

    if (!formData.start_dte) {
      newErrors.start_dte = "Start Date is required.";
    }

    if (!formData.end_dte) {
      newErrors.end_dte = "End Date is required.";
    } else {
      newErrors.end_dte = validateDates(formData.start_dte, formData.end_dte);
    }

    setFormErrors(newErrors);
    const hasErrors = Object.values(newErrors).some((error) => error !== "");

    if (!hasErrors) {
      const payload = {
        event_id: formData.id,
        start_dte: formatDateToString(formData.start_dte),
        end_dte: formatDateToString(formData.end_dte),
        code: formData.code,
        ...(formData.reason?.trim() && { reason: formData.reason.trim() }),
      };

      await runExclusive(async () => {
        try {
          await rescheduleEventMutation.mutateAsync(payload);
          handleCloseModal();
        } catch (err) {
          console.error("Error rescheduling event:", err);
        }
      });
    }
  };

  const eventsSource = Array.isArray(eventItem) ? eventItem : [];

  const events = eventsSource.map((item, index) => ({
    id: `${item?.id}-${index}`,
    title: item.title,
    start: item.start_dte,
    end: item.start_dte,
    end_date: item.end_dte,
    vendor: item.vendor,
    subvendor: item.subvendor,
    location: item.location,
    project: item.project,
    code: item.code,
    description: item.description,
    status: item.status,
  }));

  return {
    userLoggedInProfile,
    isModalVisible,
    setIsModalVisible,
    viewOnly,
    setViewOnly,
    filter,
    setisFilter,
    deleteDialog,
    setDeleteDialog,
    scheduleIdToBeDeleted,
    setScheduleIdToBeDeleted,
    deleteLoading,
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    projectPin,
    setProjectPin,
    pinEntered,
    setPinEntered,
    pinError,
    setPinError,
    vendorOptions,
    subvendorOptions,
    campaignOptions,
    events,
    isLoading: isEventsLoading,
    isSubmitting:
      createEventMutation.isPending ||
      rescheduleEventMutation.isPending ||
      updateEventMutation.isPending,
    isEditing,
    startEdit,
    cancelEdit,
    updateEvent,
    pendingDrops,
    setPendingDrops,
    exportICS,
    openCreateModal,
    handleDelete,
    handleDateClick,
    handleCloseModal,
    handleFormChange,
    handleSelectChange,
    handleFormSubmit,
    rescheduleEvent,
  };
};
