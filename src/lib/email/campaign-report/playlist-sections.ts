import type {
  CampaignReportPlaylist,
  CampaignReportStats,
} from "@/types/campaign-report";

import {
  asNumber,
  escapeHtml,
  formatNumber,
  safeUrl,
  sectionLabel,
  total,
  viewAll,
} from "./utils";

// Solid colour first: clients without gradient support keep the fallback.
const CARD_GRADIENTS = [
  ["#ff6a00", "#ee0979"],
  ["#111827", "#4b5563"],
  ["#f97316", "#facc15"],
  ["#06b6d4", "#2563eb"],
  ["#14b8a6", "#22c55e"],
  ["#8b5cf6", "#3b82f6"],
];

const gradient = (index: number, angle: string) => {
  const [from, to] = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  return `background:${from};background:linear-gradient(${angle},${from},${to});`;
};

const renderPlaylistCard = (
  playlist: CampaignReportPlaylist,
  index: number,
  column: number,
  firstRow: boolean,
) => {
  const padding = [
    firstRow ? "0" : "8px",
    column === 2 ? "0" : "4px",
    firstRow ? "8px" : "0",
    column === 0 ? "0" : "4px",
  ].join(" ");
  const link = safeUrl(playlist.url);
  const name = escapeHtml(playlist.name);
  const title = link
    ? `<a href="${link}" target="_blank" style="color:#fff;text-decoration:none;">${name}</a>`
    : name;

  return `<td width="33.33%" valign="top" style="padding:${padding};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#fff;border:1px solid #e7e7e7;"><tr><td style="padding:7px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td height="150" valign="top" style="height:150px;padding:10px;${gradient(index, "135deg")}color:#fff;"><div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.7px;opacity:.82;">${escapeHtml(playlist.platform)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;height:105px;"><tr><td height="105" valign="bottom" style="height:105px;padding:0 0 12px;"><div style="font-size:15px;font-weight:900;line-height:1.1;max-height:34px;overflow:hidden;">${title}</div></td></tr></table></td></tr></table></td></tr></table></td>`;
};

export const renderPlaylistAdditions = (
  playlists: CampaignReportPlaylist[],
  projectLink: string,
) => {
  if (playlists.length === 0) return "";

  const rows = Array.from(
    { length: Math.ceil(playlists.length / 3) },
    (_, row) => {
      const cells = playlists
        .slice(row * 3, row * 3 + 3)
        .map((playlist, column) =>
          renderPlaylistCard(playlist, row * 3 + column, column, row === 0),
        );
      const fillers = Array.from(
        { length: 3 - cells.length },
        () => '<td width="33.33%"></td>',
      );

      return `<tr>${[...cells, ...fillers].join("")}</tr>`;
    },
  ).join("");

  return `<div style="margin-top:24px;">${sectionLabel("Playlist additions", "Current playlist placements across tracked platforms.")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:8px;">${rows}</table>${viewAll(projectLink)}</div>`;
};

export const renderPlaylistBreakdown = (
  performance: CampaignReportStats,
  reach: CampaignReportStats,
) => {
  const placements = total(performance);
  const entries = Object.entries(performance)
    .filter(([platform, value]) => platform !== "total_count" && value > 0)
    .sort((a, b) => b[1] - a[1]);
  if (placements <= 0 || entries.length === 0) return "";

  const bars = entries
    .map(([platform, value], index) => {
      const share = Math.round((value / placements) * 100);
      const followers = asNumber(reach[platform]);
      const detail = [
        `${share}%`,
        `${formatNumber(value)} playlists`,
        followers > 0 ? `${formatNumber(followers)} followers` : "",
      ]
        .filter(Boolean)
        .join(" &middot; ");

      return `<div style="${index < entries.length - 1 ? "margin-bottom:14px;" : ""}"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;"><tr><td style="font-size:10px;color:#444;font-weight:900;padding-bottom:6px;text-transform:uppercase;">${escapeHtml(platform)}</td><td style="font-size:10px;color:#777;text-align:right;padding-bottom:6px;">${detail}</td></tr><tr><td colspan="2" style="height:8px;padding:0;background:#eee;border-radius:5px;"><span style="display:block;height:8px;width:${Math.max(1, share)}%;${gradient(index, "90deg")}border-radius:5px;"></span></td></tr></table></div>`;
    })
    .join("");

  return `<div style="margin-top:24px;"><div style="font-size:11px;letter-spacing:1.2px;font-weight:900;text-transform:uppercase;color:#777;margin-bottom:10px;">Playlist breakdown</div><div style="margin-top:14px;background:#f9f9f9;padding:16px;border-radius:7px;border:1px solid #e5e5e5;"><div style="font-size:10px;letter-spacing:1px;font-weight:900;text-transform:uppercase;color:#666;">Placements</div><div style="font-size:25px;line-height:1;font-weight:900;margin:8px 0 4px;color:#222;">${formatNumber(placements)}</div><div style="font-size:11px;color:#777;margin-bottom:16px;">Playlists the song is currently on, by platform</div>${bars}<p style="font-size:11px;color:#777;margin:14px 0 0;line-height:1.45;"><strong>&#9432;</strong> Followers show the combined audience of those playlists where the platform reports it.</p></div></div>`;
};
