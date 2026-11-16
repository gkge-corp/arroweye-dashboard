"use client";

import { mdiPlus } from "@mdi/js";
import Icon from "@mdi/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRadioMonitorUpload } from "@/hooks/use-radio-monitor-upload";

import { RadioMonitorUploader } from "./radio-monitor-uploader";

export function RadioMonitorUploadDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentFile } = useRadioMonitorUpload();

  // Before the first upload the page shows the full uploader instead.
  if (!currentFile) return null;

  return (
    <>
      <Button
        type="button"
        size="icon"
        aria-label="Upload radio monitor"
        className="size-9 shrink-0 rounded-full active:scale-[0.97]"
        onClick={() => setIsOpen(true)}
      >
        <Icon path={mdiPlus} className="size-4" />
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[12px] font-[500] tracking-[.16rem] text-zinc-500 uppercase dark:text-zinc-400">
              Upload radio monitor
            </DialogTitle>
            <DialogDescription className="sr-only">
              Replace the radio monitor file used in campaign reports.
            </DialogDescription>
          </DialogHeader>
          <RadioMonitorUploader
            className="min-w-0 border-0 p-0"
            onUploaded={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
