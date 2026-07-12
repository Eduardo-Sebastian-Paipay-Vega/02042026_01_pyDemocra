import type { AlertEmailData, AlertSeverity } from "../types.ts";
import { renderLayout, renderButton, COLORS } from "./layout.ts";
import { escapeHtml } from "../utils.ts";
import type { RenderedEmail } from "./otp.ts";

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  info: COLORS.info,
  warning: COLORS.warning,
  critical: COLORS.critical,
};

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  info: "Información",
  warning: "Advertencia",
  critical: "Crítico",
};

export function renderAlertEmail(data: AlertEmailData): RenderedEmail {
  const severity = data.severity ?? "warning";
  const color = SEVERITY_COLOR[severity];

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
      <tr>
        <td bgcolor="${color}" style="padding:4px 10px;border-radius:4px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.5px;color:#ffffff;text-transform:uppercase;">
          ${SEVERITY_LABEL[severity]}
        </td>
      </tr>
    </table>
    <p style="margin:0 0 12px;font-size:17px;font-weight:600;">${escapeHtml(data.title)}</p>
    <p style="margin:0 0 8px;white-space:pre-line;">${escapeHtml(data.message)}</p>
    ${data.detailsUrl ? renderButton("Ver detalles", data.detailsUrl, color) : ""}
  `;

  return {
    subject: `[${SEVERITY_LABEL[severity]}] ${data.title}`,
    html: renderLayout({ previewText: data.message.slice(0, 120), bodyHtml }),
    text: [
      `[${SEVERITY_LABEL[severity]}] ${data.title}`,
      "",
      data.message,
      data.detailsUrl ? `\n${data.detailsUrl}` : "",
    ].join("\n"),
  };
}
