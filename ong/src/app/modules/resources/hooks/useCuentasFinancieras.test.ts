import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCuentasFinancieras } from "./useCuentasFinancieras";
import * as cuentasService from "../../../services/recursos/cuentasFinancieras.service";

vi.mock("../../../services/recursos/cuentasFinancieras.service", () => ({
  createCuenta: vi.fn(),
  listCuentas: vi.fn(),
  removeOrArchiveCuenta: vi.fn(),
  updateCuenta: vi.fn(),
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

const emptyData = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  warnings: [],
  currencyOptions: [],
  accountTypeOptions: [],
};

describe("useCuentasFinancieras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga la lista al montar con loading inicial en true", async () => {
    const mockResponse = { ...emptyData, rows: [{ id: "cta-1" }], total: 1 };
    vi.mocked(cuentasService.listCuentas).mockResolvedValue(mockResponse as any);

    const { result } = renderHook(() => useCuentasFinancieras(baseFilters));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(cuentasService.listCuentas).toHaveBeenCalledWith({
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
    vi.mocked(cuentasService.listCuentas).mockRejectedValue(new Error("503 DB Offline"));

    const { result } = renderHook(() => useCuentasFinancieras(baseFilters));

    await flush();

    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error de carga no es una instancia de Error", async () => {
    vi.mocked(cuentasService.listCuentas).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useCuentasFinancieras(baseFilters));

    await flush();

    expect(result.current.error).toBe("No se pudieron cargar las cuentas.");
  });

  it("create() llama al servicio y refresca la lista", async () => {
    vi.mocked(cuentasService.listCuentas).mockResolvedValue(emptyData as any);
    vi.mocked(cuentasService.createCuenta).mockResolvedValue({ id: "cta-new" } as any);

    const { result } = renderHook(() => useCuentasFinancieras(baseFilters));
    await flush();
    expect(cuentasService.listCuentas).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.create({ name: "Cuenta nueva" } as any);
    });

    expect(cuentasService.createCuenta).toHaveBeenCalledWith({ name: "Cuenta nueva" });
    expect(result.current.isCreating).toBe(false);
    await flush();
    expect(cuentasService.listCuentas).toHaveBeenCalledTimes(2);
  });

  it("create() devuelve null y no llama al servicio si ya hay una creacion en curso", async () => {
    vi.mocked(cuentasService.listCuentas).mockResolvedValue(emptyData as any);
    vi.mocked(cuentasService.createCuenta).mockReturnValue(new Promise(() => {}) as any);

    const { result } = renderHook(() => useCuentasFinancieras(baseFilters));
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
    expect(cuentasService.createCuenta).toHaveBeenCalledTimes(1);
  });

  it("update() llama al servicio y refresca la lista", async () => {
    vi.mocked(cuentasService.listCuentas).mockResolvedValue(emptyData as any);
    vi.mocked(cuentasService.updateCuenta).mockResolvedValue({ id: "cta-1" } as any);

    const { result } = renderHook(() => useCuentasFinancieras(baseFilters));
    await flush();

    await act(async () => {
      await result.current.update({ accountId: "cta-1" } as any);
    });

    expect(cuentasService.updateCuenta).toHaveBeenCalledWith({ accountId: "cta-1" });
    await flush();
    expect(cuentasService.listCuentas).toHaveBeenCalledTimes(2);
  });

  it("remove() llama al servicio y refresca la lista", async () => {
    vi.mocked(cuentasService.listCuentas).mockResolvedValue(emptyData as any);
    vi.mocked(cuentasService.removeOrArchiveCuenta).mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useCuentasFinancieras(baseFilters));
    await flush();

    await act(async () => {
      await result.current.remove("cta-1");
    });

    expect(cuentasService.removeOrArchiveCuenta).toHaveBeenCalledWith("cta-1");
    await flush();
    expect(cuentasService.listCuentas).toHaveBeenCalledTimes(2);
  });
});
