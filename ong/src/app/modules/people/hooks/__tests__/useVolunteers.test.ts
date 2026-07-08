import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useVolunteers } from "../useVolunteers";
import * as volunteersService from "../../../../services/personas/volunteers.service";

vi.mock("../../../../services/personas/volunteers.service", () => ({
  listVolunteers: vi.fn(),
  fetchVolunteerCatalogs: vi.fn(),
}));

describe("useVolunteers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize loading state and fetch data on mount", async () => {
    const mockList = { rows: [], stateOptions: [] };
    const mockCatalogs = { stateOptions: [] };
    
    vi.mocked(volunteersService.listVolunteers).mockResolvedValue(mockList as any);
    vi.mocked(volunteersService.fetchVolunteerCatalogs).mockResolvedValue(mockCatalogs as any);

    const { result } = renderHook(() => useVolunteers());

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for the hook to settle
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(volunteersService.listVolunteers).toHaveBeenCalledTimes(1);
  });

  it("should handle async failures (Zero-Fail Tolerance: Error Handling)", async () => {
    vi.mocked(volunteersService.listVolunteers).mockRejectedValue(new Error("API Error"));
    vi.mocked(volunteersService.fetchVolunteerCatalogs).mockResolvedValue({} as any);

    const { result } = renderHook(() => useVolunteers());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("API Error");
    expect(result.current.rows).toEqual([]);
  });

  it("should allow refreshing data", async () => {
    vi.mocked(volunteersService.listVolunteers).mockResolvedValue({ rows: [], stateOptions: [] } as any);
    vi.mocked(volunteersService.fetchVolunteerCatalogs).mockResolvedValue({} as any);

    const { result } = renderHook(() => useVolunteers());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(volunteersService.listVolunteers).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.refresh();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(volunteersService.listVolunteers).toHaveBeenCalledTimes(2);
  });

  it("should upsert a row correctly sorting by last and first name", async () => {
    const initialRows = [
      { id: "1", firstName: "Alice", lastName: "Zeta" }
    ];
    vi.mocked(volunteersService.listVolunteers).mockResolvedValue({ rows: initialRows, stateOptions: [] } as any);
    vi.mocked(volunteersService.fetchVolunteerCatalogs).mockResolvedValue({} as any);

    const { result } = renderHook(() => useVolunteers());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.rows.length).toBe(1);

    // Upsert a new row
    act(() => {
      result.current.upsertRow({ id: "2", firstName: "Bob", lastName: "Alpha" } as any);
    });

    // Expect sorting by lastName
    expect(result.current.rows[0].lastName).toBe("Alpha");
    expect(result.current.rows[1].lastName).toBe("Zeta");
  });
});
