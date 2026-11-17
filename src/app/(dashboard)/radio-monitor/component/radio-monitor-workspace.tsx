"use client";

import { mdiRadioTower } from "@mdi/js";
import Icon from "@mdi/react";
import type { CSSProperties } from "react";

import { useRadioMonitorUpload } from "@/hooks/use-radio-monitor-upload";
import { useStickyHeader } from "@/hooks/use-sticky-header";
import { cn } from "@/lib/utils";

import NotificationsMenu from "../../notifications-menu";
import { RadioMonitorChartTable } from "./radio-monitor-chart-table";
import { RadioMonitorUploadDialog } from "./radio-monitor-upload-dialog";
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

const HEADER_HEIGHT = 64;

function RadioMonitorChartView() {
  const { sentinelRef, isSticky } = useStickyHeader();

  return (
    <div
      className="flex w-full flex-col gap-6"
      style={
        {
          "--radio-header-height": `${HEADER_HEIGHT}px`,
        } as CSSProperties
      }
    >
      <div ref={sentinelRef} className="-mb-6 h-px" aria-hidden="true" />
      {/* Fixed height so the sticky picker and table offsets never lag a resize. */}
      <div
        className={cn(
          "sticky top-0 z-30 flex h-16 items-center justify-between gap-[10px] bg-background [overflow-anchor:none]",
          isSticky &&
            "-mx-5 border-b border-zinc-200 px-6 dark:border-zinc-800 lg:px-10",
        )}
      >
        <RadioMonitorTitle />
        <div className="flex shrink-0 items-center gap-2">
          <RadioMonitorUploadDialog />
          {isSticky && (
            <NotificationsMenu triggerClassName="relative size-9 rounded-full text-foreground active:scale-[0.97] [&_svg]:size-[18px]!" />
          )}
        </div>
      </div>
      <RadioMonitorChartTable />
    </div>
  );
}

export function RadioMonitorWorkspace() {
  const { currentFile, isLoadingFile } = useRadioMonitorUpload();

  // The full uploader only shows until the first file is in, or when the
  // lookup fails and its error needs the room.
  if (!isLoadingFile && !currentFile) return <EmptyRadioMonitor />;

  return <RadioMonitorChartView />;
}
