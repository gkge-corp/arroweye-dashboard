import type { Top100Chart } from "@/lib/radio-monitor/parse-top-100-chart";

export interface RadioMonitorUploadParams {
  uploadUrl: string;
  contentType: string;
  fileUrl: string;
}

export interface RadioMonitorFile {
  fileName: string;
  uploadedAt: string;
}

export type RadioMonitorUploadSignatureResult =
  | { success: true; upload: RadioMonitorUploadParams }
  | { success: false; message: string };

export type RadioMonitorDownloadResult =
  | { success: true; url: string }
  | { success: false; message: string };

export type RadioMonitorFileResult =
  | { success: true; file: RadioMonitorFile | null }
  | { success: false; message: string };

export type RadioMonitorChartsResult =
  | { success: true; charts: Top100Chart[] }
  | { success: false; message: string };
