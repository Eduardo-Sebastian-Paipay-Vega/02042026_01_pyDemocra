import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCategoriasFinancieras } from "./useCategoriasFinancieras";
import * as categoriasService from "../../../services/recursos/categoriasFinancieras.service";

vi.mock("../../../services/recursos/categoriasFinancieras.service", () => ({
  createCategoria: vi.fn(),
  listCategorias: vi.fn(),
  removeOrArchiveCategoria: vi.fn(),
  updateCategoria: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const baseFilters = {
  searchTerm: "",
  state: undefined,
  type: undefined,
  page: 1,
  pageSize: 20,
} as any;

describe("useCategoriasFinancieras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga la lista al montar con loading inicial en true", async () => {
    const mockResponse = {
      rows: [{ id: "cat-1", nombre: "Donaciones" }],
      total: 1,
      page: 1,
      pageSize: 20,
      warnings: [],
    };
    vi.mocked(categoriasService.listCategorias).mockResolvedValue(mockResponse as any);

    const { result } = renderHook(() => useCategoriasFinancieras(baseFilters));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(categoriasService.listCategorias).toHaveBeenCalledWith({
      searchTerm: "",
      state: undefined,
      type: undefined,
      page: 1,
      pageSize: 20,
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual(mockResponse.rows);
    expect(result.current.total).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it("resetea a los datos vacios y expone el mensaje del Error cuando falla la carga", async () => {
    vi.mocked(categoriasService.listCategorias).mockRejectedValue(new Error("503 DB Offline"));

    const { result } = renderHook(() => useCategoriasFinancieras(baseFilters));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error de carga no es una instancia de Error", async () => {
    vi.mocked(categoriasService.listCategorias).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useCategoriasFinancieras(baseFilters));

    await flush();

    expect(result.current.error).toBe("No se pudieron cargar las categorias.");
  });

  it("create() llama al servicio, refresca la lista y expone isCreating mientras esta en curso", async () => {
    vi.mocked(categoriasService.listCategorias).mockResolvedValue({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 20,
      warnings: [],
    } as any);

    const { result } = renderHook(() => useCategoriasFinancieras(baseFilters));
    await flush();
    expect(categoriasService.listCategorias).toHaveBeenCalledTimes(1);

    let resolveCreate: (value: unknown) => void;
    vi.mocked(categoriasService.createCategoria).mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }) as any
    );

    let createPromise!: Promise<unknown>;
    act(() => {
      createPromise = result.current.create({ name: "Nueva", type: "ingreso" } as any);
    });

    expect(result.current.isCreating).toBe(true);

    await act(async () => {
      resolveCreate({ id: "cat-new" });
      await createPromise;
    });

    expect(result.current.isCreating).toBe(false);
    expect(categoriasService.createCategoria).toHaveBeenCalledWith({
      name: "Nueva",
      type: "ingreso",
    });
    // refresh() dispara un segundo listCategorias tras el create exitoso
    await flush();
    expect(categoriasService.listCategorias).toHaveBeenCalledTimes(2);
  });

  it("create() devuelve null y no llama al servicio si ya hay una creacion en curso", async () => {
    vi.mocked(categoriasService.listCategorias).mockResolvedValue({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 20,
      warnings: [],
    } as any);
    vi.mocked(categoriasService.createCategoria).mockReturnValue(
      new Promise(() => {}) as any // nunca resuelve durante este test
    );

    const { result } = renderHook(() => useCategoriasFinancieras(baseFilters));
    await flush();

    act(() => {
      void result.current.create({ name: "Primera", type: "ingreso" } as any);
    });
    expect(result.current.isCreating).toBe(true);

    let secondResult: unknown;
    await act(async () => {
      secondResult = await result.current.create({ name: "Segunda", type: "ingreso" } as any);
    });

    expect(secondResult).toBeNull();
    expect(categoriasService.createCategoria).toHaveBeenCalledTimes(1);
  });

  it("update() llama al servicio y refresca la lista", async () => {
    vi.mocked(categoriasService.listCategorias).mockResolvedValue({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 20,
      warnings: [],
    } as any);
    vi.mocked(categoriasService.updateCategoria).mockResolvedValue({ id: "cat-1" } as any);

    const { result } = renderHook(() => useCategoriasFinancieras(baseFilters));
    await flush();

    await act(async () => {
      await result.current.update({ categoryId: "cat-1", type: "egreso" } as any);
    });

    expect(categoriasService.updateCategoria).toHaveBeenCalledWith({
      categoryId: "cat-1",
      type: "egreso",
    });
    expect(result.current.isUpdating).toBe(false);
    await flush();
    expect(categoriasService.listCategorias).toHaveBeenCalledTimes(2);
  });

  it("remove() llama al servicio y refresca la lista", async () => {
    vi.mocked(categoriasService.listCategorias).mockResolvedValue({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 20,
      warnings: [],
    } as any);
    vi.mocked(categoriasService.removeOrArchiveCategoria).mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useCategoriasFinancieras(baseFilters));
    await flush();

    await act(async () => {
      await result.current.remove("cat-1");
    });

    expect(categoriasService.removeOrArchiveCategoria).toHaveBeenCalledWith("cat-1");
    expect(result.current.isRemoving).toBe(false);
    await flush();
    expect(categoriasService.listCategorias).toHaveBeenCalledTimes(2);
  });
});
