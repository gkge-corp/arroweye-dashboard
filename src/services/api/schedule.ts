import apiRequest from "@/Server/Api";
import type {
  CreateEventInput,
  Event,
  RescheduleEventInput,
  RescheduleEventResponse,
  UpdateEventInput,
} from "@/types/api";
import { ContentItem } from "@/types/contents";
import ls from "localstorage-slim";
import axios from "axios";

if (typeof window !== "undefined" && window?.localStorage)
  ls.config.storage = localStorage;

export const CreateEvent = async (
  payload: CreateEventInput,
): Promise<CreateEventInput> => {
  const response = await apiRequest<CreateEventInput>({
    method: "POST",
    url: `/api/v1/projects/schedule/events/create/`,
    data: payload,
    requireToken: true,
  });

  return response;
};

export const RescheduleEvent = async (
  payload: RescheduleEventInput,
): Promise<RescheduleEventResponse> => {
  const response = await apiRequest<RescheduleEventResponse>({
    method: "POST",
    url: `/api/v1/projects/schedule/events/reschedule/`,
    data: payload,
    requireToken: true,
  });

  return response;
};

export const UpdateEvent = async ({
  id,
  payload,
}: {
  id: number;
  payload: UpdateEventInput;
}): Promise<Event> => {
  const response = await apiRequest<Event>({
    method: "PATCH",
    url: `/api/v1/projects/schedule/events/${id}/`,
    data: payload,
    requireToken: true,
  });

  return response;
};

export const SendEventEmail = async ({
  id,
  emailType,
}: {
  id: number | string;
  emailType: string;
}): Promise<void> => {
  await apiRequest<void>({
    method: "POST",
    url: `/api/v1/projects/schedule/events/${id}/resend-email/`,
    data: { email_type: emailType },
    requireToken: true,
    skipErrorHandling: true,
  });
};

export const getEvents = async (): Promise<Event[]> => {
  const response = await apiRequest<Event[]>({
    method: "GET",
    url: `/api/v1/projects/schedule/events/`,
    requireToken: true,
  });

  return response;
};

const isNetworkError = (error: unknown) =>
  axios.isAxiosError(error) &&
  (!error.response ||
    error.code === "ERR_NETWORK" ||
    error.code === "ECONNABORTED" ||
    error.message.includes("timeout") ||
    error.message.includes("Network Error"));

export const deleteEvents = async (id: number): Promise<void> => {
  await apiRequest<void>({
    method: "DELETE",
    url: `/api/v1/projects/schedule/events/${id}/`,
    requireToken: true,
    skipErrorHandling: true,
  });
};

export const getStoredProjectEvents = (id: number): Event[] => {
  const content =
    ls.get(`ProjectsEvents:${id}`, { decrypt: true }) ||
    ls.get("ProjectsEvents", { decrypt: true });

  return Array.isArray(content) ? (content as Event[]) : [];
};

export const getProjectsEvents = async (id: number): Promise<Event[]> => {
  try {
    // The schema says Event, but this list-like endpoint returns Event[].
    const response = await apiRequest<Event[]>({
      method: "GET",
      url: `/api/v1/projects/${id}/events/`,
      data: null,
      requireToken: true,
      skipErrorHandling: true,
      silent: true,
    });

    ls.set(`ProjectsEvents:${id}`, response, { encrypt: true });
    ls.set("ProjectsEvents", response, { encrypt: true });

    return Array.isArray(response) ? response : [];
  } catch (error: unknown) {
    if (isNetworkError(error)) {
      return getStoredProjectEvents(id);
    }

    throw error;
  }
};

export const getStoredEvent = (): ContentItem[] | null => {
  const content = ls.get("Events", { decrypt: true });

  return content as ContentItem[];
};
