import { mdiFilePdfBox } from "@mdi/js";
import Icon from "@mdi/react";
import { format, formatDistanceToNow } from "date-fns";

import type { RadioMonitorFile } from "@/types/radio-monitor";

interface RadioMonitorCurrentFileProps {
  file: RadioMonitorFile | null;
  isLoading: boolean;
  error?: string;
}

const formatUploadedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Upload date unknown";
  return `Uploaded ${format(date, "MMM d, yyyy 'at' h:mm a")} · ${formatDistanceToNow(date, { addSuffix: true })}`;
};

export function RadioMonitorCurrentFile({
  file,
  isLoading,
  error,
}: RadioMonitorCurrentFileProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        Current file
      </p>
      {isLoading ? (
        <p className="rounded-[8px] border px-4 py-3 text-sm text-muted-foreground">
          Checking for an existing file…
        </p>
      ) : error ? (
        <p className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : file ? (
        <div className="flex items-center gap-3 rounded-[8px] border bg-muted/40 px-4 py-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
            <Icon path={mdiFilePdfBox} size={1} />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold text-foreground"
              title={file.fileName}
            >
              {file.fileName}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatUploadedAt(file.uploadedAt)}
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-[8px] border border-dashed px-4 py-3 text-sm text-muted-foreground">
          No radio monitor uploaded yet.
        </p>
      )}
    </div>
  );
}
