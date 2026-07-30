import { loadEmailConfig, getEmailConfig, resetEmailConfigCache } from "./email.config.js";

const ENV_KEYS = [
  "RESEND_API_KEY",
  "EMAIL_FROM_NAME",
  "EMAIL_FROM_ADDRESS",
  "OTP_FROM_NAME",
  "OTP_FROM_EMAIL",
  "EMAIL_REPLY_TO",
  "APP_NAME",
  "APP_URL",
  "APP_LOGO_URL",
  "EMAIL_MAX_RETRIES",
  "EMAIL_RETRY_BASE_DELAY_MS",
  "MFA_OTP_TTL_MINUTES",
];

const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
  resetEmailConfigCache();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
  resetEmailConfigCache();
});

describe("loadEmailConfig", () => {
  test("lanza un error descriptivo si RESEND_API_KEY falta", () => {
    delete process.env.RESEND_API_KEY;
    expect(() => loadEmailConfig()).toThrow(/RESEND_API_KEY/);
  });

  test("lanza si RESEND_API_KEY está vacía o solo espacios", () => {
    process.env.RESEND_API_KEY = "   ";
    expect(() => loadEmailConfig()).toThrow(/RESEND_API_KEY/);
  });

  test("carga con defaults cuando solo RESEND_API_KEY está seteada", () => {
    process.env.RESEND_API_KEY = "re_test_123";
    delete process.env.EMAIL_FROM_NAME;
    delete process.env.OTP_FROM_NAME;
    delete process.env.EMAIL_FROM_ADDRESS;
    delete process.env.OTP_FROM_EMAIL;
    delete process.env.APP_URL;

    const cfg = loadEmailConfig();

    expect(cfg.apiKey).toBe("re_test_123");
    expect(cfg.fromName).toBe("Democra");
    expect(cfg.fromEmail).toBe("onboarding@resend.dev");
    expect(cfg.appUrl).toBe("https://www.democra.pro");
    expect(cfg.logoUrl).toBe("https://www.democra.pro/brand/d-core-monogram.png");
    expect(cfg.maxRetries).toBe(3);
    expect(cfg.retryBaseDelayMs).toBe(300);
  });

  test("EMAIL_FROM_NAME/EMAIL_FROM_ADDRESS tienen prioridad sobre OTP_FROM_NAME/OTP_FROM_EMAIL", () => {
    process.env.RESEND_API_KEY = "re_test_123";
    process.env.OTP_FROM_NAME = "Legacy Name";
    process.env.OTP_FROM_EMAIL = "legacy@example.com";
    process.env.EMAIL_FROM_NAME = "New Name";
    process.env.EMAIL_FROM_ADDRESS = "new@example.com";

    const cfg = loadEmailConfig();

    expect(cfg.fromName).toBe("New Name");
    expect(cfg.fromEmail).toBe("new@example.com");
  });

  test("cae a OTP_FROM_NAME/OTP_FROM_EMAIL si no hay EMAIL_FROM_*", () => {
    process.env.RESEND_API_KEY = "re_test_123";
    delete process.env.EMAIL_FROM_NAME;
    delete process.env.EMAIL_FROM_ADDRESS;
    process.env.OTP_FROM_NAME = "Legacy Name";
    process.env.OTP_FROM_EMAIL = "legacy@example.com";

    const cfg = loadEmailConfig();

    expect(cfg.fromName).toBe("Legacy Name");
    expect(cfg.fromEmail).toBe("legacy@example.com");
  });

  test("ignora valores no numéricos o negativos en EMAIL_MAX_RETRIES", () => {
    process.env.RESEND_API_KEY = "re_test_123";
    process.env.EMAIL_MAX_RETRIES = "not-a-number";
    expect(loadEmailConfig().maxRetries).toBe(3);

    process.env.EMAIL_MAX_RETRIES = "-5";
    expect(loadEmailConfig().maxRetries).toBe(3);

    process.env.EMAIL_MAX_RETRIES = "7";
    expect(loadEmailConfig().maxRetries).toBe(7);
  });
});

describe("getEmailConfig", () => {
  test("cachea el resultado tras la primera carga", () => {
    process.env.RESEND_API_KEY = "re_first";
    const first = getEmailConfig();

    process.env.RESEND_API_KEY = "re_second";
    const second = getEmailConfig();

    expect(second).toBe(first);
    expect(second.apiKey).toBe("re_first");
  });

  test("resetEmailConfigCache fuerza una relectura", () => {
    process.env.RESEND_API_KEY = "re_first";
    getEmailConfig();

    resetEmailConfigCache();
    process.env.RESEND_API_KEY = "re_second";

    expect(getEmailConfig().apiKey).toBe("re_second");
  });
});
