import "server-only";

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import { getConfig } from "@/lib/storage/r2";

import type { StoredChannelTrend } from "./types";

// Keyed by song, not campaign: daily plays are the same for every campaign
// on a song, so campaigns share one backfill.
const keyFor = (isrc: string) => `channel-trend/isrc-${isrc}.json`;

const isMissingObject = (error: unknown) =>
  error instanceof Error && error.name === "NoSuchKey";

export const readChannelTrend = async (
  isrc: string,
): Promise<StoredChannelTrend | null> => {
  const { client, bucket } = getConfig();

  try {
    const { Body } = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: keyFor(isrc) }),
    );
    if (!Body) return null;

    const stored = JSON.parse(
      await Body.transformToString(),
    ) as StoredChannelTrend;
    return stored.version === 2 ? stored : null;
  } catch (error) {
    if (isMissingObject(error)) return null;
    throw error;
  }
};

export const writeChannelTrend = async (
  isrc: string,
  trend: StoredChannelTrend,
) => {
  const { client, bucket } = getConfig();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: keyFor(isrc),
      Body: JSON.stringify(trend),
      ContentType: "application/json",
    }),
  );
};
