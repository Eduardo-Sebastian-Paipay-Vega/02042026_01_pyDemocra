import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../supabaseClient", () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    update: vi.fn().mockReturnThis(),
    rpc: vi.fn(),
  },
}));

vi.mock("../shared/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../shared/storage")>();
  return {
    ...actual,
    uploadFileToStorage: vi.fn(),
  };
});

import { supabase } from "../../../supabaseClient";
import * as storage from "../shared/storage";
import { getMyProfile, updateMyAvatar, updateMyFullName } from "./myAccount.service";

const mockUser = { id: "user-1", email: "user@example.com" };

describe("getMyProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lanza error si no hay sesion activa", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(getMyProfile()).rejects.toThrow("No hay sesión activa.");
  });

  it("propaga el mensaje del error de auth si existe", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: { message: "Sesion expirada" },
    });

    await expect(getMyProfile()).rejects.toThrow("Sesion expirada");
  });

  it("devuelve el perfil cuando la consulta es exitosa", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    const profile = {
      id: "user-1",
      tenant_id: "tenant-1",
      full_name: "Ana Torres",
      avatar_url: null,
      genero: "F",
      tipo_documento: "DNI",
      numero_documento: "12345678",
    };
    (supabase.single as any).mockResolvedValueOnce({ data: profile, error: null });

    const result = await getMyProfile();

    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(supabase.eq).toHaveBeenCalledWith("id", "user-1");
    expect(result).toEqual(profile);
  });

  it("lanza error si la consulta a profiles falla", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    (supabase.single as any).mockResolvedValueOnce({
      data: null,
      error: { message: "503 DB Offline" },
    });

    await expect(getMyProfile()).rejects.toThrow("503 DB Offline");
  });
});

describe("updateMyFullName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lanza error si no hay sesion activa", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(updateMyFullName("Nuevo Nombre")).rejects.toThrow(
      "No hay sesión activa."
    );
  });

  it("lanza error si el nombre recortado queda vacio", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    await expect(updateMyFullName("    ")).rejects.toThrow(
      "El nombre no puede estar vacío."
    );
    expect(supabase.update).not.toHaveBeenCalled();
  });

  it("actualiza el nombre recortado cuando todo es valido", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    (supabase.eq as any).mockResolvedValueOnce({ error: null });

    await updateMyFullName("  Ana Torres  ");

    expect(supabase.update).toHaveBeenCalledWith({ full_name: "Ana Torres" });
    expect(supabase.eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("lanza error si la actualizacion falla", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    (supabase.eq as any).mockResolvedValueOnce({
      error: { message: "Violates check constraint" },
    });

    await expect(updateMyFullName("Ana Torres")).rejects.toThrow(
      "Violates check constraint"
    );
  });
});

describe("updateMyAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lanza error si no hay sesion activa", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const file = new File(["data"], "avatar.png", { type: "image/png" });

    await expect(updateMyAvatar(file)).rejects.toThrow("No hay sesión activa.");
    expect(storage.uploadFileToStorage).not.toHaveBeenCalled();
  });

  it("lanza error si la subida no devuelve una url publica", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    vi.mocked(storage.uploadFileToStorage).mockResolvedValue({
      bucket: "avatars",
      path: "profiles/user-1/avatar.png",
      route: "avatars/profiles/user-1/avatar.png",
      publicUrl: null,
      fileName: "avatar.png",
    });
    const file = new File(["data"], "avatar.png", { type: "image/png" });

    await expect(updateMyAvatar(file)).rejects.toThrow(
      "No se pudo obtener la URL pública de la foto de perfil."
    );
  });

  it("sube el archivo, persiste la url via RPC y la devuelve", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    vi.mocked(storage.uploadFileToStorage).mockResolvedValue({
      bucket: "avatars",
      path: "profiles/user-1/avatar.png",
      route: "https://cdn.example.com/avatar.png",
      publicUrl: "https://cdn.example.com/avatar.png",
      fileName: "avatar.png",
    });
    (supabase.rpc as any).mockResolvedValue({ error: null });
    const file = new File(["data"], "avatar.png", { type: "image/png" });

    const result = await updateMyAvatar(file);

    expect(supabase.rpc).toHaveBeenCalledWith("fn_update_my_avatar", {
      p_url: "https://cdn.example.com/avatar.png",
    });
    expect(result).toBe("https://cdn.example.com/avatar.png");
  });

  it("lanza error si la llamada RPC falla", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    vi.mocked(storage.uploadFileToStorage).mockResolvedValue({
      bucket: "avatars",
      path: "profiles/user-1/avatar.png",
      route: "https://cdn.example.com/avatar.png",
      publicUrl: "https://cdn.example.com/avatar.png",
      fileName: "avatar.png",
    });
    (supabase.rpc as any).mockResolvedValue({
      error: { message: "Function fn_update_my_avatar not found" },
    });
    const file = new File(["data"], "avatar.png", { type: "image/png" });

    await expect(updateMyAvatar(file)).rejects.toThrow(
      "Function fn_update_my_avatar not found"
    );
  });
});
