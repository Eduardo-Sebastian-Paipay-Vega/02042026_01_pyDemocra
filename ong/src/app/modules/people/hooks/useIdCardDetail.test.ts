import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useIdCardDetail } from "./useIdCardDetail";
import * as idCardsService from "../../../services/personas/idCards.service";

vi.mock("../../../services/personas/idCards.service", () => ({
  getIdCardDetail: vi.fn(),
  getIdCardTemplateDetail: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useIdCardDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene el estado inicial cuando cardId es null (no llama al servicio)", () => {
    const { result } = renderHook(() => useIdCardDetail(null));

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(idCardsService.getIdCardDetail).not.toHaveBeenCalled();
  });

  it("carga el detalle correctamente cuando se provee un cardId", async () => {
    const mockDetail = { id: "card-1", codigo: "VC-0001" };
    vi.mocked(idCardsService.getIdCardDetail).mockResolvedValue(mockDetail as any);

    const { result } = renderHook(() => useIdCardDetail("card-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(idCardsService.getIdCardDetail).toHaveBeenCalledWith("card-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.error).toBeNull();
  });

  it("marca la credencial como no disponible cuando el detalle resuelve null", async () => {
    vi.mocked(idCardsService.getIdCardDetail).mockResolvedValue(null as any);

    const { result } = renderHook(() => useIdCardDetail("card-1"));

    await flush();

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("La credencial ya no esta disponible.");
  });

  it("expone el mensaje del Error cuando la carga falla", async () => {
    vi.mocked(idCardsService.getIdCardDetail).mockRejectedValue(new Error("503 DB Offline"));

    const { result } = renderHook(() => useIdCardDetail("card-1"));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(idCardsService.getIdCardDetail).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useIdCardDetail("card-1"));

    await flush();

    expect(result.current.error).toBe("No se pudo cargar el detalle de la credencial.");
  });

  it("refresh() vuelve a llamar al servicio", async () => {
    vi.mocked(idCardsService.getIdCardDetail).mockResolvedValue({ id: "card-1" } as any);

    const { result } = renderHook(() => useIdCardDetail("card-1"));
    await flush();

    expect(idCardsService.getIdCardDetail).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(idCardsService.getIdCardDetail).toHaveBeenCalledTimes(2);
  });
});
