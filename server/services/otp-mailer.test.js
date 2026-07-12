import { config } from "../config.js";
import { sendStepUpOtp } from "./otp-mailer.js";
import { emailService } from "./email/index.js";

jest.mock("./email/index.js", () => ({
  emailService: { sendOTP: jest.fn() },
}));

const originalProvider = config.otpEmailProvider;

afterEach(() => {
  config.otpEmailProvider = originalProvider;
  jest.clearAllMocks();
});

describe("sendStepUpOtp", () => {
  test("rechaza recipients faltantes o sin @ sin llamar al proveedor", async () => {
    config.otpEmailProvider = "resend";

    await expect(sendStepUpOtp({ toEmail: "", otpCode: "123456", ttlMinutes: 10 })).resolves.toEqual({
      ok: false,
      provider: "resend",
      reason: "missing_recipient",
    });
    await expect(
      sendStepUpOtp({ toEmail: "sin-arroba", otpCode: "123456", ttlMinutes: 10 })
    ).resolves.toMatchObject({ ok: false, reason: "missing_recipient" });
    expect(emailService.sendOTP).not.toHaveBeenCalled();
  });

  test("devuelve provider_not_configured si OTP_EMAIL_PROVIDER no es resend", async () => {
    config.otpEmailProvider = "";

    const result = await sendStepUpOtp({
      toEmail: "user@example.com",
      otpCode: "123456",
      ttlMinutes: 10,
    });

    expect(result).toEqual({ ok: false, provider: "none", reason: "provider_not_configured" });
    expect(emailService.sendOTP).not.toHaveBeenCalled();
  });

  test("envia via emailService.sendOTP con payload normalizado y devuelve messageId", async () => {
    config.otpEmailProvider = "resend";
    emailService.sendOTP.mockResolvedValue({
      ok: true,
      id: "email-1",
      provider: "resend",
      durationMs: 42,
      attempts: 1,
    });

    const result = await sendStepUpOtp({
      toEmail: "  user@example.com  ",
      otpCode: " 123456 ",
      ttlMinutes: 15,
    });

    expect(result).toEqual({ ok: true, provider: "resend", messageId: "email-1" });
    expect(emailService.sendOTP).toHaveBeenCalledWith({
      to: "user@example.com",
      code: "123456",
      ttlMinutes: 15,
    });
  });

  test("ttlMinutes '0' se normaliza a undefined (el template aplica su propio default)", async () => {
    config.otpEmailProvider = "resend";
    emailService.sendOTP.mockResolvedValue({ ok: true, id: null, provider: "resend", durationMs: 1, attempts: 1 });

    await sendStepUpOtp({ toEmail: "user@example.com", otpCode: "123456", ttlMinutes: "0" });

    expect(emailService.sendOTP).toHaveBeenCalledWith({
      to: "user@example.com",
      code: "123456",
      ttlMinutes: undefined,
    });
  });

  test("reporta provider_error con status y detail cuando el proveedor falla", async () => {
    config.otpEmailProvider = "resend";
    emailService.sendOTP.mockResolvedValue({
      ok: false,
      provider: "resend",
      durationMs: 10,
      attempts: 3,
      error: { name: "ResendAPIError", message: "rate limited", status: 429 },
    });

    await expect(
      sendStepUpOtp({ toEmail: "user@example.com", otpCode: "123456", ttlMinutes: 10 })
    ).resolves.toEqual({
      ok: false,
      provider: "resend",
      reason: "provider_error",
      status: 429,
      detail: "rate limited",
    });
  });

  test("degrada a provider_not_configured si emailService.sendOTP lanza (ej. RESEND_API_KEY ausente)", async () => {
    config.otpEmailProvider = "resend";
    emailService.sendOTP.mockRejectedValueOnce(
      new Error("[email.config] Falta la variable de entorno RESEND_API_KEY.")
    );

    await expect(
      sendStepUpOtp({ toEmail: "user@example.com", otpCode: "123456", ttlMinutes: 10 })
    ).resolves.toEqual({
      ok: false,
      provider: "resend",
      reason: "provider_not_configured",
      detail: "[email.config] Falta la variable de entorno RESEND_API_KEY.",
    });
  });
});
