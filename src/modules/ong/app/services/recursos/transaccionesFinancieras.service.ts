import type {
  FinancialApprovalKind,
  FinancialEgresoResolutionInput,
  FinancialTransactionCreateInput,
  FinancialTransactionDetailData,
  FinancialTransactionRemoveInput,
  FinancialTransactionRow,
  FinancialTransactionsData,
  FinancialTransactionsFilters,
  FinancialTransactionTypeOption,
  FinancialTransactionUpdateInput,
} from "../../modules/resources/types";
import {
  finanzasSchema,
  loadCatalogRows,
  ongSchema,
  resolveActorId,
  resolveCurrentTenantId,
  resolveFinancialAccountTypeCatalog,
  resolveProfileLabels,
  sanitizeOptionalId,
  sanitizeSearchTerm,
  sanitizeText,
  toDateTimeLabel,
  toOperationError,
} from "./shared";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_DATASET = 2000;

interface AccountRow {
  id: string;
  nombre_cuenta: string;
  tipo_cuenta: string;
  moneda: string;
  activa: boolean | null;
}

interface CategoryRow {
  id: string;
  nombre: string;
  tipo: string;
}

interface ProjectRow {
  id: string;
  codigo: string;
  nombre_proyecto: string;
}

interface TransactionRow {
  id: string;
  tenant_id: string;
  id_cuenta: string;
  id_categoria: string;
  tipo: string;
  monto: number;
  fecha_transaccion: string;
  descripcion: string | null;
  comprobante_url: string | null;
  id_proyecto: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ReceiptRow {
  id: string;
  id_transaccion: string;
  tipo_comprobante: string;
  numero_comprobante: string;
  emisor_ruc_dni: string | null;
  emisor_nombre: string | null;
  url_archivo: string | null;
  created_at: string | null;
}

interface ApprovalRow {
  id: string;
  tenant_id: string;
  id_transaccion: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  comentario: string | null;
  solicitado_por: string | null;
  resuelto_por: string | null;
  requested_at: string;
  resolved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function resolvePage(value: number | null | undefined) {
  return !value || Number.isNaN(value) || value < 1 ? 1 : Math.floor(value);
}

function resolvePageSize(value: number | null | undefined) {
  return !value || Number.isNaN(value) || value < 1
    ? DEFAULT_PAGE_SIZE
    : Math.min(MAX_PAGE_SIZE, Math.floor(value));
}

function transactionKind(value: string | null | undefined) {
  const normalized = sanitizeText(value, 20).toLowerCase();
  if (normalized.includes("ingres")) {
    return "ingreso" as const;
  }
  if (normalized.includes("egres")) {
    return "egreso" as const;
  }
  return "other" as const;
}

function categoryKind(value: string | null | undefined) {
  const kind = transactionKind(value);
  return kind === "other" ? "other" : kind;
}

function resolveApprovalKind(
  transactionType: string,
  approval: ApprovalRow | null | undefined
): FinancialApprovalKind {
  if (transactionKind(transactionType) !== "egreso") {
    return "not-required";
  }

  if (!approval) {
    return "pending";
  }

  switch (approval.estado) {
    case "aprobada":
      return "approved";
    case "rechazada":
      return "rejected";
    case "pendiente":
    default:
      return "pending";
  }
}

function resolveApprovalLabel(kind: FinancialApprovalKind) {
  switch (kind) {
    case "approved":
      return "Aprobada";
    case "rejected":
      return "Rechazada";
    case "pending":
      return "Pendiente";
    case "observed":
      return "Observada";
    case "not-required":
    default:
      return "No requerida";
  }
}

function resolveApprovalVariant(kind: FinancialApprovalKind) {
  switch (kind) {
    case "approved":
      return "success" as const;
    case "rejected":
      return "destructive" as const;
    case "pending":
      return "warning" as const;
    case "observed":
      return "info" as const;
    case "not-required":
    default:
      return "secondary" as const;
  }
}

function mapRow(
  row: TransactionRow,
  catalogs: Awaited<ReturnType<typeof resolveCatalogs>>,
  labels: Map<string, string>,
  receiptCountById: Map<string, number>,
  approval: ApprovalRow | null | undefined
): FinancialTransactionRow {
  const account = catalogs.accountsById.get(row.id_cuenta);
  const category = catalogs.categoriesById.get(row.id_categoria);
  const projectId = row.id_proyecto ?? null;
  const registeredById = row.created_by ?? row.updated_by ?? "";
  const approvalKind = resolveApprovalKind(row.tipo, approval);
  const approvalRequestedById = approval?.solicitado_por ?? null;
  const approvalResolvedById = approval?.resuelto_por ?? null;

  return {
    id: row.id,
    accountId: row.id_cuenta,
    accountName: account?.nombre_cuenta ?? row.id_cuenta,
    accountTypeLabel:
      catalogs.accountTypeLabels.get(account?.tipo_cuenta ?? "") ??
      account?.tipo_cuenta ??
      "-",
    categoryId: row.id_categoria,
    categoryName: category?.nombre ?? row.id_categoria,
    categoryTypeLabel:
      category?.tipo === "ingreso"
        ? "Ingreso"
        : category?.tipo === "egreso"
          ? "Egreso"
          : category?.tipo ?? "Sin tipo",
    categoryTypeKind: categoryKind(category?.tipo),
    typeCode: row.tipo,
    typeName:
      row.tipo === "ingreso"
        ? "Ingreso"
        : row.tipo === "egreso"
          ? "Egreso"
          : row.tipo,
    typeKind: transactionKind(row.tipo),
    amount: Number(row.monto ?? 0),
    date: toDateTimeLabel(row.fecha_transaccion),
    rawDate: row.fecha_transaccion,
    description: row.descripcion ?? "",
    registeredBy: (labels.get(registeredById) ?? registeredById) || "-",
    registeredById,
    projectId,
    projectName: projectId
      ? catalogs.projectsById.get(projectId)?.nombre_proyecto ?? projectId
      : "-",
    receiptCount: receiptCountById.get(row.id) ?? 0,
    approvalStateId: approval?.id ?? null,
    approvalStateName: resolveApprovalLabel(approvalKind),
    approvalKind,
    approvalVariant: resolveApprovalVariant(approvalKind),
    approvalComment: approval?.comentario ?? "",
    approvalRequestedAt: approval?.requested_at
      ? toDateTimeLabel(approval.requested_at)
      : "-",
    approvalRequestedAtRaw: approval?.requested_at ?? null,
    approvalRequestedBy:
      approvalRequestedById && labels.get(approvalRequestedById)
        ? labels.get(approvalRequestedById) ?? approvalRequestedById
        : approvalRequestedById ?? "-",
    approvalRequestedById,
    approvalResolvedAt: approval?.resolved_at
      ? toDateTimeLabel(approval.resolved_at)
      : "-",
    approvalResolvedAtRaw: approval?.resolved_at ?? null,
    approvalResolvedBy:
      approvalResolvedById && labels.get(approvalResolvedById)
        ? labels.get(approvalResolvedById) ?? approvalResolvedById
        : approvalResolvedById ?? "-",
    approvalResolvedById,
    statusVariant: row.tipo === "ingreso" ? "success" : "destructive",
    isDeleted: false,
  };
}

async function resolveCatalogs(warnings: string[]) {
  const tenantId = await resolveCurrentTenantId();
  const [accounts, categories, projects, accountTypes] = await Promise.all([
    loadCatalogRows(
      async () => {
        let query = finanzasSchema()
          .from("cuentas")
          .select("id, nombre_cuenta, tipo_cuenta, moneda, activa")
          .order("nombre_cuenta", { ascending: true })
          .limit(600);
        if (tenantId) {
          query = query.eq("tenant_id", tenantId);
        }
        return query;
      },
      warnings,
      "No se pudo cargar el catalogo de cuentas."
    ),
    loadCatalogRows(
      async () => {
        let query = finanzasSchema()
          .from("categorias")
          .select("id, nombre, tipo")
          .order("nombre", { ascending: true })
          .limit(600);
        if (tenantId) {
          query = query.eq("tenant_id", tenantId);
        }
        return query;
      },
      warnings,
      "No se pudo cargar el catalogo de categorias."
    ),
    loadCatalogRows(
      async () => {
        let query = ongSchema()
          .from("proyectos")
          .select("id, codigo, nombre_proyecto")
          .order("nombre_proyecto", { ascending: true })
          .limit(600);
        if (tenantId) {
          query = query.eq("tenant_id", tenantId);
        }
        return query;
      },
      warnings,
      "No se pudo cargar el catalogo de proyectos."
    ),
    resolveFinancialAccountTypeCatalog(warnings),
  ]);

  const accountRows = accounts as AccountRow[];
  const categoryRows = categories as CategoryRow[];
  const projectRows = projects as ProjectRow[];
  const typeOptions = [
    { value: "ingreso", label: "Ingreso", kind: "ingreso" as const },
    { value: "egreso", label: "Egreso", kind: "egreso" as const },
  ];

  return {
    accountsById: new Map(accountRows.map((row) => [row.id, row])),
    categoriesById: new Map(categoryRows.map((row) => [row.id, row])),
    projectsById: new Map(projectRows.map((row) => [row.id, row])),
    accountTypeLabels: accountTypes.labels,
    accountOptions: accountRows.map((row) => ({
      value: row.id,
      label: `${row.nombre_cuenta} (${
        accountTypes.labels.get(row.tipo_cuenta) ?? row.tipo_cuenta
      })${row.activa ? "" : " (Inactiva)"}`,
    })),
    categoryOptions: categoryRows.map((row) => ({
      value: row.id,
      label: `${row.nombre} (${row.tipo})`,
    })),
    projectOptions: projectRows.map((row) => ({
      value: row.id,
      label: `${row.codigo} - ${row.nombre_proyecto}`,
    })),
    typeOptions,
  };
}

async function receiptCountsByTransactionIds(transactionIds: string[]) {
  const ids = Array.from(
    new Set(
      transactionIds.filter((value): value is string => Boolean(sanitizeOptionalId(value)))
    )
  );
  if (!ids.length) {
    return new Map<string, number>();
  }

  const tenantId = await resolveCurrentTenantId();
  let query = finanzasSchema()
    .from("comprobantes_financieros")
    .select("id_transaccion");

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  query = query.in("id_transaccion", ids);

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();
  for (const id of ids) {
    counts.set(id, 0);
  }
  for (const row of (data ?? []) as Array<{ id_transaccion: string }>) {
    counts.set(row.id_transaccion, (counts.get(row.id_transaccion) ?? 0) + 1);
  }

  return counts;
}

async function loadApprovalsByTransactionIds(transactionIds: string[]) {
  const ids = Array.from(
    new Set(
      transactionIds.filter((value): value is string => Boolean(sanitizeOptionalId(value)))
    )
  );
  if (!ids.length) {
    return new Map<string, ApprovalRow>();
  }

  const tenantId = await resolveCurrentTenantId();
  let query = finanzasSchema()
    .from("aprobaciones_transaccion")
    .select(
      "id, tenant_id, id_transaccion, estado, comentario, solicitado_por, resuelto_por, requested_at, resolved_at, created_at, updated_at"
    )
    .in("id_transaccion", ids)
    .order("requested_at", { ascending: false });

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const approvals = new Map<string, ApprovalRow>();
  for (const row of (data ?? []) as ApprovalRow[]) {
    if (!approvals.has(row.id_transaccion)) {
      approvals.set(row.id_transaccion, row);
    }
  }

  return approvals;
}

async function filterRows(
  filters: Partial<FinancialTransactionsFilters>,
  rows: TransactionRow[],
  approvalsByTransactionId: Map<string, ApprovalRow>
) {
  const search = sanitizeSearchTerm(filters.searchTerm);
  const accountId =
    filters.accountId && filters.accountId !== "all" ? filters.accountId : null;
  const categoryId =
    filters.categoryId && filters.categoryId !== "all" ? filters.categoryId : null;
  const typeCode =
    sanitizeText(String(filters.typeCode ?? filters.typeId ?? ""), 20).toLowerCase() ||
    null;
  const projectId =
    filters.projectId && filters.projectId !== "all" ? filters.projectId : null;
  const approvalKindFilter =
    filters.approvalKind && filters.approvalKind !== "all"
      ? filters.approvalKind
      : null;

  return rows.filter((row) => {
    if (accountId && row.id_cuenta !== accountId) {
      return false;
    }
    if (categoryId && row.id_categoria !== categoryId) {
      return false;
    }
    if (typeCode && row.tipo !== typeCode) {
      return false;
    }
    if (projectId && row.id_proyecto !== projectId) {
      return false;
    }
    if (filters.dateFrom && row.fecha_transaccion < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && row.fecha_transaccion > filters.dateTo) {
      return false;
    }

    if (approvalKindFilter) {
      const approvalKind = resolveApprovalKind(
        row.tipo,
        approvalsByTransactionId.get(row.id)
      );
      if (approvalKind !== approvalKindFilter) {
        return false;
      }
    }

    if (!search) {
      return true;
    }

    return sanitizeText(
      [row.id, row.descripcion ?? "", row.created_by ?? "", row.updated_by ?? ""].join(
        " "
      ),
      1000
    ).includes(search);
  });
}

export async function listTiposTransaccionFinanciera(): Promise<
  FinancialTransactionTypeOption[]
> {
  return [
    { value: "ingreso", label: "Ingreso", kind: "ingreso" },
    { value: "egreso", label: "Egreso", kind: "egreso" },
  ];
}

export async function listTransaccionesFinancieras(
  filters: Partial<FinancialTransactionsFilters> = {}
): Promise<FinancialTransactionsData> {
  try {
    const warnings: string[] = [];
    const page = resolvePage(filters.page);
    const pageSize = resolvePageSize(filters.pageSize);
    const from = (page - 1) * pageSize;
    const tenantId = await resolveCurrentTenantId();
    const catalogs = await resolveCatalogs(warnings);

    let query = finanzasSchema()
      .from("transacciones")
      .select(
        "id, tenant_id, id_cuenta, id_categoria, tipo, monto, fecha_transaccion, descripcion, comprobante_url, id_proyecto, created_by, updated_by, created_at, updated_at",
        { count: "exact" }
      )
      .order("fecha_transaccion", { ascending: false })
      .range(0, MAX_DATASET - 1);

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const rawRows = (data ?? []) as TransactionRow[];
    const approvalsByTransactionId = await loadApprovalsByTransactionIds(
      rawRows.map((row) => row.id)
    ).catch(() => {
      warnings.push(
        "No se pudo cargar el flujo de aprobacion financiera desde finanzas.aprobaciones_transaccion."
      );
      return new Map<string, ApprovalRow>();
    });

    if (
      rawRows.some(
        (row) =>
          transactionKind(row.tipo) === "egreso" &&
          !approvalsByTransactionId.has(row.id)
      )
    ) {
      warnings.push(
        "Algunos egresos legacy no tienen fila en finanzas.aprobaciones_transaccion y se muestran como pendientes."
      );
    }

    const filtered = await filterRows(filters, rawRows, approvalsByTransactionId);
    const pageRows = filtered.slice(from, from + pageSize);

    if (filters.includeDeleted) {
      warnings.push(
        "finanzas.transacciones no documenta soft delete; la eliminacion sigue siendo fisica."
      );
    }

    const labelIds = pageRows.flatMap((row) => {
      const approval = approvalsByTransactionId.get(row.id);
      return [
        row.created_by,
        row.updated_by,
        approval?.solicitado_por ?? null,
        approval?.resuelto_por ?? null,
      ].filter((value): value is string => Boolean(value));
    });

    const labels = await resolveProfileLabels(labelIds).catch(() => new Map());
    const receiptCounts = await receiptCountsByTransactionIds(
      pageRows.map((row) => row.id)
    ).catch(() => new Map());

    const rows = pageRows.map((row) =>
      mapRow(
        row,
        catalogs,
        labels,
        receiptCounts,
        approvalsByTransactionId.get(row.id)
      )
    );

    return {
      rows,
      total: filtered.length,
      page,
      pageSize,
      warnings,
      accountOptions: catalogs.accountOptions,
      categoryOptions: catalogs.categoryOptions,
      typeOptions: catalogs.typeOptions,
      projectOptions: catalogs.projectOptions,
      approvalOptions: [
        { value: "not-required", label: "No requiere aprobacion" },
        { value: "pending", label: "Pendiente" },
        { value: "approved", label: "Aprobada" },
        { value: "rejected", label: "Rechazada" },
      ],
      support: {
        projectLink: true,
        approvalWorkflow: true,
      },
    };
  } catch (error) {
    throw toOperationError(error, "No se pudieron cargar las transacciones financieras.");
  }
}

export async function getTransaccionFinancieraById(
  transactionId: string
): Promise<FinancialTransactionDetailData> {
  try {
    const id = sanitizeOptionalId(transactionId);
    if (!id) {
      throw new Error("No se encontro la transaccion solicitada.");
    }

    const warnings: string[] = [];
    const tenantId = await resolveCurrentTenantId();
    const catalogs = await resolveCatalogs(warnings);

    let query = finanzasSchema()
      .from("transacciones")
      .select(
        "id, tenant_id, id_cuenta, id_categoria, tipo, monto, fecha_transaccion, descripcion, comprobante_url, id_proyecto, created_by, updated_by, created_at, updated_at"
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

    const row = (data ?? [])[0] as TransactionRow | undefined;
    if (!row) {
      throw new Error("La transaccion financiera ya no existe.");
    }

    const approvalsByTransactionId = await loadApprovalsByTransactionIds([id]).catch(
      () => {
        warnings.push(
          "No se pudo cargar la aprobacion financiera asociada a la transaccion."
        );
        return new Map<string, ApprovalRow>();
      }
    );
    const approval = approvalsByTransactionId.get(id);

    const labels = await resolveProfileLabels(
      [
        row.created_by,
        row.updated_by,
        approval?.solicitado_por ?? null,
        approval?.resuelto_por ?? null,
      ].filter((value): value is string => Boolean(value))
    ).catch(() => new Map());

    const receiptCounts = await receiptCountsByTransactionIds([id]).catch(
      () => new Map()
    );
    const transaction = mapRow(row, catalogs, labels, receiptCounts, approval);

    const { data: receiptsData, error: receiptError } = await finanzasSchema()
      .from("comprobantes_financieros")
      .select(
        "id, id_transaccion, tipo_comprobante, numero_comprobante, emisor_ruc_dni, emisor_nombre, url_archivo, created_at"
      )
      .eq("id_transaccion", id)
      .order("created_at", { ascending: false });

    if (receiptError) {
      warnings.push("No se pudieron cargar los comprobantes adjuntos.");
    }

    return {
      transaction,
      receipts: ((receiptsData ?? []) as ReceiptRow[]).map((receipt) => ({
        id: receipt.id,
        transactionId: receipt.id_transaccion,
        route: receipt.url_archivo ?? "",
        fileType: receipt.tipo_comprobante,
        receiptNumber: receipt.numero_comprobante,
        issuerDocument: receipt.emisor_ruc_dni ?? "",
        issuerName: receipt.emisor_nombre ?? "",
        uploadedAt: toDateTimeLabel(receipt.created_at),
        rawUploadedAt: receipt.created_at ?? new Date().toISOString(),
      })),
      warnings,
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo cargar el detalle de la transaccion.");
  }
}

function validateCompatibility(
  account: AccountRow | undefined,
  category: CategoryRow | undefined,
  type: string
) {
  if (!account) {
    throw new Error("La cuenta seleccionada no existe.");
  }
  if (!category) {
    throw new Error("La categoria seleccionada no existe.");
  }
  if (type === "ingreso" && category.tipo !== "ingreso") {
    throw new Error("La categoria debe ser de tipo ingreso.");
  }
  if (type === "egreso" && category.tipo !== "egreso") {
    throw new Error("La categoria debe ser de tipo egreso.");
  }
}

async function ensureAccount(accountId: string) {
  const tenantId = await resolveCurrentTenantId();
  let query = finanzasSchema()
    .from("cuentas")
    .select("id, nombre_cuenta, tipo_cuenta, moneda, activa")
    .eq("id", accountId)
    .limit(1);
  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return data?.[0] as AccountRow | undefined;
}

async function ensureCategory(categoryId: string) {
  const tenantId = await resolveCurrentTenantId();
  let query = finanzasSchema()
    .from("categorias")
    .select("id, nombre, tipo")
    .eq("id", categoryId)
    .limit(1);
  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return data?.[0] as CategoryRow | undefined;
}

async function ensureProject(projectId: string) {
  const tenantId = await resolveCurrentTenantId();
  let query = ongSchema().from("proyectos").select("id").eq("id", projectId).limit(1);
  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return data?.[0] as ProjectRow | undefined;
}

async function getLatestApprovalByTransactionId(transactionId: string) {
  const approvals = await loadApprovalsByTransactionIds([transactionId]);
  return approvals.get(transactionId) ?? null;
}

async function createPendingApprovalRecord(
  transactionId: string,
  actorId: string | null
) {
  const tenantId = await resolveCurrentTenantId();
  const now = new Date().toISOString();
  const payload: Record<string, string | null> = {
    id_transaccion: transactionId,
    estado: "pendiente",
    comentario: null,
    solicitado_por: actorId,
    resuelto_por: null,
    requested_at: now,
    resolved_at: null,
    updated_at: now,
  };

  if (tenantId) {
    payload.tenant_id = tenantId;
  }

  const { data, error } = await finanzasSchema()
    .from("aprobaciones_transaccion")
    .insert(payload as any)
    .select(
      "id, tenant_id, id_transaccion, estado, comentario, solicitado_por, resuelto_por, requested_at, resolved_at, created_at, updated_at"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ApprovalRow;
}

async function syncApprovalForTransaction(
  transactionId: string,
  type: string,
  actorId: string | null
) {
  const currentApproval = await getLatestApprovalByTransactionId(transactionId);

  if (type !== "egreso") {
    if (currentApproval) {
      const { error } = await finanzasSchema()
        .from("aprobaciones_transaccion")
        .delete()
        .eq("id_transaccion", transactionId);

      if (error) {
        throw new Error(error.message);
      }
    }

    return null;
  }

  if (!currentApproval) {
    return createPendingApprovalRecord(transactionId, actorId);
  }

  if (currentApproval.estado === "pendiente") {
    return currentApproval;
  }

  const now = new Date().toISOString();
  const { data, error } = await finanzasSchema()
    .from("aprobaciones_transaccion")
    .update({
      estado: "pendiente",
      comentario: null,
      solicitado_por: actorId ?? currentApproval.solicitado_por,
      resuelto_por: null,
      requested_at: now,
      resolved_at: null,
      updated_at: now,
    })
    .eq("id", currentApproval.id)
    .select(
      "id, tenant_id, id_transaccion, estado, comentario, solicitado_por, resuelto_por, requested_at, resolved_at, created_at, updated_at"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ApprovalRow;
}

export async function createTransaccionFinanciera(
  input: FinancialTransactionCreateInput
): Promise<FinancialTransactionRow> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const accountId = sanitizeOptionalId(input.accountId);
    const categoryId = sanitizeOptionalId(input.categoryId);
    const projectId = sanitizeOptionalId(input.projectId ?? null);
    const type = sanitizeText(String(input.typeCode || input.typeId || ""), 20).toLowerCase();
    const amount = Number(input.amount);
    const actorId = await resolveActorId(input.actorId ?? null);

    if (!accountId) {
      throw new Error("La cuenta es obligatoria.");
    }
    if (!categoryId) {
      throw new Error("La categoria es obligatoria.");
    }
    if (!["ingreso", "egreso"].includes(type)) {
      throw new Error("Debes seleccionar un tipo valido.");
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("El monto debe ser mayor a cero.");
    }

    const account = await ensureAccount(accountId);
    const category = await ensureCategory(categoryId);
    validateCompatibility(account, category, type);
    if (projectId) {
      await ensureProject(projectId);
    }

    const payload: Record<string, string | number | boolean | null> = {
      id_cuenta: accountId,
      id_categoria: categoryId,
      tipo: type,
      monto: amount,
      fecha_transaccion: input.transactionDate
        ? new Date(input.transactionDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      descripcion: sanitizeText(input.description, MAX_DESCRIPTION_LENGTH) || null,
      comprobante_url: sanitizeText(input.receiptUrl, 500) || null,
      id_proyecto: projectId,
      created_by: actorId,
      updated_by: actorId,
    };

    if (tenantId) {
      payload.tenant_id = tenantId;
    }

    const { data, error } = await finanzasSchema()
      .from("transacciones")
      .insert(payload as any)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await syncApprovalForTransaction(data.id, type, actorId);

    const detail = await getTransaccionFinancieraById(data.id);
    return detail.transaction;
  } catch (error) {
    throw toOperationError(error, "No se pudo registrar la transaccion financiera.");
  }
}

export async function updateTransaccionFinanciera(
  input: FinancialTransactionUpdateInput
): Promise<FinancialTransactionRow> {
  try {
    const transactionId = sanitizeOptionalId(input.transactionId);
    if (!transactionId) {
      throw new Error("No se encontro la transaccion a editar.");
    }

    const actorId = await resolveActorId(input.actorId ?? null);
    const current = await getTransaccionFinancieraById(transactionId);
    const payload: Record<string, string | number | boolean | null> = {
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    };

    if (input.accountId !== undefined) {
      payload.id_cuenta = sanitizeOptionalId(input.accountId);
    }
    if (input.categoryId !== undefined) {
      payload.id_categoria = sanitizeOptionalId(input.categoryId);
    }
    if (input.typeCode !== undefined || input.typeId !== undefined) {
      payload.tipo = sanitizeText(
        String(input.typeCode || input.typeId || ""),
        20
      ).toLowerCase();
    }
    if (input.amount !== undefined) {
      payload.monto = Number(input.amount);
    }
    if (input.transactionDate !== undefined) {
      payload.fecha_transaccion = new Date(
        input.transactionDate ?? new Date().toISOString()
      )
        .toISOString()
        .slice(0, 10);
    }
    if (input.description !== undefined) {
      payload.descripcion = sanitizeText(input.description, MAX_DESCRIPTION_LENGTH) || null;
    }
    if (input.receiptUrl !== undefined) {
      payload.comprobante_url = sanitizeText(input.receiptUrl, 500) || null;
    }
    if (input.projectId !== undefined) {
      payload.id_proyecto = sanitizeOptionalId(input.projectId ?? null);
    }

    const nextAccount = payload.id_cuenta
      ? await ensureAccount(String(payload.id_cuenta))
      : await ensureAccount(current.transaction.accountId);
    const nextCategory = payload.id_categoria
      ? await ensureCategory(String(payload.id_categoria))
      : await ensureCategory(current.transaction.categoryId);
    const nextType = String(payload.tipo ?? current.transaction.typeCode);

    validateCompatibility(nextAccount, nextCategory, nextType);

    if (payload.id_proyecto) {
      await ensureProject(String(payload.id_proyecto));
    }

    const { error } = await finanzasSchema()
      .from("transacciones")
      .update(payload as any)
      .eq("id", transactionId);

    if (error) {
      throw new Error(error.message);
    }

    await syncApprovalForTransaction(transactionId, nextType, actorId);

    const detail = await getTransaccionFinancieraById(transactionId);
    return detail.transaction;
  } catch (error) {
    throw toOperationError(error, "No se pudo editar la transaccion financiera.");
  }
}

export async function removeOrVoidTransaccionFinanciera(
  input: FinancialTransactionRemoveInput
): Promise<void> {
  try {
    const id = sanitizeOptionalId(input.transactionId);
    if (!id) {
      throw new Error("No se encontro la transaccion a eliminar.");
    }

    const { error } = await finanzasSchema()
      .from("transacciones")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw toOperationError(error, "No se pudo eliminar la transaccion financiera.");
  }
}

async function resolveEgresoApproval(
  input: FinancialEgresoResolutionInput,
  targetState: "aprobada" | "rechazada"
) {
  const transactionId = sanitizeOptionalId(input.transactionId);
  if (!transactionId) {
    throw new Error("No se encontro la transaccion a resolver.");
  }

  const actorId = await resolveActorId(input.reviewerId ?? null);
  const comment = sanitizeText(input.comment, MAX_DESCRIPTION_LENGTH) || null;
  const detail = await getTransaccionFinancieraById(transactionId);

  if (detail.transaction.typeKind !== "egreso") {
    throw new Error("Solo los egresos usan aprobacion financiera.");
  }

  if (targetState === "rechazada" && !comment) {
    throw new Error("El rechazo requiere un comentario.");
  }

  const approval =
    (await getLatestApprovalByTransactionId(transactionId)) ??
    (await createPendingApprovalRecord(
      transactionId,
      detail.transaction.registeredById || actorId
    ));

  const now = new Date().toISOString();
  const { error } = await finanzasSchema()
    .from("aprobaciones_transaccion")
    .update({
      estado: targetState,
      comentario: comment,
      resuelto_por: actorId,
      resolved_at: now,
      updated_at: now,
    })
    .eq("id", approval.id);

  if (error) {
    throw new Error(error.message);
  }

  const refreshed = await getTransaccionFinancieraById(transactionId);
  return refreshed.transaction;
}

export async function approveEgreso(input: FinancialEgresoResolutionInput) {
  try {
    return await resolveEgresoApproval(input, "aprobada");
  } catch (error) {
    throw toOperationError(error, "No se pudo aprobar la transaccion.");
  }
}

export async function rejectEgreso(input: FinancialEgresoResolutionInput) {
  try {
    return await resolveEgresoApproval(input, "rechazada");
  } catch (error) {
    throw toOperationError(error, "No se pudo rechazar la transaccion.");
  }
}

export async function observeEgreso(_input: FinancialEgresoResolutionInput) {
  throw new Error(
    "finanzas.aprobaciones_transaccion no define un estado observado; usa aprobar o rechazar."
  );
}

export async function listEgresosPendientesAprobacion(
  params: Partial<FinancialTransactionsFilters> = {}
) {
  const response = await listTransaccionesFinancieras({
    ...params,
    typeCode: "egreso",
    approvalKind: "pending",
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  });

  return {
    ...response,
    rows: response.rows.filter(
      (row) => row.typeKind === "egreso" && row.approvalKind === "pending"
    ),
  };
}

