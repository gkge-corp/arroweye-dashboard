import "server-only";

import type { CampaignReportMetrics } from "@/types/campaign-report";

type UnknownRecord = Record<string, unknown>;

interface CampaignReportTemplateInput {
  project: UnknownRecord;
  metrics: CampaignReportMetrics;
  campaignId: string;
  generatedAt: Date;
}

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? (value as UnknownRecord) : {};

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const asString = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const asNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

const escapeHtml = (value: unknown) =>
  asString(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const safeUrl = (value: unknown) => {
  const url = asString(value).trim();
  if (!url) return "";

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? escapeHtml(parsed.toString())
      : "";
  } catch {
    return "";
  }
};

const formatNumber = (value: unknown) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(asNumber(value));

const formatDate = (value: unknown, fallback = "") => {
  const date = value instanceof Date ? value : new Date(asString(value));
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const total = (stats: Record<string, number>) => asNumber(stats.total_count);

const topEntry = (stats: Record<string, number>) =>
  Object.entries(stats)
    .filter(([key, value]) => key !== "total_count" && asNumber(value) > 0)
    .sort((a, b) => asNumber(b[1]) - asNumber(a[1]))[0]?.[0] ?? "";

const detailRow = (label: string, value: unknown) => {
  const text = asString(value).trim();
  if (!text) return "";
  return `<tr><td style="padding:5px 0;color:#666;font-weight:700;width:140px;">${escapeHtml(label)}</td><td style="padding:5px 0;color:#666;">${escapeHtml(text)}</td></tr>`;
};

const sectionHeading = (icon: string, title: string) =>
  `<div style="font-size:20px;font-weight:900;color:#333;"><img style="width:35px;vertical-align:middle;" src="${icon}" alt=""> ${escapeHtml(title)}</div>`;

const viewAll = (projectLink: string) =>
  `<div style="text-align:right;margin-top:20px;"><a href="${projectLink}" style="display:inline-block;font-size:14px;font-weight:700;color:#147aff;border:1px solid #147aff;padding:8px 20px;text-decoration:none;border-radius:20px;">View all</a></div>`;

const renderEvents = (events: unknown[], projectLink: string) => {
  if (events.length === 0) return "";
  const rows = events
    .slice(0, 12)
    .map((entry, index) => {
      const event = asRecord(entry);
      const border =
        index < events.length - 1 ? "border-bottom:1px solid #eee;" : "";
      return `<tr><td style="font-size:16px;font-weight:600;line-height:2;padding:20px 0;${border}">${escapeHtml(event.title)}</td><td style="font-size:14px;color:#777;text-align:right;padding:20px 0;${border}">${escapeHtml(formatDate(event.start_dte))}</td></tr>`;
    })
    .join("");

  return `<div style="margin-top:30px;">${sectionHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1758701678/cl_3_de2s9s_hglj9o.png", "Schedule")}<div style="margin-top:20px;background-color:#f9f9f9;padding:20px;border-radius:8px;border:1px solid #ddd;"><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table></div>${viewAll(projectLink)}</div>`;
};

const renderPublications = (media: unknown[], projectLink: string) => {
  const publications = media
    .map(asRecord)
    .filter((entry) => asString(entry.type) === "Editorial");
  if (publications.length === 0) return "";

  const rows = publications
    .slice(0, 12)
    .map((publication, index) => {
      const link = safeUrl(publication.editorial_link);
      const title = escapeHtml(
        publication.publication || publication.title || "Publication",
      );
      const heading = link
        ? `<a href="${link}" target="_blank" style="color:#000;text-decoration:none;">${title}</a>`
        : title;
      return `<div style="${index < publications.length - 1 ? "margin-bottom:25px;" : ""}"><div style="font-size:16px;font-weight:600;line-height:2;">${heading}</div>${link ? `<div style="font-size:13px;color:#777;word-break:break-all;">${link}</div>` : ""}</div>`;
    })
    .join("");

  return `<div style="margin-top:30px;">${sectionHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1758701680/clt_sppodt_sdlomh.png", "Publications")}<div style="margin-top:20px;background-color:#f9f9f9;padding:20px;border-radius:8px;border:1px solid #ddd;">${rows}</div>${viewAll(projectLink)}</div>`;
};

const renderDrops = (value: unknown, projectLink: string) => {
  const drops = asArray(value).map(asRecord);
  if (drops.length === 0) return "";

  const rows = drops
    .slice(0, 12)
    .map((drop, index) => {
      const link = safeUrl(drop.link || drop.url);
      const title = escapeHtml(
        drop.folder_name || drop.title || drop.drop_type || "Untitled Drop",
      );
      const heading = link
        ? `<a href="${link}" target="_blank" style="color:#000;text-decoration:none;">${title}</a>`
        : title;
      return `<div style="${index < drops.length - 1 ? "margin-bottom:25px;" : ""}"><div style="font-size:16px;font-weight:600;line-height:2;">${heading}</div><div style="font-size:13px;color:#777;">Uploaded ${escapeHtml(formatDate(drop.created || drop.uploaded_at, "recently"))}${link ? ` &bull; <a href="${link}" style="color:#ff7400;text-decoration:none;font-weight:600;">Download</a>` : ""}</div></div>`;
    })
    .join("");

  return `<div style="margin-top:30px;">${sectionHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1773506545/Untitled_19_icibsj.png", "Drops")}<div style="margin-top:20px;background-color:#f9f9f9;padding:20px;border-radius:8px;border:1px solid #ddd;">${rows}</div>${viewAll(projectLink)}</div>`;
};

export function renderCampaignReportEmail({
  project,
  metrics,
  campaignId,
  generatedAt,
}: CampaignReportTemplateInput) {
  const subvendor = asRecord(project.subvendor);
  const owner = asRecord(subvendor.owner);
  const watchers = asArray(project.watchers).map(asRecord);
  const account =
    asString(owner.email) ||
    asString(project.account) ||
    asString(watchers.find((watcher) => asString(watcher.email))?.email);
  const projectLink = safeUrl(
    `https://studio.arroweye.pro/campaigns/${campaignId}`,
  );
  const projectName = asString(
    project.title || project.song_title || "Campaign",
  );
  const artist = asString(project.artist_name || project.song_artist);
  const airplayCount = total(metrics.airplay);
  const streamCount = total(metrics.streaming);
  const audienceCount = total(metrics.audience);
  const spinCount = asNumber(project.spin_count || metrics.spinCount);
  const topChannel = topEntry(metrics.airplay);
  const topPlatform = topEntry(metrics.streaming);

  const metricCell = (
    label: string,
    value: number,
    topLabel: string,
    topValue: string,
    border = true,
  ) =>
    `<td width="33%" style="padding:18px 10px;${border ? "border-right:1px solid #eee;" : ""}"><div style="font-size:10px;letter-spacing:1px;font-weight:900;text-transform:uppercase;">${label}</div><p style="font-size:21px;font-weight:900;margin:6px 0;">${formatNumber(value)}</p>${topValue ? `<p style="font-size:12px;color:#777;margin:4px 0 0 0;">${topLabel}: <strong>${escapeHtml(topValue)}</strong></p>` : ""}</td>`;

  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Campaign Performance Report | Arroweye Pro</title></head><body style="background-color:#f9f9f9;font-family:Avenir,'DM Sans',Futura,Arial,sans-serif;margin:0;padding:0;-webkit-font-smoothing:antialiased;color:#333;"><div style="max-width:600px;margin:40px auto;padding:20px 20px 50px 20px;background-color:#fff;border-radius:10px;text-align:left;border-top:5px solid #ff7400;border-left:1px solid #ff7400;border-right:1px solid #ff7400;border-bottom:1px solid #ff7400;"><div style="text-align:left;margin-top:20px;margin-bottom:30px;"><img src="https://res.cloudinary.com/dyueswnzk/image/upload/v1759783466/studio_2_hajzkn.png" alt="Arroweye" width="120"></div><div style="font-size:22px;font-weight:900;color:#333;">Performance Report</div><div style="background-color:#f0f0f0;padding:10px;border-radius:5px;margin-top:15px;"><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">${detailRow("Project name", projectName)}${detailRow("Label", subvendor.organization_name)}${detailRow("Artist", artist)}${detailRow("DRI", account)}${detailRow("Start date", formatDate(project.created || project.start_date))}${detailRow("End date", formatDate(project.end_dte || project.end_date))}${detailRow("Last updated", formatDate(project.modified, formatDate(generatedAt)))}</table></div><div style="margin-top:30px;background-color:#f9f9f9;border:1px solid #ddd;"><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;text-align:center;"><tr>${metricCell("Airplay", airplayCount, "Top Channel", topChannel)}${metricCell("Streams", streamCount, "Top Platform", topPlatform)}${metricCell("Spins", spinCount, "", "", false)}</tr></table></div><p style="font-size:12px;color:#777;margin-top:10px;line-height:1.4;"><strong>&#9432;</strong> Metrics reflect cumulative campaign performance to date across radio airplay, streaming platforms, and DJ spins. Percentage values indicate change compared to the previous reporting period.</p><div style="margin-top:20px;background-color:#f9f9f9;border:1px solid #ddd;padding:20px;text-align:center;"><div style="font-size:10px;letter-spacing:1px;font-weight:900;text-transform:uppercase;color:#333;">Audience Growth</div><p style="font-size:21px;font-weight:900;margin:6px 0;color:#333;">+${formatNumber(audienceCount)}</p></div>${renderEvents(asArray(project.project_event || project.events), projectLink)}${renderPublications(asArray(project.media || project.publications), projectLink)}${renderDrops(project.dropzone || project.drops, projectLink)}<div style="margin-top:30px;">${sectionHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1759780230/id_xmybbv_syv929.png", "Recommendations")}<p style="font-size:12px;color:#777;margin-top:10px;line-height:1.4;"><strong>&#9432;</strong> Recommendations are generated from aggregated campaign data and highlight potential actions to help improve campaign performance.</p><div style="text-align:center;margin-top:35px;"><a href="${projectLink}" style="font-size:16px;font-weight:900;color:#fff;background-color:#ff7400;padding:12px 30px;text-decoration:none;border-radius:25px;">View Dashboard</a></div></div></div></body></html>`;

  const text = [
    `${projectName} | Marketing Report`,
    artist ? `Artist: ${artist}` : "",
    `Airplay: ${formatNumber(airplayCount)}`,
    `Streams: ${formatNumber(streamCount)}`,
    `Spins: ${formatNumber(spinCount)}`,
    `Audience growth: ${formatNumber(audienceCount)}`,
    `View dashboard: ${projectLink}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text, subject: `${projectName} | Marketing Report` };
}
