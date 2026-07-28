import {
  calculateLevenshteinDistance,
  calculateStringSimilarity,
  extractDocumentText,
  calculateCandidateMatchScore,
} from "./ocr.js";

describe("Modulo M02: Pipeline OCR y Scoring de Candidatos (server/services/ocr.js)", () => {
  describe("Utilidades de Calculo de Similitud de Texto", () => {
    test("calcula distancia de Levenshtein correctamente", () => {
      expect(calculateLevenshteinDistance("Carlos", "Carlos")).toBe(0);
      expect(calculateLevenshteinDistance("Carlos", "Carlo")).toBe(1);
    });

    test("calcula porcentaje de similitud entre cadenas", () => {
      expect(calculateStringSimilarity("72819283", "72819283")).toBe(100);
      expect(calculateStringSimilarity("Juan Perez", "Juan Perez")).toBe(100);
      expect(calculateStringSimilarity("Juan", "Pedro")).toBeLessThan(50);
    });
  });

  describe("Servicio de Extraccion OCR (extractDocumentText)", () => {
    test("extrae texto y datos estructurados usando mock result", async () => {
      const mock = {
        rawText: "REPUBLICA DEL PERU DNI 72819283 JUAN CARLOS PEÑA VERA",
        dni: "72819283",
        firstName: "JUAN CARLOS",
        lastName: "PEÑA VERA",
        confidence: 99.0,
      };

      const result = await extractDocumentText({
        documentSource: "http://example.com/dni.pdf",
        mockOcrResult: mock,
      });

      expect(result.extractedDni).toBe("72819283");
      expect(result.confidence).toBe(99.0);
    });

    test("lanza error si no hay documento ni mock", async () => {
      await expect(extractDocumentText({ documentSource: null })).rejects.toThrow(
        "El documento fuente (URL o Buffer) es obligatorio"
      );
    });
  });

  describe("Motor de Scoring y Reglas de Negocio (calculateCandidateMatchScore)", () => {
    test("aprueba automaticamente (APROBADO_AUTOMATICO) cuando el scoring es >= 95%", () => {
      const candidate = {
        dni: "72819283",
        firstName: "JUAN CARLOS",
        lastName: "PEÑA VERA",
      };
      const ocrData = {
        extractedText: "REPUBLICA DEL PERU DNI 72819283 JUAN CARLOS PEÑA VERA FECHA NAC 1995-05-10",
        extractedDni: "72819283",
      };

      const match = calculateCandidateMatchScore(candidate, ocrData);

      expect(match.totalScore).toBeGreaterThanOrEqual(95);
      expect(match.validationStatus).toBe("APROBADO_AUTOMATICO");
    });

    test("envia a revision manual (REVISION_MANUAL) cuando el scoring esta entre 70% y 94%", () => {
      const candidate = {
        dni: "72819283",
        firstName: "JUAN CARLOS",
        lastName: "RODRIGUEZ VERA", // Apellido paterno diferente
      };
      const ocrData = {
        extractedText: "REPUBLICA DEL PERU DNI 72819283 JUAN CARLOS PEÑA VERA",
        extractedDni: "72819283",
      };

      const match = calculateCandidateMatchScore(candidate, ocrData);

      expect(match.totalScore).toBeGreaterThanOrEqual(70);
      expect(match.totalScore).toBeLessThan(95);
      expect(match.validationStatus).toBe("REVISION_MANUAL");
    });

    test("marca como observado (OBSERVADO) cuando el scoring es menor a 70%", () => {
      const candidate = {
        dni: "11223344", // DNI completamente diferente
        firstName: "MARIA",
        lastName: "GONZALEZ",
      };
      const ocrData = {
        extractedText: "REPUBLICA DEL PERU DNI 72819283 JUAN CARLOS PEÑA VERA",
        extractedDni: "72819283",
      };

      const match = calculateCandidateMatchScore(candidate, ocrData);

      expect(match.totalScore).toBeLessThan(70);
      expect(match.validationStatus).toBe("OBSERVADO");
    });
  });
});
