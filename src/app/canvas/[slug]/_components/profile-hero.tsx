"use client";

import type { CSSProperties } from "react";
import { ArrowDown, BadgeCheck } from "lucide-react";

import { CanvasNav } from "../../_components/canvas-nav";
import { useCursorSpotlight } from "../hooks/use-cursor-spotlight";

// The page's content section, which the scroll-down button jumps to.
export const DETAILS_ID = "artist-details";

interface ProfileHeroProps {
  name?: string;
  imageUrl?: string | null;
  verified?: boolean;
  genres?: string[];
  isLoading: boolean;
}

// Spotify serves the same avatar at 640px under this prefix; the 320px default is too soft full-screen.
const largeImage = (url: string) =>
  url.replace("ab67616100005174", "ab6761610000e5eb");

// The blur covers the middle of the photo (edges stay sharp) minus a sharp circle at the cursor.
const blurMask = [
  "radial-gradient(circle 220px at var(--spot-x) var(--spot-y), transparent 50%, #000 100%)",
  "radial-gradient(circle, #000 60%, transparent 100%)",
].join(", ");

const blurStyle: CSSProperties = {
  maskImage: blurMask,
  WebkitMaskImage: blurMask,
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
};

const heroStyle = {
  "--spot-x": "-9999px",
  "--spot-y": "-9999px",
} as CSSProperties;

export function ProfileHero({
  name,
  imageUrl,
  verified,
  genres = [],
  isLoading,
}: ProfileHeroProps) {
  const spotlight = useCursorSpotlight();

  return (
    <section
      {...spotlight}
      style={heroStyle}
      className="relative flex h-svh flex-col overflow-hidden bg-[#122c18]"
    >
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- provider avatars come from many hosts
        <img
          src={largeImage(imageUrl)}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
        />
      )}
      <div
        className="absolute inset-0 backdrop-blur-[15px]"
        style={blurStyle}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-black/40" />

      <div className="relative">
        <CanvasNav />
      </div>

      <div className="relative mx-auto mt-auto flex w-full max-w-7xl items-end justify-between gap-6 px-4 pb-12 sm:px-6">
        <div className="min-w-0">
          {genres.length > 0 && (
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#73d79c]">
              {genres.slice(0, 3).join(" · ")}
            </p>
          )}
          <h1 className="flex items-start gap-2 text-5xl font-bold uppercase tracking-tight text-white sm:text-7xl">
            {isLoading ? (
              <span className="block h-14 w-72 animate-pulse rounded bg-white/10" />
            ) : (
              name
            )}
            {verified && (
              <BadgeCheck
                aria-label="Verified"
                className="mt-2 size-6 shrink-0 fill-[#17954c] text-white"
              />
            )}
          </h1>
        </div>

        <button
          type="button"
          onClick={() =>
            document
              .getElementById(DETAILS_ID)
              ?.scrollIntoView({ behavior: "smooth" })
          }
          aria-label="Scroll to artist details"
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-neutral-900 transition-colors hover:bg-black hover:text-white"
        >
          <ArrowDown className="size-4" />
        </button>
      </div>
    </section>
  );
}
