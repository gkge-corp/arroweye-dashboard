import "server-only";

import { SongstatsError } from "./songstats-client";
import { fetchTrackStats, readList } from "./songstats-track-stats";

// Songstats caps expanded lists at 100 per call.
export const RADIO_PAGE_SIZE = 100;

export interface RadioStation {
  radio_station_id?: number;
  name?: string;
  city_name?: string | null;
  country_code?: string | null;
  radio_plays?: number[];
}

/**
 * Stations newest-played first, with every play timestamp. Insight stats and
 * Top Radio send identical params for the first page, so they share a cache
 * entry and a campaign pays for it once.
 */
export const fetchRadioStations = async (isrc: string, offset = 0) => {
  const stats = await fetchTrackStats(isrc, ["radio"], {
    with_stations: true,
    with_radio_plays: true,
    sort: "latest",
    offset,
    limit: RADIO_PAGE_SIZE,
  });

  // An entitled key answers with a radio entry even for a song with no plays;
  // a key without Radiostats silently drops the source instead.
  if (!stats.has("radio")) {
    throw new SongstatsError(
      "Radio data is not included in the current Songstats plan.",
      403,
      "RADIO_NOT_ENABLED",
    );
  }

  return readList<RadioStation>(stats.get("radio"), "radio_stations");
};

export const toEpochSeconds = (date: string, endOfDay = false) =>
  Date.parse(`${date}T${endOfDay ? "23:59:59" : "00:00:00"}Z`) / 1000;

/**
 * Station totals are lifetime, so spins inside a window are counted from the
 * per-play timestamps (epoch seconds) instead.
 */
export const countPlaysInWindow = (
  plays: number[] = [],
  from: number,
  to: number,
) => plays.filter((playedAt) => playedAt >= from && playedAt <= to).length;
