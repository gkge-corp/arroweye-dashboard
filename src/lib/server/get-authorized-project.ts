import "server-only";

import { cookies } from "next/headers";

type UnknownRecord = Record<string, unknown>;

export const getAuthorizedProject = async (
  campaignId: string,
  forbiddenMessage = "You do not have access to this campaign.",
) => {
  const token = (await cookies()).get("auth_token")?.value;
  const apiBaseUrl = process.env.NEXT_PUBLIC_APP_SERVER_DOMAIN?.replace(
    /\/$/,
    "",
  );

  if (!token)
    throw new Error("Your session has expired. Please sign in again.");
  if (!apiBaseUrl) throw new Error("The campaign service is not configured.");

  const response = await fetch(
    `${apiBaseUrl}/api/v1/projects/${encodeURIComponent(campaignId)}/`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (response.status === 401 || response.status === 403) {
    throw new Error(forbiddenMessage);
  }
  if (!response.ok) throw new Error("The campaign could not be verified.");

  return (await response.json()) as UnknownRecord;
};
