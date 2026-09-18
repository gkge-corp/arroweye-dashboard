"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  mdiArrowDownCircleOutline,
  mdiCalendarMonthOutline,
  mdiClose,
  mdiEmailOutline,
  mdiHistory,
  mdiLoading,
  mdiMicrosoftExcel,
  mdiOpenInNew,
  mdiPostOutline,
  mdiPlus,
  mdiReload,
  mdiSend,
} from "@mdi/js";
import MdiIcon, { Icon } from "@mdi/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { sendCampaignReport } from "@/actions/campaign-report";
import { NotificationList } from "@/app/(dashboard)/campaigns/notifications/NotificationList";
import { NotificationCard } from "@/app/(dashboard)/campaigns/notifications/NotificationCard";
import { DropzoneUploadDialog } from "@/app/(dashboard)/campaigns/notifications/dropzone-upload-dialog";
import { DropsIcon } from "@/app/(dashboard)/sidebar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getProjectDropZone } from "@/services";
import type { CampaignReportMetrics } from "@/types/campaign-report";
import {
  isApiNotification,
  type NotificationByType,
} from "@/types/notifications";

type DockPanel =
  | "updates"
  | "drops"
  | "publications"
  | "schedule"
  | "send"
  | "export";

interface PublicationMedia {
  id: number;
  type: "Editorial";
  publication?: string | null;
  channel?: string | null;
  editorial_link?: string | null;
}

interface BottomDockProps {
  contentId?: number | string;
  handleDownloadData?: () => void;
  notifications?: unknown;
  media?: unknown;
  reportMetrics?: CampaignReportMetrics;
  reportLoading?: boolean;
}

const panelTitle: Record<DockPanel, string> = {
  updates: "Updates",
  drops: "Drops",
  publications: "Publications",
  schedule: "Campaign schedule",
  send: "Send report",
  export: "Export report",
};

export function BottomDock({
  contentId,
  handleDownloadData,
  notifications,
  media,
  reportMetrics,
  reportLoading = false,
}: BottomDockProps) {
  const router = useRouter();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState<DockPanel>("updates");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [dropzoneDialogOpen, setDropzoneDialogOpen] = useState(false);

  const isDropsPanelOpen = popoverOpen && activePanel === "drops";
  const {
    data: dropZones = [],
    isLoading: dropZonesLoading,
    isError: dropZonesError,
    refetch: refetchDropZones,
  } = useQuery({
    queryKey: ["project-dropzones", String(contentId)],
    queryFn: async () => {
      const dropZone = await getProjectDropZone(contentId!);
      return dropZone ? [dropZone] : [];
    },
    enabled: isDropsPanelOpen && Boolean(contentId),
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

  const updateNotifications = useMemo(
    () =>
      Array.isArray(notifications)
        ? notifications.filter(isApiNotification)
        : [],
    [notifications],
  );

  const publications = useMemo<PublicationMedia[]>(
    () =>
      Array.isArray(media)
        ? media.filter((item): item is PublicationMedia =>
            Boolean(
              item &&
              typeof item === "object" &&
              "id" in item &&
              typeof item.id === "number" &&
              "type" in item &&
              item.type === "Editorial",
            ),
          )
        : [],
    [media],
  );

  const selectPanel = (panel: DockPanel) => {
    if (popoverOpen && activePanel === panel) {
      setPopoverOpen(false);
      return;
    }

    setActivePanel(panel);
    setPopoverOpen(true);
  };

  const closePopover = () => setPopoverOpen(false);

  const handleSendEmail = async () => {
    if (!contentId || !email || !reportMetrics || reportLoading) return;

    setIsSending(true);

    try {
      const result = await sendCampaignReport({
        campaignId: String(contentId),
        recipient: email,
        metrics: reportMetrics,
      });

      if (result.success) {
        setEmail("");
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("The report could not be sent. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const openSchedule = () => {
    if (typeof document === "undefined") return;

    const schedule = document.getElementById("campaign-schedule");
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    schedule?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    closePopover();
  };

  const exportCsv = () => {
    handleDownloadData?.();
    closePopover();
  };

  const dockItems: Array<{
    id: DockPanel;
    label: string;
    icon: React.ReactNode;
    badge?: boolean;
  }> = [
    {
      id: "updates",
      label: "Updates",
      icon: <Icon className="size-full" path={mdiHistory} />,
    },
    {
      id: "drops",
      label: "Drops",
      icon: <DropsIcon className="size-full" />,
    },
    {
      id: "publications",
      label: "Publications",
      icon: <Icon path={mdiPostOutline} size={1} />,
    },
    // {
    //   id: "schedule",
    //   label: "Open campaign schedule",
    //   icon: <MdiIcon className="size-full" path={mdiCalendarMonthOutline} />,
    //   badge: true,
    // },
    {
      id: "send",
      label: "Send",
      icon: <MdiIcon className="size-full" path={mdiEmailOutline} />,
    },
    {
      id: "export",
      label: "Export CSV",
      icon: <MdiIcon className="size-full" path={mdiArrowDownCircleOutline} />,
    },
  ];

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center lg:left-32">
          <PopoverAnchor asChild>
            <div
              ref={toolbarRef}
              aria-label="Campaign report actions"
              className="flex h-[50px] w-[calc(100vw-2rem)] max-w-[310px] items-center justify-between rounded-sm border border-zinc-200/90 bg-white/95 px-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 shaodow-sm"
              role="toolbar"
            >
              {dockItems.map((item) => {
                const isActive = popoverOpen && activePanel === item.id;

                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={item.label}
                        aria-pressed={isActive}
                        className={`relative flex size-8 shrink-0 items-center justify-center rounded-md outline-none transition-[color,transform,background-color] duration-150 active:scale-[0.96] focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-400/35 dark:focus-visible:bg-zinc-900 ${
                          isActive
                            ? "text-zinc-950 dark:text-zinc-50"
                            : "text-zinc-800 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-500"
                        }`}
                        onClick={() => selectPanel(item.id)}
                      >
                        <span className="flex size-6 items-center justify-center">
                          {item.icon}
                        </span>
                        {item.badge && (
                          <span
                            aria-hidden="true"
                            className="absolute top-0 right-0 size-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950"
                          />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={10}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </PopoverAnchor>
        </div>

        <PopoverContent
          align="center"
          side="top"
          sideOffset={10}
          onInteractOutside={(event) => {
            const target = event.target;
            if (
              target instanceof Node &&
              toolbarRef.current?.contains(target)
            ) {
              event.preventDefault();
            }
          }}
          className={`w-[calc(100vw-2rem)] gap-0 overflow-hidden border-0 bg-white p-0 text-sm ring-1 ring-zinc-950/10 dark:bg-zinc-950 dark:ring-white/10 ${
            activePanel === "drops" ||
            activePanel === "updates" ||
            activePanel === "publications"
              ? "max-w-85"
              : "max-w-[310px]"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#d9e7f2] bg-[#edf5fb] py-1 px-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold tracking-[0.12em] text-zinc-500 uppercase dark:text-zinc-400">
              {panelTitle[activePanel]}
            </p>
            <button
              type="button"
              aria-label="Close panel"
              className="flex size-8 items-center justify-center rounded-md text-zinc-400 outline-none transition-[color,transform,background-color] duration-150 hover:bg-zinc-100 hover:text-zinc-700 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-zinc-400/35 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              onClick={closePopover}
            >
              <MdiIcon className="size-4" path={mdiClose} />
            </button>
          </div>

          {activePanel === "updates" && (
            <ScrollArea className="h-[min(46vh,360px)] min-h-48">
              {updateNotifications.length > 0 ? (
                updateNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                  />
                ))
              ) : (
                <p className="p-5 text-center text-sm text-gray-500">
                  No updates available.
                </p>
              )}
            </ScrollArea>
          )}

          {activePanel === "drops" && (
            <div className="flex min-h-0 flex-col">
              <ScrollArea className="h-[min(46vh,360px)] min-h-48">
                <div className="text-sm text-muted-foreground">
                  {dropZonesLoading && (
                    <p className="p-6 text-center text-neutral-500">
                      Loading drops…
                    </p>
                  )}
                  {dropZonesError && !dropZonesLoading && (
                    <div className="flex items-center justify-center gap-2 p-6 text-red-600">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => void refetchDropZones()}
                        aria-label="Reload drops"
                        title="Reload drops"
                        className="size-7 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                      >
                        <MdiIcon path={mdiReload} size={0.7} />
                      </Button>
                      <p>Drops could not be loaded.</p>
                    </div>
                  )}
                  {!dropZonesLoading && !dropZonesError && (
                    <NotificationList
                      notifications={dropNotifications}
                      emptyCategory="asset"
                    />
                  )}
                </div>
              </ScrollArea>

              <div className="shrink-0 border-t border-neutral-100 px-4 py-3 dark:border-zinc-800">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="h-9 flex-1 rounded-[6px] bg-zinc-950 text-white hover:bg-orange-500 dark:bg-zinc-100 dark:text-zinc-950"
                    onClick={() => router.push("/drops")}
                  >
                    View All Assets
                  </Button>
                  {contentId && (
                    <Button
                      type="button"
                      size="icon"
                      aria-label="Upload drop"
                      title="Upload drop"
                      className="size-9 shrink-0 rounded-[6px] bg-zinc-950 text-white hover:bg-orange-500 dark:bg-zinc-100 dark:text-zinc-950"
                      onClick={() => {
                        setPopoverOpen(false);
                        setDropzoneDialogOpen(true);
                      }}
                    >
                      <MdiIcon path={mdiPlus} size={0.8} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activePanel === "publications" && (
            <ScrollArea className="h-[min(46vh,360px)] min-h-48 [&_[data-slot=scroll-area-viewport]>div]:block! [&_[data-slot=scroll-area-viewport]>div]:w-full! [&_[data-slot=scroll-area-viewport]>div]:min-w-0!">
              {publications.length > 0 ? (
                <div className="w-full min-w-0 divide-y divide-neutral-100 dark:divide-zinc-800">
                  {publications.map((publication) => {
                    const name =
                      publication.publication?.trim() || "Untitled publication";
                    const channel = publication.channel?.trim();
                    const link = publication.editorial_link?.trim();

                    return (
                      <article
                        key={publication.id}
                        className="flex w-full min-w-0 items-start gap-3 bg-white px-5 py-4 dark:bg-zinc-950"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                          <Icon path={mdiPostOutline} size={1} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                            {name}
                          </p>
                          {channel && (
                            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {channel}
                            </p>
                          )}
                          {link && (
                            <Button
                              asChild
                              aria-label="View publication"
                              className="mt-2 h-8 shrink-0 rounded-full border-0 bg-neutral-950 px-4 text-xs font-semibold text-white shadow-none transition-colors hover:bg-neutral-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                            >
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View
                                <MdiIcon
                                  className="size-3.5"
                                  path={mdiOpenInNew}
                                />
                              </a>
                            </Button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="p-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No publications available.
                </p>
              )}
            </ScrollArea>
          )}

          {activePanel === "schedule" && (
            <div className="space-y-3 p-4">
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                View this campaign&apos;s calendar and scheduled activity.
              </p>
              <button
                type="button"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white outline-none transition-[background-color,transform] duration-150 hover:bg-zinc-800 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-zinc-500/35 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                onClick={openSchedule}
              >
                <MdiIcon className="size-4" path={mdiCalendarMonthOutline} />
                View schedule
              </button>
            </div>
          )}

          {activePanel === "send" && (
            <div className="p-4">
              <label className="sr-only" htmlFor="report-recipient-email">
                Recipient email
              </label>
              <div className="relative flex items-center">
                <input
                  id="report-recipient-email"
                  type="email"
                  autoComplete="email"
                  placeholder="hello@arroweye.pro"
                  className="h-auto w-full rounded-full border border-border bg-background px-4 py-[8px] pr-14 text-[17px] text-foreground shadow-none outline-none placeholder:text-[17px] disabled:opacity-70"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !isSending &&
                      !reportLoading &&
                      reportMetrics
                    ) {
                      void handleSendEmail();
                    }
                  }}
                  disabled={isSending || reportLoading}
                />
                <button
                  type="button"
                  aria-label="Send report email"
                  className="absolute right-1 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none transition-[background-color,transform] duration-150 hover:bg-primary/80 active:scale-[0.95] focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => void handleSendEmail()}
                  disabled={
                    isSending || reportLoading || !email || !reportMetrics
                  }
                >
                  {isSending ? (
                    <MdiIcon
                      className="size-4 animate-spin"
                      path={mdiLoading}
                    />
                  ) : (
                    <Icon className="size-4" path={mdiSend} />
                  )}
                </button>
              </div>
              {reportLoading && (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Preparing the latest campaign data…
                </p>
              )}
            </div>
          )}

          {activePanel === "export" && (
            <div className="p-4">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-left outline-none transition-[border-color,background-color,transform] duration-150 hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
                onClick={exportCsv}
                disabled={!handleDownloadData}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <Icon className="size-5" path={mdiMicrosoftExcel} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Download CSV
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                    Export campaign insight data
                  </span>
                </span>
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {contentId && (
        <DropzoneUploadDialog
          open={dropzoneDialogOpen}
          projectId={contentId}
          onOpenChange={setDropzoneDialogOpen}
          onUploaded={() => void refetchDropZones()}
        />
      )}
    </>
  );
}
