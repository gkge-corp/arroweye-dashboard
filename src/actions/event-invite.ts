"use server";

import { renderEventInviteEmail } from "@/lib/email/event-invite-template";
import { asArray, asRecord, asString } from "@/lib/email/campaign-report/utils";
import { sendZeptoMail } from "@/lib/email/zeptomail";
import { getAuthorizedEvent } from "@/lib/server/get-authorized-event";
import { getAuthorizedProject } from "@/lib/server/get-authorized-project";
import { readEventDrops } from "@/lib/storage/r2";
import type { SendCampaignReportResult } from "@/types/campaign-report";

interface SendEventInviteInput {
  eventId: number | string;
  timeZone: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getMemberEmails = (project: Record<string, unknown>) => {
  const emails = asArray(project.watchers)
    .map(asRecord)
    .map((watcher) =>
      asString(watcher.email || asRecord(watcher.user_profile).staff_email)
        .trim()
        .toLowerCase(),
    )
    .filter((email) => emailPattern.test(email));

  return [...new Set(emails)];
};

// Drops are a nice-to-have in the email, so a storage failure shouldn't block the invite.
const loadEventDrops = async (eventId: number) => {
  try {
    return await readEventDrops(eventId);
  } catch (error) {
    console.error("Event invite drops could not be loaded:", error);
    return [];
  }
};

const toTimeZone = (value: unknown) => {
  const timeZone = asString(value);
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

/**
 * Recipients come from the campaign's member list on the server, so the
 * action can't be used to mail event details to arbitrary addresses.
 */
export async function sendEventInvite(
  input: SendEventInviteInput,
): Promise<SendCampaignReportResult> {
  const eventId = Number(input?.eventId);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return { success: false, message: "This event was not found." };
  }

  try {
    const event = await getAuthorizedEvent(eventId);
    const campaignId = asString(event.project);
    if (!/^\d+$/.test(campaignId)) {
      return {
        success: false,
        message: "Link this event to a campaign to send invites.",
      };
    }

    const project = await getAuthorizedProject(campaignId);
    const recipients = getMemberEmails(project);
    if (!recipients.length) {
      return { success: false, message: "This campaign has no members yet." };
    }

    const { html, text, subject } = renderEventInviteEmail({
      event,
      project,
      drops: await loadEventDrops(eventId),
      timeZone: toTimeZone(input?.timeZone),
    });
    const sentAt = Date.now();
    const results = await Promise.allSettled(
      recipients.map((recipient) =>
        sendZeptoMail({
          recipient,
          subject,
          html,
          text,
          clientReference: `event-invite-${eventId}-${sentAt}`,
        }),
      ),
    );

    const failed = results.filter((result) => result.status === "rejected");
    failed.forEach((result) =>
      console.error("Event invite email failed:", result.reason),
    );
    if (failed.length === recipients.length) {
      return { success: false, message: "The invites could not be sent." };
    }
    if (failed.length) {
      return {
        success: true,
        message: `Invites sent to ${recipients.length - failed.length} of ${recipients.length} members.`,
      };
    }

    return {
      success: true,
      message: `Invite sent to ${recipients.length} member${recipients.length === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    console.error("Event invite failed:", error);
    return { success: false, message: "The invites could not be sent." };
  }
}
