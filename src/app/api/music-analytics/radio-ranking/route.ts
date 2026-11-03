import { NextRequest, NextResponse } from "next/server";

import { HAND_KEPT_RADIOS } from "@/app/spots/spots-data";
import { readCountryName } from "@/lib/music-analytics/country-names";
import { fetchTopRadios } from "@/lib/music-analytics/soundcharts-radio-ranking";
import { soundchartsErrorResponse } from "@/lib/music-analytics/soundcharts-radio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_COUNTRIES = ["NG", "ZA", "KE", "UG", "TZ", "GB", "GH"];
const STATIONS_PER_COUNTRY = 50;

const readCountries = (value: string | null) => {
  const codes = (value ?? "")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter((code) => /^[A-Z]{2}$/.test(code));
  return codes.length > 0 ? codes : DEFAULT_COUNTRIES;
};

export async function GET(request: NextRequest) {
  const countries = readCountries(
    request.nextUrl.searchParams.get("countries"),
  );

  try {
    // One request per country: a combined request shares a single limit,
    // and the UK alone fills it.
    const rankings = await Promise.all(
      countries.map((code) => fetchTopRadios([code], STATIONS_PER_COUNTRY)),
    );
    const handKept = HAND_KEPT_RADIOS.filter((station) =>
      countries.includes(station.countryCode),
    );

    const items = [...rankings.flat(), ...handKept]
      .filter((station) => station.reach > 0)
      // The provider sorts on its own reach metric, which can lag the
      // station's current figure, so re-rank on the value we display.
      .sort((a, b) => b.reach - a.reach)
      .map((station, index) => ({
        position: index + 1,
        id: station.id,
        name: station.name,
        city: station.city,
        country: readCountryName(station.countryCode),
        reach: station.reach,
        imageUrl: station.imageUrl,
      }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Soundcharts radio ranking failed:", error);
    return soundchartsErrorResponse(error);
  }
}
