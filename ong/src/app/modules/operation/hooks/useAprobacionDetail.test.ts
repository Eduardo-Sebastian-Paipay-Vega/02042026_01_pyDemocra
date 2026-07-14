import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAprobacionDetail } from "./useAprobacionDetail";
import * as aprobacionesService from "../../../services/operacion/aprobaciones.service";

vi.mock("../../../services/operacion/aprobaciones.service", () => ({
  getAprobacionDetail: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useAprobacionDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene el estado inicial cuando approvalId es null (no llama al servicio)", () => {
    const { result } = renderHook(() => useAprobacionDetail(null));

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(aprobacionesService.getAprobacionDetail).not.toHaveBeenCalled();
  });

  it("carga el detalle correctamente cuando se provee un approvalId", async () => {
    const mockDetail = { id: "apr-1", estado: "pendiente" };
    vi.mocked(aprobacionesService.getAprobacionDetail).mockResolvedValue(mockDetail as any);

    const { result } = renderHook(() => useAprobacionDetail("apr-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(aprobacionesService.getAprobacionDetail).toHaveBeenCalledWith("apr-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.error).toBeNull();
  });

  it("expone el mensaje del Error cuando la carga falla", async () => {
    vi.mocked(aprobacionesService.getAprobacionDetail).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useAprobacionDetail("apr-1"));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(aprobacionesService.getAprobacionDetail).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useAprobacionDetail("apr-1"));

    await flush();

    expect(result.current.error).toBe("No se pudo cargar el detalle de la aprobacion.");
  });

  it("refresh() vuelve a llamar al servicio", async () => {
    vi.mocked(aprobacionesService.getAprobacionDetail).mockResolvedValue({ id: "apr-1" } as any);

    const { result } = renderHook(() => useAprobacionDetail("apr-1"));
    await flush();

    expect(aprobacionesService.getAprobacionDetail).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(aprobacionesService.getAprobacionDetail).toHaveBeenCalledTimes(2);
  });
});
