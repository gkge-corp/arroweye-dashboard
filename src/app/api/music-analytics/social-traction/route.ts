import { NextRequest, NextResponse } from "next/server";

import { withRetry } from "@/lib/music-analytics/fan-out";
import {
  SoundchartsError,
  soundchartsRequest,
} from "@/lib/music-analytics/soundcharts-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERIOD_DAYS = 30;

const platforms = [
  {
    code: "tiktok",
    label: "TikTok",
    metric: "Videos using this sound",
  },
  {
    code: "shazam",
    label: "Shazam",
    metric: "Song recognitions",
  },
  {
    code: "youtube",
    label: "YouTube",
    metric: "Video views",
  },
  {
    code: "instagram",
    label: "Instagram",
    metric: "Reels using this song",
  },
] as const;

interface AudienceStat {
  platform?: string;
  value?: number;
  evolution?: number;
  percentEvolution?: number;
  date?: string;
}

interface ShazamChartRank {
  chart?: {
    countryName?: string;
    countryCode?: string;
  };
  position?: number;
}

interface SongAudiencePoint {
  date?: string;
  plots?: { value?: number }[];
}

const finiteNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function GET(request: NextRequest) {
  const uuid = request.nextUrl.searchParams.get("uuid")?.trim();

  if (!uuid) {
    return NextResponse.json(
      { error: "Provide a song uuid.", code: "MISSING_UUID" },
      { status: 400 },
    );
  }

  try {
    const [statsResult, shazamChartsResult] = await Promise.allSettled([
      withRetry(() =>
        soundchartsRequest<{ audience?: AudienceStat[] }>(
          `/api/v2/song/${encodeURIComponent(uuid)}/current/stats?period=${PERIOD_DAYS}`,
        ),
      ),
      withRetry(() =>
        soundchartsRequest<{ items?: ShazamChartRank[] }>(
          `/api/v2/song/${encodeURIComponent(uuid)}/charts/ranks/shazam?currentOnly=1&offset=0&limit=100&sortBy=position&sortOrder=asc`,
        ),
      ),
    ]);

    if (statsResult.status === "rejected") throw statsResult.reason;

    const payload = statsResult.value;
    const stats = new Map(
      (payload.audience ?? []).map((stat) => [stat.platform, stat]),
    );

    if (finiteNumber(stats.get("shazam")?.value) === null) {
      try {
        const shazamAudience = await withRetry(() =>
          soundchartsRequest<{ items?: SongAudiencePoint[] }>(
            `/api/v2/song/${encodeURIComponent(uuid)}/audience/shazam?offset=0&limit=1&sort=desc`,
          ),
        );
        const latest = shazamAudience.items?.[0];
        const value = (latest?.plots ?? []).reduce(
          (sum, plot) => sum + (finiteNumber(plot.value) ?? 0),
          0,
        );

        if (latest && Number.isFinite(value)) {
          stats.set("shazam", {
            platform: "shazam",
            value,
            date: latest.date,
          });
        }
      } catch (error) {
        if (
          !(
            error instanceof SoundchartsError &&
            [403, 404].includes(error.status)
          )
        ) {
          console.error("Soundcharts Shazam audience fallback failed:", error);
        }
      }
    }

    const shazamTopMarket =
      shazamChartsResult.status === "fulfilled"
        ? (shazamChartsResult.value.items ?? []).find(
            (entry) =>
              Number(entry.position) > 0 &&
              (entry.chart?.countryName || entry.chart?.countryCode),
          )?.chart
        : undefined;
    const shazamTopMarketName =
      shazamTopMarket?.countryName ?? shazamTopMarket?.countryCode ?? null;

    return NextResponse.json({
      periodDays: PERIOD_DAYS,
      items: platforms.map((platform) => {
        const stat = stats.get(platform.code);

        return {
          id: platform.code,
          platform: platform.label,
          metric: platform.metric,
          value: finiteNumber(stat?.value),
          evolution: finiteNumber(stat?.evolution),
          percentEvolution: finiteNumber(stat?.percentEvolution),
          updatedAt: stat?.date ?? null,
          topMarket: platform.code === "shazam" ? shazamTopMarketName : null,
        };
      }),
    });
  } catch (error) {
    console.error("Soundcharts social traction failed:", error);

    if (error instanceof SoundchartsError) {
      const message =
        error.status === 403
          ? "Social data is not available on the current plan."
          : error.message;

      return NextResponse.json(
        { error: message, code: error.code },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Could not reach the analytics provider.", code: "UNKNOWN" },
      { status: 502 },
    );
  }
}
