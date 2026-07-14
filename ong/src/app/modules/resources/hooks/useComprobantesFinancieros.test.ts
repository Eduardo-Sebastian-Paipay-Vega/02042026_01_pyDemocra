import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useComprobantesFinancieros } from "./useComprobantesFinancieros";
import * as comprobantesService from "../../../services/recursos/comprobantesFinancieros.service";

vi.mock("../../../services/recursos/comprobantesFinancieros.service", () => ({
  createComprobanteFinanciero: vi.fn(),
  listComprobantesByTransaccion: vi.fn(),
  removeOrVoidComprobanteFinanciero: vi.fn(),
  updateComprobanteFinanciero: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useComprobantesFinancieros", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no llama al servicio y deja loading en false cuando transactionId es null", async () => {
    const { result } = renderHook(() => useComprobantesFinancieros(null));

    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(comprobantesService.listComprobantesByTransaccion).not.toHaveBeenCalled();
  });

  it("carga los comprobantes cuando se provee un transactionId", async () => {
    const mockRows = [{ id: "rec-1" }];
    vi.mocked(comprobantesService.listComprobantesByTransaccion).mockResolvedValue(
      mockRows as any
    );

    const { result } = renderHook(() => useComprobantesFinancieros("tx-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(comprobantesService.listComprobantesByTransaccion).toHaveBeenCalledWith("tx-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual(mockRows);
    expect(result.current.error).toBeNull();
  });

  it("resetea a filas vacias y expone el mensaje del Error cuando falla la carga", async () => {
    vi.mocked(comprobantesService.listComprobantesByTransaccion).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useComprobantesFinancieros("tx-1"));

    await flush();

    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error de carga no es una instancia de Error", async () => {
    vi.mocked(comprobantesService.listComprobantesByTransaccion).mockRejectedValue(
      "raw string failure"
    );

    const { result } = renderHook(() => useComprobantesFinancieros("tx-1"));

    await flush();

    expect(result.current.error).toBe("No se pudieron cargar los comprobantes.");
  });

  it("create() llama al servicio y refresca la lista", async () => {
    vi.mocked(comprobantesService.listComprobantesByTransaccion).mockResolvedValue([] as any);
    vi.mocked(comprobantesService.createComprobanteFinanciero).mockResolvedValue({
      id: "rec-new",
    } as any);

    const { result } = renderHook(() => useComprobantesFinancieros("tx-1"));
    await flush();
    expect(comprobantesService.listComprobantesByTransaccion).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.create({ transactionId: "tx-1", amount: 10 } as any);
    });

    expect(comprobantesService.createComprobanteFinanciero).toHaveBeenCalledWith({
      transactionId: "tx-1",
      amount: 10,
    });
    await flush();
    expect(comprobantesService.listComprobantesByTransaccion).toHaveBeenCalledTimes(2);
  });

  it("create() devuelve null y no llama al servicio si ya hay una creacion en curso", async () => {
    vi.mocked(comprobantesService.listComprobantesByTransaccion).mockResolvedValue([] as any);
    vi.mocked(comprobantesService.createComprobanteFinanciero).mockReturnValue(
      new Promise(() => {}) as any
    );

    const { result } = renderHook(() => useComprobantesFinancieros("tx-1"));
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
    expect(comprobantesService.createComprobanteFinanciero).toHaveBeenCalledTimes(1);
  });

  it("update() llama al servicio y refresca la lista", async () => {
    vi.mocked(comprobantesService.listComprobantesByTransaccion).mockResolvedValue([] as any);
    vi.mocked(comprobantesService.updateComprobanteFinanciero).mockResolvedValue({
      id: "rec-1",
    } as any);

    const { result } = renderHook(() => useComprobantesFinancieros("tx-1"));
    await flush();

    await act(async () => {
      await result.current.update({ receiptId: "rec-1" } as any);
    });

    expect(comprobantesService.updateComprobanteFinanciero).toHaveBeenCalledWith({
      receiptId: "rec-1",
    });
    await flush();
    expect(comprobantesService.listComprobantesByTransaccion).toHaveBeenCalledTimes(2);
  });

  it("remove() llama al servicio y refresca la lista", async () => {
    vi.mocked(comprobantesService.listComprobantesByTransaccion).mockResolvedValue([] as any);
    vi.mocked(comprobantesService.removeOrVoidComprobanteFinanciero).mockResolvedValue(
      undefined as any
    );

    const { result } = renderHook(() => useComprobantesFinancieros("tx-1"));
    await flush();

    await act(async () => {
      await result.current.remove("rec-1");
    });

    expect(comprobantesService.removeOrVoidComprobanteFinanciero).toHaveBeenCalledWith("rec-1");
    await flush();
    expect(comprobantesService.listComprobantesByTransaccion).toHaveBeenCalledTimes(2);
  });
});
