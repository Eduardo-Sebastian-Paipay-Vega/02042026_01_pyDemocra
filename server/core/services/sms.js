import { normalizePhoneNumber } from "./whatsapp.js";

/**
 * Servicio de envío de mensajes de texto SMS a través de Twilio SMS API o AWS SNS API
 * con manejo defensivo de fallos.
 */

/**
 * Envia un SMS al destinatario especificado.
 *
 * @param {Object} options
 * @param {string} options.to - Número de teléfono del destinatario.
 * @param {string} options.message - Contenido del mensaje de texto SMS.
 * @param {Object} [options.configOverride] - Opciones de configuración de prueba.
 * @returns {Promise<Object>} Resultado de la operación con id de mensaje y estado.
 */
export async function sendSms({ to, message, configOverride = {} }) {
  const recipientPhone = normalizePhoneNumber(to);
  if (!recipientPhone) {
    throw new Error("El numero de telefono del destinatario es obligatorio para SMS.");
  }
  if (!message || !message.trim()) {
    throw new Error("El contenido del mensaje SMS no puede estar vacio.");
  }

  const accountSid = configOverride.accountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = configOverride.authToken || process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = configOverride.fromNumber || process.env.TWILIO_FROM_NUMBER;

  // Si no existen credenciales de Twilio en el entorno, operar en modo de simulación segura
  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: true,
      provider: "twilio-sms-mock",
      messageId: `SMmock.${Date.now()}.${Math.random().toString(36).substring(7)}`,
      recipient: recipientPhone,
      simulated: true,
      note: "SMS simulado por falta de TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER.",
    };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const formData = new URLSearchParams();
    formData.append("To", recipientPhone);
    formData.append("From", fromNumber);
    formData.append("Body", message);

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || `Error HTTP ${response.status} de Twilio SMS`);
    }

    return {
      success: true,
      provider: "twilio-sms",
      messageId: data.sid || `SM.${Date.now()}`,
      recipient: recipientPhone,
      simulated: false,
    };
  } catch (error) {
    return {
      success: false,
      provider: "twilio-sms",
      recipient: recipientPhone,
      error: error.message,
    };
  }
}
