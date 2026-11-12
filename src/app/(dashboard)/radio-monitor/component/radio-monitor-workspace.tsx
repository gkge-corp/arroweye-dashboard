"use client";

import { mdiFilePdfBox, mdiRadioTower } from "@mdi/js";
import Icon from "@mdi/react";
import { ChevronDown } from "lucide-react";
import { useState, type CSSProperties } from "react";

import { useElementHeight } from "@/hooks/use-element-height";
import { useRadioMonitorUpload } from "@/hooks/use-radio-monitor-upload";
import { cn } from "@/lib/utils";
import type { RadioMonitorFile } from "@/types/radio-monitor";

import { RadioMonitorChartTable } from "./radio-monitor-chart-table";
import { formatUploadedAt } from "./radio-monitor-current-file";
import { RadioMonitorUploader } from "./radio-monitor-uploader";

function RadioMonitorTitle() {
  return (
    <div className="flex min-w-0 items-center gap-[10px]">
      <Icon path={mdiRadioTower} size={1} className="shrink-0 text-primary" />
      <p className="truncate text-[27px] font-bold text-primary">
        Radio Monitor
      </p>
    </div>
  );
}

function RadioMonitorFileAccordion({ file }: { file: RadioMonitorFile }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="radio-monitor-reupload"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-fit max-w-full items-center gap-2 rounded-full border bg-muted/40 py-1.5 pr-3 pl-2 text-xs transition-colors hover:bg-muted"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
          <Icon path={mdiFilePdfBox} size={0.6} />
        </span>
        <span
          className="truncate font-semibold text-foreground"
          title={file.fileName}
        >
          {file.fileName}
        </span>
        <span className="hidden shrink-0 text-muted-foreground sm:inline">
          {formatUploadedAt(file.uploadedAt)}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {/* Animating grid rows from 0fr to 1fr expands to the content's height. */}
      <div
        id="radio-monitor-reupload"
        inert={!isOpen}
        className={cn(
          "grid w-full max-w-xl transition-[grid-template-rows,opacity] duration-300 ease-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-3">
            <RadioMonitorUploader
              showCurrentFile={false}
              onUploaded={() => setIsOpen(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyRadioMonitor() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center">
      <RadioMonitorTitle />
      <p className="text-sm text-muted-foreground">
        Upload the latest radio monitor report. Every campaign report checks
        this file for its song and includes the chart position when it appears.
      </p>
      <RadioMonitorUploader />
    </div>
  );
}

// Sits below the layout's 50px notification bar, which is pinned on this page.
const TOP_NAV_HEIGHT = 50;

function RadioMonitorChartView({ file }: { file: RadioMonitorFile | null }) {
  const header = useElementHeight<HTMLDivElement>();

  return (
    <div
      className="flex w-full flex-col gap-6"
      style={
        {
          "--radio-header-height": `${TOP_NAV_HEIGHT + header.height}px`,
        } as CSSProperties
      }
    >
      {/* Table headers stick just below this bar. */}
      <div
        ref={header.ref}
        className="sticky z-30 bg-background pb-3"
        style={{ top: TOP_NAV_HEIGHT }}
      >
        <RadioMonitorTitle />
      </div>
      {file ? (
        <RadioMonitorFileAccordion file={file} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Checking for an existing file…
        </p>
      )}
      <RadioMonitorChartTable />
    </div>
  );
}

export function RadioMonitorWorkspace() {
  const { currentFile, isLoadingFile } = useRadioMonitorUpload();

  // The full uploader only shows until the first file is in, or when the
  // lookup fails and its error needs the room.
  if (!isLoadingFile && !currentFile) return <EmptyRadioMonitor />;

  return <RadioMonitorChartView file={currentFile} />;
}
