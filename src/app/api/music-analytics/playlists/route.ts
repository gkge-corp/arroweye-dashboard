import { NextRequest, NextResponse } from "next/server";

import {
  PLAYLIST_PLATFORMS as platforms,
  parsePlatforms,
  toSongstatsSource,
} from "@/lib/music-analytics/platforms";
import {
  fetchTrackStats,
  readList,
  songstatsErrorResponse,
} from "@/lib/music-analytics/songstats-track-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PlaylistEntry {
  spotifyid?: string;
  applemusicid?: string;
  amazonid?: string;
  deezerid?: string;
  name?: string;
  external_url?: string;
  followers_count?: number;
  current_position?: number | null;
}

// Songstats caps expanded lists at 100 per source per call.
const PAGE_SIZE = 100;

// Each platform names its playlist id differently.
const readPlaylistId = (entry: PlaylistEntry) =>
  entry.spotifyid ??
  entry.applemusicid ??
  entry.amazonid ??
  entry.deezerid ??
  entry.external_url ??
  entry.name;

export async function GET(request: NextRequest) {
  const isrc = request.nextUrl.searchParams.get("isrc")?.trim();
  const offset = Number(request.nextUrl.searchParams.get("offset") ?? 0);

  // Later pages only ask the platforms that filled the previous one.
  // Platforms the viewer switched off are never requested.
  const targetPlatforms = parsePlatforms(
    request.nextUrl.searchParams.get("platforms"),
    platforms,
  );

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
      {
        with_playlists: true,
        only_current: true,
        offset: page,
        limit: PAGE_SIZE,
      },
    );

    const results = targetPlatforms.map((platform) => {
      const entries = readList<PlaylistEntry>(
        stats.get(toSongstatsSource(platform.code)),
        "playlists",
      );

      return {
        platform,
        isFull: entries.length === PAGE_SIZE,
        items: entries.map((entry) => ({
          id: `${platform.code}-${readPlaylistId(entry)}`,
          name: entry.name ?? "Untitled playlist",
          platform: platform.label,
          url: entry.external_url,
          position: entry.current_position ?? undefined,
          subscriberCount: entry.followers_count,
        })),
      };
    });

    const remainingPlatforms = results
      .filter((result) => result.isFull)
      .map((result) => result.platform.code);

    return NextResponse.json({
      items: results.flatMap((result) => result.items),
      nextOffset: remainingPlatforms.length > 0 ? page + PAGE_SIZE : null,
      nextPlatforms: remainingPlatforms,
      // One call covers every platform, so a failure fails the whole page.
      failedPlatforms: [],
    });
  } catch (error) {
    console.error("Songstats playlists failed:", error);
    return songstatsErrorResponse(error);
  }
}
