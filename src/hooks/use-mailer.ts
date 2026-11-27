"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  loadSheetRecipients,
  prepareRsvp,
  sendMailerBatch,
} from "@/actions/mailer";
import {
  getInvitationImageUrl,
  recordSentInvitation,
  scheduleInvitation,
} from "@/actions/mailer-schedule";
import { SCHEDULED_INVITATIONS_KEY } from "@/hooks/use-scheduled-invitations";
import { useAuth } from "@/context/auth-session";
import { type InvitationEventFields } from "@/hooks/use-invitation-events";
import { useInvitationImage } from "@/hooks/use-invitation-image";
import {
  DEFAULT_INVITATION,
  validateInvitation,
} from "@/lib/mailer/invitation-template";
import { MAILER_BATCH_SIZE } from "@/lib/mailer/limits";
import {
  readMailerDraft,
  writeMailerDraft,
} from "@/lib/mailer/mailer-draft-storage";
import type {
  InvitationFields,
  MailerRecipient,
  MailerSendFailure,
  ScheduledInvitation,
} from "@/types/mailer";

export interface MailerProgress {
  total: number;
  sent: number;
  failed: MailerSendFailure[];
  done: boolean;
}

const toBatches = (recipients: MailerRecipient[]) =>
  Array.from(
    { length: Math.ceil(recipients.length / MAILER_BATCH_SIZE) },
    (_, index) =>
      recipients.slice(
        index * MAILER_BATCH_SIZE,
        (index + 1) * MAILER_BATCH_SIZE,
      ),
  );

const markBatchFailed = (batch: MailerRecipient[], message: string) =>
  batch.map(({ email }) => ({ email, message }));

export const useMailer = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sheetUrl, setSheetUrl] = useState("");
  const [importedSheetUrl, setImportedSheetUrl] = useState("");
  const [recipients, setRecipients] = useState<MailerRecipient[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [alreadyInvited, setAlreadyInvited] = useState(0);
  const [invitation, setInvitation] =
    useState<InvitationFields>(DEFAULT_INVITATION);
  const [isImporting, setIsImporting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [progress, setProgress] = useState<MailerProgress | null>(null);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  /** Title of the saved invitation loaded into the composer, if any. */
  const [openedTitle, setOpenedTitle] = useState<string | null>(null);
  const heroImage = useInvitationImage();

  // Restored after mount: localStorage doesn't exist during the server render.
  useEffect(() => {
    const draft = readMailerDraft();
    if (draft) {
      setSheetUrl(draft.sheetUrl);
      setImportedSheetUrl(draft.importedSheetUrl);
      setRecipients(draft.recipients);
      setSkipped(draft.skipped);
      setAlreadyInvited(draft.alreadyInvited);
      setInvitation(draft.invitation);
    }
    setIsDraftRestored(true);
  }, []);

  useEffect(() => {
    if (!isDraftRestored) return;
    writeMailerDraft({
      sheetUrl,
      importedSheetUrl,
      recipients,
      skipped,
      alreadyInvited,
      invitation,
    });
  }, [
    isDraftRestored,
    sheetUrl,
    importedSheetUrl,
    recipients,
    skipped,
    alreadyInvited,
    invitation,
  ]);

  const isSending = progress !== null && !progress.done;
  const isSendingAll =
    isSending || (isPreparing && !isSendingTest && !isScheduling);
  const invitationError = validateInvitation(invitation);
  const canSend = recipients.length > 0 && invitationError === null;

  const updateInvitation = (field: keyof InvitationFields, value: string) =>
    setInvitation((current) => ({ ...current, [field]: value }));

  /** Event details replace the date fields; tagline, image and message are kept. */
  const fillFromEvent = (fields: InvitationEventFields) =>
    setInvitation((current) => ({ ...current, ...fields }));

  const importSheet = async (url = sheetUrl) => {
    setIsImporting(true);
    const result = await loadSheetRecipients(url);
    setIsImporting(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    setImportedSheetUrl(url);
    setRecipients(result.recipients);
    setSkipped(result.skipped);
    setAlreadyInvited(result.alreadyInvited);
    setProgress(null);
    if (result.recipients.length === 0 && result.alreadyInvited > 0) {
      toast.info("Everyone in this sheet has already been invited.");
    } else {
      toast.success(`Imported ${result.recipients.length} recipients`);
    }
  };

  const clearRecipients = () => {
    setRecipients([]);
    setSkipped(0);
    setAlreadyInvited(0);
    setProgress(null);
    setImportedSheetUrl("");
  };

  const reset = () => {
    clearRecipients();
    setSheetUrl("");
    setInvitation(DEFAULT_INVITATION);
    heroImage.removeImage();
    setOpenedTitle(null);
  };

  /**
   * Checks the sheet can take answers, then uploads the hero image.
   * The image only reaches storage once something is actually being sent.
   */
  const prepareSend = async (): Promise<
    { ready: true; imageKey?: string } | { ready: false }
  > => {
    setIsPreparing(true);
    try {
      const rsvp = await prepareRsvp(importedSheetUrl);
      if (!rsvp.success) {
        toast.error(rsvp.message);
        return { ready: false };
      }
      return { ready: true, imageKey: await heroImage.ensureImageUploaded() };
    } catch (error) {
      console.error("Invitation send preparation failed:", error);
      toast.error(
        error instanceof Error ? error.message : "The image could not be uploaded.",
      );
      return { ready: false };
    } finally {
      setIsPreparing(false);
    }
  };

  const sendBatch = (
    batch: MailerRecipient[],
    test: boolean,
    imageKey?: string,
  ) =>
    sendMailerBatch({
      invitation,
      imageKey,
      recipients: batch,
      sheetUrl: importedSheetUrl,
      test,
    });

  const sendTest = async () => {
    if (!user?.email) return;

    setIsSendingTest(true);
    const prepared = await prepareSend();
    if (!prepared.ready) {
      setIsSendingTest(false);
      return;
    }
    const result = await sendBatch(
      [{ email: user.email, fields: {} }],
      true,
      prepared.imageKey,
    );
    setIsSendingTest(false);

    if (!result.success) toast.error(result.message);
    else if (result.failed.length) toast.error("The test invitation could not be sent.");
    else toast.success(`Test invitation sent to ${user.email}`);
  };

  /** Saves the invitation for the daily cron; the draft is cleared like Gmail's. */
  const scheduleSend = async (sendOn: string) => {
    setIsScheduling(true);
    try {
      const prepared = await prepareSend();
      if (!prepared.ready) return false;

      const result = await scheduleInvitation({
        sheetUrl: importedSheetUrl,
        invitation,
        imageKey: prepared.imageKey,
        sendOn,
      });
      if (!result.success) {
        toast.error(result.message);
        return false;
      }

      void queryClient.invalidateQueries({ queryKey: SCHEDULED_INVITATIONS_KEY });
      toast.success(`Invitation scheduled for ${result.schedule.sendOn}`);
      reset();
      return true;
    } catch (error) {
      console.error("Scheduling the invitation failed:", error);
      toast.error("The invitation could not be scheduled.");
      return false;
    } finally {
      setIsScheduling(false);
    }
  };

  /** Loads a saved invitation back into the composer and re-imports its sheet. */
  const openInvitation = async (saved: ScheduledInvitation) => {
    reset();
    setInvitation({ ...DEFAULT_INVITATION, ...saved.invitation });
    setSheetUrl(saved.sheetUrl);
    setOpenedTitle(saved.invitation.title);

    if (saved.imageKey) {
      try {
        const previewUrl = await getInvitationImageUrl(saved.imageKey);
        if (previewUrl) heroImage.setStoredImage(saved.imageKey, previewUrl);
      } catch (error) {
        console.error("Loading the saved invitation image failed:", error);
        toast.error("The saved image couldn't be loaded. Add it again.");
      }
    }

    await importSheet(saved.sheetUrl);
  };

  const saveSentInvitation = async (sentCount: number, imageKey?: string) => {
    try {
      const result = await recordSentInvitation({
        sheetUrl: importedSheetUrl,
        invitation,
        imageKey,
        sentCount,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: SCHEDULED_INVITATIONS_KEY });
    } catch (error) {
      console.error("Saving the sent invitation failed:", error);
      toast.error("The invitation could not be saved to history.");
    }
  };

  const sendAll = async () => {
    const prepared = await prepareSend();
    if (!prepared.ready) return;

    const total = recipients.length;
    let sent = 0;
    let failed: MailerSendFailure[] = [];
    let sheetUpdated = true;
    setProgress({ total, sent, failed, done: false });

    for (const batch of toBatches(recipients)) {
      try {
        const result = await sendBatch(batch, false, prepared.imageKey);
        if (result.success) {
          sent += result.sent;
          failed = [...failed, ...result.failed];
          sheetUpdated &&= result.sheetUpdated;
        } else {
          failed = [...failed, ...markBatchFailed(batch, result.message)];
        }
      } catch (error) {
        console.error("Invitation batch failed:", error);
        failed = [...failed, ...markBatchFailed(batch, "Could not be delivered.")];
      }
      setProgress({ total, sent, failed, done: false });
    }

    setProgress({ total, sent, failed, done: true });
    if (sent > 0) await saveSentInvitation(sent, prepared.imageKey);
    if (failed.length) toast.error(`${failed.length} invitations failed to send`);
    else toast.success(`Sent ${sent} invitations`);
    if (!sheetUpdated) {
      toast.error("Some 'Invite sent?' boxes couldn't be ticked in the sheet.");
    }
  };

  return {
    sheetUrl,
    setSheetUrl,
    recipients,
    skipped,
    alreadyInvited,
    invitation,
    updateInvitation,
    fillFromEvent,
    invitationError,
    image: heroImage.image,
    pickImage: heroImage.pickImage,
    removeImage: heroImage.removeImage,
    isImporting,
    isSendingTest,
    isSending,
    isSendingAll,
    isPreparing,
    isScheduling,
    scheduleSend,
    canSend,
    progress,
    testEmail: user?.email ?? "",
    importSheet,
    clearRecipients,
    reset,
    openInvitation,
    openedTitle,
    sendTest,
    sendAll,
  };
};
