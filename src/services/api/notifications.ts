import apiRequest from "@/Server/Api";
import { isApiNotification } from "@/types/notifications";
import type {
  ApiNotification,
  MarkNotificationsReadInput,
  NotificationType,
} from "@/types/notifications";
import type { NotificationPage } from "@/types/api";
import ls from "localstorage-slim";

if (typeof window !== "undefined" && window?.localStorage)
  ls.config.storage = localStorage;

export const getProjectNotifications = async (
  id: number,
): Promise<any | null> => {
  try {
    const response = await apiRequest<any>({
      method: "GET",
      url: `/api/v1/projects/${id}/notifications/`,
      data: null,
      requireToken: true,
    });

    if (response && typeof response === "object") {
      return response;
    } else {
      console.error("Invalid DSP stats response structure:", response);
      return null;
    }
  } catch (error: unknown) {
    return null;
  }
};

type NotificationApiResponse =
  | NotificationPage
  | ApiNotification[]
  | { notifications: ApiNotification[] };

export const notificationQueryKey = ["notifications"] as const;

const normalizeNotifications = (value: unknown): ApiNotification[] => {
  if (typeof value === "string") {
    try {
      return normalizeNotifications(JSON.parse(value));
    } catch {
      return [];
    }
  }

  if (Array.isArray(value)) return value.filter(isApiNotification);
  if (!value || typeof value !== "object") return [];

  if ("results" in value) {
    return normalizeNotifications(value.results);
  }

  if ("notifications" in value) {
    return normalizeNotifications(value.notifications);
  }

  return [];
};

export const getNotifications = async (
  type?: NotificationType,
): Promise<ApiNotification[]> => {
  try {
    const response = await apiRequest<NotificationApiResponse>({
      method: "GET",
      url: type
        ? `/api/v1/notification/notification/?type=${type}`
        : `/api/v1/notification/notification/`,
      data: null,
      requireToken: true,
      silent: true,
      skipErrorHandling: true,
    });

    ls.set("Notifications", response, { encrypt: true });
    return normalizeNotifications(response);
  } catch {
    // The deployed notifications list endpoint currently returns HTTP 500 for
    // some accounts. /ums/me/ exposes the same collection at runtime.
    const user = await apiRequest<unknown>({
      method: "GET",
      url: `/api/v1/ums/me/`,
      requireToken: true,
    });

    const notifications = normalizeNotifications(user).filter(
      (notification) => !type || notification.type === type,
    );
    ls.set("Notifications", notifications, { encrypt: true });
    return notifications;
  }
};

/** @deprecated Use getNotifications for the normalized notification array. */
export const getNotification = getNotifications;

export const markNotificationsAsRead = async (
  payload: MarkNotificationsReadInput,
): Promise<ApiNotification | null> => {
  try {
    const response = await apiRequest<ApiNotification>({
      method: "POST",
      url: `/api/v1/notification/notification/update-notifications/`,
      data: payload,
      requireToken: true,
    });

    return response;
  } catch (error: unknown) {
    return null;
  }
};
