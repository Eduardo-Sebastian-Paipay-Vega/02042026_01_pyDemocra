/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  TenantBootstrapLoadingScreen,
  TenantStatusScreen,
  TenantFinancialBanner,
  TenantInlineAccessDenied,
} from "../screens";

describe("screens.tsx — pantallas de estado del bootstrap de tenant", () => {
  it("TST-ERR-241: TenantBootstrapLoadingScreen muestra el copy de carga", () => {
    render(<TenantBootstrapLoadingScreen />);
    expect(screen.getByText("Cargando contexto del tenant")).toBeInTheDocument();
  });

  it.each([
    ["unauthenticated", "Sesion no disponible"],
    ["missing_profile", "Perfil no encontrado"],
    ["missing_tenant", "Tenant sin asignar"],
    ["invalid_tenant", "Tenant no disponible"],
    ["unsupported_industry", "Industria aun no soportada en este shell"],
    ["error", "No se pudo cargar la aplicacion"],
  ] as const)(
    "TST-ERR-242: TenantStatusScreen muestra el titulo correcto para status=%s",
    (status, expectedTitle) => {
      render(<TenantStatusScreen status={status as any} message={null} context={null} />);
      expect(screen.getByText(expectedTitle)).toBeInTheDocument();
    }
  );

  it("TST-ERR-243: TenantStatusScreen prioriza el mensaje explicito sobre el default", () => {
    render(
      <TenantStatusScreen
        status="error"
        message="Fallo custom del backend"
        context={null}
      />
    );
    expect(screen.getByText("Fallo custom del backend")).toBeInTheDocument();
  });

  it("TST-ERR-244: TenantStatusScreen interpola el industryTypeId en 'unsupported_industry' sin mensaje explicito", () => {
    render(
      <TenantStatusScreen
        status="unsupported_industry"
        message={null}
        context={{ tenant: { industryTypeId: "gym" } } as any}
      />
    );
    expect(screen.getByText(/La industria gym todavia no tiene shell dedicado aqui\./)).toBeInTheDocument();
  });

  it("TST-ERR-245: TenantStatusScreen renderiza el nodo 'action' cuando se provee", () => {
    render(
      <TenantStatusScreen
        status="error"
        message={null}
        context={null}
        action={<button>Reintentar</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });

  it("TST-ERR-246: TenantFinancialBanner no renderiza nada sin mensaje de politica financiera", () => {
    const { container } = render(<TenantFinancialBanner context={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("TST-ERR-247: TenantFinancialBanner muestra label y mensaje cuando la politica lo requiere", () => {
    render(
      <TenantFinancialBanner
        context={
          {
            financialPolicy: { label: "Suspendido", message: "Regulariza tu estado financiero." },
          } as any
        }
      />
    );
    expect(screen.getByText(/Estado financiero: Suspendido/)).toBeInTheDocument();
    expect(screen.getByText("Regulariza tu estado financiero.")).toBeInTheDocument();
  });

  it("TST-ERR-248: TenantInlineAccessDenied usa textos default y acepta overrides", () => {
    const { rerender } = render(<TenantInlineAccessDenied />);
    expect(screen.getByText("Sin acceso a esta ruta")).toBeInTheDocument();

    rerender(<TenantInlineAccessDenied title="Bloqueado" description="Motivo custom" />);
    expect(screen.getByText("Bloqueado")).toBeInTheDocument();
    expect(screen.getByText("Motivo custom")).toBeInTheDocument();
  });
});
