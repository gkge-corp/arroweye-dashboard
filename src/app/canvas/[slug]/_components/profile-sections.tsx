import type { ReactNode } from "react";

import type { ArtistProfile } from "@/types/api";

const releaseDate = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg bg-neutral-800/60 p-5">
      <h2 className="border-b border-white/10 pb-3 text-sm font-medium text-white">{title}</h2>
      <div className="pt-4">{children}</div>
    </section>
  );
}

function Artwork({ src, size }: { src: string | null; size: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- provider artwork comes from many hosts
    <img src={src} alt="" className={`${size} shrink-0 rounded-sm object-cover`} />
  ) : (
    <div className={`${size} shrink-0 rounded-sm bg-neutral-700`} />
  );
}

export function LatestRelease({ release }: { release: NonNullable<ArtistProfile["latestRelease"]> }) {
  return (
    <Panel title="Latest release">
      <div className="flex items-center gap-4">
        <Artwork src={release.image} size="size-20" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{release.title}</p>
          <p className="truncate text-sm text-neutral-400">{release.artists}</p>
          <p className="mt-1 text-xs text-neutral-500">{releaseDate(release.releaseDate)}</p>
        </div>
      </div>
    </Panel>
  );
}

export function Collaborations({ names }: { names: string[] }) {
  return (
    <Panel title="Collaborations">
      <ul className="flex flex-wrap gap-2">
        {names.map((name) => (
          <li key={name} className="rounded bg-black px-2.5 py-1 text-xs text-white">
            {name}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function TopTracks({ tracks }: { tracks: ArtistProfile["topTracks"] }) {
  return (
    <Panel title="Top tracks">
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tracks.map((track, index) => (
          <li key={track.id} className="flex items-center gap-3">
            <span className="w-5 text-right text-xs text-neutral-500">{index + 1}</span>
            <Artwork src={track.image} size="size-11" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{track.title}</p>
              <p className="truncate text-xs text-neutral-400">{track.artists}</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
