/**
 * Punto de entrada público del módulo de email. Todo consumidor externo
 * (rutas, servicios de negocio) importa desde acá — nunca directamente de
 * `email.service.js` ni de los templates internos.
 *
 * Uso:
 *   import { emailService } from "../services/email/index.js";
 *   await emailService.sendOTP({ to, code, ttlMinutes });
 */
export { emailService, EmailService } from "./email.service.js";
export { getEmailConfig, loadEmailConfig, resetEmailConfigCache } from "./config/email.config.js";
export { getResendClient, resetResendClient } from "./resend.client.js";
export { EmailValidationError, isValidEmail, isRetryableError } from "./utils.js";
