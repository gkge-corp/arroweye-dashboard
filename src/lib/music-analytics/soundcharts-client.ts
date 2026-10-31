import "server-only";

import { cachedRequest } from "./cached-request";

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

const fetchFromSoundcharts = async <T>(path: string, body?: unknown) => {
  const token = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    // Soundcharts refreshes daily, so a 6-hour cache saves calls without serving stale days.
    next: { revalidate: 6 * 60 * 60 },
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

  return payload;
};

export const soundchartsRequest = <T>(
  path: string,
  {
    body,
    ...options
  }: { ttlMs?: number; skipCache?: boolean; body?: unknown } = {},
) =>
  // Keyed on the path (plus any POST body) alone: the bearer token rotates
  // hourly and must not fragment the cache.
  cachedRequest({
    provider: "soundcharts",
    path: body ? `POST ${path} ${JSON.stringify(body)}` : path,
    fetcher: () => fetchFromSoundcharts<T>(path, body),
    ...options,
  });
