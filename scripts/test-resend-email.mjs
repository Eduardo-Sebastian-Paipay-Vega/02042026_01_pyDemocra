/**
 * Prueba manual del envío de correo vía Resend. Uso:
 *   node scripts/test-resend-email.mjs [email-destino]
 *
 * Lee RESEND_API_KEY (y el resto de config de email) desde .env — falla con
 * un error claro si la key no está configurada o es un placeholder.
 */
import "dotenv/config";
import { emailService } from "../server/services/email/index.js";

const to = process.argv[2] || "paipayvegabastian@gmail.com";

const result = await emailService.sendNotification({
  to,
  title: "Prueba de envío — Democra",
  message:
    "Este es un correo de prueba para verificar la integración con Resend. " +
    "Si lo recibiste, el envío de notificaciones está funcionando correctamente.",
});

if (result.ok) {
  console.log(`OK — correo enviado a ${to}. id=${result.id} attempts=${result.attempts} durationMs=${result.durationMs}`);
} else {
  console.error(`FALLÓ el envío a ${to}:`, result.error);
  process.exitCode = 1;
}
