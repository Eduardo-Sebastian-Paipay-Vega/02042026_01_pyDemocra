import { describe, it, expect, vi, beforeEach } from "vitest";
import { createInAppNotification } from "./create.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    comunicacionesSchema: vi.fn(),
  };
});

describe("Notificaciones Create Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Network Failures & Supabase Offline", () => {
    it("TST-ERR-038: Debe capturar fallo asincrono en insert (Timeout 503)", async () => {
      vi.mocked(shared.comunicacionesSchema).mockReturnValue({
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ data: null, error: { message: "503 Network Error" } }),
        }),
      } as any);

      await expect(
        createInAppNotification({
          tenantId: "tenant-1",
          recipientId: "user-1",
          titulo: "Test",
          mensaje: "Message",
        })
      ).rejects.toThrow("503 Network Error");
    });
  });

  describe("SAD PATHS: Injections & Corrupt Payloads", () => {
    it("TST-ERR-039: Debe propagar error si la DB rechaza un input nulo inyectado (Ej. recipientId = null)", async () => {
      vi.mocked(shared.comunicacionesSchema).mockReturnValue({
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ data: null, error: { message: "null value in column id_usuario violates not-null constraint" } }),
        }),
      } as any);

      await expect(
        createInAppNotification({
          tenantId: "tenant-1",
          recipientId: null as any,
          titulo: "Test",
          mensaje: "Message",
        })
      ).rejects.toThrow("null value in column id_usuario violates not-null constraint");
    });
  });
});
