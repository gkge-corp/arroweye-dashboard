import { NextRequest, NextResponse } from "next/server";

import { withRetry } from "@/lib/music-analytics/fan-out";
import {
  ARTIST_FOLLOWER_PLATFORMS,
  toSongstatsSource,
} from "@/lib/music-analytics/platforms";
import {
  normalizeIsrc,
  songstatsRequest,
} from "@/lib/music-analytics/songstats-client";
import { songstatsErrorResponse } from "@/lib/music-analytics/songstats-track-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HistoryPoint = Record<string, unknown> & { date?: string };

interface PlatformGrowth {
  platform: string;
  startValue: number;
  endValue: number;
  growth: number;
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const parseDate = (value: string | null) => {
  if (!value || !datePattern.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
    ? null
    : date;
};

const today = () => new Date().toISOString().slice(0, 10);

const buildResult = (
  entries: PlatformGrowth[],
  startDate: string,
  endDate: string,
) => {
  if (entries.length === 0) {
    return {
      available: false,
      startDate,
      endDate,
      totalGrowth: null,
      changePercent: null,
      topPlatform: null,
      platforms: [],
    };
  }

  const startTotal = entries.reduce((sum, entry) => sum + entry.startValue, 0);
  const endTotal = entries.reduce((sum, entry) => sum + entry.endValue, 0);
  const totalGrowth = endTotal - startTotal;
  const topPlatform = [...entries]
    .filter((entry) => entry.growth > 0)
    .sort((a, b) => b.growth - a.growth)[0]?.platform;

  return {
    available: true,
    startDate,
    endDate,
    startTotal,
    endTotal,
    totalGrowth,
    changePercent: startTotal > 0 ? (totalGrowth / startTotal) * 100 : null,
    topPlatform: topPlatform ?? null,
    platforms: entries,
  };
};

// YouTube counts subscribers; every other network, DSPs included, counts
// followers. A network without the field is skipped rather than read as 0.
const readFollowers = (source: string, point: HistoryPoint | undefined) => {
  const raw =
    point?.[source === "youtube" ? "subscribers_total" : "followers_total"];
  if (raw === null || raw === undefined) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

/**
 * One call returns daily follower history for every network, so growth is
 * the gap between the first and last point inside the campaign window.
 */
const getHistoricalGrowth = async (
  artistId: string,
  startDate: string,
  endDate: string,
) => {
  const payload = await withRetry(() =>
    songstatsRequest<{
      stats?: { source?: string; data?: { history?: HistoryPoint[] } }[];
    }>("/artists/historic_stats", {
      songstats_artist_id: artistId,
      source: ARTIST_FOLLOWER_PLATFORMS.map((platform) =>
        toSongstatsSource(platform.code),
      ),
      start_date: startDate,
      end_date: endDate,
    }),
  );
  const histories = new Map(
    (payload.stats ?? []).map((entry) => [
      entry.source,
      entry.data?.history ?? [],
    ]),
  );

  return ARTIST_FOLLOWER_PLATFORMS.flatMap((platform): PlatformGrowth[] => {
    const source = toSongstatsSource(platform.code);
    const points = (histories.get(source) ?? [])
      .filter((point) => readFollowers(source, point) !== null)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const startValue = readFollowers(source, points[0]);
    const endValue = readFollowers(source, points[points.length - 1]);

    if (startValue === null || endValue === null) return [];
    return [
      {
        platform: platform.label,
        startValue,
        endValue,
        growth: endValue - startValue,
      },
    ];
  });
};

export async function GET(request: NextRequest) {
  const isrc = request.nextUrl.searchParams.get("isrc")?.trim();
  const rawStartDate = request.nextUrl.searchParams.get("startDate");
  const rawEndDate = request.nextUrl.searchParams.get("endDate") ?? today();
  const start = parseDate(rawStartDate);
  const requestedEnd = parseDate(rawEndDate);

  if (!isrc) {
    return NextResponse.json(
      { error: "Provide the song's ISRC.", code: "MISSING_ISRC" },
      { status: 400 },
    );
  }
  if (!start || !requestedEnd) {
    return NextResponse.json(
      { error: "Provide valid campaign dates.", code: "INVALID_DATES" },
      { status: 400 },
    );
  }

  const todayDate = parseDate(today())!;
  const end = requestedEnd > todayDate ? todayDate : requestedEnd;
  if (start > end) {
    return NextResponse.json(
      { error: "The campaign has not started.", code: "CAMPAIGN_NOT_STARTED" },
      { status: 400 },
    );
  }

  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  try {
    const trackPayload = await withRetry(() =>
      songstatsRequest<{
        track_info?: { artists?: { songstats_artist_id?: string }[] };
      }>("/tracks/info", { isrc: normalizeIsrc(isrc) }),
    );
    const artistId = trackPayload.track_info?.artists?.[0]?.songstats_artist_id;

    if (!artistId) {
      return NextResponse.json(
        { error: "The linked song has no primary artist.", code: "NO_ARTIST" },
        { status: 404 },
      );
    }

    const entries = await getHistoricalGrowth(artistId, startDate, endDate);
    return NextResponse.json(buildResult(entries, startDate, endDate));
  } catch (error) {
    console.error("Songstats campaign audience growth failed:", error);
    return songstatsErrorResponse(error);
  }
}
