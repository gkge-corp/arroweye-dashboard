import "server-only";

import { sendZeptoMail } from "@/lib/email/zeptomail";
import type { SheetRef } from "@/lib/mailer/google-sheet";
import { markInvitesSent } from "@/lib/mailer/google-sheets-api";
import {
  getInvitationSubject,
  renderInvitationHtml,
  renderInvitationText,
  type InvitationLinks,
} from "@/lib/mailer/invitation-template";
import { buildRsvpLinks, createRsvpToken } from "@/lib/mailer/rsvp-token";
import { readMailerImage } from "@/lib/storage/mailer-images";
import type { InvitationFields } from "@/types/mailer";

const MAX_FIELD_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 1_000;
const HERO_IMAGE_CID = "invitation-hero@arroweye";

const INVITATION_KEYS: (keyof InvitationFields)[] = [
  "tagline",
  "title",
  "date",
  "startTime",
  "endTime",
  "location",
  "respondBy",
  "heading",
  "message",
];

/** Keeps only known fields, as trimmed strings within their length limits. */
export const toInvitationFields = (input: InvitationFields) =>
  Object.fromEntries(
    INVITATION_KEYS.map((key) => [
      key,
      String(input?.[key] ?? "")
        .trim()
        .slice(0, key === "message" ? MAX_MESSAGE_LENGTH : MAX_FIELD_LENGTH),
    ]),
  ) as unknown as InvitationFields;

export interface InvitationSendContext extends SheetRef {
  fields: InvitationFields;
  baseUrl: string;
  /** Test sends carry RSVP links that record nothing, and tick nothing. */
  test: boolean;
  attachments: { filename: string; content: Buffer; cid: string }[];
}

const loadHeroImage = async (imageKey?: string) =>
  imageKey
    ? [
        {
          filename: `invitation.${imageKey.split(".").pop()}`,
          content: await readMailerImage(imageKey),
          cid: HERO_IMAGE_CID,
        },
      ]
    : [];

/** Loads the hero image once so every email in a run reuses it. */
export const createSendContext = async ({
  sheet,
  invitation,
  imageKey,
  baseUrl,
  test,
}: {
  sheet: SheetRef;
  invitation: InvitationFields;
  imageKey?: string;
  baseUrl: string;
  test: boolean;
}): Promise<InvitationSendContext> => ({
  ...sheet,
  fields: toInvitationFields(invitation),
  baseUrl,
  test,
  attachments: await loadHeroImage(imageKey),
});

const getRsvpLinks = (
  context: InvitationSendContext,
  email: string,
): InvitationLinks =>
  buildRsvpLinks(
    context.baseUrl,
    createRsvpToken({
      sheetId: context.sheetId,
      gid: context.gid,
      email,
      title: context.fields.title.slice(0, 150),
      eventDate: context.fields.date,
      test: context.test,
    }),
  );

export const sendInvitation = async (
  context: InvitationSendContext,
  email: string,
  clientReference: string,
) => {
  const links = getRsvpLinks(context, email);

  await sendZeptoMail({
    recipient: email,
    subject: getInvitationSubject(context.fields),
    text: renderInvitationText(context.fields, links),
    html: renderInvitationHtml({
      fields: context.fields,
      links,
      imageSrc: context.attachments.length ? `cid:${HERO_IMAGE_CID}` : undefined,
    }),
    clientReference,
    attachments: context.attachments,
  });
};

// Small parallel groups keep runs inside the function time limit without bursting the mail server.
export const SEND_CONCURRENCY = 5;

export const chunk = <T,>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );

/** Sends one group in parallel; failures are logged and returned, never thrown. */
export const sendInvitationGroup = async (
  context: InvitationSendContext,
  emails: string[],
  clientReference: string,
) => {
  const results = await Promise.allSettled(
    emails.map((email) => sendInvitation(context, email, clientReference)),
  );
  const delivered: string[] = [];
  const failed: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      delivered.push(emails[index]);
    } else {
      console.error(`Invitation to ${emails[index]} failed:`, result.reason);
      failed.push(emails[index]);
    }
  });
  return { delivered, failed };
};

/** A failed tick shouldn't report delivered invitations as failed, so it's flagged instead. */
export const tickInviteSent = async (
  context: InvitationSendContext,
  emails: string[],
) => {
  if (context.test) return true;
  try {
    await markInvitesSent(context, emails);
    return true;
  } catch (error) {
    console.error("Ticking 'Invite sent?' failed:", error);
    return false;
  }
};
