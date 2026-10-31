import type { UnknownRecord } from "./types";
import {
  asArray,
  asRecord,
  asString,
  escapeHtml,
  formatDate,
  listBox,
  listItemStyle,
  safeUrl,
  sectionHeading,
  viewAll,
} from "./utils";

const MAX_MILESTONES = 2;
const MAX_PUBLICATIONS = 3;
const MAX_SCHEDULE_EVENTS = 2;
const MAX_DROPS = 3;
const NEW_DROP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const DROP_TILE_COLORS = [
  { background: "#FDEBEC", color: "#B42318" },
  { background: "#EAF2FF", color: "#175CD3" },
  { background: "#EAF8F0", color: "#087443" },
];

const chevron = (link: string) =>
  link
    ? `<a href="${link}" target="_blank" style="display:block;color:#999;text-decoration:none;font-size:24px;line-height:1;">&rsaquo;</a>`
    : "";

export const renderEvents = (events: unknown[], projectLink: string) => {
  if (events.length === 0) return "";
  const shown = events.slice(0, MAX_SCHEDULE_EVENTS);
  const rows = shown
    .map((entry, index) => {
      const event = asRecord(entry);
      const border =
        index < shown.length - 1 ? "border-bottom:1px solid #e9e9e9;" : "";
      return `<tr><td style="font-size:16px;font-weight:500;line-height:2;padding:16px 0;${border}">${escapeHtml(event.title || event.name || "Scheduled event")}</td><td style="font-size:14px;color:#777;text-align:right;padding:16px 0;${border}">${escapeHtml(formatDate(event.start_dte || event.start_date || event.date))}</td></tr>`;
    })
    .join("");

  return `<div style="margin-top:24px;">${sectionHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1758701678/cl_3_de2s9s_hglj9o.png", "Schedule")}${listBox(`<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">${rows}</table>`)}${viewAll(projectLink)}</div>`;
};

export const renderPublications = (media: unknown[], projectLink: string) => {
  const publications = media
    .map(asRecord)
    .filter((entry) => asString(entry.type).toLowerCase() === "editorial");
  if (publications.length === 0) return "";

  const shown = publications.slice(0, MAX_PUBLICATIONS);
  const rows = shown
    .map((publication, index) => {
      const link = safeUrl(
        publication.editorial_link || publication.source_link,
      );
      const title = escapeHtml(
        publication.publication || publication.title || "Publication",
      );
      const heading = link
        ? `<a href="${link}" target="_blank" style="color:#000;text-decoration:none;">${title}</a>`
        : title;
      const channel = escapeHtml(asString(publication.channel).trim());
      const date = escapeHtml(formatDate(publication.created));
      const meta = channel
        ? `${channel}${date ? ` <span style="color:#999;font-weight:500;">&middot; ${date}</span>` : ""}`
        : date;

      return `<div style="${listItemStyle(index === shown.length - 1)}"><div style="font-size:16px;font-weight:500;line-height:1.5;">${heading}</div>${meta ? `<div style="font-size:12px;color:#555;font-weight:500;margin-top:6px;">${meta}</div>` : ""}</div>`;
    })
    .join("");

  return `<div style="margin-top:24px;">${sectionHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1758701680/clt_sppodt_sdlomh.png", "Publications")}${listBox(rows)}${viewAll(projectLink)}</div>`;
};

const isNewDrop = (value: unknown) => {
  const created = new Date(asString(value)).getTime();
  return Number.isFinite(created) && Date.now() - created < NEW_DROP_WINDOW_MS;
};

export const renderDrops = (value: unknown, projectLink: string) => {
  const drops = asArray(value).map(asRecord);
  if (drops.length === 0) return "";

  const shown = drops.slice(0, MAX_DROPS);
  const rows = shown
    .map((drop, index) => {
      const link = safeUrl(drop.link || drop.url || drop.download_link);
      const tile = DROP_TILE_COLORS[index % DROP_TILE_COLORS.length];
      const created = drop.created || drop.uploaded_at;
      const title = escapeHtml(
        drop.folder_name || drop.title || drop.drop_type || "Untitled drop",
      );
      const badge = isNewDrop(created)
        ? ' <span style="display:inline-block;margin-left:8px;padding:3px 8px;border-radius:999px;background:#EAF2FF;color:#175CD3;font-size:10px;font-weight:bold;line-height:1.2;vertical-align:2px;">NEW</span>'
        : "";
      const tileHtml = `<div style="width:30px;height:30px;line-height:30px;text-align:center;background:${tile.background};border-radius:7px;font-family:Arial,sans-serif;font-size:9px;font-weight:bold;color:${tile.color};">FILE</div>`;
      const body = `<div style="font-size:15px;font-weight:bold;line-height:1.5;color:#000;">${title}${badge}</div><div style="font-size:12px;color:#777;font-weight:500;margin-top:3px;">Uploaded ${escapeHtml(formatDate(created, "recently"))}</div>`;
      const wrap = (content: string) =>
        link
          ? `<a href="${link}" target="_blank" style="display:block;text-decoration:none;color:#000;">${content}</a>`
          : content;
      const border =
        index < shown.length - 1 ? "border-bottom:1px solid #e9e9e9;" : "";

      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;${border}"><tr><td valign="top" width="42" style="width:42px;padding:16px 10px 16px 0;">${wrap(tileHtml)}</td><td valign="top" style="padding:16px 0;">${wrap(body)}</td><td valign="middle" width="24" style="width:24px;text-align:right;padding:16px 0 16px 8px;color:#999;font-size:24px;font-weight:normal;line-height:1;">${chevron(link)}</td></tr></table>`;
    })
    .join("");

  return `<div style="margin-top:24px;">${sectionHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1773506545/Untitled_19_icibsj.png", "Drops")}${listBox(rows)}${viewAll(projectLink)}</div>`;
};

export const renderMilestones = (
  project: UnknownRecord,
  projectLink: string,
) => {
  const directMilestones = asArray(project.milestones);
  const notifications = asArray(project.notifications)
    .map(asRecord)
    .filter((entry) =>
      asString(entry.type).toLowerCase().includes("milestone"),
    );
  const milestones = (
    directMilestones.length ? directMilestones : notifications
  )
    .map(asRecord)
    .filter((entry) =>
      asString(entry.title || entry.name || entry.content).trim(),
    );
  if (milestones.length === 0) return "";

  const shown = milestones.slice(0, MAX_MILESTONES);
  const rows = shown
    .map((milestone, index) => {
      const spacing = listItemStyle(index === shown.length - 1);
      const date = formatDate(
        milestone.date || milestone.achieved_at || milestone.created,
        "",
      );

      return `<div style="${spacing}"><div style="font-size:16px;font-weight:500;line-height:1.5;">${escapeHtml(milestone.title || milestone.name || milestone.content)}</div>${date ? `<div style="font-size:12px;color:#555;font-weight:500;margin-top:6px;">${escapeHtml(date)}</div>` : ""}</div>`;
    })
    .join("");

  return `<div style="margin-top:24px;">${sectionHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1773468739/thy_aaj9oz_js7hqx.png", "Milestones")}${listBox(rows)}${viewAll(projectLink)}</div>`;
};
