"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { flushSync } from "react-dom";
import { MdAddCircleOutline } from "react-icons/md";
import type { AppUser } from "@/types/api";
import { cn, hasAccess } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProjectSingleInsight from "@/components/campaigns/ProjectSingleInsight";
import NotificationsMenu from "../../../notifications-menu";
import { CampaignMembersList } from "./campaign-members-list";
import Icon from "@mdi/react";
import { mdiCheckCircleOutline, mdiCloseCircleOutline } from "@mdi/js";

interface CampaignDetailsHeaderProps {
  content: any;
  setContent: React.Dispatch<React.SetStateAction<any | null>>;
  subvendorStaff: AppUser[] | null;
  userLoggedInProfile: any;
  isAdvertiser: boolean | null;
  toggleNotifications: boolean;
  showIcons: boolean;
  originalTitle: string;
  onShowIconsChange: (show: boolean) => void;
  onAddMemberClick: () => void;
  onUserClick: (user: any) => void;
  onRequestEditModeChange: (enabled: boolean) => void;
}

export function CampaignDetailsHeader({
  content,
  setContent,
  subvendorStaff,
  userLoggedInProfile,
  isAdvertiser,
  toggleNotifications,
  showIcons,
  originalTitle,
  onShowIconsChange,
  onAddMemberClick,
  onUserClick,
  onRequestEditModeChange,
}: CampaignDetailsHeaderProps) {
  const canUseEditMode = hasAccess(userLoggedInProfile, [
    "Manager",
    // "Supervisor",
  ]);
  const artistName = content?.artist_name || content?.campaign?.song_artist;
  // Artist data is resolved from the linked song, so there is nothing to show without one.
  const canViewArtistAnalytics =
    Boolean(
      artistName && content?.id && (content?.isrc || content?.song_isrc),
    ) && hasAccess(userLoggedInProfile, ["Manager", "Supervisor"]);
  const canAddMember = hasAccess(userLoggedInProfile, ["Manager"]);
  const stickySentinelRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const isStickyRef = useRef(false);
  const [isSticky, setIsSticky] = useState(false);
  const [fullHeaderHeight, setFullHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const sentinel = stickySentinelRef.current;
    const stickyHeader = stickyHeaderRef.current;
    const scrollContainer = document.getElementById(
      "dashboard-scroll-container",
    );

    if (!sentinel || !stickyHeader || !scrollContainer) return;

    const measureFullHeader = () => {
      if (isStickyRef.current) return;

      const nextHeight = stickyHeader.offsetHeight;
      setFullHeaderHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      );
    };

    const updateStickyState = (synchronous = false) => {
      const rootTop = scrollContainer.getBoundingClientRect().top;
      const sentinelBottom = sentinel.getBoundingClientRect().bottom;
      const nextIsSticky = isStickyRef.current
        ? sentinelBottom <= rootTop + 2
        : sentinelBottom <= rootTop;

      if (nextIsSticky === isStickyRef.current) return;

      isStickyRef.current = nextIsSticky;
      const updateState = () => setIsSticky(nextIsSticky);

      if (synchronous) {
        flushSync(updateState);
      } else {
        updateState();
      }
    };

    measureFullHeader();
    updateStickyState();

    const resizeObserver = new ResizeObserver(measureFullHeader);
    resizeObserver.observe(stickyHeader);
    const handleScroll = () => updateStickyState(true);
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <div ref={stickySentinelRef} className="h-px" aria-hidden="true" />
      <div
        ref={stickyHeaderRef}
        className={cn(
          "sticky top-0 z-40 flex flex-col gap-2 [overflow-anchor:none]",
          isSticky &&
            "-mx-5 border-b border-zinc-200 bg-background px-6 dark:border-zinc-800 lg:px-10",
        )}
      >
        {!isSticky && canUseEditMode && toggleNotifications && (
          <div className="mb-3 flex min-h-[46px] w-full items-center justify-center border border-green-500 bg-green-500 px-4 font-SansFlex text-[14px] font-[500] text-white">
            Edit mode
          </div>
        )}

        {!isSticky && (
          <div className="flex items-center gap-3 text-xs tracking-wider uppercase font-SansFlex font-medium">
            <span className="text-zinc-600 dark:text-zinc-400">
              {content?.vendor?.organization_name || content?.campaign?.mode}
            </span>
            {canViewArtistAnalytics ? (
              <Link
                href={`/campaigns/${content.id}/artist`}
                title="View artist analytics"
                className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 px-3 py-1 text-zinc-500 dark:text-zinc-400 transition-colors hover:border-green-500 hover:text-foreground"
              >
                {artistName}
              </Link>
            ) : (
              <span className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 px-3 py-1 text-zinc-500 dark:text-zinc-400">
                {artistName}
              </span>
            )}
          </div>
        )}

        <div
          className={cn(
            isSticky
              ? "flex h-16 items-center justify-between gap-4"
              : "mb-5 pr-10",
          )}
        >
          <div className="min-w-0 flex-1">
            {toggleNotifications ? (
              <div className={cn("flex items-center", isSticky ? "" : "mt-3")}>
                <Input
                  type="text"
                  className="h-auto w-full rounded-full border-border bg-background! text-[17px] text-foreground shadow-none placeholder:text-[17px]"
                  value={content?.title || ""}
                  onChange={(event) => {
                    setContent({ ...content, title: event.target.value });
                    onShowIconsChange(true);
                  }}
                />
                {showIcons && !isSticky && (
                  <div className="my-[20px] flex items-center gap-[5px]">
                    <Button
                      type="button"
                      size="icon-lg"
                      variant="ghost"
                      className="text-blue-500"
                      onClick={() => onShowIconsChange(false)}
                    >
                      <Icon path={mdiCheckCircleOutline} size={1} />
                      <span className="sr-only">Save title</span>
                    </Button>
                    <Button
                      type="button"
                      size="icon-lg"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => {
                        setContent({ ...content, title: originalTitle });
                        onShowIconsChange(false);
                      }}
                    >
                      <Icon path={mdiCloseCircleOutline} size={1} />
                      <span className="sr-only">Cancel title edit</span>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p
                className={cn(
                  "truncate tracking-tight text-primary",
                  isSticky
                    ? "text-2xl font-[800]"
                    : "mt-3 text-[45px] font-[700]",
                )}
              >
                {content?.title || content?.campaign?.song_title}
              </p>
            )}
          </div>

          {isSticky && (
            <div className="flex shrink-0 items-center gap-4">
              {canAddMember && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative size-9 rounded-full text-foreground active:scale-[0.97]"
                  onClick={onAddMemberClick}
                  aria-label="Add member"
                >
                  <MdAddCircleOutline className="size-5!" />
                </Button>
              )}
              <NotificationsMenu
                projectId={content?.id}
                triggerClassName="relative size-9 rounded-full text-foreground active:scale-[0.97] [&_svg]:size-[18px]!"
              />
            </div>
          )}

          {!isSticky && (
            <div className="my-[20px] flex flex-wrap items-center justify-between gap-[20px]">
              <CampaignMembersList
                members={subvendorStaff}
                canAddMember={canAddMember}
                onAddMemberClick={onAddMemberClick}
                onUserClick={onUserClick}
              />

              {canUseEditMode && (
                <div className="flex items-center gap-3">
                  <span className="font-SansFlex text-[16px] font-[500] text-zinc-900 dark:text-zinc-100">
                    Edit mode
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onRequestEditModeChange(!toggleNotifications)
                    }
                    className={cn(
                      "relative inline-flex h-[28px] w-[56px] shrink-0 cursor-pointer items-center rounded-full p-1 outline-none transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-orange-500/25",
                      toggleNotifications
                        ? "bg-[#ff7300]"
                        : "bg-zinc-300 dark:bg-zinc-700",
                    )}
                    aria-label="Toggle edit mode"
                  >
                    <span
                      className={cn(
                        "absolute select-none text-[9px] font-bold tracking-wider text-white transition-opacity",
                        toggleNotifications
                          ? "left-2.5 opacity-100"
                          : "right-2 opacity-100 text-zinc-600 dark:text-zinc-300",
                      )}
                    >
                      {toggleNotifications ? "ON" : "OFF"}
                    </span>
                    <span
                      className={cn(
                        "pointer-events-none block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out",
                        toggleNotifications
                          ? "translate-x-[28px]"
                          : "translate-x-0",
                      )}
                    />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isSticky && fullHeaderHeight > 64 && (
        <div aria-hidden="true" style={{ height: fullHeaderHeight - 64 }} />
      )}

      {(hasAccess(userLoggedInProfile, ["Manager"]) || isAdvertiser) && (
        <ProjectSingleInsight isAdvertiser={isAdvertiser} content={content} />
      )}
    </>
  );
}
