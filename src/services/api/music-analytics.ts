import { getAuthSession } from "@/lib/auth-storage";

const apiBaseUrl = () =>
  (process.env.NEXT_PUBLIC_APP_SERVER_DOMAIN ?? "").replace(/\/$/, "");

/**
 * GETs one of the API's music-analytics routes, e.g. `charts?isrc=...`.
 * Responses keep the { error } shape the hooks read; song data needs a
 * signed-in viewer of a campaign with that song.
 */
export const fetchMusicAnalytics = (pathAndQuery: string) => {
  const session = getAuthSession();
  const token = session?.access || session?.token;
  return fetch(`${apiBaseUrl()}/api/music-analytics/${pathAndQuery}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};
