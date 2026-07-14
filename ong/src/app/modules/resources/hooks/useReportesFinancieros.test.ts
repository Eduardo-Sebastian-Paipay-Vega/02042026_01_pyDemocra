import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useReportesFinancieros } from "./useReportesFinancieros";
import * as reportesService from "../../../services/recursos/reportesFinancieros.service";

vi.mock("../../../services/recursos/reportesFinancieros.service", () => ({
  exportReporteFinanciero: vi.fn(),
  getReporteFinanciero: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const emptyData = {
  rows: [],
  allRows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  warnings: [],
  totals: { totalIncome: 0, totalExpense: 0, net: 0, transactionCount: 0 },
  byCategory: [],
  byAccount: [],
  byType: [],
  byProject: [],
};

const baseFilters = {
  searchTerm: "",
  accountId: undefined,
  categoryId: undefined,
  typeCode: undefined,
  typeId: undefined,
  projectId: undefined,
  approvalKind: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  page: 1,
  pageSize: 20,
} as any;

describe("useReportesFinancieros", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga el reporte al montar con loading inicial en true, con typeCode resuelto a 'all' por defecto", async () => {
    const mockResponse = { ...emptyData, rows: [{ id: "rep-1" }], total: 1 };
    vi.mocked(reportesService.getReporteFinanciero).mockResolvedValue(mockResponse as any);

    const { result } = renderHook(() => useReportesFinancieros(baseFilters));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(reportesService.getReporteFinanciero).toHaveBeenCalledWith({
      searchTerm: "",
      accountId: undefined,
      categoryId: undefined,
      typeCode: "all",
      typeId: undefined,
      projectId: undefined,
      approvalKind: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      page: 1,
      pageSize: 20,
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual(mockResponse.rows);
    expect(result.current.error).toBeNull();
  });

  it("resetea a los datos vacios y expone el mensaje del Error cuando falla la carga", async () => {
    vi.mocked(reportesService.getReporteFinanciero).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useReportesFinancieros(baseFilters));

    await flush();

    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error de carga no es una instancia de Error", async () => {
    vi.mocked(reportesService.getReporteFinanciero).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useReportesFinancieros(baseFilters));

    await flush();

    expect(result.current.error).toBe("No se pudo generar el reporte financiero.");
  });

  it("exportCsv() llama al servicio con los filtros vigentes (sin page/pageSize) y devuelve el resultado", async () => {
    vi.mocked(reportesService.getReporteFinanciero).mockResolvedValue(emptyData as any);
    vi.mocked(reportesService.exportReporteFinanciero).mockResolvedValue("csv,data" as any);

    const { result } = renderHook(() => useReportesFinancieros(baseFilters));
    await flush();

    let exportResult: unknown;
    await act(async () => {
      exportResult = await result.current.exportCsv();
    });

    expect(reportesService.exportReporteFinanciero).toHaveBeenCalledWith({
      searchTerm: "",
      accountId: undefined,
      categoryId: undefined,
      typeCode: "all",
      typeId: undefined,
      projectId: undefined,
      approvalKind: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
    expect(exportResult).toBe("csv,data");
    expect(result.current.isExporting).toBe(false);
  });

  it("exportCsv() devuelve null y no llama al servicio si ya hay una exportacion en curso", async () => {
    vi.mocked(reportesService.getReporteFinanciero).mockResolvedValue(emptyData as any);
    vi.mocked(reportesService.exportReporteFinanciero).mockReturnValue(
      new Promise(() => {}) as any
    );

    const { result } = renderHook(() => useReportesFinancieros(baseFilters));
    await flush();

    act(() => {
      void result.current.exportCsv();
    });
    expect(result.current.isExporting).toBe(true);

    let secondResult: unknown;
    await act(async () => {
      secondResult = await result.current.exportCsv();
    });

    expect(secondResult).toBeNull();
    expect(reportesService.exportReporteFinanciero).toHaveBeenCalledTimes(1);
  });
});
