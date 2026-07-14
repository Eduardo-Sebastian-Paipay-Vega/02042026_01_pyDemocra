import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useOnboardingAdmision } from "./useOnboardingAdmision";
import * as solicitudesService from "../../../services/admision/solicitudesAdmision.service";

vi.mock("../../../services/admision/solicitudesAdmision.service", () => ({
  listOnboardingBySolicitud: vi.fn(),
  startOnboardingForVolunteer: vi.fn(),
  toggleOnboardingStep: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useOnboardingAdmision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no llama al servicio y deja loading en false cuando requestId es null", () => {
    const { result } = renderHook(() => useOnboardingAdmision(null));

    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(solicitudesService.listOnboardingBySolicitud).not.toHaveBeenCalled();
  });

  it("carga el onboarding cuando se provee un requestId", async () => {
    const mockRows = [{ stepId: "step-1", order: 1, stepName: "Bienvenida" }];
    vi.mocked(solicitudesService.listOnboardingBySolicitud).mockResolvedValue(mockRows as any);

    const { result } = renderHook(() => useOnboardingAdmision("sol-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(solicitudesService.listOnboardingBySolicitud).toHaveBeenCalledWith("sol-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual(mockRows);
    expect(result.current.error).toBeNull();
  });

  it("expone el mensaje del Error cuando falla la carga", async () => {
    vi.mocked(solicitudesService.listOnboardingBySolicitud).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useOnboardingAdmision("sol-1"));

    await flush();

    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error de carga no es una instancia de Error", async () => {
    vi.mocked(solicitudesService.listOnboardingBySolicitud).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useOnboardingAdmision("sol-1"));

    await flush();

    expect(result.current.error).toBe("No se pudo cargar el onboarding de admision.");
  });

  it("start() reemplaza las filas ordenadas por order y stepName", async () => {
    vi.mocked(solicitudesService.listOnboardingBySolicitud).mockResolvedValue([] as any);
    const response = [
      { stepId: "step-2", order: 1, stepName: "Zeta" },
      { stepId: "step-1", order: 1, stepName: "Alfa" },
    ];
    vi.mocked(solicitudesService.startOnboardingForVolunteer).mockResolvedValue(response as any);

    const { result } = renderHook(() => useOnboardingAdmision("sol-1"));
    await flush();

    await act(async () => {
      await result.current.start({ requestId: "sol-1" } as any);
    });

    expect(solicitudesService.startOnboardingForVolunteer).toHaveBeenCalledWith({
      requestId: "sol-1",
    });
    expect(result.current.rows).toEqual([response[1], response[0]]);
  });

  it("start() devuelve null si ya hay un inicio en curso", async () => {
    vi.mocked(solicitudesService.listOnboardingBySolicitud).mockResolvedValue([] as any);
    vi.mocked(solicitudesService.startOnboardingForVolunteer).mockReturnValue(
      new Promise(() => {}) as any
    );

    const { result } = renderHook(() => useOnboardingAdmision("sol-1"));
    await flush();

    act(() => {
      void result.current.start({} as any);
    });
    expect(result.current.isStarting).toBe(true);

    let secondResult: unknown;
    await act(async () => {
      secondResult = await result.current.start({} as any);
    });

    expect(secondResult).toBeNull();
    expect(solicitudesService.startOnboardingForVolunteer).toHaveBeenCalledTimes(1);
  });

  it("updateStep() reemplaza el paso existente cuando el stepId ya esta presente", async () => {
    const existingStep = { stepId: "step-1", order: 1, stepName: "Bienvenida" };
    vi.mocked(solicitudesService.listOnboardingBySolicitud).mockResolvedValue([
      existingStep,
    ] as any);

    const updatedStep = { stepId: "step-1", order: 1, stepName: "Bienvenida", completed: true };
    vi.mocked(solicitudesService.toggleOnboardingStep).mockResolvedValue(updatedStep as any);

    const { result } = renderHook(() => useOnboardingAdmision("sol-1"));
    await flush();

    await act(async () => {
      await result.current.updateStep({ stepId: "step-1" } as any);
    });

    expect(solicitudesService.toggleOnboardingStep).toHaveBeenCalledWith({ stepId: "step-1" });
    expect(result.current.rows).toEqual([updatedStep]);
  });

  it("updateStep() agrega el paso cuando el stepId no estaba presente", async () => {
    vi.mocked(solicitudesService.listOnboardingBySolicitud).mockResolvedValue([] as any);

    const newStep = { stepId: "step-2", order: 2, stepName: "Documentos" };
    vi.mocked(solicitudesService.toggleOnboardingStep).mockResolvedValue(newStep as any);

    const { result } = renderHook(() => useOnboardingAdmision("sol-1"));
    await flush();

    await act(async () => {
      await result.current.updateStep({ stepId: "step-2" } as any);
    });

    expect(result.current.rows).toEqual([newStep]);
  });

  it("updateStep() devuelve null si ya hay una actualizacion en curso", async () => {
    vi.mocked(solicitudesService.listOnboardingBySolicitud).mockResolvedValue([] as any);
    vi.mocked(solicitudesService.toggleOnboardingStep).mockReturnValue(
      new Promise(() => {}) as any
    );

    const { result } = renderHook(() => useOnboardingAdmision("sol-1"));
    await flush();

    act(() => {
      void result.current.updateStep({} as any);
    });
    expect(result.current.isUpdating).toBe(true);

    let secondResult: unknown;
    await act(async () => {
      secondResult = await result.current.updateStep({} as any);
    });

    expect(secondResult).toBeNull();
    expect(solicitudesService.toggleOnboardingStep).toHaveBeenCalledTimes(1);
  });
});
