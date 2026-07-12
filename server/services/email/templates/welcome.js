import { renderLayout, renderButton } from "./layout.js";
import { escapeHtml } from "../utils.js";
import { getEmailConfig } from "../config/email.config.js";

export function renderWelcomeEmail(data) {
  const { appName, appUrl } = getEmailConfig();
  const loginUrl = data.loginUrl ?? appUrl;
  const name = escapeHtml(data.name);

  const bodyHtml = `
    <p style="margin:0 0 16px;">Hola ${name},</p>
    <p style="margin:0 0 20px;">Tu cuenta en ${escapeHtml(appName)} quedó creada. Ya puedes iniciar sesión y comenzar a usar la plataforma.</p>
    ${renderButton("Iniciar sesión", loginUrl)}
    <p style="margin:20px 0 0;">Si tienes dudas sobre los primeros pasos, responde a este mensaje o contacta a tu administrador.</p>
  `;

  return {
    subject: `Bienvenido a ${appName}`,
    html: renderLayout({ previewText: `Tu cuenta en ${appName} está lista`, bodyHtml }),
    text: [
      `Hola ${data.name},`,
      "",
      `Tu cuenta en ${appName} quedó creada. Inicia sesión aquí: ${loginUrl}`,
    ].join("\n"),
  };
}
