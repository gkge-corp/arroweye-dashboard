import { NextRequest, NextResponse } from "next/server";

import {
  PLAYLIST_PLATFORMS as platforms,
  parsePlatforms,
  toSongstatsSource,
  type AnalyticsPlatform,
} from "@/lib/music-analytics/platforms";
import {
  SOUNDCHARTS_PLAYLIST_PAGE_SIZE,
  fetchSoundchartsPlaylists,
} from "@/lib/music-analytics/soundcharts-playlists";
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
  added_at?: string | null;
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

type PlaylistItem = Awaited<
  ReturnType<typeof fetchSoundchartsPlaylists>
>[number];

interface PlatformResult {
  platform: AnalyticsPlatform;
  isFull: boolean;
  items: PlaylistItem[];
}

/** One call covers every Songstats platform. */
const fetchSongstatsPlaylists = async (
  isrc: string,
  targetPlatforms: AnalyticsPlatform[],
  page: number,
): Promise<PlatformResult[]> => {
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

  return targetPlatforms.map((platform) => {
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
        addedAt: entry.added_at ?? undefined,
        subscriberCount: entry.followers_count,
      })),
    };
  });
};

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

  const page = Number.isFinite(offset) && offset > 0 ? offset : 0;
  const songstatsPlatforms = targetPlatforms.filter((platform) =>
    toSongstatsSource(platform.code),
  );
  const soundchartsPlatforms = targetPlatforms.filter(
    (platform) => !toSongstatsSource(platform.code),
  );

  const [songstatsResult, ...soundchartsResults] = await Promise.allSettled([
    songstatsPlatforms.length > 0
      ? fetchSongstatsPlaylists(isrc, songstatsPlatforms, page)
      : Promise.resolve([]),
    ...soundchartsPlatforms.map((platform) =>
      fetchSoundchartsPlaylists(isrc, platform, page),
    ),
  ]);

  // With no other platform asked for, a Songstats failure is the response.
  if (
    songstatsResult.status === "rejected" &&
    soundchartsPlatforms.length === 0
  ) {
    console.error("Songstats playlists failed:", songstatsResult.reason);
    return songstatsErrorResponse(songstatsResult.reason);
  }

  const results: PlatformResult[] = [];
  const failedPlatforms: AnalyticsPlatform[] = [];

  if (songstatsResult.status === "fulfilled") {
    results.push(...songstatsResult.value);
  } else {
    console.error("Songstats playlists failed:", songstatsResult.reason);
    failedPlatforms.push(...songstatsPlatforms);
  }

  soundchartsResults.forEach((result, index) => {
    const platform = soundchartsPlatforms[index];
    if (result.status === "fulfilled") {
      results.push({
        platform,
        isFull: result.value.length === SOUNDCHARTS_PLAYLIST_PAGE_SIZE,
        items: result.value,
      });
    } else {
      console.error(
        `Soundcharts playlists failed for ${platform.code}:`,
        result.reason,
      );
      failedPlatforms.push(platform);
    }
  });

  // Only full pages can have more, and a failed platform is retried next page.
  const remainingPlatforms = [
    ...results.filter((result) => result.isFull).map((result) => result.platform),
    ...failedPlatforms,
  ].map((platform) => platform.code);

  return NextResponse.json({
    items: results.flatMap((result) => result.items),
    nextOffset: remainingPlatforms.length > 0 ? page + PAGE_SIZE : null,
    nextPlatforms: remainingPlatforms,
    failedPlatforms: failedPlatforms.map((platform) => platform.label),
  });
}
