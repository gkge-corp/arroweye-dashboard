"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LinkedSong } from "@/hooks/use-campaign-song";

interface SongCandidate extends LinkedSong {
  releaseDate?: string;
}

interface LinkSongDialogProps {
  open: boolean;
  songTitle?: string;
  artistName?: string;
  onOpenChange: (open: boolean) => void;
  onLink: (song: LinkedSong) => void;
}

const searchSongs = async (params: { term?: string; isrc?: string }) => {
  const query = new URLSearchParams();
  if (params.isrc) query.set("isrc", params.isrc);
  if (params.term) query.set("term", params.term);

  const response = await fetch(`/api/music-analytics/song-search?${query}`);
  const payload = (await response.json().catch(() => ({}))) as {
    items?: SongCandidate[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not search recordings.");
  }

  return payload.items ?? [];
};

export function LinkSongDialog({
  open,
  songTitle,
  artistName,
  onOpenChange,
  onLink,
}: LinkSongDialogProps) {
  const [term, setTerm] = useState("");
  const [isrc, setIsrc] = useState("");
  const [candidates, setCandidates] = useState<SongCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!open) return;

    setTerm([songTitle, artistName].filter(Boolean).join(" "));
    setIsrc("");
    setCandidates([]);
    setHasSearched(false);
  }, [open, songTitle, artistName]);

  const runSearch = async (params: { term?: string; isrc?: string }) => {
    setIsSearching(true);
    try {
      const items = await searchSongs(params);
      setCandidates(items);
      setHasSearched(true);
    } catch (error) {
      console.error("Song search failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not search recordings.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleLink = (song: SongCandidate) => {
    onLink({
      uuid: song.uuid,
      isrc: song.isrc,
      title: song.title,
      artist: song.artist,
      artwork: song.artwork,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl border-zinc-200 bg-white p-6 text-zinc-950 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[12px] font-[500] uppercase tracking-[.1rem] text-zinc-500 dark:text-zinc-400">
            Link song
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
            Match this campaign to the exact recording. Playlist
            placements are pulled for whichever recording you pick.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <label
              className="text-xs font-medium uppercase tracking-[.08rem] text-zinc-500 dark:text-zinc-400"
              htmlFor="link-song-term"
            >
              Search by song and artist
            </label>
            <div className="flex gap-2">
              <input
                id="link-song-term"
                type="text"
                value={term}
                placeholder="Song title and artist"
                className="h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none"
                onChange={(event) => setTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && term.trim()) {
                    void runSearch({ term: term.trim() });
                  }
                }}
              />
              <Button
                type="button"
                className="h-11 shrink-0 rounded-full bg-black px-5 text-white hover:bg-orange-500 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-orange-500 dark:hover:text-white"
                disabled={isSearching || !term.trim()}
                onClick={() => void runSearch({ term: term.trim() })}
              >
                {isSearching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Stage names are often stylised on campaigns. Search the name the
              artist releases under.
            </p>
          </div>

          <div className="space-y-2">
            <label
              className="text-xs font-medium uppercase tracking-[.08rem] text-zinc-500 dark:text-zinc-400"
              htmlFor="link-song-isrc"
            >
              Or paste the ISRC
            </label>
            <div className="flex gap-2">
              <input
                id="link-song-isrc"
                type="text"
                value={isrc}
                placeholder="USRC17607839"
                className="h-11 w-full rounded-full border border-border bg-background px-4 text-sm uppercase outline-none"
                onChange={(event) => setIsrc(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && isrc.trim()) {
                    void runSearch({ isrc: isrc.trim() });
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 shrink-0 rounded-full px-5"
                disabled={isSearching || !isrc.trim()}
                onClick={() => void runSearch({ isrc: isrc.trim() })}
              >
                Check
              </Button>
            </div>
          </div>

          <div className="max-h-[280px] space-y-2 overflow-y-auto">
            {candidates.map((candidate) => (
              <button
                key={candidate.uuid}
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left transition-colors hover:border-zinc-900 dark:border-zinc-700 dark:hover:border-zinc-300"
                onClick={() => handleLink(candidate)}
              >
                {candidate.artwork ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={candidate.artwork}
                    alt=""
                    className="size-12 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <span className="size-12 shrink-0 rounded-md bg-zinc-100 dark:bg-zinc-800" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {candidate.title}
                  </span>
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {candidate.artist}
                    {candidate.releaseDate
                      ? ` · ${candidate.releaseDate.slice(0, 10)}`
                      : ""}
                  </span>
                  <span className="block truncate text-xs text-zinc-400 dark:text-zinc-500">
                    {candidate.isrc || "No ISRC"}
                  </span>
                </span>
              </button>
            ))}

            {hasSearched && !isSearching && candidates.length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No recordings matched. Try the artist&apos;s release name, or
                paste the ISRC from your distributor.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LinkSongDialog;
