import type { StationChart, StationChartRow } from "./parse-station-chart";

export interface RadioMonitorSummary {
  station: string;
  period: string;
  /** Plays across every monitored station in the chart week. */
  airplay: number;
  /** Change against the previous week's chart; null when it was not uploaded. */
  changePercent: number | null;
  position: number;
  topStation?: string;
}

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\.\.$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Featured artists sit in the artist column, so they are dropped from titles.
const normalizeTitle = (title: string) =>
  normalize(title.replace(/[([](?:feat|ft)\.?[^)\]]*[)\]]/gi, ""));

const primaryArtist = (artist: string) =>
  normalize(artist.split(/\s+(?:feat\.?|ft\.?|x)\s+|[,&]/i)[0] ?? "");

/**
 * Chart artists are cut off with "..", so the campaign's primary artist must
 * appear in the row, or the row must be a prefix of it.
 */
const isCampaignRow = (row: StationChartRow, title: string, artist: string) => {
  const rowArtist = normalize(row.artist);
  return (
    normalizeTitle(row.title) === title &&
    rowArtist.length > 0 &&
    (rowArtist.includes(artist) || artist.startsWith(rowArtist))
  );
};

export const findCampaignRow = (
  chart: StationChart,
  songTitle: string,
  songArtist: string,
) => {
  const title = normalizeTitle(songTitle);
  const artist = primaryArtist(songArtist);
  if (!title || !artist) return undefined;

  return chart.rows
    .filter((row) => isCampaignRow(row, title, artist))
    .sort((a, b) => a.position - b.position)[0];
};

const totalPlays = (row: StationChartRow) =>
  row.stationPlays.length > 0
    ? row.stationPlays.reduce((sum, plays) => sum + plays, 0)
    : row.plays;

const readTopStation = (chart: StationChart, row: StationChartRow) => {
  if (chart.stations.length !== row.stationPlays.length) return undefined;

  const top = Math.max(...row.stationPlays);
  return top > 0 ? chart.stations[row.stationPlays.indexOf(top)] : undefined;
};

/** The chart covering the week the latest chart compares itself against. */
export const isPreviousChart = (latest: StationChart, candidate: StationChart) =>
  candidate.station === latest.station &&
  candidate.period === latest.comparedPeriod;

export const summarizeRadioMonitor = (
  latest: StationChart,
  previous: StationChart | undefined,
  songTitle: string,
  songArtist: string,
): RadioMonitorSummary | undefined => {
  const row = findCampaignRow(latest, songTitle, songArtist);
  if (!row) return undefined;

  const airplay = totalPlays(row);
  const previousRow = previous
    ? findCampaignRow(previous, songTitle, songArtist)
    : undefined;
  const previousAirplay = previousRow ? totalPlays(previousRow) : 0;

  return {
    station: latest.station,
    period: latest.period.replace(/\s+between\s.*$/i, ""),
    airplay,
    changePercent:
      previousAirplay > 0
        ? ((airplay - previousAirplay) / previousAirplay) * 100
        : null,
    position: row.position,
    topStation: readTopStation(latest, row),
  };
};
