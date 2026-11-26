"use server";

import { sendZeptoMail } from "@/lib/email/zeptomail";
import { GuestNotFoundError, recordRsvp } from "@/lib/mailer/google-sheets-api";
import { renderRsvpThankYouEmail } from "@/lib/mailer/rsvp-email";
import {
  isRsvpAnswer,
  isRsvpClosed,
  verifyRsvpToken,
} from "@/lib/mailer/rsvp-token";
import { todayInMailerZone } from "@/lib/mailer/schedule-dates";

export interface RsvpFormState {
  status: "idle" | "done" | "error";
  message: string;
}

const sendThankYou = async (email: string, title: string) => {
  try {
    await sendZeptoMail({
      recipient: email,
      ...renderRsvpThankYouEmail(title),
      clientReference: `rsvp-thank-you-${Date.now()}`,
    });
  } catch (error) {
    // The answer is already saved; a failed thank-you shouldn't show as a failed RSVP.
    console.error(`RSVP thank-you email to ${email} failed:`, error);
  }
};

/** Public: guests aren't signed in, so the signed token is the only authorization. */
export async function submitRsvp(
  _previous: RsvpFormState,
  formData: FormData,
): Promise<RsvpFormState> {
  const answer = formData.get("answer");
  const payload = verifyRsvpToken(String(formData.get("token") ?? ""));

  if (!payload || !isRsvpAnswer(answer)) {
    return { status: "error", message: "This RSVP link is invalid or has expired." };
  }
  if (isRsvpClosed(payload, todayInMailerZone())) {
    return { status: "error", message: "This event has passed, so responses are closed." };
  }
  if (payload.test) {
    return {
      status: "done",
      message: "This is a test invitation, so nothing was saved.",
    };
  }

  try {
    const { wasConfirmed } = await recordRsvp(payload, payload.email, answer);
    if (answer === "accept" && !wasConfirmed) {
      await sendThankYou(payload.email, payload.title);
    }
  } catch (error) {
    console.error("RSVP could not be recorded:", error);
    if (error instanceof GuestNotFoundError) {
      return {
        status: "error",
        message: "We couldn't find your invitation. Please contact the organiser.",
      };
    }
    return {
      status: "error",
      message: "We couldn't save your response. Please try again later.",
    };
  }

  return {
    status: "done",
    message:
      answer === "accept"
        ? "Thank you! Your attendance is confirmed."
        : "Thanks for letting us know. Your response has been saved.",
  };
}
