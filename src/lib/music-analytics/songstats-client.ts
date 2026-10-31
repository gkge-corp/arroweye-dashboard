import "server-only";

import { cachedRequest } from "./cached-request";

const API_BASE_URL = "https://api.songstats.com/enterprise/v1";

export class SongstatsError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "SongstatsError";
  }
}

const getApiKey = () => process.env.SONGSTATS_API_KEY?.trim();

export type SongstatsParams = Record<
  string,
  string | number | boolean | readonly string[] | null | undefined
>;

/**
 * Sorted so the same logical request always yields the same cache key,
 * whatever order a route builds its params in.
 */
const buildPath = (path: string, params: SongstatsParams = {}) => {
  const query = new URLSearchParams();

  for (const key of Object.keys(params).sort()) {
    const value = params[key];
    if (value === null || value === undefined || value === "") continue;
    query.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }

  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
};

interface SongstatsErrorBody {
  message?: string;
  error?: string;
}

const fetchFromSongstats = async <T>(path: string) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new SongstatsError(
      "Analytics credentials are not configured.",
      503,
      "SONGSTATS_UNCONFIGURED",
    );
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { apikey: apiKey, accept: "application/json" },
    // Songstats refreshes daily, so a 6-hour cache saves calls without serving stale days.
    next: { revalidate: 6 * 60 * 60 },
  });

  const payload = (await response.json().catch(() => ({}))) as T &
    SongstatsErrorBody;

  if (response.status === 401 || response.status === 403) {
    throw new SongstatsError(
      "The analytics provider rejected the configured credentials.",
      502,
      "SONGSTATS_AUTH_FAILED",
    );
  }

  if (!response.ok) {
    throw new SongstatsError(
      payload.message ??
        payload.error ??
        `Songstats request failed with status ${response.status}.`,
      response.status,
      "SONGSTATS_ERROR",
    );
  }

  return payload;
};

export const songstatsRequest = <T>(
  path: string,
  params?: SongstatsParams,
  options: { ttlMs?: number; skipCache?: boolean } = {},
) => {
  // The API key never appears in the cache key, only the path and query.
  const fullPath = buildPath(path, params);
  return cachedRequest({
    provider: "songstats",
    path: fullPath,
    fetcher: () => fetchFromSongstats<T>(fullPath),
    ...options,
  });
};

/** Songstats resolves tracks by ISRC directly, dashes and case ignored. */
export const normalizeIsrc = (isrc: string) =>
  isrc.replace(/-/g, "").trim().toUpperCase();

/**
 * A track Songstats has never seen answers 404 on first lookup and is queued
 * for discovery, so the same request can succeed later.
 */
export const isTrackPending = (error: unknown) =>
  error instanceof SongstatsError && error.status === 404;
