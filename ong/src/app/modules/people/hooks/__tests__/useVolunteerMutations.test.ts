import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useVolunteerMutations } from "../useVolunteerMutations";
import * as volunteersService from "../../../../services/personas/volunteers.service";

// Mock the entire service
vi.mock("../../../../services/personas/volunteers.service", () => ({
  createVolunteer: vi.fn(),
  updateVolunteer: vi.fn(),
  deactivateVolunteer: vi.fn(),
}));

describe("useVolunteerMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with correct default states", () => {
    const { result } = renderHook(() => useVolunteerMutations());
    expect(result.current.isSaving).toBe(false);
    expect(result.current.isDeactivating).toBe(false);
  });

  it("should handle create operation successfully", async () => {
    const onSuccessMock = vi.fn();
    const mockData = { id: "123", firstName: "Test", lastName: "User" };
    vi.mocked(volunteersService.createVolunteer).mockResolvedValue(mockData as any);

    const { result } = renderHook(() => useVolunteerMutations(onSuccessMock));

    await act(async () => {
      const response = await result.current.create({ firstName: "Test", lastName: "User" } as any);
      expect(response).toEqual(mockData);
    });

    expect(volunteersService.createVolunteer).toHaveBeenCalledTimes(1);
    expect(onSuccessMock).toHaveBeenCalledTimes(1);
    expect(result.current.isSaving).toBe(false);
  });

  it("should handle update operation correctly", async () => {
    const mockData = { id: "123", firstName: "Updated", lastName: "User" };
    vi.mocked(volunteersService.updateVolunteer).mockResolvedValue(mockData as any);

    const { result } = renderHook(() => useVolunteerMutations());

    await act(async () => {
      const response = await result.current.update("123", { firstName: "Updated" } as any);
      expect(response).toEqual(mockData);
    });

    expect(volunteersService.updateVolunteer).toHaveBeenCalledWith("123", { firstName: "Updated" });
    expect(result.current.isSaving).toBe(false);
  });

  it("should handle deactivate operation correctly", async () => {
    const mockData = { id: "123", state: "INACTIVE" };
    vi.mocked(volunteersService.deactivateVolunteer).mockResolvedValue(mockData as any);

    const { result } = renderHook(() => useVolunteerMutations());

    await act(async () => {
      const response = await result.current.deactivate("123");
      expect(response).toEqual(mockData);
    });

    expect(volunteersService.deactivateVolunteer).toHaveBeenCalledWith("123");
    expect(result.current.isDeactivating).toBe(false);
  });

  it("should prevent multiple simultaneous create operations (Zero-Fail Tolerance: Race Condition)", async () => {
    // Inject async delay
    vi.mocked(volunteersService.createVolunteer).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: "123" } as any), 100))
    );

    const { result } = renderHook(() => useVolunteerMutations());

    let promise1, promise2;
    act(() => {
      promise1 = result.current.create({ firstName: "A" } as any);
      promise2 = result.current.create({ firstName: "B" } as any);
    });

    expect(result.current.isSaving).toBe(true);

    const [res1, res2] = await Promise.all([promise1, promise2]);
    
    expect(res1).not.toBeNull();
    // The second one should have been blocked because isSaving is true
    expect(res2).toBeNull();
    expect(volunteersService.createVolunteer).toHaveBeenCalledTimes(1);
  });

  it("should handle async failure during create properly and reset saving state", async () => {
    const mockError = new Error("Network failure");
    vi.mocked(volunteersService.createVolunteer).mockRejectedValue(mockError);

    const { result } = renderHook(() => useVolunteerMutations());

    await act(async () => {
      await expect(result.current.create({ firstName: "Fail" } as any)).rejects.toThrow("Network failure");
    });

    expect(result.current.isSaving).toBe(false); // Should reset to false even on error
  });
});
