import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { BookOpen, GraduationCap, Plus, Users, RefreshCw, AlertCircle, Inbox, Download } from "lucide-react";
import { DataTable, type Column, type RowAction } from '@/core/components/shared/DataTable';
import { PageHeader } from '@/core/components/shared/PageHeader';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { StatusDot } from '@/core/components/ui/status-dot';
import { ImageUploadField } from '@/core/components/ui/image-upload-field';
import { cn } from "../lib/utils";
import {
  createCurso,
  enrollVolunteer,
  listCertificadosByCurso,
  listCursos,
  listInscripcionesByCurso,
  updateInscripcion,
  updateCurso,
  toggleCursoActivo,
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
      style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)" }}
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <p className="text-[13px] text-red-400">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          className="rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-400"
          onClick={onRetry}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed" style={{ borderColor: "var(--t-border)" }}>
      <div className="bg-[var(--t-hover)] p-4 rounded-full mb-4">
        <Inbox className="h-8 w-8" style={{ color: "var(--t-text-dim)" }} />
      </div>
      <h3 className="text-[15px] font-medium" style={{ color: "var(--t-text)" }}>{title}</h3>
      {description && <p className="mt-1 text-[13px] max-w-sm" style={{ color: "var(--t-text-secondary)" }}>{description}</p>}
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

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[12px] font-medium" style={{ color: "var(--t-text-secondary)" }}>
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

const inputClass = "h-9 w-full rounded-xl px-3 text-[13px] outline-none transition-colors focus:ring-1 focus:ring-[var(--t-border-strong)]";
const inputStyle = { border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text)" };

const inputErrorClass = "h-9 w-full rounded-xl px-3 text-[13px] outline-none border-red-500/50 bg-red-500/5 focus:ring-1 focus:ring-red-500";
const inputErrorStyle = { color: "var(--t-text)" };

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
          <div style={{ color: "var(--t-text)", fontWeight: 500 }}>{item.nombre}</div>
          <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
            {item.displayCode}{item.descripcion ? ` · ${item.descripcion}` : ""}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "inscritos",
    label: "Inscritos",
    render: (item) => (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--t-hover)] w-max text-[var(--t-text-secondary)]">
        <Users className="w-3 h-3 opacity-70" />
        {item.inscritosCount ?? 0}
      </div>
    ),
  },
  {
    key: "horasCertificacion",
    label: "Horas",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {item.horasCertificacion ? `${item.horasCertificacion}h` : "N/A"}
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
    render: (item) => <span style={{ color: "var(--t-text)", fontWeight: 500 }}>{item.voluntarioNombre}</span>,
  },
  {
    key: "estado",
    label: "Estado",
    // @ts-ignore
    render: (item) => <StatusDot variant={estadoVariant(item.estado)}>{estadoLabel(item.estado)}</StatusDot>,
  },
  {
    key: "nota",
    label: "Nota",
    render: (item) => (
      <span className="tabular-nums text-[12px] font-medium" style={{ color: "var(--t-text-secondary)" }}>
        {item.nota !== null ? item.nota.toFixed(2) : "-"}
      </span>
    ),
  },
  {
    key: "certificadoId",
    label: "Certificado",
    render: (item) => (
      <StatusDot variant={item.certificadoId ? "success" : "secondary"}>
        {item.certificadoId ? "Emitido" : "Pendiente"}
      </StatusDot>
    ),
  },
];

const certificadoColumns: Column<CertificadoRow>[] = [
  { key: "voluntarioNombre", label: "Voluntario", render: (item) => <span style={{ color: "var(--t-text)", fontWeight: 500 }}>{item.voluntarioNombre}</span> },
  { key: "fechaEmision", label: "Fecha de emisión", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{item.fechaEmision}</span> },
];

// ─── Export ───────────────────────────────────────────────────────────────────

function exportInscripcionesToCSV(cursoNombre: string, data: InscripcionRow[]) {
  if (!data || data.length === 0) {
    toast.error("No hay inscripciones para exportar.");
    return;
  }
  const headers = ["ID Inscripcion", "Voluntario", "Estado", "Nota", "Fecha Inscripcion", "ID Certificado"];
  const csvRows = data.map((r) => [
    `"${r.id}"`,
    `"${r.voluntarioNombre || ""}"`,
    `"${r.estado || ""}"`,
    `"${r.nota !== null ? r.nota : ""}"`,
    `"${r.createdAt || ""}"`,
    `"${r.certificadoId || ""}"`,
  ]);
  const csvContent = [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `inscripciones_${cursoNombre.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success("Inscripciones exportadas exitosamente.");
}

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
  const [editCursoId, setEditCursoId] = useState<string | null>(null);
  const [cursoForm, setCursoForm] = useState({ nombre: "", descripcion: "", horas: "", imageUrl: "", activo: true, imageFile: null as File | null });
  const [cursoFormErrors, setCursoFormErrors] = useState<Record<string, string>>({});
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
    const errors: Record<string, string> = {};
    if (!cursoForm.nombre.trim()) errors.nombre = "El nombre del curso es obligatorio.";
    
    const horas = cursoForm.horas ? Number(cursoForm.horas) : null;
    if (cursoForm.horas && (Number.isNaN(horas) || (horas !== null && horas <= 0))) {
      errors.horas = "Las horas deben ser un número positivo.";
    }

    if (Object.keys(errors).length > 0) {
      setCursoFormErrors(errors);
      return;
    }

    setSavingCurso(true);
    setCursoFormErrors({});
    try {
      let uploadedImageUrl = cursoForm.imageUrl;
      if (cursoForm.imageFile) {
        const upload = await uploadFileToStorage({
          ...getAssetsUploadBucket(),
          file: cursoForm.imageFile,
          pathSegments: ["cursos", cursoForm.nombre.trim() || "curso"],
        });
        uploadedImageUrl = upload.publicUrl;
      }
      
      if (editCursoId) {
        await updateCurso(editCursoId, {
          nombre: cursoForm.nombre,
          descripcion: cursoForm.descripcion.trim() || null,
          horasCertificacion: horas,
          imageUrl: uploadedImageUrl,
          activo: cursoForm.activo,
        });
        toast.success("Curso actualizado", { description: cursoForm.nombre });
      } else {
        const created = await createCurso({
          nombre: cursoForm.nombre,
          descripcion: cursoForm.descripcion.trim() || null,
          horasCertificacion: horas,
          imageUrl: uploadedImageUrl,
        });
        toast.success("Curso creado", { description: created.nombre });
      }
      setCursoModalOpen(false);
      setEditCursoId(null);
      setCursoForm({ nombre: "", descripcion: "", horas: "", imageUrl: "", activo: true, imageFile: null });
      await loadCursos();
    } catch (err) {
      setCursoFormErrors({ global: err instanceof Error ? err.message : "No se pudo guardar el curso." });
    } finally {
      setSavingCurso(false);
    }
  }, [cursoForm, editCursoId, loadCursos]);

  const openCreateCurso = () => {
    setEditCursoId(null);
    setCursoForm({ nombre: "", descripcion: "", horas: "", imageUrl: "", activo: true, imageFile: null });
    setCursoFormErrors({});
    setCursoModalOpen(true);
  };

  const openEditCurso = (row: CursoRow) => {
    setEditCursoId(row.id);
    setCursoForm({
      nombre: row.nombre,
      descripcion: row.descripcion || "",
      horas: row.horasCertificacion ? String(row.horasCertificacion) : "",
      imageUrl: row.imageUrl || "",
      activo: row.activo,
      imageFile: null,
    });
    setCursoFormErrors({});
    setCursoModalOpen(true);
  };

  const handleToggleCurso = async (row: CursoRow) => {
    try {
      await toggleCursoActivo(row.id, !row.activo);
      toast.success(row.activo ? "Curso desactivado" : "Curso activado");
      await loadCursos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado");
    }
  };

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
    { label: "Gestionar curso", onClick: selectCurso },
    { label: "Editar curso", onClick: openEditCurso },
    {
      label: (row) => (row.activo ? "Desactivar" : "Activar"),
      onClick: handleToggleCurso,
    },
  ];

  const inscripcionActions: RowAction<InscripcionRow>[] = [
    { label: "Editar estado / nota", onClick: openEdit },
  ];

  // ─── Rendering helpers ───────────────────────────────────────────────────────
  const renderCursosContent = () => {
    if (cursosLoading && !cursos.length) return null; // DataTable maneja el propio skeleton si le pasamos loading
    if (cursosError) return <ErrorBlock message={cursosError} onRetry={loadCursos} />;
    
    if (!cursosLoading && cursos.length === 0) {
      return (
        <EmptyState 
          title="No hay cursos registrados" 
          description="Comienza creando un curso para gestionar certificaciones y capacitación de voluntarios."
        />
      );
    }
    
    return (
      <DataTable
        columns={cursoColumns}
        data={cursos}
        loading={cursosLoading}
        actions={cursoActions}
      />
    );
  };

  const renderInscripcionesContent = () => {
    if (!selectedCurso) return null;
    if (inscripcionesLoading && !inscripciones.length) return null;
    if (inscripcionesError) return <ErrorBlock message={inscripcionesError} onRetry={() => void loadInscripciones(selectedCurso.id)} />;
    
    if (!inscripcionesLoading && inscripciones.length === 0) {
      return (
        <EmptyState 
          title="Sin inscripciones" 
          description="Inscribe voluntarios en este curso para hacer seguimiento a sus calificaciones."
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <OutlineButton
            size="sm"
            onClick={() => exportInscripcionesToCSV(selectedCurso.nombre || "curso", inscripciones)}
            className="flex items-center gap-1.5 text-[var(--t-text-secondary)] border-[var(--t-border)] hover:bg-[var(--t-hover)]"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            Exportar CSV
          </OutlineButton>
        </div>
        <DataTable
          columns={inscripcionColumns}
          data={inscripciones}
          loading={inscripcionesLoading}
          actions={inscripcionActions}
        />
      </div>
    );
  };

  const renderCertificadosContent = () => {
    if (!selectedCurso) return null;
    if (certificadosLoading && !certificados.length) return null;
    if (certificadosError) return <ErrorBlock message={certificadosError} onRetry={() => void loadCertificados(selectedCurso.id)} />;
    
    if (!certificadosLoading && certificados.length === 0) {
      return (
        <EmptyState 
          title="No hay certificados" 
          description="Los certificados se emiten automáticamente al aprobar voluntarios con nota mínima."
        />
      );
    }

    return (
      <DataTable
        columns={certificadoColumns}
        data={certificados}
        loading={certificadosLoading}
      />
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-[1200px]">
      <PageHeader
        title={view === "cursos" ? "Cursos y Certificados" : selectedCurso?.nombre ?? "Gestión de Curso"}
        description={view === "cursos" 
          ? "Gestiona capacitaciones y certificaciones de los voluntarios" 
          : "Detalles del curso, asistentes y emisiones de certificados"}
        action={view === "cursos" ? { 
          label: "Nuevo curso", 
          onClick: openCreateCurso 
        } : {
          label: "Inscribir voluntario",
          onClick: openEnrollModal
        }}
      >
        <button
          onClick={() => {
            if (view === "cursos") void loadCursos();
            else if (view === "inscripciones" && selectedCurso) void loadInscripciones(selectedCurso.id);
            else if (view === "certificados" && selectedCurso) void loadCertificados(selectedCurso.id);
          }}
          disabled={cursosLoading || inscripcionesLoading || certificadosLoading}
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--t-hover)] active:scale-95 disabled:opacity-50"
          style={{ border: "1px solid var(--t-border)", background: "var(--t-surface)", color: "var(--t-text-secondary)" }}
        >
          <RefreshCw className={cn("h-4 w-4", (cursosLoading || inscripcionesLoading || certificadosLoading) && "animate-spin")} />
        </button>
      </PageHeader>

      {/* Tabs / Navegación interna */}
      <div className="flex flex-wrap gap-2 pb-2 mb-4 border-b border-[var(--t-border)]">
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-[13px] font-medium rounded-t-lg transition-colors relative",
            view === "cursos" ? "text-[var(--t-text)]" : "text-[var(--t-text-secondary)] hover:bg-[var(--t-hover)]"
          )}
          onClick={() => { setView("cursos"); setSelectedCurso(null); }}
        >
          <BookOpen className="h-4 w-4" />
          Catálogo
          {view === "cursos" && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--t-text)]" />}
        </button>
        {selectedCurso && (
          <>
            <button
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-[13px] font-medium rounded-t-lg transition-colors relative",
                view === "inscripciones" ? "text-[var(--t-text)]" : "text-[var(--t-text-secondary)] hover:bg-[var(--t-hover)]"
              )}
              onClick={() => setView("inscripciones")}
            >
              <Users className="h-4 w-4" />
              Inscripciones
              {view === "inscripciones" && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--t-text)]" />}
            </button>
            <button
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-[13px] font-medium rounded-t-lg transition-colors relative",
                view === "certificados" ? "text-[var(--t-text)]" : "text-[var(--t-text-secondary)] hover:bg-[var(--t-hover)]"
              )}
              onClick={() => setView("certificados")}
            >
              <GraduationCap className="h-4 w-4" />
              Certificados
              {view === "certificados" && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--t-text)]" />}
            </button>
          </>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="pt-2">
        {view === "cursos" && renderCursosContent()}
        {view === "inscripciones" && renderInscripcionesContent()}
        {view === "certificados" && renderCertificadosContent()}
      </div>

      {/* ── Modal: Nuevo curso ───────────────────────────────────────────────── */}
      <ModalShell open={cursoModalOpen} onClose={() => setCursoModalOpen(false)} width="max-w-md">
        <ModalHeader title={editCursoId ? "Editar Curso" : "Crear Nuevo Curso"} onClose={() => setCursoModalOpen(false)} />
        <div className="space-y-4 p-5">
          <Field label="Nombre del curso" required error={cursoFormErrors.nombre}>
            <input
              className={cursoFormErrors.nombre ? inputErrorClass : inputClass}
              style={cursoFormErrors.nombre ? inputErrorStyle : inputStyle}
              value={cursoForm.nombre}
              onChange={(e) => { setCursoForm((p) => ({ ...p, nombre: e.target.value })); setCursoFormErrors((p) => ({ ...p, nombre: "" })); }}
              placeholder="Ej. Primeros auxilios básicos"
            />
          </Field>
          
          <div className="grid grid-cols-2 gap-4">
            <Field label="Horas de cert." error={cursoFormErrors.horas}>
              <input
                className={cursoFormErrors.horas ? inputErrorClass : inputClass}
                style={cursoFormErrors.horas ? inputErrorStyle : inputStyle}
                type="number"
                min="1"
                value={cursoForm.horas}
                onChange={(e) => { setCursoForm((p) => ({ ...p, horas: e.target.value })); setCursoFormErrors((p) => ({ ...p, horas: "" })); }}
                placeholder="Ej. 40"
              />
            </Field>

            <Field label="Estado inicial">
              <label className="flex h-9 items-center justify-between rounded-xl px-3 cursor-pointer" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)" }}>
                <span className="text-[13px]" style={{ color: "var(--t-text)" }}>Activo</span>
                <div
                  className={cn(
                    "relative flex h-5 w-9 cursor-pointer items-center rounded-full p-0.5 transition-colors",
                    cursoForm.activo ? "bg-emerald-500" : "bg-[#26231F]"
                  )}
                  onClick={() => setCursoForm((p) => ({ ...p, activo: !p.activo }))}
                >
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      cursoForm.activo ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </div>
              </label>
            </Field>
          </div>

          <Field label="Descripción corta (opcional)">
            <input
              className={inputClass}
              style={inputStyle}
              value={cursoForm.descripcion}
              onChange={(e) => setCursoForm((p) => ({ ...p, descripcion: e.target.value }))}
              placeholder="Temática principal del curso"
            />
          </Field>

          <ImageUploadField
            label="Portada del curso"
            existingUrl={cursoForm.imageUrl || null}
            previewFile={cursoForm.imageFile}
            onFileSelect={(file) => setCursoForm((p) => ({ ...p, imageFile: file }))}
            onClear={() => setCursoForm((p) => ({ ...p, imageFile: null, imageUrl: "" }))}
          />
          {cursoFormErrors.global && <p className="text-[13px] text-red-400 p-2 bg-red-500/10 rounded-lg">{cursoFormErrors.global}</p>}
          
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--t-border)" }}>
            <OutlineButton onClick={() => setCursoModalOpen(false)} disabled={savingCurso}>Cancelar</OutlineButton>
            <GradientButton onClick={() => void submitCurso()} disabled={savingCurso}>
              {savingCurso ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" /> Guardando...</> : "Crear curso"}
            </GradientButton>
          </div>
        </div>
      </ModalShell>

      {/* ── Modal: Inscribir voluntario ──────────────────────────────────────── */}
      <ModalShell open={enrollModalOpen} onClose={() => setEnrollModalOpen(false)} width="max-w-md">
        <ModalHeader title="Inscribir Voluntario" description={selectedCurso?.nombre} onClose={() => setEnrollModalOpen(false)} />
        <div className="space-y-4 p-5">
          <Field label="Voluntario" required error={enrollError ?? undefined}>
            <select
              className={enrollError ? inputErrorClass : inputClass}
              style={enrollError ? inputErrorStyle : inputStyle}
              value={enrollVolunteerId}
              onChange={(e) => { setEnrollVolunteerId(e.target.value); setEnrollError(null); }}
            >
              <option value="">Selecciona un voluntario</option>
              {volunteerOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--t-border)" }}>
            <OutlineButton onClick={() => setEnrollModalOpen(false)} disabled={enrolling}>Cancelar</OutlineButton>
            <GradientButton onClick={() => void submitEnroll()} disabled={enrolling}>
              {enrolling ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" /> Inscribiendo...</> : "Inscribir"}
            </GradientButton>
          </div>
        </div>
      </ModalShell>

      {/* ── Modal: Editar inscripción ────────────────────────────────────────── */}
      <ModalShell open={!!editInscripcion} onClose={() => { setEditInscripcion(null); setEditError(null); }} width="max-w-md">
        <ModalHeader
          title="Editar Calificación"
          description={editInscripcion?.voluntarioNombre}
          onClose={() => { setEditInscripcion(null); setEditError(null); }}
        />
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-4">
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
            <Field label="Nota (0–20)" error={editError ?? undefined}>
              <input
                className={editError ? inputErrorClass : inputClass}
                style={editError ? inputErrorStyle : inputStyle}
                type="number"
                min="0"
                max="20"
                step="0.01"
                value={editForm.nota}
                onChange={(e) => { setEditForm((p) => ({ ...p, nota: e.target.value })); setEditError(null); }}
                placeholder="Ej. 14.50"
              />
            </Field>
          </div>
          
          {editInscripcion?.estado !== "aprobado" && editForm.estado === "aprobado" && editForm.nota && Number(editForm.nota) >= NOTA_APROBACION && (
            <div
              className="rounded-xl px-4 py-3 text-[13px] flex items-center gap-2 font-medium"
              style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "var(--t-text-secondary)" }}
            >
              <GraduationCap className="h-5 w-5 text-emerald-500" />
              Se emitirá el certificado automáticamente.
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--t-border)" }}>
            <OutlineButton onClick={() => setEditInscripcion(null)} disabled={saving}>Cancelar</OutlineButton>
            <GradientButton onClick={() => void submitEdit()} disabled={saving}>
              {saving ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" /> Guardando...</> : "Guardar cambios"}
            </GradientButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
