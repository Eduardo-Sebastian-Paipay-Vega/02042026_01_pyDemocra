import { sendWhatsAppMessage } from "./whatsapp.js";
import { sendSms } from "./sms.js";
import { sendPushNotification } from "./push.js";
import { dispatchMultichannelNotification } from "./notifications-dispatcher.js";

describe("Modulo M09: Notificaciones Multicanal (server/services/)", () => {
  describe("Adaptador de WhatsApp (whatsapp.js)", () => {
    test("envia mensaje de texto simulado de forma defensiva sin credenciales", async () => {
      const result = await sendWhatsAppMessage({
        to: "999888777",
        textBody: "Hola Voluntario Democra",
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe("meta-cloud-api-mock");
      expect(result.recipient).toBe("+51999888777");
    });

    test("lanza error si no se proporciona destinatario", async () => {
      await expect(sendWhatsAppMessage({ to: "" })).rejects.toThrow(
        "El numero de telefono del destinatario es obligatorio."
      );
    });
  });

  describe("Servicio de SMS (sms.js)", () => {
    test("envia SMS simulado en modo dev/test", async () => {
      const result = await sendSms({
        to: "+51987654321",
        message: "Tu codigo de verificacion es 123456",
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe("twilio-sms-mock");
      expect(result.recipient).toBe("+51987654321");
    });

    test("lanza error si el contenido del SMS esta vacio", async () => {
      await expect(
        sendSms({ to: "+51987654321", message: "" })
      ).rejects.toThrow("El contenido del mensaje SMS no puede estar vacio.");
    });
  });

  describe("Servicio de Push Notifications FCM (push.js)", () => {
    test("envia Notificacion Push simulada", async () => {
      const result = await sendPushNotification({
        deviceToken: "fcm-token-12345-abcde",
        title: "Recordatorio de Evento",
        body: "Mañana inicia la jornada de voluntariado a las 8:00 AM",
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe("fcm-push-mock");
      expect(result.deviceToken).toBe("fcm-token-12345-abcde");
    });

    test("lanza error si falta el token de dispositivo", async () => {
      await expect(
        sendPushNotification({ deviceToken: "", title: "Test", body: "Test" })
      ).rejects.toThrow("El token de dispositivo (deviceToken) es obligatorio");
    });
  });

  describe("Orquestador Multicanal (notifications-dispatcher.js)", () => {
    test("despacha correctamente notificaciones por WhatsApp, SMS y Push", async () => {
      const resWa = await dispatchMultichannelNotification({
        channel: "whatsapp",
        recipient: "987654321",
        body: "Alerta de Voluntariado",
      });
      expect(resWa.success).toBe(true);
      expect(resWa.channel).toBe("whatsapp");

      const resSms = await dispatchMultichannelNotification({
        channel: "sms",
        recipient: "987654321",
        body: "Alerta SMS Democra",
      });
      expect(resSms.success).toBe(true);
      expect(resSms.channel).toBe("sms");

      const resPush = await dispatchMultichannelNotification({
        channel: "push",
        recipient: "device-token-xyz",
        subject: "Nueva Actividad",
        body: "Se te ha asignado una actividad",
      });
      expect(resPush.success).toBe(true);
      expect(resPush.channel).toBe("push");
    });

    test("retorna error para canales no soportados", async () => {
      await expect(
        dispatchMultichannelNotification({
          channel: "telegram",
          recipient: "user",
          body: "test",
        })
      ).rejects.toThrow("Canal de notificacion no soportado: 'telegram'");
    });
  });
});
