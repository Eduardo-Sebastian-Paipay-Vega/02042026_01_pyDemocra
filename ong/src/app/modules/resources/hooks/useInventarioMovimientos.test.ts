import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useInventarioMovimientos } from "./useInventarioMovimientos";
import * as movimientosService from "../../../services/recursos/inventarioMovimientos.service";

vi.mock("../../../services/recursos/inventarioMovimientos.service", () => ({
  createTransaccionInventario: vi.fn(),
  listTransaccionesInventario: vi.fn(),
  removeOrVoidTransaccionInventario: vi.fn(),
  updateTransaccionInventario: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const emptyData = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  warnings: [],
  itemOptions: [],
  locationOptions: [],
  typeOptions: [],
};

const baseFilters = {
  searchTerm: "",
  itemId: undefined,
  typeCode: undefined,
  typeId: undefined,
  originId: undefined,
  destinationId: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  includeDeleted: false,
  page: 1,
  pageSize: 20,
} as any;

describe("useInventarioMovimientos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga la lista al montar con loading inicial en true, con typeCode resuelto a 'all' por defecto", async () => {
    const mockResponse = { ...emptyData, rows: [{ id: "mov-1" }], total: 1 };
    vi.mocked(movimientosService.listTransaccionesInventario).mockResolvedValue(
      mockResponse as any
    );

    const { result } = renderHook(() => useInventarioMovimientos(baseFilters));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(movimientosService.listTransaccionesInventario).toHaveBeenCalledWith({
      searchTerm: "",
      itemId: undefined,
      typeCode: "all",
      typeId: undefined,
      originId: undefined,
      destinationId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      includeDeleted: false,
      page: 1,
      pageSize: 20,
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual(mockResponse.rows);
    expect(result.current.error).toBeNull();
  });

  it("usa typeId como typeCode cuando typeCode no viene definido y typeId es un string", async () => {
    vi.mocked(movimientosService.listTransaccionesInventario).mockResolvedValue(
      emptyData as any
    );

    const filters = { ...baseFilters, typeCode: undefined, typeId: "ingreso" };
    renderHook(() => useInventarioMovimientos(filters));

    await flush();

    expect(movimientosService.listTransaccionesInventario).toHaveBeenCalledWith(
      expect.objectContaining({ typeCode: "ingreso", typeId: "ingreso" })
    );
  });

  it("respeta el typeCode explicito aunque typeId tambien sea un string", async () => {
    vi.mocked(movimientosService.listTransaccionesInventario).mockResolvedValue(
      emptyData as any
    );

    const filters = { ...baseFilters, typeCode: "salida", typeId: "ingreso" };
    renderHook(() => useInventarioMovimientos(filters));

    await flush();

    expect(movimientosService.listTransaccionesInventario).toHaveBeenCalledWith(
      expect.objectContaining({ typeCode: "salida", typeId: "ingreso" })
    );
  });

  it("resetea a los datos vacios y expone el mensaje del Error cuando falla la carga", async () => {
    vi.mocked(movimientosService.listTransaccionesInventario).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useInventarioMovimientos(baseFilters));

    await flush();

    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error de carga no es una instancia de Error", async () => {
    vi.mocked(movimientosService.listTransaccionesInventario).mockRejectedValue(
      "raw string failure"
    );

    const { result } = renderHook(() => useInventarioMovimientos(baseFilters));

    await flush();

    expect(result.current.error).toBe("No se pudieron cargar los movimientos.");
  });

  it("create() llama al servicio y refresca la lista", async () => {
    vi.mocked(movimientosService.listTransaccionesInventario).mockResolvedValue(
      emptyData as any
    );
    vi.mocked(movimientosService.createTransaccionInventario).mockResolvedValue({
      id: "mov-new",
    } as any);

    const { result } = renderHook(() => useInventarioMovimientos(baseFilters));
    await flush();
    expect(movimientosService.listTransaccionesInventario).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.create({ itemId: "item-1", quantity: 5 } as any);
    });

    expect(movimientosService.createTransaccionInventario).toHaveBeenCalledWith({
      itemId: "item-1",
      quantity: 5,
    });
    expect(result.current.isCreating).toBe(false);
    await flush();
    expect(movimientosService.listTransaccionesInventario).toHaveBeenCalledTimes(2);
  });

  it("create() devuelve null y no llama al servicio si ya hay una creacion en curso", async () => {
    vi.mocked(movimientosService.listTransaccionesInventario).mockResolvedValue(
      emptyData as any
    );
    vi.mocked(movimientosService.createTransaccionInventario).mockReturnValue(
      new Promise(() => {}) as any
    );

    const { result } = renderHook(() => useInventarioMovimientos(baseFilters));
    await flush();

    act(() => {
      void result.current.create({ itemId: "item-1" } as any);
    });
    expect(result.current.isCreating).toBe(true);

    let secondResult: unknown;
    await act(async () => {
      secondResult = await result.current.create({ itemId: "item-2" } as any);
    });

    expect(secondResult).toBeNull();
    expect(movimientosService.createTransaccionInventario).toHaveBeenCalledTimes(1);
  });

  it("update() llama al servicio y refresca la lista", async () => {
    vi.mocked(movimientosService.listTransaccionesInventario).mockResolvedValue(
      emptyData as any
    );
    vi.mocked(movimientosService.updateTransaccionInventario).mockResolvedValue({
      id: "mov-1",
    } as any);

    const { result } = renderHook(() => useInventarioMovimientos(baseFilters));
    await flush();

    await act(async () => {
      await result.current.update({ movementId: "mov-1" } as any);
    });

    expect(movimientosService.updateTransaccionInventario).toHaveBeenCalledWith({
      movementId: "mov-1",
    });
    await flush();
    expect(movimientosService.listTransaccionesInventario).toHaveBeenCalledTimes(2);
  });

  it("remove() llama al servicio con el input completo, refresca la lista y devuelve true", async () => {
    vi.mocked(movimientosService.listTransaccionesInventario).mockResolvedValue(
      emptyData as any
    );
    vi.mocked(movimientosService.removeOrVoidTransaccionInventario).mockResolvedValue(
      undefined as any
    );

    const { result } = renderHook(() => useInventarioMovimientos(baseFilters));
    await flush();

    let removeResult: unknown;
    await act(async () => {
      removeResult = await result.current.remove({ movementId: "mov-1" } as any);
    });

    expect(movimientosService.removeOrVoidTransaccionInventario).toHaveBeenCalledWith({
      movementId: "mov-1",
    });
    expect(removeResult).toBe(true);
    await flush();
    expect(movimientosService.listTransaccionesInventario).toHaveBeenCalledTimes(2);
  });

  it("remove() devuelve null y no llama al servicio si ya hay una eliminacion en curso", async () => {
    vi.mocked(movimientosService.listTransaccionesInventario).mockResolvedValue(
      emptyData as any
    );
    vi.mocked(movimientosService.removeOrVoidTransaccionInventario).mockReturnValue(
      new Promise(() => {}) as any
    );

    const { result } = renderHook(() => useInventarioMovimientos(baseFilters));
    await flush();

    act(() => {
      void result.current.remove({ movementId: "mov-1" } as any);
    });
    expect(result.current.isRemoving).toBe(true);

    let secondResult: unknown;
    await act(async () => {
      secondResult = await result.current.remove({ movementId: "mov-2" } as any);
    });

    expect(secondResult).toBeNull();
    expect(movimientosService.removeOrVoidTransaccionInventario).toHaveBeenCalledTimes(1);
  });
});
