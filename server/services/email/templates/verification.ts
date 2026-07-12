import type { VerificationEmailData } from "../types.ts";
import { renderLayout, renderButton, COLORS } from "./layout.ts";
import { escapeHtml } from "../utils.ts";
import type { RenderedEmail } from "./otp.ts";

export function renderVerificationEmail(data: VerificationEmailData): RenderedEmail {
  const greeting = data.name ? `Hola ${escapeHtml(data.name)},` : "Hola,";
  const expires = data.expiresInHours ?? 24;

  const bodyHtml = `
    <p style="margin:0 0 16px;">${greeting}</p>
    <p style="margin:0 0 8px;">Confirma tu dirección de correo para activar tu cuenta:</p>
    ${renderButton("Verificar correo", data.verificationUrl)}
    <p style="margin:0;color:${COLORS.muted};">Este enlace vence en ${expires} horas. Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
  `;

  return {
    subject: "Verifica tu correo electrónico",
    html: renderLayout({ previewText: "Confirma tu correo para activar tu cuenta", bodyHtml }),
    text: [
      greeting,
      "",
      `Verifica tu correo aquí: ${data.verificationUrl}`,
      `Este enlace vence en ${expires} horas.`,
    ].join("\n"),
  };
}
