import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateTenantPage } from "./CreateTenantPage";

// Mock de fetch para el endpoint
global.fetch = vi.fn();

// Mock de supabase
vi.mock("../../../supabaseClient", () => ({
  supabase: {
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: { session: { access_token: "mock_token" } },
        error: null,
      }),
    },
  },
}));

describe("CreateTenantPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza el formulario correctamente", () => {
    render(<CreateTenantPage />);
    expect(screen.getByText("Crea tu Organización")).toBeInTheDocument();
    expect(screen.getByText("Nombre de la Organización")).toBeInTheDocument();
    expect(screen.getByText("RUC (Tax ID)")).toBeInTheDocument();
    expect(screen.getByText("Tu Correo Electrónico")).toBeInTheDocument();
    expect(screen.getByText("Contraseña")).toBeInTheDocument();
  });

  it("muestra error si el RUC no tiene 11 dígitos", async () => {
    render(<CreateTenantPage />);
    
    fireEvent.change(screen.getByPlaceholderText("Ej. Fundación Esperanza"), { target: { value: "Mi ONG" } });
    fireEvent.change(screen.getByPlaceholderText("11 dígitos (Ej. 20123456789)"), { target: { value: "123" } });
    fireEvent.change(screen.getByPlaceholderText("fundador@organizacion.org"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });
    
    fireEvent.click(screen.getByText("Crear Organización"));
    
    await waitFor(() => {
      expect(screen.getByText("El RUC debe tener exactamente 11 dígitos numéricos")).toBeInTheDocument();
    });
    
    // No debe haber llamado a fetch ni signup
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("llama a la API exitosamente y redirige", async () => {
    // Simulamos que el assign está disponible en JSDOM
    const originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    window.location = { ...originalLocation, assign: vi.fn() };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tenant_id: "123" }),
    });

    render(<CreateTenantPage />);
    
    fireEvent.change(screen.getByPlaceholderText("Ej. Fundación Esperanza"), { target: { value: "Mi ONG" } });
    fireEvent.change(screen.getByPlaceholderText("11 dígitos (Ej. 20123456789)"), { target: { value: "12345678901" } });
    fireEvent.change(screen.getByPlaceholderText("fundador@organizacion.org"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });
    
    fireEvent.click(screen.getByText("Crear Organización"));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/onboarding/bootstrap-tenant",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"industry_type_id":"ONG"'),
        })
      );
      expect(window.location.assign).toHaveBeenCalledWith("/ong/");
    });

    // Restauramos el original
    window.location = originalLocation;
  });

  it("muestra error global si la API falla", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "El RUC ya está registrado." }),
    });

    render(<CreateTenantPage />);
    
    fireEvent.change(screen.getByPlaceholderText("Ej. Fundación Esperanza"), { target: { value: "Mi ONG" } });
    fireEvent.change(screen.getByPlaceholderText("11 dígitos (Ej. 20123456789)"), { target: { value: "12345678901" } });
    fireEvent.change(screen.getByPlaceholderText("fundador@organizacion.org"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });
    
    fireEvent.click(screen.getByText("Crear Organización"));
    
    await waitFor(() => {
      expect(screen.getByText("El RUC ya está registrado.")).toBeInTheDocument();
    });
  });

  it("muestra error si falla la restricción de clave foránea (industry_type_id inválido)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "La inserción o actualización en la tabla 'tenants' viola la restricción de clave externa" }),
    });

    render(<CreateTenantPage />);
    
    fireEvent.change(screen.getByPlaceholderText("Ej. Fundación Esperanza"), { target: { value: "Mi ONG" } });
    fireEvent.change(screen.getByPlaceholderText("11 dígitos (Ej. 20123456789)"), { target: { value: "12345678901" } });
    fireEvent.change(screen.getByPlaceholderText("fundador@organizacion.org"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });
    
    fireEvent.click(screen.getByText("Crear Organización"));
    
    await waitFor(() => {
      expect(screen.getByText(/viola la restricción de clave externa/)).toBeInTheDocument();
    });
  });
});
