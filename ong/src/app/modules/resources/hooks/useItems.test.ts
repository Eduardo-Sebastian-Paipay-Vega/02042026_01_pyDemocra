import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useItems } from "./useItems";
import * as itemsService from "../../../services/recursos/items.service";

vi.mock("../../../services/recursos/items.service", () => ({
  createItem: vi.fn(),
  listItems: vi.fn(),
  removeOrArchiveItem: vi.fn(),
  updateItem: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const baseFilters = {
  searchTerm: "",
  state: undefined,
  page: 1,
  pageSize: 20,
} as any;

describe("useItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga la lista al montar con loading inicial en true", async () => {
    const mockResponse = {
      rows: [{ id: "item-1", nombre: "Sillas" }],
      total: 1,
      page: 1,
      pageSize: 20,
      warnings: [],
      unitOptions: [],
      stateOptions: [],
    };
    vi.mocked(itemsService.listItems).mockResolvedValue(mockResponse as any);

    const { result } = renderHook(() => useItems(baseFilters));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(itemsService.listItems).toHaveBeenCalledWith({
      searchTerm: "",
      state: undefined,
      page: 1,
      pageSize: 20,
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual(mockResponse.rows);
    expect(result.current.error).toBeNull();
  });

  it("resetea a los datos vacios y expone el mensaje del Error cuando falla la carga", async () => {
    vi.mocked(itemsService.listItems).mockRejectedValue(new Error("503 DB Offline"));

    const { result } = renderHook(() => useItems(baseFilters));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error de carga no es una instancia de Error", async () => {
    vi.mocked(itemsService.listItems).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useItems(baseFilters));

    await flush();

    expect(result.current.error).toBe("No se pudieron cargar los items.");
  });

  it("create() llama al servicio y refresca la lista", async () => {
    vi.mocked(itemsService.listItems).mockResolvedValue({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 20,
      warnings: [],
      unitOptions: [],
      stateOptions: [],
    } as any);
    vi.mocked(itemsService.createItem).mockResolvedValue({ id: "item-new" } as any);

    const { result } = renderHook(() => useItems(baseFilters));
    await flush();
    expect(itemsService.listItems).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.create({ name: "Sillas" } as any);
    });

    expect(itemsService.createItem).toHaveBeenCalledWith({ name: "Sillas" });
    expect(result.current.isCreating).toBe(false);
    await flush();
    expect(itemsService.listItems).toHaveBeenCalledTimes(2);
  });

  it("create() devuelve null y no llama al servicio si ya hay una creacion en curso", async () => {
    vi.mocked(itemsService.listItems).mockResolvedValue({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 20,
      warnings: [],
      unitOptions: [],
      stateOptions: [],
    } as any);
    vi.mocked(itemsService.createItem).mockReturnValue(new Promise(() => {}) as any);

    const { result } = renderHook(() => useItems(baseFilters));
    await flush();

    act(() => {
      void result.current.create({ name: "Primero" } as any);
    });
    expect(result.current.isCreating).toBe(true);

    let secondResult: unknown;
    await act(async () => {
      secondResult = await result.current.create({ name: "Segundo" } as any);
    });

    expect(secondResult).toBeNull();
    expect(itemsService.createItem).toHaveBeenCalledTimes(1);
  });

  it("update() llama al servicio y refresca la lista", async () => {
    vi.mocked(itemsService.listItems).mockResolvedValue({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 20,
      warnings: [],
      unitOptions: [],
      stateOptions: [],
    } as any);
    vi.mocked(itemsService.updateItem).mockResolvedValue({ id: "item-1" } as any);

    const { result } = renderHook(() => useItems(baseFilters));
    await flush();

    await act(async () => {
      await result.current.update({ itemId: "item-1" } as any);
    });

    expect(itemsService.updateItem).toHaveBeenCalledWith({ itemId: "item-1" });
    await flush();
    expect(itemsService.listItems).toHaveBeenCalledTimes(2);
  });

  it("remove() llama al servicio y refresca la lista", async () => {
    vi.mocked(itemsService.listItems).mockResolvedValue({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 20,
      warnings: [],
      unitOptions: [],
      stateOptions: [],
    } as any);
    vi.mocked(itemsService.removeOrArchiveItem).mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useItems(baseFilters));
    await flush();

    await act(async () => {
      await result.current.remove("item-1");
    });

    expect(itemsService.removeOrArchiveItem).toHaveBeenCalledWith("item-1");
    await flush();
    expect(itemsService.listItems).toHaveBeenCalledTimes(2);
  });
});
