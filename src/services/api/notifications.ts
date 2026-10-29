import apiRequest from "@/Server/Api";
import {
  isApiNotification,
  normalizeNotificationType,
} from "@/types/notifications";
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

const NOTIFICATION_PAGE_SIZE = 100;
// Guards against a backend that keeps returning a `next` link.
const MAX_NOTIFICATION_PAGES = 20;

const hasNextPage = (response: NotificationApiResponse) =>
  !Array.isArray(response) && "next" in response && Boolean(response.next);

const filterByType = (
  notifications: ApiNotification[],
  type?: NotificationType,
) =>
  type
    ? notifications.filter(
        (notification) => normalizeNotificationType(notification.type) === type,
      )
    : notifications;

// The list is paginated and `type` is not a documented filter, so read every
// page and filter here; otherwise older types (e.g. milestones) never load.
const fetchAllNotificationPages = async (type?: NotificationType) => {
  const notifications: ApiNotification[] = [];

  for (let page = 1; page <= MAX_NOTIFICATION_PAGES; page++) {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(NOTIFICATION_PAGE_SIZE),
    });
    if (type) params.set("type", type);

    const response = await apiRequest<NotificationApiResponse>({
      method: "GET",
      url: `/api/v1/notification/notification/?${params}`,
      data: null,
      requireToken: true,
      silent: true,
      skipErrorHandling: true,
    });

    notifications.push(...normalizeNotifications(response));
    if (!hasNextPage(response)) break;
  }

  return notifications;
};

export const getNotifications = async (
  type?: NotificationType,
): Promise<ApiNotification[]> => {
  try {
    const notifications = filterByType(
      await fetchAllNotificationPages(type),
      type,
    );

    ls.set("Notifications", notifications, { encrypt: true });
    return notifications;
  } catch {
    // The deployed notifications list endpoint currently returns HTTP 500 for
    // some accounts. /ums/me/ exposes the same collection at runtime.
    const user = await apiRequest<unknown>({
      method: "GET",
      url: `/api/v1/ums/me/`,
      requireToken: true,
    });

    const notifications = filterByType(normalizeNotifications(user), type);
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
