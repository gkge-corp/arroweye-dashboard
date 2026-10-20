"use client";

import { Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  publicationChannels,
  usePublicationForm,
  type PublicationMedia,
} from "@/hooks/use-publication-form";
import {
  FieldLabel,
  eventFieldClassName,
  iconClassName,
  inputSlotClassName,
  triggerClassName,
} from "@/app/(dashboard)/schedule/component/event-fields";

interface PublicationDialogProps {
  open: boolean;
  projectId: number | string;
  /** Edits this publication; omit to create a new one. */
  publication?: PublicationMedia;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function PublicationDialog({
  open,
  projectId,
  publication,
  onOpenChange,
  onSaved,
}: PublicationDialogProps) {
  const { formData, errors, setField, isSaving, isEditing, handleSubmit } =
    usePublicationForm({ open, projectId, publication, onSaved, onOpenChange });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border-zinc-200 bg-white p-5 text-zinc-950 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:max-w-lg"
      >
        <DialogDescription className="sr-only">
          {isEditing
            ? "Edit this editorial publication."
            : "Add an editorial publication to this campaign."}
        </DialogDescription>

        <form className="space-y-3.5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              className="h-8 justify-self-start rounded-lg bg-zinc-100 px-3.5 text-[14px] text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <DialogTitle className="text-[16px] font-semibold">
              {isEditing ? "Edit Publication" : "New Publication"}
            </DialogTitle>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-8 justify-self-end rounded-lg bg-[#5300d7] px-4 text-[14px] text-white hover:bg-[#4700b8]"
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>

          <div>
            <FieldLabel htmlFor="publication-name">Publication</FieldLabel>
            <Input
              id="publication-name"
              placeholder="e.g. Pulse Nigeria"
              value={formData.publication}
              onChange={(event) => setField("publication", event.target.value)}
              disabled={isSaving}
              error={errors.publication}
              className={eventFieldClassName}
            />
          </div>

          <div>
            <FieldLabel htmlFor="publication-channel">Channel</FieldLabel>
            <Select
              value={formData.channel || undefined}
              onValueChange={(channel) => setField("channel", channel)}
              disabled={isSaving}
            >
              <SelectTrigger
                id="publication-channel"
                aria-invalid={Boolean(errors.channel)}
                className={cn(
                  triggerClassName,
                  "justify-between",
                  errors.channel && "border-red-500",
                )}
              >
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                {publicationChannels.map((channel) => (
                  <SelectItem key={channel.value} value={channel.value}>
                    {channel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.channel && (
              <p className="mt-1 text-xs text-red-500">{errors.channel}</p>
            )}
          </div>

          <div>
            <FieldLabel htmlFor="publication-link">Link</FieldLabel>
            <div className="relative">
              <span
                className={cn(
                  inputSlotClassName,
                  "pointer-events-none left-3 z-10",
                )}
              >
                <Link2 className={iconClassName} />
              </span>
              <Input
                id="publication-link"
                type="url"
                placeholder="https://"
                value={formData.link}
                onChange={(event) => setField("link", event.target.value)}
                disabled={isSaving}
                error={errors.link}
                className={cn(eventFieldClassName, "!pl-9")}
              />
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
