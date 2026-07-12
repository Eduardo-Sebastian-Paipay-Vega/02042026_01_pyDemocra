import {
  isValidEmail,
  normalizeRecipients,
  validateEmailOptions,
  EmailValidationError,
  isRetryableError,
  withRetry,
  escapeHtml,
} from "./utils.js";

describe("isValidEmail", () => {
  test.each([
    ["user@example.com", true],
    ["  user@example.com  ", true],
    ["user+tag@sub.example.com", true],
    ["no-arroba", false],
    ["", false],
    ["@example.com", false],
    ["user@", false],
    [null as unknown as string, false],
  ])("isValidEmail(%p) -> %p", (input: string, expected: boolean) => {
    expect(isValidEmail(input)).toBe(expected);
  });
});

describe("normalizeRecipients", () => {
  test("envuelve un string en un array", () => {
    expect(normalizeRecipients("a@example.com")).toEqual(["a@example.com"]);
  });

  test("deja un array intacto", () => {
    expect(normalizeRecipients(["a@example.com", "b@example.com"])).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });
});

describe("validateEmailOptions", () => {
  const base = { to: "user@example.com", subject: "Hola", html: "<p>Hi</p>" };

  test("no lanza con un payload válido", () => {
    expect(() => validateEmailOptions(base)).not.toThrow();
  });

  test("lanza EmailValidationError si falta el destinatario", () => {
    expect(() => validateEmailOptions({ ...base, to: [] })).toThrow(EmailValidationError);
  });

  test("lanza si el destinatario es inválido", () => {
    expect(() => validateEmailOptions({ ...base, to: "no-es-un-correo" })).toThrow(
      /Destinatario inválido/
    );
  });

  test("lanza si cc/bcc tienen un correo inválido", () => {
    expect(() => validateEmailOptions({ ...base, cc: "malo" })).toThrow(/cc/);
    expect(() => validateEmailOptions({ ...base, bcc: ["ok@example.com", "malo"] })).toThrow(/bcc/);
  });

  test("lanza si falta subject o html", () => {
    expect(() => validateEmailOptions({ ...base, subject: "" })).toThrow(/asunto/);
    expect(() => validateEmailOptions({ ...base, html: "" })).toThrow(/HTML/);
  });
});

describe("isRetryableError", () => {
  test("EmailValidationError nunca es reintentable", () => {
    expect(isRetryableError(new EmailValidationError("x"))).toBe(false);
  });

  test.each([429, 500, 502, 503, 504])("status %d es reintentable", (status: number) => {
    expect(isRetryableError({ status })).toBe(true);
  });

  test.each([400, 401, 403, 404, 422])("status %d NO es reintentable", (status: number) => {
    expect(isRetryableError({ status })).toBe(false);
  });

  test("errores de red (sin status) son reintentables", () => {
    expect(isRetryableError(new Error("fetch failed"))).toBe(true);
    expect(isRetryableError({ name: "TimeoutError", message: "timeout" })).toBe(true);
  });

  test("errores desconocidos sin status ni patrón de red no son reintentables", () => {
    expect(isRetryableError(new Error("algo raro pasó"))).toBe(false);
  });
});

describe("withRetry", () => {
  test("devuelve el resultado si la primera llamada tiene éxito", async () => {
    const fn = jest.fn().mockResolvedValue("ok");
    const { result, attempts } = await withRetry(fn, { maxRetries: 3, baseDelayMs: 1 });
    expect(result).toBe("ok");
    expect(attempts).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("reintenta ante error transitorio y eventualmente tiene éxito", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockRejectedValueOnce({ status: 429 })
      .mockResolvedValueOnce("ok");

    const { result, attempts } = await withRetry(fn, { maxRetries: 5, baseDelayMs: 1 });

    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });

  test("no reintenta ante un error permanente", async () => {
    const fn = jest.fn().mockRejectedValue({ status: 400 });

    await expect(withRetry(fn, { maxRetries: 5, baseDelayMs: 1 })).rejects.toEqual({ status: 400 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("se detiene tras agotar maxRetries y relanza el último error", async () => {
    const fn = jest.fn().mockRejectedValue({ status: 500 });

    await expect(withRetry(fn, { maxRetries: 3, baseDelayMs: 1 })).rejects.toEqual({ status: 500 });
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe("escapeHtml", () => {
  test("escapa &, <, >, \"", () => {
    expect(escapeHtml(`<b>"a & b"</b>`)).toBe("&lt;b&gt;&quot;a &amp; b&quot;&lt;/b&gt;");
  });

  test("tolera undefined/null", () => {
    expect(escapeHtml(undefined as unknown as string)).toBe("");
  });
});
