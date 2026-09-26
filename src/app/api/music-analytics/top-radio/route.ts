import { NextRequest, NextResponse } from "next/server";

import { readCountryName } from "@/lib/music-analytics/country-names";
import {
  ALL_TIME_START,
  RADIO_PAGE_SIZE,
  fetchRadioStations,
  soundchartsErrorResponse,
  type RadioStation,
} from "@/lib/music-analytics/soundcharts-radio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const asDate = (value: string | null) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;

const daysAgo = (days: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
};

export async function GET(request: NextRequest) {
  const isrc = request.nextUrl.searchParams.get("isrc")?.trim();
  const offset = Number(request.nextUrl.searchParams.get("offset") ?? 0);
  const today = daysAgo(0);
  const requestedStart = asDate(request.nextUrl.searchParams.get("startDate"));
  const requestedEnd = asDate(request.nextUrl.searchParams.get("endDate"));
  const endDate = !requestedEnd || requestedEnd > today ? today : requestedEnd;
  // Same window insight stats counts over, so station spins add up to the
  // AIRPLAY total: all-time unless a window is requested.
  const startDate =
    requestedStart && requestedStart <= endDate
      ? requestedStart
      : ALL_TIME_START;
  const countryParam = request.nextUrl.searchParams.get("countries");
  const selectedCountries = countryParam
    ? new Set(
        countryParam
          .split(",")
          .map((country) => country.trim())
          .filter(Boolean),
      )
    : null;

  if (!isrc) {
    return NextResponse.json(
      { error: "Provide the song's ISRC.", code: "MISSING_ISRC" },
      { status: 400 },
    );
  }

  try {
    const page = Number.isFinite(offset) && offset > 0 ? offset : 0;
    const sourceItems = await fetchRadioStations(
      isrc,
      { startDate, endDate },
      page,
    );

    const isSelected = (station: RadioStation) =>
      !selectedCountries ||
      selectedCountries.has(readCountryName(station.countryCode)) ||
      selectedCountries.has(station.countryCode);

    const items = sourceItems
      .filter(isSelected)
      .map((station) => ({
        id: station.id,
        name: station.name,
        country: readCountryName(station.countryCode),
        city: station.city,
        plays: station.plays,
      }))
      .filter((station) => station.plays > 0)
      .sort((a, b) => b.plays - a.plays);

    return NextResponse.json({
      items,
      nextOffset:
        sourceItems.length === RADIO_PAGE_SIZE ? page + RADIO_PAGE_SIZE : null,
      window: { startDate, endDate },
    });
  } catch (error) {
    console.error("Soundcharts top radio failed:", error);
    return soundchartsErrorResponse(error);
  }
}
