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
    code: "instagram",
    label: "Instagram",
    metric: "Reels using this song",
  },
  {
    code: "youtube",
    label: "YouTube",
    metric: "Video views",
  },
] as const;

interface AudienceStat {
  platform?: string;
  value?: number;
  evolution?: number;
  percentEvolution?: number;
  date?: string;
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
    const payload = await withRetry(() =>
      soundchartsRequest<{ audience?: AudienceStat[] }>(
        `/api/v2/song/${encodeURIComponent(uuid)}/current/stats?period=${PERIOD_DAYS}`,
      ),
    );
    const stats = new Map(
      (payload.audience ?? []).map((stat) => [stat.platform, stat]),
    );

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
