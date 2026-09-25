import type { CampaignReportCreator } from "@/types/campaign-report";

import {
  escapeHtml,
  formatNumber,
  safeUrl,
  sectionLabel,
  viewAll,
} from "./utils";

const statCell = (value: number, label: string) =>
  `<td width="75" style="padding:13px 0 13px 12px;text-align:right;"><div style="font-size:15px;font-weight:900;color:#222;">${formatNumber(value)}</div><div style="font-size:9px;color:#888;margin-top:3px;text-transform:uppercase;letter-spacing:.5px;">${label}</div></td>`;

export const renderSectionDivider = () =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:24px 0 0;"><tr><td style="border-top:1px solid #e7e7e7;height:1px;line-height:1px;font-size:0;">&nbsp;</td></tr></table>`;

export const renderTopCreators = (
  creators: CampaignReportCreator[],
  projectLink: string,
) => {
  if (creators.length === 0) return "";

  const rows = creators
    .map((creator, index) => {
      const link = safeUrl(creator.url);
      const handle = escapeHtml(
        creator.handle.startsWith("@") ? creator.handle : `@${creator.handle}`,
      );
      const heading = link
        ? `<a href="${link}" target="_blank" style="color:#222;text-decoration:none;">${handle}</a>`
        : handle;
      const divider =
        index < creators.length - 1
          ? '<tr><td colspan="4" style="border-top:1px solid #e9e9e9;"></td></tr>'
          : "";

      return `<tr><td width="34" style="padding:13px 10px 13px 0;"><div style="font-size:10px;font-weight:900;color:#999;">${String(index + 1).padStart(2, "0")}</div></td><td style="padding:13px 0;"><div style="font-size:13px;font-weight:800;">${heading}</div>${creator.platform ? `<div style="font-size:10px;color:#888;margin-top:3px;">${escapeHtml(creator.platform)}</div>` : ""}</td>${statCell(creator.followers, "Followers")}${statCell(creator.views, "Views")}</tr>${divider}`;
    })
    .join("");

  return `<div style="margin-top:24px;">${sectionLabel("Top creators", "Leading creators by audience size and views across tracked social platforms.")}<div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;padding:4px 14px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${rows}</table></div>${viewAll(projectLink)}</div>`;
};
