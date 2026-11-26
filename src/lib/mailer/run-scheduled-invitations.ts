import "server-only";

import { parseSheetUrl } from "@/lib/mailer/google-sheet";
import { listUninvitedEmails } from "@/lib/mailer/google-sheets-api";
import { todayInMailerZone } from "@/lib/mailer/schedule-dates";
import {
  chunk,
  createSendContext,
  SEND_CONCURRENCY,
  sendInvitationGroup,
  tickInviteSent,
} from "@/lib/mailer/send-invitation";
import { listSchedules, writeSchedule } from "@/lib/storage/mailer-schedules";
import type { ScheduledInvitation } from "@/types/mailer";

export interface ScheduleRunSummary {
  id: string;
  title: string;
  sent: number;
  failed: number;
  remaining: number;
  status: ScheduledInvitation["status"];
  error?: string;
}

/** Not finished or cancelled, and its first send day has arrived. */
const isDue = (schedule: ScheduledInvitation, today: string) =>
  (schedule.status === "scheduled" || schedule.status === "active") &&
  schedule.sendOn <= today;

/**
 * Sends to every unticked row, ticking each group right after it sends.
 * The sheet is the record of who's done, so a repeated or overlapping run
 * only resends a group that was mid-flight when another run read the sheet.
 */
const runSchedule = async (
  schedule: ScheduledInvitation,
  stopAt: number,
): Promise<ScheduleRunSummary> => {
  const sheet = parseSheetUrl(schedule.sheetUrl);
  if (!sheet) throw new Error("The schedule's sheet link is invalid.");

  const emails = await listUninvitedEmails(sheet);
  const context = await createSendContext({
    sheet,
    invitation: schedule.invitation,
    imageKey: schedule.imageKey,
    baseUrl: schedule.baseUrl,
    test: false,
  });

  let sent = 0;
  let failed = 0;
  let handled = 0;

  for (const group of chunk(emails, SEND_CONCURRENCY)) {
    if (Date.now() >= stopAt) break;

    const { delivered } = await sendInvitationGroup(
      context,
      group,
      `invitation-schedule-${schedule.id}`,
    );

    await tickInviteSent(context, delivered);
    sent += delivered.length;
    failed += group.length - delivered.length;
    handled += group.length;
  }

  return {
    id: schedule.id,
    title: schedule.invitation.title,
    sent,
    failed,
    remaining: emails.length - handled,
    status: schedule.status,
  };
};

/** Runs every due schedule until `stopAt`; work left over waits for the next run. */
export const runScheduledInvitations = async (stopAt: number) => {
  const today = todayInMailerZone();
  const schedules = (await listSchedules()).filter((schedule) =>
    isDue(schedule, today),
  );
  const summaries: ScheduleRunSummary[] = [];

  for (const schedule of schedules) {
    if (Date.now() >= stopAt) break;

    let summary: ScheduleRunSummary;
    let lastError: string | undefined;
    try {
      summary = await runSchedule(schedule, stopAt);
    } catch (error) {
      console.error(`Scheduled invitation ${schedule.id} failed:`, error);
      lastError = error instanceof Error ? error.message : "The run failed.";
      summary = {
        id: schedule.id,
        title: schedule.invitation.title,
        sent: 0,
        failed: 0,
        remaining: 0,
        status: schedule.status,
        error: lastError,
      };
    }

    // Past the auto-invite window with nothing left over, the schedule is finished.
    const finished = today >= schedule.autoInviteUntil && summary.remaining === 0 && !lastError;
    const status = finished ? "done" : "active";
    await writeSchedule({
      ...schedule,
      status,
      sentCount: schedule.sentCount + summary.sent,
      lastRunAt: new Date().toISOString(),
      lastError,
    });
    summaries.push({ ...summary, status });
  }

  return summaries;
};
