import "server-only";

import type { EventDrop } from "@/types/event-drops";

import { asRecord, asString, escapeHtml, safeUrl } from "./campaign-report/utils";

interface EventInviteTemplateInput {
  event: Record<string, unknown>;
  project: Record<string, unknown>;
  drops: EventDrop[];
  timeZone: string;
}

const SCHEDULE_LINK = "https://studio.arroweye.pro/schedule";
const SUPPORT_EMAIL = "home@arroweye.pro";

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmed", color: "#2f8f46" },
  tentative: { label: "Tentative", color: "#f59e0b" },
  cancelled: { label: "Cancelled", color: "#d92d20" },
};

const TIPS = [
  {
    title: "🚗 Arrive early",
    body: "Give yourself enough time to check in and settle before the event starts.",
  },
  {
    title: "🌧️ Check weather &amp; traffic",
    body: "Check conditions ahead of time to help avoid delays.",
  },
  {
    title: "📋 Review the call sheet",
    body: "Review the call sheet in advance to know the key contacts and their roles.",
  },
];

const toDate = (value: unknown) => {
  const date = new Date(asString(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatEventDate = (value: unknown, timeZone: string) => {
  const date = toDate(value);
  if (!date) return "";

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone,
  }).format(date);
};

const formatEventTime = (value: unknown, timeZone: string) => {
  const date = toDate(value);
  if (!date) return "";

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(date);
};

// Google Calendar expects UTC timestamps like 20261018T100000Z.
const toCalendarStamp = (date: Date) =>
  date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const buildCalendarLink = (event: Record<string, unknown>, title: string) => {
  const start = toDate(event.start_dte);
  if (!start) return "";
  const end = toDate(event.end_dte) ?? start;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toCalendarStamp(start)}/${toCalendarStamp(end)}`,
    details: asString(event.location),
  });
  return safeUrl(`https://calendar.google.com/calendar/render?${params}`);
};

const buildRescheduleMailto = (lines: string[]) => {
  const subject = "Request to Reschedule Event";
  const body = [
    "Hello,",
    "",
    "I’d like to request a reschedule for my upcoming event.",
    "",
    ...lines,
    "",
    "Please let me know the available alternative dates and times.",
    "",
    "Thank you.",
  ].join("\n");

  return escapeHtml(
    `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  );
};

const renderSectionLabel = (label: string) =>
  `<div style="font-family:Avenir, 'DM Sans', Futura, Helvetica, Arial, sans-serif; font-size:12px; font-weight:bold; line-height:18px; letter-spacing:.08em; text-transform:uppercase; color:#777; margin-bottom:16px;">${label}</div>`;

const renderField = (label: string, valueHtml: string) =>
  `<div style="font-size:12px; line-height:18px; font-weight:bold; color:#777; margin-bottom:4px;">${label}</div><div style="font-size:15px; line-height:21px; font-weight:bold; color:#111; white-space:pre-line;">${valueHtml}</div>`;

const renderFullRow = (label: string, valueHtml: string) =>
  `<tr><td colspan="2" valign="top" style="padding:12px 0; border-top:1px solid #e5e5e5;">${renderField(label, valueHtml)}</td></tr>`;

const renderPairRow = (
  left: [string, string],
  right: [string, string],
  isFirst = false,
) => {
  const borderTop = isFirst ? "" : "border-top:1px solid #e5e5e5;";

  return `<tr><td valign="top" width="50%" style="width:50%; padding:12px 18px 12px 0; ${borderTop} border-right:1px solid #e5e5e5;">${renderField(...left)}</td><td valign="top" width="50%" style="width:50%; padding:12px 0 12px 18px; ${borderTop}">${renderField(...right)}</td></tr>`;
};

const renderStatus = (status: unknown) => {
  const style = STATUS_STYLES[asString(status)];
  if (!style) return "";

  return renderFullRow(
    "EVENT STATUS",
    `<span style="display:inline-block; width:8px; height:8px; background:${style.color}; border-radius:50%; vertical-align:middle; margin:0 7px 1px 0;"></span>${style.label}`,
  );
};

const renderDrop = (drop: EventDrop) => {
  const link = safeUrl(drop.link);
  const subtitle = drop.type
    ? `<div style="font-size:12px;line-height:18px;color:#888;margin-top:2px;">${escapeHtml(drop.type)}</div>`
    : "";
  const content = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td valign="middle" width="42" style="width:42px;"><div style="width:30px;height:30px;line-height:30px;text-align:center;background:#EAF2FF;border-radius:7px;font-family:Arial,sans-serif;font-size:10px;font-weight:bold;color:#175CD3;">FILE</div></td><td valign="middle" style="padding-left:12px;"><div style="font-size:14px;line-height:20px;font-weight:bold;color:#111;">${escapeHtml(drop.name)}</div>${subtitle}</td><td valign="middle" width="24" style="width:24px;text-align:right;"><div style="font-size:18px;line-height:20px;color:#999;">›</div></td></tr></table>`;
  const style =
    "display:block;text-decoration:none;color:#111;border-bottom:1px solid #e5e5e5;padding:16px 0;";

  return link
    ? `<a href="${link}" target="_blank" style="${style}">${content}</a>`
    : `<div style="${style}">${content}</div>`;
};

const renderDrops = (drops: EventDrop[]) => {
  if (!drops.length) return "";

  return `<div style="margin-top:36px;">${renderSectionLabel("Drops")}<div style="border-top:1px solid #e5e5e5;">${drops.map(renderDrop).join("")}</div></div><div style="text-align:right;margin-top:14px;"><a href="${SCHEDULE_LINK}" target="_blank" style="display:inline-block;font-size:14px;font-weight:bold;color:#147aff;border:1px solid #147aff;padding:8px 20px;text-decoration:none;border-radius:20px;">View all</a></div>`;
};

const renderTip = (
  { title, body }: { title: string; body: string },
  index: number,
  isLast: boolean,
) => {
  const border = isLast ? "" : " border-bottom:1px solid #e5e5e5;";
  const number = String(index + 1).padStart(2, "0");

  return `<div style="padding:16px 0;${border}"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td valign="top" width="38" style="padding-right:12px;"><div style="font-size:12px; line-height:18px; font-weight:bold; color:#999;">${number}</div></td><td valign="top"><div style="font-size:15px; line-height:21px; font-weight:bold; color:#111;">${title}</div><div style="font-size:13px; line-height:20px; color:#666; margin-top:4px;">${body}</div></td></tr></table></div>`;
};

const renderTips = (rescheduleMailto: string) => {
  const tips = [
    ...TIPS,
    {
      title: "🔄 Need to reschedule?",
      body: `If your plans change, email <a href="${rescheduleMailto}" style="color:#111; font-weight:bold; text-decoration:underline;">${SUPPORT_EMAIL}</a> and we’ll help reschedule the event for you.`,
    },
  ];

  return `<div style="margin-top:44px;">${renderSectionLabel("Before you go")}<div style="border-top:1px solid #e5e5e5;">${tips.map((tip, index) => renderTip(tip, index, index === tips.length - 1)).join("")}</div></div>`;
};

const renderButton = (href: string, label: string, background: string) =>
  `<a href="${href}" target="_blank" style="display:inline-block; min-width:200px; box-sizing:border-box; text-align:center; background:${background}; color:#fff; text-decoration:none; font-size:15px; line-height:20px; font-weight:bold; padding:14px 24px; border-radius:24px;">${label}</a>`;

export function renderEventInviteEmail({
  event,
  project,
  drops,
  timeZone,
}: EventInviteTemplateInput) {
  const eventTitle = asString(event.title || "Event");
  const projectName = asString(
    project.title || project.song_title || "Campaign",
  );
  const artist = asString(project.artist_name || project.song_artist);
  const description = asString(event.description);
  const location = asString(event.location);
  const date = formatEventDate(event.start_dte, timeZone);
  const startTime = formatEventTime(event.start_dte, timeZone);
  const endTime = formatEventTime(event.end_dte, timeZone);
  const time = endTime ? `${startTime} – ${endTime}` : startTime;
  const calendarLink = buildCalendarLink(
    event,
    `${eventTitle} — ${projectName}`,
  );

  const summaryLines = [
    `Event: ${eventTitle} — ${projectName}`,
    `Date: ${date}`,
    `Time: ${time}`,
    `Location: ${location}`,
  ];
  const orDash = (value: string) => escapeHtml(value.trim() || "—");
  const subvendor = asRecord(project.subvendor);
  const preheader = [projectName, asString(subvendor.organization_name)]
    .filter(Boolean)
    .join(" · ");

  const detailRows = [
    renderPairRow(
      ["EVENT NAME", escapeHtml(eventTitle)],
      ["CAMPAIGN / PROJECT TITLE", escapeHtml(projectName)],
      true,
    ),
    renderFullRow("ARTIST NAME", orDash(artist)),
    renderFullRow("EVENT DESCRIPTION", orDash(description)),
    renderPairRow(["DATE", orDash(date)], ["TIME", orDash(time)]),
    renderFullRow("LOCATION", orDash(location)),
    renderStatus(event.status),
  ].join("");

  const calendarButton = calendarLink
    ? `<tr><td align="center" style="padding:0;">${renderButton(calendarLink, "Add to Calendar", "#000")}</td></tr>`
    : "";

  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Event Alert | Arroweye Pro</title></head><body style="background-color:#f9f9f9; font-family: Avenir, 'DM Sans', Futura, Helvetica, Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; color: #333; font-weight:normal;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(eventTitle)} · ${escapeHtml(preheader)}</div><div style="max-width:600px;margin:28px auto;padding:5px 1px 1px;background-color:#ff7400;background-image:linear-gradient(to right,#ff006d,#ff7f00,#ffff00,#00ff00,#147aff);box-shadow:0 8px 30px rgba(0,0,0,.045);text-align:left;"><div style="padding:22px 20px 40px 20px;background-color:#fff;"><div style="text-align: left; margin-bottom: 30px; padding-bottom:18px; border-bottom:1px solid #eeeeee;"><img src="https://res.cloudinary.com/dyueswnzk/image/upload/v1792488685/showtime_pvn0ln.png" alt="Arroweye" width="170"></div><div style="font-size: 22px; font-weight:bold; color: #333;">🗓️ Upcoming Event</div><p style="font-size: 16px; color: #555; line-height: 1.6;">You have an upcoming event scheduled. Please review the details below and make necessary preparations.</p><div style="margin-top:15px;"><div style="font-family:Avenir, 'DM Sans', Futura, Helvetica, Arial, sans-serif; font-size:12px; font-weight: bold; line-height:18px; letter-spacing:.08em; text-transform:uppercase; color:#777; margin-bottom:10px;">Event details</div><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e5e5e5; border-bottom:1px solid #e5e5e5; border-collapse:collapse;">${detailRows}</table></div>${renderDrops(drops)}${renderTips(buildRescheduleMailto(summaryLines))}<div style="margin-top:36px; border-top:1px solid #e5e5e5; padding-top:28px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center" style="padding:0 0 12px 0;">${renderButton(SCHEDULE_LINK, "View Details", "#7c3aed")}</td></tr>${calendarButton}</table></div></div></div></body></html>`;

  const text = [
    "Upcoming Event",
    ...summaryLines,
    artist ? `Artist: ${artist}` : "",
    description ? `Details: ${description}` : "",
    ...drops.map((drop) =>
      drop.link ? `Drop: ${drop.name} (${drop.link})` : `Drop: ${drop.name}`,
    ),
    `View details: ${SCHEDULE_LINK}`,
    calendarLink ? `Add to calendar: ${calendarLink.replaceAll("&amp;", "&")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text, subject: `Upcoming event: ${eventTitle}` };
}
