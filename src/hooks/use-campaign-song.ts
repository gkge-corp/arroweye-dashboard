"use client";

import { useCallback, useState } from "react";

import { updateProjectIsrc } from "@/services";

export interface LinkedSong {
  /** Provider id of the recording. Only used to key search results. */
  uuid: string;
  isrc?: string;
  title?: string;
  artist?: string;
  artwork?: string;
}

interface UseCampaignSongOptions {
  campaignId?: string | number;
  isrc?: string | null;
  onSaved?: () => void | Promise<void>;
}

const cleanIsrc = (value?: string | null) => value?.trim().toUpperCase() || undefined;

export function useCampaignSong({
  campaignId,
  isrc,
  onSaved,
}: UseCampaignSongOptions) {
  const [isSaving, setIsSaving] = useState(false);

  const linkSong = useCallback(
    async (song: LinkedSong) => {
      if (campaignId === undefined) return;

      const nextIsrc = cleanIsrc(song.isrc);
      if (!nextIsrc) {
        throw new Error("This recording has no ISRC to link.");
      }

      setIsSaving(true);
      try {
        await updateProjectIsrc(campaignId, nextIsrc);
        await onSaved?.();
      } finally {
        setIsSaving(false);
      }
    },
    [campaignId, onSaved],
  );

  return { songIsrc: cleanIsrc(isrc), linkSong, isSaving };
}
