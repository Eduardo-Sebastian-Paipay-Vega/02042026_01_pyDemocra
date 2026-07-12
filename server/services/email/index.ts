/**
 * Punto de entrada público del módulo de email. Todo consumidor externo
 * (rutas, servicios de negocio) importa desde acá — nunca directamente de
 * `email.service.ts` ni de los templates internos.
 *
 * Uso:
 *   import { emailService } from "../services/email/index.ts";
 *   await emailService.sendOTP({ to, code, ttlMinutes });
 */
export { emailService, EmailService } from "./email.service.ts";
export { getEmailConfig, loadEmailConfig, resetEmailConfigCache } from "./config/email.config.ts";
export { getResendClient, resetResendClient } from "./resend.client.ts";
export { EmailValidationError, isValidEmail, isRetryableError } from "./utils.ts";

export type {
  EmailOptions,
  EmailRecipient,
  EmailAttachment,
  EmailSendResult,
  EmailErrorInfo,
  OTPEmailData,
  VerificationEmailData,
  ResetPasswordEmailData,
  WelcomeEmailData,
  InvitationEmailData,
  AlertEmailData,
  AlertSeverity,
  NotificationEmailData,
  AuditEmailData,
} from "./types.ts";

export type { IEmailProvider, IEmailLogger, ILogEntry } from "./interfaces.ts";
