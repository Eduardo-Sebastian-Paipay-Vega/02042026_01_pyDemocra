import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Areas } from "./Areas";
import * as areasService from "../services/gobernanza/areas.service";
import { toast } from "sonner";

vi.mock("../services/gobernanza/areas.service", () => ({
  listAreas: vi.fn(),
  createArea: vi.fn(),
  updateArea: vi.fn(),
  toggleAreaActive: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Provide a mock ErrorBoundary to test boundaries
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary-fallback">Something went wrong.</div>;
    }
    return this.props.children;
  }
}

describe("Areas Page - Zero-Fail Tolerance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle infinite loading gracefully", async () => {
    // Simulate an infinite promise that never resolves
    vi.mocked(areasService.listAreas).mockImplementation(
      () => new Promise(() => {}) // pending forever
    );

    render(
      <ErrorBoundary>
        <Areas />
      </ErrorBoundary>
    );

    // Initial state is loading (since we never resolve)
    // The loading state inside DataTable should be shown (e.g. skeleton or empty loading message)
    // Wait for the component to be rendered
    await waitFor(() => {
      // It shouldn't crash
      expect(screen.getByText("Áreas Organizacionales")).toBeInTheDocument();
    });
  });

  it("should handle network failure on initial load without crashing", async () => {
    vi.mocked(areasService.listAreas).mockRejectedValue(new Error("503 Timeout"));

    render(
      <ErrorBoundary>
        <Areas />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("503 Timeout");
      expect(screen.getByText("Áreas Organizacionales")).toBeInTheDocument();
    });
  });

  it("should not break when creating an area fails", async () => {
    vi.mocked(areasService.listAreas).mockResolvedValue([]);
    vi.mocked(areasService.createArea).mockRejectedValue(new Error("Save failed"));

    render(<Areas />);

    await waitFor(() => {
      expect(screen.getByText("No se encontraron áreas. Crea la primera con el botón de arriba.")).toBeInTheDocument();
    });

    const createButton = screen.getAllByRole("button", { name: /Nueva área/i })[0];
    fireEvent.click(createButton);

    const inputName = screen.getByPlaceholderText("Nombre del área");
    const inputCode = screen.getByPlaceholderText("Ej. ADMIN, TEC, OPS");
    
    fireEvent.change(inputName, { target: { value: "Test Area" } });
    fireEvent.change(inputCode, { target: { value: "TEST" } });

    const submitButton = screen.getByRole("button", { name: /Crear área/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Save failed")).toBeInTheDocument(); // formError
    });
  });
});
