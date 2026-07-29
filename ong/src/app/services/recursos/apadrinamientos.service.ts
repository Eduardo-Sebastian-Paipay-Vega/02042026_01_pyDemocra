import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../supabaseClient";
import { publicSchema, sanitizeSearchTerm } from "./shared";

export interface SponsorshipSubscriptionRow {
  id: string;
  tenant_id?: string | null;
  donor_id?: string | null;
  donor_name: string;
  donor_email: string;
  gateway_name: string;
  subscription_frequency: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface PaymentTransactionRow {
  id: string;
  tenant_id?: string | null;
  sponsorship_id?: string | null;
  donor_id?: string | null;
  donor_name?: string | null;
  donor_email?: string | null;
  gateway_name: string;
  transaction_reference?: string | null;
  amount: number;
  currency: string;
  webhook_signature_verified: boolean;
  status: string;
  created_at: string;
}

export async function listSponsorshipSubscriptions(searchTerm = "") {
  let query = publicSchema()
    .from("sponsorship_subscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  const cleaned = sanitizeSearchTerm(searchTerm);
  if (cleaned) {
    query = query.or(`donor_name.ilike.%${cleaned}%,donor_email.ilike.%${cleaned}%,gateway_name.ilike.%${cleaned}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error listing sponsorship subscriptions:", error);
    return [];
  }
  return data as SponsorshipSubscriptionRow[];
}

export async function listPaymentTransactions() {
  const { data, error } = await publicSchema()
    .from("payment_transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error listing payment transactions:", error);
    return [];
  }
  return data as PaymentTransactionRow[];
}

export async function createSponsorshipSubscription(input: {
  donor_name: string;
  donor_email: string;
  gateway_name: string;
  subscription_frequency: string;
  amount: number;
  currency?: string;
}) {
  const { data, error } = await publicSchema()
    .from("sponsorship_subscriptions")
    .insert([
      {
        donor_name: input.donor_name,
        donor_email: input.donor_email,
        gateway_name: input.gateway_name,
        subscription_frequency: input.subscription_frequency,
        amount: input.amount,
        currency: input.currency || "PEN",
        status: "active",
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as SponsorshipSubscriptionRow;
}

export function useApadrinamientos(searchTerm = "") {
  const [subscriptions, setSubscriptions] = useState<SponsorshipSubscriptionRow[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subsData, txData] = await Promise.all([
        listSponsorshipSubscriptions(searchTerm),
        listPaymentTransactions(),
      ]);
      setSubscriptions(subsData);
      setTransactions(txData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar apadrinamientos");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    subscriptions,
    transactions,
    loading,
    error,
    refresh: fetchAll,
    create: createSponsorshipSubscription,
  };
}
