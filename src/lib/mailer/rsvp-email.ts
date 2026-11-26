import { plainTextToHtml } from "@/lib/mailer/html-text";

const FONT = "Avenir,'DM Sans',Futura,Helvetica,Arial,sans-serif";

export const renderRsvpThankYouEmail = (title: string) => {
  const text = `Thank you for accepting the invitation to ${title}.\n\nWe've saved your spot and look forward to seeing you.`;
  return {
    subject: `You're confirmed: ${title}`,
    text,
    html: `<div style="font-family:${FONT};font-size:15px;line-height:24px;color:#20231f;max-width:600px">${plainTextToHtml(text)}</div>`,
  };
};
