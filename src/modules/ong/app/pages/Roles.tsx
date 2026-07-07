import { useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import { Eye, ListChecks, Shield, Users } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { FilterBar } from "../components/shared/FilterBar";
import { DataTable, type Column } from "../components/shared/DataTable";
import { ModalShell } from "../components/ui/modal-shell";
import { GradientButton } from "../components/ui/gradient-button";
import { OutlineButton } from "../components/ui/outline-button";
import { StatusDot } from "../components/ui/status-dot";
import { useRoleSettings } from "../modules/settings/hooks/useRoleSettings";
import { useRoleSettingsMutations } from "../modules/settings/hooks/useRoleSettingsMutations";
import type { PermissionCatalogRow, RoleRow } from "../modules/settings/types";
import {
  SettingsDetailField,
  SettingsErrorBlock,
  SettingsFieldError,
  SettingsPermissionBadge,
  SettingsSummaryField,
  SettingsTechnicalDetails,
} from "../modules/settings/components/settings-shared";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
} as const satisfies Variants;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
} as const satisfies Variants;

const INPUT_STYLE = {
  border: "1px solid var(--t-border)",
  background: "var(--t-input-bg)",
  color: "var(--t-text-secondary)",
} as const;

type RoleFormState = {
  roleId?: string;
  name: string;
  hierarchyLevel: string;
  permissionIds: string[];
};

function buildRoleForm(role?: RoleRow | null): RoleFormState {
  return {
    roleId: role?.id,
    name: role?.name ?? "",
    hierarchyLevel: role ? String(role.hierarchyLevel) : "100",
    permissionIds: role?.permissions.map((permission) => permission.id) ?? [],
  };
}

const roleColumns: Column<RoleRow>[] = [
  {
    key: "role",
    label: "Rol",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.name}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          <span>Nivel {row.hierarchyLevel}</span>
          <StatusDot variant={row.isSystemRole ? "info" : "secondary"}>
            {row.isSystemRole ? "Sistema" : "Custom"}
          </StatusDot>
        </div>
      </div>
    ),
  },
  {
    key: "permissions",
    label: "Permisos",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.permissionCount} permisos
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.permissionSummary}
        </div>
      </div>
    ),
  },
  {
    key: "users",
    label: "Usuarios",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.userCount} usuarios
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.assignmentCount} asignaciones por sede
        </div>
      </div>
    ),
  },
  {
    key: "updated",
    label: "Actualizado",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.updatedAtLabel}
      </span>
    ),
  },
];

const permissionColumns: Column<PermissionCatalogRow>[] = [
  {
    key: "permission",
    label: "Permiso",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.id}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.description}
        </div>
      </div>
    ),
  },
  {
    key: "module",
    label: "Modulo",
    render: (row) => (
      <StatusDot variant="secondary">{row.module}</StatusDot>
    ),
  },
  {
    key: "roles",
    label: "Roles vinculados",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.assignedRoleCount}
      </span>
    ),
  },
];

export function Roles() {
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "custom" | "system">("all");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [detailRole, setDetailRole] = useState<RoleRow | null>(null);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [form, setForm] = useState<RoleFormState>(buildRoleForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [removeRole, setRemoveRole] = useState<RoleRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { loading, error, data, refresh } = useRoleSettings();
  const mutations = useRoleSettingsMutations(refresh);

  const summary = useMemo(
    () => ({
      totalRoles: data.roles.length,
      customRoles: data.roles.filter((role) => !role.isSystemRole).length,
      systemRoles: data.roles.filter((role) => role.isSystemRole).length,
      permissions: data.permissionCatalog.length,
    }),
    [data.roles, data.permissionCatalog]
  );

  const filteredRoles = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();

    return data.roles.filter((row) => {
      if (normalized && !row.searchValue.includes(normalized)) {
        return false;
      }
      if (roleFilter === "custom" && row.isSystemRole) {
        return false;
      }
      if (roleFilter === "system" && !row.isSystemRole) {
        return false;
      }
      return true;
    });
  }, [data.roles, roleFilter, searchValue]);

  const filteredPermissions = useMemo(() => {
    const normalized = permissionSearch.trim().toLowerCase();
    if (!normalized) {
      return data.permissionCatalog;
    }

    return data.permissionCatalog.filter((row) => row.searchValue.includes(normalized));
  }, [data.permissionCatalog, permissionSearch]);

  const filterOptions = useMemo(
    () => [
      { label: "Todos", value: "all", active: roleFilter === "all" },
      { label: "Custom", value: "custom", active: roleFilter === "custom" },
      { label: "Sistema", value: "system", active: roleFilter === "system" },
    ],
    [roleFilter]
  );

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, PermissionCatalogRow[]>();
    for (const permission of data.permissionCatalog) {
      const current = groups.get(permission.module) ?? [];
      current.push(permission);
      groups.set(permission.module, current);
    }

    return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right, "es"));
  }, [data.permissionCatalog]);

  function openCreateModal() {
    if (!data.access.canManageRoles) {
      toast.error("No tienes permisos para crear roles.");
      return;
    }

    setEditingRole(null);
    setForm(buildRoleForm());
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditModal(role: RoleRow) {
    if (!data.access.canManageRoles) {
      toast.error("No tienes permisos para editar roles.");
      return;
    }
    if (role.isSystemRole) {
      toast.error("Los roles del sistema se exponen solo en lectura.");
      return;
    }

    setEditingRole(role);
    setForm(buildRoleForm(role));
    setFormError(null);
    setIsFormOpen(true);
  }

  function togglePermission(permissionId: string) {
    setForm((current) => ({
      ...current,
      permissionIds: current.permissionIds.includes(permissionId)
        ? current.permissionIds.filter((value) => value !== permissionId)
        : current.permissionIds.concat(permissionId),
    }));
  }

  async function submitForm() {
    const hierarchyLevel = Number.parseInt(form.hierarchyLevel, 10);

    if (!form.name.trim()) {
      setFormError("El nombre del rol es obligatorio.");
      return;
    }
    if (!Number.isInteger(hierarchyLevel)) {
      setFormError("El nivel jerarquico debe ser un entero valido.");
      return;
    }

    try {
      await mutations.save({
        roleId: form.roleId,
        name: form.name.trim(),
        hierarchyLevel,
        permissionIds: form.permissionIds,
      });

      toast.success(form.roleId ? "Rol actualizado." : "Rol creado.");
      setIsFormOpen(false);
      setEditingRole(null);
      setForm(buildRoleForm());
    } catch (saveError) {
      setFormError(
        saveError instanceof Error ? saveError.message : "No se pudo guardar el rol."
      );
    }
  }

  async function confirmRemoveRole() {
    if (!removeRole) {
      return;
    }

    try {
      await mutations.remove(removeRole.id);
      toast.success("Rol eliminado.");
      setRemoveRole(null);
    } catch (removeError) {
      toast.error(
        removeError instanceof Error
          ? removeError.message
          : "No se pudo eliminar el rol."
      );
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Roles y permisos"
          description="Administra los perfiles de acceso y define que puede hacer cada equipo dentro de la plataforma."
          action={
            data.access.canManageRoles
              ? { label: "Nuevo rol", onClick: openCreateModal }
              : { label: "Actualizar", onClick: refresh }
          }
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <SettingsPermissionBadge
              allowed={data.access.canReadRoles}
              allowedLabel="Lectura de roles"
              deniedLabel="Sin lectura de roles"
            />
            <SettingsPermissionBadge
              allowed={data.access.canManageRoles}
              allowedLabel="Gestion de roles"
              deniedLabel="Sin gestion de roles"
            />
            <SettingsPermissionBadge
              allowed={data.access.canReadPermissions}
              allowedLabel="Catalogo de permisos"
              deniedLabel="Sin catalogo de permisos"
            />
          </div>
          <SettingsTechnicalDetails
            details={[
              "Administra roles reales en public.roles, asigna permisos desde public.cat_permissions y sincroniza public.role_permissions sin inventar modulos ni acciones.",
              ...data.warnings,
              ...data.unsupportedFlows,
            ]}
          />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SettingsSummaryField label="Roles totales" value={String(summary.totalRoles)} />
          <SettingsSummaryField label="Roles custom" value={String(summary.customRoles)} />
          <SettingsSummaryField label="Roles sistema" value={String(summary.systemRoles)} />
          <SettingsSummaryField label="Permisos reales" value={String(summary.permissions)} />
        </div>
      </motion.div>

      {(error || !data.access.canReadRoles) && (
        <motion.div variants={fadeUp}>
          <SettingsErrorBlock
            message={
              error ??
              "La lectura de roles requiere `settings.roles.read`, `settings.roles.manage` o compatibilidad legacy `iam.user_roles.manage` / tenant admin."
            }
            onRetry={refresh}
          />
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <h2 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Roles institucionales
            </h2>
          </div>

          <FilterBar
            searchPlaceholder="Buscar por nombre, permiso o usuario asignado..."
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filters={filterOptions}
            onFilterClick={(value) => setRoleFilter(value as "all" | "custom" | "system")}
          />

          <div className="mt-4">
            <DataTable
              columns={roleColumns}
              data={data.access.canReadRoles ? filteredRoles : []}
              loading={loading}
              emptyMessage="No se encontraron roles reales para los filtros seleccionados."
              actions={
                data.access.canManageRoles
                  ? [
                      { label: "Ver detalle", onClick: (row) => setDetailRole(row) },
                      { label: "Editar", onClick: (row) => openEditModal(row) },
                      {
                        label: "Eliminar",
                        variant: "destructive",
                        onClick: (row) => {
                          if (row.isSystemRole) {
                            toast.error("Los roles del sistema no se eliminan desde esta vista.");
                            return;
                          }
                          setRemoveRole(row);
                        },
                      },
                    ]
                  : [{ label: "Ver detalle", onClick: (row) => setDetailRole(row) }]
              }
            />
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="mb-4 flex items-center gap-2">
            <ListChecks className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <h2 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Catalogo de permisos reales
            </h2>
          </div>

          <FilterBar
            searchPlaceholder="Buscar permiso por modulo, id o descripcion..."
            searchValue={permissionSearch}
            onSearchChange={setPermissionSearch}
          />

          <div className="mt-4">
            <DataTable
              columns={permissionColumns}
              data={data.access.canReadPermissions ? filteredPermissions : []}
              loading={loading}
              emptyMessage="No se encontraron permisos reales para el filtro actual."
              actions={[]}
            />
          </div>
        </div>
      </motion.div>

      <ModalShell open={Boolean(detailRole)} onClose={() => setDetailRole(null)} width="max-w-[960px]">
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Detalle del rol
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                public.roles + public.role_permissions + public.user_roles_sedes
              </p>
            </div>
          </div>

          {detailRole && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <SettingsDetailField label="Nombre" value={detailRole.name} />
                <SettingsDetailField label="Nivel jerarquico" value={String(detailRole.hierarchyLevel)} />
                <SettingsDetailField
                  label="Tipo"
                  value={detailRole.isSystemRole ? "Rol del sistema" : "Rol editable"}
                />
                <SettingsDetailField
                  label="Actualizado"
                  value={detailRole.updatedAtLabel}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                    <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                      Permisos asignados
                    </h4>
                  </div>
                  {detailRole.permissions.length === 0 ? (
                    <p className="mt-3 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                      Este rol no tiene permisos asignados.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {detailRole.permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="rounded-xl px-3 py-2"
                          style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
                        >
                          <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                            {permission.id}
                          </p>
                          <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                            {permission.module} · {permission.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                    <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                      Usuarios vinculados
                    </h4>
                  </div>
                  {detailRole.assignments.length === 0 ? (
                    <p className="mt-3 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                      El rol no esta asignado a usuarios del tenant.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {detailRole.assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="rounded-xl px-3 py-2"
                          style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
                        >
                          <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                            {assignment.userLabel}
                          </p>
                          <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                            {assignment.sedeName} · {assignment.createdAtLabel}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </ModalShell>

      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} width="max-w-[920px]">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                {editingRole ? "Editar rol" : "Nuevo rol"}
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                La configuracion sincroniza public.roles y public.role_permissions.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[12px]"
              onClick={() => setIsFormOpen(false)}
            >
              X
            </button>
          </div>

          {formError && (
            <SettingsErrorBlock message={formError} onRetry={() => setFormError(null)} />
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Nombre del rol"
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
              <SettingsFieldError
                message={!form.name.trim() && formError ? "El nombre es obligatorio." : undefined}
              />
            </div>
            <div className="space-y-1">
              <input
                type="number"
                value={form.hierarchyLevel}
                onChange={(event) =>
                  setForm((current) => ({ ...current, hierarchyLevel: event.target.value }))
                }
                placeholder="Nivel jerarquico"
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
              <SettingsFieldError
                message={
                  !form.hierarchyLevel.trim() && formError
                    ? "El nivel jerarquico es obligatorio."
                    : undefined
                }
              />
            </div>
          </div>

          <div
            className="rounded-2xl px-4 py-3"
            style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
          >
            <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
              Los permisos disponibles provienen de public.cat_permissions. Los checkboxes cambian el estado real de public.role_permissions.
            </p>
          </div>

          <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
            {permissionGroups.map(([module, permissions]) => (
              <div key={module} className="space-y-2">
                <div className="flex items-center gap-2">
                  <StatusDot variant="secondary">{module}</StatusDot>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {permissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-start gap-2 rounded-xl px-3 py-2"
                      style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
                    >
                      <input
                        type="checkbox"
                        checked={form.permissionIds.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                      />
                      <span>
                        <span className="block text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                          {permission.id}
                        </span>
                        <span className="block text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                          {permission.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <GradientButton
              size="sm"
              onClick={() => void submitForm()}
              disabled={mutations.isSaving}
            >
              {mutations.isSaving ? "Guardando..." : "Guardar"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => setIsFormOpen(false)}
              disabled={mutations.isSaving}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={Boolean(removeRole)} onClose={() => setRemoveRole(null)} width="max-w-[560px]">
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Eliminar rol
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                La eliminacion es fisica y cascada sobre permisos y asignaciones por sede.
              </p>
            </div>
          </div>

          <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
            {removeRole
              ? `Se eliminara el rol ${removeRole.name} y ${removeRole.assignmentCount} asignaciones institucionales vinculadas.`
              : "Confirma la eliminacion del rol."}
          </p>

          <div className="flex gap-2">
            <GradientButton
              size="sm"
              onClick={() => void confirmRemoveRole()}
              disabled={mutations.isRemoving}
            >
              {mutations.isRemoving ? "Eliminando..." : "Confirmar"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => setRemoveRole(null)}
              disabled={mutations.isRemoving}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
