import type { Top100Chart, Top100Row } from "./parse-top-100-chart";

export interface RadioMonitorSummary {
  /** e.g. "Cool FM 96.9 (Lagos) Top 100". */
  chart: string;
  period: string;
  position: number;
  plays: number;
  /** Plays against the chart's "Prev" column; null when the song is new. */
  changePercent: number | null;
  impressions: number | null;
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

const isTruncated = (value: string) => value.trimEnd().endsWith("..");

// Long cells are cut off with "..", so a truncated value only has to be a
// prefix of the campaign's.
const matchesTitle = (cell: string, title: string) => {
  const value = normalizeTitle(cell);
  if (!value) return false;
  return isTruncated(cell) ? title.startsWith(value) : value === title;
};

const matchesArtist = (cell: string, artist: string) => {
  const value = normalize(cell);
  return (
    value.length > 0 &&
    (value.includes(artist) || (isTruncated(cell) && artist.startsWith(value)))
  );
};

// A long artist can swallow the title cell ("Blaqbonez feat. Fola Despacito").
const matchesMergedCell = (row: Top100Row, title: string, artist: string) =>
  !row.title &&
  normalize(row.artist).startsWith(artist) &&
  normalize(row.artist).endsWith(` ${title}`);

const isCampaignRow = (row: Top100Row, title: string, artist: string) =>
  (matchesTitle(row.title, title) && matchesArtist(row.artist, artist)) ||
  matchesMergedCell(row, title, artist);

export const findCampaignRow = (
  chart: Top100Chart,
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

export const summarizeRadioMonitor = (
  chart: Top100Chart,
  songTitle: string,
  songArtist: string,
): RadioMonitorSummary | undefined => {
  const row = findCampaignRow(chart, songTitle, songArtist);
  if (!row) return undefined;

  return {
    chart: `${chart.station} ${chart.chart}`,
    period: chart.period,
    position: row.position,
    plays: row.plays,
    changePercent:
      row.previousPlays && row.previousPlays > 0
        ? ((row.plays - row.previousPlays) / row.previousPlays) * 100
        : null,
    impressions: row.impressions,
  };
};
