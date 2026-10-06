import "server-only";

import { cookies } from "next/headers";

import type { AuthenticatedUser } from "@/types/api";

/** Rejects signed-out users and advertisers, who cannot manage shared files. */
export const getAuthorizedStaff = async (
  forbiddenMessage = "You do not have access to this page.",
) => {
  const token = (await cookies()).get("auth_token")?.value;
  const apiBaseUrl = process.env.NEXT_PUBLIC_APP_SERVER_DOMAIN?.replace(
    /\/$/,
    "",
  );

  if (!token)
    throw new Error("Your session has expired. Please sign in again.");
  if (!apiBaseUrl) throw new Error("The account service is not configured.");

  const response = await fetch(`${apiBaseUrl}/api/v1/ums/me/`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Your session has expired. Please sign in again.");
  }
  if (!response.ok) throw new Error("Your account could not be verified.");

  const user = (await response.json()) as AuthenticatedUser;
  if (user.user_type === "Advertiser") throw new Error(forbiddenMessage);
  return user;
};
