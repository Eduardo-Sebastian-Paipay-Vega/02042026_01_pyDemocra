import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCategoriaFinancieraDetail } from "./useCategoriaFinancieraDetail";
import * as categoriasService from "../../../services/recursos/categoriasFinancieras.service";

vi.mock("../../../services/recursos/categoriasFinancieras.service", () => ({
  getCategoriaById: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useCategoriaFinancieraDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene el estado inicial cuando categoryId es null (no llama al servicio)", () => {
    const { result } = renderHook(() => useCategoriaFinancieraDetail(null));

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(categoriasService.getCategoriaById).not.toHaveBeenCalled();
  });

  it("carga el detalle correctamente cuando se provee un categoryId", async () => {
    const mockDetail = { id: "cat-1", nombre: "Donaciones" };
    vi.mocked(categoriasService.getCategoriaById).mockResolvedValue(mockDetail as any);

    const { result } = renderHook(() => useCategoriaFinancieraDetail("cat-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(categoriasService.getCategoriaById).toHaveBeenCalledWith("cat-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.error).toBeNull();
  });

  it("expone el mensaje del Error cuando la carga falla", async () => {
    vi.mocked(categoriasService.getCategoriaById).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useCategoriaFinancieraDetail("cat-1"));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(categoriasService.getCategoriaById).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useCategoriaFinancieraDetail("cat-1"));

    await flush();

    expect(result.current.error).toBe("No se pudo cargar el detalle de la categoria.");
  });

  it("refresh() vuelve a llamar al servicio", async () => {
    vi.mocked(categoriasService.getCategoriaById).mockResolvedValue({ id: "cat-1" } as any);

    const { result } = renderHook(() => useCategoriaFinancieraDetail("cat-1"));
    await flush();

    expect(categoriasService.getCategoriaById).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(categoriasService.getCategoriaById).toHaveBeenCalledTimes(2);
  });
});
