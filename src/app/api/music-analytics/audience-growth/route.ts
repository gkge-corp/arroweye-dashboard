import { NextRequest, NextResponse } from "next/server";

import { mapWithConcurrency, withRetry } from "@/lib/music-analytics/fan-out";
import { ARTIST_SOCIAL_PLATFORMS } from "@/lib/music-analytics/platforms";
import {
  SoundchartsError,
  soundchartsRequest,
} from "@/lib/music-analytics/soundcharts-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONCURRENCY = 3;

interface ArtistStat {
  platform?: string;
  value?: number | null;
  evolution?: number | null;
}

interface AudiencePoint {
  date?: string;
  followerCount?: number | null;
}

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

const normalizePlatform = (platform: string) =>
  platform === "x" ? "twitter" : platform;

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

const getHistoricalGrowth = async (
  artistUuid: string,
  startDate: string,
  endDate: string,
) => {
  const results = await mapWithConcurrency(
    ARTIST_SOCIAL_PLATFORMS,
    CONCURRENCY,
    async (platform): Promise<PlatformGrowth | null> => {
      const basePath = `/api/v2/artist/${artistUuid}/audience/${platform.code}?startDate=${startDate}&endDate=${endDate}&limit=1`;

      try {
        const [firstPayload, lastPayload] = await Promise.all([
          withRetry(() =>
            soundchartsRequest<{ items?: AudiencePoint[] }>(
              `${basePath}&sort=asc`,
            ),
          ),
          withRetry(() =>
            soundchartsRequest<{ items?: AudiencePoint[] }>(
              `${basePath}&sort=desc`,
            ),
          ),
        ]);
        const rawStartValue = firstPayload.items?.[0]?.followerCount;
        const rawEndValue = lastPayload.items?.[0]?.followerCount;
        const startValue = Number(rawStartValue);
        const endValue = Number(rawEndValue);

        if (
          rawStartValue === null ||
          rawStartValue === undefined ||
          rawEndValue === null ||
          rawEndValue === undefined ||
          !Number.isFinite(startValue) ||
          !Number.isFinite(endValue)
        ) {
          return null;
        }

        return {
          platform: platform.label,
          startValue,
          endValue,
          growth: endValue - startValue,
        };
      } catch (error) {
        if (
          !(
            error instanceof SoundchartsError &&
            [403, 404].includes(error.status)
          )
        ) {
          console.error(
            `Soundcharts campaign audience failed for ${platform.code}:`,
            error,
          );
        }
        return null;
      }
    },
  );

  return results.filter((entry): entry is PlatformGrowth => entry !== null);
};

export async function GET(request: NextRequest) {
  const uuid = request.nextUrl.searchParams.get("uuid")?.trim();
  const isrc = request.nextUrl.searchParams.get("isrc")?.trim();
  const rawStartDate = request.nextUrl.searchParams.get("startDate");
  const rawEndDate = request.nextUrl.searchParams.get("endDate") ?? today();
  const start = parseDate(rawStartDate);
  const requestedEnd = parseDate(rawEndDate);

  if (!uuid && !isrc) {
    return NextResponse.json(
      { error: "Provide a song uuid or ISRC.", code: "MISSING_SONG" },
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
    let songUuid = uuid;

    if (!songUuid && isrc) {
      const songByIsrc = await withRetry(() =>
        soundchartsRequest<{ object?: { uuid?: string } }>(
          `/api/v2.25/song/by-isrc/${encodeURIComponent(isrc.replace(/-/g, "").toUpperCase())}`,
        ),
      );
      songUuid = songByIsrc.object?.uuid;
    }

    if (!songUuid) {
      return NextResponse.json(
        { error: "Soundcharts could not resolve this song.", code: "NO_SONG" },
        { status: 404 },
      );
    }

    const songPayload = await withRetry(() =>
      soundchartsRequest<{
        object?: { artists?: { uuid?: string }[] };
      }>(`/api/v2/song/${encodeURIComponent(songUuid)}`),
    );
    const artistUuid = songPayload.object?.artists?.[0]?.uuid;

    if (!artistUuid) {
      return NextResponse.json(
        { error: "The linked song has no primary artist.", code: "NO_ARTIST" },
        { status: 404 },
      );
    }

    let entries: PlatformGrowth[] = [];

    // For an active campaign, one current-stats request gives the latest value
    // and the exact evolution since the campaign start for every platform.
    if (endDate === today()) {
      const periodDays = Math.ceil(
        (end.getTime() - start.getTime()) / 86_400_000,
      );

      if (periodDays >= 1) {
        try {
          const currentStats = await withRetry(() =>
            soundchartsRequest<{ social?: ArtistStat[] }>(
              `/api/v2/artist/${artistUuid}/current/stats?period=${periodDays}`,
            ),
          );
          const platformMap = new Map(
            ARTIST_SOCIAL_PLATFORMS.map((platform) => [
              platform.code,
              platform,
            ]),
          );

          entries = (currentStats.social ?? []).flatMap((stat) => {
            const platform = platformMap.get(
              normalizePlatform(stat.platform ?? ""),
            );
            if (stat.value === null || stat.evolution === null) return [];
            const endValue = Number(stat.value);
            const growth = Number(stat.evolution);
            if (
              !platform ||
              !Number.isFinite(endValue) ||
              !Number.isFinite(growth)
            ) {
              return [];
            }

            return [
              {
                platform: platform.label,
                startValue: Math.max(0, endValue - growth),
                endValue: Math.max(0, endValue),
                growth,
              },
            ];
          });
        } catch (error) {
          if (
            !(
              error instanceof SoundchartsError &&
              [403, 404].includes(error.status)
            )
          ) {
            console.error("Soundcharts current audience growth failed:", error);
          }
        }
      }
    }

    if (entries.length === 0) {
      entries = await getHistoricalGrowth(artistUuid, startDate, endDate);
    }

    return NextResponse.json(buildResult(entries, startDate, endDate));
  } catch (error) {
    console.error("Soundcharts campaign audience growth failed:", error);

    if (error instanceof SoundchartsError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Could not reach the analytics provider.", code: "UNKNOWN" },
      { status: 502 },
    );
  }
}
