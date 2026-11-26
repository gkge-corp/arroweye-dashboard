export const normalizeTagName = (name: string) => name.trim().toLowerCase();

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const plainTextToHtml = (text: string) =>
  text
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
