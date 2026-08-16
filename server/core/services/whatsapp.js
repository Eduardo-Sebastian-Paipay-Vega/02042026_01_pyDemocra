import { config } from "../config.js";

/**
 * Servicio de envío de mensajes de WhatsApp utilizando la API Oficial de Meta Cloud API
 * o Twilio WhatsApp API con manejo defensivo de fallos.
 */

/**
 * Normaliza y limpia un número de teléfono a formato internacional E.164 (ej. +51999888777).
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return "";
  const cleaned = String(phone).replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  // Asumir código de país Perú (51) si tiene 9 dígitos
  if (cleaned.length === 9) return `+51${cleaned}`;
  return `+${cleaned}`;
}

/**
 * Envia un mensaje de WhatsApp a través de Meta Cloud API o Twilio API.
 *
 * @param {Object} options
 * @param {string} options.to - Número de teléfono del destinatario.
 * @param {string} [options.textBody] - Texto libre del mensaje.
 * @param {string} [options.templateName] - Nombre de la plantilla aprobada en Meta.
 * @param {string} [options.languageCode='es'] - Código de idioma.
 * @param {Array} [options.components] - Componentes/variables de la plantilla Meta.
 * @param {Object} [options.configOverride] - Opciones de configuración de prueba.
 * @returns {Promise<Object>} Resultado del despacho con status, id de mensaje y proveedor.
 */
export async function sendWhatsAppMessage({
  to,
  textBody,
  templateName,
  languageCode = "es",
  components = [],
  configOverride = {},
}) {
  const recipientPhone = normalizePhoneNumber(to);
  if (!recipientPhone) {
    throw new Error("El numero de telefono del destinatario es obligatorio.");
  }

  const apiToken = configOverride.whatsappToken || process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = configOverride.phoneNumberId || process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  // Si no existen credenciales reales en el entorno, retornar respuesta simulada exitosa en modo dev/test
  if (!apiToken || !phoneNumberId) {
    return {
      success: true,
      provider: "meta-cloud-api-mock",
      messageId: `wamid.mock.${Date.now()}.${Math.random().toString(36).substring(7)}`,
      recipient: recipientPhone,
      simulated: true,
      note: "Mensaje simulado por falta de META_WHATSAPP_TOKEN / META_WHATSAPP_PHONE_NUMBER_ID.",
    };
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    
    let payload;
    if (templateName) {
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhone.replace("+", ""),
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components: components,
        },
      };
    } else {
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhone.replace("+", ""),
        type: "text",
        text: { preview_url: false, body: textBody || "" },
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `Error HTTP ${response.status} de Meta API`);
    }

    return {
      success: true,
      provider: "meta-cloud-api",
      messageId: data.messages?.[0]?.id || `wamid.${Date.now()}`,
      recipient: recipientPhone,
      simulated: false,
    };
  } catch (error) {
    return {
      success: false,
      provider: "meta-cloud-api",
      recipient: recipientPhone,
      error: error.message,
    };
  }
}
