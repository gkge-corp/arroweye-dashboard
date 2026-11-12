import { redirect } from "next/navigation";

import { canManageRadioMonitor } from "@/lib/radio-monitor/radio-monitor-access";
import { getAuthorizedStaff } from "@/lib/server/get-authorized-staff";

import { RadioMonitorWorkspace } from "./component/radio-monitor-workspace";

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

  return <RadioMonitorWorkspace />;
}
