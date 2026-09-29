import "server-only";

import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const RADIO_MONITOR_CONTENT_TYPES = {
  csv: "text/csv",
  pdf: "application/pdf",
} as const;
type RadioMonitorFormat = keyof typeof RADIO_MONITOR_CONTENT_TYPES;
export const RADIO_MONITOR_MAX_BYTES = 10 * 1024 * 1024;

const UPLOAD_URL_TTL_SECONDS = 300;
const DOWNLOAD_URL_TTL_SECONDS = 300;

export interface StoredRadioMonitor {
  key: string;
  fileName: string;
  uploadedAt: string;
}

let client: S3Client | undefined;

const getConfig = () => {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("The file service is not configured.");
  }

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  client ??= new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, bucket, endpoint };
};

const folderFor = (campaignId: string) => `radio-monitor/campaign-${campaignId}/`;

// Keys are `<folder><timestamp>-<name>`; strip the timestamp for display.
const toFileName = (key: string) =>
  key.split("/").pop()?.replace(/^\d+-/, "") ?? key;

const toSafeFileName = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const base = fileName
    .slice(0, -(extension.length + 1))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "radio-monitor"}.${extension}`;
};

const getFormat = (fileName: string) =>
  fileName.split(".").pop()?.toLowerCase() ?? "";

export const isRadioMonitorFormat = (
  fileName: string,
): fileName is `${string}.${RadioMonitorFormat}` =>
  Object.hasOwn(RADIO_MONITOR_CONTENT_TYPES, getFormat(fileName));

export const createRadioMonitorUpload = async (
  campaignId: string,
  fileName: string,
) => {
  const { client, bucket, endpoint } = getConfig();
  const contentType =
    RADIO_MONITOR_CONTENT_TYPES[getFormat(fileName) as RadioMonitorFormat];
  const key = `${folderFor(campaignId)}${Date.now()}-${toSafeFileName(fileName)}`;
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS },
  );

  return {
    uploadUrl,
    contentType,
    // Private object location, recorded with the backend; not publicly readable.
    fileUrl: `${endpoint}/${bucket}/${key}`,
  };
};

export const findLatestRadioMonitor = async (
  campaignId: string,
): Promise<StoredRadioMonitor | null> => {
  const { client, bucket } = getConfig();
  const { Contents = [] } = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: folderFor(campaignId) }),
  );

  const latest = Contents.filter((object) => object.Key).sort(
    (a, b) =>
      (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0),
  )[0];
  if (!latest?.Key) return null;

  return {
    key: latest.Key,
    fileName: toFileName(latest.Key),
    uploadedAt: (latest.LastModified ?? new Date()).toISOString(),
  };
};

export const getRadioMonitorDownloadUrl = (file: StoredRadioMonitor) => {
  const { client, bucket } = getConfig();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: file.key,
      ResponseContentDisposition: `attachment; filename="${file.fileName}"`,
    }),
    { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
  );
};
