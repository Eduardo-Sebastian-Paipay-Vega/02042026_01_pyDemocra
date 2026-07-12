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

  describe("HAPPY PATH: calculos financieros", () => {
    function makeRow(overrides: Partial<any> = {}) {
      return {
        id: "trx-1",
        accountId: "acc-1",
        accountName: "Caja Chica",
        categoryId: "cat-1",
        categoryName: "Donaciones",
        typeCode: "ingreso",
        typeName: "Ingreso",
        typeKind: "ingreso",
        amount: 100,
        rawDate: "2026-01-01",
        description: "",
        registeredBy: "Ana",
        projectId: null,
        projectName: "-",
        approvalStateName: "-",
        approvalComment: "",
        ...overrides,
      };
    }

    it("TST-ERR-271: calcula totalIncome, totalExpense y net correctamente (con redondeo a 2 decimales)", async () => {
      vi.mocked(transaccionesFinancierasService.listTransaccionesFinancieras).mockResolvedValue({
        rows: [
          makeRow({ id: "1", typeKind: "ingreso", amount: 100.111 }),
          makeRow({ id: "2", typeKind: "ingreso", amount: 50.005 }),
          makeRow({ id: "3", typeKind: "egreso", amount: 30.004 }),
        ],
        total: 3,
        warnings: [],
      } as any);

      const report = await getReporteFinanciero({});

      expect(report.totals.totalIncome).toBeCloseTo(150.12, 2);
      expect(report.totals.totalExpense).toBeCloseTo(30, 2);
      expect(report.totals.net).toBeCloseTo(120.11, 2);
      expect(report.totals.transactionCount).toBe(3);
    });

    it("TST-ERR-272: agrupa byCategory/byAccount/byType/byProject y ordena de mayor a menor monto", async () => {
      vi.mocked(transaccionesFinancierasService.listTransaccionesFinancieras).mockResolvedValue({
        rows: [
          makeRow({ id: "1", categoryId: "cat-a", categoryName: "A", amount: 10 }),
          makeRow({ id: "2", categoryId: "cat-b", categoryName: "B", amount: 90 }),
          makeRow({ id: "3", categoryId: "cat-a", categoryName: "A", amount: 20 }),
        ],
        total: 3,
        warnings: [],
      } as any);

      const report = await getReporteFinanciero({});

      expect(report.byCategory).toEqual([
        { key: "cat-b", label: "B", amount: 90, count: 1 },
        { key: "cat-a", label: "A", amount: 30, count: 2 },
      ]);
    });

    it("TST-ERR-273: agrupa filas sin proyecto bajo la clave 'sin-proyecto'", async () => {
      vi.mocked(transaccionesFinancierasService.listTransaccionesFinancieras).mockResolvedValue({
        rows: [makeRow({ projectId: null, projectName: "-", amount: 5 })],
        total: 1,
        warnings: [],
      } as any);

      const report = await getReporteFinanciero({});
      expect(report.byProject).toEqual([{ key: "sin-proyecto", label: "-", amount: 5, count: 1 }]);
    });

    it("TST-ERR-274: pagina allRows respetando page/pageSize sin alterar los totales globales", async () => {
      const rows = Array.from({ length: 5 }, (_, i) => makeRow({ id: `t${i}`, amount: 10 }));
      vi.mocked(transaccionesFinancierasService.listTransaccionesFinancieras).mockResolvedValue({
        rows,
        total: 5,
        warnings: [],
      } as any);

      const report = await getReporteFinanciero({ page: 2, pageSize: 2 });

      expect(report.rows).toHaveLength(2);
      expect(report.allRows).toHaveLength(5);
      expect(report.totals.totalIncome).toBeCloseTo(50, 2);
    });

    it("TST-ERR-275: dataset vacio no rompe el calculo (todo en cero, sin grupos)", async () => {
      vi.mocked(transaccionesFinancierasService.listTransaccionesFinancieras).mockResolvedValue({
        rows: [],
        total: 0,
        warnings: [],
      } as any);

      const report = await getReporteFinanciero({});
      expect(report.totals).toEqual({ totalIncome: 0, totalExpense: 0, net: 0, transactionCount: 0 });
      expect(report.byCategory).toEqual([]);
    });

    it("TST-ERR-276: propaga el warning de dataset truncado cuando supera el limite del reporte", async () => {
      vi.mocked(transaccionesFinancierasService.listTransaccionesFinancieras).mockResolvedValue({
        rows: [makeRow()],
        total: 5000,
        warnings: [],
      } as any);

      const report = await getReporteFinanciero({});
      expect(report.warnings.some((w) => w.includes("supera"))).toBe(true);
    });

    it("TST-ERR-277: exportReporteFinanciero escapa comillas dobles en el CSV (previene ruptura de columnas)", async () => {
      vi.mocked(transaccionesFinancierasService.listTransaccionesFinancieras).mockResolvedValue({
        rows: [
          makeRow({
            accountName: 'Caja "Central", Sede 1',
            description: "Pago con comillas \" y coma ,",
          }),
        ],
        total: 1,
        warnings: [],
      } as any);

      const result = await exportReporteFinanciero({});

      expect(result.mimeType).toBe("text/csv;charset=utf-8");
      expect(result.fileName).toMatch(/^reporte-financiero-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(result.content).toContain('"Caja ""Central"", Sede 1"');
      expect(result.content).toContain('"Pago con comillas "" y coma ,"');
      expect(result.content.split("\n")[0]).toBe(
        "id_transaccion,fecha,cuenta,categoria,tipo,monto,proyecto,registrado_por,estado_aprobacion,comentario_aprobacion,descripcion,comprobante_url"
      );
    });
  });
});
