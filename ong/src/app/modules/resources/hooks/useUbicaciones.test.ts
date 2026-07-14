import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUbicaciones } from "./useUbicaciones";
import * as ubicacionesService from "../../../services/recursos/ubicaciones.service";

vi.mock("../../../services/recursos/ubicaciones.service", () => ({
  createUbicacion: vi.fn(),
  listUbicaciones: vi.fn(),
  removeOrArchiveUbicacion: vi.fn(),
  updateUbicacion: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const baseFilters = {
  searchTerm: "",
  page: 1,
  pageSize: 20,
} as any;

describe("useUbicaciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga la lista al montar con loading inicial en true", async () => {
    const mockResponse = {
      rows: [{ id: "loc-1", nombre: "Almacen central" }],
      total: 1,
      page: 1,
      pageSize: 20,
      warnings: [],
      countryOptions: [],
    };
    vi.mocked(ubicacionesService.listUbicaciones).mockResolvedValue(mockResponse as any);

    const { result } = renderHook(() => useUbicaciones(baseFilters));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(ubicacionesService.listUbicaciones).toHaveBeenCalledWith({
      searchTerm: "",
      page: 1,
      pageSize: 20,
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual(mockResponse.rows);
    expect(result.current.error).toBeNull();
  });

  it("resetea a los datos vacios y expone el mensaje del Error cuando falla la carga", async () => {
    vi.mocked(ubicacionesService.listUbicaciones).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useUbicaciones(baseFilters));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error de carga no es una instancia de Error", async () => {
    vi.mocked(ubicacionesService.listUbicaciones).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useUbicaciones(baseFilters));

    await flush();

    expect(result.current.error).toBe("No se pudieron cargar las ubicaciones.");
  });

  it("create() llama al servicio y refresca la lista", async () => {
    vi.mocked(ubicacionesService.listUbicaciones).mockResolvedValue({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 20,
      warnings: [],
      countryOptions: [],
    } as any);
    vi.mocked(ubicacionesService.createUbicacion).mockResolvedValue({ id: "loc-new" } as any);

    const { result } = renderHook(() => useUbicaciones(baseFilters));
    await flush();
    expect(ubicacionesService.listUbicaciones).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.create({ name: "Almacen norte" } as any);
    });

    expect(ubicacionesService.createUbicacion).toHaveBeenCalledWith({ name: "Almacen norte" });
    expect(result.current.isCreating).toBe(false);
    await flush();
    expect(ubicacionesService.listUbicaciones).toHaveBeenCalledTimes(2);
  });

  it("create() devuelve null y no llama al servicio si ya hay una creacion en curso", async () => {
    vi.mocked(ubicacionesService.listUbicaciones).mockResolvedValue({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 20,
      warnings: [],
      countryOptions: [],
    } as any);
    vi.mocked(ubicacionesService.createUbicacion).mockReturnValue(new Promise(() => {}) as any);

    const { result } = renderHook(() => useUbicaciones(baseFilters));
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
    expect(ubicacionesService.createUbicacion).toHaveBeenCalledTimes(1);
  });

  it("update() llama al servicio y refresca la lista", async () => {
    vi.mocked(ubicacionesService.listUbicaciones).mockResolvedValue({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 20,
      warnings: [],
      countryOptions: [],
    } as any);
    vi.mocked(ubicacionesService.updateUbicacion).mockResolvedValue({ id: "loc-1" } as any);

    const { result } = renderHook(() => useUbicaciones(baseFilters));
    await flush();

    await act(async () => {
      await result.current.update({ locationId: "loc-1" } as any);
    });

    expect(ubicacionesService.updateUbicacion).toHaveBeenCalledWith({ locationId: "loc-1" });
    await flush();
    expect(ubicacionesService.listUbicaciones).toHaveBeenCalledTimes(2);
  });

  it("remove() llama al servicio y refresca la lista", async () => {
    vi.mocked(ubicacionesService.listUbicaciones).mockResolvedValue({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 20,
      warnings: [],
      countryOptions: [],
    } as any);
    vi.mocked(ubicacionesService.removeOrArchiveUbicacion).mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useUbicaciones(baseFilters));
    await flush();

    await act(async () => {
      await result.current.remove("loc-1");
    });

    expect(ubicacionesService.removeOrArchiveUbicacion).toHaveBeenCalledWith("loc-1");
    await flush();
    expect(ubicacionesService.listUbicaciones).toHaveBeenCalledTimes(2);
  });
});
