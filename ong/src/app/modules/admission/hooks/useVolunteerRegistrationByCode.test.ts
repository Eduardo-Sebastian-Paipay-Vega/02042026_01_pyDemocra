import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useVolunteerRegistrationByCode } from "./useVolunteerRegistrationByCode";
import * as registrationService from "../../../services/admision/volunteerRegistration.service";

vi.mock("../../../services/admision/volunteerRegistration.service", () => ({
  consumeVolunteerRegistrationCode: vi.fn(),
  getVolunteerRegistrationCatalogs: vi.fn(),
  previewVolunteerRegistrationCode: vi.fn(),
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
};

describe("useVolunteerRegistrationByCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga los catalogos publicos al montar con catalogsLoading inicial en true", async () => {
    const mockResponse = { ...emptyCatalogs, documentTypes: [{ id: "dni" }] };
    vi.mocked(registrationService.getVolunteerRegistrationCatalogs).mockResolvedValue(
      mockResponse as any
    );

    const { result } = renderHook(() => useVolunteerRegistrationByCode());

    expect(result.current.catalogsLoading).toBe(true);

    await flush();

    expect(registrationService.getVolunteerRegistrationCatalogs).toHaveBeenCalledTimes(1);
    expect(result.current.catalogsLoading).toBe(false);
    expect(result.current.catalogs).toEqual(mockResponse);
    expect(result.current.catalogsError).toBeNull();
  });

  it("resetea a catalogos vacios y expone el mensaje del Error cuando falla la carga de catalogos", async () => {
    vi.mocked(registrationService.getVolunteerRegistrationCatalogs).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useVolunteerRegistrationByCode());

    await flush();

    expect(result.current.catalogs).toEqual(emptyCatalogs);
    expect(result.current.catalogsError).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error de catalogos no es una instancia de Error", async () => {
    vi.mocked(registrationService.getVolunteerRegistrationCatalogs).mockRejectedValue(
      "raw string failure"
    );

    const { result } = renderHook(() => useVolunteerRegistrationByCode());

    await flush();

    expect(result.current.catalogsError).toBe("No se pudieron cargar los catalogos publicos.");
  });

  it("refreshCatalogs() vuelve a llamar al servicio", async () => {
    vi.mocked(registrationService.getVolunteerRegistrationCatalogs).mockResolvedValue(
      emptyCatalogs as any
    );

    const { result } = renderHook(() => useVolunteerRegistrationByCode());
    await flush();
    expect(registrationService.getVolunteerRegistrationCatalogs).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refreshCatalogs();
    });
    await flush();

    expect(registrationService.getVolunteerRegistrationCatalogs).toHaveBeenCalledTimes(2);
  });

  it("loadPreview() llama al servicio, guarda el preview y lo devuelve", async () => {
    vi.mocked(registrationService.getVolunteerRegistrationCatalogs).mockResolvedValue(
      emptyCatalogs as any
    );
    const previewResponse = { code: "ABC123", volunteerName: "Juan" };
    vi.mocked(registrationService.previewVolunteerRegistrationCode).mockResolvedValue(
      previewResponse as any
    );

    const { result } = renderHook(() => useVolunteerRegistrationByCode());
    await flush();

    let returned: unknown;
    await act(async () => {
      returned = await result.current.loadPreview({ code: "ABC123" });
    });

    expect(registrationService.previewVolunteerRegistrationCode).toHaveBeenCalledWith({
      code: "ABC123",
    });
    expect(returned).toEqual(previewResponse);
    expect(result.current.preview).toEqual(previewResponse);
    expect(result.current.previewLoading).toBe(false);
    expect(result.current.previewError).toBeNull();
  });

  it("loadPreview() limpia el preview y expone el mensaje del Error cuando falla", async () => {
    vi.mocked(registrationService.getVolunteerRegistrationCatalogs).mockResolvedValue(
      emptyCatalogs as any
    );
    vi.mocked(registrationService.previewVolunteerRegistrationCode).mockRejectedValue(
      new Error("Codigo invalido")
    );

    const { result } = renderHook(() => useVolunteerRegistrationByCode());
    await flush();

    let returned: unknown;
    await act(async () => {
      returned = await result.current.loadPreview({ code: "BAD" });
    });

    expect(returned).toBeNull();
    expect(result.current.preview).toBeNull();
    expect(result.current.previewError).toBe("Codigo invalido");
  });

  it("loadPreview() usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(registrationService.getVolunteerRegistrationCatalogs).mockResolvedValue(
      emptyCatalogs as any
    );
    vi.mocked(registrationService.previewVolunteerRegistrationCode).mockRejectedValue(
      "raw string failure"
    );

    const { result } = renderHook(() => useVolunteerRegistrationByCode());
    await flush();

    await act(async () => {
      await result.current.loadPreview({ code: "BAD" });
    });

    expect(result.current.previewError).toBe("No se pudo validar el codigo de registro.");
  });

  it("submit() llama al servicio y devuelve el resultado", async () => {
    vi.mocked(registrationService.getVolunteerRegistrationCatalogs).mockResolvedValue(
      emptyCatalogs as any
    );
    const submitResponse = { volunteerId: "vol-1" };
    vi.mocked(registrationService.consumeVolunteerRegistrationCode).mockResolvedValue(
      submitResponse as any
    );

    const { result } = renderHook(() => useVolunteerRegistrationByCode());
    await flush();

    let returned: unknown;
    await act(async () => {
      returned = await result.current.submit({ code: "ABC123" } as any);
    });

    expect(registrationService.consumeVolunteerRegistrationCode).toHaveBeenCalledWith({
      code: "ABC123",
    });
    expect(returned).toEqual(submitResponse);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it("submit() expone el mensaje del Error y devuelve null cuando falla", async () => {
    vi.mocked(registrationService.getVolunteerRegistrationCatalogs).mockResolvedValue(
      emptyCatalogs as any
    );
    vi.mocked(registrationService.consumeVolunteerRegistrationCode).mockRejectedValue(
      new Error("Codigo ya utilizado")
    );

    const { result } = renderHook(() => useVolunteerRegistrationByCode());
    await flush();

    let returned: unknown;
    await act(async () => {
      returned = await result.current.submit({ code: "USED" } as any);
    });

    expect(returned).toBeNull();
    expect(result.current.submitError).toBe("Codigo ya utilizado");
  });

  it("submit() usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(registrationService.getVolunteerRegistrationCatalogs).mockResolvedValue(
      emptyCatalogs as any
    );
    vi.mocked(registrationService.consumeVolunteerRegistrationCode).mockRejectedValue(
      "raw string failure"
    );

    const { result } = renderHook(() => useVolunteerRegistrationByCode());
    await flush();

    await act(async () => {
      await result.current.submit({ code: "X" } as any);
    });

    expect(result.current.submitError).toBe("No se pudo completar el registro del voluntario.");
  });

  it("clearPreview()/clearPreviewError()/clearSubmitError() limpian sus respectivos estados", async () => {
    vi.mocked(registrationService.getVolunteerRegistrationCatalogs).mockResolvedValue(
      emptyCatalogs as any
    );
    vi.mocked(registrationService.previewVolunteerRegistrationCode).mockResolvedValue({
      code: "ABC123",
    } as any);
    vi.mocked(registrationService.consumeVolunteerRegistrationCode).mockRejectedValue(
      new Error("fallo")
    );

    const { result } = renderHook(() => useVolunteerRegistrationByCode());
    await flush();

    await act(async () => {
      await result.current.loadPreview({ code: "ABC123" });
    });
    expect(result.current.preview).not.toBeNull();

    act(() => {
      result.current.clearPreview();
    });
    expect(result.current.preview).toBeNull();

    await act(async () => {
      await result.current.submit({ code: "X" } as any);
    });
    expect(result.current.submitError).not.toBeNull();

    act(() => {
      result.current.clearSubmitError();
    });
    expect(result.current.submitError).toBeNull();

    act(() => {
      result.current.clearPreviewError();
    });
    expect(result.current.previewError).toBeNull();
  });
});
