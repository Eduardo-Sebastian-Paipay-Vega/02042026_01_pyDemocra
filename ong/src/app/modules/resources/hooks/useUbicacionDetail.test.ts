import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUbicacionDetail } from "./useUbicacionDetail";
import * as ubicacionesService from "../../../services/recursos/ubicaciones.service";

vi.mock("../../../services/recursos/ubicaciones.service", () => ({
  getUbicacionById: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useUbicacionDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene el estado inicial cuando locationId es null (no llama al servicio)", () => {
    const { result } = renderHook(() => useUbicacionDetail(null));

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(ubicacionesService.getUbicacionById).not.toHaveBeenCalled();
  });

  it("carga el detalle correctamente cuando se provee un locationId", async () => {
    const mockDetail = { id: "loc-1", nombre: "Almacen central" };
    vi.mocked(ubicacionesService.getUbicacionById).mockResolvedValue(mockDetail as any);

    const { result } = renderHook(() => useUbicacionDetail("loc-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(ubicacionesService.getUbicacionById).toHaveBeenCalledWith("loc-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.error).toBeNull();
  });

  it("expone el mensaje del Error cuando la carga falla", async () => {
    vi.mocked(ubicacionesService.getUbicacionById).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useUbicacionDetail("loc-1"));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(ubicacionesService.getUbicacionById).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useUbicacionDetail("loc-1"));

    await flush();

    expect(result.current.error).toBe("No se pudo cargar el detalle de la ubicacion.");
  });

  it("refresh() vuelve a llamar al servicio", async () => {
    vi.mocked(ubicacionesService.getUbicacionById).mockResolvedValue({ id: "loc-1" } as any);

    const { result } = renderHook(() => useUbicacionDetail("loc-1"));
    await flush();

    expect(ubicacionesService.getUbicacionById).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(ubicacionesService.getUbicacionById).toHaveBeenCalledTimes(2);
  });
});
