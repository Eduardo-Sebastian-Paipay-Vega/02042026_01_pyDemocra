import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTransaccionFinancieraDetail } from "./useTransaccionFinancieraDetail";
import * as transaccionesService from "../../../services/recursos/transaccionesFinancieras.service";

vi.mock("../../../services/recursos/transaccionesFinancieras.service", () => ({
  getTransaccionFinancieraById: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useTransaccionFinancieraDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene el estado inicial cuando transactionId es null (no llama al servicio)", () => {
    const { result } = renderHook(() => useTransaccionFinancieraDetail(null));

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(transaccionesService.getTransaccionFinancieraById).not.toHaveBeenCalled();
  });

  it("carga el detalle correctamente cuando se provee un transactionId", async () => {
    const mockDetail = { id: "tx-1", monto: 100 };
    vi.mocked(transaccionesService.getTransaccionFinancieraById).mockResolvedValue(
      mockDetail as any
    );

    const { result } = renderHook(() => useTransaccionFinancieraDetail("tx-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(transaccionesService.getTransaccionFinancieraById).toHaveBeenCalledWith("tx-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.error).toBeNull();
  });

  it("expone el mensaje del Error cuando la carga falla", async () => {
    vi.mocked(transaccionesService.getTransaccionFinancieraById).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useTransaccionFinancieraDetail("tx-1"));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(transaccionesService.getTransaccionFinancieraById).mockRejectedValue(
      "raw string failure"
    );

    const { result } = renderHook(() => useTransaccionFinancieraDetail("tx-1"));

    await flush();

    expect(result.current.error).toBe("No se pudo cargar el detalle de la transaccion.");
  });

  it("refresh() vuelve a llamar al servicio", async () => {
    vi.mocked(transaccionesService.getTransaccionFinancieraById).mockResolvedValue({
      id: "tx-1",
    } as any);

    const { result } = renderHook(() => useTransaccionFinancieraDetail("tx-1"));
    await flush();

    expect(transaccionesService.getTransaccionFinancieraById).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(transaccionesService.getTransaccionFinancieraById).toHaveBeenCalledTimes(2);
  });
});
