import { sendEmail } from "./email/email.service.js";
import { sendWhatsAppMessage } from "./whatsapp.js";
import { sendSms } from "./sms.js";
import { sendPushNotification } from "./push.js";

/**
 * Orquestador principal de Notificaciones Multicanal.
 * Permite despachar mensajes a través de Email, WhatsApp, SMS o Push FCM
 * de forma unificada y con resiliencia defensiva.
 */

export const SUPPORTED_CHANNELS = ["email", "whatsapp", "sms", "push"];

/**
 * Despacha una notificación al canal solicitado.
 *
 * @param {Object} options
 * @param {('email'|'whatsapp'|'sms'|'push')} options.channel - Canal de entrega solicitado.
 * @param {string} options.recipient - Dirección de correo, teléfono o token de dispositivo.
 * @param {string} [options.subject] - Asunto (utilizado principalmente en Email y Push).
 * @param {string} options.body - Contenido del mensaje.
 * @param {Object} [options.metadata] - Datos adicionales de contexto o plantillas.
 * @param {Object} [options.configOverride] - Opciones de prueba.
 * @returns {Promise<Object>} Resultado unificado del despacho.
 */
export async function dispatchMultichannelNotification({
  channel = "email",
  recipient,
  subject = "Notificacion Democra",
  body,
  metadata = {},
  configOverride = {},
}) {
  const normalizedChannel = String(channel).toLowerCase().trim();

  if (!SUPPORTED_CHANNELS.includes(normalizedChannel)) {
    throw new Error(`Canal de notificacion no soportado: '${channel}'. Canales validos: ${SUPPORTED_CHANNELS.join(", ")}`);
  }

  if (!recipient) {
    throw new Error("El destinatario de la notificacion es obligatorio.");
  }

  try {
    switch (normalizedChannel) {
      case "email": {
        const emailResult = await sendEmail({
          to: recipient,
          subject,
          html: `<p>${body}</p>`,
          text: body,
          configOverride,
        });
        return {
          success: emailResult.ok ?? true,
          channel: "email",
          recipient,
          details: emailResult,
        };
      }

      case "whatsapp": {
        const waResult = await sendWhatsAppMessage({
          to: recipient,
          textBody: body,
          templateName: metadata.templateName,
          languageCode: metadata.languageCode,
          components: metadata.components,
          configOverride,
        });
        return {
          success: waResult.success,
          channel: "whatsapp",
          recipient,
          details: waResult,
        };
      }

      case "sms": {
        const smsResult = await sendSms({
          to: recipient,
          message: body,
          configOverride,
        });
        return {
          success: smsResult.success,
          channel: "sms",
          recipient,
          details: smsResult,
        };
      }

      case "push": {
        const pushResult = await sendPushNotification({
          deviceToken: recipient,
          title: subject,
          body,
          dataPayload: metadata.dataPayload || {},
          configOverride,
        });
        return {
          success: pushResult.success,
          channel: "push",
          recipient,
          details: pushResult,
        };
      }

      default:
        throw new Error(`Canal no implementado: ${normalizedChannel}`);
    }
  } catch (error) {
    return {
      success: false,
      channel: normalizedChannel,
      recipient,
      error: error.message,
    };
  }
}
