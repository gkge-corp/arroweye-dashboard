import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import type { SheetRef } from "@/lib/mailer/google-sheet";

const TOKEN_TTL_DAYS = 90;

export type RsvpAnswer = "accept" | "decline";

export interface RsvpPayload extends SheetRef {
  email: string;
  title: string;
  /** yyyy-mm-dd; answers close after this day. Missing on links sent before it existed. */
  eventDate?: string;
  /** Test sends record nothing in the sheet. */
  test: boolean;
  exp: number;
}

const getSecret = () => {
  const secret = process.env.REPORT_LINK_SECRET?.trim();
  if (!secret) throw new Error("REPORT_LINK_SECRET is not configured.");
  return secret;
};

// The prefix keeps these signatures distinct from report links sharing the secret.
const sign = (encoded: string) =>
  createHmac("sha256", getSecret())
    .update(`mailer-rsvp.${encoded}`)
    .digest("base64url");

/** True once the event day has passed in the mailer time zone. */
export const isRsvpClosed = (payload: RsvpPayload, today: string) =>
  Boolean(payload.eventDate) && today > payload.eventDate!;

export class RsvpConfigError extends Error {}

/** Throws before any invitation goes out if links can't be signed. */
export const assertRsvpLinksConfigured = () => {
  if (!process.env.REPORT_LINK_SECRET?.trim()) {
    throw new RsvpConfigError(
      "RSVP links aren't set up yet: add REPORT_LINK_SECRET to the environment.",
    );
  }
};

export const isRsvpAnswer = (value: unknown): value is RsvpAnswer =>
  value === "accept" || value === "decline";

export const createRsvpToken = (payload: Omit<RsvpPayload, "exp">) => {
  const exp = Math.round(Date.now() / 1000) + TOKEN_TTL_DAYS * 86_400;
  const encoded = Buffer.from(JSON.stringify({ ...payload, exp })).toString(
    "base64url",
  );
  return `${encoded}.${sign(encoded)}`;
};

export const buildRsvpLinks = (baseUrl: string, token: string) => {
  const linkFor = (answer: RsvpAnswer) => {
    const url = new URL("/rsvp", baseUrl);
    url.searchParams.set("token", token);
    url.searchParams.set("answer", answer);
    return url.toString();
  };
  return { accept: linkFor("accept"), decline: linkFor("decline") };
};

export const verifyRsvpToken = (token: string): RsvpPayload | null => {
  const [encoded, signature] = String(token ?? "").split(".");
  if (!encoded || !signature) return null;

  const expected = Buffer.from(sign(encoded));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }

  const payload = JSON.parse(
    Buffer.from(encoded, "base64url").toString("utf8"),
  ) as RsvpPayload;
  return payload.exp > Date.now() / 1000 ? payload : null;
};
