import type { InvitationEmailData } from "../types.ts";
import { renderLayout, renderButton, COLORS } from "./layout.ts";
import { escapeHtml } from "../utils.ts";
import type { RenderedEmail } from "./otp.ts";

export function renderInvitationEmail(data: InvitationEmailData): RenderedEmail {
  const expires = data.expiresInDays ?? 7;
  const roleLine = data.role ? ` como <strong>${escapeHtml(data.role)}</strong>` : "";

  const bodyHtml = `
    <p style="margin:0 0 16px;">${escapeHtml(data.inviterName)} te invitó a unirte a <strong>${escapeHtml(data.organizationName)}</strong>${roleLine}.</p>
    ${renderButton("Aceptar invitación", data.invitationUrl)}
    <p style="margin:0;color:${COLORS.muted};">Esta invitación vence en ${expires} días. Si no esperabas este correo, puedes ignorarlo.</p>
  `;

  return {
    subject: `${data.inviterName} te invitó a ${data.organizationName}`,
    html: renderLayout({ previewText: `Invitación a ${data.organizationName}`, bodyHtml }),
    text: [
      `${data.inviterName} te invitó a unirte a ${data.organizationName}${data.role ? ` como ${data.role}` : ""}.`,
      "",
      `Acepta la invitación aquí: ${data.invitationUrl}`,
      `Vence en ${expires} días.`,
    ].join("\n"),
  };
}
