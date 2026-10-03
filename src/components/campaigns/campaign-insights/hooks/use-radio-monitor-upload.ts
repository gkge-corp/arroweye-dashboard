"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getRadioMonitorFile,
  getRadioMonitorUploadSignature,
} from "@/actions/radio-monitor";
import type { RadioMonitorUploadParams } from "@/types/radio-monitor";

export const RADIO_MONITOR_ACCEPT = ".csv,.pdf";
export const RADIO_MONITOR_MAX_BYTES = 10 * 1024 * 1024;

const radioMonitorKey = (campaignId?: string | number) => [
  "radio-monitor",
  String(campaignId ?? ""),
];

export const validateRadioMonitorFile = (file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!RADIO_MONITOR_ACCEPT.split(",").includes(`.${extension}`)) {
    return "Upload a CSV or PDF file.";
  }
  if (file.size > RADIO_MONITOR_MAX_BYTES) {
    return "Files must be 10MB or smaller.";
  }
  return null;
};

const uploadToStorage = async (file: File, upload: RadioMonitorUploadParams) => {
  const response = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": upload.contentType },
    body: file,
  });
  if (!response.ok) {
    console.error(
      "Radio monitor storage upload failed:",
      response.status,
      await response.text().catch(() => ""),
    );
    throw new Error("The file could not be uploaded. Please try again.");
  }
};

export function useRadioMonitorUpload(
  campaignId?: string | number,
  enabled = true,
) {
  const queryClient = useQueryClient();
  const id = campaignId === undefined ? "" : String(campaignId);

  const fileQuery = useQuery({
    queryKey: radioMonitorKey(campaignId),
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const result = await getRadioMonitorFile(id);
      if (!result.success) throw new Error(result.message);
      return result.file;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const validationError = validateRadioMonitorFile(file);
      if (validationError) throw new Error(validationError);

      const signed = await getRadioMonitorUploadSignature(
        id,
        file.name,
        file.size,
      );
      if (!signed.success) throw new Error(signed.message);

      await uploadToStorage(file, signed.upload);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: radioMonitorKey(campaignId) }),
  });

  return {
    currentFile: fileQuery.data ?? null,
    isLoadingFile: fileQuery.isLoading,
    fileError: fileQuery.error?.message,
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
  };
}
