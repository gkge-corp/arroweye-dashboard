import { NextRequest, NextResponse } from "next/server";

import { withRetry } from "@/lib/music-analytics/fan-out";
import {
  normalizeIsrc,
  songstatsRequest,
} from "@/lib/music-analytics/songstats-client";
import { songstatsErrorResponse } from "@/lib/music-analytics/songstats-track-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SongstatsTrack {
  songstats_track_id?: string;
  title?: string;
  avatar?: string;
  release_date?: string;
  artists?: { name?: string }[];
  links?: { source?: string; isrc?: string }[];
}

/**
 * Search results carry no ISRC; `tracks/info` lists one per platform link.
 * A remix or extended edit can sit under another ISRC, so Spotify's wins.
 */
const readIsrc = (track: SongstatsTrack) => {
  const links = (track.links ?? []).filter((link) => link.isrc);
  return (
    links.find((link) => link.source === "spotify")?.isrc ??
    links[0]?.isrc ??
    ""
  );
};

const normalizeSong = (track: SongstatsTrack, isrc = readIsrc(track)) => ({
  uuid: track.songstats_track_id ?? "",
  isrc,
  title: track.title ?? "",
  artist: (track.artists ?? [])
    .map((artist) => artist.name)
    .filter(Boolean)
    .join(", "),
  artwork: track.avatar ?? "",
  releaseDate: track.release_date ?? "",
});

const fetchTrackInfo = (params: {
  isrc?: string;
  songstats_track_id?: string;
}) =>
  withRetry(() =>
    songstatsRequest<{ track_info?: SongstatsTrack }>("/tracks/info", params),
  );

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("term")?.trim();
  const isrc = request.nextUrl.searchParams.get("isrc")?.trim();
  const id = request.nextUrl.searchParams.get("id")?.trim();

  if (!term && !isrc && !id) {
    return NextResponse.json(
      { error: "Provide a search term or an ISRC.", code: "MISSING_QUERY" },
      { status: 400 },
    );
  }

  try {
    if (isrc || id) {
      const payload = await fetchTrackInfo(
        isrc ? { isrc: normalizeIsrc(isrc) } : { songstats_track_id: id },
      );
      const track = payload.track_info;
      // An ISRC lookup is answered for that exact ISRC, whatever the links say.
      const items = track
        ? [normalizeSong(track, isrc ? normalizeIsrc(isrc) : undefined)]
        : [];
      return NextResponse.json({ items: items.filter((song) => song.uuid) });
    }

    const payload = await withRetry(() =>
      songstatsRequest<{ results?: SongstatsTrack[] }>("/tracks/search", {
        q: term,
        limit: 10,
        offset: 0,
      }),
    );

    return NextResponse.json({
      items: (payload.results ?? [])
        .map((track) => normalizeSong(track))
        .filter((song) => song.uuid),
    });
  } catch (error) {
    console.error("Songstats song search failed:", error);
    return songstatsErrorResponse(error);
  }
}
