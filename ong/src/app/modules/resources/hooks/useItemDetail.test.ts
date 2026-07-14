import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useItemDetail } from "./useItemDetail";
import * as itemsService from "../../../services/recursos/items.service";

vi.mock("../../../services/recursos/items.service", () => ({
  getItemById: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useItemDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene el estado inicial cuando itemId es null (no llama al servicio)", () => {
    const { result } = renderHook(() => useItemDetail(null));

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(itemsService.getItemById).not.toHaveBeenCalled();
  });

  it("carga el detalle correctamente cuando se provee un itemId", async () => {
    const mockDetail = { id: "item-1", nombre: "Sillas plegables" };
    vi.mocked(itemsService.getItemById).mockResolvedValue(mockDetail as any);

    const { result } = renderHook(() => useItemDetail("item-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(itemsService.getItemById).toHaveBeenCalledWith("item-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.error).toBeNull();
  });

  it("expone el mensaje del Error cuando la carga falla", async () => {
    vi.mocked(itemsService.getItemById).mockRejectedValue(new Error("503 DB Offline"));

    const { result } = renderHook(() => useItemDetail("item-1"));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(itemsService.getItemById).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useItemDetail("item-1"));

    await flush();

    expect(result.current.error).toBe("No se pudo cargar el detalle del item.");
  });

  it("refresh() vuelve a llamar al servicio", async () => {
    vi.mocked(itemsService.getItemById).mockResolvedValue({ id: "item-1" } as any);

    const { result } = renderHook(() => useItemDetail("item-1"));
    await flush();

    expect(itemsService.getItemById).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(itemsService.getItemById).toHaveBeenCalledTimes(2);
  });
});
