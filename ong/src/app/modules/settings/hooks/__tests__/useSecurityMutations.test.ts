import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSecurityMutations } from "../useSecurityMutations";
import * as securityService from "../../../../services/configuracion/security.service";

vi.mock("../../../../services/configuracion/security.service", () => ({
  createTerminal: vi.fn(),
  updateTerminal: vi.fn(),
  deleteTerminal: vi.fn(),
  setDeviceTrust: vi.fn(),
  terminateSession: vi.fn(),
}));

describe("useSecurityMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with correct default states", () => {
    const { result } = renderHook(() => useSecurityMutations());
    expect(result.current.isTerminatingSession).toBe(false);
    expect(result.current.isUpdatingDevice).toBe(false);
    expect(result.current.isSavingTerminal).toBe(false);
    expect(result.current.isRemovingTerminal).toBe(false);
  });

  it("should handle terminate session successfully", async () => {
    const onCompletedMock = vi.fn();
    vi.mocked(securityService.terminateSession).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSecurityMutations(onCompletedMock));

    await act(async () => {
      await result.current.closeSession({ sessionId: "session-123" } as any);
    });

    expect(securityService.terminateSession).toHaveBeenCalledWith({ sessionId: "session-123" });
    expect(onCompletedMock).toHaveBeenCalledTimes(1);
    expect(result.current.isTerminatingSession).toBe(false);
  });

  it("should prevent duplicate terminate session calls (Zero-Fail Tolerance: Auth State)", async () => {
    vi.mocked(securityService.terminateSession).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 50))
    );

    const { result } = renderHook(() => useSecurityMutations());

    let p1, p2;
    act(() => {
      p1 = result.current.closeSession({ sessionId: "1" } as any);
      p2 = result.current.closeSession({ sessionId: "2" } as any);
    });

    expect(result.current.isTerminatingSession).toBe(true);

    await Promise.all([p1, p2]);

    expect(securityService.terminateSession).toHaveBeenCalledTimes(1);
    expect(securityService.terminateSession).toHaveBeenCalledWith({ sessionId: "1" });
  });

  it("should reset states even if mutation fails", async () => {
    vi.mocked(securityService.setDeviceTrust).mockRejectedValue(new Error("Trust failed"));
    
    const { result } = renderHook(() => useSecurityMutations());

    await act(async () => {
      await expect(result.current.updateDeviceTrust({ deviceId: "dev-1" } as any)).rejects.toThrow("Trust failed");
    });

    expect(result.current.isUpdatingDevice).toBe(false);
  });

  it("should correctly handle save terminal distinguishing between create and update", async () => {
    vi.mocked(securityService.createTerminal).mockResolvedValue(undefined);
    vi.mocked(securityService.updateTerminal).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSecurityMutations());

    // Create (no terminalId)
    await act(async () => {
      await result.current.saveTerminal({ name: "Term1" } as any);
    });
    expect(securityService.createTerminal).toHaveBeenCalledTimes(1);

    // Update (has terminalId)
    await act(async () => {
      await result.current.saveTerminal({ terminalId: "T1", name: "Term1-Upd" } as any);
    });
    expect(securityService.updateTerminal).toHaveBeenCalledTimes(1);
  });
});
