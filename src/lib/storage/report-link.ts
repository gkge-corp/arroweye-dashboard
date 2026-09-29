import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_DAYS = 30;

const getSecret = () => {
  const secret = process.env.REPORT_LINK_SECRET?.trim();
  if (!secret) throw new Error("Report links are not configured.");
  return secret;
};

const sign = (campaignId: string, expiresAt: number) =>
  createHmac("sha256", getSecret())
    .update(`radio-monitor.${campaignId}.${expiresAt}`)
    .digest("hex");

export const buildRadioMonitorLink = (
  baseUrl: string,
  campaignId: string,
  ttlDays = DEFAULT_TTL_DAYS,
) => {
  const expiresAt = Math.round(Date.now() / 1000) + ttlDays * 86_400;
  const url = new URL(
    `/api/radio-monitor/${encodeURIComponent(campaignId)}`,
    baseUrl,
  );
  url.searchParams.set("exp", String(expiresAt));
  url.searchParams.set("sig", sign(campaignId, expiresAt));
  return url.toString();
};

export const verifyRadioMonitorLink = (
  campaignId: string,
  expiresAt: number,
  signature: string,
) => {
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() / 1000) {
    return false;
  }
  const expected = Buffer.from(sign(campaignId, expiresAt));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
};
