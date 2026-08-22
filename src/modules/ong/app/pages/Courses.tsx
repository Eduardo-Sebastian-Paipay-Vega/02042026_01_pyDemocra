import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import { BookOpen, CheckCircle, GraduationCap, Users, X } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { FilterBar } from "../components/shared/FilterBar";
import { DataTable, type Column } from "../components/shared/DataTable";
import { ModalShell } from "@/core/components/ui/modal-shell";
import { GradientButton } from "@/core/components/ui/gradient-button";
import { OutlineButton } from "@/core/components/ui/outline-button";
import { StatusDot } from "@/core/components/ui/status-dot";
import {
  createCurso,
  listCursos,
  listInscripciones,
  toggleCursoActivo,
  updateCurso,
  updateEstadoInscripcion,
  type CursoRow,
  type CursoUpdateInput,
  type InscripcionRow,
} from "../services/academico/cursos.service";

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as any } },
};

const INPUT_STYLE = {
  border: "1px solid var(--t-border)",
  background: "var(--t-input-bg)",
  color: "var(--t-text-secondary)",
} as const;

const ESTADO_LABELS: Record<InscripcionRow["estado"], string> = {
  inscrito: "Inscrito",
  aprobado: "Aprobado",
  reprobado: "Reprobado",
};

const ESTADO_VARIANT: Record<InscripcionRow["estado"], "success" | "destructive" | "secondary"> = {
  inscrito: "secondary",
  aprobado: "success",
  reprobado: "destructive",
};

type CursoForm = {
  id?: string;
  nombre: string;
  descripcion: string;
  horasCertificacion: string;
  activo: boolean;
};

function buildForm(curso?: CursoRow | null): CursoForm {
  return {
    id: curso?.id,
    nombre: curso?.nombre ?? "",
    descripcion: curso?.descripcion ?? "",
    horasCertificacion: curso?.horasCertificacion != null ? String(curso.horasCertificacion) : "",
    activo: curso?.activo ?? true,
  };
}

const cursoColumns: Column<CursoRow>[] = [
  {
    key: "curso",
    label: "Curso",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.nombre}</div>
        {row.descripcion && (
          <div className="mt-0.5 text-[11px] line-clamp-1" style={{ color: "var(--t-text-dim)" }}>
            {row.descripcion}
          </div>
        )}
      </div>
    ),
  },
  {
    key: "horas",
    label: "Horas",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.horasCertificacion != null ? `${row.horasCertificacion}h` : "â€”"}
      </span>
    ),
  },
  {
    key: "inscripciones",
    label: "Inscritos",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.inscripciones}
      </span>
    ),
  },
  {
    key: "estado",
    label: "Estado",
    render: (row) => (
      <StatusDot variant={row.activo ? "success" : "secondary"}>
        {row.activo ? "Activo" : "Inactivo"}
      </StatusDot>
    ),
  },
  {
    key: "creado",
    label: "Creado",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.creadoEn}
      </span>
    ),
  },
];

const inscripcionColumns: Column<InscripcionRow>[] = [
  {
    key: "voluntario",
    label: "Voluntario",
    render: (row) => (
      <span className="text-[13px]" style={{ color: "var(--t-text)" }}>
        {row.voluntarioNombre}
      </span>
    ),
  },
  {
    key: "estado",
    label: "Estado",
    render: (row) => (
      <StatusDot variant={ESTADO_VARIANT[row.estado]}>
        {ESTADO_LABELS[row.estado]}
      </StatusDot>
    ),
  },
  {
    key: "certificado",
    label: "Certificado",
    render: (row) => (
      row.certificadoUrl ? (
        <a
          href={row.certificadoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] underline"
          style={{ color: "var(--t-text-secondary)" }}
        >
          Ver
        </a>
      ) : (
        <span className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>â€”</span>
      )
    ),
  },
  {
    key: "fecha",
    label: "Inscrito el",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.creadoEn}
      </span>
    ),
  },
];

export function Courses() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursos, setCursos] = useState<CursoRow[]>([]);
  const [totales, setTotales] = useState({ totalInscripciones: 0, totalCertificados: 0, activos: 0 });
  const [search, setSearch] = useState("");
  const [filterActivo, setFilterActivo] = useState<"all" | "activos" | "inactivos">("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<CursoRow | null>(null);
  const [form, setForm] = useState<CursoForm>(buildForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [inscripcionesOpen, setInscripcionesOpen] = useState(false);
  const [inscripcionesCurso, setInscripcionesCurso] = useState<CursoRow | null>(null);
  const [inscripciones, setInscripciones] = useState<InscripcionRow[]>([]);
  const [inscripcionesLoading, setInscripcionesLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCursos();
      setCursos(data.cursos);
      setTotales({
        totalInscripciones: data.totalInscripciones,
        totalCertificados: data.totalCertificados,
        activos: data.activos,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los cursos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredCursos = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return cursos.filter((row) => {
      if (normalized && !row.nombre.toLowerCase().includes(normalized)) return false;
      if (filterActivo === "activos" && !row.activo) return false;
      if (filterActivo === "inactivos" && row.activo) return false;
      return true;
    });
  }, [cursos, search, filterActivo]);

  const filterOptions = useMemo(() => [
    { label: "Todos", value: "all", active: filterActivo === "all" },
    { label: "Activos", value: "activos", active: filterActivo === "activos" },
    { label: "Inactivos", value: "inactivos", active: filterActivo === "inactivos" },
  ], [filterActivo]);

  function openCreate() {
    setEditingCurso(null);
    setForm(buildForm());
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(curso: CursoRow) {
    setEditingCurso(curso);
    setForm(buildForm(curso));
    setFormError(null);
    setFormOpen(true);
  }

  async function submitForm() {
    if (!form.nombre.trim()) {
      setFormError("El nombre del curso es obligatorio.");
      return;
    }

    const horas = form.horasCertificacion.trim()
      ? Number.parseInt(form.horasCertificacion, 10)
      : null;

    if (form.horasCertificacion.trim() && (Number.isNaN(horas!) || horas! < 0)) {
      setFormError("Las horas deben ser un nÃºmero positivo.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload: CursoUpdateInput = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        horasCertificacion: horas,
        activo: form.activo,
      };

      if (form.id) {
        await updateCurso(form.id, payload);
        toast.success("Curso actualizado.");
      } else {
        await createCurso(payload);
        toast.success("Curso creado.");
      }

      setFormOpen(false);
      void load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo guardar el curso.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(curso: CursoRow) {
    try {
      await toggleCursoActivo(curso.id, !curso.activo);
      toast.success(curso.activo ? "Curso desactivado." : "Curso activado.");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cambiar el estado.");
    }
  }

  async function openInscripciones(curso: CursoRow) {
    setInscripcionesCurso(curso);
    setInscripciones([]);
    setInscripcionesOpen(true);
    setInscripcionesLoading(true);
    try {
      const data = await listInscripciones(curso.id);
      setInscripciones(data);
    } catch {
      setInscripciones([]);
    } finally {
      setInscripcionesLoading(false);
    }
  }

  async function handleCambiarEstado(insc: InscripcionRow, estado: InscripcionRow["estado"]) {
    try {
      await updateEstadoInscripcion(insc.id, estado);
      toast.success("Estado actualizado.");
      if (inscripcionesCurso) void openInscripciones(inscripcionesCurso);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar.");
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Cursos y certificados"
          description="Administra capacitaciones del tenant desde academico.cursos. Inscripciones y certificados vinculados a voluntarios."
          action={{ label: "Nuevo curso", onClick: openCreate }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total cursos", value: String(cursos.length), icon: BookOpen },
            { label: "Cursos activos", value: String(totales.activos), icon: CheckCircle },
            { label: "Inscripciones", value: String(totales.totalInscripciones), icon: Users },
            { label: "Certificados", value: String(totales.totalCertificados), icon: GraduationCap },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--t-hover)" }}
              >
                <Icon className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
              </div>
              <div>
                <p className="text-[18px] font-semibold" style={{ color: "var(--t-text)" }}>{value}</p>
                <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp}>
          <div
            className="rounded-2xl px-4 py-3 text-[12px]"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", color: "var(--t-text-dim)" }}
          >
            {error}
            <button
              className="ml-3 underline"
              onClick={() => void load()}
              style={{ color: "var(--t-text-secondary)" }}
            >
              Reintentar
            </button>
          </div>
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <FilterBar
            searchPlaceholder="Buscar por nombre..."
            searchValue={search}
            onSearchChange={setSearch}
            filters={filterOptions}
            onFilterClick={(v) => setFilterActivo(v as "all" | "activos" | "inactivos")}
          />

          <div className="mt-4">
            <DataTable
              columns={cursoColumns}
              data={filteredCursos}
              loading={loading}
              emptyMessage="No se encontraron cursos."
              actions={[
                { label: "Ver inscritos", onClick: (row) => void openInscripciones(row) },
                { label: "Editar", onClick: (row) => openEdit(row) },
                {
                  label: (row) => row.activo ? "Desactivar" : "Activar",
                  onClick: (row) => void handleToggle(row),
                },
              ]}
            />
          </div>
        </div>
      </motion.div>

      {/* Modal crear/editar */}
      <ModalShell open={formOpen} onClose={() => setFormOpen(false)} width="max-w-[600px]">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                {editingCurso ? "Editar curso" : "Nuevo curso"}
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Los datos se guardan en academico.cursos del tenant.
              </p>
            </div>
            <button type="button" onClick={() => setFormOpen(false)}>
              <X className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            </button>
          </div>

          {formError && (
            <p
              className="rounded-xl px-3 py-2 text-[12px]"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.15)",
                color: "#f87171",
              }}
            >
              {formError}
            </p>
          )}

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Nombre del curso *
              </label>
              <input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Primeros Auxilios"
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                DescripciÃ³n
              </label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="DescripciÃ³n breve del curso..."
                rows={3}
                className="w-full resize-none rounded-xl px-3 py-2 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Horas de certificaciÃ³n
              </label>
              <input
                type="number"
                min={0}
                value={form.horasCertificacion}
                onChange={(e) => setForm((f) => ({ ...f, horasCertificacion: e.target.value }))}
                placeholder="Ej: 20"
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
            </div>

            {editingCurso && (
              <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                />
                Curso activo
              </label>
            )}
          </div>

          <div className="flex gap-2">
            <GradientButton size="sm" onClick={() => void submitForm()} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </GradientButton>
            <OutlineButton size="sm" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      {/* Modal inscripciones */}
      <ModalShell open={inscripcionesOpen} onClose={() => setInscripcionesOpen(false)} width="max-w-[860px]">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Inscripciones â€” {inscripcionesCurso?.nombre}
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                academico.inscripciones + academico.certificados
              </p>
            </div>
            <button type="button" onClick={() => setInscripcionesOpen(false)}>
              <X className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            </button>
          </div>

          <DataTable
            columns={inscripcionColumns}
            data={inscripciones}
            loading={inscripcionesLoading}
            emptyMessage="Sin inscripciones para este curso."
            actions={[
              {
                label: "Aprobar",
                onClick: (row) => void handleCambiarEstado(row, "aprobado"),
              },
              {
                label: "Reprobar",
                variant: "destructive",
                onClick: (row) => void handleCambiarEstado(row, "reprobado"),
              },
            ]}
          />
        </div>
      </ModalShell>
    </motion.div>
  );
}

