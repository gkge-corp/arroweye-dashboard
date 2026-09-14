import { NextRequest, NextResponse } from "next/server";

import { mapWithConcurrency, withRetry } from "@/lib/music-analytics/fan-out";
import {
  SoundchartsError,
  soundchartsRequest,
} from "@/lib/music-analytics/soundcharts-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Chart platforms worth polling for this catalogue. The referential endpoint
// lists 28, but the rest return nothing for Afrobeats releases and every
// platform costs a call. "airplay" is excluded on purpose: those are per
// station radio charts, which the Top Radio card already covers.
const platforms = [
  { code: "spotify", label: "Spotify" },
  { code: "apple-music", label: "Apple Music" },
  { code: "shazam", label: "Shazam" },
  { code: "youtube", label: "YouTube" },
  { code: "deezer", label: "Deezer" },
  { code: "itunes", label: "iTunes" },
  { code: "beatport", label: "Beatport" },
  { code: "tiktok", label: "TikTok" },
  { code: "boomplay", label: "Boomplay" },
  { code: "audiomack", label: "Audiomack" },
] as const;

const PAGE_SIZE = 100;
const CONCURRENCY = 3;

interface ChartRank {
  chart?: {
    name?: string;
    slug?: string;
    countryName?: string;
    countryCode?: string;
    cityName?: string;
    webUrl?: string;
  };
  position?: number;
  peakPosition?: number;
  peakDate?: string;
  entryDate?: string;
  timeOnChart?: number;
  timeOnChartUnit?: string;
}

export async function GET(request: NextRequest) {
  const uuid = request.nextUrl.searchParams.get("uuid")?.trim();
  const offset = Number(request.nextUrl.searchParams.get("offset") ?? 0);

  const requested = request.nextUrl.searchParams.get("platforms")?.trim();
  const requestedCodes = requested ? new Set(requested.split(",")) : null;
  const targetPlatforms = requestedCodes
    ? platforms.filter((platform) => requestedCodes.has(platform.code))
    : platforms;

  if (!uuid) {
    return NextResponse.json(
      { error: "Provide a song uuid.", code: "MISSING_UUID" },
      { status: 400 },
    );
  }

  try {
    const page = Number.isFinite(offset) && offset > 0 ? offset : 0;
    const failedPlatforms: string[] = [];

    const results = await mapWithConcurrency(
      targetPlatforms,
      CONCURRENCY,
      async (platform) => {
        try {
          const payload = await withRetry(() =>
            soundchartsRequest<{ items?: ChartRank[] }>(
              `/api/v2/song/${uuid}/charts/ranks/${platform.code}?currentOnly=1&offset=${page}&limit=${PAGE_SIZE}&sortBy=position&sortOrder=asc`,
            ),
          );

          return (payload.items ?? [])
            // Historical rows come back with position 0, meaning the song has
            // dropped off that chart. Only live placements belong here.
            .filter((entry) => Number(entry.position) > 0)
            .map((entry) => ({
              id: `${platform.code}-${entry.chart?.slug ?? entry.chart?.name}-${entry.position}`,
              name: entry.chart?.name ?? "Untitled chart",
              platform: platform.label,
              country: entry.chart?.countryName ?? entry.chart?.countryCode ?? "",
              city: entry.chart?.cityName ?? "",
              position: Number(entry.position),
              peakPosition: Number(entry.peakPosition ?? 0),
              peakDate: entry.peakDate ?? "",
              url: entry.chart?.webUrl ?? "",
            }));
        } catch (error) {
          if (error instanceof SoundchartsError && error.status === 404) {
            return [];
          }

          failedPlatforms.push(platform.label);
          console.error(
            `Soundcharts charts failed for ${platform.code}:`,
            error,
          );
          return [];
        }
      },
    );

    const remainingPlatforms = targetPlatforms
      .filter(
        (platform, index) =>
          results[index].length === PAGE_SIZE ||
          failedPlatforms.includes(platform.label),
      )
      .map((platform) => platform.code);

    const items = results.flat().sort((a, b) => a.position - b.position);

    return NextResponse.json({
      items,
      nextOffset:
        remainingPlatforms.length > 0 ? (page || 0) + PAGE_SIZE : null,
      nextPlatforms: remainingPlatforms,
      failedPlatforms,
    });
  } catch (error) {
    console.error("Soundcharts charts failed:", error);

    if (error instanceof SoundchartsError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Could not reach the analytics provider.", code: "UNKNOWN" },
      { status: 502 },
    );
  }
}
