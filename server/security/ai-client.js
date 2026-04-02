import { config } from "../config.js";

const extractFirstJson = (content) => {
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch {
    const match = String(content).match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

export const requestAiJson = async ({ systemPrompt, userPrompt, maxTokens = 500 }) => {
  if (!config.openAiApiKey) {
    return null;
  }

  const endpoint = `${config.openAiBaseUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: config.openAiModel,
      temperature: 0.1,
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  return extractFirstJson(content);
};

export const summarizeForensicEvent = async ({ event, constraints }) => {
  const result = await requestAiJson({
    systemPrompt:
      "Eres un copiloto forense de seguridad SaaS multi-tenant. Resume hechos, no inventes datos. No reveles secretos ni PII sensible.",
    userPrompt: JSON.stringify({ event, constraints }),
    maxTokens: 400,
  });

  if (!result) {
    return {
      summary:
        "Resumen forense generado por reglas: se registro la decision con evidencias y codigos de motivo.",
      reasoning:
        "La decision se baso en reglas deterministicas de riesgo, MFA y concurrencia de licencias.",
      confidence: 0.55,
    };
  }

  return {
    summary: result.summary || "Sin resumen IA disponible.",
    reasoning: result.reasoning || "Sin razonamiento adicional.",
    confidence:
      typeof result.confidence === "number"
        ? Math.max(0, Math.min(1, result.confidence))
        : 0.6,
  };
};

export const explainRiskDecisionWithAi = async ({
  event,
  baseScore,
  reasonCodes,
  rawSignals,
}) => {
  const result = await requestAiJson({
    systemPrompt:
      "Actua como analista de riesgo IAM. Devuelve JSON con adjustment (entero entre -10 y 10), user_message corto y extra_reason_codes (array). No autorices escalado de privilegios.",
    userPrompt: JSON.stringify({ event, baseScore, reasonCodes, rawSignals }),
    maxTokens: 300,
  });

  if (!result) {
    return {
      adjustment: 0,
      user_message:
        "Detectamos senales de seguridad y aplicaremos validaciones adicionales para proteger tu cuenta.",
      extra_reason_codes: [],
    };
  }

  const adjustment = Number.isFinite(result.adjustment)
    ? Math.max(-10, Math.min(10, Math.round(result.adjustment)))
    : 0;

  return {
    adjustment,
    user_message:
      result.user_message ||
      "Detectamos senales de seguridad y aplicaremos validaciones adicionales para proteger tu cuenta.",
    extra_reason_codes: Array.isArray(result.extra_reason_codes)
      ? result.extra_reason_codes.map((code) => String(code))
      : [],
  };
};