"use client";

import { usePathname } from "next/navigation";
import { FC } from "react";
import NotificationsMenu from "./notifications-menu";
import { RadioMonitorUploadDialog } from "./radio-monitor/component/radio-monitor-upload-dialog";

const TopNav: FC = () => {
  const pathname = usePathname();

  return (
    <div className="relative">
      <div className="relative flex h-[10px] items-center justify-between px-[10px] pt-[50px] text-white lg:px-[40px]">
        <div className="text-lg font-semibold opacity-0">Dashboard</div>
        <div className="relative mb-[40px] flex items-center gap-4 md:mb-0">
          {pathname === "/radio-monitor" && <RadioMonitorUploadDialog />}
          <NotificationsMenu triggerClassName="relative text-foreground" />
        </div>
      </div>
    </div>
  );
};

export default TopNav;
