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
type NotificationApiResponse =
  | NotificationPage
  | ApiNotification[]
  | { notifications: ApiNotification[] };

export const notificationQueryKey = ["notifications"] as const;
export const unreadNotificationQueryKey = [
  ...notificationQueryKey,
  "unread",
] as const;

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

// The API only ever returns the signed-in user's own notifications.
interface NotificationFilters {
  projectId?: number;
}

const fetchAllNotificationPages = async ({
  projectId,
}: NotificationFilters) => {
  const notifications: ApiNotification[] = [];

  for (let page = 1; page <= MAX_NOTIFICATION_PAGES; page++) {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(NOTIFICATION_PAGE_SIZE),
    });
    if (projectId) params.set("campaign_id", String(projectId));

    const response = await apiRequest<NotificationApiResponse>({
      method: "GET",
      url: `/api/notifications?${params}`,
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

export const NOTIFICATION_LIST_PAGE_SIZE = 20;

export interface NotificationListPage {
  items: ApiNotification[];
  count: number;
  nextPage: number | null;
}

interface NotificationPageQuery {
  type?: NotificationType;
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

export const getNotificationPage = async ({
  type,
  page = 1,
  pageSize = NOTIFICATION_LIST_PAGE_SIZE,
  unreadOnly = false,
}: NotificationPageQuery): Promise<NotificationListPage> => {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (type) params.set("type", type);
  if (unreadOnly) params.set("read", "false");

  const response = await apiRequest<NotificationApiResponse>({
    method: "GET",
    url: `/api/notifications?${params}`,
    data: null,
    requireToken: true,
    silent: true,
    skipErrorHandling: true,
  });

  const items = normalizeNotifications(response);
  return {
    items,
    count:
      !Array.isArray(response) && "count" in response
        ? Number(response.count)
        : items.length,
    nextPage: hasNextPage(response) ? page + 1 : null,
  };
};

export const getProjectNotifications = async (
  projectId: number,
  type?: NotificationType,
): Promise<ApiNotification[]> =>
  filterByType(await fetchAllNotificationPages({ projectId }), type);

export const markNotificationsAsRead = async (
  payload: MarkNotificationsReadInput,
): Promise<ApiNotification | null> => {
  try {
    const response = await apiRequest<ApiNotification>({
      method: "POST",
      url: `/api/notifications/read`,
      data: payload,
      requireToken: true,
    });

    return response;
  } catch (error: unknown) {
    return null;
  }
};

export const markAllNotificationsAsRead = () =>
  apiRequest<{ updated: number }>({
    method: "POST",
    url: `/api/notifications/read-all`,
    data: null,
    requireToken: true,
  });
