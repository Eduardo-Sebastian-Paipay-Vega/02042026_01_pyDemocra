import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useKardex } from "./useKardex";
import * as inventarioMovimientosService from "../../../services/recursos/inventarioMovimientos.service";

vi.mock("../../../services/recursos/inventarioMovimientos.service", () => ({
  listKardex: vi.fn(),
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
  locationId: undefined,
  typeCode: undefined,
  typeId: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  page: 1,
  pageSize: 20,
} as any;

describe("useKardex", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga el kardex al montar con loading inicial en true, con typeCode resuelto a 'all' por defecto", async () => {
    const mockResponse = { ...emptyData, rows: [{ id: "kx-1" }], total: 1 };
    vi.mocked(inventarioMovimientosService.listKardex).mockResolvedValue(mockResponse as any);

    const { result } = renderHook(() => useKardex(baseFilters));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(inventarioMovimientosService.listKardex).toHaveBeenCalledWith({
      searchTerm: "",
      itemId: undefined,
      locationId: undefined,
      typeCode: "all",
      typeId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      page: 1,
      pageSize: 20,
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual(mockResponse.rows);
    expect(result.current.error).toBeNull();
  });

  it("usa typeId como typeCode cuando typeCode no viene definido y typeId es un string", async () => {
    vi.mocked(inventarioMovimientosService.listKardex).mockResolvedValue(emptyData as any);

    const filters = { ...baseFilters, typeId: "salida" };
    renderHook(() => useKardex(filters));

    await flush();

    expect(inventarioMovimientosService.listKardex).toHaveBeenCalledWith(
      expect.objectContaining({ typeCode: "salida", typeId: "salida" })
    );
  });

  it("resetea a los datos vacios y expone el mensaje del Error cuando falla la carga", async () => {
    vi.mocked(inventarioMovimientosService.listKardex).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useKardex(baseFilters));

    await flush();

    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error de carga no es una instancia de Error", async () => {
    vi.mocked(inventarioMovimientosService.listKardex).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useKardex(baseFilters));

    await flush();

    expect(result.current.error).toBe("No se pudo cargar el kardex.");
  });

  it("refresh() vuelve a llamar al servicio", async () => {
    vi.mocked(inventarioMovimientosService.listKardex).mockResolvedValue(emptyData as any);

    const { result } = renderHook(() => useKardex(baseFilters));
    await flush();
    expect(inventarioMovimientosService.listKardex).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(inventarioMovimientosService.listKardex).toHaveBeenCalledTimes(2);
  });
});
