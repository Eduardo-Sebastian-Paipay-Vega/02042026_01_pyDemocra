import { config } from "../config.js";
import {
  requestAiJson,
  summarizeForensicEvent,
  explainRiskDecisionWithAi,
} from "./ai-client.js";

const originalFetch = global.fetch;
const originalApiKey = config.openAiApiKey;
const originalBaseUrl = config.openAiBaseUrl;
const originalModel = config.openAiModel;

afterEach(() => {
  global.fetch = originalFetch;
  config.openAiApiKey = originalApiKey;
  config.openAiBaseUrl = originalBaseUrl;
  config.openAiModel = originalModel;
  jest.restoreAllMocks();
});

describe("requestAiJson", () => {
  test("null si no hay openAiApiKey configurada (no llama a fetch)", async () => {
    config.openAiApiKey = "";
    global.fetch = jest.fn();

    const result = await requestAiJson({ systemPrompt: "s", userPrompt: "u" });

    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("null si la respuesta HTTP no es ok", async () => {
    config.openAiApiKey = "sk-test";
    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    const result = await requestAiJson({ systemPrompt: "s", userPrompt: "u" });

    expect(result).toBeNull();
  });

  test("propaga errores de red de fetch sin hacer llamadas reales", async () => {
    config.openAiApiKey = "sk-test";
    global.fetch = jest.fn().mockRejectedValue(new Error("network down"));

    await expect(requestAiJson({ systemPrompt: "s", userPrompt: "u" })).rejects.toThrow(
      "network down"
    );
  });

  test("parsea JSON directo del contenido del mensaje", async () => {
    config.openAiApiKey = "sk-test";
    config.openAiBaseUrl = "https://api.openai.com/v1";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ summary: "ok" }) } }],
      }),
    });

    const result = await requestAiJson({ systemPrompt: "s", userPrompt: "u" });

    expect(result).toEqual({ summary: "ok" });
    const [endpoint] = global.fetch.mock.calls[0];
    expect(endpoint).toBe("https://api.openai.com/v1/chat/completions");
  });

  test("recorta la barra final de openAiBaseUrl al construir el endpoint", async () => {
    config.openAiApiKey = "sk-test";
    config.openAiBaseUrl = "https://api.openai.com/v1/";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "{}" } }] }),
    });

    await requestAiJson({ systemPrompt: "s", userPrompt: "u" });

    const [endpoint] = global.fetch.mock.calls[0];
    expect(endpoint).toBe("https://api.openai.com/v1/chat/completions");
  });

  test("extrae el primer bloque JSON si el contenido trae texto alrededor", async () => {
    config.openAiApiKey = "sk-test";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Aqui esta: {"summary":"extraido"} gracias' } }],
      }),
    });

    const result = await requestAiJson({ systemPrompt: "s", userPrompt: "u" });

    expect(result).toEqual({ summary: "extraido" });
  });

  test("null si el bloque extraido por regex tampoco es JSON valido", async () => {
    config.openAiApiKey = "sk-test";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "prefijo {esto no es json valido} sufijo" } }],
      }),
    });

    const result = await requestAiJson({ systemPrompt: "s", userPrompt: "u" });

    expect(result).toBeNull();
  });

  test("null si el contenido no tiene JSON parseable en absoluto", async () => {
    config.openAiApiKey = "sk-test";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "texto sin json" } }] }),
    });

    const result = await requestAiJson({ systemPrompt: "s", userPrompt: "u" });

    expect(result).toBeNull();
  });

  test("null si no hay contenido en la respuesta", async () => {
    config.openAiApiKey = "sk-test";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    });

    const result = await requestAiJson({ systemPrompt: "s", userPrompt: "u" });

    expect(result).toBeNull();
  });
});

describe("summarizeForensicEvent", () => {
  test("devuelve el resumen basado en reglas cuando no hay IA disponible", async () => {
    config.openAiApiKey = "";

    const result = await summarizeForensicEvent({ event: {}, constraints: {} });

    expect(result.confidence).toBe(0.55);
    expect(result.summary).toMatch(/reglas/);
  });

  test("usa el resultado de la IA cuando esta disponible, con defaults para campos faltantes", async () => {
    config.openAiApiKey = "sk-test";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ confidence: 0.9 }) } }],
      }),
    });

    const result = await summarizeForensicEvent({ event: {}, constraints: {} });

    expect(result.summary).toBe("Sin resumen IA disponible.");
    expect(result.reasoning).toBe("Sin razonamiento adicional.");
    expect(result.confidence).toBe(0.9);
  });

  test("recorta confidence al rango [0,1]", async () => {
    config.openAiApiKey = "sk-test";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ confidence: 5 }) } }],
      }),
    });

    const result = await summarizeForensicEvent({ event: {}, constraints: {} });
    expect(result.confidence).toBe(1);
  });

  test("usa 0.6 de confidence si el campo no es numero", async () => {
    config.openAiApiKey = "sk-test";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ summary: "x" }) } }],
      }),
    });

    const result = await summarizeForensicEvent({ event: {}, constraints: {} });
    expect(result.confidence).toBe(0.6);
  });
});

describe("explainRiskDecisionWithAi", () => {
  test("devuelve el fallback cuando no hay IA disponible", async () => {
    config.openAiApiKey = "";

    const result = await explainRiskDecisionWithAi({
      event: {},
      baseScore: 10,
      reasonCodes: [],
      rawSignals: {},
    });

    expect(result.adjustment).toBe(0);
    expect(result.extra_reason_codes).toEqual([]);
    expect(result.user_message).toMatch(/senales de seguridad/);
  });

  test("usa el ajuste de la IA, recortado a [-10,10] y redondeado", async () => {
    config.openAiApiKey = "sk-test";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ adjustment: 15.6 }) } }],
      }),
    });

    const result = await explainRiskDecisionWithAi({
      event: {},
      baseScore: 10,
      reasonCodes: [],
      rawSignals: {},
    });

    expect(result.adjustment).toBe(10);
  });

  test("usa 0 de ajuste si el campo no es un numero finito", async () => {
    config.openAiApiKey = "sk-test";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ adjustment: "no-numero" }) } }],
      }),
    });

    const result = await explainRiskDecisionWithAi({
      event: {},
      baseScore: 10,
      reasonCodes: [],
      rawSignals: {},
    });

    expect(result.adjustment).toBe(0);
  });

  test("normaliza extra_reason_codes a strings y usa [] si no es array", async () => {
    config.openAiApiKey = "sk-test";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({ adjustment: 2, extra_reason_codes: [1, "TWO"] }),
            },
          },
        ],
      }),
    });

    const result = await explainRiskDecisionWithAi({
      event: {},
      baseScore: 10,
      reasonCodes: [],
      rawSignals: {},
    });

    expect(result.extra_reason_codes).toEqual(["1", "TWO"]);
  });

  test("usa el user_message por defecto si la IA no devuelve uno", async () => {
    config.openAiApiKey = "sk-test";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ adjustment: 1 }) } }],
      }),
    });

    const result = await explainRiskDecisionWithAi({
      event: {},
      baseScore: 10,
      reasonCodes: [],
      rawSignals: {},
    });

    expect(result.user_message).toMatch(/senales de seguridad/);
  });
});
