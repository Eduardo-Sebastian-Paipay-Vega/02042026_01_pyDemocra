import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getReporteFinanciero,
  exportReporteFinanciero,
} from "./reportesFinancieros.service";
import * as transaccionesFinancierasService from "./transaccionesFinancieras.service";

vi.mock("./transaccionesFinancieras.service", () => ({
  listTransaccionesFinancieras: vi.fn(),
}));

describe("Recursos Reportes Financieros Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Network Failures", () => {
    it("TST-ERR-111: getReporteFinanciero propaga error si falla obtener transacciones", async () => {
      vi.mocked(
        transaccionesFinancierasService.listTransaccionesFinancieras
      ).mockRejectedValue(new Error("503 DB Offline"));

      await expect(getReporteFinanciero({})).rejects.toThrow("503 DB Offline");
    });

    it("TST-ERR-112: exportReporteFinanciero propaga error si getReporteFinanciero falla", async () => {
      vi.mocked(
        transaccionesFinancierasService.listTransaccionesFinancieras
      ).mockRejectedValue(new Error("503 DB Offline"));

      await expect(exportReporteFinanciero({})).rejects.toThrow("503 DB Offline");
    });
  });
});
