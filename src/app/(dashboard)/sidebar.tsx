"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { CSSProperties, FC, ReactNode, useEffect, useState } from "react";
import {
  MdAddCircleOutline,
  MdComputer,
  MdDarkMode,
  MdKeyboardArrowRight,
  MdLightMode,
  MdLogout,
} from "react-icons/md";
import { Settings } from "lucide-react";
import Icon from "@mdi/react";
import {
  mdiCalendarMonthOutline,
  mdiCurrencyUsd,
  mdiCreationOutline,
  mdiFormatListBulletedType,
  mdiCog,
  mdiRadio,
} from "@mdi/js";

import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-session";
import { canManageRadioMonitor } from "@/lib/radio-monitor/radio-monitor-access";

type NavItemProps = {
  href?: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  tooltip?: string;
  onClick?: () => void;
};

const SIDEBAR_ICON_SIZE = 18;
const SIDEBAR_ICON_STROKE_WIDTH = 2.5;
const SIDEBAR_SUB_ICON_SIZE = 16;
const SIDEBAR_COLLAPSED_WIDTH = "5.3125rem";
const SIDEBAR_COOKIE_NAME = "sidebar_state";
const TOOLS_MENU_OFFSET = 20;
const COLLAPSED_TOOLS_MENU_OFFSET = 34;

const getSavedSidebarOpenState = () => {
  if (typeof document === "undefined") return false;

  return (
    document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
      ?.split("=")[1] === "true"
  );
};

const StudioLogo = ({
  className,
  width = 50,
  height = 28,
}: {
  className?: string;
  width?: number;
  height?: number;
}) => (
  <svg
    viewBox="0 0 14 7.8"
    width={width}
    height={height}
    className={cn(
      "fill-[#122c18] dark:fill-[#17954c] transition-colors",
      className,
    )}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <path d="M13.8,3.5c0,0.3,0,0.7-0.1,1H9c0.1,0.4,0.3,0.7,0.7,1c0.3,0.2,0.7,0.3,1.2,0.3c0.7,0,1.3-0.2,1.9-0.7l0.8,1.2c-0.8,0.7-1.7,1-2.7,1C9.8,7.3,9,7,8.3,6.3c-0.7-0.7-1-1.5-1-2.5s0.3-1.8,1-2.5s1.5-1,2.5-1c0.9,0,1.7,0.3,2.3,0.9C13.5,1.8,13.8,2.6,13.8,3.5z M10.6,1.8c-0.4,0-0.7,0.1-1,0.4C9.3,2.4,9.1,2.8,9,3.2h3c0-0.4-0.2-0.7-0.4-1C11.3,1.9,11,1.8,10.6,1.8z" />
      <path d="M5.6,2.7L1.4,7.2C1.2,7.4,1,7.4,0.8,7.2L0.2,6.6C0,6.4,0,6.2,0.2,6l4.2-4.5c0.2-0.2,0.4-0.2,0.6,0l0.6,0.6C5.8,2.2,5.8,2.5,5.6,2.7z" />
      <path d="M6.9,0.8v6.1c0,0.2-0.2,0.4-0.4,0.4H5.6c-0.2,0-0.4-0.2-0.4-0.4V0.8c0-0.2,0.2-0.4,0.4-0.4h0.8C6.7,0.4,6.9,0.6,6.9,0.8z" />
      <path d="M6.4,2H0.5C0.3,2,0.1,1.9,0.1,1.6V0.8c0-0.2,0.2-0.4,0.4-0.4h5.9c0.2,0,0.4,0.2,0.4,0.4v0.8C6.9,1.9,6.7,2,6.4,2z" />
    </g>
  </svg>
);

const SidebarLogo = () => {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="group flex h-[146px] w-full items-start justify-center border-b border-sidebar-border pt-12 outline-none transition-all"
    >
      <span className="relative inline-flex h-[50px] items-center justify-center">
        <span className="block transition-opacity group-hover:opacity-0">
          <StudioLogo
            width={isCollapsed ? 36 : 50}
            height={isCollapsed ? 20 : 28}
          />
        </span>

        <span className="absolute inset-0 flex items-center justify-center text-[#17954c] opacity-0 transition-opacity group-hover:opacity-100">
          <svg width={28} height={28} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M6,8V16H10V8H6Z" />
          </svg>
        </span>
      </span>
    </button>
  );
};

const MarketSidebarLogo = () => {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="group flex h-[146px] w-full items-start justify-center border-b border-sidebar-border pt-12 outline-none transition-all"
    >
      <span className="relative inline-flex h-[50px] items-center justify-center">
        <span className="block transition-opacity group-hover:opacity-0">
          <Image
            src="/tools.svg"
            alt="Market"
            width={49}
            height={28}
            priority
            className={cn(
              "h-auto transition-[width] dark:invert",
              isCollapsed ? "w-[38px]" : "w-[49px]",
            )}
          />
        </span>

        <span className="absolute inset-0 flex items-center justify-center text-[#17954c] opacity-0 transition-opacity group-hover:opacity-100">
          <svg width={28} height={28} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M6,8V16H10V8H6Z" />
          </svg>
        </span>
      </span>
    </button>
  );
};

export const DropsIcon = ({
  className,
  size = 18,
}: {
  className?: string;
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 22 25"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_drops_icon)">
      <path
        d="M21.2242 5.97831L11.9066 0.543526C11.6478 0.271787 11.1301 0.271787 10.8713 0.543526C10.8713 0.815265 10.6125 1.087 10.6125 1.35874V11.9566L2.33012 16.8479C1.81248 17.1196 1.55365 17.9348 1.81248 18.2066C2.0713 18.4783 2.33012 18.75 2.58895 18.75C2.84777 18.75 2.84777 18.75 3.10659 18.75L11.6478 13.587L20.1889 18.75C20.4478 18.75 20.4478 18.75 20.7066 18.75C20.9654 18.75 20.9654 18.75 21.2242 18.75C21.4831 18.4783 21.7419 18.2066 21.7419 17.9348V6.79353C21.7419 6.52179 21.4831 5.97831 21.2242 5.97831ZM19.6713 16.0327L13.4595 12.2283C13.4595 11.9566 13.4595 11.6848 13.4595 11.4131C13.2007 11.1414 12.9419 10.8696 12.4242 10.8696V3.26092L19.6713 7.337V16.0327Z"
        fill="currentColor"
      />
      <path
        d="M20.7058 7.06528C20.447 6.5218 19.9293 6.25006 19.4117 6.5218L14.2352 9.51093C11.9058 10.8696 9.31758 10.8696 6.98817 9.51093L2.07052 6.5218C1.8117 6.25006 1.29405 6.25006 1.03523 6.5218C0.776402 6.79354 0.517578 7.06528 0.517578 7.33701V18.2066L10.094 24.4566C10.3529 24.4566 10.3529 24.4566 10.6117 24.4566C10.8705 24.4566 10.8705 24.4566 11.1293 24.4566C11.3882 24.1848 11.647 23.9131 11.647 23.6414V17.9348C11.647 15.2174 12.9411 12.7718 15.2705 11.4131L20.447 8.42397C20.7058 7.88049 20.9646 7.33701 20.7058 7.06528ZM2.58817 17.9348V9.23919L6.2117 11.4131C8.54111 12.7718 9.83522 15.2174 9.83522 17.9348V22.0109L2.58817 17.9348Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_drops_icon">
        <rect width="22" height="25" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const NavItem = ({
  href,
  label,
  icon,
  active,
  tooltip,
  onClick,
}: NavItemProps) => {
  const isExternal = href?.startsWith("http");

  const button = (
    <SidebarMenuButton
      tooltip={tooltip ?? label}
      isActive={active}
      onClick={onClick}
      className={cn(
        "h-10 text-base text-sidebar-foreground hover:bg-sidebar-accent",
        "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2.5!",
        active && "font-[500]",
      )}
    >
      <span
        className={cn(
          "size-1 rounded-full cursor-pointer bg-transparent group-data-[collapsible=icon]:hidden",
          active && "bg-[#17954c]",
        )}
      />
      <span className="flex size-7 shrink-0 items-center justify-center [&>svg]:size-[18px]">
        {icon}
      </span>
      <span className="group-data-[collapsible=icon]:hidden">{label}</span>
    </SidebarMenuButton>
  );

  return (
    <SidebarMenuItem>
      {href ? (
        <SidebarMenuButton
          asChild
          tooltip={tooltip ?? label}
          isActive={active}
          className={cn(
            "h-10 text-base text-sidebar-foreground hover:bg-sidebar-accent",
            "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2.5!",
            active && "font-[500]",
          )}
        >
          {isExternal ? (
            <a href={href} target="_blank" rel="noopener noreferrer">
              <span
                className={cn(
                  "size-1 rounded-full cursor-pointer bg-transparent group-data-[collapsible=icon]:hidden",
                  active && "bg-[#17954c]",
                )}
              />
              <span className="flex size-7 shrink-0 items-center justify-center [&>svg]:size-[18px]!">
                {icon}
              </span>
              <span className="group-data-[collapsible=icon]:hidden">
                {label}
              </span>
            </a>
          ) : (
            <Link href={href}>
              <span
                className={cn(
                  "size-1 rounded-full cursor-pointer bg-transparent group-data-[collapsible=icon]:hidden",
                  active && "bg-[#17954c]",
                )}
              />
              <span className="flex size-7 shrink-0 items-center justify-center [&>svg]:size-[18px]!">
                {icon}
              </span>
              <span className="group-data-[collapsible=icon]:hidden">
                {label}
              </span>
            </Link>
          )}
        </SidebarMenuButton>
      ) : (
        button
      )}
    </SidebarMenuItem>
  );
};

const menuItems = [
  {
    name: "Studio",
    img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701294/qkpawzztfn7c6osevfmm_sripez.svg",
    url: "https://studio.arroweye.pro/",
  },
  {
    name: "Recipes",
    img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701298/asasas_xtjuvt_vvmlne.svg",
    url: "https://pinegingr.com/services",
  },
  {
    name: "Showtime",
    img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701304/sds_nzwm72_m4pzcw.svg",
    url: "https://studio.arroweye.pro/",
  },
  {
    name: "Drops",
    img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701297/qkpawzztfn7c6osevfmm_1_14_dnwz5r_cduoei.svg",
    url: "https://studio.arroweye.pro/",
  },
  {
    name: "Spins",
    img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701301/qkpawzztfn7c6osevfmm_1_4_x8h1iz_i2uebl.svg",
    url: "https://spins.arroweye.pro/",
  },
  {
    name: "Tools",
    img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701302/sds_3_tsxk8m_ftgc0v.svg",
    url: "https://cocoa.house/tools",
  },
];

const themeOptions = [
  {
    label: "Light",
    value: "light",
    icon: MdLightMode,
  },
  {
    label: "Dark",
    value: "dark",
    icon: MdDarkMode,
  },
  {
    label: "System",
    value: "system",
    icon: MdComputer,
  },
];

const getInitials = (name: string) => {
  if (!name || name === "Account") return "KO";
  const cleanName = name.replace(/@.*/, "").trim();
  const parts = cleanName.split(/[\s._-]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (cleanName.length >= 2) {
    return cleanName.slice(0, 2).toUpperCase();
  }
  return cleanName[0]?.toUpperCase() || "KO";
};

const CampaignsSidebarContent = () => {
  const pathname = usePathname();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const { state } = useSidebar();
  const { isAdvertiser, user, userProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const userRole = userProfile?.role || "";
  const displayName =
    userProfile?.fullname || user?.email || userProfile?.role || "Account";
  const userInitials = getInitials(displayName);
  const isCollapsed = state === "collapsed";
  const isSetupActive =
    pathname === "/campaigns/setup" ||
    pathname?.startsWith("/campaigns/setup/");
  const isMarketLanding = pathname === "/campaigns/setup";

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  return (
    <>
      <SidebarTrigger className="fixed left-3 top-3 z-50 text-[#17954c] md:hidden" />

      <UISidebar
        collapsible="icon"
        className="z-40 border-sidebar-border bg-sidebar text-sidebar-foreground"
      >
        <SidebarHeader className="p-0">
          {isMarketLanding ? <MarketSidebarLogo /> : <SidebarLogo />}
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="flex-1">
            <SidebarGroupLabel className="hidden font-semibold text-[#03a835]">
              MENU
            </SidebarGroupLabel>

            <SidebarGroupContent className="flex flex-1">
              <SidebarMenu className="h-full gap-[23px]">
                {isAdvertiser && isCollapsed && (
                  <NavItem
                    href="/campaigns/setup"
                    label="Create Campaign"
                    tooltip="Create Campaign"
                    active={isSetupActive}
                    icon={<MdAddCircleOutline size={SIDEBAR_ICON_SIZE} />}
                  />
                )}

                <NavItem
                  href="/campaigns"
                  label="Campaigns"
                  active={
                    isAdvertiser && isCollapsed
                      ? isActive("/campaigns") && !isSetupActive
                      : isActive("/campaigns")
                  }
                  icon={<Icon path={mdiFormatListBulletedType} size={0.75} />}
                />

                {isActive("/campaigns") && isAdvertiser && !isCollapsed && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={isActive("/campaigns/setup")}
                      >
                        <Link href="/campaigns/setup">
                          <MdAddCircleOutline
                            size={SIDEBAR_SUB_ICON_SIZE}
                            className="text-sidebar-foreground/70 size-[16px]!"
                          />
                          <span>Setup Campaign</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}

                {!isAdvertiser && (
                  <NavItem
                    href="/drops"
                    label="Drops"
                    active={isActive("/drops")}
                    icon={<DropsIcon />}
                  />
                )}

                {canManageRadioMonitor(userProfile) && (
                  <NavItem
                    href="/radio-monitor"
                    label="Radio Monitor"
                    active={isActive("/radio-monitor")}
                    icon={<Icon path={mdiRadio} size={0.85} />}
                  />
                )}

                {["Supervisor", "Manager"].includes(userRole) && (
                  <NavItem
                    href="/payments"
                    label="Payments"
                    active={isActive("/payments")}
                    icon={<Icon path={mdiCurrencyUsd} size={1} />}
                  />
                )}

                {!isAdvertiser && (
                  <NavItem
                    href="/schedule"
                    label="Schedule"
                    active={isActive("/schedule")}
                    icon={<Icon path={mdiCalendarMonthOutline} size={0.88} />}
                  />
                )}

                {!isAdvertiser && !isMarketLanding && (
                  <NavItem
                    href="/campaigns/setup"
                    label="Market"
                    active={isMarketLanding}
                    icon={
                      <Image
                        src="/tools.svg"
                        alt=""
                        width={28}
                        height={16}
                        className="dark:invert"
                      />
                    }
                  />
                )}

                {!isAdvertiser && (
                  <SidebarMenuItem className="mt-auto">
                    <DropdownMenu
                      onOpenChange={(open) => setIsSwitcherOpen(open)}
                    >
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                          tooltip="Tools"
                          className={cn(
                            "h-10 text-base text-sidebar-foreground hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                            "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2.5!",
                            isSwitcherOpen && "font-[500]",
                          )}
                        >
                          <span className="size-1 rounded-full bg-transparent group-data-[collapsible=icon]:hidden" />
                          <span className="flex size-7 shrink-0 items-center justify-center [&>svg]:size-[18px]">
                            <Icon path={mdiCreationOutline} size={0.88} />
                          </span>
                          <span className="group-data-[collapsible=icon]:hidden">
                            Tools
                          </span>
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="right"
                        align="center"
                        sideOffset={
                          state === "collapsed"
                            ? COLLAPSED_TOOLS_MENU_OFFSET
                            : TOOLS_MENU_OFFSET
                        }
                        collisionPadding={16}
                        className="w-[360px] max-w-[calc(100vw-2rem)] border border-neutral-100 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <div className="mb-6 grid grid-cols-3 gap-x-4 gap-y-6">
                          {menuItems.map((item) => (
                            <DropdownMenuItem key={item.name} asChild>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex cursor-pointer flex-col items-center rounded-[10px] text-center outline-none focus:bg-transparent"
                              >
                                <div className="flex size-14 items-center justify-center rounded-[12px] bg-neutral-50 transition-colors duration-150 group-hover:bg-neutral-100 dark:bg-zinc-900 dark:group-hover:bg-zinc-800">
                                  <Image
                                    src={item.img}
                                    alt={item.name}
                                    width={40}
                                    height={40}
                                    className="size-10 object-contain"
                                  />
                                </div>
                                <span className="mt-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                  {item.name}
                                </span>
                              </a>
                            </DropdownMenuItem>
                          ))}
                        </div>

                        <div className="flex items-center rounded-[12px] border border-neutral-100 bg-[#fafafa] p-4 dark:border-zinc-800 dark:bg-zinc-900">
                          <Image
                            src="https://res.cloudinary.com/dyueswnzk/image/upload/v1758701617/r3o4deralgc2jl1y1xag_ynrxbj.webp"
                            alt="Ad Cover"
                            width={64}
                            height={96}
                            className="mr-4 h-24 w-16 shrink-0 rounded-[8px] object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[9px] font-bold tracking-wider text-neutral-400 uppercase">
                              ADS BY <span className="underline">VIVO</span>
                            </div>
                            <div className="mt-1 mb-3 text-xs leading-snug font-medium text-neutral-700 dark:text-neutral-300">
                              Stay in tune with the continent that makes the
                              world dance
                            </div>
                            <div className="flex gap-2">
                              <DropdownMenuItem asChild>
                                <button
                                  className="cursor-pointer rounded-[6px] bg-black px-3 py-1 text-[11px] font-bold text-white outline-none transition-[background-color,transform] duration-150 hover:bg-neutral-800 active:scale-[0.97]"
                                  onClick={() => {
                                    window.open(
                                      "https://butta.cocoa.house/",
                                      "_blank",
                                    );
                                  }}
                                >
                                  Subscribe
                                </button>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <button
                                  className="cursor-pointer rounded-[6px] border border-neutral-300 px-3 py-1 text-[11px] font-bold text-neutral-800 outline-none transition-[background-color,transform] duration-150 hover:bg-neutral-50 active:scale-[0.97] dark:text-neutral-200 dark:hover:bg-zinc-800"
                                  onClick={() => {
                                    window.open(
                                      "https://open.spotify.com/playlist/3CVugIVKRAsTMQn0JeaP65?si=q_g3HBORS7GFNUdIC1BMDA&pi=qbbp4pmmSOCgF&nd=1&dlsi=d383ce1fced64d36",
                                      "_blank",
                                    );
                                  }}
                                >
                                  Listen
                                </button>
                              </DropdownMenuItem>
                            </div>
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                )}

                <NavItem
                  href="/settings"
                  label="Settings"
                  active={isActive("/settings")}
                  icon={<Icon path={mdiCog} size={SIDEBAR_ICON_SIZE} />}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-0 pb-4 pt-[15px]">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    tooltip="Account"
                    className="h-10 rounded-[8px] text-sidebar-foreground hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2.5!"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0066fe] text-[11px] font-semibold text-white">
                      {userInitials}
                    </div>
                    <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">
                      {displayName}
                    </span>
                    <MdKeyboardArrowRight
                      size={18}
                      className="ml-auto size-[18px]! transition-transform duration-200 group-data-[state=open]/menu-button:rotate-[-90deg] group-data-[collapsible=icon]:hidden"
                    />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="w-[--radix-popper-anchor-width] min-w-56 rounded-[8px] p-1.5"
                >
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="rounded-[6px]">
                      <MdLightMode
                        size={SIDEBAR_ICON_SIZE}
                        className="size-[18px]!"
                      />
                      <span>Theme</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent
                      sideOffset={8}
                      className="min-w-40 rounded-[8px] p-1.5"
                    >
                      <DropdownMenuRadioGroup
                        value={theme ?? "system"}
                        onValueChange={setTheme}
                      >
                        {themeOptions.map((option) => {
                          const Icon = option.icon;

                          return (
                            <DropdownMenuRadioItem
                              key={option.value}
                              value={option.value}
                              className="rounded-[6px]"
                            >
                              <Icon
                                size={SIDEBAR_ICON_SIZE}
                                className="size-[18px]!"
                              />
                              <span>{option.label}</span>
                            </DropdownMenuRadioItem>
                          );
                        })}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={logout}
                    variant="destructive"
                    className="rounded-[6px]"
                  >
                    <MdLogout
                      size={SIDEBAR_ICON_SIZE}
                      className="size-[18px]!"
                    />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </UISidebar>
    </>
  );
};

const Sidebar: FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(getSavedSidebarOpenState());
  }, []);

  return (
    <SidebarProvider
      defaultOpen={false}
      open={open}
      onOpenChange={setOpen}
      style={
        {
          "--sidebar-width-icon": SIDEBAR_COLLAPSED_WIDTH,
        } as CSSProperties
      }
    >
      <CampaignsSidebarContent />
    </SidebarProvider>
  );
};

export default Sidebar;
