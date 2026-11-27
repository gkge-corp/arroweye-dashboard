import { BadgeCheck } from "lucide-react";
import Link from "next/link";

import type { Artist } from "@/types/api";

export function ArtistTile({ artist }: { artist: Artist }) {
  return (
    <Link
      href={`/canvas/${artist.slug}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-sm bg-neutral-800"
    >
      {artist.image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- provider avatars come from many hosts
        <img
          src={artist.image_url}
          alt={artist.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-10 text-white">
        <p className="flex items-center gap-1 text-sm font-semibold">
          <span className="truncate">{artist.name}</span>
          {artist.verified && (
            <BadgeCheck
              aria-label="Verified"
              className="size-4 shrink-0 fill-[#17954c] text-white"
            />
          )}
        </p>
        {artist.countries.length > 0 && (
          <p className="truncate text-xs text-white/80">
            {artist.countries.join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}

export function ArtistTileSkeleton() {
  return (
    <div className="aspect-[3/4] animate-pulse rounded-sm bg-neutral-800" />
  );
}
