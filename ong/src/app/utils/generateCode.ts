import { supabase } from "../../supabaseClient";

async function nextSequential(
  schema: string,
  table: string,
  codeColumn: string,
  prefix: string,
  digits: number,
  tenantId: string | null
): Promise<string> {
  const pattern = `${prefix}-%`;
  let query = supabase
    .schema(schema)
    .from(table)
    .select(codeColumn)
    .like(codeColumn, pattern)
    .order(codeColumn, { ascending: false })
    .limit(1);

  if (tenantId) {
    query = (query as Parameters<typeof query.eq>[0] extends never ? never : typeof query).eq("tenant_id", tenantId) as typeof query;
  }

  const { data } = await query;
  const last = (data?.[0] as Record<string, string> | undefined)?.[codeColumn] ?? `${prefix}-${"0".repeat(digits)}`;
  const num = parseInt(last.replace(new RegExp(`^${prefix}-0*`), "") || "0", 10);
  return `${prefix}-${String(Number.isFinite(num) ? num + 1 : 1).padStart(digits, "0")}`;
}

export async function generateProjectCode(tenantId: string | null): Promise<string> {
  try {
    const q = supabase.schema("ong").from("proyectos").select("codigo").like("codigo", "PROJ-%").order("codigo", { ascending: false }).limit(1);
    const { data } = tenantId ? await q.eq("tenant_id", tenantId) : await q;
    const last = (data?.[0] as { codigo: string } | undefined)?.codigo ?? "PROJ-000";
    const num = parseInt(last.replace(/^PROJ-/, ""), 10);
    return `PROJ-${String(Number.isFinite(num) ? num + 1 : 1).padStart(3, "0")}`;
  } catch {
    return `PROJ-${String(Date.now()).slice(-3)}`;
  }
}

export async function generateItemCode(tenantId: string | null): Promise<string> {
  try {
    const q = supabase.schema("ong").from("items").select("codigo").like("codigo", "INV-%").order("codigo", { ascending: false }).limit(1);
    const { data } = tenantId ? await q.eq("tenant_id", tenantId) : await q;
    const last = (data?.[0] as { codigo: string } | undefined)?.codigo ?? "INV-000";
    const num = parseInt(last.replace(/^INV-/, ""), 10);
    return `INV-${String(Number.isFinite(num) ? num + 1 : 1).padStart(3, "0")}`;
  } catch {
    return `INV-${String(Date.now()).slice(-3)}`;
  }
}
