/** Tipos públicos del módulo de email. */

export type EmailRecipient = string | string[];

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

/** Payload genérico — lo que finalmente se envía a través del proveedor. */
export interface EmailOptions {
  to: EmailRecipient;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: EmailRecipient;
  bcc?: EmailRecipient;
  attachments?: EmailAttachment[];
  /** Etiquetas para tracking/analytics en el dashboard de Resend. */
  tags?: Record<string, string>;
}

export interface EmailErrorInfo {
  name: string;
  message: string;
  status?: number;
  stack?: string;
  response?: unknown;
}

export type EmailSendResult =
  | {
      ok: true;
      id: string;
      provider: "resend";
      durationMs: number;
      attempts: number;
    }
  | {
      ok: false;
      provider: "resend";
      durationMs: number;
      attempts: number;
      error: EmailErrorInfo;
    };

// ── Payloads por tipo de correo ─────────────────────────────────────────────
// Cada uno es la entrada de su template (server/services/email/templates/*) y
// del método de conveniencia correspondiente en EmailService.

export interface OTPEmailData {
  to: string;
  code: string;
  name?: string;
  ttlMinutes?: number;
}

export interface VerificationEmailData {
  to: string;
  verificationUrl: string;
  name?: string;
  expiresInHours?: number;
}

export interface ResetPasswordEmailData {
  to: string;
  resetUrl: string;
  name?: string;
  expiresInMinutes?: number;
}

export interface WelcomeEmailData {
  to: string;
  name: string;
  loginUrl?: string;
}

export interface InvitationEmailData {
  to: string;
  inviterName: string;
  organizationName: string;
  invitationUrl: string;
  role?: string;
  expiresInDays?: number;
}

export type AlertSeverity = "info" | "warning" | "critical";

export interface AlertEmailData {
  to: EmailRecipient;
  title: string;
  message: string;
  severity?: AlertSeverity;
  detailsUrl?: string;
}

export interface NotificationEmailData {
  to: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
}

export interface AuditEmailData {
  to: EmailRecipient;
  actorName: string;
  action: string;
  entity?: string;
  occurredAt?: string;
  metadata?: Record<string, string | number | boolean>;
}
