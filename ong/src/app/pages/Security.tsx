import { useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import { Clock3, MonitorCog, ScrollText, ShieldCheck, Smartphone } from "lucide-react";
import { PageHeader } from '@/core/components/shared/PageHeader';
import { FilterBar } from '@/core/components/shared/FilterBar';
import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { useSecurityMutations } from "../modules/settings/hooks/useSecurityMutations";
import { useSecuritySettings } from "../modules/settings/hooks/useSecuritySettings";
import type {
  AuthEventRow,
  DeviceRow,
  SessionRow,
  TerminalRow,
} from "../modules/settings/types";
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

type TerminalFormState = {
  terminalId?: string;
  name: string;
};

function buildTerminalForm(terminal?: TerminalRow | null): TerminalFormState {
  return {
    terminalId: terminal?.id,
    name: terminal?.name ?? "",
  };
}

const sessionColumns: Column<SessionRow>[] = [
  {
    key: "user",
    label: "Usuario",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.userLabel}</div>
        <div className="mt-0.5 text-xs" style={{ color: "var(--t-text-secondary)" }}>
          {row.sessionType} · {row.ip}
        </div>
      </div>
    ),
  },
  {
    key: "origin",
    label: "Origen",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.terminalName}
        <div className="mt-0.5 text-xs" style={{ color: "var(--t-text-secondary)" }}>
          {row.deviceLabel}
        </div>
      </div>
    ),
  },
  {
    key: "status",
    label: "Estado",
    render: (row) => (
      <StatusDot
        variant={
          row.statusKind === "active"
            ? "success"
            : row.statusKind === "expired"
              ? "warning"
              : "destructive"
        }
      >
        {row.statusLabel}
      </StatusDot>
    ),
  },
  {
    key: "created",
    label: "Creada",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.createdAtLabel}
        <div className="mt-0.5 text-xs" style={{ color: "var(--t-text-secondary)" }}>
          Expira {row.expiresAtLabel}
        </div>
      </div>
    ),
  },
];

const deviceColumns: Column<DeviceRow>[] = [
  {
    key: "device",
    label: "Dispositivo",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.deviceFingerprint}</div>
        <div className="mt-0.5 text-xs" style={{ color: "var(--t-text-secondary)" }}>
          {row.userLabel}
        </div>
      </div>
    ),
  },
  {
    key: "trust",
    label: "Confianza",
    render: (row) => (
      <StatusDot variant={row.isTrusted ? "success" : "secondary"}>
        {row.isTrusted ? "Confiable" : "No confiable"}
      </StatusDot>
    ),
  },
  {
    key: "lastSeen",
    label: "Ultima actividad",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.lastSeenAtLabel}
        <div className="mt-0.5 text-xs" style={{ color: "var(--t-text-secondary)" }}>
          {row.lastIp}
        </div>
      </div>
    ),
  },
  {
    key: "sessions",
    label: "Sesiones activas",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.activeSessionCount}
      </span>
    ),
  },
];

const terminalColumns: Column<TerminalRow>[] = [
  {
    key: "name",
    label: "Terminal",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.name}</div>
        <div className="mt-0.5 text-xs" style={{ color: "var(--t-text-secondary)" }}>
          {row.createdAtLabel}
        </div>
      </div>
    ),
  },
  {
    key: "sessions",
    label: "Uso",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.sessionCount} sesiones
        <div className="mt-0.5 text-xs" style={{ color: "var(--t-text-secondary)" }}>
          {row.activeSessionCount} activas
        </div>
      </div>
    ),
  },
];

const authColumns: Column<AuthEventRow>[] = [
  {
    key: "event",
    label: "Evento",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.eventType}</div>
        <div className="mt-0.5 text-xs" style={{ color: "var(--t-text-secondary)" }}>
          {row.userLabel}
        </div>
      </div>
    ),
  },
  {
    key: "result",
    label: "Resultado",
    render: (row) => (
      <StatusDot variant={row.result === "success" ? "success" : "destructive"}>
        {row.resultLabel}
      </StatusDot>
    ),
  },
  {
    key: "origin",
    label: "Origen",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.terminalName}
        <div className="mt-0.5 text-xs" style={{ color: "var(--t-text-secondary)" }}>
          {row.deviceLabel}
        </div>
      </div>
    ),
  },
  {
    key: "date",
    label: "Fecha",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.createdAtLabel}
      </span>
    ),
  },
];

export function Security() {
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionStatus, setSessionStatus] = useState<"all" | "active" | "expired" | "revoked">("all");
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<SessionRow | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<DeviceRow | null>(null);
  const [terminalSearch, setTerminalSearch] = useState("");
  const [editingTerminal, setEditingTerminal] = useState<TerminalRow | null>(null);
  const [terminalForm, setTerminalForm] = useState<TerminalFormState>(buildTerminalForm());
  const [terminalError, setTerminalError] = useState<string | null>(null);
  const [isTerminalFormOpen, setIsTerminalFormOpen] = useState(false);
  const [removeTerminal, setRemoveTerminal] = useState<TerminalRow | null>(null);
  const [authSearch, setAuthSearch] = useState("");
  const [selectedAuthEvent, setSelectedAuthEvent] = useState<AuthEventRow | null>(null);

  const { loading, error, data, refresh } = useSecuritySettings();
  const mutations = useSecurityMutations(refresh);

  const summary = useMemo(
    () => ({
      activeSessions: data.sessions.filter((row) => row.statusKind === "active").length,
      trustedDevices: data.devices.filter((row) => row.isTrusted).length,
      terminals: data.terminals.length,
      authEvents: data.authEvents.length,
    }),
    [data.authEvents, data.devices, data.sessions, data.terminals]
  );

  const filteredSessions = useMemo(() => {
    const normalized = sessionSearch.trim().toLowerCase();

    return data.sessions.filter((row) => {
      if (normalized && !row.searchValue.includes(normalized)) {
        return false;
      }
      if (sessionStatus !== "all" && row.statusKind !== sessionStatus) {
        return false;
      }
      return true;
    });
  }, [data.sessions, sessionSearch, sessionStatus]);

  const filteredDevices = useMemo(() => {
    const normalized = deviceSearch.trim().toLowerCase();
    if (!normalized) {
      return data.devices;
    }

    return data.devices.filter((row) => row.searchValue.includes(normalized));
  }, [data.devices, deviceSearch]);

  const filteredTerminals = useMemo(() => {
    const normalized = terminalSearch.trim().toLowerCase();
    if (!normalized) {
      return data.terminals;
    }

    return data.terminals.filter((row) => row.searchValue.includes(normalized));
  }, [data.terminals, terminalSearch]);

  const filteredAuthEvents = useMemo(() => {
    const normalized = authSearch.trim().toLowerCase();
    if (!normalized) {
      return data.authEvents;
    }

    return data.authEvents.filter((row) => row.searchValue.includes(normalized));
  }, [authSearch, data.authEvents]);

  function openCreateTerminalModal() {
    if (!data.access.canManageTerminals) {
      toast.error("No tienes permisos para crear terminales.");
      return;
    }

    setEditingTerminal(null);
    setTerminalForm(buildTerminalForm());
    setTerminalError(null);
    setIsTerminalFormOpen(true);
  }

  function openEditTerminalModal(terminal: TerminalRow) {
    if (!data.access.canManageTerminals) {
      toast.error("No tienes permisos para editar terminales.");
      return;
    }

    setEditingTerminal(terminal);
    setTerminalForm(buildTerminalForm(terminal));
    setTerminalError(null);
    setIsTerminalFormOpen(true);
  }

  async function submitTerminal() {
    if (!terminalForm.name.trim()) {
      setTerminalError("El nombre del terminal es obligatorio.");
      return;
    }

    try {
      await mutations.saveTerminal({
        terminalId: terminalForm.terminalId,
        name: terminalForm.name.trim(),
      });
      toast.success(terminalForm.terminalId ? "Terminal actualizado." : "Terminal creado.");
      setIsTerminalFormOpen(false);
      setEditingTerminal(null);
      setTerminalForm(buildTerminalForm());
    } catch (saveError) {
      setTerminalError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el terminal."
      );
    }
  }

  async function confirmCloseSession() {
    if (!revokeTarget) {
      return;
    }

    try {
      await mutations.closeSession({
        sessionId: revokeTarget.id,
        reason: revokeReason,
      });
      toast.success("Sesión revocada.");
      setRevokeTarget(null);
      setRevokeReason("");
      setRevokeError(null);
    } catch (closeError) {
      setRevokeError(
        closeError instanceof Error ? closeError.message : "No se pudo cerrar la sesión."
      );
    }
  }

  async function toggleDeviceTrust(row: DeviceRow) {
    try {
      await mutations.updateDeviceTrust({
        deviceId: row.id,
        isTrusted: !row.isTrusted,
      });
      toast.success(
        row.isTrusted
          ? "Dispositivo marcado como no confiable."
          : "Dispositivo marcado como confiable."
      );
    } catch (updateError) {
      toast.error(
        updateError instanceof Error
          ? updateError.message
          : "No se pudo actualizar el dispositivo."
      );
    }
  }

  async function confirmRemoveTerminal() {
    if (!removeTerminal) {
      return;
    }

    try {
      await mutations.removeTerminal(removeTerminal.id);
      toast.success("Terminal eliminado.");
      setRemoveTerminal(null);
    } catch (removeError) {
      toast.error(
        removeError instanceof Error
          ? removeError.message
          : "No se pudo eliminar el terminal."
      );
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Seguridad de sesión"
          description="Monitorea las sesiones activas, dispositivos confiables, terminales y eventos de autenticación de la organización."
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
              allowed={data.access.canReadSessions}
              allowedLabel="Lectura de sesiones"
              deniedLabel="Sin lectura de sesiones"
            />
            <SettingsPermissionBadge
              allowed={data.access.canManageSessions}
              allowedLabel="Cerrar sesiones"
              deniedLabel="Sin cierre de sesiones"
            />
            <SettingsPermissionBadge
              allowed={data.access.canReadDevices}
              allowedLabel="Lectura de dispositivos"
              deniedLabel="Sin lectura de dispositivos"
            />
            <SettingsPermissionBadge
              allowed={data.access.canManageTerminals}
              allowedLabel="Gestión de terminales"
              deniedLabel="Sin gestión de terminales"
            />
            <SettingsPermissionBadge
              allowed={data.access.canReadAuthEvents}
              allowedLabel="Lectura de eventos de autenticación"
              deniedLabel="Sin eventos de autenticación"
            />
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SettingsSummaryField label="Sesiones activas" value={String(summary.activeSessions)} />
          <SettingsSummaryField label="Dispositivos confiables" value={String(summary.trustedDevices)} />
          <SettingsSummaryField label="Terminales" value={String(summary.terminals)} />
          <SettingsSummaryField label="Eventos de autenticación" value={String(summary.authEvents)} />
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp}>
          <SettingsErrorBlock message={error} onRetry={refresh} />
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Clock3 className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <h2 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Sesiones
            </h2>
          </div>

          {!data.access.canReadSessions && !loading ? (
            <SettingsErrorBlock
              message="No tienes permisos para visualizar las sesiones activas. Contacta al administrador."
              onRetry={refresh}
            />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <div className="flex-1 w-full">
                  <FilterBar
                    searchPlaceholder="Buscar por usuario, terminal, dispositivo o IP..."
                    searchValue={sessionSearch}
                    onSearchChange={setSessionSearch}
                  />
                </div>
                <Select
                  value={sessionStatus}
                  onValueChange={(val) =>
                    setSessionStatus(
                      val as "all" | "active" | "expired" | "revoked"
                    )
                  }
                >
                  <SelectTrigger className="w-full sm:w-[140px] bg-[#100F0D] border-[#26231F] text-[#A4A29F] h-9 rounded-xl px-3 text-[12px]">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent className="z-[120] bg-[#171512] border-[#26231F] text-[#F9F7F3]">
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="active">Activas</SelectItem>
                    <SelectItem value="expired">Expiradas</SelectItem>
                    <SelectItem value="revoked">Revocadas</SelectItem>
                  </SelectContent>
                </Select>
                {data.access.canManageSessions && (
                  <button
                    onClick={() => {
                      toast.info("Función de revocación masiva en desarrollo.");
                    }}
                    className="w-full sm:w-auto h-9 px-4 rounded-xl border border-[#ef4444]/20 text-[#ef4444] hover:bg-[#ef4444]/10 text-[12px] font-medium transition-colors whitespace-nowrap"
                  >
                    Cerrar todas
                  </button>
                )}
              </div>
              <div className="mt-4">
                <DataTable
                  columns={sessionColumns}
                  data={filteredSessions}
                  loading={loading}
                  emptyMessage="No se encontraron sesiones para el filtro actual."
                  actions={
                    data.access.canManageSessions
                      ? [
                          { label: "Ver detalle", onClick: (row) => setSelectedSession(row) },
                          {
                            label: "Cerrar sesión",
                            variant: "destructive",
                            onClick: (row) => {
                              if (row.statusKind !== "active") {
                                toast.error("Solo se pueden revocar sesiones activas.");
                                return;
                              }
                              setRevokeTarget(row);
                              setRevokeReason("");
                              setRevokeError(null);
                            },
                          },
                        ]
                      : [{ label: "Ver detalle", onClick: (row) => setSelectedSession(row) }]
                  }
                />
              </div>
            </>
          )}
        </div>
      </motion.div>

      <ModalShell
        open={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
        width="max-w-[920px]"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Detalle de sesión
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Información de la sesión activa o histórica.
              </p>
            </div>
          </div>

          {selectedSession && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SettingsDetailField label="Usuario" value={selectedSession.userLabel} />
              <SettingsDetailField label="Estado" value={selectedSession.statusLabel} />
              <SettingsDetailField label="Tipo" value={selectedSession.sessionType} />
              <SettingsDetailField label="Terminal" value={selectedSession.terminalName} />
              <SettingsDetailField label="Dispositivo" value={selectedSession.deviceLabel} />
              <SettingsDetailField label="IP" value={selectedSession.ip} />
              <SettingsDetailField label="User agent" value={selectedSession.userAgent} />
              <SettingsDetailField label="Creada" value={selectedSession.createdAtLabel} />
              <SettingsDetailField label="Expira" value={selectedSession.expiresAtLabel} />
              <SettingsDetailField label="Revocada" value={selectedSession.revokedAtLabel} />
              <SettingsDetailField label="Motivo" value={selectedSession.revokeReason} />
            </div>
          )}
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(selectedDevice)}
        onClose={() => setSelectedDevice(null)}
        width="max-w-[820px]"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Detalle del dispositivo
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Información del dispositivo registrado.
              </p>
            </div>
          </div>

          {selectedDevice && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SettingsDetailField label="Usuario" value={selectedDevice.userLabel} />
              <SettingsDetailField
                label="Fingerprint"
                value={selectedDevice.deviceFingerprint}
              />
              <SettingsDetailField
                label="Confianza"
                value={selectedDevice.isTrusted ? "Confiable" : "No confiable"}
              />
              <SettingsDetailField label="Ultima IP" value={selectedDevice.lastIp} />
              <SettingsDetailField
                label="Ultimo user agent"
                value={selectedDevice.lastUserAgent}
              />
              <SettingsDetailField
                label="Ultima actividad"
                value={selectedDevice.lastSeenAtLabel}
              />
              <SettingsDetailField
                label="Creado"
                value={selectedDevice.createdAtLabel}
              />
              <SettingsDetailField
                label="Sesiones activas"
                value={String(selectedDevice.activeSessionCount)}
              />
            </div>
          )}
        </div>
      </ModalShell>

      <ModalShell
        open={isTerminalFormOpen}
        onClose={() => setIsTerminalFormOpen(false)}
        width="max-w-[620px]"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                {editingTerminal ? "Editar terminal" : "Nuevo terminal"}
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Registra o actualiza un terminal de acceso del tenant.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[12px]"
              onClick={() => setIsTerminalFormOpen(false)}
            >
              X
            </button>
          </div>

          {terminalError && (
            <SettingsErrorBlock message={terminalError} onRetry={() => setTerminalError(null)} />
          )}

          <div className="space-y-1">
            <input
              value={terminalForm.name}
              onChange={(event) =>
                setTerminalForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Nombre del terminal"
              className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
              style={INPUT_STYLE}
            />
            <SettingsFieldError
              message={!terminalForm.name.trim() && terminalError ? "El nombre es obligatorio." : undefined}
            />
          </div>

          <div className="flex gap-2">
            <GradientButton
              size="sm"
              onClick={() => void submitTerminal()}
              disabled={mutations.isSavingTerminal}
            >
              {mutations.isSavingTerminal ? "Guardando..." : "Guardar"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => setIsTerminalFormOpen(false)}
              disabled={mutations.isSavingTerminal}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(removeTerminal)}
        onClose={() => setRemoveTerminal(null)}
        width="max-w-[560px]"
      >
        <div className="space-y-3 p-4">
          <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
            {removeTerminal
              ? `¿Eliminar el terminal ${removeTerminal.name}? Las sesiones históricas asociadas quedarán sin terminal asignado.`
              : "Confirma la eliminacion del terminal."}
          </p>
          <div className="flex gap-2">
            <GradientButton
              size="sm"
              onClick={() => void confirmRemoveTerminal()}
              disabled={mutations.isRemovingTerminal}
            >
              {mutations.isRemovingTerminal ? "Eliminando..." : "Confirmar"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => setRemoveTerminal(null)}
              disabled={mutations.isRemovingTerminal}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        width="max-w-[620px]"
      >
        <div className="space-y-4 p-4">
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Cerrar sesión
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Cierra la sesión de forma remota e inmediata. El usuario deberá autenticarse nuevamente.
            </p>
          </div>

          {revokeError && (
            <SettingsErrorBlock message={revokeError} onRetry={() => setRevokeError(null)} />
          )}

          <textarea
            value={revokeReason}
            onChange={(event) => setRevokeReason(event.target.value)}
            rows={4}
            placeholder="Motivo de revocacion"
            className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
            style={INPUT_STYLE}
          />
          <SettingsFieldError
            message={!revokeReason.trim() && revokeError ? "El motivo es obligatorio." : undefined}
          />

          <div className="flex gap-2">
            <GradientButton
              size="sm"
              onClick={() => void confirmCloseSession()}
              disabled={mutations.isTerminatingSession}
            >
              {mutations.isTerminatingSession ? "Cerrando..." : "Confirmar"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => setRevokeTarget(null)}
              disabled={mutations.isTerminatingSession}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(selectedAuthEvent)}
        onClose={() => setSelectedAuthEvent(null)}
        width="max-w-[920px]"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Detalle de evento de autenticación
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Información del evento de autenticación registrado.
              </p>
            </div>
          </div>

          {selectedAuthEvent && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SettingsDetailField label="Usuario" value={selectedAuthEvent.userLabel} />
              <SettingsDetailField label="Evento" value={selectedAuthEvent.eventType} />
              <SettingsDetailField label="Resultado" value={selectedAuthEvent.resultLabel} />
              <SettingsDetailField label="Sesión" value={selectedAuthEvent.sessionLabel} />
              <SettingsDetailField label="Terminal" value={selectedAuthEvent.terminalName} />
              <SettingsDetailField label="Dispositivo" value={selectedAuthEvent.deviceLabel} />
              <SettingsDetailField label="IP" value={selectedAuthEvent.ip} />
              <SettingsDetailField label="User agent" value={selectedAuthEvent.userAgent} />
              <SettingsDetailField label="Error code" value={selectedAuthEvent.errorCode} />
              <SettingsDetailField label="Fecha" value={selectedAuthEvent.createdAtLabel} />
            </div>
          )}
        </div>
      </ModalShell>
    </motion.div>
  );
}
