"use client";

import { mdiPencilOutline } from "@mdi/js";
import Icon from "@mdi/react";
import { useState } from "react";

import { useAuth } from "@/context/auth-session";
import { useMailer } from "@/hooks/use-mailer";

import {
  MailerComposeWindow,
  type ComposeWindowMode,
} from "./mailer-compose-window";

export function MailerComposeLauncher() {
  const { isAdvertiser } = useAuth();
  const mailer = useMailer();
  const [mode, setMode] = useState<ComposeWindowMode | null>(null);

  if (isAdvertiser) return null;

  if (!mode) {
    return (
      <button
        type="button"
        onClick={() => setMode("open")}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-3 rounded-2xl bg-blue-100 px-5 py-4 text-sm font-medium text-blue-950 shadow-lg transition-[transform,box-shadow] hover:shadow-xl active:scale-[0.97] dark:bg-blue-950 dark:text-blue-100"
      >
        <Icon path={mdiPencilOutline} className="size-5" />
        Compose
      </button>
    );
  }

  return (
    <MailerComposeWindow
      mailer={mailer}
      mode={mode}
      onModeChange={setMode}
      onClose={() => setMode(null)}
    />
  );
}
