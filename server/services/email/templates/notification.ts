import type { NotificationEmailData } from "../types.ts";
import { renderLayout, renderButton } from "./layout.ts";
import { escapeHtml } from "../utils.ts";
import type { RenderedEmail } from "./otp.ts";

export function renderNotificationEmail(data: NotificationEmailData): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:17px;font-weight:600;">${escapeHtml(data.title)}</p>
    <p style="margin:0 0 8px;white-space:pre-line;">${escapeHtml(data.message)}</p>
    ${data.actionUrl ? renderButton(data.actionLabel ?? "Ver detalles", data.actionUrl) : ""}
  `;

  return {
    subject: data.title,
    html: renderLayout({ previewText: data.message.slice(0, 120), bodyHtml }),
    text: [data.title, "", data.message, data.actionUrl ? `\n${data.actionUrl}` : ""].join("\n"),
  };
}
