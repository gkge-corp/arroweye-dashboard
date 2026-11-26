import "server-only";

import { headers } from "next/headers";

// Links in the email must point at the app that sent it, not the API server.
export const getAppBaseUrl = async () => {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) throw new Error("The app URL could not be determined.");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
};
