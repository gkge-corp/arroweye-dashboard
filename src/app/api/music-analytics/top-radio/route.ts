import { NextRequest, NextResponse } from "next/server";

import { readCountryName } from "@/lib/music-analytics/country-names";
import {
  RADIO_PAGE_SIZE,
  countPlaysInWindow,
  fetchRadioStations,
  toEpochSeconds,
  type RadioStation,
} from "@/lib/music-analytics/songstats-radio";
import { songstatsErrorResponse } from "@/lib/music-analytics/songstats-track-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_WINDOW_DAYS = 90;

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
  // AIRPLAY total: the campaign, or recent days before it starts.
  const startDate =
    requestedStart && requestedStart <= endDate
      ? requestedStart
      : daysAgo(DEFAULT_WINDOW_DAYS);
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
    const sourceItems = await fetchRadioStations(isrc, page);
    const from = toEpochSeconds(startDate);
    const to = toEpochSeconds(endDate, true);

    const isSelected = (station: RadioStation) =>
      !selectedCountries ||
      selectedCountries.has(readCountryName(station.country_code)) ||
      selectedCountries.has(station.country_code ?? "");

    const items = sourceItems
      .filter(isSelected)
      .map((station) => ({
        id: String(
          station.radio_station_id ?? `${station.name}-${station.country_code}`,
        ),
        name: station.name ?? "Unknown station",
        country: readCountryName(station.country_code),
        city: station.city_name ?? "",
        plays: countPlaysInWindow(station.radio_plays, from, to),
      }))
      .filter((station) => station.plays > 0)
      .sort((a, b) => b.plays - a.plays);

    // Pages run newest-played first, so once a station's last spin predates
    // the window every later page is outside it too.
    const lastStation = sourceItems[sourceItems.length - 1];
    const reachedOlderPlays =
      Math.max(0, ...(lastStation?.radio_plays ?? [])) < from;

    return NextResponse.json({
      items,
      nextOffset:
        sourceItems.length === RADIO_PAGE_SIZE && !reachedOlderPlays
          ? page + RADIO_PAGE_SIZE
          : null,
      window: { startDate, endDate },
    });
  } catch (error) {
    console.error("Songstats top radio failed:", error);
    return songstatsErrorResponse(error);
  }
}
