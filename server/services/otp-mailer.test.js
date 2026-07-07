import { config } from "../config.js";
import { sendStepUpOtp } from "./otp-mailer.js";

const originalFetch = global.fetch;
const originalProvider = config.otpEmailProvider;
const originalApiKey = config.otpResendApiKey;
const originalApiUrl = config.otpResendApiUrl;
const originalFromEmail = config.otpFromEmail;
const originalFromName = config.otpFromName;

afterEach(() => {
  global.fetch = originalFetch;
  config.otpEmailProvider = originalProvider;
  config.otpResendApiKey = originalApiKey;
  config.otpResendApiUrl = originalApiUrl;
  config.otpFromEmail = originalFromEmail;
  config.otpFromName = originalFromName;
  jest.restoreAllMocks();
});

describe("sendStepUpOtp", () => {
  test("rechaza recipients faltantes o sin @ sin llamar al proveedor", async () => {
    global.fetch = jest.fn();
    config.otpEmailProvider = "resend";

    await expect(sendStepUpOtp({ toEmail: "", otpCode: "123456", ttlMinutes: 10 })).resolves.toEqual({
      ok: false,
      provider: "resend",
      reason: "missing_recipient",
    });
    await expect(
      sendStepUpOtp({ toEmail: "sin-arroba", otpCode: "123456", ttlMinutes: 10 })
    ).resolves.toMatchObject({ ok: false, reason: "missing_recipient" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("devuelve provider_not_configured si no hay proveedor configurado", async () => {
    config.otpEmailProvider = "";

    const result = await sendStepUpOtp({
      toEmail: "user@example.com",
      otpCode: "123456",
      ttlMinutes: 10,
    });

    expect(result).toEqual({
      ok: false,
      provider: "none",
      reason: "provider_not_configured",
    });
  });

  test("devuelve provider_not_configured para resend sin apiKey o from", async () => {
    config.otpEmailProvider = "resend";
    config.otpResendApiKey = "";
    config.otpFromEmail = "security@example.com";

    await expect(
      sendStepUpOtp({ toEmail: "user@example.com", otpCode: "123456", ttlMinutes: 10 })
    ).resolves.toMatchObject({ ok: false, provider: "resend", reason: "provider_not_configured" });

    config.otpResendApiKey = "rk_test";
    config.otpFromEmail = "";

    await expect(
      sendStepUpOtp({ toEmail: "user@example.com", otpCode: "123456", ttlMinutes: 10 })
    ).resolves.toMatchObject({ ok: false, provider: "resend", reason: "provider_not_configured" });
  });

  test("envia por Resend con payload seguro y devuelve messageId", async () => {
    config.otpEmailProvider = "resend";
    config.otpResendApiKey = "rk_test";
    config.otpResendApiUrl = "https://api.resend.test/emails";
    config.otpFromEmail = " security@example.com ";
    config.otpFromName = "";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: "email-1" }),
    });

    const result = await sendStepUpOtp({
      toEmail: "  user@example.com  ",
      otpCode: " 123456 ",
      ttlMinutes: "0",
    });

    expect(result).toEqual({ ok: true, provider: "resend", messageId: "email-1" });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.resend.test/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer rk_test" }),
      })
    );
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.from).toBe("Solaris Security <security@example.com>");
    expect(body.to).toEqual(["user@example.com"]);
    expect(body.html).toContain("123456");
    expect(body.html).toContain("10 minutos");
  });

  test("reporta provider_error usando message o error.message del proveedor", async () => {
    config.otpEmailProvider = "resend";
    config.otpResendApiKey = "rk_test";
    config.otpFromEmail = "security@example.com";
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ message: "rate limited" }),
    });

    await expect(
      sendStepUpOtp({ toEmail: "user@example.com", otpCode: "123456", ttlMinutes: 10 })
    ).resolves.toMatchObject({
      ok: false,
      provider: "resend",
      reason: "provider_error",
      status: 429,
      detail: "rate limited",
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: { message: "smtp down" } }),
    });

    await expect(
      sendStepUpOtp({ toEmail: "user@example.com", otpCode: "123456", ttlMinutes: 10 })
    ).resolves.toMatchObject({ detail: "smtp down" });
  });

  test("maneja respuestas vacias, JSON invalido y errores de red", async () => {
    config.otpEmailProvider = "resend";
    config.otpResendApiKey = "rk_test";
    config.otpFromEmail = "security@example.com";
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    });

    await expect(
      sendStepUpOtp({ toEmail: "user@example.com", otpCode: "123456", ttlMinutes: 10 })
    ).resolves.toEqual({ ok: true, provider: "resend", messageId: null });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 502,
      text: async () => "not-json",
    });

    await expect(
      sendStepUpOtp({ toEmail: "user@example.com", otpCode: "123456", ttlMinutes: 10 })
    ).resolves.toMatchObject({ ok: false, detail: null });

    global.fetch = jest.fn().mockRejectedValueOnce(new Error("network down"));

    await expect(
      sendStepUpOtp({ toEmail: "user@example.com", otpCode: "123456", ttlMinutes: 10 })
    ).rejects.toThrow("network down");
  });
});
