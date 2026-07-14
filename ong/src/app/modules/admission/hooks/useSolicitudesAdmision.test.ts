import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSolicitudesAdmision } from "./useSolicitudesAdmision";
import * as solicitudesService from "../../../services/admision/solicitudesAdmision.service";

vi.mock("../../../services/admision/solicitudesAdmision.service", () => ({
  changeEstadoAdmision: vi.fn(),
  convertSolicitudToVoluntario: vi.fn(),
  createSolicitud: vi.fn(),
  generateRegistrationCodeBySolicitud: vi.fn(),
  listSolicitudes: vi.fn(),
  updateSolicitud: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const emptyKpis = {
  total: 0,
  pending: 0,
  review: 0,
  interview: 0,
  onboarding: 0,
  approved: 0,
  rejected: 0,
  converted: 0,
  pendingConversion: 0,
};

const emptyData = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  stateOptions: [],
  kpis: emptyKpis,
  warnings: [],
};

const baseFilters = {
  searchTerm: "",
  status: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  page: 1,
  pageSize: 20,
} as any;

describe("useSolicitudesAdmision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga la lista al montar con loading inicial en true", async () => {
    const mockResponse = { ...emptyData, rows: [{ id: "sol-1" }], total: 1 };
    vi.mocked(solicitudesService.listSolicitudes).mockResolvedValue(mockResponse as any);

    const { result } = renderHook(() => useSolicitudesAdmision(baseFilters));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(solicitudesService.listSolicitudes).toHaveBeenCalledWith({
      searchTerm: "",
      status: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      page: 1,
      pageSize: 20,
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual(mockResponse.rows);
    expect(result.current.error).toBeNull();
  });

  it("resetea a los datos vacios y expone el mensaje del Error cuando falla la carga", async () => {
    vi.mocked(solicitudesService.listSolicitudes).mockRejectedValue(new Error("503 DB Offline"));

    const { result } = renderHook(() => useSolicitudesAdmision(baseFilters));

    await flush();

    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error de carga no es una instancia de Error", async () => {
    vi.mocked(solicitudesService.listSolicitudes).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useSolicitudesAdmision(baseFilters));

    await flush();

    expect(result.current.error).toBe("No se pudieron cargar las solicitudes de admision.");
  });

  it("create() llama al servicio y refresca la lista", async () => {
    vi.mocked(solicitudesService.listSolicitudes).mockResolvedValue(emptyData as any);
    vi.mocked(solicitudesService.createSolicitud).mockResolvedValue({ id: "sol-new" } as any);

    const { result } = renderHook(() => useSolicitudesAdmision(baseFilters));
    await flush();
    expect(solicitudesService.listSolicitudes).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.create({ fullName: "Juan" } as any);
    });

    expect(solicitudesService.createSolicitud).toHaveBeenCalledWith({ fullName: "Juan" });
    await flush();
    expect(solicitudesService.listSolicitudes).toHaveBeenCalledTimes(2);
  });

  it("create() devuelve null si ya hay una creacion en curso", async () => {
    vi.mocked(solicitudesService.listSolicitudes).mockResolvedValue(emptyData as any);
    vi.mocked(solicitudesService.createSolicitud).mockReturnValue(new Promise(() => {}) as any);

    const { result } = renderHook(() => useSolicitudesAdmision(baseFilters));
    await flush();

    act(() => {
      void result.current.create({ fullName: "Primero" } as any);
    });
    expect(result.current.isCreating).toBe(true);

    let secondResult: unknown;
    await act(async () => {
      secondResult = await result.current.create({ fullName: "Segundo" } as any);
    });

    expect(secondResult).toBeNull();
    expect(solicitudesService.createSolicitud).toHaveBeenCalledTimes(1);
  });

  it("update() llama al servicio y refresca la lista", async () => {
    vi.mocked(solicitudesService.listSolicitudes).mockResolvedValue(emptyData as any);
    vi.mocked(solicitudesService.updateSolicitud).mockResolvedValue({ id: "sol-1" } as any);

    const { result } = renderHook(() => useSolicitudesAdmision(baseFilters));
    await flush();

    await act(async () => {
      await result.current.update({ requestId: "sol-1" } as any);
    });

    expect(solicitudesService.updateSolicitud).toHaveBeenCalledWith({ requestId: "sol-1" });
    await flush();
    expect(solicitudesService.listSolicitudes).toHaveBeenCalledTimes(2);
  });

  it("changeState() llama a changeEstadoAdmision y refresca la lista", async () => {
    vi.mocked(solicitudesService.listSolicitudes).mockResolvedValue(emptyData as any);
    vi.mocked(solicitudesService.changeEstadoAdmision).mockResolvedValue({ id: "sol-1" } as any);

    const { result } = renderHook(() => useSolicitudesAdmision(baseFilters));
    await flush();

    await act(async () => {
      await result.current.changeState({ requestId: "sol-1", status: "review" } as any);
    });

    expect(solicitudesService.changeEstadoAdmision).toHaveBeenCalledWith({
      requestId: "sol-1",
      status: "review",
    });
    await flush();
    expect(solicitudesService.listSolicitudes).toHaveBeenCalledTimes(2);
  });

  it("convert() llama a convertSolicitudToVoluntario y refresca la lista", async () => {
    vi.mocked(solicitudesService.listSolicitudes).mockResolvedValue(emptyData as any);
    vi.mocked(solicitudesService.convertSolicitudToVoluntario).mockResolvedValue({
      id: "sol-1",
    } as any);

    const { result } = renderHook(() => useSolicitudesAdmision(baseFilters));
    await flush();

    await act(async () => {
      await result.current.convert({ requestId: "sol-1" } as any);
    });

    expect(solicitudesService.convertSolicitudToVoluntario).toHaveBeenCalledWith({
      requestId: "sol-1",
    });
    await flush();
    expect(solicitudesService.listSolicitudes).toHaveBeenCalledTimes(2);
  });

  it("generateRegistrationCode() llama al servicio y refresca la lista", async () => {
    vi.mocked(solicitudesService.listSolicitudes).mockResolvedValue(emptyData as any);
    vi.mocked(solicitudesService.generateRegistrationCodeBySolicitud).mockResolvedValue({
      code: "ABC123",
    } as any);

    const { result } = renderHook(() => useSolicitudesAdmision(baseFilters));
    await flush();

    let generated: unknown;
    await act(async () => {
      generated = await result.current.generateRegistrationCode({ requestId: "sol-1" } as any);
    });

    expect(solicitudesService.generateRegistrationCodeBySolicitud).toHaveBeenCalledWith({
      requestId: "sol-1",
    });
    expect(generated).toEqual({ code: "ABC123" });
    await flush();
    expect(solicitudesService.listSolicitudes).toHaveBeenCalledTimes(2);
  });

  it("cada accion mantiene su propio flag: convert() en curso no bloquea update()", async () => {
    vi.mocked(solicitudesService.listSolicitudes).mockResolvedValue(emptyData as any);
    vi.mocked(solicitudesService.convertSolicitudToVoluntario).mockReturnValue(
      new Promise(() => {}) as any
    );
    vi.mocked(solicitudesService.updateSolicitud).mockResolvedValue({ id: "sol-1" } as any);

    const { result } = renderHook(() => useSolicitudesAdmision(baseFilters));
    await flush();

    act(() => {
      void result.current.convert({ requestId: "sol-1" } as any);
    });
    expect(result.current.isConverting).toBe(true);

    await act(async () => {
      await result.current.update({ requestId: "sol-1" } as any);
    });

    expect(solicitudesService.updateSolicitud).toHaveBeenCalledTimes(1);
  });
});
