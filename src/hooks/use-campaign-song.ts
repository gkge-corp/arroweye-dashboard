"use client";

import { useCallback, useEffect, useState } from "react";

export interface LinkedSong {
  uuid: string;
  isrc?: string;
  title?: string;
  artist?: string;
  artwork?: string;
}

/**
 * Storage adapter for the campaign -> Soundcharts recording link.
 *
 * This is browser-local, so a link made by one teammate is invisible to the
 * rest of the campaign. Swap these two functions for a PATCH against the
 * Project `isrc` field once the serializer exposes it; nothing else in the
 * feature reads storage directly.
 */
const storageKey = (campaignId: string | number) => `campaign-song:${campaignId}`;

const readLinkedSong = (campaignId: string | number): LinkedSong | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(storageKey(campaignId));
    return raw ? (JSON.parse(raw) as LinkedSong) : null;
  } catch (error) {
    console.error("Failed to read the linked song:", error);
    return null;
  }
};

const writeLinkedSong = (
  campaignId: string | number,
  song: LinkedSong | null,
) => {
  if (typeof window === "undefined") return;

  try {
    if (song) {
      window.localStorage.setItem(storageKey(campaignId), JSON.stringify(song));
    } else {
      window.localStorage.removeItem(storageKey(campaignId));
    }
  } catch (error) {
    console.error("Failed to persist the linked song:", error);
  }
};

export function useCampaignSong(campaignId?: string | number) {
  const [linkedSong, setLinkedSong] = useState<LinkedSong | null>(null);

  useEffect(() => {
    if (campaignId === undefined) return;
    setLinkedSong(readLinkedSong(campaignId));
  }, [campaignId]);

  const linkSong = useCallback(
    (song: LinkedSong) => {
      if (campaignId === undefined) return;
      writeLinkedSong(campaignId, song);
      setLinkedSong(song);
    },
    [campaignId],
  );

  const unlinkSong = useCallback(() => {
    if (campaignId === undefined) return;
    writeLinkedSong(campaignId, null);
    setLinkedSong(null);
  }, [campaignId]);

  return { linkedSong, linkSong, unlinkSong };
}
