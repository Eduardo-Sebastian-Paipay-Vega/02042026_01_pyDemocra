import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type {
  GovernanceRestoreCandidateRow,
  GovernanceRetentionData,
} from "../../modules/governance/types";
import { listGovernanceDeleteAuditEvents } from "./audit.service";
import {
  createTenantScopedQuery,
  getRequiredTenantId,
  ongSchema,
  publicSchema,
  resolveActorId,
  resolveGovernanceCapabilities,
  resolveProfileLabels,
  rrhhSchema,
  sanitizeOptionalId,
  toDateTimeLabel,
  toFriendlyError,
  uniqueNonEmpty,
} from "./shared";

type PublicTenantRow = AppDatabase["public"]["Tables"]["tenants"]["Row"];
type PublicPlanPolicyRow = AppDatabase["public"]["Tables"]["plan_policies"]["Row"];
type OngAsistenciaRow = AppDatabase["ong"]["Tables"]["asistencias"]["Row"];
type OngAsignacionActividadRow =
  AppDatabase["ong"]["Tables"]["asignaciones_actividad"]["Row"];
type OngRecursoProyectoRow = AppDatabase["ong"]["Tables"]["recursos_proyecto"]["Row"];
type RrhhOnboardingVoluntarioRow =
  AppDatabase["rrhh"]["Tables"]["onboarding_voluntario"]["Row"];

type RestoreSchemaName = GovernanceRestoreCandidateRow["schemaName"];
type RestoreTableName = GovernanceRestoreCandidateRow["tableName"];

type SoftDeleteConfig = {
  schemaName: RestoreSchemaName;
  tableName: RestoreTableName;
  sourceReference: string;
  entityLabel: string;
  selectColumns: string;
  listDeleted(
    tenantId: string
  ): Promise<
    | OngAsistenciaRow[]
    | OngAsignacionActividadRow[]
    | OngRecursoProyectoRow[]
    | RrhhOnboardingVoluntarioRow[]
  >;
  buildScopeLabel(
    row:
      | OngAsistenciaRow
      | OngAsignacionActividadRow
      | OngRecursoProyectoRow
      | RrhhOnboardingVoluntarioRow
  ): string;
  restore(tenantId: string, recordId: string, actorId: string | null): Promise<void>;
};

const SUPPORT_NOTES_BASE = [
  "La ventana de retencion del tenant se lee desde `public.tenants.plan_id` y `public.plan_policies.retention_days` cuando el Core expone ambas tablas.",
  "El restore real solo se habilita para tablas con `is_deleted`, `deleted_at` y `deleted_by` documentadas en Parte 4, y se limita a una whitelist operativa.",
  "Mientras el Core no publique un permiso de mutacion dedicado para restore, la accion se restringe a tenant admin y mantiene trazabilidad por `updated_at` y `updated_by`.",
];

const SOFT_DELETE_TABLES: SoftDeleteConfig[] = [
  {
    schemaName: "ong",
    tableName: "asistencias",
    sourceReference:
      "guidelines/BD/Parte 4- Script maestro documental de ONG mÃ³dulos complementarios.txt",
    entityLabel: "Asistencia",
    selectColumns:
      "id, tenant_id, id_actividad, id_voluntario, fecha_operacion, updated_at, updated_by, deleted_at, deleted_by, is_deleted",
    async listDeleted(tenantId) {
      const { data, error } = await createTenantScopedQuery(
        ongSchema()
          .from("asistencias")
          .select(
            "id, tenant_id, id_actividad, id_voluntario, fecha_operacion, check_in_at, check_out_at, origen_registro, estado, observacion, qr_payload, id_card_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by, is_deleted"
          )
          .eq("is_deleted", true)
          .order("deleted_at", { ascending: false })
          .limit(80),
        tenantId
      );

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as OngAsistenciaRow[];
    },
    buildScopeLabel(row) {
      const asistencia = row as OngAsistenciaRow;
      return `Actividad ${asistencia.id_actividad} | Voluntario ${asistencia.id_voluntario} | ${asistencia.fecha_operacion}`;
    },
    async restore(tenantId, recordId, actorId) {
      const now = new Date().toISOString();
      const { data, error } = await createTenantScopedQuery(
        ongSchema()
          .from("asistencias")
          .select("id")
          .eq("id", recordId)
          .eq("is_deleted", true)
          .limit(1),
        tenantId
      );

      if (error) {
        throw new Error(error.message);
      }
      if (!data?.length) {
        throw new Error("La asistencia no existe o ya fue restaurada.");
      }

      const { error: restoreError } = await ongSchema()
        .from("asistencias")
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
          updated_at: now,
          updated_by: actorId,
        })
        .eq("tenant_id", tenantId)
        .eq("id", recordId);

      if (restoreError) {
        throw new Error(restoreError.message);
      }
    },
  },
  {
    schemaName: "ong",
    tableName: "asignaciones_actividad",
    sourceReference:
      "guidelines/BD/Parte 4- Script maestro documental de ONG mÃ³dulos complementarios.txt",
    entityLabel: "Asignacion de actividad",
    selectColumns:
      "id, tenant_id, id_actividad, id_voluntario, updated_at, updated_by, deleted_at, deleted_by, is_deleted",
    async listDeleted(tenantId) {
      const { data, error } = await createTenantScopedQuery(
        ongSchema()
          .from("asignaciones_actividad")
          .select(
            "id, tenant_id, id_actividad, id_voluntario, rol_en_actividad, created_at, updated_at, created_by, updated_by, is_deleted, deleted_at, deleted_by"
          )
          .eq("is_deleted", true)
          .order("deleted_at", { ascending: false })
          .limit(80),
        tenantId
      );

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as OngAsignacionActividadRow[];
    },
    buildScopeLabel(row) {
      const assignment = row as OngAsignacionActividadRow;
      return `Actividad ${assignment.id_actividad} | Voluntario ${assignment.id_voluntario}`;
    },
    async restore(tenantId, recordId, actorId) {
      const now = new Date().toISOString();
      const { data, error } = await createTenantScopedQuery(
        ongSchema()
          .from("asignaciones_actividad")
          .select("id")
          .eq("id", recordId)
          .eq("is_deleted", true)
          .limit(1),
        tenantId
      );

      if (error) {
        throw new Error(error.message);
      }
      if (!data?.length) {
        throw new Error("La asignacion no existe o ya fue restaurada.");
      }

      const { error: restoreError } = await ongSchema()
        .from("asignaciones_actividad")
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
          updated_at: now,
          updated_by: actorId,
        })
        .eq("tenant_id", tenantId)
        .eq("id", recordId);

      if (restoreError) {
        throw new Error(restoreError.message);
      }
    },
  },
  {
    schemaName: "ong",
    tableName: "recursos_proyecto",
    sourceReference:
      "guidelines/BD/Parte 4- Script maestro documental de ONG mÃ³dulos complementarios.txt",
    entityLabel: "Recurso de proyecto",
    selectColumns:
      "id, tenant_id, id_proyecto, id_item, updated_at, updated_by, deleted_at, deleted_by, is_deleted",
    async listDeleted(tenantId) {
      const { data, error } = await createTenantScopedQuery(
        ongSchema()
          .from("recursos_proyecto")
          .select(
            "id, tenant_id, id_proyecto, id_item, cantidad_requerida, cantidad_asignada, created_at, updated_at, created_by, updated_by, is_deleted, deleted_at, deleted_by"
          )
          .eq("is_deleted", true)
          .order("deleted_at", { ascending: false })
          .limit(80),
        tenantId
      );

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as OngRecursoProyectoRow[];
    },
    buildScopeLabel(row) {
      const resource = row as OngRecursoProyectoRow;
      return `Proyecto ${resource.id_proyecto} | Item ${resource.id_item}`;
    },
    async restore(tenantId, recordId, actorId) {
      const now = new Date().toISOString();
      const { data, error } = await createTenantScopedQuery(
        ongSchema()
          .from("recursos_proyecto")
          .select("id")
          .eq("id", recordId)
          .eq("is_deleted", true)
          .limit(1),
        tenantId
      );

      if (error) {
        throw new Error(error.message);
      }
      if (!data?.length) {
        throw new Error("El recurso de proyecto no existe o ya fue restaurado.");
      }

      const { error: restoreError } = await ongSchema()
        .from("recursos_proyecto")
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
          updated_at: now,
          updated_by: actorId,
        })
        .eq("tenant_id", tenantId)
        .eq("id", recordId);

      if (restoreError) {
        throw new Error(restoreError.message);
      }
    },
  },
  {
    schemaName: "rrhh",
    tableName: "onboarding_voluntario",
    sourceReference:
      "guidelines/BD/Parte 4- Script maestro documental de ONG mÃ³dulos complementarios.txt",
    entityLabel: "Onboarding de voluntario",
    selectColumns:
      "id, tenant_id, id_voluntario, id_paso, updated_at, updated_by, deleted_at, deleted_by, is_deleted",
    async listDeleted(tenantId) {
      const { data, error } = await createTenantScopedQuery(
        rrhhSchema()
          .from("onboarding_voluntario")
          .select(
            "id, tenant_id, id_voluntario, id_paso, completado, fecha_completado, evidencia_url, created_at, updated_at, created_by, updated_by, is_deleted, deleted_at, deleted_by"
          )
          .eq("is_deleted", true)
          .order("deleted_at", { ascending: false })
          .limit(80),
        tenantId
      );

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as RrhhOnboardingVoluntarioRow[];
    },
    buildScopeLabel(row) {
      const onboarding = row as RrhhOnboardingVoluntarioRow;
      return `Voluntario ${onboarding.id_voluntario} | Paso ${onboarding.id_paso}`;
    },
    async restore(tenantId, recordId, actorId) {
      const now = new Date().toISOString();
      const { data, error } = await createTenantScopedQuery(
        rrhhSchema()
          .from("onboarding_voluntario")
          .select("id")
          .eq("id", recordId)
          .eq("is_deleted", true)
          .limit(1),
        tenantId
      );

      if (error) {
        throw new Error(error.message);
      }
      if (!data?.length) {
        throw new Error("El onboarding no existe o ya fue restaurado.");
      }

      const { error: restoreError } = await rrhhSchema()
        .from("onboarding_voluntario")
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
          updated_at: now,
          updated_by: actorId,
        })
        .eq("tenant_id", tenantId)
        .eq("id", recordId);

      if (restoreError) {
        throw new Error(restoreError.message);
      }
    },
  },
];

function getRestoreConfig(
  schemaName: string,
  tableName: string
): SoftDeleteConfig | null {
  return (
    SOFT_DELETE_TABLES.find(
      (item) => item.schemaName === schemaName && item.tableName === tableName
    ) ?? null
  );
}

async function fetchRetentionPolicy(
  tenantId: string
): Promise<{ retentionDays: number | null; retentionPolicyLabel: string }> {
  const tenantResult = await publicSchema()
    .from("tenants")
    .select("id, name, tax_id, industry_type_id, plan_id, status_financial_id, billing_day, max_licenses, created_at, updated_at")
    .eq("id", tenantId)
    .limit(1);

  if (tenantResult.error) {
    throw new Error(tenantResult.error.message);
  }

  const tenantRow = ((tenantResult.data ?? []) as PublicTenantRow[])[0];
  if (!tenantRow) {
    return {
      retentionDays: null,
      retentionPolicyLabel: "Politica de retencion no disponible",
    };
  }

  const policyResult = await publicSchema()
    .from("plan_policies")
    .select("plan_id, retention_days, max_sedes, max_licenses, can_use_terminals, created_at")
    .eq("plan_id", tenantRow.plan_id)
    .limit(1);

  if (policyResult.error) {
    throw new Error(policyResult.error.message);
  }

  const policyRow = ((policyResult.data ?? []) as PublicPlanPolicyRow[])[0];
  if (!policyRow) {
    return {
      retentionDays: null,
      retentionPolicyLabel: `Plan ${tenantRow.plan_id} sin politica visible`,
    };
  }

  return {
    retentionDays: policyRow.retention_days,
    retentionPolicyLabel: `Plan ${tenantRow.plan_id}: ${policyRow.retention_days} dias`,
  };
}

async function fetchRestoreCandidates(
  tenantId: string
): Promise<GovernanceRestoreCandidateRow[]> {
  const resultSets = await Promise.all(
    SOFT_DELETE_TABLES.map(async (config) => ({
      config,
      rows: await config.listDeleted(tenantId),
    }))
  );

  const deletedByLabels = await resolveProfileLabels(
    uniqueNonEmpty(
      resultSets.flatMap((result) =>
        result.rows.map((row) => row.deleted_by).filter(Boolean)
      )
    ),
    tenantId
  ).catch(() => new Map<string, string>());

  const rows = resultSets.flatMap(({ config, rows }) =>
    rows.map((row): GovernanceRestoreCandidateRow => ({
      id: row.id,
      schemaName: config.schemaName,
      tableName: config.tableName,
      entityLabel: config.entityLabel,
      scopeLabel: config.buildScopeLabel(row),
      deletedAt: row.deleted_at ?? row.updated_at,
      deletedAtLabel: toDateTimeLabel(row.deleted_at ?? row.updated_at),
      deletedBy: row.deleted_by,
      deletedByLabel: row.deleted_by
        ? deletedByLabels.get(row.deleted_by) ?? row.deleted_by
        : "Sistema",
      sourceReference: config.sourceReference,
    }))
  );

  return rows.sort((left, right) => right.deletedAt.localeCompare(left.deletedAt));
}

export async function getGovernanceRetentionData(): Promise<GovernanceRetentionData> {
  const access = await resolveGovernanceCapabilities();
  const warnings = access.warnings.slice();

  try {
    const tenantId = await getRequiredTenantId();
    const canRestoreRecords = access.canReadRetention && access.isTenantAdmin;

    const [auditData, retentionPolicy, restoreCandidates] = await Promise.all([
      access.canReadRetention
        ? listGovernanceDeleteAuditEvents(60)
        : Promise.resolve({
            access,
            rows: [],
            schemaOptions: [{ value: "all", label: "Esquema: Todos" }],
            tableOptions: [{ value: "all", label: "Tabla: Todas" }],
            actorOptions: [{ value: "all", label: "Actor: Todos" }],
            warnings,
          }),
      access.canReadRetention
        ? fetchRetentionPolicy(tenantId).catch((error) => {
            warnings.push(
              toFriendlyError(
                error,
                "No se pudo resolver public.tenants o public.plan_policies."
              )
            );
            return {
              retentionDays: null,
              retentionPolicyLabel: "Politica de retencion no disponible",
            };
          })
        : Promise.resolve({
            retentionDays: null,
            retentionPolicyLabel: "Sin acceso a retencion",
          }),
      access.canReadRetention
        ? fetchRestoreCandidates(tenantId).catch((error) => {
            warnings.push(
              toFriendlyError(
                error,
                "No se pudieron listar registros con soft delete restaurable."
              )
            );
            return [] as GovernanceRestoreCandidateRow[];
          })
        : Promise.resolve([] as GovernanceRestoreCandidateRow[]),
    ]);

    if (!access.isTenantAdmin && access.canReadRetention) {
      warnings.push(
        "El Core no publica un permiso de restore dedicado; la accion queda visible solo para tenant admin sobre la whitelist operativa."
      );
    }

    return {
      access,
      retentionDays: retentionPolicy.retentionDays,
      retentionPolicyLabel: retentionPolicy.retentionPolicyLabel,
      canRestoreRecords,
      restoreCandidates,
      recentDeleteEvents: auditData.rows ?? [],
      warnings: uniqueNonEmpty(warnings.concat(auditData.warnings ?? [])),
      supportNotes: SUPPORT_NOTES_BASE,
    };
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudo consolidar el estado de retencion y borrado.")
    );
  }
}

export async function restoreGovernanceSoftDeletedRecord(
  schemaName: string,
  tableName: string,
  recordId: string
): Promise<void> {
  const access = await resolveGovernanceCapabilities();
  if (!access.canReadRetention) {
    throw new Error("No tienes permisos para revisar retencion y restore.");
  }
  if (!access.isTenantAdmin) {
    throw new Error(
      "El restore real se limita a tenant admin hasta que el Core publique un permiso de mutacion dedicado."
    );
  }

  const config = getRestoreConfig(schemaName, tableName);
  if (!config) {
    throw new Error("La entidad solicitada no pertenece a la whitelist de restore real.");
  }

  const sanitizedRecordId = sanitizeOptionalId(recordId);
  if (!sanitizedRecordId) {
    throw new Error("No se encontro el registro a restaurar.");
  }

  try {
    const tenantId = await getRequiredTenantId();
    const actorId = await resolveActorId();
    await config.restore(tenantId, sanitizedRecordId, actorId);
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudo restaurar el registro seleccionado.")
    );
  }
}

