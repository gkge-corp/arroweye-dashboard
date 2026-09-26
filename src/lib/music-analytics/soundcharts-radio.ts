import "server-only";

import { NextResponse } from "next/server";

import { withRetry } from "./fan-out";
import { SoundchartsError, soundchartsRequest } from "./soundcharts-client";
import { normalizeIsrc } from "./songstats-client";

// Soundcharts caps limit at 100 and bills per call.
export const RADIO_PAGE_SIZE = 100;

// A song's Soundcharts id never changes, so the lookup is kept for a week.
const SONG_UUID_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface BroadcastGroup {
  radio?: {
    slug?: string;
    name?: string;
    countryCode?: string;
    cityName?: string;
  };
  playCount?: number;
}

export interface RadioStation {
  id: string;
  name: string;
  city: string;
  countryCode: string;
  plays: number;
}

const resolveSongUuid = async (isrc: string) => {
  const payload = await withRetry(() =>
    soundchartsRequest<{ object?: { uuid?: string } }>(
      `/api/v2.25/song/by-isrc/${encodeURIComponent(normalizeIsrc(isrc))}`,
      { ttlMs: SONG_UUID_TTL_MS },
    ),
  );

  const uuid = payload.object?.uuid;
  if (!uuid) {
    throw new SoundchartsError(
      "Song not found for this ISRC.",
      404,
      "SONG_NOT_FOUND",
    );
  }
  return uuid;
};

/**
 * Spins per station inside the window, one page at a time. Insight stats and
 * Top Radio send identical params for the first page, so they share a cache
 * entry and a campaign pays for it once.
 */
export const fetchRadioStations = async (
  isrc: string,
  window: { startDate: string; endDate: string },
  offset = 0,
): Promise<RadioStation[]> => {
  const uuid = await resolveSongUuid(isrc);
  const query = new URLSearchParams({
    startDate: window.startDate,
    endDate: window.endDate,
    offset: String(offset),
    limit: String(RADIO_PAGE_SIZE),
  });
  const payload = await withRetry(() =>
    soundchartsRequest<{ items?: BroadcastGroup[] }>(
      `/api/v2/song/${uuid}/broadcast-groups?${query}`,
    ),
  );

  return (payload.items ?? []).map((item) => ({
    id: item.radio?.slug ?? `${item.radio?.name}-${item.radio?.countryCode}`,
    name: item.radio?.name ?? "Unknown station",
    city: item.radio?.cityName ?? "",
    countryCode: item.radio?.countryCode?.toUpperCase() ?? "",
    plays: Number(item.playCount ?? 0),
  }));
};

export const soundchartsErrorResponse = (error: unknown) => {
  if (error instanceof SoundchartsError && error.status === 404) {
    return NextResponse.json(
      {
        error: "Data for this song isn't available yet. Try again later.",
        code: "TRACK_PENDING",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { error: "Could not load this data right now.", code: "UNAVAILABLE" },
    {
      status:
        error instanceof SoundchartsError && error.status < 500
          ? error.status
          : 502,
    },
  );
};
