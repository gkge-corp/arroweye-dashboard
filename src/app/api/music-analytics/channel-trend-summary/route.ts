import { NextRequest, NextResponse } from "next/server";

import { loadTrendSummary } from "@/lib/music-analytics/channel-trend/load-trend-summary";
import { isTrendRange } from "@/lib/music-analytics/channel-trend/trend-range";
import { getAuthorizedProject } from "@/lib/server/get-authorized-project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const campaignId = request.nextUrl.searchParams.get("campaignId")?.trim();
  const range = request.nextUrl.searchParams.get("range") ?? "campaign";

  if (!campaignId || !/^\d+$/.test(campaignId) || !isTrendRange(range)) {
    return NextResponse.json(
      { error: "Provide a valid campaign and range." },
      { status: 400 },
    );
  }

  // The summary is built from the campaign's own song and dates on the
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
    const summary = await loadTrendSummary(campaignId, project, range);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Campaign trend summary failed:", error);
    return NextResponse.json(
      { error: "Could not load the trend summary." },
      { status: 500 },
    );
  }
}
