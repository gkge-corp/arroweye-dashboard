import { timingSafeEqual } from "node:crypto";

import { runScheduledInvitations } from "@/lib/mailer/run-scheduled-invitations";

export const dynamic = "force-dynamic";
// Hobby's ceiling; the run stops starting new sends well before it.
export const maxDuration = 300;

const RUN_BUDGET_MS = 240_000;

const isAuthorized = (request: Request) => {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error("CRON_SECRET is not configured.");
    return false;
  }
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === given.length && timingSafeEqual(expected, given);
};

/** Called daily by Vercel Cron (see vercel.json). */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summaries = await runScheduledInvitations(Date.now() + RUN_BUDGET_MS);
    return Response.json({ ok: true, schedules: summaries });
  } catch (error) {
    console.error("Scheduled invitations run failed:", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
