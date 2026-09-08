import { NextRequest, NextResponse } from "next/server";

import {
  SoundchartsError,
  soundchartsRequest,
} from "@/lib/music-analytics/soundcharts-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SoundchartsSong {
  uuid?: string;
  name?: string;
  creditName?: string;
  isrc?: string | { value?: string };
  imageUrl?: string;
  releaseDate?: string;
  artists?: { name?: string }[];
}

// The search endpoint omits the ISRC; the by-isrc lookup returns it as an
// object rather than a string.
const readIsrc = (isrc: SoundchartsSong["isrc"]) =>
  typeof isrc === "string" ? isrc : (isrc?.value ?? "");

const normalizeSong = (song: SoundchartsSong) => ({
  uuid: song.uuid ?? "",
  isrc: readIsrc(song.isrc),
  title: song.name ?? "",
  artist: song.creditName ?? song.artists?.[0]?.name ?? "",
  artwork: song.imageUrl ?? "",
  releaseDate: song.releaseDate ?? "",
});

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("term")?.trim();
  const isrc = request.nextUrl.searchParams.get("isrc")?.trim();

  if (!term && !isrc) {
    return NextResponse.json(
      { error: "Provide a search term or an ISRC.", code: "MISSING_QUERY" },
      { status: 400 },
    );
  }

  try {
    const path = isrc
      ? `/api/v2.25/song/by-isrc/${encodeURIComponent(isrc.replace(/-/g, "").toUpperCase())}`
      : `/api/v2/song/search/${encodeURIComponent(term!)}?offset=0&limit=10`;

    const payload = await soundchartsRequest<{
      items?: SoundchartsSong[];
      object?: SoundchartsSong;
    }>(path);

    const items = payload.object ? [payload.object] : (payload.items ?? []);

    return NextResponse.json({
      items: items.map(normalizeSong).filter((song) => song.uuid),
    });
  } catch (error) {
    console.error("Soundcharts song search failed:", error);

    if (error instanceof SoundchartsError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Could not reach Soundcharts.", code: "UNKNOWN" },
      { status: 502 },
    );
  }
}
