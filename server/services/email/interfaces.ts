import type { EmailOptions, EmailSendResult } from "./types.ts";

/**
 * Abstracción del proveedor de envío (Dependency Inversion — SOLID). `EmailService`
 * depende de esta interfaz, no del SDK de Resend directamente, lo que permite
 * inyectar un fake/mock en tests o cambiar de proveedor sin tocar `EmailService`.
 */
export interface IEmailProvider {
  send(options: EmailOptions): Promise<EmailSendResult>;
}

export interface ILogEntry {
  type: string;
  recipient: string;
  ok: boolean;
  durationMs: number;
  attempts: number;
  messageId?: string;
  errorMessage?: string;
}

/** Abstracción de logging — inyectable para redirigir a un logger real (Winston/Pino) sin tocar EmailService. */
export interface IEmailLogger {
  logSend(entry: ILogEntry): void;
}
