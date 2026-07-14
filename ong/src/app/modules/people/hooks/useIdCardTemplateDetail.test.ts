import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useIdCardTemplateDetail } from "./useIdCardTemplateDetail";
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

describe("useIdCardTemplateDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene el estado inicial cuando templateId es null (no llama al servicio)", () => {
    const { result } = renderHook(() => useIdCardTemplateDetail(null));

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(idCardsService.getIdCardTemplateDetail).not.toHaveBeenCalled();
  });

  it("carga el detalle correctamente cuando se provee un templateId", async () => {
    const mockDetail = { id: "tpl-1", nombre: "CR80 estandar" };
    vi.mocked(idCardsService.getIdCardTemplateDetail).mockResolvedValue(mockDetail as any);

    const { result } = renderHook(() => useIdCardTemplateDetail("tpl-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(idCardsService.getIdCardTemplateDetail).toHaveBeenCalledWith("tpl-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.error).toBeNull();
  });

  it("marca la plantilla como no disponible cuando el detalle resuelve null", async () => {
    vi.mocked(idCardsService.getIdCardTemplateDetail).mockResolvedValue(null as any);

    const { result } = renderHook(() => useIdCardTemplateDetail("tpl-1"));

    await flush();

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("La plantilla ya no esta disponible.");
  });

  it("expone el mensaje del Error cuando la carga falla", async () => {
    vi.mocked(idCardsService.getIdCardTemplateDetail).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useIdCardTemplateDetail("tpl-1"));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(idCardsService.getIdCardTemplateDetail).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useIdCardTemplateDetail("tpl-1"));

    await flush();

    expect(result.current.error).toBe("No se pudo cargar el detalle de la plantilla.");
  });

  it("refresh() vuelve a llamar al servicio", async () => {
    vi.mocked(idCardsService.getIdCardTemplateDetail).mockResolvedValue({ id: "tpl-1" } as any);

    const { result } = renderHook(() => useIdCardTemplateDetail("tpl-1"));
    await flush();

    expect(idCardsService.getIdCardTemplateDetail).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(idCardsService.getIdCardTemplateDetail).toHaveBeenCalledTimes(2);
  });
});
