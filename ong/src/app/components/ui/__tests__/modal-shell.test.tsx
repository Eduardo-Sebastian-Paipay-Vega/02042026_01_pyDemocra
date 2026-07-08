import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ModalShell } from "../modal-shell";
import React from "react";

describe("ModalShell Component - Zero-Fail Tolerance", () => {
  it("does not render when open is false", () => {
    const { container } = render(
      <ModalShell open={false} onClose={vi.fn()}>
        Modal Content
      </ModalShell>
    );
    expect(screen.queryByText("Modal Content")).not.toBeInTheDocument();
  });

  it("renders children when open is true", () => {
    render(
      <ModalShell open={true} onClose={vi.fn()}>
        Modal Content
      </ModalShell>
    );
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
    
    // a11y checks
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("handles rendering without data (null children)", () => {
    render(
      <ModalShell open={true} onClose={vi.fn()}>
        {null}
      </ModalShell>
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toBeEmptyDOMElement();
  });

  it("handles XSS injection attempts in children props", () => {
    const maliciousString = "<img src='x' onerror='alert(\"XSS\")' />";
    render(
      <ModalShell open={true} onClose={vi.fn()}>
        {maliciousString}
      </ModalShell>
    );
    
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("<img src='x' onerror='alert(\"XSS\")' />")).toBeInTheDocument();
    expect(dialog.innerHTML).not.toContain("<img src='x'");
  });

  it("calls onClose when escape key is pressed", () => {
    const handleClose = vi.fn();
    render(
      <ModalShell open={true} onClose={handleClose}>
        Modal
      </ModalShell>
    );
    
    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    const handleClose = vi.fn();
    render(
      <ModalShell open={true} onClose={handleClose}>
        Modal
      </ModalShell>
    );
    
    // The backdrop has aria-hidden="true", we can query it by this attribute or by role if it had one.
    // For test purposes, we'll find the element with aria-hidden="true"
    // Since there are multiple possible hidden elements, we look for the one with the backdrop class
    // Or simpler, just click the element that handles the onClose
    const backdrop = document.querySelector('div[aria-hidden="true"]');
    expect(backdrop).toBeInTheDocument();
    
    fireEvent.click(backdrop!);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
