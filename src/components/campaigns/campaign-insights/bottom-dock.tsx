"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  mdiCalendarMonthOutline,
  mdiClose,
  mdiEmailOutline,
  mdiHistory,
  mdiLoading,
  mdiPencilOutline,
  mdiPostOutline,
  mdiPlus,
  mdiRadioTower,
  mdiReload,
  mdiSend,
  mdiTrashCanOutline,
} from "@mdi/js";
import MdiIcon, { Icon } from "@mdi/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { sendCampaignReport } from "@/actions/campaign-report";
import { NotificationList } from "@/app/(dashboard)/campaigns/notifications/NotificationList";
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
import { useRadioMonitorDownload } from "@/hooks/use-radio-monitor-download";
import { getProjectDropZone } from "@/services";
import type {
  CampaignReportMetrics,
  SendCampaignReportResult,
} from "@/types/campaign-report";
import {
  isApiNotification,
  type NotificationByType,
} from "@/types/notifications";
import type { PublicationMedia } from "@/hooks/use-publication-form";
import { DeletePublicationDialog } from "./delete-publication-dialog";
import { PublicationDialog } from "./publication-dialog";
import { CampaignEventDialog } from "./campaign-event-dialog";
import { useCampaignSchedule } from "./hooks/use-campaign-schedule";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type DockPanel = "updates" | "drops" | "publications" | "schedule" | "send";

export interface BottomDockProps {
  contentId?: number | string;
  notifications?: unknown;
  media?: unknown;
  reportMetrics?: CampaignReportMetrics;
  reportLoading?: boolean;
  /** Replaces the campaign report send, for pages with their own report. */
  onSendReport?: (recipient: string) => Promise<SendCampaignReportResult>;
  onPublicationsChanged?: () => void;
}

const panelTitle: Record<DockPanel, string> = {
  updates: "Updates",
  drops: "Drops",
  publications: "Publications",
  schedule: "Campaign schedule",
  send: "Send report",
};

export function BottomDock({
  contentId,
  notifications,
  media,
  reportMetrics,
  reportLoading = false,
  onSendReport,
  onPublicationsChanged,
}: BottomDockProps) {
  const router = useRouter();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState<DockPanel>("updates");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [dropzoneDialogOpen, setDropzoneDialogOpen] = useState(false);
  const [publicationDialogOpen, setPublicationDialogOpen] = useState(false);
  const [editingPublication, setEditingPublication] =
    useState<PublicationMedia>();
  const [publicationToDelete, setPublicationToDelete] =
    useState<PublicationMedia>();

  const openPublicationDialog = (publication?: PublicationMedia) => {
    setPopoverOpen(false);
    setEditingPublication(publication);
    setPublicationDialogOpen(true);
  };
  const projectId = Number(contentId) || undefined;
  const schedule = useCampaignSchedule(projectId);
  const radioMonitor = useRadioMonitorDownload();

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

  const canSendReport = Boolean(onSendReport || reportMetrics);

  const handleSendEmail = async () => {
    const recipient = email.trim();
    if (!contentId || !recipient || !canSendReport || reportLoading) return;

    if (!EMAIL_PATTERN.test(recipient)) {
      toast.error("Enter a valid email address.");
      return;
    }

    setIsSending(true);

    try {
      const result = onSendReport
        ? await onSendReport(recipient)
        : await sendCampaignReport({
            campaignId: String(contentId),
            recipient,
            metrics: reportMetrics!,
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

  const dockItems: Array<{
    id: DockPanel | "radio-monitor";
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
    {
      id: "schedule",
      label: "Schedule",
      icon: <MdiIcon className="size-full" path={mdiCalendarMonthOutline} />,
    },
    {
      id: "send",
      label: "Send",
      icon: <MdiIcon className="size-full" path={mdiEmailOutline} />,
    },
    {
      id: "radio-monitor",
      label: "Download radio monitor",
      icon: (
        <MdiIcon
          className={`size-full ${radioMonitor.isDownloading ? "animate-spin" : ""}`}
          path={radioMonitor.isDownloading ? mdiLoading : mdiRadioTower}
        />
      ),
    },
  ];

  // Sending needs report figures or a page-specific sender.
  const visibleDockItems = dockItems.filter(
    (item) =>
      (item.id !== "send" || canSendReport) &&
      (item.id !== "schedule" || projectId),
  );

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
              {visibleDockItems.map((item) => {
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
                        disabled={
                          item.id === "radio-monitor" &&
                          radioMonitor.isDownloading
                        }
                        onClick={() =>
                          item.id === "radio-monitor"
                            ? radioMonitor.download()
                            : selectPanel(item.id)
                        }
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
            activePanel === "publications" ||
            activePanel === "schedule"
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
              <NotificationList
                notifications={updateNotifications}
                emptyCategory="campaign"
              />
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
            <div className="flex min-h-0 flex-col">
              <ScrollArea className="h-[min(46vh,360px)] min-h-48 [&_[data-slot=scroll-area-viewport]>div]:block! [&_[data-slot=scroll-area-viewport]>div]:w-full! [&_[data-slot=scroll-area-viewport]>div]:min-w-0!">
                {publications.length > 0 ? (
                  <div className="w-full min-w-0 divide-y divide-neutral-100 dark:divide-zinc-800">
                    {publications.map((publication) => {
                      const name =
                        publication.publication?.trim() ||
                        "Untitled publication";
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
                            <div className="mt-2 flex items-center gap-1">
                              {link && (
                                <Button
                                  asChild
                                  aria-label="View publication"
                                  className="mr-1 shrink-0 rounded-full border-0 bg-neutral-950 px-4 text-xs font-semibold text-white shadow-none transition-colors hover:bg-neutral-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                                >
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    View
                                  </a>
                                </Button>
                              )}
                              {contentId && (
                                <>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Edit ${name}`}
                                    title="Edit publication"
                                    className="size-8 rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                    onClick={() =>
                                      openPublicationDialog(publication)
                                    }
                                  >
                                    <MdiIcon
                                      path={mdiPencilOutline}
                                      size={0.7}
                                    />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Delete ${name}`}
                                    title="Delete publication"
                                    className="size-8 rounded-full text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                                    onClick={() => {
                                      setPopoverOpen(false);
                                      setPublicationToDelete(publication);
                                    }}
                                  >
                                    <MdiIcon
                                      path={mdiTrashCanOutline}
                                      size={0.7}
                                    />
                                  </Button>
                                </>
                              )}
                            </div>
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

              {contentId && (
                <div className="shrink-0 border-t border-neutral-100 px-4 py-3 dark:border-zinc-800">
                  <Button
                    type="button"
                    className="h-9 w-full rounded-[6px] bg-zinc-950 text-white hover:bg-orange-500 dark:bg-zinc-100 dark:text-zinc-950"
                    onClick={() => openPublicationDialog()}
                  >
                    <MdiIcon path={mdiPlus} size={0.8} />
                    Add Publication
                  </Button>
                </div>
              )}
            </div>
          )}

          {activePanel === "schedule" && (
            <div className="flex min-h-0 flex-col">
              <ScrollArea className="h-[min(46vh,360px)] min-h-48 [&_[data-slot=scroll-area-viewport]>div]:block! [&_[data-slot=scroll-area-viewport]>div]:w-full! [&_[data-slot=scroll-area-viewport]>div]:min-w-0!">
                {schedule.isLoading ? (
                  <p className="p-6 text-center text-sm text-neutral-500">
                    Loading events…
                  </p>
                ) : schedule.campaignEvents.length > 0 ? (
                  <div className="w-full min-w-0 divide-y divide-neutral-100 dark:divide-zinc-800">
                    {schedule.campaignEvents.map((event) => (
                      <button
                        type="button"
                        key={event.id}
                        className="flex w-full min-w-0 items-start gap-3 bg-white px-5 py-4 text-left outline-none transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:focus-visible:bg-zinc-900"
                        onClick={() => {
                          setPopoverOpen(false);
                          schedule.openEventDetails(event.details);
                        }}
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                          <MdiIcon
                            className="size-5"
                            path={mdiCalendarMonthOutline}
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                            {event.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {event.dateLabel}
                          </p>
                          {event.location && (
                            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {event.location}
                            </p>
                          )}
                        </div>
                        {event.status && (
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${event.status.pillClassName}`}
                          >
                            {event.status.label}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="p-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No events scheduled for this campaign.
                  </p>
                )}
              </ScrollArea>

              <div className="shrink-0 border-t border-neutral-100 px-4 py-3 dark:border-zinc-800">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="h-9 flex-1 rounded-[6px] bg-zinc-950 text-white hover:bg-orange-500 dark:bg-zinc-100 dark:text-zinc-950"
                    onClick={() => router.push("/schedule")}
                  >
                    View Calendar
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    aria-label="Add event"
                    title="Add event"
                    className="size-9 shrink-0 rounded-[6px] bg-zinc-950 text-white hover:bg-orange-500 dark:bg-zinc-100 dark:text-zinc-950"
                    onClick={() => {
                      setPopoverOpen(false);
                      schedule.openCreateModal();
                    }}
                  >
                    <MdiIcon path={mdiPlus} size={0.8} />
                  </Button>
                </div>
              </div>
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
                      canSendReport
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
                    isSending || reportLoading || !email || !canSendReport
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

      {contentId && (
        <>
          <PublicationDialog
            open={publicationDialogOpen}
            projectId={contentId}
            publication={editingPublication}
            onOpenChange={setPublicationDialogOpen}
            onSaved={onPublicationsChanged}
          />
          <DeletePublicationDialog
            publication={publicationToDelete}
            onOpenChange={(open) => {
              if (!open) setPublicationToDelete(undefined);
            }}
            onDeleted={onPublicationsChanged}
          />
        </>
      )}

      {projectId && <CampaignEventDialog schedule={schedule} />}
    </>
  );
}
