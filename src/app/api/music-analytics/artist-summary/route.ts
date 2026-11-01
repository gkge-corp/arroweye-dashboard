import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_FOLLOWER_RANGE,
  isFollowerRange,
} from "@/lib/music-analytics/artist/follower-growth";
import { loadArtistSummary } from "@/lib/music-analytics/artist/load-artist-summary";
import { getAuthorizedProject } from "@/lib/server/get-authorized-project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const campaignId = request.nextUrl.searchParams.get("campaignId")?.trim();
  const days = Number(
    request.nextUrl.searchParams.get("days") ?? DEFAULT_FOLLOWER_RANGE,
  );

  if (!campaignId || !/^\d+$/.test(campaignId) || !isFollowerRange(days)) {
    return NextResponse.json(
      { error: "Provide a valid campaign and range." },
      { status: 400 },
    );
  }

  // The summary is built from the campaign's own song and artist on the
  // server, so the client cannot steer what the model is given.
  let project: Record<string, unknown>;
  try {
    project = await getAuthorizedProject(campaignId);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "You do not have access to this campaign.",
      },
      { status: 403 },
    );
  }

  try {
    const summary = await loadArtistSummary(project, days);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Artist audience summary failed:", error);
    return NextResponse.json(
      { error: "Could not load the artist summary." },
      { status: 500 },
    );
  }
}
