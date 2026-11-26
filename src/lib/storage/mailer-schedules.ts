import "server-only";

import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { getConfig } from "@/lib/storage/r2";
import type { ScheduledInvitation } from "@/types/mailer";

const SCHEDULE_FOLDER = "mailer-schedules/";

const scheduleKey = (id: string) => `${SCHEDULE_FOLDER}${id}.json`;

export const isScheduleId = (id: string) => /^[a-z0-9-]{8,64}$/.test(id);

export const readSchedule = async (id: string) => {
  const { client, bucket } = getConfig();
  const { Body } = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: scheduleKey(id) }),
  );
  if (!Body) throw new Error(`Schedule ${id} is empty.`);
  return JSON.parse(await Body.transformToString()) as ScheduledInvitation;
};

export const writeSchedule = async (schedule: ScheduledInvitation) => {
  const { client, bucket } = getConfig();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: scheduleKey(schedule.id),
      ContentType: "application/json",
      Body: JSON.stringify(schedule),
    }),
  );
};

export const listSchedules = async () => {
  const { client, bucket } = getConfig();
  const { Contents = [] } = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: SCHEDULE_FOLDER }),
  );
  const ids = Contents.flatMap((object) =>
    object.Key?.endsWith(".json")
      ? [object.Key.slice(SCHEDULE_FOLDER.length, -".json".length)]
      : [],
  );
  return Promise.all(ids.map(readSchedule));
};
