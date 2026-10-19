"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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

  return (
    <div className="space-y-5 font-SansFlex">
      <Link
        href={`/campaigns/${campaignId}`}
        className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-600 hover:text-foreground dark:text-zinc-400"
      >
        <ArrowLeft className="size-4" />
        {campaignTitle ? `Back to ${campaignTitle}` : "Back to campaign"}
      </Link>

      <div className="flex items-center gap-5">
        {loading ? (
          <Skeleton className="size-[72px] rounded-full" />
        ) : (
          <Avatar className="size-[72px]">
            {artist?.avatar && <AvatarImage src={artist.avatar} alt={name} />}
            <AvatarFallback className="text-xl">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Artist analytics
          </p>
          <h1 className="truncate text-3xl font-semibold text-foreground md:text-4xl">
            {name}
          </h1>
          {artist && artist.genres.length > 0 && (
            <p className="truncate text-sm text-muted-foreground">
              {artist.genres.slice(0, 4).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
