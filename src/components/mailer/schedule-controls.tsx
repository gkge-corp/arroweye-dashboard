"use client";

import { ListChecks, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  formatDateLabel,
  parseDateKey,
  toDateKey,
} from "@/app/(dashboard)/schedule/utils/event-date-time";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { useMailer } from "@/hooks/use-mailer";
import { useScheduledInvitations } from "@/hooks/use-scheduled-invitations";
import {
  getAutoInviteUntil,
  todayInMailerZone,
} from "@/lib/mailer/schedule-dates";
import type { ScheduledInvitation } from "@/types/mailer";

import { ComposeIconButton } from "./compose-icon-button";

type Mailer = ReturnType<typeof useMailer>;

/** Opens from the Send menu, anchored to the Send button group passed as children. */
export function SchedulePopover({
  mailer,
  open,
  onOpenChange,
  children,
}: {
  mailer: Mailer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const [sendOn, setSendOn] = useState("");
  const today = parseDateKey(todayInMailerZone());
  const until = sendOn
    ? getAutoInviteUntil(sendOn, mailer.invitation.respondBy, mailer.invitation.date)
    : "";

  const handleSchedule = async () => {
    if (await mailer.scheduleSend(sendOn)) {
      onOpenChange(false);
      setSendOn("");
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent align="start" side="top" className="w-auto p-0">
        <p className="px-3 pt-3 text-sm font-medium">Schedule send</p>
        <Calendar
          mode="single"
          selected={parseDateKey(sendOn)}
          onSelect={(date) => setSendOn(date ? toDateKey(date) : "")}
          disabled={today ? { before: today } : undefined}
          className="[--cell-size:--spacing(9)]"
        />
        <div className="flex w-[18rem] flex-col gap-3 border-t border-border p-3 text-xs text-muted-foreground">
          {sendOn ? (
            <p>
              Sends on {formatDateLabel(sendOn)} between 9 and 10am (Lagos time),
              then invites new sheet rows each morning until{" "}
              {formatDateLabel(until)}.
            </p>
          ) : (
            <p>Pick the day the invitations go out.</p>
          )}
          <Button
            type="button"
            className="rounded-full"
            disabled={!sendOn || mailer.isScheduling}
            onClick={() => void handleSchedule()}
          >
            {mailer.isScheduling && <Loader2 className="size-4 animate-spin" />}
            {mailer.isScheduling ? "Scheduling…" : "Schedule invitation"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ScheduledRow({
  schedule,
  isCancelling,
  onCancel,
}: {
  schedule: ScheduledInvitation;
  isCancelling: boolean;
  onCancel: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <li className="flex flex-col gap-2 p-3 text-xs">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {schedule.invitation.title}
          </p>
          <p className="text-muted-foreground">
            {schedule.status === "scheduled"
              ? `Sends ${formatDateLabel(schedule.sendOn)}`
              : `${schedule.sentCount} sent`}
            {" · new rows until "}
            {formatDateLabel(schedule.autoInviteUntil)}
          </p>
          {schedule.lastError && (
            <p className="text-red-600">{schedule.lastError}</p>
          )}
        </div>
        {!isConfirming && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setIsConfirming(true)}
          >
            Cancel
          </Button>
        )}
      </div>
      {isConfirming && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
          <span className="text-foreground">
            {schedule.status === "scheduled"
              ? "Stop this invitation from sending?"
              : "Stop inviting new rows?"}
          </span>
          <div className="flex shrink-0 gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full"
              disabled={isCancelling}
              onClick={() => setIsConfirming(false)}
            >
              Keep
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="rounded-full"
              disabled={isCancelling}
              onClick={onCancel}
            >
              {isCancelling && <Loader2 className="size-3 animate-spin" />}
              {isCancelling ? "Cancelling…" : "Yes, cancel"}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

export function ScheduledList() {
  const { schedules, isLoading, cancelSchedule, cancellingId } =
    useScheduledInvitations();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <ComposeIconButton label="Scheduled invitations">
          <ListChecks className="size-[18px]" />
          {schedules.length > 0 && (
            <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
              {schedules.length}
            </span>
          )}
        </ComposeIconButton>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-80 p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading…</p>
        ) : schedules.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No scheduled invitations.
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-auto">
            {schedules.map((schedule) => (
              <ScheduledRow
                key={schedule.id}
                schedule={schedule}
                isCancelling={cancellingId === schedule.id}
                onCancel={() => cancelSchedule(schedule.id)}
              />
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
