import { NextRequest, NextResponse } from "next/server";

import { readCountryName } from "@/lib/music-analytics/country-names";
import { toSongstatsSource } from "@/lib/music-analytics/platforms";
import {
  fetchTrackStats,
  readList,
  songstatsErrorResponse,
  type SourceData,
} from "@/lib/music-analytics/songstats-track-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Chart platforms worth polling for this catalogue. Radio airplay is left to
// the Top Radio card, and Beatport's DJ charts are curated lists, not ranks.
const platforms = [
  { code: "spotify", label: "Spotify" },
  { code: "apple-music", label: "Apple Music" },
  { code: "shazam", label: "Shazam" },
  { code: "youtube", label: "YouTube" },
  { code: "deezer", label: "Deezer" },
  { code: "itunes", label: "iTunes" },
  { code: "amazon", label: "Amazon" },
  { code: "tidal", label: "Tidal" },
  { code: "tiktok", label: "TikTok" },
] as const;

// Songstats caps expanded lists at 100 per source per call.
const PAGE_SIZE = 100;

interface ChartEntry {
  shazamid?: string;
  applemusicid?: string;
  deezerid?: string;
  location_type?: string;
  name?: string;
  external_url?: string;
  current_position?: number | null;
  top_position?: number | null;
  top_position_date?: string | null;
}

/**
 * Apple Music, iTunes and Amazon keep single charts in `track_charts`; the
 * rest use `charts`. Album charts are not the song's own placement.
 */
const readCharts = (data: SourceData | undefined) => [
  ...readList<ChartEntry>(data, "charts"),
  ...readList<ChartEntry>(data, "track_charts"),
];

/**
 * Only Shazam tags a chart's location. Apple chart ids embed the country
 * (`CHARTS-br-17`); elsewhere the country is only in the chart name.
 */
const readLocation = (entry: ChartEntry) => {
  if (entry.location_type === "Country") {
    return { country: entry.name ?? "", city: "" };
  }
  if (entry.location_type === "City") {
    return { country: "", city: entry.name ?? "" };
  }

  const appleCountry = entry.applemusicid?.match(/^CHARTS-([a-z]{2})-/i)?.[1];
  return {
    country: appleCountry ? readCountryName(appleCountry) : "",
    city: "",
  };
};

export async function GET(request: NextRequest) {
  const isrc = request.nextUrl.searchParams.get("isrc")?.trim();
  const offset = Number(request.nextUrl.searchParams.get("offset") ?? 0);

  const requested = request.nextUrl.searchParams.get("platforms")?.trim();
  const requestedCodes = requested ? new Set(requested.split(",")) : null;
  const targetPlatforms = requestedCodes
    ? platforms.filter((platform) => requestedCodes.has(platform.code))
    : platforms;

  if (!isrc) {
    return NextResponse.json(
      { error: "Provide the song's ISRC.", code: "MISSING_ISRC" },
      { status: 400 },
    );
  }

  try {
    const page = Number.isFinite(offset) && offset > 0 ? offset : 0;
    const stats = await fetchTrackStats(
      isrc,
      targetPlatforms.map((platform) => toSongstatsSource(platform.code)),
      { with_charts: true, only_current: true, offset: page, limit: PAGE_SIZE },
    );

    const results = targetPlatforms.map((platform) => {
      const entries = readCharts(stats.get(toSongstatsSource(platform.code)));

      return {
        platform,
        isFull: entries.length >= PAGE_SIZE,
        items: entries
          // `only_current` should already drop exits; guard in case a row
          // slips through with no live position.
          .filter((entry) => Number(entry.current_position) > 0)
          .map((entry) => ({
            id: `${platform.code}-${entry.shazamid ?? entry.applemusicid ?? entry.deezerid ?? entry.name}`,
            name: entry.name ?? "Untitled chart",
            platform: platform.label,
            ...readLocation(entry),
            position: Number(entry.current_position),
            peakPosition: Number(entry.top_position ?? 0),
            peakDate: entry.top_position_date ?? "",
            url: entry.external_url ?? "",
          })),
      };
    });

    const remainingPlatforms = results
      .filter((result) => result.isFull)
      .map((result) => result.platform.code);

    return NextResponse.json({
      items: results
        .flatMap((result) => result.items)
        .sort((a, b) => a.position - b.position),
      nextOffset: remainingPlatforms.length > 0 ? page + PAGE_SIZE : null,
      nextPlatforms: remainingPlatforms,
      failedPlatforms: [],
    });
  } catch (error) {
    console.error("Songstats charts failed:", error);
    return songstatsErrorResponse(error);
  }
}
