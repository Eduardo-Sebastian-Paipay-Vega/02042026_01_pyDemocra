import { Resend } from "resend";
import { getEmailConfig } from "./config/email.config.ts";

/**
 * Cliente Resend singleton. `new Resend(apiKey)` se ejecuta una única vez,
 * de forma perezosa, la primera vez que algo necesita enviar un correo.
 * Nunca se crean instancias adicionales — todo el módulo pasa por acá.
 */
let instance: Resend | null = null;

export function getResendClient(): Resend {
  if (!instance) {
    const { apiKey } = getEmailConfig();
    instance = new Resend(apiKey);
  }
  return instance;
}

/** Solo para tests: fuerza la recreación del cliente en la próxima llamada. */
export function resetResendClient(): void {
  instance = null;
}
