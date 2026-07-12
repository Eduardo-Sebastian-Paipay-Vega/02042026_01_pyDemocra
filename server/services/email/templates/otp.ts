import type { OTPEmailData } from "../types.ts";
import { renderLayout, COLORS } from "./layout.ts";
import { escapeHtml } from "../utils.ts";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderOtpEmail(data: OTPEmailData): RenderedEmail {
  const greeting = data.name ? `Hola ${data.name},` : "Hola,";
  const ttl = data.ttlMinutes ?? 10;

  const bodyHtml = `
    <p style="margin:0 0 16px;">${greeting}</p>
    <p style="margin:0 0 20px;">Usa este código para completar tu verificación:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td bgcolor="${COLORS.bg}" style="padding:16px 24px;border-radius:8px;font-family:'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:6px;color:${COLORS.text};">
          ${escapeHtml(data.code)}
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;color:${COLORS.muted};">Este código vence en ${ttl} minutos.</p>
    <p style="margin:0;color:${COLORS.muted};">Si no reconoces este intento de acceso, ignora este correo y avisa a tu administrador.</p>
  `;

  return {
    subject: "Tu código de verificación",
    html: renderLayout({ previewText: `Tu código es ${data.code}`, bodyHtml }),
    text: [
      greeting,
      "",
      `Tu código de verificación es: ${data.code}`,
      `Vence en ${ttl} minutos.`,
      "",
      "Si no reconoces este intento de acceso, ignora este correo y avisa a tu administrador.",
    ].join("\n"),
  };
}
