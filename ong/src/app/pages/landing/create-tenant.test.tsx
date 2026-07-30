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
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "mock_token" } },
      }),
    },
  },
}));

describe("CreateTenantPage v2.0 Wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza el Paso 1: Validación Fiscal RUC (SUNAT) por defecto", () => {
    render(<CreateTenantPage />);
    expect(screen.getByText("Paso 1 de 5")).toBeInTheDocument();
    expect(screen.getByText("Valida tu RUC Institucional")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ej. 20123456789")).toBeInTheDocument();
  });

  it("muestra advertencia si el RUC ingresado no tiene 11 dígitos", async () => {
    render(<CreateTenantPage />);
    
    fireEvent.change(screen.getByPlaceholderText("Ej. 20123456789"), { target: { value: "123" } });
    fireEvent.click(screen.getByText("Validar RUC y Continuar"));
    
    await waitFor(() => {
      expect(screen.getByText("El RUC debe constar de 11 dígitos numéricos.")).toBeInTheDocument();
    });
    
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("valida RUC exitosamente con SUNAT y avanza al Paso 2", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tenant_name: "FUNDACION DEMO S.A.C." }),
    });

    render(<CreateTenantPage />);
    
    fireEvent.change(screen.getByPlaceholderText("Ej. 20123456789"), { target: { value: "20123456789" } });
    fireEvent.click(screen.getByText("Validar RUC y Continuar"));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/onboarding/validate-ruc/20123456789");
      expect(screen.getByText("Paso 2 de 5")).toBeInTheDocument();
      expect(screen.getByText("Datos del Representante Legal")).toBeInTheDocument();
    });
  });
});
