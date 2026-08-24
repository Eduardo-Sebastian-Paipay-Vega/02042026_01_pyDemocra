import { useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import { KeyRound, Shield, UserCog } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { FilterBar } from "../components/shared/FilterBar";
import { DataTable, type Column } from "../components/shared/DataTable";
import { ModalShell } from "@/core/components/ui/modal-shell";
import { GradientButton } from "@/core/components/ui/gradient-button";
import { OutlineButton } from "@/core/components/ui/outline-button";
import { StatusDot } from "@/core/components/ui/status-dot";
import { useSystemUserAssignments } from "../modules/settings/hooks/useSystemUserAssignments";
import { useSystemUsers } from "../modules/settings/hooks/useSystemUsers";
import type {
  SystemUserAssignmentDraft,
  SystemUserProvisionMode,
  SystemUserRow,
} from "../modules/settings/types";
import {
  SettingsDetailField,
  SettingsErrorBlock,
  SettingsFieldError,
  SettingsPermissionBadge,
  SettingsSelectField,
  SettingsSummaryField,
  SettingsTechnicalDetails,
} from "../modules/settings/components/settings-shared";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
} as const as any;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as any },
  },
} as const as any;

const INPUT_STYLE = {
  border: "1px solid var(--t-border)",
  background: "var(--t-input-bg)",
  color: "var(--t-text-secondary)",
} as const;

type UserAccessForm = {
  userId: string;
  assignments: SystemUserAssignmentDraft[];
};

type ProvisionForm = {
  email: string;
  fullName: string;
  tipoDocumento: string;
  numeroDocumento: string;
  genero: string;
  volunteerId: string;
  mode: SystemUserProvisionMode;
  temporaryPassword: string;
};

function buildUserAccessForm(row?: SystemUserRow | null): UserAccessForm {
  return {
    userId: row?.id ?? "",
    assignments:
      row?.roleAssignments.length && row.roleAssignments.length > 0
        ? row.roleAssignments.map((assignment) => ({
            roleId: assignment.roleId,
            sedeId: assignment.sedeId,
          }))
        : [{ roleId: "", sedeId: "" }],
  };
}

function buildProvisionForm(): ProvisionForm {
  return {
    email: "",
    fullName: "",
    tipoDocumento: "",
    numeroDocumento: "",
    genero: "",
    volunteerId: "",
    mode: "invite",
    temporaryPassword: "",
  };
}

function resolveAccessVariant(row: SystemUserRow) {
  if (row.isBlocked) {
    return "warning" as const;
  }
  if (row.isSystemUser) {
    return "success" as const;
  }
  return "secondary" as const;
}

const columns: Column<SystemUserRow>[] = [
  {
    key: "user",
    label: "Usuario",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.fullName}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.documentLabel}
        </div>
      </div>
    ),
  },
  {
    key: "access",
    label: "Acceso",
    render: (row) => (
      <div className="space-y-1">
        <StatusDot variant={resolveAccessVariant(row)}>{row.accessStatusLabel}</StatusDot>
        <div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.isBlocked ? "Perfil bloqueado" : row.pinStatusLabel}
        </div>
      </div>
    ),
  },
  {
    key: "roles",
    label: "Roles y sedes",
    render: (row) => (
      <div>
        <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
          {row.roleSummary}
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.sedeSummary}
        </div>
      </div>
    ),
  },
  {
    key: "sessions",
    label: "Sesiones",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.totalSessionCount === null
          ? "Sin permiso"
          : `${row.activeSessionCount ?? 0} activas / ${row.totalSessionCount} total`}
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.lastSessionAtLabel}
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

export function SystemUsers() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled" | "blocked">(
    "all"
  );
  const [detailUser, setDetailUser] = useState<SystemUserRow | null>(null);
  const [editingUser, setEditingUser] = useState<SystemUserRow | null>(null);
  const [form, setForm] = useState<UserAccessForm>(buildUserAccessForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<SystemUserRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [provisionForm, setProvisionForm] = useState<ProvisionForm>(buildProvisionForm());
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [sessionRevokeTarget, setSessionRevokeTarget] = useState<SystemUserRow | null>(null);
  const [sessionRevokeReason, setSessionRevokeReason] = useState("");
  const [sessionRevokeError, setSessionRevokeError] = useState<string | null>(null);

  const { loading, error, data, refresh } = useSystemUsers();
  const mutations = useSystemUserAssignments(refresh);

  const summary = useMemo(
    () => ({
      total: data.rows.length,
      enabled: data.rows.filter((row) => row.isSystemUser).length,
      blocked: data.rows.filter((row) => row.isBlocked).length,
      activeSessions: data.rows.reduce(
        (total, row) => total + (row.activeSessionCount ?? 0),
        0
      ),
    }),
    [data.rows]
  );

  const filteredRows = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();

    return data.rows.filter((row) => {
      if (normalized && !row.searchValue.includes(normalized)) {
        return false;
      }

      if (statusFilter === "enabled" && !row.isSystemUser) {
        return false;
      }
      if (statusFilter === "disabled" && row.isSystemUser) {
        return false;
      }
      if (statusFilter === "blocked" && !row.isBlocked) {
        return false;
      }

      return true;
    });
  }, [data.rows, searchValue, statusFilter]);

  const filterOptions = useMemo(
    () => [
      { label: "Todos", value: "all", active: statusFilter === "all" },
      { label: "Con acceso", value: "enabled", active: statusFilter === "enabled" },
      { label: "Sin acceso", value: "disabled", active: statusFilter === "disabled" },
      { label: "Bloqueados", value: "blocked", active: statusFilter === "blocked" },
    ],
    [statusFilter]
  );

  function openCreateModal() {
    if (!data.access.canManageUserAssignments) {
      toast.error("No tienes permisos para habilitar accesos institucionales.");
      return;
    }

    setEditingUser(null);
    setForm(buildUserAccessForm());
    setFormError(null);
    setIsFormOpen(true);
  }

  function openProvisionModal() {
    if (!data.access.canManageUsers) {
      toast.error(
        "No tienes permisos para crear o invitar usuarios. El backend exige `settings.users.manage` o tenant admin."
      );
      return;
    }

    setProvisionForm(buildProvisionForm());
    setProvisionError(null);
    setIsProvisionOpen(true);
  }

  function openManageModal(row: SystemUserRow) {
    if (!data.access.canManageUserAssignments) {
      toast.error("No tienes permisos para editar accesos institucionales.");
      return;
    }

    setEditingUser(row);
    setForm(buildUserAccessForm(row));
    setFormError(null);
    setIsFormOpen(true);
  }

  function openRevokeSessionsModal(row: SystemUserRow) {
    if (!data.access.canManageSessions) {
      toast.error(
        "No tienes permisos para revocar sesiones. El Core exige `settings.sessions.terminate` o tenant admin."
      );
      return;
    }
    if ((row.activeSessionCount ?? 0) <= 0) {
      toast.error("El perfil seleccionado no tiene sesiones activas visibles.");
      return;
    }

    setSessionRevokeTarget(row);
    setSessionRevokeReason("");
    setSessionRevokeError(null);
  }

  function updateAssignment(index: number, patch: Partial<SystemUserAssignmentDraft>) {
    setForm((current) => ({
      ...current,
      assignments: current.assignments.map((assignment, assignmentIndex) =>
        assignmentIndex === index ? { ...assignment, ...patch } : assignment
      ),
    }));
  }

  function addAssignmentRow() {
    setForm((current) => ({
      ...current,
      assignments: current.assignments.concat({ roleId: "", sedeId: "" }),
    }));
  }

  function removeAssignmentRow(index: number) {
    setForm((current) => ({
      ...current,
      assignments:
        current.assignments.length === 1
          ? [{ roleId: "", sedeId: "" }]
          : current.assignments.filter((_, assignmentIndex) => assignmentIndex !== index),
    }));
  }

  async function submitForm() {
    try {
      await mutations.save(form);
      toast.success(
        editingUser?.isSystemUser
          ? "Accesos institucionales actualizados."
          : "Acceso institucional habilitado."
      );
      setIsFormOpen(false);
      setEditingUser(null);
      setForm(buildUserAccessForm());
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudieron guardar los accesos institucionales."
      );
    }
  }

  async function confirmRevoke() {
    if (!revokeTarget) {
      return;
    }

    try {
      await mutations.revoke(revokeTarget.id);
      toast.success("Accesos institucionales revocados.");
      setRevokeTarget(null);
    } catch (revokeError) {
      toast.error(
        revokeError instanceof Error
          ? revokeError.message
          : "No se pudieron revocar los accesos institucionales."
      );
    }
  }

  async function submitProvision() {
    if (!provisionForm.email.trim()) {
      setProvisionError("El correo es obligatorio.");
      return;
    }
    if (
      provisionForm.mode === "create" &&
      provisionForm.temporaryPassword.trim().length < 8
    ) {
      setProvisionError(
        "La contrasena temporal debe tener al menos 8 caracteres en modo create."
      );
      return;
    }

    try {
      const result = await mutations.provision({
        email: provisionForm.email.trim(),
        fullName: provisionForm.fullName.trim() || null,
        tipoDocumento: provisionForm.tipoDocumento.trim() || null,
        numeroDocumento: provisionForm.numeroDocumento.trim() || null,
        genero: provisionForm.genero.trim() || null,
        volunteerId: provisionForm.volunteerId || null,
        mode: provisionForm.mode,
        temporaryPassword:
          provisionForm.mode === "create"
            ? provisionForm.temporaryPassword.trim()
            : null,
      });

      if (!result) {
        return;
      }

      toast.success(
        result.existingUser
          ? "Credencial existente sincronizada."
          : result.invited
            ? "Invitacion enviada."
            : "Usuario creado."
      );
      setIsProvisionOpen(false);
      setProvisionForm(buildProvisionForm());
      setProvisionError(null);
    } catch (error) {
      setProvisionError(
        error instanceof Error
          ? error.message
          : "No se pudo provisionar la credencial."
      );
    }
  }

  async function confirmRevokeSessions() {
    if (!sessionRevokeTarget) {
      return;
    }
    if (!sessionRevokeReason.trim()) {
      setSessionRevokeError("Debes registrar un motivo de revocacion.");
      return;
    }

    try {
      const result = await mutations.revokeSessions({
        userId: sessionRevokeTarget.id,
        reason: sessionRevokeReason.trim(),
      });

      if (!result) {
        return;
      }

      toast.success(
        result.revokedCount === 1
          ? "1 sesion revocada."
          : `${result.revokedCount} sesiones revocadas.`
      );
      if (result.authRevocationWarning) {
        toast(result.authRevocationWarning);
      }
      setSessionRevokeTarget(null);
      setSessionRevokeReason("");
      setSessionRevokeError(null);
    } catch (error) {
      setSessionRevokeError(
        error instanceof Error
          ? error.message
          : "No se pudieron revocar las sesiones del usuario."
      );
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Usuarios del sistema"
          description="Gestiona las personas con acceso institucional, sus estados y sus sesiones visibles."
          action={{ label: "Actualizar", onClick: refresh }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <SettingsPermissionBadge
              allowed={data.access.canReadUsers}
              allowedLabel="Lectura de perfiles"
              deniedLabel="Sin lectura de perfiles"
            />
            <SettingsPermissionBadge
              allowed={data.access.canManageUserAssignments}
              allowedLabel="Gestion de accesos"
              deniedLabel="Sin gestion de accesos"
            />
            <SettingsPermissionBadge
              allowed={data.access.canManageUsers}
              allowedLabel="Provision de credenciales"
              deniedLabel="Sin provision de credenciales"
            />
            <SettingsPermissionBadge
              allowed={data.access.canReadSessions}
              allowedLabel="Resumen de sesiones"
              deniedLabel="Sin resumen de sesiones"
            />
            <SettingsPermissionBadge
              allowed={data.access.canManageSessions}
              allowedLabel="Revocacion de sesiones"
              deniedLabel="Sin revocacion de sesiones"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.access.canManageUsers && (
              <GradientButton size="sm" onClick={openProvisionModal}>
                Crear o invitar usuario
              </GradientButton>
            )}
            {data.access.canManageUserAssignments && (
              <OutlineButton size="sm" onClick={openCreateModal}>
                Habilitar acceso
              </OutlineButton>
            )}
          </div>
          <SettingsTechnicalDetails
            details={[
              "Gestiona perfiles reales del tenant desde public.profiles y su acceso institucional mediante public.user_roles_sedes. La creacion o invitacion de usuarios se resuelve por backend seguro y el resumen de sesiones depende de `settings.sessions.read`.",
              ...data.warnings,
              "`settings.users.manage` habilita la Edge Function `admin-provision-user`. `settings.sessions.read` habilita el resumen visible de sesiones y `settings.sessions.terminate` permite la revocacion masiva por usuario.",
              ...data.unsupportedFlows,
            ]}
          />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SettingsSummaryField label="Perfiles del tenant" value={String(summary.total)} />
          <SettingsSummaryField label="Con acceso" value={String(summary.enabled)} />
          <SettingsSummaryField label="Bloqueados" value={String(summary.blocked)} />
          <SettingsSummaryField
            label="Sesiones activas visibles"
            value={data.access.canReadSessions ? String(summary.activeSessions) : "-"}
          />
        </div>
      </motion.div>

      {(error || !data.access.canReadUsers) && (
        <motion.div variants={fadeUp}>
          <SettingsErrorBlock
            message={
              error ??
              "La lectura de usuarios requiere `settings.users.read`, `settings.users.manage` o compatibilidad legacy `iam.user_roles.manage` / tenant admin."
            }
            onRetry={refresh}
          />
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <FilterBar
          searchPlaceholder="Buscar por nombre, documento, rol o sede..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={filterOptions}
          onFilterClick={(value) =>
            setStatusFilter(value as "all" | "enabled" | "disabled" | "blocked")
          }
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <DataTable
          columns={columns}
          data={data.access.canReadUsers ? filteredRows : []}
          loading={loading}
          emptyMessage="No se encontraron perfiles para la configuracion actual."
          actions={
            [
              { label: "Ver detalle", onClick: (row) => setDetailUser(row) },
              ...(data.access.canManageUserAssignments
                ? [
                    { label: "Gestionar accesos", onClick: (row) => openManageModal(row) },
                    {
                      label: "Revocar accesos",
                      variant: "destructive" as const,
                      onClick: (row: SystemUserRow) => {
                        if (!row.isSystemUser) {
                          toast.error("El perfil seleccionado no tiene accesos institucionales.");
                          return;
                        }
                        setRevokeTarget(row);
                      },
                    },
                  ]
                : []),
              ...(data.access.canManageSessions
                ? [
                    {
                      label: "Revocar sesiones",
                      onClick: (row: SystemUserRow) => openRevokeSessionsModal(row),
                    },
                  ]
                : []),
            ]
          }
        />
      </motion.div>

      <ModalShell open={Boolean(detailUser)} onClose={() => setDetailUser(null)} width="max-w-[920px]">
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Detalle del perfil
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                public.profiles + public.user_roles_sedes
              </p>
            </div>
          </div>

          {detailUser && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <SettingsDetailField label="Nombre" value={detailUser.fullName} />
                <SettingsDetailField label="Documento" value={detailUser.documentLabel} />
                <SettingsDetailField label="Genero" value={detailUser.genero} />
                <SettingsDetailField label="Estado" value={detailUser.accessStatusLabel} />
                <SettingsDetailField label="PIN" value={detailUser.pinStatusLabel} />
                <SettingsDetailField
                  label="Intentos fallidos PIN"
                  value={String(detailUser.pinFailedAttempts)}
                />
                <SettingsDetailField
                  label="Bloqueado hasta"
                  value={detailUser.pinBlockedUntilLabel}
                />
                <SettingsDetailField
                  label="Riesgo bloqueado hasta"
                  value={detailUser.riskBlockedUntilLabel}
                />
                <SettingsDetailField label="Ultima sesion" value={detailUser.lastSessionAtLabel} />
                <SettingsDetailField label="Actualizado" value={detailUser.updatedAtLabel} />
              </div>

              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                  <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                    Asignaciones institucionales
                  </h4>
                </div>
                {detailUser.roleAssignments.length === 0 ? (
                  <p className="mt-3 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                    El perfil aun no tiene acceso institucional.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {detailUser.roleAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="rounded-xl px-3 py-2"
                        style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
                      >
                        <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                          {assignment.roleName}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                          {assignment.sedeName} Â· {assignment.createdAtLabel}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ModalShell>

      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} width="max-w-[820px]">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                {editingUser?.isSystemUser
                  ? "Editar accesos institucionales"
                  : "Habilitar acceso institucional"}
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                La operacion escribe filas reales en public.user_roles_sedes. La provision de `auth.users` se resuelve por separado via la Edge Function `admin-provision-user`.
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

          <div className="space-y-1">
            <SettingsSelectField
              value={form.userId}
              onChange={(value) => setForm((current) => ({ ...current, userId: value }))}
              options={
                data.profileOptions.length
                  ? [{ value: "", label: "Selecciona un perfil" }, ...data.profileOptions]
                  : [{ value: "", label: "Sin perfiles disponibles" }]
              }
              disabled={Boolean(editingUser)}
            />
            <SettingsFieldError
              message={!form.userId && formError ? "Debes seleccionar un perfil." : undefined}
            />
          </div>

          <div className="space-y-3">
            {form.assignments.map((assignment, index) => (
              <div key={`${index}-${assignment.roleId}-${assignment.sedeId}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-1">
                  <SettingsSelectField
                    value={assignment.roleId}
                    onChange={(value) => updateAssignment(index, { roleId: value })}
                    options={
                      data.roleOptions.length
                        ? [{ value: "", label: "Selecciona un rol" }, ...data.roleOptions]
                        : [{ value: "", label: "Sin roles disponibles" }]
                    }
                  />
                  <SettingsFieldError
                    message={!assignment.roleId && formError ? "El rol es obligatorio." : undefined}
                  />
                </div>
                <div className="space-y-1">
                  <SettingsSelectField
                    value={assignment.sedeId}
                    onChange={(value) => updateAssignment(index, { sedeId: value })}
                    options={
                      data.sedeOptions.length
                        ? [{ value: "", label: "Selecciona una sede" }, ...data.sedeOptions]
                        : [{ value: "", label: "Sin sedes disponibles" }]
                    }
                  />
                  <SettingsFieldError
                    message={!assignment.sedeId && formError ? "La sede es obligatoria." : undefined}
                  />
                </div>
                <OutlineButton size="sm" onClick={() => removeAssignmentRow(index)}>
                  Quitar
                </OutlineButton>
              </div>
            ))}

            <div className="flex gap-2">
              <OutlineButton size="sm" onClick={addAssignmentRow}>
                Agregar fila
              </OutlineButton>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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

      <ModalShell
        open={isProvisionOpen}
        onClose={() => setIsProvisionOpen(false)}
        width="max-w-[820px]"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Crear o invitar usuario
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Crea un acceso seguro o envia una invitacion para que la persona pueda ingresar a la plataforma.
              </p>
              <SettingsTechnicalDetails details="La operacion usa la Edge Function `admin-provision-user` para crear o invitar `auth.users`, sincronizar `public.profiles` y vincular opcionalmente `ong.voluntarios.iam_user_id`. Esta accion no se ejecuta desde frontend directo y exige `settings.users.manage` o tenant admin." />
            </div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[12px]"
              onClick={() => setIsProvisionOpen(false)}
            >
              X
            </button>
          </div>

          {provisionError && (
            <SettingsErrorBlock
              message={provisionError}
              onRetry={() => setProvisionError(null)}
            />
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Modo
              </label>
              <SettingsSelectField
                value={provisionForm.mode}
                onChange={(value) =>
                  setProvisionForm((current) => ({
                    ...current,
                    mode: value as SystemUserProvisionMode,
                  }))
                }
                options={[
                  { value: "invite", label: "Invitar por correo" },
                  { value: "create", label: "Crear con contrasena temporal" },
                ]}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Voluntario a vincular
              </label>
              <SettingsSelectField
                value={provisionForm.volunteerId}
                onChange={(value) =>
                  setProvisionForm((current) => ({ ...current, volunteerId: value }))
                }
                options={
                  data.volunteerOptions.length
                    ? [{ value: "", label: "Sin vincular" }, ...data.volunteerOptions]
                    : [{ value: "", label: "Sin voluntarios disponibles" }]
                }
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <input
                value={provisionForm.email}
                onChange={(event) =>
                  setProvisionForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="Correo del usuario"
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
              <SettingsFieldError
                message={!provisionForm.email.trim() && provisionError ? "El correo es obligatorio." : undefined}
              />
            </div>
            <div className="space-y-1">
              <input
                value={provisionForm.fullName}
                onChange={(event) =>
                  setProvisionForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Nombre completo (opcional)"
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={provisionForm.tipoDocumento}
              onChange={(event) =>
                setProvisionForm((current) => ({
                  ...current,
                  tipoDocumento: event.target.value,
                }))
              }
              placeholder="Tipo documento"
              className="h-9 rounded-xl px-3 text-[12px] outline-none"
              style={INPUT_STYLE}
            />
            <input
              value={provisionForm.numeroDocumento}
              onChange={(event) =>
                setProvisionForm((current) => ({
                  ...current,
                  numeroDocumento: event.target.value,
                }))
              }
              placeholder="Numero documento"
              className="h-9 rounded-xl px-3 text-[12px] outline-none"
              style={INPUT_STYLE}
            />
            <input
              value={provisionForm.genero}
              onChange={(event) =>
                setProvisionForm((current) => ({
                  ...current,
                  genero: event.target.value,
                }))
              }
              placeholder="Genero"
              className="h-9 rounded-xl px-3 text-[12px] outline-none"
              style={INPUT_STYLE}
            />
          </div>

          {provisionForm.mode === "create" && (
            <div className="space-y-1">
              <input
                type="password"
                value={provisionForm.temporaryPassword}
                onChange={(event) =>
                  setProvisionForm((current) => ({
                    ...current,
                    temporaryPassword: event.target.value,
                  }))
                }
                placeholder="Contrasena temporal"
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
              <SettingsFieldError
                message={
                  provisionForm.temporaryPassword.trim().length < 8 && provisionError
                    ? "La contrasena temporal debe tener al menos 8 caracteres."
                    : undefined
                }
              />
            </div>
          )}

          <div className="flex items-center gap-2 py-2 border-t border-b border-neutral-200/80 dark:border-zinc-800/80 my-1">
            <input
              type="checkbox"
              id="sendVerificationEmail"
              defaultChecked={true}
              className="h-4 w-4 rounded border-zinc-700 bg-neutral-100 dark:bg-zinc-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="sendVerificationEmail" className="text-[12px] font-medium text-neutral-700 dark:text-zinc-300 cursor-pointer select-none">
              âœ‰ï¸ Enviar correo automÃ¡tico de bienvenida y verificaciÃ³n de cuenta (vÃ­a Resend API)
            </label>
          </div>


          <div className="flex flex-wrap gap-2">
            <GradientButton
              size="sm"
              onClick={() => void submitProvision()}
              disabled={mutations.isProvisioning}
            >
              {mutations.isProvisioning ? "Provisionando..." : "Confirmar"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => setIsProvisionOpen(false)}
              disabled={mutations.isProvisioning}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        width="max-w-[560px]"
      >
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Revocar accesos institucionales
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Esta accion elimina filas reales de public.user_roles_sedes.
              </p>
            </div>
          </div>

          <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
            {revokeTarget
              ? `Se revocaran todos los accesos institucionales de ${revokeTarget.fullName}.`
              : "Confirma la revocacion del acceso institucional."}
          </p>

          <div className="flex gap-2">
            <GradientButton
              size="sm"
              onClick={() => void confirmRevoke()}
              disabled={mutations.isRevoking}
            >
              {mutations.isRevoking ? "Revocando..." : "Confirmar"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => setRevokeTarget(null)}
              disabled={mutations.isRevoking}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(sessionRevokeTarget)}
        onClose={() => setSessionRevokeTarget(null)}
        width="max-w-[620px]"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Revocar sesiones del usuario
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                La operacion usa la Edge Function `admin-revoke-user-sessions`, que revoca
                `public.sessions` por `public.fn_remote_revoke_app_session`. La invalidacion
                global de refresh tokens de Supabase Auth sigue condicionada a que el backend
                disponga del JWT objetivo. Esta accion exige `settings.sessions.terminate` o tenant admin.
              </p>
            </div>
          </div>

          {sessionRevokeError && (
            <SettingsErrorBlock
              message={sessionRevokeError}
              onRetry={() => setSessionRevokeError(null)}
            />
          )}

          <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
            {sessionRevokeTarget
              ? `Se revocaran las sesiones activas visibles de ${sessionRevokeTarget.fullName}.`
              : "Confirma la revocacion de sesiones."}
          </p>

          <textarea
            value={sessionRevokeReason}
            onChange={(event) => setSessionRevokeReason(event.target.value)}
            rows={4}
            placeholder="Motivo de revocacion"
            className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
            style={INPUT_STYLE}
          />
          <SettingsFieldError
            message={
              !sessionRevokeReason.trim() && sessionRevokeError
                ? "El motivo es obligatorio."
                : undefined
            }
          />

          <div className="flex gap-2">
            <GradientButton
              size="sm"
              onClick={() => void confirmRevokeSessions()}
              disabled={mutations.isRevokingSessions}
            >
              {mutations.isRevokingSessions ? "Revocando..." : "Confirmar"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => setSessionRevokeTarget(null)}
              disabled={mutations.isRevokingSessions}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}

