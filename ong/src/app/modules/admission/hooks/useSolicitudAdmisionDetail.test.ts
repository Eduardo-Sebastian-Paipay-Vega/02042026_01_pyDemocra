import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSolicitudAdmisionDetail } from "./useSolicitudAdmisionDetail";
import * as solicitudesAdmisionService from "../../../services/admision/solicitudesAdmision.service";

vi.mock("../../../services/admision/solicitudesAdmision.service", () => ({
  getSolicitudAdmisionDetail: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useSolicitudAdmisionDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene el estado inicial cuando requestId es null (no llama al servicio)", () => {
    const { result } = renderHook(() => useSolicitudAdmisionDetail(null));

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(solicitudesAdmisionService.getSolicitudAdmisionDetail).not.toHaveBeenCalled();
  });

  it("carga el detalle correctamente cuando se provee un requestId", async () => {
    const mockDetail = { id: "req-1", nombre: "Juan Perez" };
    vi.mocked(solicitudesAdmisionService.getSolicitudAdmisionDetail).mockResolvedValue(
      mockDetail as any
    );

    const { result } = renderHook(() => useSolicitudAdmisionDetail("req-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(solicitudesAdmisionService.getSolicitudAdmisionDetail).toHaveBeenCalledWith("req-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.error).toBeNull();
  });

  it("expone el mensaje del Error cuando la carga falla", async () => {
    vi.mocked(solicitudesAdmisionService.getSolicitudAdmisionDetail).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useSolicitudAdmisionDetail("req-1"));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(solicitudesAdmisionService.getSolicitudAdmisionDetail).mockRejectedValue(
      "raw string failure"
    );

    const { result } = renderHook(() => useSolicitudAdmisionDetail("req-1"));

    await flush();

    expect(result.current.error).toBe("No se pudo cargar el expediente de admision.");
  });

  it("refresh() vuelve a llamar al servicio", async () => {
    vi.mocked(solicitudesAdmisionService.getSolicitudAdmisionDetail).mockResolvedValue(
      { id: "req-1" } as any
    );

    const { result } = renderHook(() => useSolicitudAdmisionDetail("req-1"));
    await flush();

    expect(solicitudesAdmisionService.getSolicitudAdmisionDetail).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(solicitudesAdmisionService.getSolicitudAdmisionDetail).toHaveBeenCalledTimes(2);
  });
});
