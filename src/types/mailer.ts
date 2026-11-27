export interface MailerRecipient {
  email: string;
  fields: Record<string, string>;
}

export type LoadSheetResult =
  | {
      success: true;
      columns: string[];
      recipients: MailerRecipient[];
      skipped: number;
      /** Rows whose "Invite sent?" box is already ticked. */
      alreadyInvited: number;
    }
  | { success: false; message: string };

export interface InvitationFields {
  tagline: string;
  title: string;
  /** yyyy-mm-dd */
  date: string;
  /** HH:mm */
  startTime: string;
  endTime: string;
  location: string;
  respondBy: string;
  heading: string;
  message: string;
}

export type MailerImageUploadResult =
  | { success: true; uploadUrl: string; contentType: string; key: string }
  | { success: false; message: string };

export interface MailerSendFailure {
  email: string;
  message: string;
}

export type SendMailerBatchResult =
  | {
      success: true;
      sent: number;
      failed: MailerSendFailure[];
      /** False when invitations went out but "Invite sent?" couldn't be ticked. */
      sheetUpdated: boolean;
    }
  | { success: false; message: string };

export type ScheduledInvitationStatus =
  | "scheduled"
  | "active"
  | "done"
  | "cancelled"
  | "sent";

/**
 * A saved invitation. Scheduled ones are sent by the daily cron, which keeps
 * inviting new sheet rows; "sent" ones went out with Send now and are kept as history.
 */
export interface ScheduledInvitation {
  id: string;
  createdAt: string;
  createdBy: string;
  sheetUrl: string;
  invitation: InvitationFields;
  imageKey?: string;
  /** Origin the RSVP links point at, captured when scheduled. */
  baseUrl: string;
  /** yyyy-mm-dd, Lagos time: first day the cron sends. */
  sendOn: string;
  /** yyyy-mm-dd, Lagos time: last day new sheet rows are invited. */
  autoInviteUntil: string;
  status: ScheduledInvitationStatus;
  sentCount: number;
  lastRunAt?: string;
  lastError?: string;
}

export type ScheduleActionResult =
  | { success: true; schedule: ScheduledInvitation }
  | { success: false; message: string };
