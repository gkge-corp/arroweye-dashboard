"use client";

import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarPlus, Info } from "lucide-react";
import { useScheduleCalendar } from "../hooks/use-schedule-calendar";
import "./schedule-calendar.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import EventDialog from "./event-dialog";
import { FieldSelect, fieldClassName } from "./field-select";

interface ScheduleProps {
  filterIcon?: boolean;
  isDateClickEnabled?: boolean;
  isSchedulePage?: boolean;
}

const InfoTooltip = ({ info }: { info: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground"
      >
        <Info />
        <span className="sr-only">More information</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent side="right" className="max-w-60">
      {info}
    </TooltipContent>
  </Tooltip>
);

const Schedule: React.FC<ScheduleProps> = ({
  filterIcon = true,
  isDateClickEnabled = false,
  isSchedulePage = false,
}) => {
  const {
    isModalVisible,
    setIsModalVisible,
    viewOnly,
    filter,
    setisFilter,
    deleteDialog,
    setDeleteDialog,
    deleteLoading,
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    projectPin,
    setProjectPin,
    pinEntered,
    setPinEntered,
    pinError,
    setPinError,
    vendorOptions,
    subvendorOptions,
    campaignOptions,
    events,
    exportICS,
    handleDelete,
    handleDateClick,
    handleCloseModal,
    handleFormChange,
    handleSelectChange,
    handleFormSubmit,
    rescheduleEvent,
    isSubmitting,
    isEditing,
    startEdit,
    cancelEdit,
    updateEvent,
    pendingDrops,
    setPendingDrops,
    canDeleteEvent,
    canEditEvent,
    eventCampaignTitle,
    requestDeleteEvent,
    openEventProject,
    handleCalendarEventClick,
    renderEventContent,
  } = useScheduleCalendar({
    isSchedulePage,
    isDateClickEnabled,
  });

  return (
    <div>
      <div className="schedule-container mb-[100px] space-y-[20px]">
        {filterIcon && (
          <div className="mb-[30px] flex items-center justify-center gap-[5px]">
            <Button
              type="button"
              size="icon-lg"
              className="h-12 w-12 rounded-full bg-[#5d00e4] text-white hover:bg-[#4d00bc]"
              onClick={() => setIsModalVisible(true)}
            >
              <CalendarPlus />
              <span className="sr-only">Add event</span>
            </Button>
          </div>
        )}
        <div className="schedule-calendar">
          <div className="sm:hidden">
            <FullCalendar
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                interactionPlugin,
              ]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
              events={events}
              eventClick={handleCalendarEventClick}
              eventContent={renderEventContent}
              dateClick={handleDateClick}
              editable={true}
              droppable={true}
            />
          </div>
          <div className="hidden sm:block">
            <FullCalendar
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                interactionPlugin,
              ]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
              }}
              events={events}
              eventClick={handleCalendarEventClick}
              eventContent={renderEventContent}
              dateClick={handleDateClick}
              editable={true}
              droppable={true}
            />
          </div>
        </div>
      </div>

      <EventDialog
        open={isModalVisible}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseModal();
          } else {
            setIsModalVisible(true);
          }
        }}
        viewOnly={viewOnly}
        formData={formData}
        formErrors={formErrors}
        campaignOptions={campaignOptions}
        onFormChange={handleFormChange}
        onSelectChange={handleSelectChange}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        isEditing={isEditing}
        onEdit={startEdit}
        onCancelEdit={cancelEdit}
        onUpdate={updateEvent}
        pendingDrops={pendingDrops}
        onPendingDropsChange={setPendingDrops}
        canDelete={canDeleteEvent}
        canEdit={canEditEvent}
        campaignTitle={eventCampaignTitle}
        onDelete={requestDeleteEvent}
        onShare={exportICS}
        onViewProject={openEventProject}
        onReschedule={rescheduleEvent}
      />

      <Dialog open={filter} onOpenChange={(open) => setisFilter(open)}>
        <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl border-zinc-200 bg-white p-6 text-zinc-950 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[12px] font-[500] uppercase tracking-[.16rem] text-zinc-500 dark:text-zinc-400">
              Select Calendar
            </DialogTitle>
            <DialogDescription className="sr-only">
              Choose vendor and subvendor calendar filters.
            </DialogDescription>
          </DialogHeader>

          <form>
            <div className="space-y-4 text-foreground">
              <div className="grid items-center gap-[20px]">
                <div className="w-full">
                  <FieldSelect
                    value={formData.vendor_id}
                    onChange={(value) =>
                      handleSelectChange({ name: "vendor_id", value })
                    }
                    options={vendorOptions}
                    placeholder="Select Vendor"
                  />
                </div>

                <div className="w-full">
                  <FieldSelect
                    value={formData.subvendor_id}
                    onChange={(value) =>
                      handleSelectChange({ name: "subvendor_id", value })
                    }
                    options={subvendorOptions}
                    placeholder="Select Subvendor"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center text-center">
                <Button
                  className="h-9 w-full rounded-full bg-zinc-900 px-5 text-sm text-white hover:bg-orange-600 dark:bg-zinc-900 dark:text-white"
                  type="submit"
                >
                  Generate
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog !== false}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog(false);
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl border-zinc-200 bg-white p-6 text-zinc-950 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <InfoTooltip info="Delete the dropzone selected" />
              <DialogTitle className="text-[12px] font-[500] uppercase tracking-[.16rem] text-zinc-500 dark:text-zinc-400">
                Delete Event
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Confirm the project pin before deleting this event.
            </DialogDescription>
          </DialogHeader>

          <p>
            Please note that deleting the event "{formData.title}" is not
            refundable.
          </p>

          <Input
            type="password"
            name="projectPin"
            autoComplete="new-password"
            className={fieldClassName}
            placeholder="Enter Pin"
            value={pinEntered}
            error={pinError ? "Wrong password entered" : undefined}
            onChange={(e) => {
              const newPin = e.target.value;
              setPinEntered(newPin);
              if (newPin.length >= 6) {
                setPinError(newPin !== projectPin);
              } else {
                setPinError(false);
              }
            }}
          />

          <DialogFooter className="mt-5 flex-row justify-start">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-full"
              onClick={() => setDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pinEntered.length < 6 || pinError || deleteLoading}
              className="h-9 rounded-full bg-red-600 text-white hover:bg-red-700"
              onClick={() => handleDelete(Number(formData.id))}
            >
              Delete Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;
