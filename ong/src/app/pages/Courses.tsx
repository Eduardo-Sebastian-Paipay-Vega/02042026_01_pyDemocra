import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { BookOpen, GraduationCap, Plus, Users } from "lucide-react";
import { DataTable, type Column, type RowAction } from '@/core/components/shared/DataTable';
import { PageHeader } from '@/core/components/shared/PageHeader';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { StatusDot } from '@/core/components/ui/status-dot';
import { ImageUploadField } from '@/core/components/ui/image-upload-field';
import {
  createCurso,
  enrollVolunteer,
  listCertificadosByCurso,
  listCursos,
  listInscripcionesByCurso,
  updateInscripcion,
  NOTA_APROBACION,
  type CertificadoRow,
  type CursoRow,
  type InscripcionRow,
} from "../services/academico/cursos.service";
import { fetchVolunteerCatalog } from "../services/operacion/shared";
import { uploadFileToStorage, getAssetsUploadBucket } from "../services/shared/storage";

// ─── Local helpers ────────────────────────────────────────────────────────────

function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="flex items-center justify-between rounded-2xl px-4 py-3"
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
    >
      <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{message}</p>
      {onRetry && (
        <button
          type="button"
          className="rounded-md px-2 py-1 text-[11px] hover:bg-[var(--t-hover)]"
          style={{ color: "var(--t-text-secondary)" }}
          onClick={onRetry}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

function ModalHeader({ title, description, onClose }: { title: string; description?: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 pt-4">
      <div>
        <h3 className="text-[15px] font-medium" style={{ color: "var(--t-text)" }}>{title}</h3>
        {description && <p className="mt-0.5 text-[12px]" style={{ color: "var(--t-text-dim)" }}>{description}</p>}
      </div>
      <button
        onClick={onClose}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-[16px] transition-colors hover:bg-[var(--t-hover)]"
        style={{ color: "var(--t-text-dim)" }}
      >
        ×
      </button>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>{label}</label>
      {children}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

const inputClass = "h-9 w-full rounded-xl px-3 text-[13px] outline-none";
const inputStyle = { border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text)" };

function estadoVariant(estado: InscripcionRow["estado"]): "success" | "warning" | "error" {
  if (estado === "aprobado") return "success";
  if (estado === "reprobado") return "error";
  return "warning";
}

function estadoLabel(estado: InscripcionRow["estado"]) {
  return estado === "aprobado" ? "Aprobado" : estado === "reprobado" ? "Reprobado" : "Inscrito";
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const cursoColumns: Column<CursoRow>[] = [
  {
    key: "nombre",
    label: "Curso",
    render: (item) => (
      <div className="flex items-center gap-3">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.nombre}
            className="h-10 w-10 shrink-0 rounded-xl object-cover"
            style={{ border: "1px solid var(--t-border)" }}
          />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--t-hover)" }}
          >
            <BookOpen className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
          </div>
        )}
        <div>
          <div style={{ color: "var(--t-text)" }}>{item.nombre}</div>
          <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
            {item.displayCode}{item.descripcion ? ` · ${item.descripcion}` : ""}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "horasCertificacion",
    label: "Horas",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {item.horasCertificacion ?? "-"}
      </span>
    ),
  },
  {
    key: "activo",
    label: "Estado",
    render: (item) => <StatusDot variant={item.activo ? "success" : "secondary"}>{item.activo ? "Activo" : "Inactivo"}</StatusDot>,
  },
];

const inscripcionColumns: Column<InscripcionRow>[] = [
  {
    key: "voluntarioNombre",
    label: "Voluntario",
    render: (item) => <span style={{ color: "var(--t-text)" }}>{item.voluntarioNombre}</span>,
  },
  {
    key: "estado",
    label: "Estado",
      // @ts-ignore
      // @ts-ignore
    render: (item) => <StatusDot variant={estadoVariant(item.estado)}>{estadoLabel(item.estado)}</StatusDot>,
  },
  {
    key: "nota",
    label: "Nota",
    render: (item) => (
      <span className="tabular-nums text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {item.nota !== null ? item.nota.toFixed(2) : "-"}
      </span>
    ),
  },
  {
    key: "certificadoId",
    label: "Certificado",
    render: (item) => (
      <StatusDot variant={item.certificadoId ? "success" : "secondary"}>
        {item.certificadoId ? "Emitido" : "Sin certificado"}
      </StatusDot>
    ),
  },
];

const certificadoColumns: Column<CertificadoRow>[] = [
  { key: "voluntarioNombre", label: "Voluntario", render: (item) => <span style={{ color: "var(--t-text)" }}>{item.voluntarioNombre}</span> },
  { key: "fechaEmision", label: "Fecha de emisión", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{item.fechaEmision}</span> },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

type CoursesView = "cursos" | "inscripciones" | "certificados";

export function Courses() {
  const [view, setView] = useState<CoursesView>("cursos");

  const [cursos, setCursos] = useState<CursoRow[]>([]);
  const [cursosLoading, setCursosLoading] = useState(true);
  const [cursosError, setCursosError] = useState<string | null>(null);

  const [selectedCurso, setSelectedCurso] = useState<CursoRow | null>(null);
  const [inscripciones, setInscripciones] = useState<InscripcionRow[]>([]);
  const [inscripcionesLoading, setInscripcionesLoading] = useState(false);
  const [inscripcionesError, setInscripcionesError] = useState<string | null>(null);

  const [certificados, setCertificados] = useState<CertificadoRow[]>([]);
  const [certificadosLoading, setCertificadosLoading] = useState(false);
  const [certificadosError, setCertificadosError] = useState<string | null>(null);

  // New course modal
  const [cursoModalOpen, setCursoModalOpen] = useState(false);
  const [cursoForm, setCursoForm] = useState({ nombre: "", descripcion: "", horas: "", imageUrl: "", imageFile: null as File | null });
  const [cursoFormError, setCursoFormError] = useState<string | null>(null);
  const [savingCurso, setSavingCurso] = useState(false);

  // Enroll modal
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [volunteerOptions, setVolunteerOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [enrollVolunteerId, setEnrollVolunteerId] = useState("");
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  // Edit inscripcion modal
  const [editInscripcion, setEditInscripcion] = useState<InscripcionRow | null>(null);
  const [editForm, setEditForm] = useState({ estado: "inscrito" as InscripcionRow["estado"], nota: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadCursos = useCallback(async () => {
    setCursosLoading(true);
    setCursosError(null);
    try {
      const data = await listCursos();
      setCursos(data);
    } catch (err) {
      setCursosError(err instanceof Error ? err.message : "Error al cargar cursos.");
    } finally {
      setCursosLoading(false);
    }
  }, []);

  const loadInscripciones = useCallback(async (cursoId: string) => {
    setInscripcionesLoading(true);
    setInscripcionesError(null);
    try {
      const data = await listInscripcionesByCurso(cursoId);
      setInscripciones(data);
    } catch (err) {
      setInscripcionesError(err instanceof Error ? err.message : "Error al cargar inscripciones.");
    } finally {
      setInscripcionesLoading(false);
    }
  }, []);

  const loadCertificados = useCallback(async (cursoId: string) => {
    setCertificadosLoading(true);
    setCertificadosError(null);
    try {
      const data = await listCertificadosByCurso(cursoId);
      setCertificados(data);
    } catch (err) {
      setCertificadosError(err instanceof Error ? err.message : "Error al cargar certificados.");
    } finally {
      setCertificadosLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCursos();
  }, [loadCursos]);

  const selectCurso = useCallback(
    (curso: CursoRow) => {
      setSelectedCurso(curso);
      setView("inscripciones");
      void loadInscripciones(curso.id);
    },
    [loadInscripciones]
  );

  useEffect(() => {
    if (view === "certificados" && selectedCurso) {
      void loadCertificados(selectedCurso.id);
    }
  }, [view, selectedCurso, loadCertificados]);

  // ── Create curso ────────────────────────────────────────────────────────────
  const submitCurso = useCallback(async () => {
    if (!cursoForm.nombre.trim()) {
      setCursoFormError("El nombre del curso es obligatorio.");
      return;
    }
    const horas = cursoForm.horas ? Number(cursoForm.horas) : null;
    if (cursoForm.horas && (Number.isNaN(horas) || (horas !== null && horas <= 0))) {
      setCursoFormError("Las horas deben ser un número positivo.");
      return;
    }
    setSavingCurso(true);
    setCursoFormError(null);
    try {
      let uploadedImageUrl: string | null = null;
      if (cursoForm.imageFile) {
        const upload = await uploadFileToStorage({
          ...getAssetsUploadBucket(),
          file: cursoForm.imageFile,
          pathSegments: ["cursos", cursoForm.nombre.trim() || "curso"],
        });
        uploadedImageUrl = upload.publicUrl;
      }
      const created = await createCurso({
        nombre: cursoForm.nombre,
        descripcion: cursoForm.descripcion.trim() || null,
        horasCertificacion: horas,
        imageUrl: uploadedImageUrl,
      });
      setCursoModalOpen(false);
      setCursoForm({ nombre: "", descripcion: "", horas: "", imageUrl: "", imageFile: null });
      await loadCursos();
      toast.success("Curso creado", { description: created.nombre });
    } catch (err) {
      setCursoFormError(err instanceof Error ? err.message : "No se pudo crear el curso.");
    } finally {
      setSavingCurso(false);
    }
  }, [cursoForm]);

  // ── Enroll ──────────────────────────────────────────────────────────────────
  const openEnrollModal = useCallback(async () => {
    setEnrollVolunteerId("");
    setEnrollError(null);
    try {
      const opts = await fetchVolunteerCatalog();
      setVolunteerOptions(opts);
    } catch {
      setVolunteerOptions([]);
    }
    setEnrollModalOpen(true);
  }, []);

  const submitEnroll = useCallback(async () => {
    if (!selectedCurso || !enrollVolunteerId) {
      setEnrollError("Selecciona un voluntario.");
      return;
    }
    setEnrolling(true);
    setEnrollError(null);
    try {
      await enrollVolunteer({ cursoId: selectedCurso.id, voluntarioId: enrollVolunteerId });
      setEnrollModalOpen(false);
      await loadInscripciones(selectedCurso.id);
      toast.success("Inscripción registrada");
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : "No se pudo inscribir al voluntario.");
    } finally {
      setEnrolling(false);
    }
  }, [selectedCurso, enrollVolunteerId, loadInscripciones]);

  // ── Edit inscripcion ─────────────────────────────────────────────────────────
  const openEdit = useCallback((row: InscripcionRow) => {
    setEditInscripcion(row);
    setEditForm({ estado: row.estado, nota: row.nota !== null ? String(row.nota) : "" });
    setEditError(null);
  }, []);

  const submitEdit = useCallback(async () => {
    if (!editInscripcion) return;
    const nota = editForm.nota ? Number(editForm.nota) : null;
    if (editForm.nota && (Number.isNaN(nota) || (nota !== null && (nota < 0 || nota > 20)))) {
      setEditError("La nota debe estar entre 0 y 20.");
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      const { certificadoCreado } = await updateInscripcion(editInscripcion.id, {
        estado: editForm.estado,
        nota,
      });
      setEditInscripcion(null);
      if (selectedCurso) await loadInscripciones(selectedCurso.id);
      toast.success("Inscripción actualizada", {
        description: certificadoCreado
          ? `Certificado emitido automáticamente (nota ≥ ${NOTA_APROBACION}).`
          : undefined,
      });
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "No se pudo actualizar la inscripción.");
    } finally {
      setSaving(false);
    }
  }, [editInscripcion, editForm, selectedCurso, loadInscripciones]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const cursoActions: RowAction<CursoRow>[] = [
    { label: "Ver inscripciones", onClick: selectCurso },
  ];

  const inscripcionActions: RowAction<InscripcionRow>[] = [
    { label: "Editar estado / nota", onClick: openEdit },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Cursos y certificados"
        description="Gestiona capacitaciones, inscripciones y certificaciones de voluntarios."
        action={{ label: "Refrescar", onClick: () => void loadCursos() }}
      />

      {/* View tabs */}
      <div className="flex flex-wrap gap-2">
        <GradientButton size="sm" onClick={() => { setView("cursos"); setSelectedCurso(null); }}>
          <BookOpen className="h-3.5 w-3.5" />
          Cursos
        </GradientButton>
        {selectedCurso && (
          <>
            <OutlineButton size="sm" onClick={() => setView("inscripciones")}>
              <Users className="h-3.5 w-3.5 opacity-60" />
              Inscripciones — {selectedCurso.nombre}
            </OutlineButton>
            <OutlineButton size="sm" onClick={() => setView("certificados")}>
              <GraduationCap className="h-3.5 w-3.5 opacity-60" />
              Certificados
            </OutlineButton>
          </>
        )}
      </div>

      {/* ── Cursos view ─────────────────────────────────────────────────────── */}
      {view === "cursos" && (
        <>
          {cursosError && <ErrorBlock message={cursosError} onRetry={loadCursos} />}
          <DataTable
            columns={cursoColumns}
            data={cursos}
            loading={cursosLoading}
            actions={cursoActions}
            emptyMessage="No hay cursos registrados."
          />
          <GradientButton size="sm" onClick={() => { setCursoForm({ nombre: "", descripcion: "", horas: "", imageUrl: "", imageFile: null }); setCursoFormError(null); setCursoModalOpen(true); }}>
            <Plus className="h-3.5 w-3.5" />
            Nuevo curso
          </GradientButton>
        </>
      )}

      {/* ── Inscripciones view ──────────────────────────────────────────────── */}
      {view === "inscripciones" && selectedCurso && (
        <>
          <div
            className="flex items-center justify-between rounded-2xl px-4 py-3"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em]" style={{ color: "var(--t-text-dim)" }}>Curso seleccionado</p>
              <p className="text-[13px]" style={{ color: "var(--t-text)" }}>{selectedCurso.nombre}</p>
            </div>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Nota mínima de aprobación: <span style={{ color: "var(--t-text-secondary)" }}>{NOTA_APROBACION}</span>
            </p>
          </div>
          {inscripcionesError && <ErrorBlock message={inscripcionesError} onRetry={() => void loadInscripciones(selectedCurso.id)} />}
          <DataTable
            columns={inscripcionColumns}
            data={inscripciones}
            loading={inscripcionesLoading}
            actions={inscripcionActions}
            emptyMessage="Sin inscripciones en este curso."
          />
          <GradientButton size="sm" onClick={() => void openEnrollModal()}>
            <Plus className="h-3.5 w-3.5" />
            Inscribir voluntario
          </GradientButton>
        </>
      )}

      {/* ── Certificados view ───────────────────────────────────────────────── */}
      {view === "certificados" && selectedCurso && (
        <>
          {certificadosError && <ErrorBlock message={certificadosError} onRetry={() => void loadCertificados(selectedCurso.id)} />}
          <DataTable
            columns={certificadoColumns}
            data={certificados}
            loading={certificadosLoading}
            emptyMessage="No hay certificados emitidos para este curso."
          />
        </>
      )}

      {/* ── Modal: Nuevo curso ───────────────────────────────────────────────── */}
      <ModalShell open={cursoModalOpen} onClose={() => setCursoModalOpen(false)} width="max-w-md">
        <ModalHeader title="Nuevo curso" onClose={() => setCursoModalOpen(false)} />
        <div className="space-y-3 p-4">
          <Field label="Nombre *" error={cursoFormError ?? undefined}>
            <input
              className={inputClass}
              style={inputStyle}
              value={cursoForm.nombre}
              onChange={(e) => { setCursoForm((p) => ({ ...p, nombre: e.target.value })); setCursoFormError(null); }}
              placeholder="Ej. Primeros auxilios"
            />
          </Field>
          <Field label="Descripción">
            <input
              className={inputClass}
              style={inputStyle}
              value={cursoForm.descripcion}
              onChange={(e) => setCursoForm((p) => ({ ...p, descripcion: e.target.value }))}
              placeholder="Opcional"
            />
          </Field>
          <Field label="Horas de certificación">
            <input
              className={inputClass}
              style={inputStyle}
              type="number"
              min="1"
              value={cursoForm.horas}
              onChange={(e) => setCursoForm((p) => ({ ...p, horas: e.target.value }))}
              placeholder="Ej. 40"
            />
          </Field>
          <ImageUploadField
            label="Imagen del curso"
            existingUrl={cursoForm.imageUrl || null}
            previewFile={cursoForm.imageFile}
            onFileSelect={(file) => setCursoForm((p) => ({ ...p, imageFile: file }))}
            onClear={() => setCursoForm((p) => ({ ...p, imageFile: null, imageUrl: "" }))}
          />
          {cursoFormError && <p className="text-[12px] text-red-400">{cursoFormError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <OutlineButton size="sm" onClick={() => setCursoModalOpen(false)} disabled={savingCurso}>Cancelar</OutlineButton>
            <GradientButton size="sm" onClick={() => void submitCurso()} disabled={savingCurso}>
              {savingCurso ? "Guardando..." : "Crear curso"}
            </GradientButton>
          </div>
        </div>
      </ModalShell>

      {/* ── Modal: Inscribir voluntario ──────────────────────────────────────── */}
      <ModalShell open={enrollModalOpen} onClose={() => setEnrollModalOpen(false)} width="max-w-md">
        <ModalHeader title="Inscribir voluntario" description={selectedCurso?.nombre} onClose={() => setEnrollModalOpen(false)} />
        <div className="space-y-3 p-4">
          <Field label="Voluntario *">
            <select
              className={inputClass}
              style={inputStyle}
              value={enrollVolunteerId}
              onChange={(e) => { setEnrollVolunteerId(e.target.value); setEnrollError(null); }}
            >
              <option value="">Selecciona un voluntario</option>
              {volunteerOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          {enrollError && <p className="text-[12px] text-red-400">{enrollError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <OutlineButton size="sm" onClick={() => setEnrollModalOpen(false)} disabled={enrolling}>Cancelar</OutlineButton>
            <GradientButton size="sm" onClick={() => void submitEnroll()} disabled={enrolling}>
              {enrolling ? "Inscribiendo..." : "Inscribir"}
            </GradientButton>
          </div>
        </div>
      </ModalShell>

      {/* ── Modal: Editar inscripción ────────────────────────────────────────── */}
      <ModalShell open={!!editInscripcion} onClose={() => setEditInscripcion(null)} width="max-w-md">
        <ModalHeader
          title="Editar inscripción"
          description={editInscripcion?.voluntarioNombre}
          onClose={() => setEditInscripcion(null)}
        />
        <div className="space-y-3 p-4">
          <Field label="Estado">
            <select
              className={inputClass}
              style={inputStyle}
              value={editForm.estado}
              onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as InscripcionRow["estado"] }))}
            >
              <option value="inscrito">Inscrito</option>
              <option value="aprobado">Aprobado</option>
              <option value="reprobado">Reprobado</option>
            </select>
          </Field>
          <Field label={`Nota (0–20, mínimo ${NOTA_APROBACION} para aprobar)`}>
            <input
              className={inputClass}
              style={inputStyle}
              type="number"
              min="0"
              max="20"
              step="0.01"
              value={editForm.nota}
              onChange={(e) => setEditForm((p) => ({ ...p, nota: e.target.value }))}
              placeholder="Ej. 14.50"
            />
          </Field>
          {editInscripcion?.estado !== "aprobado" && editForm.estado === "aprobado" && editForm.nota && Number(editForm.nota) >= NOTA_APROBACION && (
            <div
              className="rounded-xl px-3 py-2 text-[12px]"
              style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "var(--t-text-secondary)" }}
            >
              Se emitirá un certificado automáticamente al guardar.
            </div>
          )}
          {editError && <p className="text-[12px] text-red-400">{editError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <OutlineButton size="sm" onClick={() => setEditInscripcion(null)} disabled={saving}>Cancelar</OutlineButton>
            <GradientButton size="sm" onClick={() => void submitEdit()} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </GradientButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
