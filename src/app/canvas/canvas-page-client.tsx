"use client";

import { ArtistTile, ArtistTileSkeleton } from "./_components/artist-tile";
import { CanvasNav } from "./_components/canvas-nav";
import { useCanvasArtists } from "./hooks/use-canvas-artists";

const SKELETON_COUNT = 8;

export default function CanvasPageClient() {
  const { query, setQuery, artists, isLoading, isError } = useCanvasArtists();

  return (
    <div className="min-h-screen bg-neutral-900">
      <header className="bg-gradient-to-r from-[#17954c] to-[#31bc86]">
        <CanvasNav />
        <div className="flex justify-center px-4 pb-6 pt-2">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find an artiste profile"
            aria-label="Find an artiste profile"
            className="w-full max-w-md rounded-full bg-black/20 px-6 py-3 text-sm text-white placeholder:text-white/70 outline-none focus:bg-black/30"
          />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {isError ? (
          <p className="py-20 text-center text-sm text-neutral-400">
            We couldn&apos;t load artists. Please try again shortly.
          </p>
        ) : !isLoading && artists.length === 0 ? (
          <p className="py-20 text-center text-sm text-neutral-400">
            No artists match &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-8">
            {isLoading
              ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                  <ArtistTileSkeleton key={index} />
                ))
              : artists.map((artist) => (
                  <ArtistTile key={artist.id} artist={artist} />
                ))}
          </div>
        )}
      </main>
    </div>
  );
}
