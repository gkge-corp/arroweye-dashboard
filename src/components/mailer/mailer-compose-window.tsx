"use client";

import {
  mdiArrowCollapse,
  mdiArrowExpand,
  mdiClose,
  mdiDeleteOutline,
  mdiEyeOutline,
  mdiPencilOutline,
  mdiWindowMinimize,
} from "@mdi/js";
import Icon from "@mdi/react";
import { CalendarClock, ChevronDown, FlaskConical, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import type { useMailer } from "@/hooks/use-mailer";
import { cn } from "@/lib/utils";

import { ComposeIconButton } from "./compose-icon-button";
import { InvitationForm } from "./invitation-form";
import { InvitationPreview } from "./invitation-preview";
import { ScheduledList, SchedulePopover } from "./schedule-controls";

type Mailer = ReturnType<typeof useMailer>;
export type ComposeWindowMode = "open" | "minimized" | "maximized";

interface MailerComposeWindowProps {
  mailer: Mailer;
  mode: ComposeWindowMode;
  onModeChange: (mode: ComposeWindowMode) => void;
  onClose: () => void;
}

const rowClass =
  "flex items-center gap-2 border-b border-border px-4 text-sm text-foreground";

function HeaderButton({
  label,
  path,
  onClick,
  disabled,
}: {
  label: string;
  path: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="rounded p-1 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
    >
      <Icon path={path} className="size-4" />
    </button>
  );
}

function ComposeHeader({
  mode,
  onModeChange,
  onClose,
  closeDisabled,
}: Omit<MailerComposeWindowProps, "mailer"> & { closeDisabled: boolean }) {
  const isMinimized = mode === "minimized";

  return (
    <div
      className="flex h-10 shrink-0 cursor-pointer items-center justify-between rounded-t-xl bg-zinc-800 pl-4 pr-2 text-sm font-medium text-white dark:bg-zinc-900"
      onClick={() => onModeChange(isMinimized ? "open" : "minimized")}
    >
      <span>New Invitation</span>
      <div className="flex items-center gap-0.5">
        <HeaderButton
          label={isMinimized ? "Restore" : "Minimise"}
          path={mdiWindowMinimize}
          onClick={() => onModeChange(isMinimized ? "open" : "minimized")}
        />
        <HeaderButton
          label={mode === "maximized" ? "Exit full screen" : "Full screen"}
          path={mode === "maximized" ? mdiArrowCollapse : mdiArrowExpand}
          onClick={() =>
            onModeChange(mode === "maximized" ? "open" : "maximized")
          }
        />
        <HeaderButton
          label="Close"
          path={mdiClose}
          onClick={onClose}
          disabled={closeDisabled}
        />
      </div>
    </div>
  );
}

function RecipientsRow({ mailer, disabled }: { mailer: Mailer; disabled: boolean }) {
  if (mailer.recipients.length > 0) {
    return (
      <div className={cn(rowClass, "min-h-10 py-1.5")}>
        <span className="text-muted-foreground">To</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
          {mailer.recipients.length} recipients from sheet
          <button
            type="button"
            aria-label="Remove recipients"
            disabled={disabled}
            onClick={mailer.clearRecipients}
            className="text-muted-foreground hover:text-foreground"
          >
            <Icon path={mdiClose} className="size-3" />
          </button>
        </span>
        {mailer.alreadyInvited > 0 && (
          <span className="text-xs text-muted-foreground">
            {mailer.alreadyInvited} already invited
          </span>
        )}
        {mailer.skipped > 0 && (
          <span className="text-xs text-muted-foreground">
            {mailer.skipped} rows skipped
          </span>
        )}
      </div>
    );
  }

  return (
    <form
      className={rowClass}
      onSubmit={(event) => {
        event.preventDefault();
        void mailer.importSheet();
      }}
    >
      <span className="text-muted-foreground">To</span>
      <input
        type="url"
        placeholder="Paste the guest list Google Sheet link"
        className="h-10 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:opacity-60"
        value={mailer.sheetUrl}
        disabled={disabled || mailer.isImporting}
        onChange={(event) => mailer.setSheetUrl(event.target.value)}
      />
      <button
        type="submit"
        disabled={!mailer.sheetUrl.trim() || mailer.isImporting || disabled}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-40"
      >
        {mailer.isImporting && <Loader2 className="size-3 animate-spin" />}
        {mailer.isImporting ? "Importing…" : "Import"}
      </button>
    </form>
  );
}

function SendStatus({ mailer }: { mailer: Mailer }) {
  const { progress } = mailer;
  if (!progress) return null;

  const handled = progress.sent + progress.failed.length;

  return (
    <div className="flex flex-col gap-1.5 border-t border-border px-4 pt-2 text-xs text-muted-foreground">
      <Progress value={(handled / progress.total) * 100} />
      <span>
        {progress.done ? "Finished" : "Sending…"} · {progress.sent} sent ·{" "}
        {progress.failed.length} failed of {progress.total}
      </span>
      {progress.done && progress.failed.length > 0 && (
        <ul className="max-h-20 overflow-auto text-red-600">
          {progress.failed.map((failure) => (
            <li key={failure.email}>
              {failure.email} — {failure.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SendMenu({
  mailer,
  busy,
  onSchedule,
}: {
  mailer: Mailer;
  busy: boolean;
  onSchedule: () => void;
}) {
  const scheduleChosen = useRef(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          aria-label="More send options"
          className="h-9 rounded-l-none rounded-r-full border-l border-blue-500 bg-blue-600 pl-2 pr-3 text-white hover:bg-blue-700"
          disabled={!mailer.canSend || busy}
        >
          {mailer.isSendingTest || mailer.isScheduling ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        // Opening the schedule popover while the menu is still closing lets the
        // menu's focus handling dismiss it, so it opens once the menu is gone.
        onCloseAutoFocus={(event) => {
          if (!scheduleChosen.current) return;
          event.preventDefault();
          scheduleChosen.current = false;
          onSchedule();
        }}
      >
        <DropdownMenuItem
          onSelect={() => {
            scheduleChosen.current = true;
          }}
        >
          <CalendarClock className="size-4" />
          Schedule send
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!mailer.testEmail}
          onSelect={() => void mailer.sendTest()}
        >
          <FlaskConical className="size-4" />
          Send test to me
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ComposeFooter({
  mailer,
  busy,
  isPreviewing,
  onTogglePreview,
  onSend,
}: {
  mailer: Mailer;
  busy: boolean;
  isPreviewing: boolean;
  onTogglePreview: () => void;
  onSend: () => void;
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3">
      <SchedulePopover
        mailer={mailer}
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
      >
        <div className="flex items-center">
          <Button
            type="button"
            className="h-9 rounded-l-full rounded-r-none bg-blue-600 pl-6 pr-4 text-sm text-white hover:bg-blue-700"
            disabled={!mailer.canSend || busy}
            title={mailer.invitationError ?? undefined}
            onClick={onSend}
          >
            {mailer.isSendingAll && <Loader2 className="size-4 animate-spin" />}
            {mailer.isSendingAll ? "Sending…" : "Send"}
          </Button>
          <SendMenu
            mailer={mailer}
            busy={busy}
            onSchedule={() => setScheduleOpen(true)}
          />
        </div>
      </SchedulePopover>
      <div className="flex items-center gap-0.5">
        <ScheduledList />
        <ComposeIconButton
          label={isPreviewing ? "Back to editing" : "Preview"}
          onClick={onTogglePreview}
        >
          <Icon
            path={isPreviewing ? mdiPencilOutline : mdiEyeOutline}
            className="size-[18px]"
          />
        </ComposeIconButton>
        <ComposeIconButton label="Discard draft" disabled={busy} onClick={mailer.reset}>
          <Icon path={mdiDeleteOutline} className="size-5" />
        </ComposeIconButton>
      </div>
    </div>
  );
}

export function MailerComposeWindow({
  mailer,
  mode,
  onModeChange,
  onClose,
}: MailerComposeWindowProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const busy =
    mailer.isSending ||
    mailer.isSendingTest ||
    mailer.isPreparing ||
    mailer.isScheduling;
  const isMaximized = mode === "maximized";

  return (
    <>
      {isMaximized && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => onModeChange("open")}
        />
      )}
      <div
        role="dialog"
        aria-label="New Invitation"
        className={cn(
          "fixed z-40 flex flex-col overflow-hidden rounded-t-xl bg-background shadow-2xl ring-1 ring-border",
          mode === "minimized" && "bottom-0 right-4 w-72 sm:right-16",
          mode === "open" &&
            "bottom-0 right-0 h-[min(640px,90vh)] w-full sm:right-16 sm:w-[560px]",
          isMaximized &&
            "inset-x-4 bottom-[5vh] top-[5vh] mx-auto max-w-3xl rounded-b-xl",
        )}
      >
        <ComposeHeader
          mode={mode}
          onModeChange={onModeChange}
          onClose={onClose}
          closeDisabled={busy}
        />
        {mode !== "minimized" && (
          <>
            <RecipientsRow mailer={mailer} disabled={busy} />
            <div className="min-h-0 flex-1 overflow-y-auto">
              {isPreviewing ? (
                <InvitationPreview mailer={mailer} />
              ) : (
                <InvitationForm mailer={mailer} disabled={busy} />
              )}
            </div>
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              Sending ticks &quot;Invite sent?&quot;. Accept ticks &quot;Confirmed&quot;;
              Decline clears it and notes &quot;Declined&quot;.
            </p>
            <SendStatus mailer={mailer} />
            <ComposeFooter
              mailer={mailer}
              busy={busy}
              isPreviewing={isPreviewing}
              onTogglePreview={() => setIsPreviewing((current) => !current)}
              onSend={() => setConfirmOpen(true)}
            />
          </>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send this invitation?</DialogTitle>
            <DialogDescription>
              {mailer.recipients.length} people will each get their own
              invitation. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => {
                setConfirmOpen(false);
                void mailer.sendAll();
              }}
            >
              Send now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
