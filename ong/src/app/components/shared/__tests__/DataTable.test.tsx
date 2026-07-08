import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DataTable } from "../DataTable";
import React from "react";

describe("DataTable Component - Zero-Fail Tolerance", () => {
  const columns = [
    { key: "id", label: "ID", render: (item: any) => item.id },
    { key: "name", label: "Name", render: (item: any) => item.name },
  ];

  it("renders correctly with valid data", () => {
    const data = [{ id: "1", name: "Alice" }, { id: "2", name: "Bob" }];
    render(<DataTable columns={columns} data={data} />);
    
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("handles renderizado sin datos (nulls and empty arrays)", () => {
    // Empty array
    const { rerender } = render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText("Sin datos")).toBeInTheDocument();

    // Null as any (should fallback safely due to our patch)
    rerender(<DataTable columns={columns} data={null as any} />);
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
    
    // Undefined as any
    rerender(<DataTable columns={columns} data={undefined as any} />);
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
  });

  it("handles XSS injection in data gracefully", () => {
    const maliciousData = [
      { id: "1", name: "<script>alert('XSS')</script>" },
      { id: "2", name: "<img src='x' onerror='alert(1)' />" },
    ];
    render(<DataTable columns={columns} data={maliciousData} />);
    
    // Test that it doesn't render HTML directly
    expect(screen.getByText("<script>alert('XSS')</script>")).toBeInTheDocument();
    expect(screen.getByText("<img src='x' onerror='alert(1)' />")).toBeInTheDocument();
  });

  it("handles XSS injection in column labels", () => {
    const maliciousColumns = [
      { key: "id", label: "<script>alert('Column XSS')</script>", render: (item: any) => item.id }
    ];
    render(<DataTable columns={maliciousColumns} data={[{ id: "1" }]} />);
    
    expect(screen.getByText("<script>alert('Column XSS')</script>")).toBeInTheDocument();
  });

  it("shows loading skeleton when loading prop is true", () => {
    const { container } = render(<DataTable columns={columns} data={[]} loading={true} />);
    // The skeleton component renders placeholders, let's verify skeleton classes or generic structure exist
    // It should not render "Sin datos"
    expect(screen.queryByText("Sin datos")).not.toBeInTheDocument();
    // Verify an element from TableSkeleton is present (using class check)
    const tableSkeleton = container.querySelector(".animate-pulse");
    expect(tableSkeleton).toBeInTheDocument();
  });

  it("handles row actions correctly with a11y properties", () => {
    const actions = [
      { label: "Edit", onClick: vi.fn(), disabled: false }
    ];
    const data = [{ id: "1", name: "Alice" }];
    
    render(<DataTable columns={columns} data={data} actions={actions} />);
    
    // MoreVertical button for dropdown should have sr-only "Acciones" for a11y
    const actionButton = screen.getByRole("button", { name: /acciones/i });
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveAccessibleName("Acciones");
  });
});
