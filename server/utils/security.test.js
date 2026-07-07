import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import {
  nowIso,
  getClientIp,
  getClientCountry,
  maskIp,
  maskEmail,
  hashOtp,
  generateOtpCode,
  safeCompare,
  verifyPinHash,
  sanitizeUserAgent,
  buildRetentionUntil,
  normalizePermissionCandidates,
} from "./security.js";

describe("nowIso", () => {
  test("devuelve un string ISO 8601 valido", () => {
    const value = nowIso();
    expect(new Date(value).toISOString()).toBe(value);
  });
});

describe("getClientIp", () => {
  test("usa el primer valor de x-forwarded-for cuando es un string con varias IPs", () => {
    const req = { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" }, socket: {} };
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  test("usa el primer elemento cuando x-forwarded-for es un array", () => {
    const req = { headers: { "x-forwarded-for": ["9.9.9.9", "1.1.1.1"] }, socket: {} };
    expect(getClientIp(req)).toBe("9.9.9.9");
  });

  test("cae a req.socket.remoteAddress si no hay x-forwarded-for", () => {
    const req = { headers: {}, socket: { remoteAddress: "10.0.0.1" } };
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  test("null si no hay ningun dato de IP disponible", () => {
    const req = { headers: {}, socket: {} };
    expect(getClientIp(req)).toBeNull();
  });

  test("null si req.socket es undefined", () => {
    const req = { headers: {} };
    expect(getClientIp(req)).toBeNull();
  });
});

describe("getClientCountry", () => {
  test("prioriza x-vercel-ip-country", () => {
    const req = {
      headers: { "x-vercel-ip-country": "PE", "cf-ipcountry": "US", "x-country-code": "AR" },
    };
    expect(getClientCountry(req)).toBe("PE");
  });

  test("cae a cf-ipcountry si no hay x-vercel-ip-country", () => {
    const req = { headers: { "cf-ipcountry": "US", "x-country-code": "AR" } };
    expect(getClientCountry(req)).toBe("US");
  });

  test("cae a x-country-code como ultimo recurso", () => {
    const req = { headers: { "x-country-code": "AR" } };
    expect(getClientCountry(req)).toBe("AR");
  });

  test("null si no hay ningun header de pais", () => {
    const req = { headers: {} };
    expect(getClientCountry(req)).toBeNull();
  });
});

describe("maskIp", () => {
  test("enmascara el ultimo octeto de una IPv4", () => {
    expect(maskIp("192.168.1.55")).toBe("192.168.1.0");
  });

  test("enmascara una IPv6 dejando los primeros 4 grupos", () => {
    expect(maskIp("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe("2001:0db8:85a3:0000::");
  });

  test("null si no se pasa IP", () => {
    expect(maskIp(null)).toBeNull();
    expect(maskIp("")).toBeNull();
  });

  test("'masked' si el formato no es reconocible como IPv4 ni IPv6", () => {
    expect(maskIp("no-es-una-ip")).toBe("masked");
  });

  test("'masked' si una IPv4 no tiene exactamente 4 partes", () => {
    expect(maskIp("1.2.3")).toBe("masked");
  });
});

describe("maskEmail", () => {
  test("enmascara dejando los primeros 2 caracteres del usuario", () => {
    expect(maskEmail("eduardo@example.com")).toBe("ed***@example.com");
  });

  test("usuario de 1-2 caracteres: deja solo el primero", () => {
    expect(maskEmail("ab@example.com")).toBe("a***@example.com");
  });

  test("null si no se pasa email", () => {
    expect(maskEmail(null)).toBeNull();
    expect(maskEmail("")).toBeNull();
  });

  test("'***' si el email no tiene la forma usuario@dominio", () => {
    expect(maskEmail("no-es-un-email")).toBe("***");
  });
});

describe("hashOtp", () => {
  test("es determinista para los mismos inputs", () => {
    const a = hashOtp({ code: "123456", userId: "u1", tenantId: "t1" });
    const b = hashOtp({ code: "123456", userId: "u1", tenantId: "t1" });
    expect(a).toBe(b);
    expect(a).toHaveLength(64); // sha256 hex
  });

  test("cambia si cambia cualquier input", () => {
    const a = hashOtp({ code: "123456", userId: "u1", tenantId: "t1" });
    const b = hashOtp({ code: "654321", userId: "u1", tenantId: "t1" });
    expect(a).not.toBe(b);
  });
});

describe("generateOtpCode", () => {
  test("genera un codigo de 6 digitos, rellenado con ceros a la izquierda", () => {
    const spy = jest.spyOn(crypto, "randomInt").mockReturnValue(42);
    expect(generateOtpCode()).toBe("000042");
    spy.mockRestore();
  });

  test("sin mock, siempre produce un string de exactamente 6 caracteres numericos", () => {
    for (let i = 0; i < 20; i += 1) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });
});

describe("safeCompare", () => {
  test("true si ambos valores son iguales", () => {
    expect(safeCompare("secreto", "secreto")).toBe(true);
  });

  test("false si son diferentes con la misma longitud", () => {
    expect(safeCompare("aaaaaa", "bbbbbb")).toBe(false);
  });

  test("false si tienen longitudes distintas (sin llamar timingSafeEqual)", () => {
    expect(safeCompare("corto", "unstringmaslargo")).toBe(false);
  });

  test("trata null/undefined como string vacio", () => {
    expect(safeCompare(null, undefined)).toBe(true);
    expect(safeCompare(null, "x")).toBe(false);
  });
});

describe("verifyPinHash", () => {
  test("false si no hay pinHash", async () => {
    expect(await verifyPinHash({ pin: "1234", pinHash: null })).toBe(false);
  });

  test("usa bcrypt.compare si el hash empieza con $2a$", async () => {
    const hash = bcrypt.hashSync("1234", bcrypt.genSaltSync(4)).replace("$2b$", "$2a$");
    expect(await verifyPinHash({ pin: "1234", pinHash: hash })).toBe(true);
    expect(await verifyPinHash({ pin: "0000", pinHash: hash })).toBe(false);
  });

  test("usa bcrypt.compare si el hash empieza con $2b$", async () => {
    const hash = bcrypt.hashSync("5678", bcrypt.genSaltSync(4));
    expect(await verifyPinHash({ pin: "5678", pinHash: hash })).toBe(true);
  });

  test("usa comparacion sha256 si el hash tiene el prefijo 'sha256:'", async () => {
    const digest = crypto.createHash("sha256").update("9999").digest("hex");
    expect(await verifyPinHash({ pin: "9999", pinHash: `sha256:${digest}` })).toBe(true);
    expect(await verifyPinHash({ pin: "0000", pinHash: `sha256:${digest}` })).toBe(false);
  });

  test("cae a comparacion directa (safeCompare) para cualquier otro formato de hash", async () => {
    expect(await verifyPinHash({ pin: "plano", pinHash: "plano" })).toBe(true);
    expect(await verifyPinHash({ pin: "plano", pinHash: "otro" })).toBe(false);
  });
});

describe("sanitizeUserAgent", () => {
  test("null si no se pasa userAgent", () => {
    expect(sanitizeUserAgent(null)).toBeNull();
    expect(sanitizeUserAgent("")).toBeNull();
  });

  test("recorta a 240 caracteres", () => {
    const long = "a".repeat(300);
    expect(sanitizeUserAgent(long)).toHaveLength(240);
  });

  test("deja intacto un user agent corto", () => {
    expect(sanitizeUserAgent("Mozilla/5.0")).toBe("Mozilla/5.0");
  });
});

describe("buildRetentionUntil", () => {
  test("por defecto suma 180 dias a la fecha actual", () => {
    const now = new Date();
    const result = new Date(buildRetentionUntil());
    const diffDays = Math.round((result - now) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(180);
  });

  test("acepta una cantidad de dias personalizada", () => {
    const now = new Date();
    const result = new Date(buildRetentionUntil(30));
    const diffDays = Math.round((result - now) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });
});

describe("normalizePermissionCandidates", () => {
  test("array vacio si no se pasa nada", () => {
    expect(normalizePermissionCandidates(null)).toEqual([]);
    expect(normalizePermissionCandidates("")).toEqual([]);
    expect(normalizePermissionCandidates("   ")).toEqual([]);
  });

  test("devuelve el permiso tal cual si no tiene el prefijo 'perm.'", () => {
    expect(normalizePermissionCandidates("settings.roles.read")).toEqual([
      "settings.roles.read",
    ]);
  });

  test("devuelve ambas variantes (con y sin prefijo) si tiene 'perm.'", () => {
    expect(normalizePermissionCandidates("perm.settings.roles.read")).toEqual([
      "perm.settings.roles.read",
      "settings.roles.read",
    ]);
  });

  test("recorta espacios antes de evaluar", () => {
    expect(normalizePermissionCandidates("  settings.roles.read  ")).toEqual([
      "settings.roles.read",
    ]);
  });
});
