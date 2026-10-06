import "server-only";

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import { getConfig } from "@/lib/storage/r2";

import type { TrendRange } from "./trend-range";

export interface StoredTrendSummary {
  version: 1;
  /** Inputs the summary was written from; a change means it is stale. */
  signature: string;
  summary: string;
}

// Keyed by campaign, not song: each campaign has its own date window.
const keyFor = (campaignId: string, range: TrendRange) =>
  `channel-trend-summary/campaign-${campaignId}-${range}.json`;

const isMissingObject = (error: unknown) =>
  error instanceof Error && error.name === "NoSuchKey";

export const readTrendSummary = async (
  campaignId: string,
  range: TrendRange,
): Promise<StoredTrendSummary | null> => {
  const { client, bucket } = getConfig();

  try {
    const { Body } = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: keyFor(campaignId, range) }),
    );
    if (!Body) return null;

    const stored = JSON.parse(
      await Body.transformToString(),
    ) as StoredTrendSummary;
    return stored.version === 1 ? stored : null;
  } catch (error) {
    if (isMissingObject(error)) return null;
    throw error;
  }
};

export const writeTrendSummary = async (
  campaignId: string,
  range: TrendRange,
  summary: StoredTrendSummary,
) => {
  const { client, bucket } = getConfig();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: keyFor(campaignId, range),
      Body: JSON.stringify(summary),
      ContentType: "application/json",
    }),
  );
};
