import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type {
  PermissionCatalogRow,
  RoleMutationInput,
  RolePermissionAssignmentRow,
  RoleRow,
  RoleUserAssignmentRow,
  RolesSettingsData,
} from "../../modules/settings/types";
import {
  getRequiredTenantId,
  normalizeText,
  publicSchema,
  resolveCurrentUserId,
  resolveProfileLabels,
  resolveSettingsCapabilities,
  sanitizeOptionalId,
  sanitizeText,
  toDateTimeLabel,
  toFriendlyError,
  uniqueNonEmpty,
} from "./shared";

type PublicCatPermissionRow = AppDatabase["public"]["Tables"]["cat_permissions"]["Row"];
type PublicRolePermissionRow = AppDatabase["public"]["Tables"]["role_permissions"]["Row"];
type PublicRoleRow = AppDatabase["public"]["Tables"]["roles"]["Row"];
type PublicSedeRow = AppDatabase["public"]["Tables"]["sedes"]["Row"];
type PublicUserRoleSedeRow = AppDatabase["public"]["Tables"]["user_roles_sedes"]["Row"];

const ROLE_UNSUPPORTED_FLOWS = [
  "public.cat_permissions es el catalogo real y se consulta en modo lectura; esta vista no inventa permisos ni modulos.",
  "public.roles no documenta soft delete. La eliminacion es fisica y cascada sobre public.role_permissions y public.user_roles_sedes.",
  "Los roles marcados como is_system_role se exponen solo en lectura para evitar alterar seeds del Core desde frontend.",
];

function buildRoleSearchValue(row: RoleRow): string {
  return normalizeText(
    [
      row.name,
      row.permissionSummary,
      ...row.permissions.map((permission) => `${permission.module} ${permission.id} ${permission.description}`),
      ...row.assignments.map((assignment) => `${assignment.userLabel} ${assignment.sedeName}`),
    ].join(" ")
  );
}

function sanitizeRoleInput(input: RoleMutationInput): {
  roleId: string | null;
  name: string;
  hierarchyLevel: number;
  permissionIds: string[];
} {
  const roleId = sanitizeOptionalId(input.roleId ?? null);
  const name = sanitizeText(input.name, 120);
  if (!name) {
    throw new Error("El nombre del rol es obligatorio.");
  }

  if (!Number.isInteger(input.hierarchyLevel) || input.hierarchyLevel < 0 || input.hierarchyLevel > 10000) {
    throw new Error("El nivel jerarquico debe ser un entero entre 0 y 10000.");
  }

  return {
    roleId,
    name,
    hierarchyLevel: input.hierarchyLevel,
    permissionIds: uniqueNonEmpty(
      input.permissionIds.map((value) => sanitizeOptionalId(value)).filter(Boolean)
    ),
  };
}

async function validatePermissionIds(permissionIds: string[]): Promise<void> {
  if (!permissionIds.length) {
    return;
  }

  const { data, error } = await publicSchema()
    .from("cat_permissions")
    .select("id")
    .in("id", permissionIds);

  if (error) {
    throw new Error(error.message);
  }

  const foundIds = new Set((data ?? []).map((row) => row.id));
  for (const permissionId of permissionIds) {
    if (!foundIds.has(permissionId)) {
      throw new Error("Uno de los permisos seleccionados no existe en public.cat_permissions.");
    }
  }
}

async function getEditableRole(roleId: string, tenantId: string): Promise<PublicRoleRow> {
  const { data, error } = await publicSchema()
    .from("roles")
    .select("id, tenant_id, name, hierarchy_level, is_system_role, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .eq("id", roleId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const role = ((data ?? []) as PublicRoleRow[])[0];
  if (!role) {
    throw new Error("El rol no existe en public.roles para el tenant actual.");
  }
  if (role.is_system_role) {
    throw new Error("Los roles del sistema se exponen solo en lectura desde esta vista.");
  }

  return role;
}

async function syncRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
  const currentResult = await publicSchema()
    .from("role_permissions")
    .select("role_id, permission, created_at")
    .eq("role_id", roleId);

  if (currentResult.error) {
    throw new Error(currentResult.error.message);
  }

  const currentRows = (currentResult.data ?? []) as PublicRolePermissionRow[];
  const currentSet = new Set(currentRows.map((row) => row.permission));
  const targetSet = new Set(permissionIds);

  const toInsert = permissionIds
    .filter((permission) => !currentSet.has(permission))
    .map((permission) => ({ role_id: roleId, permission }));
  const toDelete = currentRows
    .map((row) => row.permission)
    .filter((permission) => !targetSet.has(permission));

  if (toInsert.length) {
    const { error } = await publicSchema().from("role_permissions").insert(toInsert);
    if (error) {
      throw new Error(error.message);
    }
  }

  if (toDelete.length) {
    const { error } = await publicSchema()
      .from("role_permissions")
      .delete()
      .eq("role_id", roleId)
      .in("permission", toDelete);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function getRolesSettingsData(): Promise<RolesSettingsData> {
  const access = await resolveSettingsCapabilities();
  const warnings = access.warnings.slice();

  try {
    const tenantId = await getRequiredTenantId();

    const [rolesResult, permissionsResult, assignmentsResult, catalogResult, sedesResult] =
      await Promise.all([
        access.canReadRoles
          ? publicSchema()
              .from("roles")
              .select("id, tenant_id, name, hierarchy_level, is_system_role, created_at, updated_at")
              .eq("tenant_id", tenantId)
              .order("hierarchy_level", { ascending: true })
              .order("name", { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        access.canReadPermissions
          ? publicSchema().from("role_permissions").select("role_id, permission, created_at")
          : Promise.resolve({ data: [], error: null }),
        access.canReadRoles
          ? publicSchema()
              .from("user_roles_sedes")
              .select("tenant_id, user_id, role_id, sede_id, created_at")
              .eq("tenant_id", tenantId)
              .limit(4_000)
          : Promise.resolve({ data: [], error: null }),
        access.canReadPermissions
          ? publicSchema()
              .from("cat_permissions")
              .select("id, description, module, created_at")
              .order("module", { ascending: true })
              .order("id", { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        access.canReadRoles
          ? publicSchema()
              .from("sedes")
              .select("id, tenant_id, name, is_active, created_at, updated_at")
              .eq("tenant_id", tenantId)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (rolesResult.error) {
      throw new Error(rolesResult.error.message);
    }
    if (permissionsResult.error) {
      throw new Error(permissionsResult.error.message);
    }
    if (assignmentsResult.error) {
      throw new Error(assignmentsResult.error.message);
    }
    if (catalogResult.error) {
      throw new Error(catalogResult.error.message);
    }
    if (sedesResult.error) {
      throw new Error(sedesResult.error.message);
    }

    const roles = (rolesResult.data ?? []) as PublicRoleRow[];
    const rolePermissions = (permissionsResult.data ?? []) as PublicRolePermissionRow[];
    const assignments = (assignmentsResult.data ?? []) as PublicUserRoleSedeRow[];
    const permissionCatalogRows = (catalogResult.data ?? []) as PublicCatPermissionRow[];
    const sedes = (sedesResult.data ?? []) as PublicSedeRow[];

    const profileLabels = await resolveProfileLabels(
      uniqueNonEmpty(assignments.map((row) => row.user_id)),
      tenantId
    ).catch(() => new Map<string, string>());

    const permissionCatalogById = new Map(
      permissionCatalogRows.map((row): [string, PublicCatPermissionRow] => [row.id, row])
    );
    const sedeById = new Map(sedes.map((row): [string, string] => [row.id, row.name]));

    const permissionsByRoleId = new Map<string, RolePermissionAssignmentRow[]>();
    for (const row of rolePermissions) {
      const current = permissionsByRoleId.get(row.role_id) ?? [];
      const catalog = permissionCatalogById.get(row.permission);
      current.push({
        id: row.permission,
        description: catalog?.description ?? row.permission,
        module: catalog?.module ?? "core",
        createdAt: row.created_at,
        createdAtLabel: toDateTimeLabel(row.created_at),
      });
      permissionsByRoleId.set(row.role_id, current);
    }

    const assignmentsByRoleId = new Map<string, RoleUserAssignmentRow[]>();
    for (const row of assignments) {
      const current = assignmentsByRoleId.get(row.role_id) ?? [];
      current.push({
        id: `${row.user_id}::${row.role_id}::${row.sede_id}`,
        userId: row.user_id,
        userLabel: profileLabels.get(row.user_id) ?? row.user_id,
        sedeId: row.sede_id,
        sedeName: sedeById.get(row.sede_id) ?? row.sede_id,
        createdAt: row.created_at,
        createdAtLabel: toDateTimeLabel(row.created_at),
      });
      assignmentsByRoleId.set(row.role_id, current);
    }

    const rolesRows = roles.map((row): RoleRow => {
      const permissions = (permissionsByRoleId.get(row.id) ?? []).sort((left, right) =>
        `${left.module} ${left.id}`.localeCompare(`${right.module} ${right.id}`, "es")
      );
      const roleAssignments = (assignmentsByRoleId.get(row.id) ?? []).sort((left, right) =>
        `${left.userLabel} ${left.sedeName}`.localeCompare(
          `${right.userLabel} ${right.sedeName}`,
          "es"
        )
      );
      const roleRow: RoleRow = {
        id: row.id,
        name: row.name,
        hierarchyLevel: row.hierarchy_level,
        isSystemRole: row.is_system_role,
        createdAt: row.created_at,
        createdAtLabel: toDateTimeLabel(row.created_at),
        updatedAt: row.updated_at,
        updatedAtLabel: toDateTimeLabel(row.updated_at),
        permissionCount: permissions.length,
        permissionSummary: permissions.length
          ? permissions.map((permission) => permission.id).join(", ")
          : "Sin permisos asignados",
        permissions,
        assignmentCount: roleAssignments.length,
        userCount: uniqueNonEmpty(roleAssignments.map((assignment) => assignment.userId)).length,
        assignments: roleAssignments,
        searchValue: "",
      };

      return {
        ...roleRow,
        searchValue: buildRoleSearchValue(roleRow),
      };
    });

    const assignedRoleCountByPermission = new Map<string, number>();
    for (const row of rolePermissions) {
      assignedRoleCountByPermission.set(
        row.permission,
        (assignedRoleCountByPermission.get(row.permission) ?? 0) + 1
      );
    }

    const permissionCatalog: PermissionCatalogRow[] = permissionCatalogRows.map((row) => ({
      id: row.id,
      description: row.description,
      module: row.module,
      createdAt: row.created_at,
      createdAtLabel: toDateTimeLabel(row.created_at),
      assignedRoleCount: assignedRoleCountByPermission.get(row.id) ?? 0,
      searchValue: normalizeText(`${row.module} ${row.id} ${row.description}`),
    }));

    return {
      access,
      roles: rolesRows,
      permissionCatalog,
      warnings,
      unsupportedFlows: ROLE_UNSUPPORTED_FLOWS,
    };
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudieron cargar los roles y permisos reales.")
    );
  }
}

export async function createRole(input: RoleMutationInput): Promise<void> {
  const access = await resolveSettingsCapabilities();
  if (!access.canManageRoles) {
    throw new Error("No tienes permisos para crear roles.");
  }

  const sanitized = sanitizeRoleInput(input);

  try {
    const tenantId = await getRequiredTenantId();
    await validatePermissionIds(sanitized.permissionIds);

    const insertResult = await publicSchema()
      .from("roles")
      .insert({
        tenant_id: tenantId,
        name: sanitized.name,
        hierarchy_level: sanitized.hierarchyLevel,
        is_system_role: false,
      })
      .select("id")
      .limit(1);

    if (insertResult.error) {
      throw new Error(insertResult.error.message);
    }

    const roleId = insertResult.data?.[0]?.id;
    if (!roleId) {
      throw new Error("No se pudo obtener el rol creado.");
    }

    await syncRolePermissions(roleId, sanitized.permissionIds);
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo crear el rol."));
  }
}

export async function updateRole(input: RoleMutationInput): Promise<void> {
  const access = await resolveSettingsCapabilities();
  if (!access.canManageRoles) {
    throw new Error("No tienes permisos para editar roles.");
  }

  const sanitized = sanitizeRoleInput(input);
  if (!sanitized.roleId) {
    throw new Error("No se encontro el rol a editar.");
  }

  try {
    const tenantId = await getRequiredTenantId();
    await getEditableRole(sanitized.roleId, tenantId);
    await validatePermissionIds(sanitized.permissionIds);

    const { error } = await publicSchema()
      .from("roles")
      .update({
        name: sanitized.name,
        hierarchy_level: sanitized.hierarchyLevel,
      })
      .eq("tenant_id", tenantId)
      .eq("id", sanitized.roleId);

    if (error) {
      throw new Error(error.message);
    }

    await syncRolePermissions(sanitized.roleId, sanitized.permissionIds);
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo actualizar el rol."));
  }
}

export async function deleteRole(roleId: string): Promise<void> {
  const access = await resolveSettingsCapabilities();
  if (!access.canManageRoles) {
    throw new Error("No tienes permisos para eliminar roles.");
  }

  const sanitizedRoleId = sanitizeOptionalId(roleId);
  if (!sanitizedRoleId) {
    throw new Error("No se encontro el rol a eliminar.");
  }

  try {
    const tenantId = await getRequiredTenantId();
    await getEditableRole(sanitizedRoleId, tenantId);

    const currentUserId = await resolveCurrentUserId();
    if (currentUserId) {
      const selfAssignmentResult = await publicSchema()
        .from("user_roles_sedes")
        .select("role_id")
        .eq("tenant_id", tenantId)
        .eq("user_id", currentUserId)
        .eq("role_id", sanitizedRoleId)
        .limit(1);

      if (selfAssignmentResult.error) {
        throw new Error(selfAssignmentResult.error.message);
      }

      if (selfAssignmentResult.data?.length) {
        throw new Error(
          "No se permite eliminar un rol actualmente asignado a tu usuario para evitar romper la sesion actual."
        );
      }
    }

    const { error } = await publicSchema()
      .from("roles")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", sanitizedRoleId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo eliminar el rol."));
  }
}
