import { supabase } from "../../../supabaseClient";
import type { AppDatabase } from "../../../lib/db/ong/app-database";

type AccessLinkRow = AppDatabase["public"]["Tables"]["access_links"]["Row"];
type MembershipRow = AppDatabase["public"]["Tables"]["memberships"]["Row"];
type VUserSessionContext = AppDatabase["public"]["Views"]["v_user_session_context"]["Row"];

const TENANT_CACHE_TTL_MS = 30_000;
let tenantCache: { value: string; at: number } | null = null;

function publicSchema() {
  return supabase.schema("public");
}

async function getRequiredTenantId(): Promise<string> {
  if (tenantCache && Date.now() - tenantCache.at < TENANT_CACHE_TTL_MS) {
    return tenantCache.value;
  }
  const { data, error } = await supabase.rpc("fn_current_tenant_id");
  if (error) throw new Error(error.message);
  if (typeof data !== "string" || !(data as string).trim()) {
    throw new Error("No se pudo resolver el tenant actual.");
  }
  tenantCache = { value: data, at: Date.now() };
  return data;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ACCESS LINKS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface AccessLinkFilters {
  type?: AccessLinkRow["type"];
  targetType?: AccessLinkRow["target_type"];
  isActive?: boolean;
  limit?: number;
}

export async function listAccessLinks(filters: AccessLinkFilters = {}): Promise<AccessLinkRow[]> {
  const tenantId = await getRequiredTenantId();
  let query = publicSchema()
    .from("access_links")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.targetType) {
    query = query.eq("target_type", filters.targetType);
  }
  if (filters.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }

  const { data, error } = await query.limit(filters.limit ?? 200);
  if (error) throw new Error(error.message);
  return (data ?? []) as AccessLinkRow[];
}

export interface CreateAccessLinkInput {
  type: AccessLinkRow["type"];
  targetType: AccessLinkRow["target_type"];
  targetId?: string | null;
  assignedRoleId?: string | null;
  assignedSedeId?: string | null;
  onboardingFlow?: string | null;
  maxUses?: number;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
  slug?: string | null;
}

export async function createAccessLink(input: CreateAccessLinkInput): Promise<AccessLinkRow> {
  const tenantId = await getRequiredTenantId();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  // Generate a random URL-safe code
  const codeBytes = crypto.getRandomValues(new Uint8Array(12));
  const code = btoa(String.fromCharCode(...codeBytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const payload: Omit<AccessLinkRow, "id" | "created_at" | "updated_at"> = {
    tenant_id: tenantId,
    code,
    slug: input.slug ?? null,
    type: input.type,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    assigned_role_id: input.assignedRoleId ?? null,
    assigned_sede_id: input.assignedSedeId ?? null,
    onboarding_flow: input.onboardingFlow ?? null,
    max_uses: input.maxUses ?? 1,
    used_count: 0,
    expires_at: input.expiresAt ?? null,
    is_active: true,
    metadata: (input.metadata ?? {}) as Record<string, unknown>,
    created_by: userId,
    updated_by: userId,
  };

  const { data, error } = await publicSchema()
    .from("access_links")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as AccessLinkRow;
}

export async function revokeAccessLink(linkId: string): Promise<void> {
  const tenantId = await getRequiredTenantId();
  const { error } = await publicSchema()
    .from("access_links")
    .update({ is_active: false })
    .eq("id", linkId)
    .eq("tenant_id", tenantId);

  if (error) throw new Error(error.message);
}

export interface UpdateAccessLinkInput {
  maxUses?: number;
  expiresAt?: string | null;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
  onboardingFlow?: string | null;
  assignedRoleId?: string | null;
  assignedSedeId?: string | null;
}

export async function updateAccessLink(
  linkId: string,
  input: UpdateAccessLinkInput
): Promise<AccessLinkRow> {
  const tenantId = await getRequiredTenantId();
  const patch: Partial<AccessLinkRow> = {};

  if (input.maxUses !== undefined) patch.max_uses = input.maxUses;
  if (input.expiresAt !== undefined) patch.expires_at = input.expiresAt;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.metadata !== undefined) patch.metadata = input.metadata as Record<string, unknown>;
  if (input.onboardingFlow !== undefined) patch.onboarding_flow = input.onboardingFlow;
  if (input.assignedRoleId !== undefined) patch.assigned_role_id = input.assignedRoleId;
  if (input.assignedSedeId !== undefined) patch.assigned_sede_id = input.assignedSedeId;

  const { data, error } = await publicSchema()
    .from("access_links")
    .update(patch)
    .eq("id", linkId)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as AccessLinkRow;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MEMBERSHIPS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface MembershipFilters {
  contextType?: MembershipRow["context_type"];
  contextId?: string;
  userId?: string;
  status?: MembershipRow["status"];
  limit?: number;
}

export async function listMemberships(filters: MembershipFilters = {}): Promise<MembershipRow[]> {
  const tenantId = await getRequiredTenantId();
  let query = publicSchema()
    .from("memberships")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("joined_at", { ascending: false });

  if (filters.contextType) {
    query = query.eq("context_type", filters.contextType);
  }
  if (filters.contextId) {
    query = query.eq("context_id", filters.contextId);
  }
  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query.limit(filters.limit ?? 500);
  if (error) throw new Error(error.message);
  return (data ?? []) as MembershipRow[];
}

export async function deactivateMembership(membershipId: string): Promise<void> {
  const tenantId = await getRequiredTenantId();
  const { error } = await publicSchema()
    .from("memberships")
    .update({ status: "inactive" })
    .eq("id", membershipId)
    .eq("tenant_id", tenantId);

  if (error) throw new Error(error.message);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ANONYMOUS CODE VALIDATION (public RPC â€” no tenant required)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface AccessCodeValidation {
  valid: boolean;
  reason?: string;
  type?: string;
  targetType?: string;
  onboardingFlow?: string | null;
  expiresAt?: string | null;
}

export async function validateAccessCode(code: string): Promise<AccessCodeValidation> {
  const { data, error } = await supabase.rpc("fn_validate_access_code", { p_code: code } as any);
  if (error) throw new Error(error.message);
  const payload = data as Record<string, unknown>;
  return {
    valid: payload.valid === true,
    reason: typeof payload.reason === "string" ? payload.reason : undefined,
    type: typeof payload.type === "string" ? payload.type : undefined,
    targetType: typeof payload.target_type === "string" ? payload.target_type : undefined,
    onboardingFlow: typeof payload.onboarding_flow === "string" ? payload.onboarding_flow : null,
    expiresAt: typeof payload.expires_at === "string" ? payload.expires_at : null,
  };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// USER SESSION CONTEXT (view â€” authenticated only)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getUserSessionContext(): Promise<VUserSessionContext | null> {
  const { data, error } = await publicSchema()
    .from("v_user_session_context")
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as VUserSessionContext | null;
}

