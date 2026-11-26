import "server-only";

import { createSign } from "node:crypto";

import {
  CONFIRMED_HEADER,
  emailPattern,
  findEmailColumn,
  INVITE_SENT_HEADER,
  toHeaderKey,
  type SheetRef,
} from "@/lib/mailer/google-sheet";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_URL = "https://sheets.googleapis.com/v4/spreadsheets";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

export class SheetAccessError extends Error {}
export class GuestNotFoundError extends Error {}

let cachedToken: { value: string; expiresAt: number } | undefined;

const getServiceAccount = () => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  ).trim();
  if (!email || !privateKey) {
    throw new Error("RSVP sheet updates are not configured.");
  }
  return { email, privateKey };
};

export const getServiceAccountEmail = () => getServiceAccount().email;

const toBase64Url = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

const createAssertion = () => {
  const { email, privateKey } = getServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${toBase64Url({ alg: "RS256", typ: "JWT" })}.${toBase64Url({
    iss: email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(privateKey, "base64url");
  return `${unsigned}.${signature}`;
};

const getAccessToken = async () => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: createAssertion(),
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Sheet sign-in failed with status ${response.status}.`);
  }

  const { access_token, expires_in } = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = { value: access_token, expiresAt: Date.now() + expires_in * 1000 };
  return access_token;
};

const sheetsRequest = async <T>(path: string, init: RequestInit = {}) => {
  const response = await fetch(`${SHEETS_URL}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) throw await toSheetsError(response);
  return (await response.json()) as T;
};

interface SheetsErrorBody {
  error?: { status?: string; message?: string; details?: { reason?: string }[] };
}

/** Logs the full error and maps the common setup mistakes to a fixable message. */
const toSheetsError = async (response: Response) => {
  const body = (await response.json().catch(() => ({}))) as SheetsErrorBody;
  const reasons = (body.error?.details ?? []).map((detail) => detail.reason);
  console.error("Sheets request failed:", response.status, JSON.stringify(body));

  if (reasons.includes("SERVICE_DISABLED")) {
    return new SheetAccessError(
      "The Sheets API is not enabled in the service account's project yet.",
    );
  }
  if (body.error?.status === "FAILED_PRECONDITION") {
    return new SheetAccessError(
      "This file is an uploaded Excel file. Open it, use File → Save as Google Sheets, and import that copy.",
    );
  }
  if (response.status === 403 || response.status === 404) {
    return new SheetAccessError(
      `The sheet is not shared with ${getServiceAccountEmail()} as an editor.`,
    );
  }
  return new Error(`Sheet request failed with status ${response.status}.`);
};

const toColumnLetter = (index: number): string => {
  const letter = String.fromCharCode(65 + (index % 26));
  return index < 26 ? letter : `${toColumnLetter(Math.floor(index / 26) - 1)}${letter}`;
};

const quoteTitle = (title: string) => `'${title.replace(/'/g, "''")}'`;

const getTabTitle = async ({ sheetId, gid }: SheetRef) => {
  const { sheets } = await sheetsRequest<{
    sheets: { properties: { sheetId: number; title: string } }[];
  }>(`${sheetId}?fields=sheets.properties(sheetId,title)`);
  const tab = sheets.find((sheet) => String(sheet.properties.sheetId) === gid);
  if (!tab) throw new SheetAccessError("The sheet tab could not be found.");
  return quoteTitle(tab.properties.title);
};

const readRows = async (sheetId: string, tab: string) => {
  const { values = [] } = await sheetsRequest<{ values?: string[][] }>(
    `${sheetId}/values/${encodeURIComponent(tab)}`,
  );
  return values;
};

/** Header row plus every non-blank row of the sheet's tab. */
export const readSheetRows = async (sheet: SheetRef) => {
  const tab = await getTabTitle(sheet);
  const rows = await readRows(sheet.sheetId, tab);
  return rows.filter((row) => row.some((value) => value.trim()));
};

type CellValue = string | boolean;

const writeCells = (
  sheetId: string,
  data: { range: string; values: CellValue[][] }[],
) =>
  sheetsRequest(`${sheetId}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({ valueInputOption: "RAW", data }),
  });

const NOTES_HEADER = "notes";
const DECLINED_NOTE = "Declined";

const isTicked = (value?: string) => value?.trim().toUpperCase() === "TRUE";

/** Reads the guest tab and finds the email and checkbox columns the RSVP flow edits. */
const loadGuestSheet = async (sheet: SheetRef) => {
  const tab = await getTabTitle(sheet);
  const [headers = [], ...rows] = await readRows(sheet.sheetId, tab);
  const keys = headers.map(toHeaderKey);
  const inviteSent = keys.indexOf(INVITE_SENT_HEADER);
  const confirmed = keys.indexOf(CONFIRMED_HEADER);
  const notes = keys.indexOf(NOTES_HEADER);

  if (inviteSent === -1 || confirmed === -1) {
    throw new SheetAccessError(
      "The sheet needs 'Invite sent?' and 'Confirmed' columns in its first row.",
    );
  }

  const emailColumn = findEmailColumn(headers, rows);
  const emailAt = (row: string[]) => row[emailColumn]?.trim().toLowerCase() ?? "";
  // Every row for the email, so a guest listed twice is updated everywhere.
  const findRows = (email: string) =>
    rows.flatMap((row, index) =>
      emailAt(row) === email ? [{ row, sheetRow: index + 2 }] : [],
    );
  const cell = (column: number, sheetRow: number) =>
    `${tab}!${toColumnLetter(column)}${sheetRow}`;

  return { headers, rows, inviteSent, confirmed, notes, emailAt, findRows, cell };
};

/** Checks the columns exist and proves edit access by rewriting one header as-is. */
export const prepareRsvpSheet = async (sheet: SheetRef) => {
  const guests = await loadGuestSheet(sheet);
  await writeCells(sheet.sheetId, [
    {
      range: guests.cell(guests.inviteSent, 1),
      values: [[guests.headers[guests.inviteSent]]],
    },
  ]);
};

/** Valid, unique emails with no "Invite sent?" tick on any of their rows. */
export const listUninvitedEmails = async (sheet: SheetRef) => {
  const guests = await loadGuestSheet(sheet);
  const invited = new Set(
    guests.rows
      .filter((row) => isTicked(row[guests.inviteSent]))
      .map(guests.emailAt),
  );
  const emails = guests.rows
    .map(guests.emailAt)
    .filter((email) => emailPattern.test(email) && !invited.has(email));
  return [...new Set(emails)];
};

/** Ticks "Invite sent?" on every row of each delivered email. */
export const markInvitesSent = async (sheet: SheetRef, emails: string[]) => {
  if (emails.length === 0) return;

  const guests = await loadGuestSheet(sheet);
  const data = emails.flatMap((email) =>
    guests.findRows(email).map(({ sheetRow }) => ({
      range: guests.cell(guests.inviteSent, sheetRow),
      values: [[true]],
    })),
  );
  if (data.length) await writeCells(sheet.sheetId, data);
};

/** Adds "Declined" to the note on decline and removes it on accept, keeping other text. */
const updateDeclinedNote = (note: string, answer: "accept" | "decline") => {
  const withoutDeclined = note
    .split(" · ")
    .filter((part) => part.trim() !== DECLINED_NOTE && part.trim() !== "")
    .join(" · ");
  return answer === "decline"
    ? [withoutDeclined, DECLINED_NOTE].filter(Boolean).join(" · ")
    : withoutDeclined;
};

/**
 * Accept ticks "Confirmed"; decline clears it and notes "Declined" so it differs
 * from no reply. Returns whether the guest was already confirmed.
 */
export const recordRsvp = async (
  sheet: SheetRef,
  email: string,
  answer: "accept" | "decline",
) => {
  const guests = await loadGuestSheet(sheet);
  const matches = guests.findRows(email);
  if (matches.length === 0) throw new GuestNotFoundError(`No sheet row for ${email}.`);

  const data = matches.flatMap(({ row, sheetRow }) => [
    { range: guests.cell(guests.confirmed, sheetRow), values: [[answer === "accept"]] },
    ...(guests.notes === -1
      ? []
      : [
          {
            range: guests.cell(guests.notes, sheetRow),
            values: [[updateDeclinedNote(row[guests.notes] ?? "", answer)]],
          },
        ]),
  ]);
  await writeCells(sheet.sheetId, data);

  const wasConfirmed = matches.some(({ row }) => isTicked(row[guests.confirmed]));
  return { wasConfirmed };
};
