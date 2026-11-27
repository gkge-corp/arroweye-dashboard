import "server-only";

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getConfig } from "@/lib/storage/r2";

const MAILER_IMAGE_FOLDER = "mailer-images/";
const UPLOAD_URL_TTL_SECONDS = 300;
const VIEW_URL_TTL_SECONDS = 3600;

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

const getExtension = (fileName: string) =>
  fileName.split(".").pop()?.toLowerCase() ?? "";

export const getMailerImageContentType = (fileName: string) =>
  CONTENT_TYPES[getExtension(fileName)] ?? null;

/** Only keys this feature created can be attached, never other bucket files. */
export const isMailerImageKey = (key: string) =>
  /^mailer-images\/\d+-[a-z0-9]+\.(png|jpe?g|gif|webp)$/.test(key);

export const createMailerImageUpload = async (fileName: string) => {
  const contentType = getMailerImageContentType(fileName);
  if (!contentType) throw new Error("Upload a PNG, JPG, GIF or WebP image.");

  const { client, bucket } = getConfig();
  const random = Math.random().toString(36).slice(2, 10);
  const key = `${MAILER_IMAGE_FOLDER}${Date.now()}-${random}.${getExtension(fileName)}`;
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS },
  );

  return { uploadUrl, contentType, key };
};

export const createMailerImageViewUrl = async (key: string) => {
  const { client, bucket } = getConfig();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: VIEW_URL_TTL_SECONDS,
  });
};

export const readMailerImage = async (key: string) => {
  const { client, bucket } = getConfig();
  const { Body } = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  if (!Body) throw new Error("The image is empty.");
  return Buffer.from(await Body.transformToByteArray());
};
