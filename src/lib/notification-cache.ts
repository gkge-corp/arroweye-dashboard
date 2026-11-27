import type { InfiniteData } from "@tanstack/react-query";
import type { NotificationListPage } from "@/services";
import type { ApiNotification } from "@/types/notifications";

export type NotificationQueryData =
  | ApiNotification[]
  | NotificationListPage
  | InfiniteData<NotificationListPage>
  | undefined;

type ShouldMarkRead = (item: ApiNotification) => boolean;

const markItemsRead = (items: ApiNotification[], shouldMark: ShouldMarkRead) =>
  items.map((item) => (shouldMark(item) ? { ...item, read: true } : item));

const isInfiniteData = (
  data: NotificationQueryData,
): data is InfiniteData<NotificationListPage> =>
  Boolean(data && "pages" in data);

const isListPage = (
  data: NotificationQueryData,
): data is NotificationListPage => Boolean(data && "items" in data);

// Notification queries hold plain arrays (campaign dock), one page (unread
// badge) or infinite pages (sidebar tabs).
const markReadInCache = (
  data: NotificationQueryData,
  shouldMark: ShouldMarkRead,
): NotificationQueryData => {
  if (Array.isArray(data)) return markItemsRead(data, shouldMark);

  if (isInfiniteData(data)) {
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: markItemsRead(page.items, shouldMark),
      })),
    };
  }

  if (isListPage(data)) {
    return { ...data, items: markItemsRead(data.items, shouldMark) };
  }

  return data;
};

export const markNotificationReadInCache = (
  data: NotificationQueryData,
  id: number,
) => markReadInCache(data, (item) => item.id === id);

export const markAllNotificationsReadInCache = (data: NotificationQueryData) =>
  markReadInCache(data, () => true);
