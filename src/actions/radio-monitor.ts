"use server";

import { getAuthorizedProject } from "@/lib/server/get-authorized-project";
import {
  createRadioMonitorUpload,
  findLatestRadioMonitor,
  isRadioMonitorFormat,
  RADIO_MONITOR_MAX_BYTES,
} from "@/lib/storage/r2";
import type {
  RadioMonitorFileResult,
  RadioMonitorUploadSignatureResult,
} from "@/types/radio-monitor";

const isValidCampaignId = (campaignId: string) =>
  /^\d+$/.test(campaignId) && Number(campaignId) > 0;

const toMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export async function getRadioMonitorUploadSignature(
  campaignIdInput: string,
  fileNameInput: string,
  fileSize: number,
): Promise<RadioMonitorUploadSignatureResult> {
  const campaignId = String(campaignIdInput ?? "").trim();
  const fileName = String(fileNameInput ?? "").trim().slice(0, 200);

  if (!isValidCampaignId(campaignId)) {
    return { success: false, message: "A valid campaign is required." };
  }
  if (!isRadioMonitorFormat(fileName)) {
    return {
      success: false,
      message: "Upload a CSV or PDF file.",
    };
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > RADIO_MONITOR_MAX_BYTES) {
    return { success: false, message: "Files must be 10MB or smaller." };
  }

  try {
    await getAuthorizedProject(campaignId);
    return {
      success: true,
      upload: await createRadioMonitorUpload(campaignId, fileName),
    };
  } catch (error) {
    console.error("Radio monitor upload signing failed:", error);
    return {
      success: false,
      message: toMessage(error, "The upload could not be started."),
    };
  }
}

export async function getRadioMonitorFile(
  campaignIdInput: string,
): Promise<RadioMonitorFileResult> {
  const campaignId = String(campaignIdInput ?? "").trim();
  if (!isValidCampaignId(campaignId)) {
    return { success: false, message: "A valid campaign is required." };
  }

  try {
    await getAuthorizedProject(campaignId);
    const file = await findLatestRadioMonitor(campaignId);
    return {
      success: true,
      file: file ? { fileName: file.fileName, uploadedAt: file.uploadedAt } : null,
    };
  } catch (error) {
    console.error("Radio monitor lookup failed:", error);
    return {
      success: false,
      message: toMessage(error, "The radio monitor file could not be loaded."),
    };
  }
}
