import { DEFAULT_INVITATION } from "@/lib/mailer/invitation-template";
import type { InvitationFields, MailerRecipient } from "@/types/mailer";

const STORAGE_KEY = "arroweye-mailer-draft";

export interface MailerDraft {
  sheetUrl: string;
  importedSheetUrl: string;
  recipients: MailerRecipient[];
  skipped: number;
  alreadyInvited: number;
  invitation: InvitationFields;
}

export const readMailerDraft = (): MailerDraft | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const draft = JSON.parse(raw) as Partial<MailerDraft>;
    return {
      sheetUrl: String(draft.sheetUrl ?? ""),
      importedSheetUrl: String(draft.importedSheetUrl ?? ""),
      recipients: Array.isArray(draft.recipients) ? draft.recipients : [],
      skipped: Number(draft.skipped) || 0,
      alreadyInvited: Number(draft.alreadyInvited) || 0,
      invitation: { ...DEFAULT_INVITATION, ...draft.invitation },
    };
  } catch (error) {
    console.error("Failed to read the mailer draft:", error);
    return null;
  }
};

export const writeMailerDraft = (draft: MailerDraft) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error("Failed to save the mailer draft:", error);
  }
};
