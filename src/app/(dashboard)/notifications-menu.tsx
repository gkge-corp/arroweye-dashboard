"use client";

import { mdiPlus, mdiReload } from "@mdi/js";
import MdiIcon from "@mdi/react";
import { useQuery } from "@tanstack/react-query";
import { Bell, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationList } from "./campaigns/notifications/NotificationList";
import { DropzoneUploadDialog } from "./campaigns/notifications/dropzone-upload-dialog";
import { useTopNav } from "@/hooks/use-top-nav";
import { getDropZones, getProjectDropZone } from "@/services";
import type { NotificationByType } from "@/types/notifications";

type NotificationsMenuProps = {
  projectId?: number | string;
  triggerClassName?: string;
  triggerTabIndex?: number;
};

const NotificationsMenu = ({
  projectId,
  triggerClassName,
  triggerTabIndex,
}: NotificationsMenuProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const routeProjectId = pathname.match(/^\/campaigns\/(\d+)\/?$/)?.[1];
  const activeProjectId = projectId ?? routeProjectId;
  const [dropzoneDialogOpen, setDropzoneDialogOpen] = useState(false);
  const {
    notifications,
    notificationLoading,
    notificationError,
    retryNotifications,
    allNotificationsRead,
    isSidebarOpen,
    activeMainTab,
    activeInnerTab,
    setNotificationsOpen,
    handleMainTabClick,
    handleInnerTabClick,
    hasOpenedNotifications,
  } = useTopNav();

  const {
    data: dropZones = [],
    isLoading: dropZonesLoading,
    isError: dropZonesError,
    refetch: refetchDropZones,
  } = useQuery({
    queryKey: activeProjectId
      ? ["project-dropzones", String(activeProjectId)]
      : ["notification-dropzones", "all"],
    queryFn: async () => {
      if (activeProjectId) {
        const dropZone = await getProjectDropZone(activeProjectId);
        return dropZone ? [dropZone] : [];
      }

      const response = await getDropZones({ page: 1 });
      return response.results;
    },
    enabled:
      isSidebarOpen && activeMainTab === "drops" && activeInnerTab === "assets",
    staleTime: 60_000,
  });

  const dropNotifications = useMemo<NotificationByType<"Assets">[]>(
    () =>
      dropZones.map((drop) => {
        const uploader =
          [drop.first_name, drop.last_name].filter(Boolean).join(" ") ||
          drop.user?.user_profile?.fullname ||
          "Unknown user";

        return {
          id: drop.id,
          type: "Assets",
          icon: "",
          content: `New drop from ${uploader}: ${drop.folder_name || "Untitled folder"}`,
          actions: [
            { type: "Download", url: drop.link },
            { type: "Share", url: drop.link },
          ],
          created: drop.created,
          read: true,
        };
      }),
    [dropZones],
  );

  const activeNotificationList = (() => {
    if (activeMainTab === "drops") {
      return activeInnerTab === "payment"
        ? { items: notifications.payments, category: "payment" }
        : { items: dropNotifications, category: "asset" };
    }

    switch (activeInnerTab) {
      case "milestones":
        return { items: notifications.milestones, category: "milestone" };
      case "security":
        return { items: notifications.security, category: "security" };
      case "others":
        return { items: notifications.others, category: "other" };
      default:
        return { items: notifications.campaigns, category: "campaign" };
    }
  })();

  const isShowingDropAssets =
    activeMainTab === "drops" && activeInnerTab === "assets";
  const activeListLoading = isShowingDropAssets
    ? dropZonesLoading
    : notificationLoading;
  const activeListError = isShowingDropAssets
    ? dropZonesError
    : notificationError;
  const retryActiveList = () => {
    if (isShowingDropAssets) {
      void refetchDropZones();
      return;
    }

    retryNotifications();
  };

  return (
    <>
      <DropdownMenu open={isSidebarOpen} onOpenChange={setNotificationsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={triggerClassName}
            aria-label="Open notifications"
            tabIndex={triggerTabIndex}
          >
            <Bell className="size-[24px]!" />
            {!allNotificationsRead && !hasOpenedNotifications && (
              <span className="absolute right-1 top-1 size-2 rounded-full bg-orange-500 ring-2 ring-background" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          id="notification-sidebar"
          align="end"
          sideOffset={10}
          className="z-50 flex h-[min(calc(100vh-72px),760px)] w-[calc(100vw-2rem)] max-w-85 flex-col overflow-hidden rounded-none border border-neutral-100 bg-white p-0 text-zinc-950 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <div className="shrink-0">
            <Tabs
              value={activeMainTab}
              onValueChange={handleMainTabClick}
              className="w-full"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 bg-[#f4f8fc] px-5 py-0.5 dark:border-zinc-800 dark:bg-zinc-900">
                <TabsList className="flex items-center gap-6 bg-none p-0">
                  <TabsTrigger
                    value="updates"
                    className="bg-none p-0 text-[15px] font-normal text-neutral-400 data-[state=active]:bg-none data-[state=active]:text-neutral-900 data-[state=active]:font-normal data-[state=active]:shadow-none dark:data-[state=active]:text-white cursor-pointer transition-colors hover:text-neutral-900 dark:hover:text-white"
                  >
                    Updates
                  </TabsTrigger>
                  <TabsTrigger
                    value="drops"
                    className="bg-transparent p-0 text-[15px] font-normal text-neutral-400 data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:font-normal data-[state=active]:shadow-none dark:data-[state=active]:text-white cursor-pointer transition-colors hover:text-neutral-900 dark:hover:text-white"
                  >
                    Drops
                  </TabsTrigger>
                </TabsList>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-neutral-400 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X size={14} />
                </button>
              </div>
            </Tabs>

            <Tabs
              value={activeInnerTab}
              onValueChange={handleInnerTabClick}
              className="w-full border-b border-neutral-100 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            >
              {activeMainTab === "updates" && (
                <TabsList className="grid w-full grid-cols-3 justify-between gap-2 bg-transparent px-0 py-2.5">
                  <TabsTrigger
                    value="campaign"
                    className="bg-transparent p-0 text-sm font-normal text-neutral-950 data-[state=active]:bg-transparent data-[state=active]:text-[#ff5a1f] data-[state=active]:font-normal data-[state=active]:shadow-none dark:text-neutral-400 dark:data-[state=active]:text-[#ff5a1f] cursor-pointer transition-colors hover:text-[#ff5a1f]"
                  >
                    Campaigns
                  </TabsTrigger>
                  <TabsTrigger
                    value="milestones"
                    className="bg-transparent p-0 text-sm font-normal text-neutral-950 data-[state=active]:bg-transparent data-[state=active]:text-[#ff5a1f] data-[state=active]:font-normal data-[state=active]:shadow-none dark:text-neutral-400 dark:data-[state=active]:text-[#ff5a1f] cursor-pointer transition-colors hover:text-[#ff5a1f]"
                  >
                    Milestones
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="bg-transparent p-0 text-sm font-normal text-neutral-950 data-[state=active]:bg-transparent data-[state=active]:text-[#ff5a1f] data-[state=active]:font-normal data-[state=active]:shadow-none dark:text-neutral-400 dark:data-[state=active]:text-[#ff5a1f] cursor-pointer transition-colors hover:text-[#ff5a1f]"
                  >
                    Security
                  </TabsTrigger>
                  <TabsTrigger
                    value="others"
                    className="bg-transparent hidden p-0 text-sm font-normal text-neutral-950 data-[state=active]:bg-transparent data-[state=active]:text-[#ff5a1f] data-[state=active]:font-normal data-[state=active]:shadow-none dark:text-neutral-400 dark:data-[state=active]:text-[#ff5a1f] cursor-pointer transition-colors hover:text-[#ff5a1f]"
                  >
                    Others
                  </TabsTrigger>
                </TabsList>
              )}
              {activeMainTab === "drops" && (
                <TabsList className="flex items-center justify-between gap-6 bg-transparent px-5 py-2.5">
                  <TabsTrigger
                    value="assets"
                    className="bg-transparent p-0 text-sm font-normal text-neutral-950 data-[state=active]:bg-transparent data-[state=active]:text-[#ff5a1f] data-[state=active]:font-normal data-[state=active]:shadow-none dark:text-neutral-400 dark:data-[state=active]:text-[#ff5a1f] cursor-pointer transition-colors hover:text-[#ff5a1f]"
                  >
                    Assets
                  </TabsTrigger>
                  <TabsTrigger
                    value="payment"
                    className="bg-transparent p-0 text-sm font-normal text-neutral-950 data-[state=active]:bg-transparent data-[state=active]:text-[#ff5a1f] data-[state=active]:font-normal data-[state=active]:shadow-none dark:text-neutral-400 dark:data-[state=active]:text-[#ff5a1f] cursor-pointer transition-colors hover:text-[#ff5a1f]"
                  >
                    Payments
                  </TabsTrigger>
                </TabsList>
              )}
            </Tabs>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="text-sm text-muted-foreground">
              {activeListLoading && (
                <p className="p-6 text-center text-neutral-500">
                  Loading {isShowingDropAssets ? "drops" : "notifications"}…
                </p>
              )}
              {activeListError && !activeListLoading && (
                <div className="flex items-center justify-center gap-2 p-6 text-red-600">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={retryActiveList}
                    aria-label="Reload notifications"
                    title="Reload notifications"
                    className="size-7 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                  >
                    <MdiIcon path={mdiReload} size={0.7} />
                  </Button>
                  <p>
                    {isShowingDropAssets ? "Drops" : "Notifications"} could not
                    be loaded.
                  </p>
                </div>
              )}
              {!activeListLoading && !activeListError && (
                <NotificationList
                  notifications={activeNotificationList.items}
                  emptyCategory={activeNotificationList.category}
                />
              )}
            </div>
          </ScrollArea>
          {activeMainTab === "drops" && activeInnerTab === "assets" && (
            <>
              <DropdownMenuSeparator className="my-0 bg-neutral-100 dark:bg-zinc-800" />
              <div className="flex gap-2 px-6 py-4">
                <Button
                  type="button"
                  className="h-9 flex-1 rounded-[6px] bg-zinc-950 text-white hover:bg-orange-500 dark:bg-zinc-100 dark:text-zinc-950"
                  onClick={() => router.push("/drops")}
                >
                  View All Assets
                </Button>
                {activeProjectId && (
                  <Button
                    type="button"
                    size="icon"
                    aria-label="Upload drop"
                    title="Upload drop"
                    className="size-9 shrink-0 rounded-[6px] bg-zinc-950 text-white hover:bg-orange-500 dark:bg-zinc-100 dark:text-zinc-950"
                    onClick={() => {
                      setNotificationsOpen(false);
                      setDropzoneDialogOpen(true);
                    }}
                  >
                    <MdiIcon path={mdiPlus} size={0.8} />
                  </Button>
                )}
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {activeProjectId && (
        <DropzoneUploadDialog
          open={dropzoneDialogOpen}
          projectId={activeProjectId}
          onOpenChange={setDropzoneDialogOpen}
          onUploaded={() => void refetchDropZones()}
        />
      )}
    </>
  );
};

export default NotificationsMenu;
