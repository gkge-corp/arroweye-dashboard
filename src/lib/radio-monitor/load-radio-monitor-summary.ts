import "server-only";

import { readRadioMonitor, type StoredRadioMonitor } from "@/lib/storage/r2";

import { parseStationChart, type StationChart } from "./parse-station-chart";
import { isPreviousChart, summarizeRadioMonitor } from "./radio-monitor-summary";

// Older uploads are only read to find last week's chart, so stop early.
const MAX_PREVIOUS_UPLOADS = 4;

const isPdf = (file: StoredRadioMonitor) =>
  file.fileName.toLowerCase().endsWith(".pdf");

const readChart = async (file: StoredRadioMonitor) =>
  parseStationChart(await readRadioMonitor(file));

const findPreviousChart = async (
  latest: StationChart,
  olderFiles: StoredRadioMonitor[],
) => {
  for (const file of olderFiles.filter(isPdf).slice(0, MAX_PREVIOUS_UPLOADS)) {
    try {
      const chart = await readChart(file);
      if (isPreviousChart(latest, chart)) return chart;
    } catch (error) {
      console.error(`Radio monitor ${file.key} could not be read:`, error);
    }
  }
  return undefined;
};

/**
 * Summarises the newest upload for the campaign's song. Only Radiomonitor
 * station chart PDFs are read; CSVs and unmatched songs return undefined.
 */
export const loadRadioMonitorSummary = async (
  files: StoredRadioMonitor[],
  song: { title: string; artist: string },
) => {
  const [latestFile, ...olderFiles] = files;
  if (!latestFile || !isPdf(latestFile)) return undefined;

  const latest = await readChart(latestFile);
  const previous = await findPreviousChart(latest, olderFiles);
  return summarizeRadioMonitor(latest, previous, song.title, song.artist);
};
