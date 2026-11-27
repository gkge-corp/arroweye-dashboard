import { Info } from "lucide-react";

import type { ArtistStat } from "@/types/api";

// Rounded down so "+" stays true: 4.53B -> "4.5B+".
const floorCompact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
  roundingMode: "floor",
});

const STAT_HINTS: Record<string, string> = {
  streams: "All-time streams on Spotify",
  views: "All-time video views on YouTube",
  reach: "Monthly listeners on Spotify",
  subscribers: "Channel subscribers on YouTube",
};

// Lines scale between the window's lowest and highest day so small movements still show.
const lineHeights = (trend: number[]) => {
  const min = Math.min(...trend);
  const range = Math.max(...trend) - min || 1;
  return trend.map((value) => 55 + ((value - min) / range) * 45);
};

export function StatCard({ stat, color }: { stat: ArtistStat; color: string }) {
  return (
    <div className="flex flex-col rounded-xl border bg-black px-8 pb-8 pt-10" style={{ borderColor: color }}>
      <p className="flex items-center gap-2 text-lg text-white">
        {stat.label}
        <Info aria-label={STAT_HINTS[stat.code]} className="size-4 text-white/70">
          <title>{STAT_HINTS[stat.code]}</title>
        </Info>
      </p>
      <p className="mt-1 text-6xl font-extrabold tracking-tighter text-white [font-stretch:125%] sm:text-7xl">
        {floorCompact.format(stat.value)}+
      </p>
      {stat.trend.length > 1 && (
        <div className="mt-6 flex h-32 items-end justify-between" aria-hidden>
          {lineHeights(stat.trend).map((height, index) => (
            <span key={index} className="w-0.5" style={{ height: `${height}%`, backgroundColor: color }} />
          ))}
        </div>
      )}
    </div>
  );
}
