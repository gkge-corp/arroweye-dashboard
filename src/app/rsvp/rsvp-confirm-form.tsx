"use client";

import { useActionState } from "react";

import { submitRsvp, type RsvpFormState } from "@/actions/rsvp";
import { cn } from "@/lib/utils";

const initialState: RsvpFormState = { status: "idle", message: "" };

const COPY = {
  accept: { prompt: "Confirm that you'll be attending.", button: "Confirm attendance" },
  decline: { prompt: "Confirm that you can't make it.", button: "Confirm decline" },
};

export function RsvpConfirmForm({
  token,
  answer,
}: {
  token: string;
  answer: "accept" | "decline";
}) {
  const [state, formAction, isPending] = useActionState(submitRsvp, initialState);

  if (state.status === "done") {
    return <p className="mt-6 text-sm text-[#77776f]">{state.message}</p>;
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col items-center gap-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="answer" value={answer} />
      <p className="text-sm text-[#77776f]">{COPY[answer].prompt}</p>
      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "border px-6 py-3.5 text-[10px] font-bold uppercase tracking-[1.4px] transition-opacity disabled:opacity-60",
          answer === "accept"
            ? "border-[#202820] bg-[#202820] text-[#fffefa]"
            : "border-[#c9bea9] bg-[#fffefa] text-[#5e594e]",
        )}
      >
        {isPending ? "Saving…" : COPY[answer].button}
      </button>
      {state.status === "error" && (
        <p className="text-sm text-red-700">{state.message}</p>
      )}
    </form>
  );
}
