import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IdCardTemplateConfig } from "./idCardTemplateSchema";
import type { IdCardRenderSubject } from "./types";
import {
  BATCH_CLIENT_LIMIT,
  batchPreflightCheck,
  generateIdCardBatch,
  type BatchCardInput,
} from "./idCardBatch";

// NOTA: el camino "cliente" de generateIdCardBatch (<= BATCH_CLIENT_LIMIT
// tarjetas) invoca todo el pipeline real de canvas + jsPDF + varios imports
// dinamicos (idCardPdfExport, idCardUnits, idCardCanvas, idCardTemplateSchema,
// idCardShared). Mockear ese camino de punta a punta seria muy fragil sin
// poder ejecutar y verificar iterativamente, asi que aqui solo se cubre:
// - batchPreflightCheck (logica pura de agregacion).
// - La validacion de lista vacia.
// - El camino "servidor" (> BATCH_CLIENT_LIMIT tarjetas), que solo depende de
//   fetch, mockeable de forma segura.

function buildConfig(): IdCardTemplateConfig {
  return {
    template_metadata: {
      name: "CR80",
      canvas_size: { width_mm: 85.6, height_mm: 53.98 },
      bleed_mm: 3,
    },
    layers: [
      {
        id: "layer_nombre",
        type: "text",
        content: "{{voluntario.nombre_completo}}",
        position: { x_mm: 5, y_mm: 5 },
        style: { font: "Inter", size_pt: 12, color: "#111827" },
      },
    ],
  } as IdCardTemplateConfig;
}

function buildCard(overrides: Partial<BatchCardInput> = {}): BatchCardInput {
  const subject: IdCardRenderSubject = {
    fullName: "Ana Torres",
    documentLabel: "DNI 12345678",
    photoUrl: null,
    cardCode: "VC-1234-abcdef",
    qrPayload: "IDCARD:VC-1234-abcdef",
  };

  return {
    bindings: { "voluntario.nombre_completo": "Ana Torres" },
    subject,
    ...overrides,
  };
}

describe("BATCH_CLIENT_LIMIT", () => {
  it("es 20", () => {
    expect(BATCH_CLIENT_LIMIT).toBe(20);
  });
});

describe("batchPreflightCheck", () => {
  it("reporta 0 fallos cuando todas las tarjetas tienen sus bindings completos", () => {
    const config = buildConfig();
    const cards = [buildCard(), buildCard()];

    const report = batchPreflightCheck(config, cards);

    expect(report).toEqual({ passed: 2, failed: 0, issues: [] });
  });

  it("reporta las tarjetas con tokens faltantes junto a su indice", () => {
    const config = buildConfig();
    const cards = [
      buildCard(),
      buildCard({ bindings: {} }),
      buildCard({ bindings: {} }),
    ];

    const report = batchPreflightCheck(config, cards);

    expect(report.passed).toBe(1);
    expect(report.failed).toBe(2);
    // preflightCheck no devuelve el token crudo sino la etiqueta humana
    // definida en TEMPLATE_VARIABLES (p.ej. "Nombre completo" para el token
    // "voluntario.nombre_completo").
    expect(report.issues).toEqual([
      { index: 1, missing: expect.arrayContaining(["Nombre completo"]) },
      { index: 2, missing: expect.arrayContaining(["Nombre completo"]) },
    ]);
  });

  it("devuelve un reporte vacio para una lista vacia de tarjetas", () => {
    const report = batchPreflightCheck(buildConfig(), []);

    expect(report).toEqual({ passed: 0, failed: 0, issues: [] });
  });
});

describe("generateIdCardBatch - validacion y despacho al servidor", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lanza error si la lista de tarjetas esta vacia", async () => {
    await expect(
      generateIdCardBatch(buildConfig(), [], "tenant-1")
    ).rejects.toThrow("La lista de credenciales a generar está vacía.");

    global.fetch = originalFetch;
  });

  it("despacha un job al backend cuando hay mas tarjetas que BATCH_CLIENT_LIMIT", async () => {
    const cards = Array.from({ length: BATCH_CLIENT_LIMIT + 1 }, () => buildCard());
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ jobId: "job-123" }),
    });
    global.fetch = fetchMock as any;

    const result = await generateIdCardBatch(buildConfig(), cards, "tenant-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/id-cards/batch-generate",
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual({
      kind: "server",
      jobId: "job-123",
      count: BATCH_CLIENT_LIMIT + 1,
    });

    global.fetch = originalFetch;
  });

  it("propaga un error si el despacho al backend falla", async () => {
    const cards = Array.from({ length: BATCH_CLIENT_LIMIT + 1 }, () => buildCard());
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });
    global.fetch = fetchMock as any;

    await expect(
      generateIdCardBatch(buildConfig(), cards, "tenant-1")
    ).rejects.toThrow("Batch job dispatch failed (500): Internal Server Error");

    global.fetch = originalFetch;
  });
});
