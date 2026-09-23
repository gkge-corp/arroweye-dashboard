import { NextRequest, NextResponse } from "next/server";

import { withRetry } from "@/lib/music-analytics/fan-out";
import {
  normalizeIsrc,
  songstatsRequest,
} from "@/lib/music-analytics/songstats-client";
import { songstatsErrorResponse } from "@/lib/music-analytics/songstats-track-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERIOD_DAYS = 30;

const platforms = [
  {
    code: "tiktok",
    label: "TikTok",
    metric: "Videos using this sound",
    field: "videos_total",
  },
  {
    code: "shazam",
    label: "Shazam",
    metric: "Song recognitions",
    field: "shazams_total",
  },
  {
    code: "youtube",
    label: "YouTube",
    metric: "Video views",
    field: "video_views_total",
  },
  {
    code: "instagram",
    label: "Instagram",
    metric: "Reels using this song",
    field: "videos_total",
  },
] as const;

const SOURCES = platforms.map((platform) => platform.code).join(",");

type StatData = Record<string, unknown>;

interface ShazamChart {
  location_type?: string;
  name?: string;
  current_position?: number | null;
}

interface SourceStats {
  source?: string;
  data?: StatData & { charts?: ShazamChart[] };
}

interface SourceHistory {
  source?: string;
  data?: { history?: (StatData & { date?: string })[] };
}

const finiteNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const daysAgo = (days: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
};

/**
 * Songstats totals are cumulative, so growth over the period is the gap
 * between the first and last daily point that carry the field.
 */
const readEvolution = (
  history: (StatData & { date?: string })[],
  field: string,
) => {
  const points = history
    .map((point) => ({ date: point.date, value: finiteNumber(point[field]) }))
    .filter((point) => point.value !== null) as {
    date?: string;
    value: number;
  }[];

  if (points.length < 2) return { evolution: null, percentEvolution: null };

  const first = points[0].value;
  const evolution = points[points.length - 1].value - first;
  return {
    evolution,
    percentEvolution: first > 0 ? (evolution / first) * 100 : null,
  };
};

const readShazamTopMarket = (charts: ShazamChart[] = []) =>
  charts
    .filter(
      (chart) =>
        chart.location_type === "Country" &&
        Number(chart.current_position) > 0 &&
        chart.name &&
        // Shazam files its worldwide genre charts under "Country" too.
        !chart.name.startsWith("Global"),
    )
    .sort((a, b) => Number(a.current_position) - Number(b.current_position))[0]
    ?.name ?? null;

export async function GET(request: NextRequest) {
  const isrc = request.nextUrl.searchParams.get("isrc")?.trim();

  if (!isrc) {
    return NextResponse.json(
      { error: "Provide the song's ISRC.", code: "MISSING_ISRC" },
      { status: 400 },
    );
  }

  const track = { isrc: normalizeIsrc(isrc) };

  try {
    const [statsResult, historyResult] = await Promise.allSettled([
      withRetry(() =>
        songstatsRequest<{ stats?: SourceStats[] }>("/tracks/stats", {
          ...track,
          source: SOURCES,
          with_charts: true,
          only_current: true,
          limit: 100,
        }),
      ),
      withRetry(() =>
        songstatsRequest<{ stats?: SourceHistory[] }>(
          "/tracks/historic_stats",
          {
            ...track,
            source: SOURCES,
            start_date: daysAgo(PERIOD_DAYS),
            end_date: daysAgo(0),
          },
        ),
      ),
    ]);

    if (statsResult.status === "rejected") throw statsResult.reason;

    // Growth is a nice-to-have; the current totals still render without it.
    if (historyResult.status === "rejected") {
      console.error(
        "Songstats social traction history failed:",
        historyResult.reason,
      );
    }

    const stats = new Map(
      (statsResult.value.stats ?? []).map((entry) => [
        entry.source,
        entry.data,
      ]),
    );
    const histories = new Map(
      historyResult.status === "fulfilled"
        ? (historyResult.value.stats ?? []).map((entry) => [
            entry.source,
            entry.data?.history ?? [],
          ])
        : [],
    );

    return NextResponse.json({
      periodDays: PERIOD_DAYS,
      items: platforms.map((platform) => {
        const data = stats.get(platform.code);
        const history = histories.get(platform.code) ?? [];

        return {
          id: platform.code,
          platform: platform.label,
          metric: platform.metric,
          value: finiteNumber(data?.[platform.field]),
          ...readEvolution(history, platform.field),
          updatedAt: history[history.length - 1]?.date ?? null,
          topMarket:
            platform.code === "shazam"
              ? readShazamTopMarket(stats.get("shazam")?.charts)
              : null,
        };
      }),
    });
  } catch (error) {
    console.error("Songstats social traction failed:", error);
    return songstatsErrorResponse(error);
  }
}
