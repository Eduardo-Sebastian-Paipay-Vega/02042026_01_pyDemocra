/**
 * Servicio de envío de Notificaciones Push a dispositivos móviles y web
 * a través de Firebase Cloud Messaging (FCM HTTP v1) con manejo defensivo.
 */

/**
 * Despacha una notificacion Push a un token de dispositivo FCM.
 *
 * @param {Object} options
 * @param {string} options.deviceToken - Token de registro del dispositivo FCM / WebPush.
 * @param {string} options.title - Título de la notificación push.
 * @param {string} options.body - Cuerpo/texto principal de la notificación.
 * @param {Object} [options.dataPayload] - Datos adjuntos clave-valor en formato JSON.
 * @param {Object} [options.configOverride] - Opciones de configuración de prueba.
 * @returns {Promise<Object>} Resultado del despacho con id de mensaje FCM.
 */
export async function sendPushNotification({
  deviceToken,
  title,
  body,
  dataPayload = {},
  configOverride = {},
}) {
  if (!deviceToken) {
    throw new Error("El token de dispositivo (deviceToken) es obligatorio para notificaciones Push.");
  }
  if (!title || !body) {
    throw new Error("El titulo y cuerpo de la notificacion Push son obligatorios.");
  }

  const serverKey = configOverride.serverKey || process.env.FCM_SERVER_KEY;
  const projectId = configOverride.projectId || process.env.FCM_PROJECT_ID;

  // Si no existen credenciales de FCM en el entorno, operar en modo de simulación
  if (!serverKey && !projectId) {
    return {
      success: true,
      provider: "fcm-push-mock",
      messageId: `projects/fcm-mock/messages/${Date.now()}.${Math.random().toString(36).substring(7)}`,
      deviceToken,
      simulated: true,
      note: "Notificacion Push simulada por falta de FCM_SERVER_KEY / FCM_PROJECT_ID.",
    };
  }

  try {
    const url = projectId
      ? `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`
      : "https://fcm.googleapis.com/fcm/send";

    const payload = projectId
      ? {
          message: {
            token: deviceToken,
            notification: { title, body },
            data: dataPayload,
          },
        }
      : {
          to: deviceToken,
          notification: { title, body },
          data: dataPayload,
        };

    const headers = {
      "Content-Type": "application/json",
    };
    if (serverKey) {
      headers.Authorization = `key=${serverKey}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `Error HTTP ${response.status} de Firebase FCM`);
    }

    return {
      success: true,
      provider: "fcm-push",
      messageId: data.name || data.message_id || `projects/fcm/messages/${Date.now()}`,
      deviceToken,
      simulated: false,
    };
  } catch (error) {
    return {
      success: false,
      provider: "fcm-push",
      deviceToken,
      error: error.message,
    };
  }
}
