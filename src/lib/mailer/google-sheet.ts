import "server-only";

import { normalizeTagName } from "@/lib/mailer/html-text";
import type { MailerRecipient } from "@/types/mailer";

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sheetIdPattern = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;

export interface SheetRef {
  sheetId: string;
  gid: string;
}

export const parseSheetUrl = (sheetUrl: string): SheetRef | null => {
  let url: URL;
  try {
    url = new URL(sheetUrl);
  } catch {
    return null;
  }

  const sheetId = url.pathname.match(sheetIdPattern)?.[1];
  if (url.hostname !== "docs.google.com" || !sheetId) return null;

  const gid =
    url.searchParams.get("gid") ?? url.hash.match(/gid=(\d+)/)?.[1] ?? "0";
  return { sheetId, gid };
};

// "INVITE SENT?" and "Invite sent" both become "invitesent".
export const toHeaderKey = (header: string) =>
  header.toLowerCase().replace(/[^a-z0-9]/g, "");

export const INVITE_SENT_HEADER = "invitesent";
export const CONFIRMED_HEADER = "confirmed";

/** An exact "Email" header wins, so a column like "Email invite?" isn't picked first. */
export const findEmailColumn = (headers: string[], rows: string[][]) => {
  const keys = headers.map(toHeaderKey);
  const exact = keys.findIndex((key) => key === "email" || key === "emailaddress");
  if (exact !== -1) return exact;

  const byHeader = keys.findIndex((key) => key.includes("email"));
  if (byHeader !== -1) return byHeader;

  return headers.findIndex((_, index) =>
    rows.some((row) => emailPattern.test(row[index]?.trim() ?? "")),
  );
};

export const toRecipients = (sheetRows: string[][]) => {
  const [headerRow = [], ...rows] = sheetRows;
  const headers = headerRow.map((header) => header.trim());
  const emailColumn = findEmailColumn(headers, rows);
  const inviteSentColumn = headers.map(toHeaderKey).indexOf(INVITE_SENT_HEADER);

  if (emailColumn === -1) return null;

  const seen = new Set<string>();
  const recipients: MailerRecipient[] = [];
  let skipped = 0;
  let alreadyInvited = 0;

  for (const row of rows) {
    const email = row[emailColumn]?.trim().toLowerCase() ?? "";

    if (row[inviteSentColumn]?.trim().toUpperCase() === "TRUE") {
      alreadyInvited += 1;
      continue;
    }

    if (!emailPattern.test(email) || seen.has(email)) {
      skipped += 1;
      continue;
    }

    seen.add(email);
    recipients.push({
      email,
      fields: Object.fromEntries(
        headers.map((header, index) => [
          normalizeTagName(header),
          row[index]?.trim() ?? "",
        ]),
      ),
    });
  }

  return { columns: headers.filter(Boolean), recipients, skipped, alreadyInvited };
};
