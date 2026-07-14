import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCuentaFinancieraDetail } from "./useCuentaFinancieraDetail";
import * as cuentasService from "../../../services/recursos/cuentasFinancieras.service";

vi.mock("../../../services/recursos/cuentasFinancieras.service", () => ({
  getCuentaById: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useCuentaFinancieraDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene el estado inicial cuando accountId es null (no llama al servicio)", () => {
    const { result } = renderHook(() => useCuentaFinancieraDetail(null));

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(cuentasService.getCuentaById).not.toHaveBeenCalled();
  });

  it("carga el detalle correctamente cuando se provee un accountId", async () => {
    const mockDetail = { id: "cta-1", nombre: "Cuenta principal" };
    vi.mocked(cuentasService.getCuentaById).mockResolvedValue(mockDetail as any);

    const { result } = renderHook(() => useCuentaFinancieraDetail("cta-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(cuentasService.getCuentaById).toHaveBeenCalledWith("cta-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.error).toBeNull();
  });

  it("expone el mensaje del Error cuando la carga falla", async () => {
    vi.mocked(cuentasService.getCuentaById).mockRejectedValue(new Error("503 DB Offline"));

    const { result } = renderHook(() => useCuentaFinancieraDetail("cta-1"));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(cuentasService.getCuentaById).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useCuentaFinancieraDetail("cta-1"));

    await flush();

    expect(result.current.error).toBe("No se pudo cargar el detalle de la cuenta.");
  });

  it("refresh() vuelve a llamar al servicio", async () => {
    vi.mocked(cuentasService.getCuentaById).mockResolvedValue({ id: "cta-1" } as any);

    const { result } = renderHook(() => useCuentaFinancieraDetail("cta-1"));
    await flush();

    expect(cuentasService.getCuentaById).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(cuentasService.getCuentaById).toHaveBeenCalledTimes(2);
  });
});
