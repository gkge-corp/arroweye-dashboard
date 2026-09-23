import "server-only";

import { NextResponse } from "next/server";

import { withRetry } from "./fan-out";
import {
  SongstatsError,
  isTrackPending,
  normalizeIsrc,
  songstatsRequest,
  type SongstatsParams,
} from "./songstats-client";

export type SourceData = Record<string, unknown>;

/**
 * One `tracks/stats` call covers every requested source, returning a map of
 * source -> data. Detail lists (playlists, charts) are paged per source.
 */
export const fetchTrackStats = async (
  isrc: string,
  sources: string[],
  params: SongstatsParams = {},
) => {
  const payload = await withRetry(() =>
    songstatsRequest<{ stats?: { source?: string; data?: SourceData }[] }>(
      "/tracks/stats",
      { ...params, isrc: normalizeIsrc(isrc), source: sources.join(",") },
    ),
  );

  return new Map(
    (payload.stats ?? []).map((entry) => [
      entry.source ?? "",
      entry.data ?? {},
    ]),
  );
};

export const readList = <T>(data: SourceData | undefined, key: string) => {
  const value = data?.[key];
  return Array.isArray(value) ? (value as T[]) : [];
};

/**
 * What the dashboard sees when a lookup fails. Provider wording, plan limits
 * and vendor names stay in the server logs (callers log the error first) and
 * are never passed to the client.
 */
export const songstatsErrorResponse = (error: unknown) => {
  if (isTrackPending(error)) {
    return NextResponse.json(
      {
        error: "Data for this song isn't available yet. Try again later.",
        code: "TRACK_PENDING",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { error: "Could not load this data right now.", code: "UNAVAILABLE" },
    {
      status:
        error instanceof SongstatsError && error.status < 500
          ? error.status
          : 502,
    },
  );
};
