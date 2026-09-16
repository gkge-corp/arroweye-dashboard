import "server-only";

import nodemailer from "nodemailer";

interface SendZeptoMailInput {
  recipient: string;
  subject: string;
  html: string;
  text: string;
  clientReference: string;
}

const getRequiredEnv = (name: string) => {
  const value = process.env[name]?.trim();

  if (!value) throw new Error(`The email setting ${name} is not configured.`);

  return value;
};

const getBooleanEnv = (name: string, fallback: boolean) => {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) return fallback;
  if (["true", "1", "yes"].includes(value)) return true;
  if (["false", "0", "no"].includes(value)) return false;

  throw new Error(`The email setting ${name} must be true or false.`);
};

const getPort = () => {
  const value = Number(process.env.EMAIL_PORT?.trim() || "587");

  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error("The email setting EMAIL_PORT must be a valid port.");
  }

  return value;
};

const getSender = () => {
  const value = getRequiredEnv("AUTO_MAIL_FROM");
  const parsed = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);

  return {
    address: parsed?.[2]?.trim() ?? value,
    name: parsed?.[1]?.trim() || "Arroweye Pro",
  };
};

const createTransport = () => {
  const secure = getBooleanEnv("EMAIL_USE_SSL", false);
  const useTls = getBooleanEnv("EMAIL_USE_TLS", true);

  if (secure && useTls) {
    throw new Error("EMAIL_USE_SSL and EMAIL_USE_TLS cannot both be true.");
  }

  return nodemailer.createTransport({
    host: getRequiredEnv("EMAIL_HOST"),
    port: getPort(),
    secure,
    requireTLS: useTls,
    auth: {
      user: getRequiredEnv("EMAIL_HOST_USER"),
      pass: getRequiredEnv("EMAIL_HOST_PASSWORD"),
    },
  });
};

export async function sendZeptoMail({
  recipient,
  subject,
  html,
  text,
  clientReference,
}: SendZeptoMailInput) {
  const result = await createTransport().sendMail({
    from: getSender(),
    to: recipient,
    subject,
    html,
    text,
    headers: {
      "X-Arroweye-Client-Reference": clientReference,
    },
  });

  return { requestId: result.messageId };
}
