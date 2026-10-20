"use client";

import { mdiCloudUploadOutline, mdiFilePdfBox } from "@mdi/js";
import Icon from "@mdi/react";
import { Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  RADIO_MONITOR_ACCEPT,
  useRadioMonitorUpload,
  validateRadioMonitorFile,
} from "@/hooks/use-radio-monitor-upload";
import { cn } from "@/lib/utils";

import { RadioMonitorCurrentFile } from "./radio-monitor-current-file";

const formatFileSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export function RadioMonitorUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { currentFile, isLoadingFile, fileError, upload, isUploading } =
    useRadioMonitorUpload();

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
      setSelectedFile(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The file could not be uploaded.",
      );
    }
  };

  return (
    <div className="flex w-full flex-col gap-5 rounded-[12px] border p-6 text-left">
      <RadioMonitorCurrentFile
        file={currentFile}
        isLoading={isLoadingFile}
        error={fileError}
      />

      <div className="flex flex-col gap-2 border-t pt-5">
        <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {currentFile ? "Replace file" : "Upload file"}
        </p>
        <button
          type="button"
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed px-4 py-10 text-center transition-colors hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-60",
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
          <Icon
            path={mdiCloudUploadOutline}
            size={1.2}
            className="text-muted-foreground"
          />
          <span className="text-sm font-medium text-foreground">
            {selectedFile
              ? "Choose a different file"
              : "Drop a file or click to browse"}
          </span>
          <span className="text-xs text-muted-foreground">
            Top 100 chart PDF, up to 10MB
          </span>
        </button>
      </div>
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

      {selectedFile && (
        <div className="flex items-center gap-3 rounded-[8px] border border-primary/40 bg-primary/5 px-4 py-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
            <Icon path={mdiFilePdfBox} size={1} />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold text-foreground"
              title={selectedFile.name}
            >
              {selectedFile.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)} · Ready to upload
              {currentFile && ", replaces the current file in reports"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove selected file"
            className="size-8 shrink-0"
            onClick={() => setSelectedFile(null)}
            disabled={isUploading}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading && <Loader2 className="size-4 animate-spin" />}
          Upload
        </Button>
      </div>
    </div>
  );
}
