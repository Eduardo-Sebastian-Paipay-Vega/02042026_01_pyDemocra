import { getResendClient } from "./resend.client.js";
import { getEmailConfig } from "./config/email.config.js";
import { consoleEmailLogger, validateEmailOptions, withRetry, normalizeRecipients } from "./utils.js";
import { renderOtpEmail } from "./templates/otp.js";
import { renderVerificationEmail } from "./templates/verification.js";
import { renderResetPasswordEmail } from "./templates/resetPassword.js";
import { renderWelcomeEmail } from "./templates/welcome.js";
import { renderInvitationEmail } from "./templates/invitation.js";
import { renderAlertEmail } from "./templates/alert.js";
import { renderNotificationEmail } from "./templates/notification.js";
import { renderAuditEmail } from "./templates/audit.js";

function toErrorInfo(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      status: error.statusCode ?? error.status,
      stack: error.stack,
      response: error.response,
    };
  }
  return { name: "UnknownError", message: String(error) };
}

/**
 * Adaptador Resend → IEmailProvider. El SDK de Resend no lanza en errores de
 * la API (los devuelve en `{ error }`); acá se normalizan ambos casos
 * (rechazo de la promesa y `{ error }` en la respuesta) a un único shape.
 */
class ResendEmailProvider {
  async send(options) {
    const started = Date.now();
    const { fromName, fromEmail, replyTo, maxRetries, retryBaseDelayMs } = getEmailConfig();
    const client = getResendClient();

    let attemptsMade = 0;
    const sendOnce = async () => {
      attemptsMade += 1;
      const { data, error } = await client.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo ?? replyTo ?? undefined,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
        tags: options.tags
          ? Object.entries(options.tags).map(([name, value]) => ({ name, value }))
          : undefined,
      });

      if (error) {
        const err = new Error(error.message);
        err.name = error.name || "ResendAPIError";
        throw err;
      }

      return { id: data?.id ?? "" };
    };

    try {
      const { result, attempts } = await withRetry(sendOnce, { maxRetries, baseDelayMs: retryBaseDelayMs });
      return { ok: true, id: result.id, provider: "resend", durationMs: Date.now() - started, attempts };
    } catch (error) {
      return {
        ok: false,
        provider: "resend",
        durationMs: Date.now() - started,
        attempts: attemptsMade,
        error: toErrorInfo(error),
      };
    }
  }
}

export class EmailService {
  constructor(provider = new ResendEmailProvider(), logger = consoleEmailLogger) {
    this.provider = provider;
    this.logger = logger;
  }

  /**
   * Punto único de envío: valida, delega en el provider (que ya reintenta
   * internamente) y registra el resultado. Todos los métodos `send*` pasan
   * por acá — es el único lugar que sabe validar/loggear.
   */
  async dispatch(type, options) {
    const started = Date.now();
    const recipient = normalizeRecipients(options.to).join(", ");

    try {
      validateEmailOptions(options);
    } catch (error) {
      const durationMs = Date.now() - started;
      const result = {
        ok: false,
        provider: "resend",
        durationMs,
        attempts: 0,
        error: toErrorInfo(error),
      };
      this.logger.logSend({
        type,
        recipient,
        ok: false,
        durationMs,
        attempts: 0,
        errorMessage: result.error.message,
      });
      return result;
    }

    const result = await this.provider.send(options);

    this.logger.logSend({
      type,
      recipient,
      ok: result.ok,
      durationMs: result.durationMs,
      attempts: result.attempts,
      messageId: result.ok ? result.id : undefined,
      errorMessage: result.ok ? undefined : result.error.message,
    });

    return result;
  }

  sendOTP(data) {
    const { subject, html, text } = renderOtpEmail(data);
    return this.dispatch("otp", { to: data.to, subject, html, text, tags: { category: "otp" } });
  }

  sendVerification(data) {
    const { subject, html, text } = renderVerificationEmail(data);
    return this.dispatch("verification", { to: data.to, subject, html, text, tags: { category: "verification" } });
  }

  sendResetPassword(data) {
    const { subject, html, text } = renderResetPasswordEmail(data);
    return this.dispatch("reset_password", { to: data.to, subject, html, text, tags: { category: "reset_password" } });
  }

  sendWelcome(data) {
    const { subject, html, text } = renderWelcomeEmail(data);
    return this.dispatch("welcome", { to: data.to, subject, html, text, tags: { category: "welcome" } });
  }

  sendInvitation(data) {
    const { subject, html, text } = renderInvitationEmail(data);
    return this.dispatch("invitation", { to: data.to, subject, html, text, tags: { category: "invitation" } });
  }

  sendAlert(data) {
    const { subject, html, text } = renderAlertEmail(data);
    return this.dispatch("alert", { to: data.to, subject, html, text, tags: { category: "alert", severity: data.severity ?? "warning" } });
  }

  sendNotification(data) {
    const { subject, html, text } = renderNotificationEmail(data);
    return this.dispatch("notification", { to: data.to, subject, html, text, tags: { category: "notification" } });
  }

  /**
   * Correos administrativos/de auditoría. También sirve como base natural
   * para "confirmaciones de operación" y correos transaccionales ad-hoc:
   * arma un AuditEmailData con la acción realizada.
   */
  sendAudit(data) {
    const { subject, html, text } = renderAuditEmail(data);
    return this.dispatch("audit", { to: data.to, subject, html, text, tags: { category: "audit" } });
  }

  /**
   * Vía de escape para cualquier correo que no encaje en los tipos con
   * nombre — nuevos tipos de correo NO requieren tocar esta clase: se agrega
   * un archivo en `templates/` y, si se quiere un método de conveniencia, un
   * wrapper de una línea como los de arriba (Open/Closed).
   */
  sendCustomEmail(options) {
    return this.dispatch("custom", options);
  }
}

/** Instancia lista para usar en el resto del backend — no crear más instancias de EmailService. */
export const emailService = new EmailService();
