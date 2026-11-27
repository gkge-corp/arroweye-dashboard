import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getNotificationPage,
  markAllNotificationsAsRead,
  notificationQueryKey,
  unreadNotificationQueryKey,
} from "@/services";
import {
  groupNotifications,
  type NotificationType,
} from "@/types/notifications";
import { useAuth } from "@/context/auth-session";
import {
  markAllNotificationsReadInCache,
  type NotificationQueryData,
} from "@/lib/notification-cache";

export type NotificationMainTab = "updates" | "drops";
export type NotificationInnerTab =
  | "campaign"
  | "milestones"
  | "security"
  | "others"
  | "assets"
  | "payment";

const isMainTab = (value: string): value is NotificationMainTab =>
  value === "updates" || value === "drops";

const isInnerTab = (value: string): value is NotificationInnerTab =>
  [
    "campaign",
    "milestones",
    "security",
    "others",
    "assets",
    "payment",
  ].includes(value);

// Drop assets come from drop zones, so that tab has no notification type.
const innerTabTypes: Partial<Record<NotificationInnerTab, NotificationType>> = {
  campaign: "Campaigns",
  milestones: "Milestones",
  security: "Security",
  others: "Others",
  payment: "Payments",
};

const UNREAD_NOTIFICATION_PAGE_SIZE = 100;

export const useTopNav = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] =
    useState<NotificationMainTab>("updates");
  const [activeInnerTab, setActiveInnerTab] =
    useState<NotificationInnerTab>("campaign");
  const [hasOpenedNotifications, setHasOpenedNotifications] = useState(false);
  const knownUnreadIds = useRef<Set<number>>(new Set());
  const canFetchGlobal = isAuthenticated && !isAuthLoading;
  const activeType = innerTabTypes[activeInnerTab];

  // Only unread items drive the badge, so the full history is never loaded.
  const { data: unreadPage } = useQuery({
    queryKey: unreadNotificationQueryKey,
    queryFn: () =>
      getNotificationPage({
        unreadOnly: true,
        pageSize: UNREAD_NOTIFICATION_PAGE_SIZE,
      }),
    enabled: canFetchGlobal,
    staleTime: 60_000,
  });
  const {
    data: tabNotificationPages,
    isLoading,
    isError: tabNotificationError,
    refetch: refetchTabNotifications,
    hasNextPage: hasMoreNotifications,
    isFetchingNextPage: loadingMoreNotifications,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [...notificationQueryKey, "list", activeType],
    queryFn: ({ pageParam }) =>
      getNotificationPage({ type: activeType, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: canFetchGlobal && isSidebarOpen && Boolean(activeType),
    staleTime: 60_000,
  });
  const notificationLoading = isAuthLoading || isLoading;
  const notificationError = tabNotificationError;

  const retryNotifications = useCallback(() => {
    void refetchTabNotifications();
  }, [refetchTabNotifications]);

  const loadMoreNotifications = useCallback(() => {
    if (hasMoreNotifications && !loadingMoreNotifications) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasMoreNotifications, loadingMoreNotifications]);

  const tabNotificationItems = useMemo(
    () => tabNotificationPages?.pages.flatMap((page) => page.items) ?? [],
    [tabNotificationPages],
  );
  const notifications = useMemo(
    () => groupNotifications(tabNotificationItems),
    [tabNotificationItems],
  );
  const unreadNotifications = useMemo(
    () => unreadPage?.items.filter((item) => item.read === false) ?? [],
    [unreadPage],
  );
  const unreadCount = unreadPage?.count ?? 0;
  const allNotificationsRead = unreadCount === 0;

  const queryClient = useQueryClient();
  const { mutate: markAllRead, isPending: markingAllRead } = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.setQueriesData(
        { queryKey: notificationQueryKey },
        (current: NotificationQueryData) =>
          markAllNotificationsReadInCache(current),
      );
      void queryClient.invalidateQueries({
        queryKey: unreadNotificationQueryKey,
      });
      void queryClient.invalidateQueries({ queryKey: ["campaign-detail"] });
    },
  });

  const setNotificationsOpen = (open: boolean) => {
    setIsSidebarOpen(open);
    if (open) setHasOpenedNotifications(true);
  };

  const handleMainTabClick = (tab: string) => {
    if (!isMainTab(tab)) return;

    setActiveMainTab(tab);
    setActiveInnerTab(tab === "updates" ? "campaign" : "assets");
  };

  const handleInnerTabClick = (tab: string) => {
    if (isInnerTab(tab)) setActiveInnerTab(tab);
  };

  useEffect(() => {
    const unreadIds = unreadNotifications.map(
      (notification) => notification.id,
    );
    const hasNewUnread = unreadIds.some(
      (id) => !knownUnreadIds.current.has(id),
    );

    if (hasNewUnread) setHasOpenedNotifications(false);
    unreadIds.forEach((id) => knownUnreadIds.current.add(id));
  }, [unreadNotifications]);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      const sidebarEl = document.getElementById("notification-sidebar");
      if (!sidebarEl?.contains(target)) setIsSidebarOpen(false);
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isSidebarOpen]);

  return {
    notifications,
    notificationLoading,
    notificationError,
    retryNotifications,
    hasMoreNotifications,
    loadingMoreNotifications,
    loadMoreNotifications,
    allNotificationsRead,
    unreadCount,
    markAllRead,
    markingAllRead,
    isSidebarOpen,
    activeMainTab,
    activeInnerTab,
    setNotificationsOpen,
    handleMainTabClick,
    handleInnerTabClick,
    hasOpenedNotifications,
  };
};
