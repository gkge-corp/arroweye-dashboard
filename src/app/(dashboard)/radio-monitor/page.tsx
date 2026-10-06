import { mdiRadio } from "@mdi/js";
import Icon from "@mdi/react";

import { RadioMonitorUploader } from "./component/radio-monitor-uploader";

export default function RadioMonitorPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center">
      <div className="flex items-center gap-[10px]">
        <Icon path={mdiRadio} size={1} className="shrink-0 text-primary" />
        <p className="truncate text-[27px] font-bold text-primary">
          Radio Monitor
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Upload the latest radio monitor report. Every campaign report checks
        this file for its song and includes the chart position when it
        appears.
      </p>
      <RadioMonitorUploader />
    </div>
  );
}
