import "server-only";

const API_BASE_URL = "https://customer.api.soundcharts.com";
const TOKEN_URL = "https://account.soundcharts.com/oauth/token";

interface CachedToken {
  value: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

export class SoundchartsError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "SoundchartsError";
  }
}

const getCredentials = () => ({
  clientId: process.env.SOUNDCHARTS_CLIENT_ID?.trim(),
  clientSecret: process.env.SOUNDCHARTS_CLIENT_SECRET?.trim(),
  teamId: process.env.SOUNDCHARTS_TEAM_ID?.trim(),
});

const requestToken = async (
  clientId: string,
  clientSecret: string,
  teamId?: string,
) => {
  const body = new URLSearchParams({ grant_type: "client_credentials" });
  if (teamId) body.set("team_id", teamId);

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
  };

  return { response, payload };
};

const getAccessToken = async () => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const { clientId, clientSecret, teamId } = getCredentials();
  if (!clientId || !clientSecret) {
    throw new SoundchartsError(
      "Analytics credentials are not configured.",
      503,
      "SOUNDCHARTS_UNCONFIGURED",
    );
  }

  let { response, payload } = await requestToken(clientId, clientSecret, teamId);

  // A stale or foreign SOUNDCHARTS_TEAM_ID is rejected outright, so fall back
  // to the account's default team rather than failing the whole request.
  if (!response.ok && teamId) {
    console.warn(
      "Soundcharts rejected SOUNDCHARTS_TEAM_ID; retrying without a team.",
    );
    ({ response, payload } = await requestToken(clientId, clientSecret));
  }

  if (!response.ok || !payload.access_token) {
    throw new SoundchartsError(
      "The analytics provider rejected the configured credentials.",
      502,
      "SOUNDCHARTS_AUTH_FAILED",
    );
  }

  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
};

interface SoundchartsErrorBody {
  errors?: { message?: string }[];
}

/**
 * Soundcharts bills per HTTP call against a monthly quota, and playlist and
 * radio data moves at most daily, so responses are held in memory and shared
 * by every viewer of a campaign. Keyed on the path alone: the bearer token
 * rotates hourly and must not fragment the cache.
 */
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

const responseCache = new Map<string, { value: unknown; expiresAt: number }>();

const readCache = <T>(path: string): T | undefined => {
  const hit = responseCache.get(path);
  if (!hit) return undefined;

  if (hit.expiresAt <= Date.now()) {
    responseCache.delete(path);
    return undefined;
  }

  // Refresh insertion order so the oldest untouched entry is evicted first.
  responseCache.delete(path);
  responseCache.set(path, hit);
  return hit.value as T;
};

const writeCache = (path: string, value: unknown, ttlMs: number) => {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = responseCache.keys().next().value;
    if (oldest) responseCache.delete(oldest);
  }
  responseCache.set(path, { value, expiresAt: Date.now() + ttlMs });
};

/**
 * The cache only helps once a request has finished. Identical calls issued
 * before that — React re-invoking an effect, two people opening the same
 * campaign — would each be billed, so concurrent callers share one promise.
 */
const inFlight = new Map<string, Promise<unknown>>();

const requestUncached = async <T>(path: string, ttlMs: number) => {
  const token = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as T &
    SoundchartsErrorBody;

  if (!response.ok) {
    throw new SoundchartsError(
      payload.errors?.find((entry) => entry.message)?.message ??
        `Soundcharts request failed with status ${response.status}.`,
      response.status,
      "SOUNDCHARTS_ERROR",
    );
  }

  writeCache(path, payload, ttlMs);
  return payload;
};

export const soundchartsRequest = async <T>(
  path: string,
  options: { ttlMs?: number; skipCache?: boolean } = {},
) => {
  const { ttlMs = DEFAULT_TTL_MS, skipCache = false } = options;

  if (!skipCache) {
    const cached = readCache<T & SoundchartsErrorBody>(path);
    if (cached) return cached;

    const pending = inFlight.get(path);
    if (pending) return (await pending) as T & SoundchartsErrorBody;
  }

  const request = requestUncached<T>(path, ttlMs).finally(() => {
    inFlight.delete(path);
  });
  inFlight.set(path, request);

  return request;
};

export const clearSoundchartsCache = (pathPrefix?: string) => {
  if (!pathPrefix) {
    responseCache.clear();
    return;
  }

  for (const key of responseCache.keys()) {
    if (key.startsWith(pathPrefix)) responseCache.delete(key);
  }
};

export const isSoundchartsConfigured = () => {
  const { clientId, clientSecret } = getCredentials();
  return Boolean(clientId && clientSecret);
};
