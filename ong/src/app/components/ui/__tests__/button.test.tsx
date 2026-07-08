import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "../button";
import React from "react";

describe("Button Component - Zero-Fail Tolerance", () => {
  it("renders correctly with default props", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("handles rendering without data (null children)", () => {
    const { container } = render(<Button>{null}</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toBeEmptyDOMElement();
  });

  it("handles XSS injection attempts in children props", () => {
    const maliciousString = "<script>alert('XSS')</script>";
    render(<Button>{maliciousString}</Button>);
    const button = screen.getByRole("button");
    // React escapes text content, so it should be exactly the string, not evaluated HTML
    expect(button.textContent).toBe(maliciousString);
    expect(button.innerHTML).not.toContain("<script>");
  });

  it("supports accessibility (a11y) attributes correctly", () => {
    render(<Button aria-label="Accessible Button">A11y</Button>);
    const button = screen.getByRole("button", { name: /accessible button/i });
    expect(button).toHaveAttribute("aria-label", "Accessible Button");
  });

  it("applies correct variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button", { name: /delete/i });
    expect(button.className).toContain("text-red-600");
  });

  it("disables button correctly and prevents clicks", () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeDisabled();
    
    // Use click() method to test disabled state prevents it
    button.click();
    expect(handleClick).not.toHaveBeenCalled();
  });
});
