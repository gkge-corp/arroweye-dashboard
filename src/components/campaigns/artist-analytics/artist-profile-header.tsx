"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useStickyHeader } from "@/hooks/use-sticky-header";
import { cn } from "@/lib/utils";
import type { ArtistProfile } from "./hooks/use-artist-profile";

interface ArtistProfileHeaderProps {
  campaignId: string;
  campaignTitle?: string;
  fallbackName?: string;
  artist?: ArtistProfile["artist"];
  loading?: boolean;
  children?: ReactNode;
}

export function ArtistProfileHeader({
  campaignId,
  campaignTitle,
  fallbackName,
  artist,
  loading = false,
  children,
}: ArtistProfileHeaderProps) {
  const name = artist?.name || fallbackName || "Artist";
  const { sentinelRef, headerRef, isSticky, fullHeaderHeight } =
    useStickyHeader();

  return (
    <>
      <div ref={sentinelRef} className="h-px" aria-hidden="true" />
      <div
        ref={headerRef}
        className={cn(
          "sticky top-0 z-40 font-SansFlex [overflow-anchor:none]",
          isSticky
            ? "-mx-5 border-b border-zinc-200 bg-background px-6 dark:border-zinc-800 lg:px-10"
            : "space-y-5",
        )}
      >
        {!isSticky && (
          <Link
            href={`/campaigns/${campaignId}`}
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-600 hover:text-foreground dark:text-zinc-400"
          >
            <ArrowLeft className="size-4" />
            {campaignTitle ? `Back to ${campaignTitle}` : "Back to campaign"}
          </Link>
        )}

        <div
          className={cn("flex items-center", isSticky ? "h-16 gap-3" : "gap-5")}
        >
          {loading ? (
            <Skeleton
              className={cn(
                "rounded-full",
                isSticky ? "size-10" : "size-[72px]",
              )}
            />
          ) : (
            <Avatar className={isSticky ? "size-10" : "size-[72px]"}>
              {artist?.avatar && <AvatarImage src={artist.avatar} alt={name} />}
              <AvatarFallback className={isSticky ? "text-sm" : "text-xl"}>
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div className={cn("min-w-0", !isSticky && "space-y-2")}>
            {!isSticky && (
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Artist analytics
              </p>
            )}
            <h1
              className={cn(
                "truncate font-semibold text-foreground",
                isSticky ? "text-xl" : "text-3xl md:text-4xl",
              )}
            >
              {name}
            </h1>
            {artist && artist.genres.length > 0 && (
              <p
                className={cn(
                  "truncate text-muted-foreground",
                  isSticky ? "text-xs" : "text-sm",
                )}
              >
                {artist.genres.slice(0, 4).join(" · ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {isSticky && fullHeaderHeight > 64 && (
        <div aria-hidden="true" style={{ height: fullHeaderHeight - 64 }} />
      )}

      {children && <div className="mt-5 font-SansFlex">{children}</div>}
    </>
  );
}
