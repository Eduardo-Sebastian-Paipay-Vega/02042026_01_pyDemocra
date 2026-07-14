import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAdmissionReferenceCatalogs } from "./useAdmissionReferenceCatalogs";
import * as solicitudesService from "../../../services/admision/solicitudesAdmision.service";

vi.mock("../../../services/admision/solicitudesAdmision.service", () => ({
  getAdmissionReferenceCatalogs: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const emptyCatalogs = {
  documentTypes: [],
  genders: [],
  countries: [],
  volunteerStates: [],
};

describe("useAdmissionReferenceCatalogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga los catalogos al montar con loading inicial en true", async () => {
    const mockResponse = { ...emptyCatalogs, documentTypes: [{ id: "dni" }] };
    vi.mocked(solicitudesService.getAdmissionReferenceCatalogs).mockResolvedValue(
      mockResponse as any
    );

    const { result } = renderHook(() => useAdmissionReferenceCatalogs());

    expect(result.current.loading).toBe(true);

    await flush();

    expect(solicitudesService.getAdmissionReferenceCatalogs).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.catalogs).toEqual(mockResponse);
    expect(result.current.error).toBeNull();
  });

  it("resetea a los catalogos vacios y expone el mensaje del Error cuando falla la carga", async () => {
    vi.mocked(solicitudesService.getAdmissionReferenceCatalogs).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useAdmissionReferenceCatalogs());

    await flush();

    expect(result.current.catalogs).toEqual(emptyCatalogs);
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error de carga no es una instancia de Error", async () => {
    vi.mocked(solicitudesService.getAdmissionReferenceCatalogs).mockRejectedValue(
      "raw string failure"
    );

    const { result } = renderHook(() => useAdmissionReferenceCatalogs());

    await flush();

    expect(result.current.error).toBe("No se pudieron cargar los catalogos de admision.");
  });

  it("refresh() vuelve a llamar al servicio", async () => {
    vi.mocked(solicitudesService.getAdmissionReferenceCatalogs).mockResolvedValue(
      emptyCatalogs as any
    );

    const { result } = renderHook(() => useAdmissionReferenceCatalogs());
    await flush();
    expect(solicitudesService.getAdmissionReferenceCatalogs).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(solicitudesService.getAdmissionReferenceCatalogs).toHaveBeenCalledTimes(2);
  });
});
