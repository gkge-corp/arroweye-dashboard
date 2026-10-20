"use client";

import EventDialog from "@/app/(dashboard)/schedule/component/event-dialog";
import type { CampaignScheduleState } from "./hooks/use-campaign-schedule";

export function CampaignEventDialog({
  schedule,
}: {
  schedule: CampaignScheduleState;
}) {
  return (
    <EventDialog
      open={schedule.isModalVisible}
      onOpenChange={(open) => {
        if (!open) {
          schedule.handleCloseModal();
        } else {
          schedule.setIsModalVisible(true);
        }
      }}
      viewOnly={schedule.viewOnly}
      formData={schedule.formData}
      formErrors={schedule.formErrors}
      vendorOptions={schedule.vendorOptions}
      subvendorOptions={schedule.subvendorOptions}
      campaignOptions={schedule.campaignOptions}
      onFormChange={schedule.handleFormChange}
      onSelectChange={schedule.handleSelectChange}
      onSubmit={schedule.handleFormSubmit}
      isSubmitting={schedule.isSubmitting}
      isEditing={schedule.isEditing}
      onEdit={schedule.startEdit}
      onCancelEdit={schedule.cancelEdit}
      onUpdate={schedule.updateEvent}
      pendingDrops={schedule.pendingDrops}
      onPendingDropsChange={schedule.setPendingDrops}
      canDelete={schedule.canDeleteEvent}
      campaignTitle={schedule.eventCampaignTitle}
      onDelete={schedule.requestDeleteEvent}
      onShare={schedule.exportICS}
      onViewProject={schedule.openEventProject}
      onReschedule={schedule.rescheduleEvent}
    />
  );
}
