import { NextRequest, NextResponse } from "next/server";

import { withRetry } from "@/lib/music-analytics/fan-out";
import {
  SoundchartsError,
  soundchartsRequest,
} from "@/lib/music-analytics/soundcharts-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Soundcharts caps limit at 100 and bills per call.
const PAGE_SIZE = 100;
const DEFAULT_WINDOW_DAYS = 90;

interface BroadcastGroup {
  radio?: {
    slug?: string;
    name?: string;
    countryCode?: string;
    countryName?: string;
    cityName?: string;
  };
  playCount?: number;
}

const asDate = (value: string | null) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;

const daysAgo = (days: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
};

export async function GET(request: NextRequest) {
  const uuid = request.nextUrl.searchParams.get("uuid")?.trim();
  const offset = Number(request.nextUrl.searchParams.get("offset") ?? 0);
  const startDate =
    asDate(request.nextUrl.searchParams.get("startDate")) ??
    daysAgo(DEFAULT_WINDOW_DAYS);
  const endDate =
    asDate(request.nextUrl.searchParams.get("endDate")) ??
    new Date().toISOString().slice(0, 10);
  const countryParam = request.nextUrl.searchParams.get("countries");
  const selectedCountries = countryParam
    ? new Set(
        countryParam
          .split(",")
          .map((country) => country.trim())
          .filter(Boolean),
      )
    : null;

  if (!uuid) {
    return NextResponse.json(
      { error: "Provide a song uuid.", code: "MISSING_UUID" },
      { status: 400 },
    );
  }

  try {
    const page = Number.isFinite(offset) && offset > 0 ? offset : 0;
    const payload = await withRetry(() =>
      soundchartsRequest<{ items?: BroadcastGroup[] }>(
        `/api/v2/song/${uuid}/broadcast-groups?startDate=${startDate}&endDate=${endDate}&offset=${page}&limit=${PAGE_SIZE}`,
      ),
    );

    const sourceItems = payload.items ?? [];
    const items = sourceItems
      .filter((item) => {
        if (!selectedCountries) return true;
        const country = item.radio?.countryName ?? item.radio?.countryCode;
        return Boolean(country && selectedCountries.has(country));
      })
      .map((item) => ({
        id:
          item.radio?.slug ?? `${item.radio?.name}-${item.radio?.countryCode}`,
        name: item.radio?.name ?? "Unknown station",
        country: item.radio?.countryName ?? item.radio?.countryCode ?? "",
        city: item.radio?.cityName ?? "",
        plays: Number(item.playCount ?? 0),
      }))
      .sort((a, b) => b.plays - a.plays);

    return NextResponse.json({
      items,
      nextOffset: sourceItems.length === PAGE_SIZE ? page + PAGE_SIZE : null,
      window: { startDate, endDate },
    });
  } catch (error) {
    console.error("Soundcharts top radio failed:", error);

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
