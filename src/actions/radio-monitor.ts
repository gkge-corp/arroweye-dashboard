"use server";

import { canManageRadioMonitor } from "@/lib/radio-monitor/radio-monitor-access";
import { getAuthorizedStaff } from "@/lib/server/get-authorized-staff";
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

const toMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const authorizeRadioMonitor = async () => {
  const user = await getAuthorizedStaff();
  if (!canManageRadioMonitor(user.user_profile)) {
    throw new Error("You do not have access to this page.");
  }
};

export async function getRadioMonitorUploadSignature(
  fileNameInput: string,
  fileSize: number,
): Promise<RadioMonitorUploadSignatureResult> {
  const fileName = String(fileNameInput ?? "").trim().slice(0, 200);

  if (!isRadioMonitorFormat(fileName)) {
    return { success: false, message: "Upload a PDF file." };
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > RADIO_MONITOR_MAX_BYTES) {
    return { success: false, message: "Files must be 10MB or smaller." };
  }

  try {
    await authorizeRadioMonitor();
    return {
      success: true,
      upload: await createRadioMonitorUpload(fileName),
    };
  } catch (error) {
    console.error("Radio monitor upload signing failed:", error);
    return {
      success: false,
      message: toMessage(error, "The upload could not be started."),
    };
  }
}

export async function getRadioMonitorFile(): Promise<RadioMonitorFileResult> {
  try {
    await authorizeRadioMonitor();
    const file = await findLatestRadioMonitor();
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
