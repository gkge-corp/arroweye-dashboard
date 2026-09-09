import { NextRequest, NextResponse } from "next/server";

import { mapWithConcurrency, withRetry } from "@/lib/music-analytics/fan-out";
import {
  PLAYLIST_PLATFORMS as platforms,
  parsePlatforms,
} from "@/lib/music-analytics/platforms";
import {
  SoundchartsError,
  soundchartsRequest,
} from "@/lib/music-analytics/soundcharts-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


interface PlaylistEntry {
  playlist?: {
    uuid?: string;
    name?: string;
    identifier?: string;
    url?: string;
    subscriberCount?: number;
  };
  position?: number;
  entryDate?: string;
}

// Soundcharts caps limit at 100 and bills per call, so pull the largest page
// the API allows rather than paying a call per 25 rows.
const PAGE_SIZE = 100;
const CONCURRENCY = 3;

const fetchPlatformPlaylists = async (
  uuid: string,
  platform: string,
  offset: number,
) => {
  const payload = await withRetry(() =>
    soundchartsRequest<{ items?: PlaylistEntry[] }>(
      `/api/v2.20/song/${uuid}/playlist/current/${platform}?offset=${offset}&limit=${PAGE_SIZE}&sortBy=position&sortOrder=asc`,
    ),
  );
  return payload.items ?? [];
};

export async function GET(request: NextRequest) {
  const uuid = request.nextUrl.searchParams.get("uuid")?.trim();
  const offset = Number(request.nextUrl.searchParams.get("offset") ?? 0);

  // Later pages only ask the platforms that filled the previous one. Without
  // this every page costs a call for platforms already known to be exhausted.
  // Platforms the viewer switched off are never requested.
  const targetPlatforms = parsePlatforms(
    request.nextUrl.searchParams.get("platforms"),
    platforms,
  );

  if (!uuid) {
    return NextResponse.json(
      { error: "Provide a song uuid.", code: "MISSING_UUID" },
      { status: 400 },
    );
  }

  try {
    const failedPlatforms: string[] = [];

    const results = await mapWithConcurrency(
      targetPlatforms,
      CONCURRENCY,
      async (platform) => {
        try {
          const items = await fetchPlatformPlaylists(
            uuid,
            platform.code,
            Number.isFinite(offset) && offset > 0 ? offset : 0,
          );
          return items.map((entry) => ({
            id: `${platform.code}-${entry.playlist?.uuid ?? entry.playlist?.identifier ?? entry.position}`,
            name: entry.playlist?.name ?? "Untitled playlist",
            platform: platform.label,
            url: entry.playlist?.url,
            position: entry.position,
            subscriberCount: entry.playlist?.subscriberCount,
          }));
        } catch (error) {
          // A platform the song is absent from is a normal 404, not a failure
          // of the whole request.
          if (error instanceof SoundchartsError && error.status === 404) {
            return [];
          }

          // Anything else means this platform's placements are missing from
          // the response, which the client has to be told about rather than
          // reading a short list as a complete one.
          failedPlatforms.push(platform.label);
          console.error(
            `Soundcharts playlists failed for ${platform.code}:`,
            error,
          );
          return [];
        }
      },
    );

    // Only platforms that filled their page can have more, so the next page
    // asks for those alone. A failed platform is retried on the next page too.
    const remainingPlatforms = targetPlatforms
      .filter(
        (platform, index) =>
          results[index].length === PAGE_SIZE ||
          failedPlatforms.includes(platform.label),
      )
      .map((platform) => platform.code);

    return NextResponse.json({
      items: results.flat(),
      nextOffset:
        remainingPlatforms.length > 0 ? (offset || 0) + PAGE_SIZE : null,
      nextPlatforms: remainingPlatforms,
      failedPlatforms,
    });
  } catch (error) {
    console.error("Soundcharts playlists failed:", error);

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
