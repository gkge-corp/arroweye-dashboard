import { mdiRadio } from "@mdi/js";
import Icon from "@mdi/react";
import { redirect } from "next/navigation";

import { canManageRadioMonitor } from "@/lib/radio-monitor/radio-monitor-access";
import { getAuthorizedStaff } from "@/lib/server/get-authorized-staff";

import { RadioMonitorUploader } from "./component/radio-monitor-uploader";

export const dynamic = "force-dynamic";

const hasRadioMonitorAccess = () =>
  getAuthorizedStaff()
    .then((user) => canManageRadioMonitor(user.user_profile))
    .catch((error: unknown) => {
      console.error("Radio monitor access check failed:", error);
      return false;
    });

export default async function RadioMonitorPage() {
  if (!(await hasRadioMonitorAccess())) redirect("/campaigns");

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
