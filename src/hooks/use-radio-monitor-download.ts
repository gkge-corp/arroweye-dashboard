"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { getRadioMonitorDownloadLink } from "@/actions/radio-monitor";

export function useRadioMonitorDownload() {
  const downloadMutation = useMutation({
    mutationFn: async () => {
      const result = await getRadioMonitorDownloadLink();
      if (!result.success) throw new Error(result.message);
      return result.url;
    },
    // The signed link responds as an attachment, so the page stays put.
    onSuccess: (url) => window.location.assign(url),
    onError: (error) => toast.error(error.message),
  });

  return {
    download: () => downloadMutation.mutate(),
    isDownloading: downloadMutation.isPending,
  };
}
