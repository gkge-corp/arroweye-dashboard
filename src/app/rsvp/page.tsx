import type { Metadata } from "next";

import {
  isRsvpAnswer,
  isRsvpClosed,
  verifyRsvpToken,
} from "@/lib/mailer/rsvp-token";
import { todayInMailerZone } from "@/lib/mailer/schedule-dates";

import { RsvpConfirmForm } from "./rsvp-confirm-form";

export const metadata: Metadata = {
  title: "RSVP - Arroweye",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const verifyLink = (token: string) => {
  try {
    return verifyRsvpToken(token);
  } catch (error) {
    console.error("RSVP link check failed:", error);
    return null;
  }
};

export default async function RsvpPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; answer?: string }>;
}) {
  const { token = "", answer } = await searchParams;
  const payload = verifyLink(token);
  const isValid = payload !== null && isRsvpAnswer(answer);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#efede7] px-4 py-10 text-[#20231f]">
      <div className="w-full max-w-md border-t-[5px] border-[#b89b68] bg-[#fffefa] px-8 py-10 text-center shadow-sm">
        {isValid ? (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[2.5px] text-[#a18b64]">
              {payload.email}
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">
              {payload.title}
            </h1>
            {isRsvpClosed(payload, todayInMailerZone()) ? (
              <p className="mt-6 text-sm text-[#77776f]">
                This event has passed, so responses are closed.
              </p>
            ) : (
              <RsvpConfirmForm token={token} answer={answer} />
            )}
          </>
        ) : (
          <p className="text-sm text-[#77776f]">
            This RSVP link is invalid or has expired.
          </p>
        )}
      </div>
    </main>
  );
}
