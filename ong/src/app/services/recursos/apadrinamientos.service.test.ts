import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listSponsorshipSubscriptions,
  listPaymentTransactions,
  createSponsorshipSubscription,
} from "./apadrinamientos.service";

vi.mock("./shared", () => ({
  publicSchema: vi.fn(),
  sanitizeSearchTerm: vi.fn((val) => val || ""),
}));

import { publicSchema } from "./shared";

describe("apadrinamientos.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listSponsorshipSubscriptions llama a la tabla sponsorship_subscriptions", async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({
      data: [{ id: "sub-1", donor_name: "Juan Perez", amount: 100 }],
      error: null,
    });

    vi.mocked(publicSchema).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      }),
    } as any);

    const res = await listSponsorshipSubscriptions();
    expect(res).toHaveLength(1);
    expect(res[0].donor_name).toBe("Juan Perez");
  });

  it("listPaymentTransactions consulta la tabla payment_transactions", async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({
      data: [{ id: "tx-1", amount: 50, gateway_name: "stripe" }],
      error: null,
    });

    vi.mocked(publicSchema).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      }),
    } as any);

    const res = await listPaymentTransactions();
    expect(res).toHaveLength(1);
    expect(res[0].gateway_name).toBe("stripe");
  });

  it("createSponsorshipSubscription inserta un nuevo registro", async () => {
    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: "sub-new", donor_name: "Maria G", amount: 150 },
      error: null,
    });

    vi.mocked(publicSchema).mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      }),
    } as any);

    const res = await createSponsorshipSubscription({
      donor_name: "Maria G",
      donor_email: "maria@test.com",
      gateway_name: "stripe",
      subscription_frequency: "monthly",
      amount: 150,
    });

    expect(res.id).toBe("sub-new");
    expect(res.donor_name).toBe("Maria G");
  });
});
