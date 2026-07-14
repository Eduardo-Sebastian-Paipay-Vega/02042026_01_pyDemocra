import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useActividadDetail } from "./useActividadDetail";
import * as actividadesService from "../../../services/operacion/actividades.service";

vi.mock("../../../services/operacion/actividades.service", () => ({
  getActividadById: vi.fn(),
  getResumenRelacionActividad: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useActividadDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene el estado inicial cuando activityId es null (no llama a los servicios)", () => {
    const { result } = renderHook(() => useActividadDetail(null));

    expect(result.current.detail).toBeNull();
    expect(result.current.relations).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(actividadesService.getActividadById).not.toHaveBeenCalled();
    expect(actividadesService.getResumenRelacionActividad).not.toHaveBeenCalled();
  });

  it("carga el detalle y las relaciones cuando ambas peticiones tienen exito", async () => {
    const mockDetail = { id: "act-1", nombre: "Taller de lectura" };
    const mockRelations = { attendanceCount: 5, evidenceCount: 2, hoursCount: 3 };
    vi.mocked(actividadesService.getActividadById).mockResolvedValue(mockDetail as any);
    vi.mocked(actividadesService.getResumenRelacionActividad).mockResolvedValue(
      mockRelations as any
    );

    const { result } = renderHook(() => useActividadDetail("act-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(actividadesService.getActividadById).toHaveBeenCalledWith("act-1");
    expect(actividadesService.getResumenRelacionActividad).toHaveBeenCalledWith("act-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.relations).toEqual(mockRelations);
    expect(result.current.error).toBeNull();
  });

  it("expone el mensaje del Error cuando falla la carga del detalle (aunque las relaciones tengan exito)", async () => {
    vi.mocked(actividadesService.getActividadById).mockRejectedValue(
      new Error("503 DB Offline")
    );
    vi.mocked(actividadesService.getResumenRelacionActividad).mockResolvedValue({
      attendanceCount: 0,
      evidenceCount: 0,
      hoursCount: 0,
    } as any);

    const { result } = renderHook(() => useActividadDetail("act-1"));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toBeNull();
    expect(result.current.relations).toBeNull();
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error del detalle no es una instancia de Error", async () => {
    vi.mocked(actividadesService.getActividadById).mockRejectedValue("raw string failure");
    vi.mocked(actividadesService.getResumenRelacionActividad).mockResolvedValue({} as any);

    const { result } = renderHook(() => useActividadDetail("act-1"));

    await flush();

    expect(result.current.error).toBe("No se pudo cargar el detalle de la actividad.");
  });

  it("mantiene el detalle y pone relations en null si solo falla la peticion de relaciones", async () => {
    const mockDetail = { id: "act-1", nombre: "Taller de lectura" };
    vi.mocked(actividadesService.getActividadById).mockResolvedValue(mockDetail as any);
    vi.mocked(actividadesService.getResumenRelacionActividad).mockRejectedValue(
      new Error("relaciones no disponibles")
    );

    const { result } = renderHook(() => useActividadDetail("act-1"));

    await flush();

    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.relations).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("refresh() vuelve a llamar a ambos servicios", async () => {
    vi.mocked(actividadesService.getActividadById).mockResolvedValue({ id: "act-1" } as any);
    vi.mocked(actividadesService.getResumenRelacionActividad).mockResolvedValue({} as any);

    const { result } = renderHook(() => useActividadDetail("act-1"));
    await flush();

    expect(actividadesService.getActividadById).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(actividadesService.getActividadById).toHaveBeenCalledTimes(2);
    expect(actividadesService.getResumenRelacionActividad).toHaveBeenCalledTimes(2);
  });
});
