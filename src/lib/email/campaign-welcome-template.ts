import "server-only";

import {
  asArray,
  asRecord,
  asString,
  escapeHtml,
  formatDate,
  formatDateTime,
  safeUrl,
} from "./campaign-report/utils";

interface CampaignWelcomeTemplateInput {
  project: Record<string, unknown>;
  campaignId: string;
  recipient: string;
  generatedAt: Date;
}

interface WelcomeDetail {
  label: string;
  value: string;
  kind?: "text" | "mailto" | "login";
}

const renderDetailValue = ({ value, kind = "text" }: WelcomeDetail) => {
  const text = escapeHtml(value);

  if (kind === "mailto") {
    return `<a href="mailto:${text}" style="font-size:14px;line-height:20px;font-weight:normal;color:#3478C8;text-decoration:underline;word-break:break-word;">${text}</a>`;
  }
  if (kind === "login") {
    return `<div style="font-size:14px;line-height:20px;font-weight:normal;color:#3478C8;word-break:break-word;">${text}</div><div style="margin-top:4px;font-size:12px;line-height:17px;font-weight:normal;color:#777777;">Use this email address to sign in to Arroweye.</div>`;
  }
  return `<div style="font-size:14px;line-height:20px;font-weight:normal;color:#515761;">${text}</div>`;
};

const renderDetailRow = (detail: WelcomeDetail, isLast: boolean) => {
  const border = isLast ? "" : "border-bottom:1px solid #E5E7EA;";

  return `<tr><td width="36%" valign="top" style="width:36%;padding:13px 12px 13px 16px;${border}"><div style="font-size:13px;line-height:19px;font-weight:bold;color:#62666B;">${escapeHtml(detail.label)}</div></td><td valign="top" style="padding:13px 16px 13px 0;${border}">${renderDetailValue(detail)}</td></tr>`;
};

export function renderCampaignWelcomeEmail({
  project,
  campaignId,
  recipient,
  generatedAt,
}: CampaignWelcomeTemplateInput) {
  const subvendor = asRecord(project.subvendor);
  const owner = asRecord(subvendor.owner);
  const watchers = asArray(project.watchers).map(asRecord);
  const dri =
    asString(owner.email) ||
    asString(project.account) ||
    asString(watchers.find((watcher) => asString(watcher.email))?.email);
  const projectName = asString(
    project.title || project.song_title || "Campaign",
  );
  const artist = asString(project.artist_name || project.song_artist);
  const projectLink = safeUrl(
    `https://studio.arroweye.pro/campaigns/${campaignId}`,
  );

  const details = (
    [
      { label: "Project name", value: projectName },
      { label: "Label", value: asString(subvendor.organization_name) },
      { label: "Artist", value: artist },
      { label: "DRI", value: dri, kind: "mailto" },
      { label: "Login email", value: recipient, kind: "login" },
      {
        label: "Start date",
        value: formatDate(project.created || project.start_date, "", "long"),
      },
      {
        label: "Last updated",
        value: formatDateTime(project.modified || generatedAt),
      },
    ] satisfies WelcomeDetail[]
  ).filter(({ value }) => value.trim());
  const detailRows = details
    .map((detail, index) =>
      renderDetailRow(detail, index === details.length - 1),
    )
    .join("");

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>You’ve Been Added to a Campaign | Arroweye</title></head><body style="margin:0;padding:0;background-color:#F6F7F8;font-family:Avenir,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#17191C;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">You’ve been added to ${escapeHtml(projectName)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#F6F7F8;border-collapse:collapse;"><tr><td align="center" style="padding:20px 8px;"><div style="max-width:600px;width:100%;margin:0 auto;padding:5px 1px 1px;background-color:#ff7400;background-image:linear-gradient(to right,#ff006d,#ff7f00,#ffff00,#00ff00,#147aff);box-shadow:0 8px 28px rgba(22,26,29,.05);text-align:left;box-sizing:border-box;"><div style="padding:22px 20px 34px;background-color:#FFFFFF;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr><td valign="middle" align="left"><img src="https://res.cloudinary.com/dyueswnzk/image/upload/v1792488900/studio_pcyhb7.png" alt="Arroweye" width="116" style="display:block;width:170px;height:auto;border:0;"></td><td valign="middle" align="right"><span style="display:inline-block;padding:6px 9px;border-radius:999px;background:#FFF1E4;border:1px solid #FFD6B0;color:#B95300;font-size:9px;line-height:12px;letter-spacing:.8px;font-weight:bold;">CAMPAIGN</span></td></tr></table><div style="padding-bottom:18px;margin-bottom:8px;border-bottom:1px solid #eeeeee;font-size:0;line-height:0;">&nbsp;</div><div style="margin-top:22px;color:#FF7400;font-size:11px;line-height:1.4;letter-spacing:1.6px;font-weight:bold;text-transform:uppercase;">YOU’RE ON THE TEAM</div><h1 style="margin:10px 0 0;color:#17191C;font-size:36px;line-height:1.08;letter-spacing:-1.1px;font-weight:bold;">You’re in. 🚀<br>Let’s make some magic!</h1><p style="margin:16px 0 0;color:#515761;font-size:15px;line-height:1.7;font-weight:normal;">You’ve been added to a campaign dashboard. Here’s your starting point, with everything you need to stay in sync and grow.</p><div style="margin-top:26px;color:#777;font-size:11px;line-height:18px;letter-spacing:1.2px;font-weight:bold;text-transform:uppercase;">CAMPAIGN DETAILS</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:9px;border:1px solid #E5E7EA;border-radius:14px;border-collapse:separate;border-spacing:0;background:#FAFAFA;">${detailRows}</table><p style="margin:22px 0 0;color:#515761;text-align:center;font-size:14px;line-height:1.7;">Log in to stay in harmony with your team and keep track of performance data.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-top:22px;"><tr><td style="padding:0 0 22px;text-align:center;"><a href="${projectLink}" target="_blank" style="display:inline-block;text-align:center;background:#FF7400;color:#FFFFFF;text-decoration:none;font-family:Avenir,Arial,sans-serif;font-size:14px;line-height:20px;font-weight:bold;padding:13px 24px;border-radius:999px;">Join Campaign</a></td></tr></table><div style="height:1px;background:#EEEEEE;font-size:0;line-height:0;">&nbsp;</div><div style="margin-top:8px;padding-top:16px;text-align:center;"><p style="margin:7px 0 0;color:#333;font-weight:bold;font-size:12px;line-height:1.6;">© Arroweye Pro · <strong>Make Sound Decisions</strong></p><p style="margin:0;color:#969BA2;font-size:12px;line-height:2;">🛟 Need assistance? <a href="https://arroweye.pro/contact" target="_blank" style="color:#626A73;text-decoration:underline;">Get Support</a></p></div></div></div></td></tr></table></body></html>`;

  const text = [
    `You've been added to ${projectName}`,
    ...details.map(({ label, value }) => `${label}: ${value}`),
    `Join campaign: ${projectLink}`,
  ].join("\n");

  return { html, text, subject: `You've been added to ${projectName}` };
}
