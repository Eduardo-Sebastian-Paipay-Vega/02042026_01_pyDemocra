import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useVolunteerDetail } from "./useVolunteerDetail";
import * as volunteersService from "../../../services/personas/volunteers.service";

vi.mock("../../../services/personas/volunteers.service", () => ({
  getVolunteerDetail: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useVolunteerDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene el estado inicial cuando volunteerId es null (no llama al servicio)", () => {
    const { result } = renderHook(() => useVolunteerDetail(null));

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(volunteersService.getVolunteerDetail).not.toHaveBeenCalled();
  });

  it("carga el detalle correctamente cuando se provee un volunteerId", async () => {
    const mockDetail = { id: "vol-1", nombre: "Carlos Ruiz" };
    vi.mocked(volunteersService.getVolunteerDetail).mockResolvedValue(mockDetail as any);

    const { result } = renderHook(() => useVolunteerDetail("vol-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(volunteersService.getVolunteerDetail).toHaveBeenCalledWith("vol-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.error).toBeNull();
  });

  it("marca el voluntario como no disponible cuando el detalle resuelve null", async () => {
    vi.mocked(volunteersService.getVolunteerDetail).mockResolvedValue(null as any);

    const { result } = renderHook(() => useVolunteerDetail("vol-1"));

    await flush();

    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("El voluntario ya no esta disponible.");
  });

  it("expone el mensaje del Error cuando la carga falla", async () => {
    vi.mocked(volunteersService.getVolunteerDetail).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useVolunteerDetail("vol-1"));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(volunteersService.getVolunteerDetail).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useVolunteerDetail("vol-1"));

    await flush();

    expect(result.current.error).toBe("No se pudo cargar el detalle del voluntario.");
  });

  it("refresh() vuelve a llamar al servicio", async () => {
    vi.mocked(volunteersService.getVolunteerDetail).mockResolvedValue({ id: "vol-1" } as any);

    const { result } = renderHook(() => useVolunteerDetail("vol-1"));
    await flush();

    expect(volunteersService.getVolunteerDetail).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(volunteersService.getVolunteerDetail).toHaveBeenCalledTimes(2);
  });

  it("replace() setea el detalle directamente sin llamar al servicio", () => {
    const { result } = renderHook(() => useVolunteerDetail(null));
    const replacement = { id: "vol-2", nombre: "Nuevo" } as any;

    act(() => {
      result.current.replace(replacement);
    });

    expect(result.current.detail).toEqual(replacement);
    expect(volunteersService.getVolunteerDetail).not.toHaveBeenCalled();
  });

  it("replace(null) marca el voluntario como no disponible", () => {
    const { result } = renderHook(() => useVolunteerDetail(null));

    act(() => {
      result.current.replace(null);
    });

    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("El voluntario ya no esta disponible.");
  });
});
