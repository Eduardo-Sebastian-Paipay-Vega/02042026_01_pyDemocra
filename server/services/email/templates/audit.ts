import type { AuditEmailData } from "../types.ts";
import { renderLayout, COLORS } from "./layout.ts";
import { escapeHtml } from "../utils.ts";
import type { RenderedEmail } from "./otp.ts";

function renderMetadataRows(metadata: AuditEmailData["metadata"]): string {
  if (!metadata) return "";
  return Object.entries(metadata)
    .map(
      ([key, value]) => `
        <tr>
          <td style="padding:4px 12px 4px 0;color:${COLORS.muted};font-size:13px;white-space:nowrap;">${escapeHtml(key)}</td>
          <td style="padding:4px 0;font-size:13px;">${escapeHtml(String(value))}</td>
        </tr>
      `
    )
    .join("");
}

export function renderAuditEmail(data: AuditEmailData): RenderedEmail {
  const occurredAt = data.occurredAt ?? new Date().toISOString();

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:17px;font-weight:600;">Evento de auditoría</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
      <tr>
        <td style="padding:4px 12px 4px 0;color:${COLORS.muted};font-size:13px;white-space:nowrap;">Acción</td>
        <td style="padding:4px 0;font-size:13px;">${escapeHtml(data.action)}</td>
      </tr>
      <tr>
        <td style="padding:4px 12px 4px 0;color:${COLORS.muted};font-size:13px;white-space:nowrap;">Realizado por</td>
        <td style="padding:4px 0;font-size:13px;">${escapeHtml(data.actorName)}</td>
      </tr>
      ${
        data.entity
          ? `<tr>
              <td style="padding:4px 12px 4px 0;color:${COLORS.muted};font-size:13px;white-space:nowrap;">Entidad</td>
              <td style="padding:4px 0;font-size:13px;">${escapeHtml(data.entity)}</td>
            </tr>`
          : ""
      }
      <tr>
        <td style="padding:4px 12px 4px 0;color:${COLORS.muted};font-size:13px;white-space:nowrap;">Fecha</td>
        <td style="padding:4px 0;font-size:13px;">${escapeHtml(occurredAt)}</td>
      </tr>
      ${renderMetadataRows(data.metadata)}
    </table>
    <p style="margin:0;color:${COLORS.muted};">Este es un registro automático — no requiere acción de tu parte.</p>
  `;

  return {
    subject: `Auditoría: ${data.action}`,
    html: renderLayout({ previewText: `${data.actorName} — ${data.action}`, bodyHtml }),
    text: [
      "Evento de auditoría",
      "",
      `Acción: ${data.action}`,
      `Realizado por: ${data.actorName}`,
      data.entity ? `Entidad: ${data.entity}` : "",
      `Fecha: ${occurredAt}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
