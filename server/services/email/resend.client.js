import { Resend } from "resend";
import { getEmailConfig } from "./config/email.config.js";

/**
 * Cliente Resend singleton. `new Resend(apiKey)` se ejecuta una única vez,
 * de forma perezosa, la primera vez que algo necesita enviar un correo.
 * Nunca se crean instancias adicionales — todo el módulo pasa por acá.
 */
let instance = null;

export function getResendClient() {
  if (!instance) {
    const { apiKey } = getEmailConfig();
    instance = new Resend(apiKey);
  }
  return instance;
}

/** Solo para tests: fuerza la recreación del cliente en la próxima llamada. */
export function resetResendClient() {
  instance = null;
}
