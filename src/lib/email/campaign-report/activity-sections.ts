import type { UnknownRecord } from "./types";
import {
  asArray,
  asRecord,
  asString,
  escapeHtml,
  formatDate,
  safeUrl,
  sectionHeading,
  viewAll,
} from "./utils";

const MAX_MILESTONES = 2;
const MAX_PUBLICATIONS = 3;
const MAX_SCHEDULE_EVENTS = 2;
const MAX_DROPS = 3;

export const renderEvents = (events: unknown[], projectLink: string) => {
  if (events.length === 0) return "";
  const rows = events
    .slice(0, MAX_SCHEDULE_EVENTS)
    .map((entry, index) => {
      const event = asRecord(entry);
      const border =
        index < Math.min(events.length, MAX_SCHEDULE_EVENTS) - 1
          ? "border-bottom:1px solid #eee;"
          : "";
      return `<tr><td style="font-size:16px;font-weight:600;line-height:2;padding:15px 0;${border}">${escapeHtml(event.title || event.name || "Scheduled event")}</td><td style="font-size:14px;color:#777;text-align:right;padding:15px 0;${border}">${escapeHtml(formatDate(event.start_dte || event.start_date || event.date))}</td></tr>`;
    })
    .join("");

  return `<div style="margin-top:24px;">${sectionHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1758701678/cl_3_de2s9s_hglj9o.png", "Schedule")}<div style="margin-top:14px;background-color:#f9f9f9;padding:16px;border-radius:7px;border:1px solid #e5e5e5;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">${rows}</table></div>${viewAll(projectLink)}</div>`;
};

export const renderPublications = (media: unknown[], projectLink: string) => {
  const publications = media
    .map(asRecord)
    .filter((entry) => asString(entry.type).toLowerCase() === "editorial");
  if (publications.length === 0) return "";

  const rows = publications
    .slice(0, MAX_PUBLICATIONS)
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
      const channel = asString(publication.channel).trim();
      const date = formatDate(publication.created);
      const meta = [channel, date]
        .filter(Boolean)
        .map(escapeHtml)
        .join(' <span style="color:#999;font-weight:500;">&middot;</span> ');
      const spacing =
        index < Math.min(publications.length, MAX_PUBLICATIONS) - 1
          ? "padding-bottom:20px;margin-bottom:20px;border-bottom:1px solid #eee;"
          : "";

      return `<div style="${spacing}"><div style="font-size:16px;font-weight:600;line-height:1.5;">${heading}</div>${meta ? `<div style="font-size:12px;color:#555;font-weight:600;margin-top:6px;">${meta}</div>` : ""}</div>`;
    })
    .join("");

  return `<div style="margin-top:24px;">${sectionHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1758701680/clt_sppodt_sdlomh.png", "Publications")}<div style="margin-top:14px;background-color:#f9f9f9;padding:16px;border-radius:7px;border:1px solid #e5e5e5;">${rows}</div>${viewAll(projectLink)}</div>`;
};

export const renderDrops = (value: unknown, projectLink: string) => {
  const drops = asArray(value).map(asRecord);
  if (drops.length === 0) return "";

  const rows = drops
    .slice(0, MAX_DROPS)
    .map((drop, index) => {
      const link = safeUrl(drop.link || drop.url || drop.download_link);
      const title = escapeHtml(
        drop.folder_name || drop.title || drop.drop_type || "Untitled drop",
      );
      const heading = link
        ? `<a href="${link}" target="_blank" style="color:#000;text-decoration:none;">${title}</a>`
        : title;
      const spacing =
        index < Math.min(drops.length, MAX_DROPS) - 1
          ? "margin-bottom:25px;"
          : "";

      return `<div style="${spacing}"><div style="font-size:16px;font-weight:600;line-height:2;">${heading}</div><div style="font-size:13px;color:#777;font-weight:500;">Uploaded ${escapeHtml(formatDate(drop.created || drop.uploaded_at, "recently"))}${link ? ` &bull; <a href="${link}" style="color:#ff7400;text-decoration:none;font-weight:600;">Download</a>` : ""}</div></div>`;
    })
    .join("");

  return `<div style="margin-top:24px;">${sectionHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1773506545/Untitled_19_icibsj.png", "Drops")}<div style="margin-top:14px;background-color:#f9f9f9;padding:16px;border-radius:7px;border:1px solid #e5e5e5;">${rows}</div>${viewAll(projectLink)}</div>`;
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

  const rows = milestones
    .slice(0, MAX_MILESTONES)
    .map((milestone, index) => {
      const spacing =
        index < Math.min(milestones.length, MAX_MILESTONES) - 1
          ? "padding-bottom:20px;margin-bottom:20px;border-bottom:1px solid #eee;"
          : "";
      const date = formatDate(
        milestone.date || milestone.achieved_at || milestone.created,
        "",
      );

      return `<div style="${spacing}"><div style="font-size:16px;font-weight:600;line-height:1.5;">${escapeHtml(milestone.title || milestone.name || milestone.content)}</div>${date ? `<div style="font-size:12px;color:#555;font-weight:500;margin-top:6px;">${escapeHtml(date)}</div>` : ""}</div>`;
    })
    .join("");

  return `<div style="margin-top:24px;">${sectionHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1773468739/thy_aaj9oz_js7hqx.png", "Milestones")}<div style="margin-top:14px;background-color:#f9f9f9;padding:16px;border-radius:7px;border:1px solid #e5e5e5;">${rows}</div>${viewAll(projectLink)}</div>`;
};
