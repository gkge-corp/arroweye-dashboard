"use server";

import { randomUUID } from "node:crypto";

import { parseSheetUrl } from "@/lib/mailer/google-sheet";
import {
  prepareRsvpSheet,
  SheetAccessError,
} from "@/lib/mailer/google-sheets-api";
import { validateInvitation } from "@/lib/mailer/invitation-template";
import {
  getAutoInviteUntil,
  todayInMailerZone,
} from "@/lib/mailer/schedule-dates";
import {
  assertRsvpLinksConfigured,
  RsvpConfigError,
} from "@/lib/mailer/rsvp-token";
import { toInvitationFields } from "@/lib/mailer/send-invitation";
import { getAppBaseUrl } from "@/lib/server/get-app-base-url";
import { getAuthorizedStaff } from "@/lib/server/get-authorized-staff";
import { isMailerImageKey } from "@/lib/storage/mailer-images";
import {
  isScheduleId,
  listSchedules,
  readSchedule,
  writeSchedule,
} from "@/lib/storage/mailer-schedules";
import type {
  InvitationFields,
  ScheduleActionResult,
  ScheduledInvitation,
} from "@/types/mailer";

interface ScheduleInvitationInput {
  sheetUrl: string;
  invitation: InvitationFields;
  imageKey?: string;
  sendOn: string;
}

const validateSchedule = (input: ScheduleInvitationInput) => {
  const invitationError = validateInvitation(toInvitationFields(input.invitation));
  if (invitationError) return invitationError;
  if (!parseSheetUrl(String(input.sheetUrl))) {
    return "Import recipients from a Google Sheet first.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(input.sendOn))) {
    return "Pick a send date.";
  }
  if (input.sendOn < todayInMailerZone()) {
    return "Pick today or a later date.";
  }
  if (input.imageKey && !isMailerImageKey(String(input.imageKey))) {
    return "The image is invalid. Remove it and try again.";
  }
  return null;
};

export async function scheduleInvitation(
  input: ScheduleInvitationInput,
): Promise<ScheduleActionResult> {
  const validationError = validateSchedule(input);
  if (validationError) return { success: false, message: validationError };

  try {
    const user = await getAuthorizedStaff();
    assertRsvpLinksConfigured();
    await prepareRsvpSheet(parseSheetUrl(input.sheetUrl)!);

    const invitation = toInvitationFields(input.invitation);
    const schedule: ScheduledInvitation = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      createdBy: user.email,
      sheetUrl: input.sheetUrl.trim(),
      invitation,
      imageKey: input.imageKey,
      baseUrl: await getAppBaseUrl(),
      sendOn: input.sendOn,
      autoInviteUntil: getAutoInviteUntil(
        input.sendOn,
        invitation.respondBy,
        invitation.date,
      ),
      status: "scheduled",
      sentCount: 0,
    };
    await writeSchedule(schedule);
    return { success: true, schedule };
  } catch (error) {
    console.error("Scheduling the invitation failed:", error);
    if (error instanceof SheetAccessError || error instanceof RsvpConfigError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "The invitation could not be scheduled." };
  }
}

/** Schedules that will still send: not finished and not cancelled. */
export async function listScheduledInvitations(): Promise<ScheduledInvitation[]> {
  await getAuthorizedStaff();
  const schedules = await listSchedules();
  return schedules
    .filter((schedule) => schedule.status === "scheduled" || schedule.status === "active")
    .sort((a, b) => a.sendOn.localeCompare(b.sendOn));
}

export async function cancelScheduledInvitation(
  id: string,
): Promise<ScheduleActionResult> {
  if (!isScheduleId(String(id))) {
    return { success: false, message: "This schedule could not be found." };
  }

  try {
    await getAuthorizedStaff();
    const schedule = await readSchedule(id);
    const cancelled: ScheduledInvitation = { ...schedule, status: "cancelled" };
    await writeSchedule(cancelled);
    return { success: true, schedule: cancelled };
  } catch (error) {
    console.error("Cancelling the scheduled invitation failed:", error);
    return { success: false, message: "The schedule could not be cancelled." };
  }
}
