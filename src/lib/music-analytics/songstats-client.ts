import "server-only";

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

/**
 * Songstats data refreshes at most daily and every call counts against the
 * plan, so responses are held in memory and shared by every viewer of a
 * campaign. The API key never appears in the key, only the path and query.
 */
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

const responseCache = new Map<string, { value: unknown; expiresAt: number }>();

const readCache = <T>(key: string): T | undefined => {
  const hit = responseCache.get(key);
  if (!hit) return undefined;

  if (hit.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return undefined;
  }

  // Refresh insertion order so the oldest untouched entry is evicted first.
  responseCache.delete(key);
  responseCache.set(key, hit);
  return hit.value as T;
};

const writeCache = (key: string, value: unknown, ttlMs: number) => {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = responseCache.keys().next().value;
    if (oldest) responseCache.delete(oldest);
  }
  responseCache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

// Concurrent identical calls share one promise so each is billed once.
const inFlight = new Map<string, Promise<unknown>>();

const requestUncached = async <T>(key: string, ttlMs: number) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new SongstatsError(
      "Analytics credentials are not configured.",
      503,
      "SONGSTATS_UNCONFIGURED",
    );
  }

  const response = await fetch(`${API_BASE_URL}${key}`, {
    headers: { apikey: apiKey, accept: "application/json" },
    cache: "no-store",
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

  writeCache(key, payload, ttlMs);
  return payload;
};

export const songstatsRequest = async <T>(
  path: string,
  params?: SongstatsParams,
  options: { ttlMs?: number; skipCache?: boolean } = {},
) => {
  const { ttlMs = DEFAULT_TTL_MS, skipCache = false } = options;
  const key = buildPath(path, params);

  if (!skipCache) {
    const cached = readCache<T & SongstatsErrorBody>(key);
    if (cached) return cached;

    const pending = inFlight.get(key);
    if (pending) return (await pending) as T & SongstatsErrorBody;
  }

  const request = requestUncached<T>(key, ttlMs).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, request);

  return request;
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
