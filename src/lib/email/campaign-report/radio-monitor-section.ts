import { escapeHtml, safeUrl, sectionHeading } from "./utils";

export const renderRadioMonitor = (
  downloadLink: string | undefined,
  fileName: string | undefined,
) => {
  const link = safeUrl(downloadLink);
  if (!link) return "";

  return `<div style="margin-top:24px;">${sectionHeading("https://res.cloudinary.com/dyueswnzk/image/upload/v1773505122/spins-mail_lvzhxe.png", "Radio Monitor")}<div style="margin-top:14px;background-color:#f9f9f9;padding:16px;border-radius:7px;border:1px solid #e5e5e5;"><div style="font-size:14px;color:#555;line-height:1.5;">The full radio monitoring report for this campaign is available to download.${fileName ? `<div style="font-size:13px;color:#777;font-weight:500;margin-top:6px;">${escapeHtml(fileName)}</div>` : ""}</div><div style="margin-top:14px;"><a href="${link}" style="display:inline-block;font-size:14px;font-weight:700;color:#fff;background-color:#147aff;padding:9px 22px;text-decoration:none;border-radius:20px;">Download radio monitor</a></div></div><p style="font-size:12px;color:#777;margin:10px 0 0;line-height:1.5;"><strong>&#9432;</strong> This download link expires in 30 days.</p></div>`;
};
