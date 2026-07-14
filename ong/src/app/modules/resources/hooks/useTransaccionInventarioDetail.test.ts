import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTransaccionInventarioDetail } from "./useTransaccionInventarioDetail";
import * as inventarioService from "../../../services/recursos/inventarioMovimientos.service";

vi.mock("../../../services/recursos/inventarioMovimientos.service", () => ({
  getTransaccionInventarioById: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useTransaccionInventarioDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene el estado inicial cuando movementId es null (no llama al servicio)", () => {
    const { result } = renderHook(() => useTransaccionInventarioDetail(null));

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(inventarioService.getTransaccionInventarioById).not.toHaveBeenCalled();
  });

  it("carga el detalle correctamente cuando se provee un movementId", async () => {
    const mockDetail = { id: "mov-1", cantidad: 5 };
    vi.mocked(inventarioService.getTransaccionInventarioById).mockResolvedValue(
      mockDetail as any
    );

    const { result } = renderHook(() => useTransaccionInventarioDetail("mov-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(inventarioService.getTransaccionInventarioById).toHaveBeenCalledWith("mov-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.error).toBeNull();
  });

  it("expone el mensaje del Error cuando la carga falla", async () => {
    vi.mocked(inventarioService.getTransaccionInventarioById).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useTransaccionInventarioDetail("mov-1"));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(inventarioService.getTransaccionInventarioById).mockRejectedValue(
      "raw string failure"
    );

    const { result } = renderHook(() => useTransaccionInventarioDetail("mov-1"));

    await flush();

    expect(result.current.error).toBe("No se pudo cargar el detalle del movimiento.");
  });

  it("refresh() vuelve a llamar al servicio", async () => {
    vi.mocked(inventarioService.getTransaccionInventarioById).mockResolvedValue({
      id: "mov-1",
    } as any);

    const { result } = renderHook(() => useTransaccionInventarioDetail("mov-1"));
    await flush();

    expect(inventarioService.getTransaccionInventarioById).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(inventarioService.getTransaccionInventarioById).toHaveBeenCalledTimes(2);
  });
});
