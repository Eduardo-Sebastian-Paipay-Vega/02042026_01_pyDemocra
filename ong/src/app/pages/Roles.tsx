import { useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import { Eye, ListChecks, Shield, Users } from "lucide-react";
import { z } from "zod";
import { PageHeader } from '@/core/components/shared/PageHeader';
import { FilterBar } from '@/core/components/shared/FilterBar';
import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
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
  border: "1px solid var(--color-border-subtle)",
  background: "var(--color-bg-main)",
  color: "var(--color-text-secondary)",
} as const;

type RoleFormState = {
  roleId?: string;
  name: string;
  hierarchyLevel: string;
  permissionIds: string[];
};

const roleSchema = z.object({
  name: z.string().min(1, "El nombre del rol es obligatorio."),
  hierarchyLevel: z.coerce.number().int("Debe ser un número entero.").min(0, "El nivel jerárquico no puede ser negativo.")
});

function buildRoleForm(role?: RoleRow | null): RoleFormState {
  return {
    roleId: role?.id,
    name: role?.name ?? "",
    hierarchyLevel: role ? String(role.hierarchyLevel) : "100",
    permissionIds: role?.permissions.map((permission) => permission.id) ?? [],
  };
}

const MODULE_TRANSLATIONS: Record<string, string> = {
  billing: "Facturación",
  core: "Núcleo",
  iam: "Accesos",
  operation: "Operaciones",
  projects: "Proyectos",
  resources: "Inventario",
  ace: "Accesos y Credenciales",
};

function translateModule(mod: string) {
  return MODULE_TRANSLATIONS[mod] || (mod.charAt(0).toUpperCase() + mod.slice(1));
}

function sanitizePermissionDescription(desc: string | null | undefined, id: string) {
  if (!desc) return id;
  return desc
    .replace(/\(fn_[^)]*\)/gi, "")
    .replace(/\bfn_\w+/gi, "")
    .replace(/links?\s+de\s+acceso/gi, "enlaces de acceso")
    .replace(/del\s+tenant/gi, "de la organización")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const roleColumns: Column<RoleRow>[] = [
  {
    key: "role",
    label: "Rol",
    render: (row) => (
      <div>
        <div style={{ color: "var(--color-text-primary)" }} className="capitalize">{row.name}</div>
        <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          <span>Nivel {row.hierarchyLevel}</span>
          <StatusDot variant={row.isSystemRole ? "info" : "secondary"}>
            {row.isSystemRole ? "Sistema" : "Personalizado"}
          </StatusDot>
        </div>
      </div>
    ),
  },
  {
    key: "permissions",
    label: "Permisos",
    render: (row) => {
      if (!row.permissions || row.permissions.length === 0) {
        return <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>Sin permisos</span>;
      }
      
      const modules = Array.from(new Set(row.permissions.map(p => p.module)));
      const topModules = modules.slice(0, 3);
      // Extra count refers to the remaining permissions, not modules, as per standard UI patterns
      // If we show 3 modules, we'll just say +N más where N = total permissions - 3, 
      // or if total permissions <= 3, just show the ones we have without +N (but cap to 3 modules).
      // Actually, if we show 3 modules, we might be hiding 19 permissions (if total is 22). 
      // So extraCount = row.permissions.length - topModules.length
      const extraCount = row.permissions.length - topModules.length;
      
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {topModules.map(mod => (
            <span key={mod} className="px-2 py-0.5 rounded-full text-xs bg-[#1a2332] text-[#3b82f6] border border-[#25334b]">
              {translateModule(mod)}
            </span>
          ))}
          {extraCount > 0 && (
            <span title={row.permissions.slice(topModules.length).map(p => sanitizePermissionDescription(p.description, p.id)).join(', ')} className="px-2 py-0.5 rounded-full text-xs bg-[#2a2a2a] text-[#A4A29F] border border-[#333] cursor-help">
              +{extraCount} más
            </span>
          )}
        </div>
      );
    },
  },
  {
    key: "users",
    label: "Usuarios",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
        {row.userCount} {row.userCount === 1 ? "usuario" : "usuarios"}
        <div className="mt-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          {row.assignmentCount} {row.assignmentCount === 1 ? "asignación" : "asignaciones"} por sede
        </div>
      </div>
    ),
  },
  {
    key: "updated",
    label: "Actualizado",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
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
        <div style={{ color: "var(--color-text-primary)" }}>{sanitizePermissionDescription(row.description, row.id)}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
          <code className="text-[10px] bg-black/20 px-1 py-0.5 rounded text-gray-400">{row.id}</code>
        </div>
      </div>
    ),
  },
  {
    key: "module",
    label: "Módulo",
    render: (row) => (
      <StatusDot variant="secondary">{translateModule(row.module)}</StatusDot>
    ),
  },
  {
    key: "roles",
    label: "Roles vinculados",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
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
  const [activeTab, setActiveTab] = useState<"roles" | "permissions">("roles");

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
      { label: "Personalizados", value: "custom", active: roleFilter === "custom" },
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
    const result = roleSchema.safeParse(form);
    
    if (!result.success) {
      setFormError(result.error.issues[0].message);
      return;
    }

    try {
      await mutations.save({
        roleId: form.roleId,
        name: result.data.name.trim(),
        hierarchyLevel: result.data.hierarchyLevel,
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
          description="Administra los roles de la organización y sus permisos asignados por módulo."
          action={
            data.access.canManageRoles
              ? { label: "Nuevo rol", onClick: openCreateModal }
              : { label: "Actualizar", onClick: refresh }
          }
        />
      </motion.div>



      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: "Roles totales", value: summary.totalRoles },
            { label: "Roles personalizados", value: summary.customRoles },
            { label: "Roles sistema", value: summary.systemRoles },
            { label: "Permisos disponibles", value: summary.permissions },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-1 min-w-[150px] rounded-xl px-4 py-2 flex items-center justify-between"
              style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)" }}
            >
              <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{stat.label}</span>
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{stat.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {(error || !data.access.canReadRoles) && (
        <motion.div variants={fadeUp}>
          <SettingsErrorBlock
            message={
              error ??
              "No tienes los permisos necesarios para visualizar los roles. Contacta al administrador."
            }
            onRetry={refresh}
          />
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl p-4 flex flex-col"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)", minHeight: "500px" }}
        >
          <div className="mb-4 flex items-center gap-4 border-b pb-3" style={{ borderColor: "var(--color-border-subtle)" }}>
            <button
              onClick={() => setActiveTab("roles")}
              className={`flex items-center gap-2 text-sm font-medium transition-colors pb-3 -mb-3 border-b-2 ${
                activeTab === "roles" ? "text-blue-500 border-blue-500" : "text-gray-400 border-transparent hover:text-gray-300"
              }`}
            >
              <Shield className="h-4 w-4" />
              Roles Institucionales
            </button>
            <button
              onClick={() => setActiveTab("permissions")}
              className={`flex items-center gap-2 text-sm font-medium transition-colors pb-3 -mb-3 border-b-2 ${
                activeTab === "permissions" ? "text-blue-500 border-blue-500" : "text-gray-400 border-transparent hover:text-gray-300"
              }`}
            >
              <ListChecks className="h-4 w-4" />
              Catálogo de Permisos
            </button>
          </div>

          {activeTab === "roles" && (
            <div className="flex-1 flex flex-col">
              <FilterBar
                searchPlaceholder="Buscar por nombre, permiso o usuario asignado..."
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                filters={filterOptions}
                onFilterClick={(value) => setRoleFilter(value as "all" | "custom" | "system")}
              />
              <div className="mt-4 flex-1">
                <DataTable
                  columns={roleColumns}
                  data={data.access.canReadRoles ? filteredRoles : []}
                  loading={loading}
                  emptyMessage="No se encontraron roles para los filtros seleccionados."
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
          )}

          {activeTab === "permissions" && (
            <div className="flex-1 flex flex-col">
              <FilterBar
                searchPlaceholder="Buscar permiso o ID..."
                searchValue={permissionSearch}
                onSearchChange={setPermissionSearch}
              />
              <div className="mt-4 flex-1">
                <DataTable
                  columns={permissionColumns}
                  data={data.access.canReadPermissions ? filteredPermissions : []}
                  loading={loading}
                  emptyMessage="No se encontraron permisos para el filtro actual."
                  actions={[]}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <ModalShell open={Boolean(detailRole)} onClose={() => setDetailRole(null)} width="max-w-[960px]">
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--color-text-primary)" }}>
                Detalle del rol
              </h3>
              <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                Permisos asignados y usuarios vinculados al rol.
              </p>
            </div>
          </div>

          {detailRole && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <SettingsDetailField label="Nombre" value={detailRole.name} />
                <SettingsDetailField label="Nivel jerárquico" value={String(detailRole.hierarchyLevel)} />
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
                  style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)" }}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
                    <h4 className="text-[13px]" style={{ color: "var(--color-text-primary)" }}>
                      Permisos asignados
                    </h4>
                  </div>
                  {detailRole.permissions.length === 0 ? (
                    <p className="mt-3 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                      Este rol no tiene permisos asignados.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {detailRole.permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="rounded-xl px-3 py-2"
                          style={{ background: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)" }}
                        >
                          <p className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
                            {sanitizePermissionDescription(permission.description, permission.id)}
                          </p>
                          <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                            {translateModule(permission.module)} · <code className="text-[10px] bg-black/20 px-1 py-0.5 rounded">{permission.id}</code>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)" }}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
                    <h4 className="text-[13px]" style={{ color: "var(--color-text-primary)" }}>
                      Usuarios vinculados
                    </h4>
                  </div>
                  {detailRole.assignments.length === 0 ? (
                    <p className="mt-3 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                      El rol no esta asignado a usuarios del tenant.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {detailRole.assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="rounded-xl px-3 py-2"
                          style={{ background: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)" }}
                        >
                          <p className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
                            {assignment.userLabel}
                          </p>
                          <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
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
              <h3 className="text-[15px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {editingRole ? "Editar rol" : "Nuevo rol"}
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Nombre, nivel jerárquico y permisos asignados.
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg p-1.5 text-[#7A7A7A] hover:text-[#C8C5BF] hover:bg-[#1F1D1A] transition-colors"
              onClick={() => setIsFormOpen(false)}
              aria-label="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          {formError && (
            <SettingsErrorBlock message={formError} onRetry={() => setFormError(null)} />
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#A4A29F]">Nombre del Rol</label>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Ej. Coordinador de Voluntarios"
                className="h-10 w-full rounded-xl px-3 text-[13px] outline-none transition-colors focus:border-[#356C92]"
                style={INPUT_STYLE}
              />
              <SettingsFieldError
                message={!form.name.trim() && formError ? "El nombre es obligatorio." : undefined}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#A4A29F]">Nivel de Jerarquía (0-100)</label>
              <input
                type="number"
                min="0"
                value={form.hierarchyLevel}
                onChange={(event) =>
                  setForm((current) => ({ ...current, hierarchyLevel: event.target.value }))
                }
                placeholder="100"
                className="h-10 w-full rounded-xl px-3 text-[13px] outline-none transition-colors focus:border-[#356C92]"
                style={INPUT_STYLE}
              />
              <SettingsFieldError
                message={
                  !form.hierarchyLevel.trim() && formError
                    ? "El nivel jerárquico es obligatorio."
                    : undefined
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Shield className="h-3.5 w-3.5 text-[#5A5A5A]" />
            <span className="text-[12px] font-medium text-[#7A7A7A]">Permisos por módulo</span>
            <span className="text-[11px] text-[#5A5A5A]">
              — {form.permissionIds.length} seleccionados
            </span>
          </div>

          <div className="max-h-[480px] space-y-3 overflow-y-auto pr-2 scrollbar-thin">
            {permissionGroups.map(([module, permissions]) => {
              const allModuleIds = permissions.map((p) => p.id);
              const allSelected = allModuleIds.every((id) => form.permissionIds.includes(id));
              
              return (
                <details key={module} className="group rounded-xl border border-[#26231F] bg-[#171512] overflow-hidden">
                  <summary className="flex items-center justify-between cursor-pointer p-3.5 bg-[#1F1D1A] group-open:border-b border-[#26231F]">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#100F0D] group-open:rotate-180 transition-transform">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#A4A29F]"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                      <h4 className="text-sm font-semibold text-[#F9F7F3]">Módulo: {translateModule(module)}</h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#100F0D] border border-[#26231F] text-[#A4A29F]">
                        {permissions.filter(p => form.permissionIds.includes(p.id)).length} / {permissions.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setForm((current) => ({
                            ...current,
                            permissionIds: allSelected 
                              ? current.permissionIds.filter((id) => !allModuleIds.includes(id))
                              : Array.from(new Set([...current.permissionIds, ...allModuleIds]))
                          }));
                        }}
                        className="text-xs text-[#356C92] hover:text-[#5BA4D9] font-medium transition-colors border border-[#356C92]/30 px-2.5 py-1 rounded-md bg-[#356C92]/5 hover:bg-[#356C92]/10"
                      >
                        {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                      </button>
                    </div>
                  </summary>
                  <div className="p-3 grid gap-2.5 grid-cols-1 md:grid-cols-2 bg-[#171512]">
                    {permissions.map((permission) => {
                      const isSelected = form.permissionIds.includes(permission.id);
                      return (
                        <label
                          key={permission.id}
                          className="flex items-center gap-3 rounded-lg px-3.5 h-[58px] cursor-pointer transition-all duration-150 hover:bg-[#1F1D1A]"
                          style={{
                            border: `1px solid ${isSelected ? "#356C92" : "#2A2A2A"}`,
                            background: isSelected ? "rgba(53,108,146,0.07)" : "transparent",
                          }}
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 flex-shrink-0 rounded border-[#3A3A3A] text-[#356C92] focus:ring-[#356C92]/40 bg-[#100F0D] accent-[#356C92]"
                            checked={isSelected}
                            onChange={() => togglePermission(permission.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <span
                              className="block text-[13px] font-semibold leading-tight truncate"
                              style={{ color: isSelected ? "#E8E6E1" : "#C8C5BF" }}
                              title={sanitizePermissionDescription(permission.description, permission.id)}
                            >
                              {sanitizePermissionDescription(permission.description, permission.id)}
                            </span>
                            <span className="block text-[12px] mt-0.5 truncate font-mono" style={{ color: "#6B6B6B" }}>
                              {permission.id}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full px-5 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] transition-colors disabled:opacity-50 shadow-sm"
              onClick={() => void submitForm()}
              disabled={mutations.isSaving}
            >
              {mutations.isSaving ? "Guardando..." : editingRole ? "Actualizar rol" : "Crear rol"}
            </button>
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
            <Shield className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--color-text-primary)" }}>
                Eliminar rol
              </h3>
              <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                La eliminacion es fisica y cascada sobre permisos y asignaciones por sede.
              </p>
            </div>
          </div>

          <p className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
            {removeRole
              ? `Se eliminará el rol ${removeRole.name} y ${removeRole.assignmentCount} asignaciones institucionales vinculadas.`
              : "Confirma la eliminación del rol."}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-white bg-[#991b1b] hover:bg-[#7f1d1d] transition-colors disabled:opacity-50"
              onClick={() => void confirmRemoveRole()}
              disabled={mutations.isRemoving}
            >
              {mutations.isRemoving ? "Eliminando..." : "Confirmar"}
            </button>
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
