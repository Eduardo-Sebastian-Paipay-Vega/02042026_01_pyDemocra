import { getResendClient } from "./resend.client.ts";
import { getEmailConfig } from "./config/email.config.ts";
import type { IEmailProvider, IEmailLogger } from "./interfaces.ts";
import { consoleEmailLogger, validateEmailOptions, withRetry, normalizeRecipients } from "./utils.ts";
import type {
  EmailOptions,
  EmailSendResult,
  EmailErrorInfo,
  OTPEmailData,
  VerificationEmailData,
  ResetPasswordEmailData,
  WelcomeEmailData,
  InvitationEmailData,
  AlertEmailData,
  NotificationEmailData,
  AuditEmailData,
} from "./types.ts";
import { renderOtpEmail } from "./templates/otp.ts";
import { renderVerificationEmail } from "./templates/verification.ts";
import { renderResetPasswordEmail } from "./templates/resetPassword.ts";
import { renderWelcomeEmail } from "./templates/welcome.ts";
import { renderInvitationEmail } from "./templates/invitation.ts";
import { renderAlertEmail } from "./templates/alert.ts";
import { renderNotificationEmail } from "./templates/notification.ts";
import { renderAuditEmail } from "./templates/audit.ts";

function toErrorInfo(error: unknown): EmailErrorInfo {
  if (error instanceof Error) {
    const withResponse = error as Error & { statusCode?: number; status?: number; response?: unknown };
    return {
      name: error.name,
      message: error.message,
      status: withResponse.statusCode ?? withResponse.status,
      stack: error.stack,
      response: withResponse.response,
    };
  }
  return { name: "UnknownError", message: String(error) };
}

/**
 * Adaptador Resend → IEmailProvider. El SDK de Resend no lanza en errores de
 * la API (los devuelve en `{ error }`); acá se normalizan ambos casos
 * (rechazo de la promesa y `{ error }` en la respuesta) a un único shape.
 */
class ResendEmailProvider implements IEmailProvider {
  async send(options: EmailOptions): Promise<EmailSendResult> {
    const started = Date.now();
    const { fromName, fromEmail, replyTo, maxRetries, retryBaseDelayMs } = getEmailConfig();
    const client = getResendClient();

    let attemptsMade = 0;
    const sendOnce = async (): Promise<{ id: string }> => {
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
        const err = new Error(error.message) as Error & { name: string; status?: number };
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
  private readonly provider: IEmailProvider;
  private readonly logger: IEmailLogger;

  constructor(provider: IEmailProvider = new ResendEmailProvider(), logger: IEmailLogger = consoleEmailLogger) {
    this.provider = provider;
    this.logger = logger;
  }

  /**
   * Punto único de envío: valida, delega en el provider (que ya reintenta
   * internamente) y registra el resultado. Todos los métodos `send*` pasan
   * por acá — es el único lugar que sabe validar/loggear.
   */
  private async dispatch(type: string, options: EmailOptions): Promise<EmailSendResult> {
    const started = Date.now();
    const recipient = normalizeRecipients(options.to).join(", ");

    try {
      validateEmailOptions(options);
    } catch (error) {
      const durationMs = Date.now() - started;
      const result: EmailSendResult = {
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
        errorMessage: result.ok ? undefined : result.error.message,
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

  sendOTP(data: OTPEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderOtpEmail(data);
    return this.dispatch("otp", { to: data.to, subject, html, text, tags: { category: "otp" } });
  }

  sendVerification(data: VerificationEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderVerificationEmail(data);
    return this.dispatch("verification", { to: data.to, subject, html, text, tags: { category: "verification" } });
  }

  sendResetPassword(data: ResetPasswordEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderResetPasswordEmail(data);
    return this.dispatch("reset_password", { to: data.to, subject, html, text, tags: { category: "reset_password" } });
  }

  sendWelcome(data: WelcomeEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderWelcomeEmail(data);
    return this.dispatch("welcome", { to: data.to, subject, html, text, tags: { category: "welcome" } });
  }

  sendInvitation(data: InvitationEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderInvitationEmail(data);
    return this.dispatch("invitation", { to: data.to, subject, html, text, tags: { category: "invitation" } });
  }

  sendAlert(data: AlertEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderAlertEmail(data);
    return this.dispatch("alert", { to: data.to, subject, html, text, tags: { category: "alert", severity: data.severity ?? "warning" } });
  }

  sendNotification(data: NotificationEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderNotificationEmail(data);
    return this.dispatch("notification", { to: data.to, subject, html, text, tags: { category: "notification" } });
  }

  /**
   * Correos administrativos/de auditoría. También sirve como base natural
   * para "confirmaciones de operación" y correos transaccionales ad-hoc:
   * arma un AuditEmailData con la acción realizada.
   */
  sendAudit(data: AuditEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderAuditEmail(data);
    return this.dispatch("audit", { to: data.to, subject, html, text, tags: { category: "audit" } });
  }

  /**
   * Vía de escape para cualquier correo que no encaje en los tipos con
   * nombre — nuevos tipos de correo NO requieren tocar esta clase: se agrega
   * un archivo en `templates/` y, si se quiere un método de conveniencia, un
   * wrapper de una línea como los de arriba (Open/Closed).
   */
  sendCustomEmail(options: EmailOptions): Promise<EmailSendResult> {
    return this.dispatch("custom", options);
  }
}

/** Instancia lista para usar en el resto del backend — no crear más instancias de EmailService. */
export const emailService = new EmailService();
