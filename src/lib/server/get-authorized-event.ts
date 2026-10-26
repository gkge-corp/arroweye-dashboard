import "server-only";

import { cookies } from "next/headers";

/** Lets the backend decide access: the event must be readable with the user's token. */
export const getAuthorizedEvent = async (
  eventId: number,
  forbiddenMessage = "You do not have access to this event.",
) => {
  const token = (await cookies()).get("auth_token")?.value;
  const apiBaseUrl = process.env.NEXT_PUBLIC_APP_SERVER_DOMAIN?.replace(
    /\/$/,
    "",
  );

  if (!token)
    throw new Error("Your session has expired. Please sign in again.");
  if (!apiBaseUrl) throw new Error("The schedule service is not configured.");

  const response = await fetch(
    `${apiBaseUrl}/api/v1/projects/schedule/events/${eventId}/`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if ([401, 403, 404].includes(response.status)) {
    throw new Error(forbiddenMessage);
  }
  if (!response.ok) throw new Error("The event could not be verified.");

  return (await response.json()) as Record<string, unknown>;
};
