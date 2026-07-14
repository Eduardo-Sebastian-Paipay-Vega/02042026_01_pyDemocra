import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBeneficiaryDetail } from "./useBeneficiaryDetail";
import * as beneficiariesService from "../../../services/personas/beneficiaries.service";

vi.mock("../../../services/personas/beneficiaries.service", () => ({
  getBeneficiaryDetail: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useBeneficiaryDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene el estado inicial cuando beneficiaryId es null (no llama al servicio)", () => {
    const { result } = renderHook(() => useBeneficiaryDetail(null));

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(beneficiariesService.getBeneficiaryDetail).not.toHaveBeenCalled();
  });

  it("carga el detalle correctamente cuando se provee un beneficiaryId", async () => {
    const mockDetail = { id: "ben-1", nombre: "Maria Lopez" };
    vi.mocked(beneficiariesService.getBeneficiaryDetail).mockResolvedValue(mockDetail as any);

    const { result } = renderHook(() => useBeneficiaryDetail("ben-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(beneficiariesService.getBeneficiaryDetail).toHaveBeenCalledWith("ben-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.error).toBeNull();
  });

  it("marca el beneficiario como no disponible cuando el detalle resuelve null", async () => {
    vi.mocked(beneficiariesService.getBeneficiaryDetail).mockResolvedValue(null as any);

    const { result } = renderHook(() => useBeneficiaryDetail("ben-1"));

    await flush();

    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("El beneficiario ya no esta disponible.");
  });

  it("expone el mensaje del Error cuando la carga falla", async () => {
    vi.mocked(beneficiariesService.getBeneficiaryDetail).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useBeneficiaryDetail("ben-1"));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(beneficiariesService.getBeneficiaryDetail).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useBeneficiaryDetail("ben-1"));

    await flush();

    expect(result.current.error).toBe("No se pudo cargar el detalle del beneficiario.");
  });

  it("refresh() vuelve a llamar al servicio", async () => {
    vi.mocked(beneficiariesService.getBeneficiaryDetail).mockResolvedValue({
      id: "ben-1",
    } as any);

    const { result } = renderHook(() => useBeneficiaryDetail("ben-1"));
    await flush();

    expect(beneficiariesService.getBeneficiaryDetail).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(beneficiariesService.getBeneficiaryDetail).toHaveBeenCalledTimes(2);
  });

  it("replace() setea el detalle directamente sin llamar al servicio", () => {
    const { result } = renderHook(() => useBeneficiaryDetail(null));
    const replacement = { id: "ben-2", nombre: "Nuevo" } as any;

    act(() => {
      result.current.replace(replacement);
    });

    expect(result.current.detail).toEqual(replacement);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(beneficiariesService.getBeneficiaryDetail).not.toHaveBeenCalled();
  });

  it("replace(null) marca el beneficiario como no disponible", () => {
    const { result } = renderHook(() => useBeneficiaryDetail(null));

    act(() => {
      result.current.replace(null);
    });

    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("El beneficiario ya no esta disponible.");
  });
});
