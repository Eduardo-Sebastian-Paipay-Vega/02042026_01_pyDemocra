import { describe, it, expect } from "vitest";
import {
  ID_CARD_FIELD_KEYS,
  ID_CARD_FIELD_LABELS,
  ID_CARD_STATUS_LABELS,
  createDefaultIdCardFields,
  mergeIdCardFieldsWithDefaults,
  generateIdCardCode,
  buildIdCardQrPayload,
  buildIdCardRenderSubject,
} from "./idCardShared";

describe("idCardShared — catálogos de campos", () => {
  it("expone los 5 campos canónicos en orden", () => {
    expect(ID_CARD_FIELD_KEYS).toEqual([
      "foto",
      "nombre",
      "dni",
      "codigo",
      "qr",
    ]);
  });

  it("tiene una etiqueta legible para cada campo", () => {
    for (const key of ID_CARD_FIELD_KEYS) {
      expect(ID_CARD_FIELD_LABELS[key]).toBeTruthy();
    }
    expect(ID_CARD_FIELD_LABELS.dni).toBe("DNI");
  });

  it("mapea los estados de la credencial", () => {
    expect(ID_CARD_STATUS_LABELS.activa).toBe("Activa");
    expect(ID_CARD_STATUS_LABELS.revocada).toBe("Revocada");
    expect(ID_CARD_STATUS_LABELS.expirada).toBe("Expirada");
  });
});

describe("idCardShared — createDefaultIdCardFields", () => {
  it("genera exactamente los 5 campos en el orden esperado", () => {
    const fields = createDefaultIdCardFields(720, 420);
    expect(fields.map((f) => f.fieldKey)).toEqual(ID_CARD_FIELD_KEYS);
  });

  it("posiciona la foto en el padding calculado", () => {
    const fields = createDefaultIdCardFields(720, 420);
    const foto = fields.find((f) => f.fieldKey === "foto")!;
    // padding = max(16, round2(720 * 0.04)) = 28.8
    expect(foto.posX).toBe(28.8);
    expect(foto.posY).toBe(28.8);
    expect(foto.zIndex).toBe(1);
  });

  it("aplica los mínimos de seguridad para dimensiones pequeñas", () => {
    const fields = createDefaultIdCardFields(100, 50);
    // safeWidth se fuerza a 320 → padding = max(16, 12.8) = 16
    const foto = fields.find((f) => f.fieldKey === "foto")!;
    expect(foto.posX).toBe(16);
  });

  it("todos los campos inician sin id persistido", () => {
    const fields = createDefaultIdCardFields(720, 420);
    expect(fields.every((f) => f.id === null)).toBe(true);
  });
});

describe("idCardShared — mergeIdCardFieldsWithDefaults", () => {
  it("rellena con defaults cuando no hay campos guardados", () => {
    const merged = mergeIdCardFieldsWithDefaults([], 720, 420);
    expect(merged.map((f) => f.fieldKey)).toEqual(ID_CARD_FIELD_KEYS);
  });

  it("preserva los valores guardados pero fuerza la etiqueta canónica", () => {
    const saved = [
      {
        id: "field-1",
        fieldKey: "nombre" as const,
        label: "Etiqueta vieja",
        posX: 999,
        posY: 111,
        width: 200,
        height: null,
        fontSize: 40,
        fontFamily: "serif",
        fontWeight: "900",
        colorHex: "#FF0000",
        zIndex: 9,
      },
    ];
    const merged = mergeIdCardFieldsWithDefaults(saved, 720, 420);
    const nombre = merged.find((f) => f.fieldKey === "nombre")!;
    expect(nombre.posX).toBe(999);
    expect(nombre.id).toBe("field-1");
    expect(nombre.label).toBe(ID_CARD_FIELD_LABELS.nombre); // etiqueta re-normalizada
  });

  it("mantiene el orden canónico sin importar el orden de entrada", () => {
    const saved = [
      {
        id: null,
        fieldKey: "qr" as const,
        label: "QR",
        posX: 1,
        posY: 1,
        width: 10,
        height: 10,
        fontSize: null,
        fontFamily: null,
        fontWeight: null,
        colorHex: null,
        zIndex: 2,
      },
    ];
    const merged = mergeIdCardFieldsWithDefaults(saved, 720, 420);
    expect(merged.map((f) => f.fieldKey)).toEqual(ID_CARD_FIELD_KEYS);
  });
});

describe("idCardShared — generateIdCardCode", () => {
  it("respeta el formato VC-####-XXXXXX", () => {
    expect(generateIdCardCode("12345678")).toMatch(/^VC-\d{4}-[0-9A-F]{6}$/);
  });

  it("usa los últimos 4 dígitos del documento", () => {
    expect(generateIdCardCode("12345678")).toMatch(/^VC-5678-/);
  });

  it("rellena con ceros documentos cortos", () => {
    expect(generateIdCardCode("12")).toMatch(/^VC-0012-/);
  });

  it("usa 0000 cuando no hay documento o no tiene dígitos", () => {
    expect(generateIdCardCode(null)).toMatch(/^VC-0000-/);
    expect(generateIdCardCode("abc")).toMatch(/^VC-0000-/);
    expect(generateIdCardCode()).toMatch(/^VC-0000-/);
  });

  it("genera sufijos distintos en llamadas sucesivas", () => {
    const a = generateIdCardCode("1234");
    const b = generateIdCardCode("1234");
    // El sufijo aleatorio hace altamente improbable la colisión.
    expect(a).not.toBe(b);
  });
});

describe("idCardShared — buildIdCardQrPayload", () => {
  it("prefija IDCARD: y normaliza a mayúsculas sin espacios", () => {
    expect(buildIdCardQrPayload("  vc-0012-abc  ")).toBe("IDCARD:VC-0012-ABC");
  });
});

describe("idCardShared — buildIdCardRenderSubject", () => {
  it("aplica placeholders cuando faltan datos", () => {
    const subject = buildIdCardRenderSubject({});
    expect(subject.fullName).toBe("[nombre]");
    expect(subject.documentLabel).toBe("[dni]");
    expect(subject.photoUrl).toBeNull();
    expect(subject.cardCode).toBe("[codigo]");
    expect(subject.qrPayload).toBe(buildIdCardQrPayload("[codigo]"));
  });

  it("recorta y respeta los valores provistos", () => {
    const subject = buildIdCardRenderSubject({
      fullName: "  Ana Pérez  ",
      documentLabel: "  71234567 ",
      photoUrl: " https://x/y.png ",
      cardCode: " vc-1 ",
      qrPayload: " IDCARD:VC-1 ",
    });
    expect(subject.fullName).toBe("Ana Pérez");
    expect(subject.documentLabel).toBe("71234567");
    expect(subject.photoUrl).toBe("https://x/y.png");
    expect(subject.cardCode).toBe("vc-1");
    expect(subject.qrPayload).toBe("IDCARD:VC-1");
  });

  it("cae al payload por defecto cuando qrPayload viene vacío", () => {
    const subject = buildIdCardRenderSubject({ cardCode: "vc-9", qrPayload: "   " });
    expect(subject.qrPayload).toBe(buildIdCardQrPayload("[codigo]"));
  });
});
