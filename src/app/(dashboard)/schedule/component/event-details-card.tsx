"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  Copy,
  FileText,
  LoaderCircle,
  Mail,
  Paperclip,
  MapPin,
  Megaphone,
  Pencil,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EventDialogState } from "../hooks/use-event-dialog";
import { formatTimeRange } from "../utils/event-date-time";
import { getEventStatusOption } from "../utils/event-status";
import type { EventDropsState } from "../hooks/use-event-drops";
import { copyToClipboard } from "../utils/copy-to-clipboard";
import EventHeader from "./event-header";
import { DropCombobox, LinkedDropList } from "./event-drops";

export interface EventDetailsActions {
  campaignTitle?: string;
  canDelete: boolean;
  canEdit: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onShare: () => void;
  onViewProject: () => void;
}

interface EventDetailsCardProps extends EventDetailsActions {
  dialog: EventDialogState;
  formData: Record<string, any>;
  onClose: () => void;
  linkedDrops: EventDropsState;
  isSendingInvite: boolean;
  onSendInvite: () => void;
}

const DetailRow = ({
  icon: Icon,
  iconSlot,
  tileClassName,
  label,
  action,
  children,
}: {
  icon?: LucideIcon;
  iconSlot?: React.ReactNode;
  tileClassName?: string;
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-4 border-b border-zinc-100 py-3 last:border-b-0 dark:border-zinc-800">
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
        tileClassName,
      )}
    >
      {Icon ? <Icon className="size-[18px]" /> : iconSlot}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{label}</p>
      <div className="mt-0.5 break-words text-[14px] text-zinc-950 dark:text-zinc-100">
        {children}
      </div>
    </div>
    {action}
  </div>
);

const HeaderAction = ({
  label,
  icon: Icon,
  onClick,
  className,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex size-8 items-center justify-center rounded-full border border-black bg-white/70 text-zinc-600 dark:border-white hover:bg-white dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-900",
          className,
        )}
      >
        <Icon className="size-4" />
        <span className="sr-only">{label}</span>
      </button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const EventDetailsCard = ({
  dialog,
  formData,
  onClose,
  campaignTitle,
  canDelete,
  canEdit,
  onDelete,
  onEdit,
  onShare,
  onViewProject,
  linkedDrops,
  isSendingInvite,
  onSendInvite,
}: EventDetailsCardProps) => {
  const status = getEventStatusOption(formData.status);
  const timeLabel = formatTimeRange(formData.start_dte, formData.end_dte);

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <EventHeader
        title={formData.title}
        description={formData.description}
        calendarEventId={formData.calendarEventId}
        isDialogTitle
        actions={
          <>
            {canEdit && (
              <HeaderAction label="Edit event" icon={Pencil} onClick={onEdit} />
            )}
            <HeaderAction label="Share" icon={Share2} onClick={onShare} />
            {canDelete && (
              <HeaderAction
                label="Delete event"
                icon={Trash2}
                onClick={onDelete}
                className="hover:text-red-600"
              />
            )}
            <HeaderAction label="Close" icon={X} onClick={onClose} />
          </>
        }
      />

      <div className="event-dialog-scroll min-h-0 flex-1 overflow-y-auto px-1">
        {campaignTitle && (
          <DetailRow
            icon={Megaphone}
            label="Campaign"
            action={
              <HeaderAction
                label="View campaign"
                icon={ArrowUpRight}
                onClick={onViewProject}
                className="shrink-0 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              />
            }
          >
            <span className="font-medium">{campaignTitle}</span>
          </DetailRow>
        )}
        <DetailRow icon={CalendarDays} label="Date">
          {dialog.dateLabel || "—"}
        </DetailRow>
        <DetailRow icon={Clock} label="Time">
          {timeLabel || "—"}
        </DetailRow>

        {formData.location && (
          <DetailRow
            icon={MapPin}
            label="Location"
            action={
              <HeaderAction
                label="Copy location"
                icon={Copy}
                onClick={() => copyToClipboard(formData.location, "Location")}
                className="shrink-0 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              />
            }
          >
            {formData.location}
          </DetailRow>
        )}
        {formData.description && (
          <DetailRow icon={FileText} label="Description">
            <span className="whitespace-pre-line">{formData.description}</span>
          </DetailRow>
        )}
        {status && (
          <DetailRow
            label="Status"
            tileClassName={status.tileClassName}
            iconSlot={
              <span
                className={cn("size-3.5 rounded-full", status.dotClassName)}
              />
            }
          >
            <span
              className={cn(
                "inline-flex rounded-md px-2.5 py-0.5 text-[13px] font-medium",
                status.pillClassName,
              )}
            >
              {status.label}
            </span>
          </DetailRow>
        )}
        <DetailRow icon={Paperclip} label="Attachments">
          <div className="mt-1 space-y-2">
            {linkedDrops.isLoading ? (
              <p className="text-[13px] text-zinc-500">Loading…</p>
            ) : linkedDrops.error ? (
              <p className="text-[13px] text-red-500">{linkedDrops.error}</p>
            ) : (
              <>
                <LinkedDropList
                  drops={linkedDrops.drops}
                  disabled={linkedDrops.isSaving}
                  confirmRemove
                  onRemove={linkedDrops.detach}
                />
                <DropCombobox
                  campaignId={formData.project}
                  linkedIds={linkedDrops.drops.map((drop) => drop.id)}
                  isSaving={linkedDrops.isSaving}
                  onSelect={linkedDrops.attach}
                />
              </>
            )}
          </div>
        </DetailRow>
      </div>

      <div className="flex shrink-0 gap-2">
        {canEdit && formData.project && (
          <Button
            type="button"
            variant="ghost"
            className="h-10 flex-1 rounded-xl bg-zinc-100 text-[14px] font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100"
            disabled={isSendingInvite}
            onClick={onSendInvite}
          >
            {isSendingInvite ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Mail />
            )}
            Resend invite
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          className="h-10 flex-1 rounded-xl bg-zinc-100 text-[14px] font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100"
          onClick={dialog.startReschedule}
        >
          Reschedule
        </Button>
      </div>
    </div>
  );
};

export default EventDetailsCard;
