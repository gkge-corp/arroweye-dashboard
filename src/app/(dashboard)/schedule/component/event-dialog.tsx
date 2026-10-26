"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import type { FormErrors } from "@/hooks/use-schedule";
import { useEventDialog } from "../hooks/use-event-dialog";
import { useEventDrops } from "../hooks/use-event-drops";
import { useEventInvite } from "../hooks/use-event-invite";
import EventDetailsCard, {
  type EventDetailsActions,
} from "./event-details-card";
import EventForm, { type EventFormProps } from "./event-form";
import EventRescheduleView from "./event-reschedule-view";

interface EventDialogProps
  extends Omit<EventFormProps, "dialog" | "onCancel">, EventDetailsActions {
  onReschedule: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewOnly: boolean;
  isSubmitting: boolean;
  isEditing: boolean;
  onCancelEdit: () => void;
  onUpdate: (e: React.FormEvent<HTMLFormElement>) => void;
  formErrors: FormErrors;
}

const EventDialog = ({
  open,
  onOpenChange,
  viewOnly,
  isSubmitting,
  isEditing,
  onCancelEdit,
  onUpdate,
  formData,
  formErrors,
  campaignOptions,
  onFormChange,
  onSelectChange,
  onSubmit,
  onReschedule,
  pendingDrops,
  onPendingDropsChange,
  ...detailsActions
}: EventDialogProps) => {
  const dialog = useEventDialog({
    open,
    startDateTime: formData.start_dte,
    endDateTime: formData.end_dte,
    onFormChange,
  });
  const linkedDrops = useEventDrops(open && viewOnly ? formData.id : undefined);
  const eventInvite = useEventInvite(formData.id);

  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(80vh,500px)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border-zinc-200 bg-white p-5 text-zinc-950 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:max-w-lg"
      >
        <DialogDescription className="sr-only">
          {viewOnly
            ? "View, share, delete, or reschedule this event."
            : "Create a calendar event."}
        </DialogDescription>

        {viewOnly && dialog.isRescheduling ? (
          <EventRescheduleView
            dialog={dialog}
            formData={formData}
            formErrors={formErrors}
            onFormChange={onFormChange}
            onClose={close}
            onReschedule={onReschedule}
            isSubmitting={isSubmitting}
          />
        ) : viewOnly && isEditing ? (
          <EventForm
            mode="edit"
            dialog={dialog}
            formData={formData}
            formErrors={formErrors}
            campaignOptions={campaignOptions}
            onCancel={onCancelEdit}
            onFormChange={onFormChange}
            onSelectChange={onSelectChange}
            onSubmit={onUpdate}
            isSubmitting={isSubmitting}
          />
        ) : viewOnly ? (
          <EventDetailsCard
            dialog={dialog}
            formData={formData}
            onClose={close}
            linkedDrops={linkedDrops}
            isSendingInvite={eventInvite.isSendingInvite}
            onSendInvite={eventInvite.sendInvite}
            {...detailsActions}
          />
        ) : (
          <EventForm
            dialog={dialog}
            formData={formData}
            formErrors={formErrors}
            campaignOptions={campaignOptions}
            onCancel={close}
            onFormChange={onFormChange}
            onSelectChange={onSelectChange}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            pendingDrops={pendingDrops}
            onPendingDropsChange={onPendingDropsChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EventDialog;
