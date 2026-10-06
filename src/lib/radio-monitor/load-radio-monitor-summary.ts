import "server-only";

import { readRadioMonitor, type StoredRadioMonitor } from "@/lib/storage/r2";

import { parseTop100Chart } from "./parse-top-100-chart";
import { summarizeRadioMonitor } from "./radio-monitor-summary";

const isPdf = (file: StoredRadioMonitor) =>
  file.fileName.toLowerCase().endsWith(".pdf");

/**
 * Summarises the campaign's song from the newest shared upload. Only
 * Radiomonitor Top 100 PDFs are read; unmatched songs return undefined.
 */
export const loadRadioMonitorSummary = async (
  files: StoredRadioMonitor[],
  song: { title: string; artist: string },
) => {
  const [latestFile] = files;
  if (!latestFile || !isPdf(latestFile)) return undefined;

  const chart = await parseTop100Chart(
    await readRadioMonitor(latestFile),
  ).catch((error: unknown) => {
    throw new Error(
      `Radio monitor ${latestFile.key} could not be summarised.`,
      {
        cause: error,
      },
    );
  });
  const summary = summarizeRadioMonitor(chart, song.title, song.artist);
  if (!summary) {
    console.warn(
      `Radio monitor ${latestFile.key} has no row for "${song.title}" by "${song.artist}".`,
    );
  }
  return summary;
};
