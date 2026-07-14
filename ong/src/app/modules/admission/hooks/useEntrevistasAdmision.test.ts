import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEntrevistasAdmision } from "./useEntrevistasAdmision";
import * as solicitudesService from "../../../services/admision/solicitudesAdmision.service";

vi.mock("../../../services/admision/solicitudesAdmision.service", () => ({
  createEntrevistaAdmision: vi.fn(),
  listEntrevistasBySolicitud: vi.fn(),
  removeEntrevistaAdmision: vi.fn(),
  updateEntrevistaAdmision: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useEntrevistasAdmision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no llama al servicio y deja loading en false cuando requestId es null", () => {
    const { result } = renderHook(() => useEntrevistasAdmision(null));

    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(solicitudesService.listEntrevistasBySolicitud).not.toHaveBeenCalled();
  });

  it("carga las entrevistas cuando se provee un requestId", async () => {
    const mockRows = [{ id: "int-1" }];
    vi.mocked(solicitudesService.listEntrevistasBySolicitud).mockResolvedValue(mockRows as any);

    const { result } = renderHook(() => useEntrevistasAdmision("sol-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(solicitudesService.listEntrevistasBySolicitud).toHaveBeenCalledWith("sol-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual(mockRows);
    expect(result.current.error).toBeNull();
  });

  it("expone el mensaje del Error cuando falla la carga", async () => {
    vi.mocked(solicitudesService.listEntrevistasBySolicitud).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useEntrevistasAdmision("sol-1"));

    await flush();

    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error de carga no es una instancia de Error", async () => {
    vi.mocked(solicitudesService.listEntrevistasBySolicitud).mockRejectedValue(
      "raw string failure"
    );

    const { result } = renderHook(() => useEntrevistasAdmision("sol-1"));

    await flush();

    expect(result.current.error).toBe("No se pudieron cargar las entrevistas de admision.");
  });

  it("create() llama al servicio y refresca la lista", async () => {
    vi.mocked(solicitudesService.listEntrevistasBySolicitud).mockResolvedValue([] as any);
    vi.mocked(solicitudesService.createEntrevistaAdmision).mockResolvedValue({
      id: "int-new",
    } as any);

    const { result } = renderHook(() => useEntrevistasAdmision("sol-1"));
    await flush();
    expect(solicitudesService.listEntrevistasBySolicitud).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.create({ requestId: "sol-1" } as any);
    });

    expect(solicitudesService.createEntrevistaAdmision).toHaveBeenCalledWith({
      requestId: "sol-1",
    });
    await flush();
    expect(solicitudesService.listEntrevistasBySolicitud).toHaveBeenCalledTimes(2);
  });

  it("create() devuelve null si ya hay una creacion en curso", async () => {
    vi.mocked(solicitudesService.listEntrevistasBySolicitud).mockResolvedValue([] as any);
    vi.mocked(solicitudesService.createEntrevistaAdmision).mockReturnValue(
      new Promise(() => {}) as any
    );

    const { result } = renderHook(() => useEntrevistasAdmision("sol-1"));
    await flush();

    act(() => {
      void result.current.create({} as any);
    });
    expect(result.current.isCreating).toBe(true);

    let secondResult: unknown;
    await act(async () => {
      secondResult = await result.current.create({} as any);
    });

    expect(secondResult).toBeNull();
    expect(solicitudesService.createEntrevistaAdmision).toHaveBeenCalledTimes(1);
  });

  it("update() llama al servicio y refresca la lista", async () => {
    vi.mocked(solicitudesService.listEntrevistasBySolicitud).mockResolvedValue([] as any);
    vi.mocked(solicitudesService.updateEntrevistaAdmision).mockResolvedValue({
      id: "int-1",
    } as any);

    const { result } = renderHook(() => useEntrevistasAdmision("sol-1"));
    await flush();

    await act(async () => {
      await result.current.update({ interviewId: "int-1" } as any);
    });

    expect(solicitudesService.updateEntrevistaAdmision).toHaveBeenCalledWith({
      interviewId: "int-1",
    });
    await flush();
    expect(solicitudesService.listEntrevistasBySolicitud).toHaveBeenCalledTimes(2);
  });

  it("remove() llama al servicio y refresca la lista", async () => {
    vi.mocked(solicitudesService.listEntrevistasBySolicitud).mockResolvedValue([] as any);
    vi.mocked(solicitudesService.removeEntrevistaAdmision).mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useEntrevistasAdmision("sol-1"));
    await flush();

    await act(async () => {
      await result.current.remove("int-1");
    });

    expect(solicitudesService.removeEntrevistaAdmision).toHaveBeenCalledWith("int-1");
    await flush();
    expect(solicitudesService.listEntrevistasBySolicitud).toHaveBeenCalledTimes(2);
  });
});
