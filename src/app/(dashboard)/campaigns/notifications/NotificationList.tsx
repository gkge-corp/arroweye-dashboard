"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markNotificationsAsRead, notificationQueryKey } from "@/services";
import { isApiNotification, type ApiNotification } from "@/types/notifications";
import { NotificationCard } from "./NotificationCard";
import { NotificationEmptyState } from "./NotificationEmptyState";

interface NotificationListProps {
  notifications: readonly ApiNotification[];
  emptyCategory: string;
}

export function NotificationList({
  notifications,
  emptyCategory,
}: NotificationListProps) {
  const queryClient = useQueryClient();
  const viewedIds = useRef<Set<number>>(new Set());
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());
  const itemsById = useRef<Map<number, ApiNotification>>(new Map());

  const { mutate: markAsRead } = useMutation({
    mutationFn: (id: number) =>
      markNotificationsAsRead({ notification_ids: [id] }),
    onSuccess: (response, id) => {
      if (!response) {
        viewedIds.current.delete(id);
        return;
      }

      queryClient.setQueryData<ApiNotification[]>(
        notificationQueryKey,
        (current = []) =>
          current.map((item) =>
            item.id === id ? { ...item, read: true } : item,
          ),
      );
      queryClient.setQueriesData<{ notifications?: unknown } | null>(
        { queryKey: ["campaign-detail"] },
        (current) =>
          current && Array.isArray(current.notifications)
            ? {
                ...current,
                notifications: current.notifications.map((item) =>
                  isApiNotification(item) && item.id === id
                    ? { ...item, read: true }
                    : item,
                ),
              }
            : current,
      );
    },
    onError: (_error, id) => {
      viewedIds.current.delete(id);
    },
  });

  useEffect(() => {
    const currentIds = new Set(notifications.map((item) => item.id));

    for (const item of notifications) itemsById.current.set(item.id, item);
    for (const id of itemsById.current.keys()) {
      if (!currentIds.has(id)) itemsById.current.delete(id);
    }
    for (const id of itemRefs.current.keys()) {
      if (!currentIds.has(id)) itemRefs.current.delete(id);
    }
  }, [notifications]);

  const observeUnread = useCallback(
    (id: number) => {
      const item = itemsById.current.get(id);
      if (!item || item.read === true || viewedIds.current.has(id)) return;

      viewedIds.current.add(id);
      markAsRead(id);
    },
    [markAsRead],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const id = Number(entry.target.getAttribute("data-notification-id"));
          if (!id) continue;

          observeUnread(id);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 },
    );

    for (const item of notifications) {
      if (item.read === true || viewedIds.current.has(item.id)) continue;
      const element = itemRefs.current.get(item.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [notifications, observeUnread]);

  if (notifications.length === 0) {
    return (
      <div className="p-6">
        <NotificationEmptyState category={emptyCategory} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          elementRef={(element) => {
            if (element) itemRefs.current.set(notification.id, element);
            else itemRefs.current.delete(notification.id);
          }}
        />
      ))}
    </div>
  );
}
