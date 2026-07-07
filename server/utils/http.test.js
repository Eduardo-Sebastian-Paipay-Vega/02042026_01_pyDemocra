import { getBearerToken, sendError, sendUnexpectedError, parseBoolean, clamp } from "./http.js";

function createMockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("getBearerToken", () => {
  test("extrae el token de un header Authorization Bearer valido", () => {
    const req = { headers: { authorization: "Bearer abc123" } };
    expect(getBearerToken(req)).toBe("abc123");
  });

  test("recorta espacios alrededor del token", () => {
    const req = { headers: { authorization: "Bearer   abc123  " } };
    expect(getBearerToken(req)).toBe("abc123");
  });

  test("null si no hay header authorization", () => {
    const req = { headers: {} };
    expect(getBearerToken(req)).toBeNull();
  });

  test("null si el header no empieza con 'Bearer '", () => {
    const req = { headers: { authorization: "Basic abc123" } };
    expect(getBearerToken(req)).toBeNull();
  });

  test("null si el header es un string vacio", () => {
    const req = { headers: { authorization: "" } };
    expect(getBearerToken(req)).toBeNull();
  });
});

describe("sendError", () => {
  test("responde con el codigo de estado y el payload de error explicado", () => {
    const res = createMockRes();
    sendError(res, 401, "IAM-004");

    expect(res.status).toHaveBeenCalledWith(401);
    const payload = res.json.mock.calls[0][0];
    expect(payload.error_code).toBe("IAM-004");
    expect(payload.error_type).toBe("security");
  });

  test("permite sobreescribir error_type y agregar campos extra", () => {
    const res = createMockRes();
    sendError(res, 400, "TEN-001", { error_type: "validation", message: "mensaje custom" });

    const payload = res.json.mock.calls[0][0];
    expect(payload.error_type).toBe("validation");
    expect(payload.message).toBe("mensaje custom");
  });

  test("un codigo desconocido conserva su propio valor y usa el mensaje por defecto", () => {
    const res = createMockRes();
    sendError(res, 500, "CODIGO-INEXISTENTE");

    const payload = res.json.mock.calls[0][0];
    expect(payload.error_code).toBe("CODIGO-INEXISTENTE");
    expect(payload.message).toMatch(/No pudimos completar la operacion/);
  });

  test("usa GEN-000 cuando el errorCode es una cadena vacia", () => {
    const res = createMockRes();
    sendError(res, 500, "");

    const payload = res.json.mock.calls[0][0];
    expect(payload.error_code).toBe("GEN-000");
  });
});

describe("sendUnexpectedError", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  test("responde 500 con el mensaje explicado del fallbackCode", () => {
    const res = createMockRes();
    sendUnexpectedError(res, new Error("boom"), "IAM-004");

    expect(res.status).toHaveBeenCalledWith(500);
    const payload = res.json.mock.calls[0][0];
    expect(payload.error_type).toBe("unexpected");
    expect(payload.error_code).toBe("IAM-004");
  });

  test("incluye 'debug' con el mensaje del error fuera de produccion", () => {
    process.env.NODE_ENV = "development";
    const res = createMockRes();
    sendUnexpectedError(res, new Error("detalle interno"));

    const payload = res.json.mock.calls[0][0];
    expect(payload.debug).toBe("detalle interno");
  });

  test("oculta 'debug' en produccion", () => {
    process.env.NODE_ENV = "production";
    const res = createMockRes();
    sendUnexpectedError(res, new Error("detalle interno"));

    const payload = res.json.mock.calls[0][0];
    expect(payload.debug).toBeUndefined();
  });

  test("maneja un error que no es instancia de Error (string plano)", () => {
    process.env.NODE_ENV = "development";
    const res = createMockRes();
    sendUnexpectedError(res, "fallo plano");

    const payload = res.json.mock.calls[0][0];
    expect(payload.debug).toBe("fallo plano");
  });

  test("usa 'unknown' cuando el error es null/undefined", () => {
    process.env.NODE_ENV = "development";
    const res = createMockRes();
    sendUnexpectedError(res, null);

    const payload = res.json.mock.calls[0][0];
    expect(payload.debug).toBe("unknown");
  });

  test("usa IAM-004 como fallbackCode por defecto", () => {
    const res = createMockRes();
    sendUnexpectedError(res, new Error("x"));

    const payload = res.json.mock.calls[0][0];
    expect(payload.error_code).toBe("IAM-004");
  });
});

describe("parseBoolean", () => {
  test.each([
    [true, true],
    [false, false],
    ["1", true],
    ["true", true],
    ["TRUE", true],
    ["yes", true],
    ["y", true],
    ["0", false],
    ["false", false],
    ["no", false],
    ["", false],
  ])("parseBoolean(%p) === %p", (input, expected) => {
    expect(parseBoolean(input)).toBe(expected);
  });

  test("valores no boolean/string (numero, null, undefined, objeto) devuelven false", () => {
    expect(parseBoolean(1)).toBe(false);
    expect(parseBoolean(null)).toBe(false);
    expect(parseBoolean(undefined)).toBe(false);
    expect(parseBoolean({})).toBe(false);
  });
});

describe("clamp", () => {
  test("devuelve el valor si esta dentro del rango", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  test("recorta al minimo si el valor es menor", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  test("recorta al maximo si el valor es mayor", () => {
    expect(clamp(50, 0, 10)).toBe(10);
  });

  test("acepta strings numericos", () => {
    expect(clamp("7", 0, 10)).toBe(7);
  });

  test("devuelve min si el valor no es un numero finito (NaN, string no numerico, Infinity)", () => {
    expect(clamp("abc", 2, 10)).toBe(2);
    expect(clamp(NaN, 2, 10)).toBe(2);
    expect(clamp(Infinity, 2, 10)).toBe(2);
  });
});
