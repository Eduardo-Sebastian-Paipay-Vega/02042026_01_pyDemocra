import { getEmailConfig } from "../config/email.config.ts";

/**
 * Shell HTML compartido por todas las plantillas. Basado en tablas (no
 * flexbox/grid) y estilos 100% inline a propósito: es lo único que Outlook
 * (motor Word) renderiza de forma predecible. Tema claro deliberado — un
 * tema oscuro fijo choca con la inversión automática de "dark mode" de
 * Outlook/Gmail y puede volver el texto ilegible.
 */

const COLORS = {
  bg: "#f4f4f5",
  card: "#ffffff",
  border: "#e4e4e7",
  text: "#18181b",
  muted: "#71717a",
  accent: "#3b82f6",
  accentText: "#ffffff",
  warning: "#f59e0b",
  critical: "#ef4444",
  info: "#3b82f6",
};

export { COLORS };

export interface LayoutOptions {
  /** Texto oculto que algunos clientes (Gmail) muestran como preview junto al asunto. */
  previewText: string;
  /** HTML ya armado de la plantilla específica (OTP, bienvenida, etc.). */
  bodyHtml: string;
}

export function renderButton(label: string, url: string, color: string = COLORS.accent): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td align="center" bgcolor="${color}" style="border-radius:8px;">
          <a href="${url}" target="_blank"
             style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:${COLORS.accentText};text-decoration:none;border-radius:8px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function renderLayout({ previewText, bodyHtml }: LayoutOptions): string {
  const { appName, appUrl, logoUrl } = getEmailConfig();
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${appName}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLORS.bg};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${previewText}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:${COLORS.card};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 0;text-align:center;">
                <img src="${logoUrl}" alt="${appName}" width="40" height="40" style="display:inline-block;border-radius:8px;" />
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px;font-family:Arial,Helvetica,sans-serif;color:${COLORS.text};font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid ${COLORS.border};font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${COLORS.muted};line-height:1.5;">
                <p style="margin:0 0 6px;">
                  Este es un mensaje automático de <a href="${appUrl}" style="color:${COLORS.muted};" target="_blank">${appName}</a>. No respondas directamente a este correo.
                </p>
                <p style="margin:0;">
                  © ${year} ${appName}. Si no esperabas este mensaje, puedes ignorarlo con seguridad.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
