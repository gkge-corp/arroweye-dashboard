"use server";

import {
  emailPattern,
  parseSheetUrl,
  toRecipients,
} from "@/lib/mailer/google-sheet";
import {
  prepareRsvpSheet,
  readSheetRows,
  SheetAccessError,
} from "@/lib/mailer/google-sheets-api";
import { validateInvitation } from "@/lib/mailer/invitation-template";
import {
  assertRsvpLinksConfigured,
  RsvpConfigError,
} from "@/lib/mailer/rsvp-token";
import {
  MAILER_BATCH_SIZE,
  MAILER_IMAGE_MAX_BYTES,
  MAILER_MAX_RECIPIENTS,
} from "@/lib/mailer/limits";
import {
  chunk,
  createSendContext,
  SEND_CONCURRENCY,
  sendInvitationGroup,
  tickInviteSent,
  toInvitationFields,
  type InvitationSendContext,
} from "@/lib/mailer/send-invitation";
import { getAppBaseUrl } from "@/lib/server/get-app-base-url";
import { getAuthorizedStaff } from "@/lib/server/get-authorized-staff";
import {
  createMailerImageUpload,
  getMailerImageContentType,
  isMailerImageKey,
} from "@/lib/storage/mailer-images";
import type {
  InvitationFields,
  LoadSheetResult,
  MailerImageUploadResult,
  MailerRecipient,
  MailerSendFailure,
  SendMailerBatchResult,
} from "@/types/mailer";

const toMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export async function loadSheetRecipients(
  sheetUrlInput: string,
): Promise<LoadSheetResult> {
  const sheet = parseSheetUrl(String(sheetUrlInput ?? "").trim());
  if (!sheet) {
    return { success: false, message: "Paste a valid Google Sheets link." };
  }

  try {
    await getAuthorizedStaff();

    // Read as the service account, so the sheet can stay restricted.
    const parsed = toRecipients(await readSheetRows(sheet));
    if (!parsed) {
      return { success: false, message: "No email column found in this sheet." };
    }
    if (parsed.recipients.length > MAILER_MAX_RECIPIENTS) {
      return {
        success: false,
        message: `Sheets can have up to ${MAILER_MAX_RECIPIENTS} recipients.`,
      };
    }

    return { success: true, ...parsed };
  } catch (error) {
    console.error("Mailer sheet import failed:", error);
    if (error instanceof SheetAccessError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "The sheet could not be loaded." };
  }
}

export async function getMailerImageUpload(
  fileNameInput: string,
  fileSize: number,
): Promise<MailerImageUploadResult> {
  const fileName = String(fileNameInput ?? "").trim().slice(0, 200);

  if (!getMailerImageContentType(fileName)) {
    return { success: false, message: "Upload a PNG, JPG, GIF or WebP image." };
  }
  if (
    !Number.isFinite(fileSize) ||
    fileSize <= 0 ||
    fileSize > MAILER_IMAGE_MAX_BYTES
  ) {
    return { success: false, message: "Images must be 5MB or smaller." };
  }

  try {
    await getAuthorizedStaff();
    return { success: true, ...(await createMailerImageUpload(fileName)) };
  } catch (error) {
    console.error("Mailer image upload signature failed:", error);
    return {
      success: false,
      message: toMessage(error, "The image could not be uploaded."),
    };
  }
}

interface SendMailerBatchInput {
  invitation: InvitationFields;
  imageKey?: string;
  recipients: MailerRecipient[];
  sheetUrl: string;
  /** Test sends carry RSVP links that record nothing. */
  test: boolean;
}

const validateBatch = (input: SendMailerBatchInput) => {
  const invitationError = validateInvitation(toInvitationFields(input.invitation));
  if (invitationError) return invitationError;
  if (!Array.isArray(input.recipients) || input.recipients.length === 0) {
    return "Add at least one recipient.";
  }
  if (input.recipients.length > MAILER_BATCH_SIZE) {
    return `Send at most ${MAILER_BATCH_SIZE} emails per batch.`;
  }
  if (!parseSheetUrl(String(input.sheetUrl))) {
    return "Import recipients from a Google Sheet first.";
  }
  if (input.imageKey && !isMailerImageKey(String(input.imageKey))) {
    return "The image is invalid. Remove it and try again.";
  }
  return null;
};

export async function prepareRsvp(
  sheetUrlInput: string,
): Promise<{ success: true } | { success: false; message: string }> {
  const sheet = parseSheetUrl(String(sheetUrlInput ?? "").trim());
  if (!sheet) {
    return { success: false, message: "Import recipients from a Google Sheet first." };
  }

  try {
    await getAuthorizedStaff();
    assertRsvpLinksConfigured();
    await prepareRsvpSheet(sheet);
    return { success: true };
  } catch (error) {
    console.error("RSVP sheet setup failed:", error);
    if (error instanceof SheetAccessError || error instanceof RsvpConfigError) {
      return { success: false, message: error.message };
    }
    return {
      success: false,
      message: "RSVP responses can't be saved to this sheet right now.",
    };
  }
}

export async function sendMailerBatch(
  input: SendMailerBatchInput,
): Promise<SendMailerBatchResult> {
  const validationError = validateBatch(input);
  if (validationError) return { success: false, message: validationError };

  try {
    await getAuthorizedStaff();
  } catch (error) {
    return {
      success: false,
      message: toMessage(error, "Your account could not be verified."),
    };
  }

  let context: InvitationSendContext;
  try {
    context = await createSendContext({
      sheet: parseSheetUrl(String(input.sheetUrl))!,
      invitation: input.invitation,
      imageKey: input.imageKey,
      baseUrl: await getAppBaseUrl(),
      test: input.test === true,
    });
  } catch (error) {
    console.error("Invitation batch setup failed:", error);
    return {
      success: false,
      message: "The invitation could not be prepared. Please try again.",
    };
  }

  const sentAt = Date.now();
  const failed: MailerSendFailure[] = [];
  const sentEmails: string[] = [];
  const validEmails: string[] = [];

  for (const recipient of input.recipients) {
    const email = String(recipient?.email ?? "").trim().toLowerCase();
    if (emailPattern.test(email)) validEmails.push(email);
    else failed.push({ email, message: "Invalid email address." });
  }

  for (const group of chunk(validEmails, SEND_CONCURRENCY)) {
    const result = await sendInvitationGroup(context, group, `invitation-${sentAt}`);
    sentEmails.push(...result.delivered);
    failed.push(
      ...result.failed.map((email) => ({ email, message: "Could not be delivered." })),
    );
  }

  return {
    success: true,
    sent: sentEmails.length,
    failed,
    sheetUpdated: await tickInviteSent(context, sentEmails),
  };
}
