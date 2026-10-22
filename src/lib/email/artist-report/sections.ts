import type { ArtistReport } from "@/lib/music-analytics/artist/load-artist-report";

import {
  escapeHtml,
  formatNumber,
  infoNote,
  listItemStyle,
  safeUrl,
  sectionHeading as iconHeading,
} from "../campaign-report/utils";

type Platform = ArtistReport["profile"]["platforms"][number];
type Growth = ArtistReport["growth"][number];

// On these networks views count videos made with the artist's music.
const UGC_VIEW_PLATFORMS = new Set(["instagram", "tiktok"]);

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  spotify: "#1DB954",
  tiktok: "#111827",
  youtube: "#FF0033",
  deezer: "#8A3FFC",
  soundcloud: "#FF5500",
  applemusic: "#FA243C",
};

const RANK_COLORS = ["#F6D365", "#E9EAEC", "#DDA06F"];

const TABLE = `role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"`;

const platformColor = (code: string) => PLATFORM_COLORS[code] ?? "#68707A";

const followerNoun = (platform: Platform) =>
  platform.code === "youtube" ? "Subscribers" : "Followers";

const formatPercent = (percent: number) =>
  `${percent >= 0 ? "+" : "&minus;"}${Math.abs(percent).toLocaleString("en", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;

const formatChange = (value: number) =>
  `${value >= 0 ? "+" : "&minus;"}${formatNumber(Math.abs(value))}`;

const readSecondary = (platform: Platform) => {
  if (platform.monthlyListeners !== null)
    return `${formatNumber(platform.monthlyListeners)} monthly listeners`;
  if (platform.views !== null)
    return UGC_VIEW_PLATFORMS.has(platform.code)
      ? `${formatNumber(platform.views)} video views using their music`
      : `${formatNumber(platform.views)} views`;
  if (platform.streams !== null)
    return `${formatNumber(platform.streams)} streams`;
  if (platform.playlistReach !== null)
    return `${formatNumber(platform.playlistReach)} playlist reach`;
  return null;
};

const sectionHeading = (title: string) =>
  `<div style="font-size:11px;letter-spacing:1.15px;font-weight:900;text-transform:uppercase;color:#68707A;margin-bottom:5px;">${escapeHtml(title)}</div>`;

const section = (title: string, content: string, divided = true) =>
  `<div style="margin-top:27px;${divided ? "border-top:1px solid #E7E8EA;padding-top:22px;" : ""}">${sectionHeading(title)}${content}</div>`;

const card = (content: string, padding = "13px 13px 12px") =>
  `<table ${TABLE} style="width:100%;border-collapse:separate;border-spacing:0;background:#FFFFFF;border:1px solid #E5E7EA;border-radius:10px;"><tr><td style="padding:${padding};">${content}</td></tr></table>`;

/** Two-column rows; an odd last item keeps an empty right cell. */
const twoColumnGrid = (cells: string[], cellClass: string) => {
  const rows: string[] = [];
  for (let index = 0; index < cells.length; index += 2) {
    const right = cells[index + 1] ?? "";
    rows.push(
      `<tr><td class="${cellClass}" width="50%" valign="top" style="width:50%;padding:0 5px 10px 0;">${cells[index]}</td><td class="${cellClass}" width="50%" valign="top" style="width:50%;padding:0 0 10px 5px;">${right}</td></tr>`,
    );
  }
  return `<table ${TABLE} style="width:100%;margin-top:14px;border-collapse:collapse;">${rows.join("")}</table>`;
};

export const renderReportHeader = () =>
  `<table ${TABLE}><tr><td valign="middle"><img src="https://res.cloudinary.com/dyueswnzk/image/upload/v1759783466/studio_2_hajzkn.png" alt="Arroweye" width="116" style="display:block;border:0;width:116px;height:auto;"></td><td align="right" valign="middle"><span style="display:inline-block;background:#FFF1E4;border:1px solid #FFD6B0;border-radius:999px;padding:6px 9px;font-size:9px;letter-spacing:.8px;font-weight:900;color:#B95300;">14-DAY READOUT</span></td></tr></table><div style="font-size:24px;line-height:1.15;font-weight:900;color:#17191C;margin-top:23px;">Artist Analytics</div><div style="font-size:12px;line-height:1.5;color:#787F88;margin-top:6px;">Audience scale, platform momentum and listener geography</div>`;

const renderAvatar = (name: string, avatar: string | null) => {
  const src = safeUrl(avatar);
  if (src)
    return `<img src="${src}" alt="${escapeHtml(name)}" width="76" height="76" style="display:block;width:76px;height:76px;border-radius:50%;border:0;object-fit:cover;">`;

  const initial = escapeHtml(name.trim().charAt(0).toUpperCase());
  return `<table role="presentation" width="76" height="76" cellpadding="0" cellspacing="0" border="0" style="width:76px;height:76px;border-collapse:separate;border-spacing:0;background:#E9EAEC;border-radius:50%;"><tr><td align="center" valign="middle" style="font-size:26px;font-weight:900;color:#777F89;">${initial}</td></tr></table>`;
};

export const renderArtistIdentity = (
  name: string,
  profile: ArtistReport["profile"]["artist"],
) => {
  const genres = profile.genres.slice(0, 4).map(escapeHtml).join(" &middot; ");
  return `<table ${TABLE} style="margin-top:18px;border-collapse:separate;border-spacing:0;background:#FBFBFC;border:1px solid #E5E7EA;border-radius:12px;"><tr><td width="94" valign="middle" style="width:94px;padding:15px 0 15px 15px;">${renderAvatar(name, profile.avatar)}</td><td valign="middle" style="padding:15px 14px 15px 12px;"><div style="font-size:9px;letter-spacing:1.15px;font-weight:900;text-transform:uppercase;color:#878D95;margin-bottom:5px;">Artist profile</div><div style="font-size:22px;line-height:1.2;font-weight:900;color:#17191C;">${escapeHtml(name)}</div>${genres ? `<div style="font-size:11px;color:#666D76;margin-top:6px;line-height:1.5;">${genres}</div>` : ""}</td></tr></table>`;
};

const insightTile = (
  tone: { background: string; border: string; label: string },
  label: string,
  value: string,
  detail: string,
) =>
  `<table ${TABLE} style="background:${tone.background};border:1px solid ${tone.border};border-radius:10px;"><tr><td style="padding:12px 13px;"><div style="font-size:9px;letter-spacing:.8px;font-weight:900;text-transform:uppercase;color:${tone.label};">${label}</div><div style="font-size:18px;line-height:1.1;font-weight:900;color:#25282C;margin-top:7px;">${value}</div><div style="font-size:11px;color:#6E737B;margin-top:3px;">${detail}</div></td></tr></table>`;

const largestAudience = (platforms: Platform[]) =>
  platforms.reduce<Platform | null>(
    (best, platform) =>
      (platform.followers ?? 0) > (best?.followers ?? 0) ? platform : best,
    null,
  );

const fastestGrowth = (growth: ArtistReport["growth"]) =>
  growth.reduce<Growth | null>(
    (best, entry) =>
      entry.percent !== null &&
      entry.percent > 0 &&
      entry.percent > (best?.percent ?? 0)
        ? entry
        : best,
    null,
  );

export const renderInsights = (report: ArtistReport) => {
  const largest = largestAudience(report.profile.platforms);
  const fastest = fastestGrowth(report.growth);
  const tiles = [
    largest?.followers
      ? insightTile(
          { background: "#FFF7EF", border: "#FFE0C2", label: "#A65A18" },
          "Largest audience",
          formatNumber(largest.followers),
          `${escapeHtml(largest.label)} ${followerNoun(largest).toLowerCase()}`,
        )
      : "",
    fastest?.percent
      ? insightTile(
          { background: "#EFFAF3", border: "#CBEFD8", label: "#157345" },
          "Fastest growth rate",
          formatPercent(fastest.percent),
          `${escapeHtml(fastest.label)} &middot; ${formatChange(fastest.gained)}`,
        )
      : "",
  ].filter(Boolean);
  if (tiles.length === 0) return "";

  const cells =
    tiles.length === 2
      ? `<td width="50%" valign="top" style="width:50%;padding:0 5px 0 0;">${tiles[0]}</td><td width="50%" valign="top" style="width:50%;padding:0 0 0 5px;">${tiles[1]}</td>`
      : `<td valign="top">${tiles[0]}</td>`;
  return `<table ${TABLE} style="margin-top:14px;"><tr>${cells}</tr></table>`;
};

const progressBar = (percent: number, color: string) => {
  const filled = Math.min(100, Math.max(0.5, Math.round(percent * 10) / 10));
  const rest = Math.round((100 - filled) * 10) / 10;
  const cell = (width: number, background: string) =>
    `<td width="${width}%" height="6" bgcolor="${background}" style="width:${width}%;height:6px;font-size:0;line-height:0;background-color:${background};">&nbsp;</td>`;
  return `<div style="margin-top:10px;"><table ${TABLE} style="width:100%;table-layout:fixed;border-collapse:collapse;background:#E9EAEC;"><tr>${cell(filled, color)}${rest > 0 ? cell(rest, "#E9EAEC") : ""}</tr></table></div>`;
};

const platformCard = (platform: Platform, maxFollowers: number) => {
  const color = platformColor(platform.code);
  const secondary = readSecondary(platform);
  const headline =
    platform.followers !== null
      ? `<div style="font-size:23px;line-height:1.08;font-weight:900;color:#17191C;margin:8px 0 2px;">${formatNumber(platform.followers)}</div><div style="font-size:10px;color:#858B93;">${followerNoun(platform)}</div>${progressBar((platform.followers / maxFollowers) * 100, color)}`
      : `<div style="font-size:10px;color:#858B93;margin-top:8px;">No linked account</div>`;

  return card(
    `<table ${TABLE}><tr><td style="font-size:10px;letter-spacing:.8px;font-weight:900;text-transform:uppercase;color:#68707A;">${escapeHtml(platform.label)}</td><td width="10" align="right" style="font-size:14px;line-height:14px;color:${color};font-weight:900;">&#9679;</td></tr></table>${headline}${secondary ? `<div style="font-size:10px;line-height:1.4;color:#666;margin-top:9px;">${secondary}</div>` : ""}`,
  );
};

export const renderPlatformAudience = (platforms: Platform[]) => {
  if (platforms.length === 0) return "";

  const sorted = [...platforms].sort(
    (a, b) => (b.followers ?? -1) - (a.followers ?? -1),
  );
  const maxFollowers = Math.max(1, ...sorted.map((p) => p.followers ?? 0));
  const grid = twoColumnGrid(
    sorted.map((platform) => platformCard(platform, maxFollowers)),
    "metric-cell",
  );

  return section(
    "Platform audience",
    `${grid}<div style="font-size:10px;color:#8A9098;line-height:1.45;margin-top:1px;">Audience totals are platform-specific. Bars compare follower counts across platforms.</div>`,
    false,
  );
};

const growthHeaderCell = (label: string, align = "left", width = "") =>
  `<td${align === "right" ? ' align="right"' : ""}${width ? ` width="${width}"` : ""} style="padding:10px 0${width ? " 10px 8px" : ""};font-size:9px;font-weight:900;letter-spacing:.6px;color:#999FA7;text-transform:uppercase;">${label}</td>`;

const growthRow = (entry: Growth) => {
  const up = entry.gained >= 0;
  const color = up ? "#14804A" : "#D12C3A";
  const pill =
    entry.percent === null
      ? `<span style="font-size:11px;color:#999FA7;">&ndash;</span>`
      : `<span style="display:inline-block;padding:5px 7px;border-radius:6px;background:${up ? "#EAF8EF" : "#FFF0F0"};color:${color};font-size:11px;font-weight:900;">${formatPercent(entry.percent)}</span>`;
  const border = "border-top:1px solid #ECEDEF;";
  return `<tr><td style="padding:12px 0;${border}font-size:12px;font-weight:800;color:#30343A;">${escapeHtml(entry.label)}</td><td align="right" style="padding:12px 0;${border}font-size:12px;font-weight:900;color:${color};white-space:nowrap;">${formatChange(entry.gained)}</td><td align="right" style="padding:12px 0 12px 8px;${border}white-space:nowrap;">${pill}</td></tr>`;
};

const aiSummary = (summary: string | null) =>
  summary?.trim()
    ? `<table ${TABLE} style="margin-top:12px;background:#F6F7F8;border:1px solid #E7E8EA;border-radius:8px;"><tr><td style="padding:12px 13px;"><div style="font-size:9px;letter-spacing:.9px;font-weight:900;text-transform:uppercase;color:#6F42C1;margin-bottom:6px;">&#10022; AI Summary</div><div style="font-size:12px;line-height:1.5;color:#50565E;">${escapeHtml(summary)}</div></td></tr></table>`
    : "";

export const renderFollowerGrowth = (report: ArtistReport) => {
  if (report.growth.length === 0 && !report.summary?.trim()) return "";

  const rows = [...report.growth]
    .sort((a, b) => (b.percent ?? -Infinity) - (a.percent ?? -Infinity))
    .map(growthRow)
    .join("");
  const table = rows
    ? `<table ${TABLE} style="width:100%;"><tr>${growthHeaderCell("Platform")}${growthHeaderCell("Net change", "right")}${growthHeaderCell(`${report.days} days`, "right", "78")}</tr>${rows}</table>`
    : "";

  return section(
    `${report.days}-day follower growth`,
    `<div style="margin-top:14px;">${card(`${table}${aiSummary(report.summary)}`, "3px 14px 5px")}</div>`,
  );
};

const rankBadge = (index: number) =>
  `<span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;background:${RANK_COLORS[index] ?? "#F2F3F5"};border-radius:50%;font-size:10px;font-weight:900;color:#222222;">${index + 1}</span>`;

const trackArtwork = (track: ArtistReport["topTracks"][number]) => {
  const src = safeUrl(track.image);
  return src
    ? `<img src="${src}" alt="" width="36" height="36" style="display:block;width:36px;height:36px;border:0;border-radius:6px;object-fit:cover;">`
    : `<div style="width:36px;height:36px;border-radius:6px;background:#E9EAEC;"></div>`;
};

const trackRow = (track: ArtistReport["topTracks"][number], index: number) => {
  const border = "border-top:1px solid #ECEDEF;";
  const badge = track.isCampaignSong
    ? ' <span style="font-size:9px;font-weight:900;color:#07a83b;text-transform:uppercase;letter-spacing:.5px;">&middot; This campaign</span>'
    : "";
  return `<tr><td width="30" valign="middle" style="width:30px;padding:10px 7px 10px 0;${border}">${rankBadge(index)}</td><td width="42" valign="middle" style="width:42px;padding:10px 8px 10px 0;${border}">${trackArtwork(track)}</td><td valign="middle" style="padding:10px 8px 10px 0;${border}font-size:12px;font-weight:800;color:#222;">${escapeHtml(track.title)}${badge}<div style="font-size:10px;font-weight:500;color:#868D96;margin-top:3px;">${escapeHtml(track.artists)}</div></td><td width="56" valign="middle" align="right" style="width:56px;padding:10px 0;${border}font-size:12px;font-weight:900;color:#444;white-space:nowrap;">${formatNumber(track.playlists)}</td></tr>`;
};

export const renderTopTracks = (
  tracks: ArtistReport["topTracks"],
  reportLink: string,
) => {
  if (tracks.length === 0) return "";

  const header = `<tr><td width="30" style="width:30px;padding:10px 7px 10px 0;font-size:9px;font-weight:900;color:#999FA7;text-transform:uppercase;">#</td><td width="42" style="width:42px;padding:10px 8px 10px 0;"></td><td style="padding:10px 8px 10px 0;font-size:9px;font-weight:900;color:#999FA7;text-transform:uppercase;">Track</td><td width="56" align="right" style="width:56px;padding:10px 0;font-size:9px;font-weight:900;color:#999FA7;text-transform:uppercase;">Playlists</td></tr>`;
  const rows = tracks.slice(0, 5).map(trackRow).join("");
  const viewAll = reportLink
    ? `<div style="text-align:right;margin-top:14px;"><a href="${reportLink}" style="display:inline-block;font-size:14px;font-weight:700;color:#147aff;border:1px solid #147aff;padding:8px 20px;text-decoration:none;border-radius:20px;">View all</a></div>`
    : "";

  return `${section(
    "Top tracks",
    `<div style="margin-top:14px;">${card(`<table ${TABLE} style="width:100%;table-layout:fixed;border-collapse:collapse;">${header}${rows}</table>`, "3px 13px 6px")}</div>`,
  )}${viewAll}`;
};

interface GeoEntry {
  name: string;
  detail?: string;
  listeners: number;
}

const geoList = (title: string, column: string, entries: GeoEntry[]) => {
  const rows = entries
    .map((entry, index) => {
      const border =
        index < entries.length - 1 ? "border-bottom:1px solid #ECEDEF;" : "";
      const detail = entry.detail
        ? ` <span style="color:#8B9199;font-weight:500;">&middot; ${escapeHtml(entry.detail)}</span>`
        : "";
      return `<tr><td style="padding:9px 0 8px;${border}"><table ${TABLE}><tr><td style="font-size:10px;line-height:1.3;color:#3D4248;font-weight:700;">${index + 1}. ${escapeHtml(entry.name)}${detail}</td><td align="right" style="font-size:10px;line-height:1.3;color:#30343A;font-weight:900;white-space:nowrap;padding-left:6px;">${formatNumber(entry.listeners)}</td></tr></table></td></tr>`;
    })
    .join("");
  const headerCell = (label: string, align = "") =>
    `<td${align ? ` align="${align}"` : ""} style="padding:5px 0;font-size:8px;letter-spacing:.6px;font-weight:900;color:#999FA7;text-transform:uppercase;white-space:nowrap;">${label}</td>`;

  return card(
    `<div style="font-size:10px;letter-spacing:.9px;font-weight:900;text-transform:uppercase;color:#646C75;margin-bottom:2px;">${title}</div><table ${TABLE} style="width:100%;border-collapse:collapse;margin-top:7px;margin-bottom:2px;"><tr>${headerCell(column)}${headerCell("Listeners", "right")}</tr></table><table ${TABLE}>${rows}</table>`,
    "12px 10px 4px",
  );
};

export const renderListenerGeography = (audience: ArtistReport["audience"]) => {
  const cities = audience.cities.slice(0, 5).map((city) => ({
    name: city.city,
    detail: city.country,
    listeners: city.listeners,
  }));
  const countries = audience.countries.slice(0, 5).map((country) => ({
    name: country.country,
    listeners: country.listeners,
  }));
  const lists = [
    cities.length ? geoList("Top cities", "City", cities) : "",
    countries.length ? geoList("Top countries", "Country", countries) : "",
  ].filter(Boolean);
  if (lists.length === 0) return "";

  return section("Listener geography", twoColumnGrid(lists, "geo-cell"));
};

const recommendationRow = (
  { title, body }: ArtistReport["recommendations"][number],
  reportLink: string,
  isLast: boolean,
) =>
  `<div style="${listItemStyle(isLast)}"><table ${TABLE} style="border-collapse:collapse;"><tr><td valign="top" style="padding:0;"><a href="${reportLink}" target="_blank" style="display:block;text-decoration:none;color:#000;"><div style="font-size:16px;font-weight:900;color:#000;">${escapeHtml(title)}</div><p style="font-size:13px;color:#666;margin:10px 0 0;line-height:1.5;">${escapeHtml(body)}</p></a><a href="${reportLink}" style="font-size:14px;color:#ff7400;text-decoration:none;font-weight:600;display:inline-block;margin-top:8px;">View Insights</a></td><td valign="top" width="24" style="width:24px;text-align:right;padding-left:8px;color:#999;font-size:24px;font-weight:300;line-height:1;"><a href="${reportLink}" target="_blank" style="display:block;color:#999;text-decoration:none;font-size:24px;line-height:1;">&rsaquo;</a></td></tr></table></div>`;

export const renderRecommendations = (
  recommendations: ArtistReport["recommendations"],
  reportLink: string,
) => {
  if (recommendations.length === 0) return "";

  const rows = recommendations
    .map((recommendation, index) =>
      recommendationRow(
        recommendation,
        reportLink,
        index === recommendations.length - 1,
      ),
    )
    .join("");

  return `<div style="margin-top:24px;">${iconHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1759780230/id_xmybbv_syv929.png", "Recommendations", 30)}<div style="margin-top:14px;background-color:#fffaf5;padding:16px;border-radius:10px;border:1px solid #f0e2d5;border-left:3px solid #ff7400;">${rows}</div>${infoNote("Recommendations are generated by AI based on aggregated artist data and highlight potential actions to help improve performance.")}</div>`;
};
