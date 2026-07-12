import type { ResetPasswordEmailData } from "../types.ts";
import { renderLayout, renderButton, COLORS } from "./layout.ts";
import { escapeHtml } from "../utils.ts";
import type { RenderedEmail } from "./otp.ts";

export function renderResetPasswordEmail(data: ResetPasswordEmailData): RenderedEmail {
  const greeting = data.name ? `Hola ${escapeHtml(data.name)},` : "Hola,";
  const expires = data.expiresInMinutes ?? 30;

  const bodyHtml = `
    <p style="margin:0 0 16px;">${greeting}</p>
    <p style="margin:0 0 8px;">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para elegir una nueva:</p>
    ${renderButton("Restablecer contraseña", data.resetUrl)}
    <p style="margin:0 0 8px;color:${COLORS.muted};">Este enlace vence en ${expires} minutos.</p>
    <p style="margin:0;color:${COLORS.muted};">Si no solicitaste este cambio, ignora este correo — tu contraseña actual sigue siendo válida.</p>
  `;

  return {
    subject: "Restablece tu contraseña",
    html: renderLayout({ previewText: "Solicitud de restablecimiento de contraseña", bodyHtml }),
    text: [
      greeting,
      "",
      `Restablece tu contraseña aquí: ${data.resetUrl}`,
      `Este enlace vence en ${expires} minutos.`,
      "",
      "Si no solicitaste este cambio, ignora este correo.",
    ].join("\n"),
  };
}
