"use client";

import { mdiRadioTower } from "@mdi/js";
import Icon from "@mdi/react";
import type { CSSProperties } from "react";

import { useElementHeight } from "@/hooks/use-element-height";
import { useRadioMonitorUpload } from "@/hooks/use-radio-monitor-upload";

import { RadioMonitorChartTable } from "./radio-monitor-chart-table";
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

// Sits below the layout's 50px notification bar, which is pinned on this page.
const TOP_NAV_HEIGHT = 50;

function RadioMonitorChartView() {
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
