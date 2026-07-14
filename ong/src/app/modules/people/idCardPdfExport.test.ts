import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IdCardTemplateConfig } from "./idCardTemplateSchema";
import type { IdCardCanvasInput } from "./idCardCanvas";
import type { IdCardRenderSubject } from "./types";

// vi.mock(...) es hoisteado por encima de esta linea, asi que pdfInstance y
// jsPDFCtor deben crearse dentro de vi.hoisted() para poder referenciarlos en
// la factory del mock sin caer en un "Cannot access before initialization".
const { pdfInstance, jsPDFCtor } = vi.hoisted(() => {
  const pdfInstance = {
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    line: vi.fn(),
    addImage: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
    output: vi.fn(),
  };
  // Debe ser una `function` normal (no arrow function): vi.fn() solo puede
  // usarse con `new` si la implementacion subyacente es constructable.
  const jsPDFCtor = vi.fn(function () {
    return pdfInstance;
  });
  return { pdfInstance, jsPDFCtor };
});

vi.mock("jspdf", () => ({
  jsPDF: jsPDFCtor,
}));

vi.mock("./idCardCanvas", () => ({
  renderIdCardCanvas: vi.fn().mockResolvedValue(undefined),
}));

import { renderIdCardCanvas } from "./idCardCanvas";
import { exportIdCardPdf, exportIdCardPdfFromConfig } from "./idCardPdfExport";

function createFakeCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    fillStyle: "",
    font: "",
    textAlign: "left" as CanvasTextAlign,
    textBaseline: "alphabetic" as CanvasTextBaseline,
  };
}

const subject: IdCardRenderSubject = {
  fullName: "Ana Torres",
  documentLabel: "DNI 12345678",
  photoUrl: null,
  cardCode: "VC-1234-abcdef",
  qrPayload: "IDCARD:VC-1234-abcdef",
};

describe("exportIdCardPdf", () => {
  let fakeCtx: ReturnType<typeof createFakeCtx>;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeCtx = createFakeCtx();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(fakeCtx as any);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/png;base64,FAKE"
    );
  });

  const input: IdCardCanvasInput = {
    baseImageUrl: null,
    templateWidth: 1011,
    templateHeight: 638,
    fields: [],
    subject,
  };

  it("usa las opciones por defecto (bleed 3mm, orientacion landscape para CR80) y guarda con el nombre por defecto", async () => {
    const result = await exportIdCardPdf(input, 85.6, 53.98);

    expect(renderIdCardCanvas).toHaveBeenCalledTimes(1);
    expect(jsPDFCtor).toHaveBeenCalledWith({
      orientation: "landscape",
      unit: "mm",
      // 53.98 + 2*3 + 2*(2+5) no da exactamente 73.98 en punto flotante
      // (da 73.97999999999999) — se calcula con la misma expresion que usa
      // el codigo fuente para evitar depender de un literal redondeado.
      format: [85.6 + 2 * 3 + 2 * (2 + 5), 53.98 + 2 * 3 + 2 * (2 + 5)],
    });
    expect(pdfInstance.addImage).toHaveBeenCalledWith(
      "data:image/png;base64,FAKE",
      "PNG",
      10,
      10,
      85.6,
      53.98
    );
    // 4 esquinas x 2 lineas por esquina = 8 marcas de corte
    expect(pdfInstance.line).toHaveBeenCalledTimes(8);
    expect(pdfInstance.save).toHaveBeenCalledWith("credencial.pdf");
    expect(result).toEqual({ pdf: pdfInstance, pages: 1 });
  });

  it("usa orientacion portrait cuando el alto es mayor al ancho", async () => {
    await exportIdCardPdf(input, 53.98, 85.6);

    expect(jsPDFCtor).toHaveBeenCalledWith(
      expect.objectContaining({ orientation: "portrait" })
    );
  });

  it("no guarda el PDF cuando autoDownload es false", async () => {
    await exportIdCardPdf(input, 85.6, 53.98, { autoDownload: false });

    expect(pdfInstance.save).not.toHaveBeenCalled();
  });

  it("respeta el filename y el bleed personalizados", async () => {
    await exportIdCardPdf(input, 85.6, 53.98, {
      filename: "credencial-voluntario",
      bleedMm: 5,
    });

    expect(pdfInstance.save).toHaveBeenCalledWith("credencial-voluntario.pdf");
    // cardOffset = gapMm(2) + lengthMm(5) + bleedMm(5) = 12
    expect(pdfInstance.addImage).toHaveBeenCalledWith(
      "data:image/png;base64,FAKE",
      "PNG",
      12,
      12,
      85.6,
      53.98
    );
  });
});

describe("exportIdCardPdfFromConfig", () => {
  let fakeCtx: ReturnType<typeof createFakeCtx>;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeCtx = createFakeCtx();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(fakeCtx as any);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/png;base64,FAKE"
    );
  });

  function buildConfig(overrides: Partial<IdCardTemplateConfig> = {}): IdCardTemplateConfig {
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
          dimensions: { w_mm: 50 },
          style: {
            font: "Inter, sans-serif",
            size_pt: 12,
            color: "#111827",
            bold: true,
          },
          z_index: 1,
        },
      ],
      ...overrides,
    } as IdCardTemplateConfig;
  }

  it("resuelve los tokens de texto y los dibuja en el canvas con el estilo correcto", async () => {
    const config = buildConfig();

    const result = await exportIdCardPdfFromConfig(
      config,
      { "voluntario.nombre_completo": "Ana Torres" },
      subject
    );

    expect(fakeCtx.fillText).toHaveBeenCalledWith(
      "Ana Torres",
      expect.any(Number),
      expect.any(Number),
      expect.any(Number)
    );
    // ptToPx(12) = round(12 * 300 / 72) = 50; bold, no italic
    expect(fakeCtx.font).toBe("normal bold 50px Inter, sans-serif");
    expect(fakeCtx.fillStyle).toBe("#111827");
    expect(jsPDFCtor).toHaveBeenCalledWith({
      orientation: "landscape",
      unit: "mm",
      // 53.98 + 2*3 + 2*(2+5) no da exactamente 73.98 en punto flotante
      // (da 73.97999999999999) — se calcula con la misma expresion que usa
      // el codigo fuente para evitar depender de un literal redondeado.
      format: [85.6 + 2 * 3 + 2 * (2 + 5), 53.98 + 2 * 3 + 2 * (2 + 5)],
    });
    expect(pdfInstance.addImage).toHaveBeenCalledWith(
      "data:image/png;base64,FAKE",
      "PNG",
      10,
      10,
      85.6,
      53.98
    );
    expect(pdfInstance.save).toHaveBeenCalledWith("credencial.pdf");
    expect(result).toEqual({ pdf: pdfInstance, pages: 1 });
  });

  it("deja el token sin resolver ({{...}}) cuando falta el binding correspondiente", async () => {
    const config = buildConfig();

    await exportIdCardPdfFromConfig(config, {}, subject);

    expect(fakeCtx.fillText).toHaveBeenCalledWith(
      "{{voluntario.nombre_completo}}",
      expect.any(Number),
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("no guarda el PDF cuando autoDownload es false", async () => {
    const config = buildConfig();

    await exportIdCardPdfFromConfig(
      config,
      { "voluntario.nombre_completo": "Ana Torres" },
      subject,
      { autoDownload: false }
    );

    expect(pdfInstance.save).not.toHaveBeenCalled();
  });

  it("dibuja un placeholder de foto cuando la capa dynamic_image de tipo profile_picture no tiene photoUrl", async () => {
    const config = buildConfig({
      layers: [
        {
          id: "layer_foto",
          type: "dynamic_image",
          source: "profile_picture",
          position: { x_mm: 5, y_mm: 5 },
          dimensions: { w_mm: 20, h_mm: 25 },
          z_index: 1,
        },
      ],
    });

    await exportIdCardPdfFromConfig(
      config,
      { "voluntario.nombre_completo": "Ana Torres" },
      { ...subject, photoUrl: null }
    );

    // fillRect se llama 2 veces: 1) fondo blanco del canvas completo
    // (siempre, antes de pintar las capas) y 2) el rectangulo de fondo del
    // placeholder dibujado por drawPhotoPlaceholder.
    expect(fakeCtx.fillRect).toHaveBeenCalledTimes(2);
    expect(fakeCtx.fillText).toHaveBeenCalledWith(
      "AT",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("renderiza la capa qr_code delegando al motor de canvas existente", async () => {
    const config = buildConfig({
      layers: [
        {
          id: "layer_qr",
          type: "dynamic_image",
          source: "qr_code",
          position: { x_mm: 60, y_mm: 30 },
          dimensions: { w_mm: 15, h_mm: 15 },
          z_index: 2,
        },
      ],
    });

    await exportIdCardPdfFromConfig(
      config,
      {},
      { ...subject, qrPayload: "IDCARD:VC-9999" }
    );

    // Una llamada para exportIdCardPdfFromConfig; ninguna via renderCardToPng
    // (ese es exclusivo de exportIdCardPdf), pero drawQrOnCtx si delega a
    // renderIdCardCanvas sobre un canvas temporal.
    expect(renderIdCardCanvas).toHaveBeenCalledTimes(1);
    expect(fakeCtx.drawImage).toHaveBeenCalledTimes(1);
  });
});
