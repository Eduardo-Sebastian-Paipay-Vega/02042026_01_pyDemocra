import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../supabaseClient", () => ({
  supabase: {
    schema: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  },
}));

import { supabase } from "../../supabaseClient";
import { generateProjectCode, generateItemCode } from "./generateCode";

describe("generateProjectCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("genera PROJ-001 cuando no hay codigos previos", async () => {
    (supabase.limit as any).mockResolvedValueOnce({ data: [], error: null });

    const code = await generateProjectCode(null);

    expect(supabase.schema).toHaveBeenCalledWith("ong");
    expect(supabase.from).toHaveBeenCalledWith("proyectos");
    expect(code).toBe("PROJ-001");
  });

  it("incrementa el ultimo codigo encontrado cuando no hay tenantId", async () => {
    (supabase.limit as any).mockResolvedValueOnce({
      data: [{ codigo: "PROJ-007" }],
      error: null,
    });

    const code = await generateProjectCode(null);

    expect(supabase.eq).not.toHaveBeenCalled();
    expect(code).toBe("PROJ-008");
  });

  it("filtra por tenant_id cuando se provee y usa el ultimo codigo devuelto", async () => {
    (supabase.eq as any).mockResolvedValueOnce({
      data: [{ codigo: "PROJ-012" }],
      error: null,
    });

    const code = await generateProjectCode("tenant-1");

    expect(supabase.eq).toHaveBeenCalledWith("tenant_id", "tenant-1");
    expect(code).toBe("PROJ-013");
  });

  it("hace fallback a un codigo basado en timestamp si la consulta falla", async () => {
    (supabase.limit as any).mockImplementationOnce(() => {
      throw new Error("network down");
    });

    const code = await generateProjectCode(null);

    expect(code).toMatch(/^PROJ-\d{3}$/);
  });
});

describe("generateItemCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("genera INV-001 cuando no hay codigos previos", async () => {
    ((supabase as any).limit as any).mockResolvedValueOnce({ data: [], error: null });

    const code = await generateItemCode(null);

    expect(supabase.schema).toHaveBeenCalledWith("ong");
    expect(supabase.from).toHaveBeenCalledWith("items");
    expect(code).toBe("INV-001");
  });

  it("incrementa el ultimo codigo encontrado cuando no hay tenantId", async () => {
    ((supabase as any).limit as any).mockResolvedValueOnce({
      data: [{ codigo: "INV-045" }],
      error: null,
    });

    const code = await generateItemCode(null);

    expect(code).toBe("INV-046");
  });

  it("filtra por tenant_id cuando se provee", async () => {
    ((supabase as any).eq as any).mockResolvedValueOnce({
      data: [{ codigo: "INV-099" }],
      error: null,
    });

    const code = await generateItemCode("tenant-2");

    expect((supabase as any).eq).toHaveBeenCalledWith("tenant_id", "tenant-2");
    expect(code).toBe("INV-100");
  });

  it("hace fallback a un codigo basado en timestamp si la consulta falla", async () => {
    ((supabase as any).limit as any).mockImplementationOnce(() => {
      throw new Error("network down");
    });

    const code = await generateItemCode(null);

    expect(code).toMatch(/^INV-\d{3}$/);
  });
});
