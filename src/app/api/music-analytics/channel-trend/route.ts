import { NextRequest, NextResponse } from "next/server";

import { loadChannelTrend } from "@/lib/music-analytics/channel-trend/load-channel-trend";
import { addDays, todayKey } from "@/lib/music-analytics/channel-trend/dates";
import { songstatsErrorResponse } from "@/lib/music-analytics/songstats-track-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const asDate = (value: string | null) =>
  value && datePattern.test(value) ? value : undefined;

export async function GET(request: NextRequest) {
  const isrc = request.nextUrl.searchParams.get("isrc")?.trim();
  const startDate = asDate(request.nextUrl.searchParams.get("startDate"));
  const requestedEnd = asDate(request.nextUrl.searchParams.get("endDate"));

  if (!isrc) {
    return NextResponse.json(
      { error: "Provide the song's ISRC.", code: "MISSING_ISRC" },
      { status: 400 },
    );
  }
  if (!startDate) {
    return NextResponse.json(
      { error: "Provide valid campaign dates.", code: "INVALID_DATES" },
      { status: 400 },
    );
  }

  // Today is still filling in, so the series stops at yesterday.
  const yesterday = addDays(todayKey(), -1);
  const endDate =
    !requestedEnd || requestedEnd > yesterday ? yesterday : requestedEnd;

  if (startDate > endDate) {
    return NextResponse.json({
      startDate,
      endDate,
      points: [],
      radioAvailable: false,
    });
  }

  try {
    const trend = await loadChannelTrend(isrc, startDate, endDate);
    return NextResponse.json({ startDate, endDate, ...trend });
  } catch (error) {
    console.error("Channel trend failed:", error);
    return songstatsErrorResponse(error);
  }
}
