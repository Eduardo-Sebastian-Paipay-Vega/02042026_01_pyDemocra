import type {
  FinancialAccountCreateInput,
  FinancialAccountDetailData,
  FinancialAccountRow,
  FinancialAccountsData,
  FinancialAccountsFilters,
  FinancialAccountUpdateInput,
  FinancialMutationFeedback,
} from "../../modules/resources/types";
import {
  loadCatalogRows,
  finanzasSchema,
  publicSchema,
  resolveActorId,
  resolveCurrentTenantId,
  resolveFinancialAccountTypeCatalog,
  sanitizeOptionalId,
  sanitizeSearchTerm,
  sanitizeText,
  toDateTimeLabel,
  toOperationError,
} from "./shared";
import { listTransaccionesFinancieras } from "./transaccionesFinancieras.service";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

interface AccountRow {
  id: string;
  tenant_id: string;
  nombre_cuenta: string;
  tipo_cuenta: string;
  moneda: string;
  saldo_actual: number;
  activa: boolean | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface CurrencyRow {
  codigo: string;
  nombre: string;
  simbolo: string | null;
}

function resolvePage(value: number | null | undefined): number {
  return !value || Number.isNaN(value) || value < 1 ? 1 : Math.floor(value);
}

function resolvePageSize(value: number | null | undefined): number {
  return !value || Number.isNaN(value) || value < 1
    ? DEFAULT_PAGE_SIZE
    : Math.min(MAX_PAGE_SIZE, Math.floor(value));
}

function mapRow(
  row: AccountRow,
  metrics: { count: number; lastDate: string | null } | undefined,
  accountTypeLabels: Map<string, string>
): FinancialAccountRow {
  return {
    id: row.id,
    name: row.nombre_cuenta,
    typeCode: row.tipo_cuenta,
    typeLabel: accountTypeLabels.get(row.tipo_cuenta) ?? row.tipo_cuenta,
    currency: row.moneda,
    balance: Number(row.saldo_actual ?? 0),
    bank: "",
    accountNumber: "",
    active: Boolean(row.activa ?? true),
    activeLabel: Boolean(row.activa ?? true) ? "Activa" : "Inactiva",
    statusVariant: Boolean(row.activa ?? true) ? "success" : "secondary",
    transactionCount: metrics?.count ?? 0,
    lastTransactionAt: metrics?.lastDate ? toDateTimeLabel(metrics.lastDate) : "-",
  };
}

async function resolveCatalogs(warnings: string[]) {
  const tenantId = await resolveCurrentTenantId();
  const currencies = await loadCatalogRows(
    async () =>
      publicSchema()
        .from("cat_monedas")
        .select("codigo, nombre, simbolo")
        .order("nombre", { ascending: true }),
    warnings,
    "No se pudo cargar el catalogo de monedas."
  );
  const accountTypes = await resolveFinancialAccountTypeCatalog(warnings);

  return {
    tenantId,
    accountTypeLabels: accountTypes.labels,
    accountTypeOptions: accountTypes.options,
    currencyLabels: new Map(
      (currencies as CurrencyRow[]).map((row) => [
        row.codigo,
        `${row.nombre}${row.simbolo ? ` (${row.simbolo})` : ""}`,
      ])
    ),
    currencyOptions: (currencies as CurrencyRow[]).map((row) => ({
      value: row.codigo,
      label: `${row.nombre}${row.simbolo ? ` (${row.simbolo})` : ""}`,
    })),
  };
}

async function ensureAccountTypeExists(
  typeCode: string,
  warnings: string[]
): Promise<void> {
  const normalizedTypeCode = sanitizeText(typeCode, 50).toLowerCase();
  if (!normalizedTypeCode) {
    throw new Error("El tipo de cuenta es obligatorio.");
  }

  const catalog = await resolveFinancialAccountTypeCatalog(warnings);
  if (!catalog.labels.has(normalizedTypeCode)) {
    throw new Error("El tipo de cuenta debe seleccionarse desde el catalogo real.");
  }
}

async function getMetrics(accountIds: string[]) {
  const ids = Array.from(
    new Set(
      accountIds.filter((value): value is string => Boolean(sanitizeOptionalId(value)))
    )
  );
  if (!ids.length) {
    return new Map<string, { count: number; lastDate: string | null }>();
  }

  const tenantId = await resolveCurrentTenantId();
  let query = finanzasSchema().from("transacciones").select("id_cuenta, fecha_transaccion");

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  query = query.in("id_cuenta", ids);

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const metrics = new Map<string, { count: number; lastDate: string | null }>();
  ids.forEach((id) => metrics.set(id, { count: 0, lastDate: null }));

  for (const row of (data ?? []) as Array<{
    id_cuenta: string;
    fecha_transaccion: string;
  }>) {
    const current = metrics.get(row.id_cuenta) ?? {
      count: 0,
      lastDate: null,
    };

    current.count += 1;
    if (
      !current.lastDate ||
      new Date(row.fecha_transaccion) > new Date(current.lastDate)
    ) {
      current.lastDate = row.fecha_transaccion;
    }

    metrics.set(row.id_cuenta, current);
  }

  return metrics;
}

export async function listCuentas(
  filters: Partial<FinancialAccountsFilters> = {}
): Promise<FinancialAccountsData> {
  try {
    const warnings: string[] = [];
    const page = resolvePage(filters.page);
    const pageSize = resolvePageSize(filters.pageSize);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const search = sanitizeSearchTerm(filters.searchTerm);
    const catalogs = await resolveCatalogs(warnings);

    let query = finanzasSchema()
      .from("cuentas")
      .select(
        "id, tenant_id, nombre_cuenta, tipo_cuenta, moneda, saldo_actual, activa, created_by, updated_by, created_at, updated_at",
        { count: "exact" }
      )
      .order("nombre_cuenta", { ascending: true })
      .range(from, to);

    if (catalogs.tenantId) {
      query = query.eq("tenant_id", catalogs.tenantId);
    }

    if (filters.state === "active") {
      query = query.eq("activa", true);
    } else if (filters.state === "inactive") {
      query = query.eq("activa", false);
    }

    if (search) {
      query = query.or(
        `nombre_cuenta.ilike.%${search}%,tipo_cuenta.ilike.%${search}%,moneda.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as AccountRow[];
    const metrics = await getMetrics(rows.map((row) => row.id)).catch(() => {
      warnings.push(
        "No se pudo calcular el historial de transacciones de las cuentas."
      );
      return new Map<string, { count: number; lastDate: string | null }>();
    });

    return {
      rows: rows.map((row) =>
        mapRow(row, metrics.get(row.id), catalogs.accountTypeLabels)
      ),
      total: count ?? rows.length,
      page,
      pageSize,
      warnings,
      currencyOptions: catalogs.currencyOptions,
      accountTypeOptions: catalogs.accountTypeOptions,
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo cargar el catalogo de cuentas.");
  }
}

export async function getCuentaById(
  accountId: string
): Promise<FinancialAccountDetailData> {
  try {
    const id = sanitizeOptionalId(accountId);
    if (!id) {
      throw new Error("No se encontro la cuenta solicitada.");
    }

    const warnings: string[] = [];
    const catalogs = await resolveCatalogs(warnings);
    const tenantId = catalogs.tenantId;

    let query = finanzasSchema()
      .from("cuentas")
      .select(
        "id, tenant_id, nombre_cuenta, tipo_cuenta, moneda, saldo_actual, activa, created_by, updated_by, created_at, updated_at"
      )
      .eq("id", id)
      .limit(1);

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const row = (data ?? [])[0] as AccountRow | undefined;
    if (!row) {
      throw new Error("La cuenta ya no existe.");
    }

    const metrics = await getMetrics([id]).catch(() => {
      warnings.push("No se pudo calcular metrica de transacciones de la cuenta.");
      return new Map<string, { count: number; lastDate: string | null }>();
    });

    const transacciones = await listTransaccionesFinancieras({
      accountId: id,
      page: 1,
      pageSize: 10,
    }).catch(() => ({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 10,
      warnings: [],
      accountOptions: [],
      categoryOptions: [],
      typeOptions: [],
      projectOptions: [],
      approvalOptions: [],
      support: {
        projectLink: false,
        approvalWorkflow: true,
      },
    }));

    return {
      account: mapRow(
        row,
        metrics.get(id),
        catalogs.accountTypeLabels
      ),
      latestTransactions: transacciones.rows,
      warnings,
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo cargar el detalle de la cuenta.");
  }
}

export async function createCuenta(
  input: FinancialAccountCreateInput
): Promise<FinancialMutationFeedback> {
  try {
    const warnings: string[] = [];
    const tenantId = await resolveCurrentTenantId();
    const actorId = await resolveActorId(null);
    const name = sanitizeText(input.name, 100);
    const typeCode = sanitizeText(input.typeCode, 50).toLowerCase();
    const currency = sanitizeText(input.currency, 3).toUpperCase() || "PEN";
    const rawBalance = Number(input.balance);
    const balance = Number.isFinite(rawBalance) ? rawBalance : 0;

    if (!name) {
      throw new Error("El nombre de la cuenta es obligatorio.");
    }

    await ensureAccountTypeExists(typeCode, warnings);

    const payload: Record<string, string | number | boolean | null> = {
      nombre_cuenta: name,
      tipo_cuenta: typeCode,
      moneda: currency,
      saldo_actual: balance,
      activa: input.active ?? true,
      created_by: actorId,
      updated_by: actorId,
    };

    if (tenantId) {
      payload.tenant_id = tenantId;
    }

    const { data, error } = await finanzasSchema()
      .from("cuentas")
      .insert(payload as any)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { id: data.id, message: "Cuenta registrada correctamente." };
  } catch (error) {
    throw toOperationError(error, "No se pudo crear la cuenta.");
  }
}

export async function updateCuenta(
  input: FinancialAccountUpdateInput
): Promise<FinancialMutationFeedback> {
  try {
    const warnings: string[] = [];
    const accountId = sanitizeOptionalId(input.accountId);
    if (!accountId) {
      throw new Error("No se encontro la cuenta a editar.");
    }

    const actorId = await resolveActorId(null);
    const payload: Record<string, string | number | boolean | null> = {
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) {
      payload.nombre_cuenta = sanitizeText(input.name, 100);
    }

    if (input.typeCode !== undefined) {
      const typeCode = sanitizeText(input.typeCode, 50).toLowerCase();
      await ensureAccountTypeExists(typeCode, warnings);
      payload.tipo_cuenta = typeCode;
    }

    if (input.currency !== undefined) {
      payload.moneda = sanitizeText(input.currency, 3).toUpperCase() || "PEN";
    }

    if (input.balance !== undefined) {
      const rawBalance = Number(input.balance);
      payload.saldo_actual = Number.isFinite(rawBalance) ? rawBalance : 0;
    }

    if (input.active !== undefined) {
      payload.activa = Boolean(input.active);
    }

    if (Object.keys(payload).length === 2) {
      throw new Error("No hay cambios para actualizar.");
    }

    const { error } = await finanzasSchema()
      .from("cuentas")
      .update(payload as any)
      .eq("id", accountId);

    if (error) {
      throw new Error(error.message);
    }

    return { id: accountId, message: "Cuenta actualizada correctamente." };
  } catch (error) {
    throw toOperationError(error, "No se pudo actualizar la cuenta.");
  }
}

export async function removeOrArchiveCuenta(
  accountId: string
): Promise<FinancialMutationFeedback> {
  try {
    const id = sanitizeOptionalId(accountId);
    if (!id) {
      throw new Error("No se encontro la cuenta a inactivar.");
    }

    const actorId = await resolveActorId(null);
    const { error } = await finanzasSchema()
      .from("cuentas")
      .update({
        activa: false,
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { id, message: "Cuenta inactivada correctamente." };
  } catch (error) {
    throw toOperationError(error, "No se pudo inactivar la cuenta.");
  }
}
