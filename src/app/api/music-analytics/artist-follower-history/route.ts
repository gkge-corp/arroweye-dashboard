import { NextRequest } from "next/server";

import {
  DEFAULT_FOLLOWER_RANGE,
  isFollowerRange,
} from "@/lib/music-analytics/artist/follower-growth";
import { loadFollowerHistory } from "@/lib/music-analytics/artist/load-follower-history";
import { withArtist } from "@/lib/music-analytics/songstats-artist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseDays = (raw: string | null) => {
  const days = Number(raw);
  return isFollowerRange(days) ? days : DEFAULT_FOLLOWER_RANGE;
};

export async function GET(request: NextRequest) {
  const days = parseDays(request.nextUrl.searchParams.get("days"));

  return withArtist(request, "follower history", ({ artistId }) =>
    loadFollowerHistory(artistId, days),
  );
}
