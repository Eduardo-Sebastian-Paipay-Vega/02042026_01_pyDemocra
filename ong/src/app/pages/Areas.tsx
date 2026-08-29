import { useCallback, useEffect, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import { Layers, PencilLine, Power, Plus } from "lucide-react";
import { PageHeader } from '@/core/components/shared/PageHeader';
import { FilterBar } from '@/core/components/shared/FilterBar';
import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import { Badge } from '@/core/components/ui/badge';
import type { AreaRow, AreaFormInput } from "../services/gobernanza/areas.service";
import {
  listAreas,
  createArea,
  updateArea,
  toggleAreaActive,
} from "../services/gobernanza/areas.service";

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

const EMPTY_FORM: AreaFormInput = { code: "", name: "", description: "" };

const columns: Column<AreaRow>[] = [
  {
    key: "name",
    label: "Área",
    render: (row) => (
      <div className="flex flex-col items-start gap-1">
        <div className="font-medium" style={{ color: "var(--t-text)" }}>{row.name}</div>
        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{row.code}</Badge>
      </div>
    ),
  },
  {
    key: "description",
    label: "Descripción",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.description ?? "—"}
      </span>
    ),
  },
  {
    key: "proyectos",
    label: "Proyectos",
    align: "center",
    render: (row) => (
      <Badge variant="outline" className="text-[11px] font-medium">
        {row.projectCount} {row.projectCount === 1 ? 'proyecto' : 'proyectos'}
      </Badge>
    ),
  },
  {
    key: "status",
    label: "Estado",
    render: (row) => (
      <StatusDot variant={row.active ? "success" : "secondary"}>
        {row.active ? "Activa" : "Inactiva"}
      </StatusDot>
    ),
  },
  {
    key: "createdAt",
    label: "Creada",
    render: (row) => (
      <span className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
        {row.createdAtLabel}
      </span>
    ),
  },
];

type ModalMode = "create" | "edit" | null;

export function Areas() {
  const [rows, setRows] = useState<AreaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<AreaRow | null>(null);
  const [form, setForm] = useState<AreaFormInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAreas(debouncedSearch);
      setRows(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar áreas.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditTarget(null);
    setModalMode("create");
  }

  function openEdit(row: AreaRow) {
    setForm({ code: row.code, name: row.name, description: row.description ?? "" });
    setFormError(null);
    setEditTarget(row);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditTarget(null);
  }

  async function handleToggleActive(row: AreaRow) {
    try {
      await toggleAreaActive(row.id, !row.active);
      toast.success(row.active ? "Área desactivada." : "Área activada.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (modalMode === "create") {
        await createArea(form);
        toast.success("Área creada correctamente.");
      } else if (editTarget) {
        await updateArea(editTarget.id, form);
        toast.success("Área actualizada correctamente.");
      }
      closeModal();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar el área.");
    } finally {
      setSaving(false);
    }
  }

  const tableActions = [
    {
      label: "Editar",
      onClick: openEdit,
    },
    {
      label: (row: AreaRow) => (row.active ? "Desactivar" : "Activar"),
      onClick: handleToggleActive,
      variant: "destructive" as const, // Making deactivate a destructive variant for better UI
    },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Áreas Organizacionales"
          description="Gestiona las áreas de tu organización. Las áreas agrupan proyectos y se aplican a nivel de tenant."
          action={{ label: "Nueva área", onClick: openCreate }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="flex items-start gap-3">
            <Layers className="mt-0.5 h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
              Las áreas son por tenant. Se usan al crear proyectos para clasificarlos. Desactivar
              un área no elimina los proyectos asociados, solo la oculta de los selectores.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <FilterBar
          searchPlaceholder="Buscar por nombre o código..."
          searchValue={search}
          onSearchChange={setSearch}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          emptyMessage="No se encontraron áreas. Crea la primera con el botón de arriba."
          actions={tableActions}
        />
      </motion.div>

      {/* Create / Edit modal */}
      <ModalShell
        open={Boolean(modalMode)}
        onClose={closeModal}
        width="max-w-[520px]"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            {modalMode === "create" ? (
              <Plus className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            ) : (
              <PencilLine className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            )}
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                {modalMode === "create" ? "Nueva área" : "Editar área"}
              </h3>
              {editTarget && (
                <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                  {editTarget.code} — {editTarget.name}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Código *
              </label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="Ej. ADMIN, TEC, OPS"
                maxLength={20}
                required
                disabled={saving}
                className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Nombre *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nombre del área"
                maxLength={120}
                required
                disabled={saving}
                className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descripción opcional del área"
                maxLength={500}
                rows={2}
                disabled={saving}
                className="w-full resize-none rounded-xl px-3 py-2 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
            </div>
          </div>

          {formError && (
            <p className="rounded-xl px-3 py-2 text-[12px]" style={{ color: "var(--t-error)", background: "var(--t-error-bg, var(--t-hover))" }}>
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <OutlineButton type="button" size="sm" onClick={closeModal} disabled={saving}>
              Cancelar
            </OutlineButton>
            <GradientButton type="submit" size="sm" disabled={saving}>
              {saving ? "Guardando..." : modalMode === "create" ? "Crear área" : "Guardar cambios"}
            </GradientButton>
          </div>
        </form>
      </ModalShell>
    </motion.div>
  );
}
