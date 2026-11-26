import { format, isValid, parse, parseISO } from "date-fns";

import { escapeHtml } from "@/lib/mailer/html-text";
import type { InvitationFields } from "@/types/mailer";

const FONT = "Avenir,'DM Sans',Futura,Helvetica,Arial,sans-serif";
const SCRIPT_FONT = "'Snell Roundhand','Apple Chancery','Segoe Script',cursive";
const FOOTER_LOGO =
  "https://res.cloudinary.com/dyueswnzk/image/upload/v1792488685/showtime_pvn0ln.png";

export const DEFAULT_INVITATION: InvitationFields = {
  tagline: "You are cordially invited",
  title: "",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  respondBy: "",
  heading: "Will you be joining us?",
  message: "Please confirm your attendance below.",
};

export interface InvitationLinks {
  accept: string;
  decline: string;
}

interface RenderInvitationInput {
  fields: InvitationFields;
  links: InvitationLinks;
  /** `cid:` reference when sending, a local preview URL in the compose window. */
  imageSrc?: string;
}

export const formatInvitationDate = (value: string) => {
  const date = parseISO(value);
  return isValid(date) ? format(date, "EEEE, MMMM d, yyyy") : "";
};

/** "October 15, 2026": the deadline line drops the weekday. */
const formatRespondBy = (value: string) =>
  formatInvitationDate(value).replace(/^\w+, /, "");

const formatTime = (value: string) => {
  const time = parse(value, "HH:mm", new Date());
  return isValid(time) ? format(time, "h:mm a") : "";
};

export const formatInvitationTime = ({ startTime, endTime }: InvitationFields) =>
  [formatTime(startTime), formatTime(endTime)].filter(Boolean).join(" – ");

export const getInvitationSubject = ({ title }: InvitationFields) =>
  `You're invited: ${title.trim()}`;

/** Returns a message for the first missing required field, or null. */
export const validateInvitation = (fields: InvitationFields) => {
  if (!fields.title.trim()) return "Add the event title.";
  if (!formatInvitationDate(fields.date)) return "Add the event date.";
  if (!fields.location.trim()) return "Add the event location.";
  return null;
};

const text = (value: string) => escapeHtml(value.trim());

const heroHtml = (fields: InvitationFields) => {
  const time = formatInvitationTime(fields);

  return `<tr><td style="background:#fffefa"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#202820"><tr><td align="center" style="padding:42px 34px 39px;border:1px solid #b89b68">
${fields.tagline.trim() ? `<div style="font-family:${SCRIPT_FONT};font-size:30px;line-height:38px;color:#d2bd94">${text(fields.tagline)}</div>` : ""}
<div style="font-family:${FONT};font-size:40px;line-height:47px;font-weight:700;letter-spacing:-1.1px;color:#fffefa;padding:19px 0 16px">${text(fields.title)}</div>
<table role="presentation" width="48" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td height="1" style="height:1px;line-height:1px;background:#b89b68;font-size:1px">&nbsp;</td></tr></table>
<div style="font-family:${FONT};font-size:10px;line-height:16px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#d2bd94;padding-top:24px">${escapeHtml(formatInvitationDate(fields.date))}</div>
<div style="font-family:${FONT};font-size:10px;line-height:16px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#fffefa;padding-top:12px">${text(fields.location)}</div>
${time ? `<div style="font-family:${FONT};font-size:12px;line-height:19px;color:#e6dfd2;padding-top:4px">${escapeHtml(time)}</div>` : ""}
</td></tr></table></td></tr>`;
};

const imageHtml = (src: string, title: string) =>
  `<tr><td align="center" bgcolor="#fffefa" style="padding:0;line-height:0"><img src="${escapeHtml(src)}" width="600" alt="${text(title)}" border="0" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>`;

const button = (href: string, label: string, primary: boolean) =>
  `<td align="center" style="border:1px solid ${primary ? "#202820" : "#c9bea9"};background:${primary ? "#202820" : "#fffefa"}"><a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 25px;font-family:${FONT};font-size:10px;line-height:15px;letter-spacing:1.4px;text-transform:uppercase;font-weight:700;color:${primary ? "#fffefa" : "#5e594e"};text-decoration:none">${label}</a></td>`;

const rsvpHtml = (fields: InvitationFields, links: InvitationLinks) => {
  const respondBy = formatRespondBy(fields.respondBy);

  return `<tr><td align="center" style="padding:38px 48px;background:#fffefa">
${respondBy ? `<div style="font-family:${FONT};font-size:9px;line-height:14px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;color:#a18b64;padding-bottom:12px">Kindly respond by ${escapeHtml(respondBy)}</div>` : ""}
${fields.heading.trim() ? `<div style="font-family:${FONT};font-size:24px;line-height:31px;font-weight:700;letter-spacing:-.3px;color:#242923">${text(fields.heading)}</div>` : ""}
${fields.message.trim() ? `<div style="font-family:${FONT};font-size:13px;line-height:21px;color:#77776f;padding:10px 0 0">${text(fields.message).replace(/\n/g, "<br>")}</div>` : ""}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:23px"><tr>${button(links.accept, "Accept", true)}<td width="10" style="width:10px;font-size:1px;line-height:1px">&nbsp;</td>${button(links.decline, "Decline", false)}</tr></table>
</td></tr>`;
};

const footerHtml = () =>
  `<tr><td align="center" style="padding:24px 24px 27px;border-top:1px solid #e9e4d9;background:#fffefa"><div style="font-family:${FONT};font-size:9px;line-height:14px;letter-spacing:2px;text-transform:uppercase;color:#928a7d;padding-bottom:10px">Invitation managed by</div><img src="${FOOTER_LOGO}" width="150" alt="Showtime" style="display:block;width:150px;max-width:100%;height:auto;margin:0 auto"></td></tr>`;

export const renderInvitationHtml = ({
  fields,
  links,
  imageSrc,
}: RenderInvitationInput) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><title>${text(fields.title)}</title></head>
<body style="margin:0;padding:0;background:#efede7;font-family:${FONT};color:#20231f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#efede7"><tr><td align="center" style="padding:42px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#fffefa">
<tr><td height="5" style="height:5px;line-height:5px;background:#b89b68;font-size:1px">&nbsp;</td></tr>
${heroHtml(fields)}
${imageSrc ? imageHtml(imageSrc, fields.title) : ""}
${rsvpHtml(fields, links)}
${footerHtml()}
<tr><td height="3" style="height:3px;line-height:3px;background:#b89b68;font-size:1px">&nbsp;</td></tr>
</table></td></tr></table></body></html>`;

export const renderInvitationText = (
  fields: InvitationFields,
  links: InvitationLinks,
) =>
  [
    fields.tagline.trim(),
    fields.title.trim(),
    formatInvitationDate(fields.date),
    fields.location.trim(),
    formatInvitationTime(fields),
    "",
    formatRespondBy(fields.respondBy)
      ? `Kindly respond by ${formatRespondBy(fields.respondBy)}`
      : undefined,
    fields.heading.trim(),
    fields.message.trim(),
    "",
    `Accept: ${links.accept}`,
    `Decline: ${links.decline}`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
