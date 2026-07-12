import { EmailService, emailService } from "./email.service.ts";
import { resetEmailConfigCache } from "./config/email.config.ts";
import type { IEmailProvider, IEmailLogger, ILogEntry } from "./interfaces.ts";
import type { EmailOptions, EmailSendResult } from "./types.ts";

function makeFakeProvider(result: EmailSendResult): IEmailProvider & { send: jest.Mock } {
  return { send: jest.fn().mockResolvedValue(result) };
}

function makeFakeLogger(): IEmailLogger & { logSend: jest.Mock } {
  return { logSend: jest.fn() };
}

const OK_RESULT: EmailSendResult = {
  ok: true,
  id: "email-123",
  provider: "resend",
  durationMs: 12,
  attempts: 1,
};

beforeAll(() => {
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.APP_NAME = "Democra Test";
  process.env.APP_URL = "https://test.democra.pro";
  resetEmailConfigCache();
});

afterAll(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.APP_NAME;
  delete process.env.APP_URL;
  resetEmailConfigCache();
});

describe("EmailService — despacho común", () => {
  test("valida antes de llamar al provider: destinatario inválido no llega a Resend", async () => {
    const provider = makeFakeProvider(OK_RESULT);
    const logger = makeFakeLogger();
    const service = new EmailService(provider, logger);

    const result = await service.sendCustomEmail({
      to: "no-es-un-correo",
      subject: "Hola",
      html: "<p>Hi</p>",
    });

    expect(result.ok).toBe(false);
    expect(provider.send).not.toHaveBeenCalled();
    expect(logger.logSend).toHaveBeenCalledWith(
      expect.objectContaining({ type: "custom", ok: false, attempts: 0 })
    );
  });

  test("en éxito, delega en el provider y loggea messageId", async () => {
    const provider = makeFakeProvider(OK_RESULT);
    const logger = makeFakeLogger();
    const service = new EmailService(provider, logger);

    const result = await service.sendCustomEmail({
      to: "user@example.com",
      subject: "Hola",
      html: "<p>Hi</p>",
    });

    expect(result).toEqual(OK_RESULT);
    expect(provider.send).toHaveBeenCalledTimes(1);
    expect(logger.logSend).toHaveBeenCalledWith(
      expect.objectContaining({ type: "custom", ok: true, messageId: "email-123" })
    );
  });

  test("en fallo del provider, loggea errorMessage y no lo oculta", async () => {
    const failResult: EmailSendResult = {
      ok: false,
      provider: "resend",
      durationMs: 5,
      attempts: 3,
      error: { name: "ResendAPIError", message: "domain not verified" },
    };
    const provider = makeFakeProvider(failResult);
    const logger = makeFakeLogger();
    const service = new EmailService(provider, logger);

    const result = await service.sendCustomEmail({
      to: "user@example.com",
      subject: "Hola",
      html: "<p>Hi</p>",
    });

    expect(result).toEqual(failResult);
    expect(logger.logSend).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, errorMessage: "domain not verified" })
    );
  });
});

describe("EmailService — métodos de conveniencia", () => {
  function captureOptions(): { provider: IEmailProvider & { send: jest.Mock }; service: EmailService } {
    const provider = makeFakeProvider(OK_RESULT);
    const service = new EmailService(provider, makeFakeLogger());
    return { provider, service };
  }

  test("sendOTP arma un HTML con el código y el TTL", async () => {
    const { provider, service } = captureOptions();
    await service.sendOTP({ to: "user@example.com", code: "482913", ttlMinutes: 5, name: "Ana" });

    const sent = provider.send.mock.calls[0][0] as EmailOptions;
    expect(sent.html).toContain("482913");
    expect(sent.html).toContain("5 minutos");
    expect(sent.text).toContain("482913");
    expect(sent.tags).toEqual({ category: "otp" });
  });

  test("sendVerification incluye el link de verificación", async () => {
    const { provider, service } = captureOptions();
    await service.sendVerification({ to: "user@example.com", verificationUrl: "https://x.test/verify/abc" });

    const sent = provider.send.mock.calls[0][0] as EmailOptions;
    expect(sent.html).toContain("https://x.test/verify/abc");
  });

  test("sendResetPassword incluye el link de reseteo", async () => {
    const { provider, service } = captureOptions();
    await service.sendResetPassword({ to: "user@example.com", resetUrl: "https://x.test/reset/abc" });

    const sent = provider.send.mock.calls[0][0] as EmailOptions;
    expect(sent.html).toContain("https://x.test/reset/abc");
  });

  test("sendWelcome saluda por nombre", async () => {
    const { provider, service } = captureOptions();
    await service.sendWelcome({ to: "user@example.com", name: "Carlos" });

    const sent = provider.send.mock.calls[0][0] as EmailOptions;
    expect(sent.html).toContain("Carlos");
  });

  test("sendInvitation incluye organización e invitador", async () => {
    const { provider, service } = captureOptions();
    await service.sendInvitation({
      to: "user@example.com",
      inviterName: "Lucía",
      organizationName: "ONG Ejemplo",
      invitationUrl: "https://x.test/invite/abc",
    });

    const sent = provider.send.mock.calls[0][0] as EmailOptions;
    expect(sent.html).toContain("Lucía");
    expect(sent.html).toContain("ONG Ejemplo");
  });

  test("sendAlert etiqueta la severidad y la incluye en el asunto", async () => {
    const { provider, service } = captureOptions();
    await service.sendAlert({
      to: "admin@example.com",
      title: "Fallo de sync",
      message: "El job nocturno falló",
      severity: "critical",
    });

    const sent = provider.send.mock.calls[0][0] as EmailOptions;
    expect(sent.subject).toContain("Fallo de sync");
    expect(sent.tags).toMatchObject({ category: "alert", severity: "critical" });
  });

  test("sendNotification incluye botón de acción si se provee actionUrl", async () => {
    const { provider, service } = captureOptions();
    await service.sendNotification({
      to: "user@example.com",
      title: "Nuevo reporte",
      message: "Tu reporte está listo",
      actionUrl: "https://x.test/reports/1",
      actionLabel: "Ver reporte",
    });

    const sent = provider.send.mock.calls[0][0] as EmailOptions;
    expect(sent.html).toContain("https://x.test/reports/1");
    expect(sent.html).toContain("Ver reporte");
  });

  test("sendAudit incluye acción, actor y metadata", async () => {
    const { provider, service } = captureOptions();
    await service.sendAudit({
      to: "admin@example.com",
      actorName: "Pedro",
      action: "eliminó un usuario",
      entity: "usuarios",
      metadata: { usuario_id: "42" },
    });

    const sent = provider.send.mock.calls[0][0] as EmailOptions;
    expect(sent.html).toContain("Pedro");
    expect(sent.html).toContain("eliminó un usuario");
    expect(sent.html).toContain("42");
  });
});

describe("emailService (singleton exportado)", () => {
  test("es una instancia de EmailService", () => {
    expect(emailService).toBeInstanceOf(EmailService);
  });
});
