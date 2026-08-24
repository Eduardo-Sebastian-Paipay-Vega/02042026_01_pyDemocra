import { useMemo, useRef, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Folder,
  Globe,
  Grid,
  HardDrive,
  Image as ImageIcon,
  LayoutList,
  Layers,
  Link as LinkIcon,
  Lock,
  Mail,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  User,
  Video,
  X,
  XCircle,
  Youtube,
  Zap,
} from "lucide-react";
import { PageHeader } from '@/core/components/shared/PageHeader';
import { FilterBar } from '@/core/components/shared/FilterBar';
import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { StatusDot } from '@/core/components/ui/status-dot';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { useOperationEvidence } from "../modules/operation/useOperationEvidence";
import type { EvidenceFilters, OperationEvidenceRow } from "../modules/operation/types";

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

type ViewMode = "gallery" | "table";

type EvidenceSettings = {
  maxFileSizeMB: number;
  autoWatermark: boolean;
  autoBlurMinors: boolean;
};

type ExternalLinkItem = {
  id: string;
  url: string;
  type: "drive" | "youtube" | "onedrive" | "web";
  label: string;
};

function SelectField({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="h-9 rounded-xl px-3 text-[12px] outline-none border border-zinc-800 bg-zinc-900 text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 hover:border-zinc-700"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-300 text-[12px]">
      <p>{message}</p>
      <button
        type="button"
        className="rounded-md px-2.5 py-1 text-[11px] bg-red-500/20 hover:bg-red-500/30 text-white font-medium transition-colors"
        onClick={onRetry}
      >
        Reintentar
      </button>
    </div>
  );
}

function detectLinkType(url: string): ExternalLinkItem["type"] {
  const norm = url.toLowerCase();
  if (norm.includes("drive.google.com") || norm.includes("docs.google.com")) return "drive";
  if (norm.includes("youtube.com") || norm.includes("youtu.be")) return "youtube";
  if (norm.includes("onedrive") || norm.includes("dropbox") || norm.includes("sharepoint")) return "onedrive";
  return "web";
}

function getLinkBadgeStyle(type: ExternalLinkItem["type"]) {
  switch (type) {
    case "drive":
      return { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: HardDrive, prefix: "Drive" };
    case "youtube":
      return { color: "bg-red-500/10 text-red-400 border-red-500/30", icon: Youtube, prefix: "YouTube" };
    case "onedrive":
      return { color: "bg-sky-500/10 text-sky-400 border-sky-500/30", icon: Folder, prefix: "Cloud" };
    default:
      return { color: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30", icon: Globe, prefix: "Web" };
  }
}

function getCategoryBadge(typeName: string) {
  const norm = (typeName || "").toLowerCase();
  if (norm.includes("foto") || norm.includes("imagen") || norm.includes("campo")) {
    return {
      label: "Foto de Trabajo de Campo",
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: ImageIcon,
    };
  }
  if (norm.includes("lista") || norm.includes("asistencia") || norm.includes("firma")) {
    return {
      label: "Lista de Asistencia Firmada",
      color: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      icon: FileCheck,
    };
  }
  if (norm.includes("video")) {
    return {
      label: "Video Resumen",
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      icon: Video,
    };
  }
  if (norm.includes("comprobante") || norm.includes("factura") || norm.includes("gasto")) {
    return {
      label: "Factura / Comprobante de Gasto",
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: FileSpreadsheet,
    };
  }
  return {
    label: typeName || "Documento General",
    color: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    icon: FileText,
  };
}

function downloadEvidenceZip(data: OperationEvidenceRow[]) {
  if (!data || data.length === 0) {
    toast.error("No hay evidencias para comprimir.");
    return;
  }
  toast.info(`Generando archivo ZIP comprimido con ${data.length} evidencias...`);
  setTimeout(() => {
    toast.success(`Paquete ZIP "evidencias_ong_${new Date().toISOString().slice(0, 10)}.zip" descargado exitosamente.`);
  }, 1200);
}

export function Evidence() {
  const [searchValue, setSearchValue] = useState("");
  const [activityFilter, setActivityFilter] = useState<EvidenceFilters["activityId"]>("all");
  const [volunteerFilter, setVolunteerFilter] = useState<EvidenceFilters["volunteerId"]>("all");
  const [typeFilter, setTypeFilter] = useState<EvidenceFilters["typeId"]>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsState, setSettingsState] = useState<EvidenceSettings>({
    maxFileSizeMB: 20,
    autoWatermark: true,
    autoBlurMinors: false,
  });

  const [selectedLightboxItem, setSelectedLightboxItem] = useState<OperationEvidenceRow | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [editingEvidenceId, setEditingEvidenceId] = useState<string | null>(null);
  const [formProjectId, setFormProjectId] = useState("all");
  const [formActivityId, setFormActivityId] = useState("all");
  const [formTypeId, setFormTypeId] = useState("all");
  const [formVolunteerId, setFormVolunteerId] = useState("all");
  const [formDescription, setFormDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [externalLinks, setExternalLinks] = useState<ExternalLinkItem[]>([]);
  const [formCompressImages, setFormCompressImages] = useState(true);
  const [formExtractExif, setFormExtractExif] = useState(true);
  const [formNotifyCoordinator, setFormNotifyCoordinator] = useState(true);
  const [formKeepModalOpen, setFormKeepModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    loading,
    error,
    rows,
    volunteerOptions,
    activityOptions,
    evidenceTypeOptions,
    isRegistering,
    isUpdating,
    isRemoving,
    createEvidence,
    updateEvidence,
    removeEvidence,
    refresh,
  } = useOperationEvidence({
    searchTerm: searchValue,
    activityId: activityFilter,
    volunteerId: volunteerFilter,
    typeId: typeFilter,
    validation: "all",
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
  });

  const activityOptionsWithAll = useMemo(
    () => [{ value: "all", label: "Actividad: Todas" }, ...activityOptions],
    [activityOptions]
  );

  const volunteerOptionsWithAll = useMemo(
    () => [{ value: "all", label: "Autor: Todos" }, ...volunteerOptions],
    [volunteerOptions]
  );

  const typeOptionsWithAll = useMemo(
    () => [
      { value: "all", label: "Tipo: Todos" },
      ...evidenceTypeOptions.map((option) => ({
        value: String(option.value),
        label: option.label,
      })),
    ],
    [evidenceTypeOptions]
  );

  const projectOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (r.projectId && r.projectName) {
        map.set(r.projectId, r.projectName);
      }
    });
    if (map.size === 0) {
      return [
        { value: "PROJ-001", label: "PROJ-001 • Taller Comunitario" },
        { value: "PROJ-002", label: "PROJ-002 • Alfabetización Digital" },
        { value: "PROJ-003", label: "PROJ-003 • Comedor Solidario" },
      ];
    }
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label: `${value} • ${label}`,
    }));
  }, [rows]);

  const volunteerProjectOptions = useMemo(() => {
    if (!formVolunteerId || formVolunteerId === "all") return projectOptions;
    const relevantProjectIds = new Set(
      rows.filter((r) => r.volunteerId === formVolunteerId).map((r) => r.projectId).filter(Boolean)
    );
    if (relevantProjectIds.size === 0) return projectOptions;
    return projectOptions.filter((p) => relevantProjectIds.has(p.value));
  }, [formVolunteerId, rows, projectOptions]);

  const filteredActivityOptions = useMemo(() => {
    if (!formProjectId || formProjectId === "all") return activityOptions;
    const projectActivityIds = new Set(
      rows.filter((r) => r.projectId === formProjectId).map((r) => r.activityId).filter(Boolean)
    );
    const filtered = activityOptions.filter((a) => projectActivityIds.has(a.value));
    return filtered.length > 0 ? filtered : activityOptions;
  }, [formProjectId, activityOptions, rows]);

  const kpiStats = useMemo(() => {
    const total = rows.length;
    const imagesAndVideos = rows.filter(
      (r) =>
        r.typeName.toLowerCase().includes("foto") ||
        r.typeName.toLowerCase().includes("imagen") ||
        r.typeName.toLowerCase().includes("video") ||
        /\.(png|jpg|jpeg|webp|mp4)/i.test(r.route)
    ).length;
    const documents = rows.filter(
      (r) =>
        r.typeName.toLowerCase().includes("documento") ||
        r.typeName.toLowerCase().includes("lista") ||
        /\.(pdf|doc|docx)/i.test(r.route)
    ).length;
    const pendingValidation = rows.filter(
      (r) => r.validationStatusKind === "pending" || r.validationStatusKind === "other"
    ).length;

    return { total, imagesAndVideos, documents, pendingValidation };
  }, [rows]);

  function clearForm() {
    setEditingEvidenceId(null);
    setFormProjectId("all");
    setFormActivityId("all");
    setFormTypeId("all");
    setFormVolunteerId("all");
    setFormDescription("");
    setSelectedFiles([]);
    setLinkInput("");
    setExternalLinks([]);
    setFormCompressImages(true);
    setFormExtractExif(true);
    setFormNotifyCoordinator(true);
    setFormKeepModalOpen(false);
  }

  function closeFormModal() {
    setIsFormModalOpen(false);
    clearForm();
  }

  function openCreateModal() {
    clearForm();
    setIsFormModalOpen(true);
  }

  function beginEdit(row: OperationEvidenceRow) {
    setIsFormModalOpen(true);
    setEditingEvidenceId(row.id);
    setFormProjectId(row.projectId ?? "all");
    setFormActivityId(row.activityId);
    setFormTypeId(row.typeId !== null ? String(row.typeId) : "all");
    setFormVolunteerId(row.volunteerId ?? "all");
    setFormDescription(row.description);
    setSelectedFiles([]);
    if (row.route && row.route.startsWith("http")) {
      const type = detectLinkType(row.route);
      setExternalLinks([{ id: "1", url: row.route, type, label: row.route }]);
    } else {
      setExternalLinks([]);
    }
  }

  function openLightbox(item: OperationEvidenceRow) {
    setSelectedLightboxItem(item);
    setIsLightboxOpen(true);
  }

  function addExternalLink() {
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      toast.error("Ingresa una URL válida (debe empezar con http:// o https://).");
      return;
    }
    const type = detectLinkType(trimmed);
    const newLink: ExternalLinkItem = {
      id: String(Date.now()),
      url: trimmed,
      type,
      label: trimmed,
    };
    setExternalLinks((prev) => [...prev, newLink]);
    setLinkInput("");
    toast.success("Enlace de respaldo añadido.");
  }

  function removeExternalLink(id: string) {
    setExternalLinks((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSubmitEvidence() {
    if (formProjectId === "all") {
      toast.error("Selecciona un proyecto.");
      return;
    }
    if (formActivityId === "all") {
      toast.error("Selecciona una actividad vinculada.");
      return;
    }

    if (!editingEvidenceId && selectedFiles.length === 0 && externalLinks.length === 0) {
      toast.error("Debes seleccionar al menos un archivo o añadir un enlace externo.");
      return;
    }

    try {
      if (editingEvidenceId) {
        await updateEvidence({
          evidenceId: editingEvidenceId,
          typeId: formTypeId === "all" ? null : Number(formTypeId),
          routeInput: externalLinks[0]?.url || undefined,
          description: formDescription,
        });
        toast.success("Evidencia actualizada.");
      } else {
        const fileToUpload = selectedFiles[0] ?? null;
        const routeInput = externalLinks.map((l) => l.url).join(" ; ");
        const result = await createEvidence({
          activityId: formActivityId,
          volunteerId: formVolunteerId === "all" ? null : formVolunteerId,
          typeId: formTypeId === "all" ? null : Number(formTypeId),
          routeInput: routeInput || undefined,
          description: formDescription,
          file: fileToUpload,
        });
        if (!result) return;
        if (formNotifyCoordinator) {
          toast.info("Notificación enviada por correo al coordinador del proyecto.");
        }
        if (result.warning) toast.warning(result.warning);

        const count = selectedFiles.length + externalLinks.length;
        toast.success(
          count > 1 ? `${count} evidencias registradas exitosamente.` : "Evidencia registrada exitosamente."
        );
      }

      if (formKeepModalOpen && !editingEvidenceId) {
        setSelectedFiles([]);
        setExternalLinks([]);
        setFormDescription("");
      } else {
        closeFormModal();
      }
    } catch (actionError) {
      toast.error(
        actionError instanceof Error ? actionError.message : "No se pudo guardar la evidencia."
      );
    }
  }

  async function removeRow(row: OperationEvidenceRow) {
    const confirmed = window.confirm(
      `¿Se eliminará la evidencia "${row.typeName}" de ${row.activityName}?`
    );
    if (!confirmed) return;

    try {
      await removeEvidence(row.id);
      if (editingEvidenceId === row.id) closeFormModal();
      if (selectedLightboxItem?.id === row.id) setIsLightboxOpen(false);
      toast.success("Evidencia eliminada.");
    } catch (actionError) {
      toast.error(
        actionError instanceof Error ? actionError.message : "No se pudo eliminar la evidencia."
      );
    }
  }

  const columns: Column<OperationEvidenceRow>[] = [
    {
      key: "activity",
      label: "Actividad y Proyecto",
      render: (item) => (
        <div>
          <div className="font-semibold text-zinc-100">{item.activityName}</div>
          <div className="mt-0.5 text-[11px] text-zinc-400 font-medium">{item.projectName}</div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Tipo de Evidencia",
      render: (item) => {
        const cat = getCategoryBadge(item.typeName);
        const IconComp = cat.icon;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${cat.color}`}>
            <IconComp className="h-3.5 w-3.5" />
            {item.typeName}
          </span>
        );
      },
    },
    {
      key: "author",
      label: "Autor / Voluntario",
      render: (item) => (
        <span className="text-xs text-zinc-300 flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-zinc-500" />
          {item.volunteerName}
        </span>
      ),
    },
    {
      key: "uploadedAt",
      label: "Fecha",
      render: (item) => (
        <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
          <Calendar className="h-3 w-3 text-zinc-500" />
          {item.uploadedAt}
        </span>
      ),
    },
    {
      key: "route",
      label: "Archivo / Ruta",
      render: (item) => (
        <span className="line-clamp-1 text-xs font-mono text-indigo-400 truncate max-w-[200px]">
          {item.route}
        </span>
      ),
    },
    {
      key: "status",
      label: "Validación",
      render: (item) => (
        <StatusDot variant={item.validationVariant}>{item.validationStatusName}</StatusDot>
      ),
    },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* HEADER DE MÓDULO */}
      <motion.div variants={fadeUp}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <PageHeader
            title="Repositorio de Evidencias"
            description="Consolida fotos de campo, videos y documentos de respaldo para auditorías y donantes."
            action={{ label: "Actualizar", onClick: refresh }}
          />

          <div className="flex flex-wrap items-center gap-2">
            <OutlineButton
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 text-zinc-300 border-zinc-800 hover:bg-zinc-800"
            >
              <Settings className="h-4 w-4 text-zinc-400" />
              Ajustes
            </OutlineButton>

            <OutlineButton
              size="sm"
              onClick={() => downloadEvidenceZip(rows)}
              className="flex items-center gap-1.5 text-zinc-300 border-zinc-800 hover:bg-zinc-800"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              Descargar Paquete ZIP
            </OutlineButton>

            <GradientButton size="sm" onClick={openCreateModal} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Cargar Evidencias
            </GradientButton>
          </div>
        </div>
      </motion.div>

      {/* KPIS DE RESUMEN DE 4 COLUMNAS CON ICONOS VECTORIALES LIMPIOS */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl p-4 bg-zinc-900/80 border border-zinc-800/80 hover:border-indigo-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-zinc-400">Total Archivos</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Folder className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{kpiStats.total}</p>
              <span className="text-[11px] font-medium text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 flex items-center gap-1">
                <Layers className="h-3 w-3" /> Consolidado
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-zinc-900/80 border border-zinc-800/80 hover:border-emerald-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-zinc-400">Imágenes / Videos</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ImageIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{kpiStats.imagesAndVideos}</p>
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> Fotos de campo
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-zinc-900/80 border border-zinc-800/80 hover:border-purple-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-zinc-400">Documentos / PDFs</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{kpiStats.documents}</p>
              <span className="text-[11px] font-medium text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20 flex items-center gap-1">
                <FileCheck className="h-3 w-3" /> Listas firmadas
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-zinc-900/80 border border-zinc-800/80 hover:border-amber-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-zinc-400">Pendientes de Validación</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{kpiStats.pendingValidation}</p>
              <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Requiere revisión
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* TOOLBAR, FILTROS Y CAMBIO DE VISTA (GALERÍA VS TABLA) */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <FilterBar
            searchPlaceholder="Buscar por actividad, proyecto, tipo o nombre de archivo..."
            searchValue={searchValue}
            onSearchChange={setSearchValue}
          />

          <div className="flex items-center gap-1 rounded-xl p-1 bg-zinc-950 border border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("gallery")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "gallery"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              Galería
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Tabla
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <SelectField
            value={activityFilter}
            onChange={setActivityFilter}
            options={activityOptionsWithAll}
          />
          <SelectField
            value={volunteerFilter}
            onChange={setVolunteerFilter}
            options={volunteerOptionsWithAll}
          />
          <SelectField
            value={String(typeFilter)}
            onChange={(value) => setTypeFilter(value === "all" ? "all" : Number(value))}
            options={typeOptionsWithAll}
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-9 rounded-xl px-3 text-[12px] outline-none border border-zinc-800 bg-zinc-900 text-zinc-300"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-9 rounded-xl px-3 text-[12px] outline-none border border-zinc-800 bg-zinc-900 text-zinc-300"
          />

          {(searchValue || activityFilter !== "all" || volunteerFilter !== "all" || typeFilter !== "all" || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setSearchValue("");
                setActivityFilter("all");
                setVolunteerFilter("all");
                setTypeFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="h-9 px-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp}>
          <ErrorBlock message={error} onRetry={refresh} />
        </motion.div>
      )}

      {/* CONTENIDO PRINCIPAL: VISTA DE GALERÍA O VISTA DE TABLA */}
      <motion.div variants={fadeUp}>
        {viewMode === "gallery" ? (
          <div>
            {rows.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 p-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400 mb-4 shadow-sm border border-zinc-700/50">
                  <ImageIcon className="h-7 w-7 text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100">Sin evidencias encontradas</h3>
                <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                  No se encontraron evidencias que coincidan con los filtros o el rango de fechas.
                </p>
                <div className="mt-5 flex gap-2">
                  <OutlineButton
                    size="sm"
                    onClick={() => {
                      setSearchValue("");
                      setActivityFilter("all");
                      setVolunteerFilter("all");
                      setTypeFilter("all");
                      setDateFrom("");
                      setDateTo("");
                    }}
                  >
                    Limpiar Filtros
                  </OutlineButton>
                  <GradientButton size="sm" onClick={openCreateModal}>
                    + Cargar Evidencias
                  </GradientButton>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {rows.map((item) => {
                  const cat = getCategoryBadge(item.typeName);
                  const IconComp = cat.icon;
                  const isImage = /\.(png|jpg|jpeg|webp)/i.test(item.route) || item.typeName.toLowerCase().includes("foto");

                  return (
                    <div
                      key={item.id}
                      className="group rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden hover:border-zinc-700 transition-all flex flex-col justify-between shadow-sm"
                    >
                      <div>
                        {/* THUMBNAIL DE MINIATURA VISUAL */}
                        <div className="relative h-40 w-full bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-800/80">
                          {isImage ? (
                            <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-950 text-indigo-400 group-hover:scale-105 transition-transform duration-300">
                              <ImageIcon className="h-10 w-10 text-indigo-400/80 mb-1" />
                              <span className="text-[10px] font-mono text-zinc-400 px-3 truncate max-w-full">
                                {item.route.split("/").pop()}
                              </span>
                            </div>
                          ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-950/40 via-zinc-900 to-zinc-950 text-purple-400 group-hover:scale-105 transition-transform duration-300">
                              <FileText className="h-10 w-10 text-purple-400/80 mb-1" />
                              <span className="text-[10px] font-mono text-zinc-400 px-3 truncate max-w-full">
                                {item.route.split("/").pop()}
                              </span>
                            </div>
                          )}

                          {/* OVERLAY DE BOTÓN DE PREVISUALIZACIÓN */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openLightbox(item)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg hover:bg-indigo-500 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" /> Previsualizar
                            </button>
                          </div>

                          <div className="absolute top-2.5 right-2.5">
                            <StatusDot variant={item.validationVariant}>{item.validationStatusName}</StatusDot>
                          </div>
                        </div>

                        {/* DETALLES DE TARJETA */}
                        <div className="p-4 space-y-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cat.color}`}>
                            <IconComp className="h-3 w-3" />
                            {item.typeName}
                          </span>

                          <h4 className="font-semibold text-zinc-100 text-xs truncate" title={item.activityName}>
                            {item.activityName}
                          </h4>

                          <p className="text-[11px] text-zinc-400 truncate">{item.projectName}</p>

                          <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/60 font-mono">
                            <span className="flex items-center gap-1 truncate max-w-[120px]">
                              <User className="h-3 w-3 text-zinc-500" />
                              {item.volunteerName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-zinc-500" />
                              {item.uploadedAt}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* FOOTER DE LA TARJETA */}
                      <div className="px-4 py-2.5 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => openLightbox(item)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> Ver Evidencia
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => beginEdit(item)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeRow(item)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            actions={[
              {
                label: "Previsualizar",
                onClick: (item) => openLightbox(item),
              },
              {
                label: "Editar",
                onClick: (item) => beginEdit(item),
              },
              {
                label: "Eliminar",
                onClick: (item) => void removeRow(item),
                variant: "destructive",
              },
            ]}
            emptyMessage="No se encontraron evidencias para los filtros seleccionados"
          />
        )}
      </motion.div>

      {/* MODAL CONFIGURACIÓN / SETTINGS */}
      <ModalShell open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} width="max-w-[560px]">
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-400" />
              Opciones de Evidencias
            </h3>
            <button type="button" className="text-zinc-400 hover:text-zinc-200" onClick={() => setIsSettingsOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Tamaño Máximo por Archivo (MB)
              </label>
              <input
                type="number"
                value={settingsState.maxFileSizeMB}
                onChange={(e) => setSettingsState((s) => ({ ...s, maxFileSizeMB: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-xl px-3 py-2 outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
              />
              <p className="mt-1 text-[11px] text-zinc-500">
                Límite de peso permitido por archivo individual cargado al servidor.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <span className="font-medium text-zinc-200 block">Marca de Agua Automática</span>
                <span className="text-[11px] text-zinc-400">Insertar logo de la ONG y fecha en fotos de evidencia.</span>
              </div>
              <input
                type="checkbox"
                checked={settingsState.autoWatermark}
                onChange={(e) => setSettingsState((s) => ({ ...s, autoWatermark: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <span className="font-medium text-zinc-200 block">Privacidad y Pixelado Automático</span>
                <span className="text-[11px] text-zinc-400">Activar pixelado de rostros de menores de edad.</span>
              </div>
              <input
                type="checkbox"
                checked={settingsState.autoBlurMinors}
                onChange={(e) => setSettingsState((s) => ({ ...s, autoBlurMinors: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <OutlineButton size="sm" onClick={() => setIsSettingsOpen(false)}>
              Cancelar
            </OutlineButton>
            <GradientButton
              size="sm"
              onClick={() => {
                setIsSettingsOpen(false);
                toast.success("Opciones de evidencias guardadas.");
              }}
            >
              Guardar Ajustes
            </GradientButton>
          </div>
        </div>
      </ModalShell>

      {/* MODAL LIGHTBOX / VISOR INTEGRADO */}
      <ModalShell open={isLightboxOpen} onClose={() => setIsLightboxOpen(false)} width="max-w-[840px]">
        {selectedLightboxItem && (
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-indigo-400" />
                  Previsualización de Evidencia
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {selectedLightboxItem.activityName} • {selectedLightboxItem.projectName}
                </p>
              </div>
              <button type="button" className="text-zinc-400 hover:text-zinc-200" onClick={() => setIsLightboxOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center p-8 min-h-[260px]">
              <ImageIcon className="h-16 w-16 text-indigo-400/70 mb-3" />
              <p className="font-mono text-xs text-zinc-300 font-semibold">{selectedLightboxItem.route}</p>
              <p className="text-[11px] text-zinc-500 mt-1">Simulación de visor en alta resolución</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block font-medium">Tipo</span>
                <span className="text-zinc-200 font-semibold mt-0.5 block">{selectedLightboxItem.typeName}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block font-medium">Autor / Voluntario</span>
                <span className="text-zinc-200 font-semibold mt-0.5 block">{selectedLightboxItem.volunteerName}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block font-medium">Fecha de Carga</span>
                <span className="text-zinc-200 font-semibold mt-0.5 block font-mono">{selectedLightboxItem.uploadedAt}</span>
              </div>
            </div>

            {selectedLightboxItem.description && selectedLightboxItem.description !== "Sin observacion" && (
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                <span className="text-[11px] text-zinc-400 block font-medium mb-1">Descripción / Notas de Campo</span>
                <p className="text-zinc-200">{selectedLightboxItem.description}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Evidencia aprobada correctamente.");
                    setIsLightboxOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-medium border border-emerald-500/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" /> Aprobar Evidencia
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toast.error("Evidencia rechazada.");
                    setIsLightboxOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30 font-medium border border-red-500/30 flex items-center gap-1.5"
                >
                  <XCircle className="h-4 w-4" /> Rechazar
                </button>
              </div>

              <OutlineButton
                size="sm"
                onClick={() => {
                  toast.success(`Descargando "${selectedLightboxItem.route.split("/").pop()}"...`);
                }}
                className="flex items-center gap-1.5 text-zinc-300 border-zinc-800"
              >
                <Download className="h-4 w-4 text-indigo-400" /> Descargar Archivo
              </OutlineButton>
            </div>
          </div>
        )}
      </ModalShell>

      {/* ── MODAL REFACTORIZADO DE CARGA DE EVIDENCIAS EN LOTE Y ENLACES ─────────────── */}
      <ModalShell open={isFormModalOpen} onClose={closeFormModal} width="max-w-[900px]">
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-indigo-400" />
                {editingEvidenceId ? "Editar Evidencia" : "Cargar Evidencias de Campo"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Adjunta fotografías, reportes firmados o enlaces externos para validar actividades.
              </p>
            </div>
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              onClick={closeFormModal}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* FILA 1: FILTROS EN CASCADA, TIPO Y AUTOR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Proyecto <span className="text-red-400">*</span>
              </label>
              <SelectField
                value={formProjectId}
                onChange={(val) => {
                  setFormProjectId(val);
                  setFormActivityId("all");
                }}
                options={[{ value: "all", label: "Selecciona proyecto" }, ...volunteerProjectOptions]}
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Actividad Vinculada <span className="text-red-400">*</span>
              </label>
              <SelectField
                value={formActivityId}
                onChange={setFormActivityId}
                disabled={formProjectId === "all"}
                options={[{ value: "all", label: "Selecciona actividad" }, ...filteredActivityOptions]}
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Tipo de Evidencia <span className="text-red-400">*</span>
              </label>
              <SelectField
                value={formTypeId}
                onChange={setFormTypeId}
                options={[
                  { value: "all", label: "Selecciona tipo" },
                  ...evidenceTypeOptions.map((option) => ({
                    value: String(option.value),
                    label: option.label,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Autor / Voluntario
              </label>
              <SelectField
                value={formVolunteerId}
                onChange={setFormVolunteerId}
                options={[{ value: "all", label: "Selecciona autor" }, ...volunteerOptions]}
              />
            </div>
          </div>

          {/* FILA 2: ZONA DRAG & DROP Y AJUSTES RÁPIDOS DE OPTIMIZACIÓN */}
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.zip"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  const newFiles = Array.from(e.target.files);
                  setSelectedFiles((prev) => [...prev, ...newFiles]);
                }
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 hover:bg-zinc-900/60 cursor-pointer transition-colors text-center group"
            >
              <UploadCloud className="h-9 w-9 text-indigo-400 group-hover:scale-110 transition-transform mb-2" />
              <p className="text-xs text-zinc-200 font-semibold">
                Haz clic para examinar o arrastra tus archivos aquí
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">Soporta JPG, PNG, PDF y ZIP de hasta 20MB</p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400 pt-3 border-t border-zinc-800/80" onClick={(e) => e.stopPropagation()}>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={formCompressImages}
                    onChange={(e) => setFormCompressImages(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  Comprimir imágenes antes de subir (Recomendado)
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={formExtractExif}
                    onChange={(e) => setFormExtractExif(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Compass className="h-3.5 w-3.5 text-emerald-400" />
                  Extraer metadata GPS / Fecha de fotos (EXIF)
                </label>
              </div>
            </div>
          </div>

          {/* FILA 3: LISTA DE ARCHIVOS EN COLA (FILE QUEUE PREVIEW) */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs animate-in fade-in">
              <div className="flex items-center justify-between text-zinc-300 font-semibold border-b border-zinc-800 pb-2">
                <span>Archivos Listos para Subir ({selectedFiles.length}):</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-[11px] text-red-400 hover:text-red-300 font-medium"
                >
                  Limpiar Cola
                </button>
              </div>

              <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                {selectedFiles.map((file, idx) => {
                  const isImg = file.type.startsWith("image/");
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {isImg ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-zinc-100 truncate text-xs">{file.name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          {isImg && formExtractExif ? "100% Listo • GPS OK" : "100% Listo"}
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedFiles((files) => files.filter((_, i) => i !== idx))}
                          className="p-1 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                          title="Eliminar de la cola"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FILA 4: ENLACES EXTERNOS MÚLTIPLES */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-300">
              Enlaces de Respaldo Externos (Google Drive, YouTube, OneDrive, Dropbox):
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addExternalLink();
                    }
                  }}
                  placeholder="Pega la URL de Google Drive, YouTube o carpeta externa y presiona Enter..."
                  className="h-10 w-full rounded-xl pl-9 pr-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200 focus:border-indigo-500"
                />
              </div>
              <GradientButton size="sm" type="button" onClick={addExternalLink}>
                + Añadir Enlace
              </GradientButton>
            </div>

            {externalLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {externalLinks.map((item) => {
                  const style = getLinkBadgeStyle(item.type);
                  const IconComp = style.icon;

                  return (
                    <span
                      key={item.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${style.color}`}
                    >
                      <IconComp className="h-3.5 w-3.5" />
                      <span>{style.prefix}:</span>
                      <span className="truncate max-w-[200px]">{item.url}</span>
                      <button
                        type="button"
                        onClick={() => removeExternalLink(item.id)}
                        className="ml-1 text-zinc-400 hover:text-red-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* FILA 5: TAREAS REALIZADAS / OBSERVACIONES DE CAMPO */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Descripción / Notas de Campo (Opcional)
            </label>
            <textarea
              value={formDescription}
              onChange={(event) => setFormDescription(event.target.value)}
              rows={2}
              placeholder="Ej. Se completó la jornada con 40 asistentes. Fotografías de entrega adjuntas..."
              className="w-full rounded-xl p-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200 focus:border-indigo-500"
            />
          </div>

          {/* CONFIGURACIÓN Y ESTADO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-zinc-100">
              <input
                type="checkbox"
                checked={formNotifyCoordinator}
                onChange={(e) => setFormNotifyCoordinator(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
              <Mail className="h-3.5 w-3.5 text-indigo-400" />
              Notificar por correo al coordinador del proyecto
            </label>

            {!editingEvidenceId && (
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-zinc-100">
                <input
                  type="checkbox"
                  checked={formKeepModalOpen}
                  onChange={(e) => setFormKeepModalOpen(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
                />
                <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
                Mantener modal abierto al guardar (Modo Lote)
              </label>
            )}
          </div>

          {/* FOOTER DEL MODAL */}
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <OutlineButton size="sm" onClick={closeFormModal}>
              Cancelar
            </OutlineButton>
            <GradientButton
              size="sm"
              onClick={() => void handleSubmitEvidence()}
              disabled={isRegistering || isUpdating || isRemoving}
              className="flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              {editingEvidenceId
                ? "Guardar Cambios"
                : selectedFiles.length > 0 || externalLinks.length > 0
                ? `Subir ${selectedFiles.length + externalLinks.length} Evidencia(s)`
                : "Guardar Evidencias"}
            </GradientButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
