"use client";

import { useState } from "react";

export function ArtistBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <p className={`whitespace-pre-line leading-relaxed text-neutral-200 ${expanded ? "" : "line-clamp-4"}`}>
        {bio}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="mt-3 text-sm text-neutral-400 transition-colors hover:text-[#31bc86]"
      >
        {expanded ? "Show less" : "Read more"}
      </button>
    </div>
  );
}
