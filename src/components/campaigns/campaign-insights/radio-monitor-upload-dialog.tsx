"use client";

import { mdiCloudUploadOutline } from "@mdi/js";
import Icon from "@mdi/react";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  RADIO_MONITOR_ACCEPT,
  useRadioMonitorUpload,
  validateRadioMonitorFile,
} from "./hooks/use-radio-monitor-upload";

interface RadioMonitorUploadDialogProps {
  open: boolean;
  campaignId?: string | number;
  onOpenChange: (open: boolean) => void;
}

const formatUploadedAt = (value: string) =>
  new Date(value).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function RadioMonitorUploadDialog({
  open,
  campaignId,
  onOpenChange,
}: RadioMonitorUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { currentFile, isLoadingFile, fileError, upload, isUploading } =
    useRadioMonitorUpload(campaignId, open);

  useEffect(() => {
    if (!open) setSelectedFile(null);
  }, [open]);

  const selectFile = (file?: File) => {
    if (!file) return;
    const error = validateRadioMonitorFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await upload(selectedFile);
      toast.success("Radio monitor uploaded.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The file could not be uploaded.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={isUploading ? undefined : onOpenChange}>
      <DialogContent className="gap-5 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Upload radio monitor
          </DialogTitle>
          <DialogDescription>
            Recipients of the campaign report get a link to download this file.
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed px-4 py-8 text-center transition-colors hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-60",
            isDragging && "border-primary bg-primary/5",
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            selectFile(event.dataTransfer.files?.[0]);
          }}
          disabled={isUploading}
        >
          <Icon path={mdiCloudUploadOutline} size={1.2} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {selectedFile ? selectedFile.name : "Drop a file or click to browse"}
          </span>
          <span className="text-xs text-muted-foreground">
            CSV or PDF, up to 10MB
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={RADIO_MONITOR_ACCEPT}
          className="hidden"
          onChange={(event) => {
            selectFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        <p className="text-xs text-muted-foreground">
          {isLoadingFile
            ? "Checking for an existing file…"
            : fileError
              ? fileError
              : currentFile
                ? `Current file: ${currentFile.fileName} (uploaded ${formatUploadedAt(currentFile.uploadedAt)}). A new upload replaces it in reports.`
                : "No radio monitor uploaded yet."}
        </p>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading && <Loader2 className="size-4 animate-spin" />}
            Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
