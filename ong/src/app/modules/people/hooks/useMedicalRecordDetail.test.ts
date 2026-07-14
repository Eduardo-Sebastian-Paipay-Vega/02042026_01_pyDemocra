import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMedicalRecordDetail } from "./useMedicalRecordDetail";
import * as medicalRecordsService from "../../../services/clinico/medicalRecords.service";

vi.mock("../../../services/clinico/medicalRecords.service", () => ({
  getSensitiveMedicalDetail: vi.fn(),
}));

describe("useMedicalRecordDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("empieza en el estado inicial sin llamar al servicio", () => {
    const { result } = renderHook(() => useMedicalRecordDetail());

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(medicalRecordsService.getSensitiveMedicalDetail).not.toHaveBeenCalled();
  });

  it("open() carga el detalle y lo devuelve cuando el servicio resuelve un valor", async () => {
    const mockDetail = { scope: "beneficiaries", personId: "ben-1" };
    vi.mocked(medicalRecordsService.getSensitiveMedicalDetail).mockResolvedValue(
      mockDetail as any
    );

    const { result } = renderHook(() => useMedicalRecordDetail());

    let returned: unknown;
    await act(async () => {
      returned = await result.current.open({
        scope: "beneficiaries",
        personId: "ben-1",
        accessReason: "Revision de rutina",
      });
    });

    expect(medicalRecordsService.getSensitiveMedicalDetail).toHaveBeenCalledWith({
      scope: "beneficiaries",
      personId: "ben-1",
      accessReason: "Revision de rutina",
    });
    expect(returned).toEqual(mockDetail);
    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("open() marca la ficha como no disponible cuando el servicio resuelve null", async () => {
    vi.mocked(medicalRecordsService.getSensitiveMedicalDetail).mockResolvedValue(null as any);

    const { result } = renderHook(() => useMedicalRecordDetail());

    await act(async () => {
      await result.current.open({
        scope: "volunteers",
        personId: "vol-1",
        accessReason: "Revision",
      });
    });

    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("La ficha sensible ya no esta disponible.");
  });

  it("open() relanza el error y expone el mensaje cuando el servicio rechaza", async () => {
    vi.mocked(medicalRecordsService.getSensitiveMedicalDetail).mockRejectedValue(
      new Error("Acceso denegado")
    );

    const { result } = renderHook(() => useMedicalRecordDetail());

    // Importante: el callback de act() no debe rechazar, o React no llega a
    // volcar (flush) el setState del catch antes de propagar el rechazo.
    // Por eso se atrapa el error DENTRO de act() y se verifica aparte.
    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.open({
          scope: "beneficiaries",
          personId: "ben-1",
          accessReason: "Revision",
        });
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toBe("Acceso denegado");
    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Acceso denegado");
  });

  it("open() usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(medicalRecordsService.getSensitiveMedicalDetail).mockRejectedValue(
      "raw string failure"
    );

    const { result } = renderHook(() => useMedicalRecordDetail());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.open({
          scope: "beneficiaries",
          personId: "ben-1",
          accessReason: "Revision",
        });
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBe("raw string failure");
    expect(result.current.error).toBe("No se pudo cargar la ficha sensible.");
  });

  it("clear() vuelve al estado inicial", async () => {
    vi.mocked(medicalRecordsService.getSensitiveMedicalDetail).mockResolvedValue({
      scope: "beneficiaries",
      personId: "ben-1",
    } as any);

    const { result } = renderHook(() => useMedicalRecordDetail());

    await act(async () => {
      await result.current.open({
        scope: "beneficiaries",
        personId: "ben-1",
        accessReason: "Revision",
      });
    });
    expect(result.current.detail).not.toBeNull();

    act(() => {
      result.current.clear();
    });

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("replace() setea el detalle directamente sin llamar al servicio", () => {
    const { result } = renderHook(() => useMedicalRecordDetail());
    const replacement = { scope: "beneficiaries", personId: "ben-2" } as any;

    act(() => {
      result.current.replace(replacement);
    });

    expect(result.current.detail).toEqual(replacement);
    expect(medicalRecordsService.getSensitiveMedicalDetail).not.toHaveBeenCalled();
  });

  it("replace(null) marca la ficha como no disponible", () => {
    const { result } = renderHook(() => useMedicalRecordDetail());

    act(() => {
      result.current.replace(null);
    });

    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("La ficha sensible ya no esta disponible.");
  });
});
