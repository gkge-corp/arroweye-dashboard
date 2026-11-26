"use client";

import { mdiClose, mdiImagePlusOutline } from "@mdi/js";
import Icon from "@mdi/react";
import { CalendarDays, CalendarSearch, ChevronDown } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import {
  CountedTextarea,
  eventFieldClassName,
  FieldLabel,
  iconClassName,
  TimeSelect,
  triggerClassName,
} from "@/app/(dashboard)/schedule/component/event-fields";
import {
  formatDateLabel,
  getTimeOptions,
  parseDateKey,
  toDateKey,
} from "@/app/(dashboard)/schedule/utils/event-date-time";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  toInvitationEventFields,
  useInvitationEvents,
} from "@/hooks/use-invitation-events";
import type { useMailer } from "@/hooks/use-mailer";
import { MAILER_IMAGE_TYPES } from "@/lib/mailer/limits";
import { cn } from "@/lib/utils";
import type { InvitationFields } from "@/types/mailer";

type Mailer = ReturnType<typeof useMailer>;

function DatePickerField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseDateKey(value);
  const dateLabel = formatDateLabel(value);

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button id={id} type="button" disabled={disabled} className={triggerClassName}>
            <CalendarDays className={iconClassName} />
            <span className={cn("flex-1 truncate", !dateLabel && "text-zinc-400")}>
              {dateLabel || "Select date"}
            </span>
            <ChevronDown className="size-4 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              onChange(date ? toDateKey(date) : "");
              setOpen(false);
            }}
            disabled={{ before: new Date() }}
            className="[--cell-size:--spacing(9)]"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function EventPicker({ mailer, disabled }: { mailer: Mailer; disabled: boolean }) {
  const { events, isLoading } = useInvitationEvents();
  const [eventId, setEventId] = useState("");

  const handleSelect = (value: string) => {
    const event = events.find((item) => String(item.id) === value);
    if (!event) return;
    setEventId(value);
    mailer.fillFromEvent(toInvitationEventFields(event));
  };

  return (
    <div>
      <FieldLabel htmlFor="invitation-event">Fill from schedule</FieldLabel>
      <Select
        value={eventId}
        onValueChange={handleSelect}
        disabled={disabled || isLoading || events.length === 0}
      >
        <SelectTrigger id="invitation-event" className={cn(triggerClassName, "justify-between")}>
          {/* div, not span: SelectTrigger line-clamps direct span children */}
          <div className="flex min-w-0 items-center gap-3">
            <CalendarSearch className={iconClassName} />
            <SelectValue
              placeholder={
                isLoading
                  ? "Loading events…"
                  : events.length
                    ? "Pick an upcoming event, or fill in below"
                    : "No upcoming events"
              }
            />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {events.map((event) => (
            <SelectItem key={event.id} value={String(event.id)}>
              {event.title}
              <span className="text-zinc-400">
                {" · "}
                {formatDateLabel(toInvitationEventFields(event).date)}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function HeroImagePicker({ mailer, disabled }: { mailer: Mailer; disabled: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { image } = mailer;

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !disabled) mailer.pickImage(file);
  };

  return (
    <div>
      <FieldLabel>Hero image</FieldLabel>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          // Moving over the box's own children also fires dragleave.
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={cn(
          "rounded-lg transition-shadow",
          isDragging && "ring-2 ring-violet-500/40",
        )}
      >
        {image ? (
          <div className="relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img
              src={image.previewUrl}
              alt={image.name}
              className="max-h-40 w-full object-cover"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label="Remove image"
              disabled={disabled}
              onClick={mailer.removeImage}
              className="absolute right-2 top-2 rounded-full"
            >
              <Icon path={mdiClose} className="size-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="h-20 w-full rounded-lg border-dashed text-[14px] text-zinc-500"
          >
            <Icon path={mdiImagePlusOutline} className="size-5" />
            {isDragging ? "Drop image here" : "Drag an image here, or click to choose"}
          </Button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={MAILER_IMAGE_TYPES.join(",")}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) mailer.pickImage(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}

export function InvitationForm({ mailer, disabled }: { mailer: Mailer; disabled: boolean }) {
  const { invitation, updateInvitation } = mailer;

  const textField = (
    field: keyof InvitationFields,
    label: string,
    placeholder = "",
  ) => (
    <div>
      <FieldLabel htmlFor={`invitation-${field}`}>{label}</FieldLabel>
      <Input
        id={`invitation-${field}`}
        value={invitation[field]}
        placeholder={placeholder}
        maxLength={200}
        disabled={disabled}
        onChange={(event) => updateInvitation(field, event.target.value)}
        className={eventFieldClassName}
      />
    </div>
  );

  const timeField = (field: "startTime" | "endTime", label: string) => (
    <div>
      <FieldLabel htmlFor={`invitation-${field}`}>{label}</FieldLabel>
      <TimeSelect
        id={`invitation-${field}`}
        value={invitation[field]}
        options={getTimeOptions(invitation[field])}
        onChange={(value) => updateInvitation(field, value)}
        disabled={disabled}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <EventPicker mailer={mailer} disabled={disabled} />
      {textField("tagline", "Tagline")}
      {textField("title", "Event title *", "Lagos Campaign Stop")}
      <DatePickerField
        id="invitation-date"
        label="Date *"
        value={invitation.date}
        onChange={(value) => updateInvitation("date", value)}
        disabled={disabled}
      />
      <div className="grid grid-cols-2 gap-3">
        {timeField("startTime", "Start time")}
        {timeField("endTime", "End time")}
      </div>
      {textField("location", "Location *", "Lagos, Nigeria")}
      <DatePickerField
        id="invitation-respond-by"
        label="Respond by"
        value={invitation.respondBy}
        onChange={(value) => updateInvitation("respondBy", value)}
        disabled={disabled}
      />
      <HeroImagePicker mailer={mailer} disabled={disabled} />
      {textField("heading", "Heading")}
      <CountedTextarea
        id="invitation-message"
        name="message"
        label="Message"
        value={invitation.message}
        maxLength={1000}
        onChange={(event) => updateInvitation("message", event.target.value)}
      />
    </div>
  );
}
