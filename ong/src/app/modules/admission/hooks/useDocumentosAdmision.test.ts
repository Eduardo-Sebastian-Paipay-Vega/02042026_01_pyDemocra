import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDocumentosAdmision } from "./useDocumentosAdmision";
import * as solicitudesService from "../../../services/admision/solicitudesAdmision.service";

vi.mock("../../../services/admision/solicitudesAdmision.service", () => ({
  createDocumentoAdmision: vi.fn(),
  listDocumentosBySolicitud: vi.fn(),
  removeDocumentoAdmision: vi.fn(),
  updateDocumentoAdmision: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useDocumentosAdmision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no llama al servicio y deja loading en false cuando requestId es null", () => {
    const { result } = renderHook(() => useDocumentosAdmision(null));

    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(solicitudesService.listDocumentosBySolicitud).not.toHaveBeenCalled();
  });

  it("carga los documentos cuando se provee un requestId", async () => {
    const mockRows = [
      { id: "doc-1", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
    ];
    vi.mocked(solicitudesService.listDocumentosBySolicitud).mockResolvedValue(mockRows as any);

    const { result } = renderHook(() => useDocumentosAdmision("sol-1"));

    expect(result.current.loading).toBe(true);

    await flush();

    expect(solicitudesService.listDocumentosBySolicitud).toHaveBeenCalledWith("sol-1");
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual(mockRows);
    expect(result.current.error).toBeNull();
  });

  it("expone el mensaje del Error cuando falla la carga", async () => {
    vi.mocked(solicitudesService.listDocumentosBySolicitud).mockRejectedValue(
      new Error("503 DB Offline")
    );

    const { result } = renderHook(() => useDocumentosAdmision("sol-1"));

    await flush();

    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBe("503 DB Offline");
  });

  it("usa un mensaje de fallback cuando el error de carga no es una instancia de Error", async () => {
    vi.mocked(solicitudesService.listDocumentosBySolicitud).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useDocumentosAdmision("sol-1"));

    await flush();

    expect(result.current.error).toBe("No se pudieron cargar los documentos de admision.");
  });

  it("create() antepone el nuevo documento y ordena por fecha descendente, sin refetch", async () => {
    const existingRow = {
      id: "doc-old",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    vi.mocked(solicitudesService.listDocumentosBySolicitud).mockResolvedValue([
      existingRow,
    ] as any);

    const newRow = {
      id: "doc-new",
      createdAt: "2026-02-01T00:00:00Z",
      updatedAt: "2026-02-01T00:00:00Z",
    };
    vi.mocked(solicitudesService.createDocumentoAdmision).mockResolvedValue(newRow as any);

    const { result } = renderHook(() => useDocumentosAdmision("sol-1"));
    await flush();

    await act(async () => {
      await result.current.create({ requestId: "sol-1" } as any);
    });

    expect(solicitudesService.createDocumentoAdmision).toHaveBeenCalledWith({
      requestId: "sol-1",
    });
    expect(result.current.rows).toEqual([newRow, existingRow]);
    expect(solicitudesService.listDocumentosBySolicitud).toHaveBeenCalledTimes(1);
  });

  it("create() devuelve null si ya hay una creacion en curso", async () => {
    vi.mocked(solicitudesService.listDocumentosBySolicitud).mockResolvedValue([] as any);
    vi.mocked(solicitudesService.createDocumentoAdmision).mockReturnValue(
      new Promise(() => {}) as any
    );

    const { result } = renderHook(() => useDocumentosAdmision("sol-1"));
    await flush();

    act(() => {
      void result.current.create({} as any);
    });
    expect(result.current.isCreating).toBe(true);

    let secondResult: unknown;
    await act(async () => {
      secondResult = await result.current.create({} as any);
    });

    expect(secondResult).toBeNull();
    expect(solicitudesService.createDocumentoAdmision).toHaveBeenCalledTimes(1);
  });

  it("update() reemplaza la fila existente cuando el id ya esta presente", async () => {
    const existingRow = {
      id: "doc-1",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    vi.mocked(solicitudesService.listDocumentosBySolicitud).mockResolvedValue([
      existingRow,
    ] as any);

    const updatedRow = {
      id: "doc-1",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-03-01T00:00:00Z",
    };
    vi.mocked(solicitudesService.updateDocumentoAdmision).mockResolvedValue(updatedRow as any);

    const { result } = renderHook(() => useDocumentosAdmision("sol-1"));
    await flush();

    await act(async () => {
      await result.current.update({ documentId: "doc-1" } as any);
    });

    expect(solicitudesService.updateDocumentoAdmision).toHaveBeenCalledWith({
      documentId: "doc-1",
    });
    expect(result.current.rows).toEqual([updatedRow]);
  });

  it("update() antepone la fila cuando el id no estaba presente", async () => {
    vi.mocked(solicitudesService.listDocumentosBySolicitud).mockResolvedValue([] as any);

    const updatedRow = {
      id: "doc-2",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    vi.mocked(solicitudesService.updateDocumentoAdmision).mockResolvedValue(updatedRow as any);

    const { result } = renderHook(() => useDocumentosAdmision("sol-1"));
    await flush();

    await act(async () => {
      await result.current.update({ documentId: "doc-2" } as any);
    });

    expect(result.current.rows).toEqual([updatedRow]);
  });

  it("remove() filtra la fila eliminada del estado local, sin refetch", async () => {
    const rowToKeep = { id: "doc-keep", createdAt: "x", updatedAt: "x" };
    const rowToRemove = { id: "doc-remove", createdAt: "x", updatedAt: "x" };
    vi.mocked(solicitudesService.listDocumentosBySolicitud).mockResolvedValue([
      rowToKeep,
      rowToRemove,
    ] as any);
    vi.mocked(solicitudesService.removeDocumentoAdmision).mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useDocumentosAdmision("sol-1"));
    await flush();

    await act(async () => {
      await result.current.remove("doc-remove");
    });

    expect(solicitudesService.removeDocumentoAdmision).toHaveBeenCalledWith("doc-remove");
    expect(result.current.rows).toEqual([rowToKeep]);
  });
});
