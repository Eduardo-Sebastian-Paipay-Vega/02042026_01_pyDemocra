import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTransaccionesFinancieras } from "./useTransaccionesFinancieras";
import * as transaccionesService from "../../../services/recursos/transaccionesFinancieras.service";

vi.mock("../../../services/recursos/transaccionesFinancieras.service", () => ({
  approveEgreso: vi.fn(),
  createTransaccionFinanciera: vi.fn(),
  listTransaccionesFinancieras: vi.fn(),
  observeEgreso: vi.fn(),
  rejectEgreso: vi.fn(),
  removeOrVoidTransaccionFinanciera: vi.fn(),
  updateTransaccionFinanciera: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const emptyData = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  warnings: [],
  accountOptions: [],
  categoryOptions: [],
  typeOptions: [],
  projectOptions: [],
  approvalOptions: [],
  support: { projectLink: false, approvalWorkflow: true },
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
  includeDeleted: false,
  page: 1,
  pageSize: 20,
} as any;

describe("useTransaccionesFinancieras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga la lista al montar con loading inicial en true, con typeCode resuelto a 'all' por defecto", async () => {
    const mockResponse = { ...emptyData, rows: [{ id: "tx-1" }], total: 1 };
    vi.mocked(transaccionesService.listTransaccionesFinancieras).mockResolvedValue(
      mockResponse as any
    );

    const { result } = renderHook(() => useTransaccionesFinancieras(baseFilters));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(transaccionesService.listTransaccionesFinancieras).toHaveBeenCalledWith({
      searchTerm: "",
      accountId: undefined,
      categoryId: undefined,
      typeCode: "all",
      typeId: undefined,
      projectId: undefined,
      approvalKind: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      includeDeleted: false,
      page: 1,
      pageSize: 20,
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual(mockResponse.rows);
    expect(result.current.error).toBeNull();
  });

  it("usa typeId como typeCode cuando typeCode no viene definido y typeId es un string", async () => {
    vi.mocked(transaccionesService.listTransaccionesFinancieras).mockResolvedValue(
      emptyData as any
    );

    const filters = { ...baseFilters, typeId: "egreso" };
    renderHook(() => useTransaccionesFinancieras(filters));

    await flush();

    expect(transaccionesService.listTransaccionesFinancieras).toHaveBeenCalledWith(
      expect.objectContaining({ typeCode: "egreso", typeId: "egreso" })
    );
  });

  it("resetea a los datos vacios y expone el mensaje del Error cuando falla la carga", async () => {
    vi.mocked(transaccionesService.listTransaccionesFinancieras).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useTransaccionesFinancieras(baseFilters));

    await flush();

    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error de carga no es una instancia de Error", async () => {
    vi.mocked(transaccionesService.listTransaccionesFinancieras).mockRejectedValue(
      "raw string failure"
    );

    const { result } = renderHook(() => useTransaccionesFinancieras(baseFilters));

    await flush();

    expect(result.current.error).toBe("No se pudieron cargar las transacciones.");
  });

  it("create() llama al servicio y refresca la lista", async () => {
    vi.mocked(transaccionesService.listTransaccionesFinancieras).mockResolvedValue(
      emptyData as any
    );
    vi.mocked(transaccionesService.createTransaccionFinanciera).mockResolvedValue({
      id: "tx-new",
    } as any);

    const { result } = renderHook(() => useTransaccionesFinancieras(baseFilters));
    await flush();
    expect(transaccionesService.listTransaccionesFinancieras).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.create({ amount: 100 } as any);
    });

    expect(transaccionesService.createTransaccionFinanciera).toHaveBeenCalledWith({
      amount: 100,
    });
    await flush();
    expect(transaccionesService.listTransaccionesFinancieras).toHaveBeenCalledTimes(2);
  });

  it("create() devuelve null y no llama al servicio si ya hay una creacion en curso", async () => {
    vi.mocked(transaccionesService.listTransaccionesFinancieras).mockResolvedValue(
      emptyData as any
    );
    vi.mocked(transaccionesService.createTransaccionFinanciera).mockReturnValue(
      new Promise(() => {}) as any
    );

    const { result } = renderHook(() => useTransaccionesFinancieras(baseFilters));
    await flush();

    act(() => {
      void result.current.create({ amount: 1 } as any);
    });
    expect(result.current.isCreating).toBe(true);

    let secondResult: unknown;
    await act(async () => {
      secondResult = await result.current.create({ amount: 2 } as any);
    });

    expect(secondResult).toBeNull();
    expect(transaccionesService.createTransaccionFinanciera).toHaveBeenCalledTimes(1);
  });

  it("update() llama al servicio y refresca la lista", async () => {
    vi.mocked(transaccionesService.listTransaccionesFinancieras).mockResolvedValue(
      emptyData as any
    );
    vi.mocked(transaccionesService.updateTransaccionFinanciera).mockResolvedValue({
      id: "tx-1",
    } as any);

    const { result } = renderHook(() => useTransaccionesFinancieras(baseFilters));
    await flush();

    await act(async () => {
      await result.current.update({ transactionId: "tx-1" } as any);
    });

    expect(transaccionesService.updateTransaccionFinanciera).toHaveBeenCalledWith({
      transactionId: "tx-1",
    });
    await flush();
    expect(transaccionesService.listTransaccionesFinancieras).toHaveBeenCalledTimes(2);
  });

  it("remove() llama al servicio, refresca la lista y devuelve true", async () => {
    vi.mocked(transaccionesService.listTransaccionesFinancieras).mockResolvedValue(
      emptyData as any
    );
    vi.mocked(transaccionesService.removeOrVoidTransaccionFinanciera).mockResolvedValue(
      undefined as any
    );

    const { result } = renderHook(() => useTransaccionesFinancieras(baseFilters));
    await flush();

    let removeResult: unknown;
    await act(async () => {
      removeResult = await result.current.remove({ transactionId: "tx-1" } as any);
    });

    expect(transaccionesService.removeOrVoidTransaccionFinanciera).toHaveBeenCalledWith({
      transactionId: "tx-1",
    });
    expect(removeResult).toBe(true);
    await flush();
    expect(transaccionesService.listTransaccionesFinancieras).toHaveBeenCalledTimes(2);
  });

  it("approve() llama a approveEgreso y refresca la lista", async () => {
    vi.mocked(transaccionesService.listTransaccionesFinancieras).mockResolvedValue(
      emptyData as any
    );
    vi.mocked(transaccionesService.approveEgreso).mockResolvedValue({ id: "tx-1" } as any);

    const { result } = renderHook(() => useTransaccionesFinancieras(baseFilters));
    await flush();

    await act(async () => {
      await result.current.approve({ transactionId: "tx-1" } as any);
    });

    expect(transaccionesService.approveEgreso).toHaveBeenCalledWith({ transactionId: "tx-1" });
    await flush();
    expect(transaccionesService.listTransaccionesFinancieras).toHaveBeenCalledTimes(2);
  });

  it("reject() llama a rejectEgreso y refresca la lista", async () => {
    vi.mocked(transaccionesService.listTransaccionesFinancieras).mockResolvedValue(
      emptyData as any
    );
    vi.mocked(transaccionesService.rejectEgreso).mockResolvedValue({ id: "tx-1" } as any);

    const { result } = renderHook(() => useTransaccionesFinancieras(baseFilters));
    await flush();

    await act(async () => {
      await result.current.reject({ transactionId: "tx-1" } as any);
    });

    expect(transaccionesService.rejectEgreso).toHaveBeenCalledWith({ transactionId: "tx-1" });
    await flush();
    expect(transaccionesService.listTransaccionesFinancieras).toHaveBeenCalledTimes(2);
  });

  it("observe() llama a observeEgreso y refresca la lista", async () => {
    vi.mocked(transaccionesService.listTransaccionesFinancieras).mockResolvedValue(
      emptyData as any
    );
    vi.mocked(transaccionesService.observeEgreso).mockResolvedValue({ id: "tx-1" } as any);

    const { result } = renderHook(() => useTransaccionesFinancieras(baseFilters));
    await flush();

    await act(async () => {
      await result.current.observe({ transactionId: "tx-1" } as any);
    });

    expect(transaccionesService.observeEgreso).toHaveBeenCalledWith({ transactionId: "tx-1" });
    await flush();
    expect(transaccionesService.listTransaccionesFinancieras).toHaveBeenCalledTimes(2);
  });

  it("approve()/reject()/observe() comparten el flag isResolving: una segunda llamada devuelve null mientras la primera esta en curso", async () => {
    vi.mocked(transaccionesService.listTransaccionesFinancieras).mockResolvedValue(
      emptyData as any
    );
    vi.mocked(transaccionesService.approveEgreso).mockReturnValue(new Promise(() => {}) as any);

    const { result } = renderHook(() => useTransaccionesFinancieras(baseFilters));
    await flush();

    act(() => {
      void result.current.approve({ transactionId: "tx-1" } as any);
    });
    expect(result.current.isResolving).toBe(true);

    let secondResult: unknown;
    await act(async () => {
      secondResult = await result.current.reject({ transactionId: "tx-2" } as any);
    });

    expect(secondResult).toBeNull();
    expect(transaccionesService.rejectEgreso).not.toHaveBeenCalled();
  });
});
