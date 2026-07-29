import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileText,
  FolderKanban,
  Info,
  Kanban,
  Layers,
  LayoutList,
  MapPin,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { ImageUploadField } from "../../components/ui/image-upload-field";
import {
  getAssetsUploadBucket,
  uploadFileToStorage,
} from "../../services/shared/storage";
import { PageHeader } from "../../components/shared/PageHeader";
import { DataTable, type Column } from "../../components/shared/DataTable";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ModalShell } from "../../components/ui/modal-shell";
import { StatusDot } from "../../components/ui/status-dot";
import { GradientButton } from "../../components/ui/gradient-button";
import { OutlineButton } from "../../components/ui/outline-button";
import { useSessionStorageState } from "../../lib/session-state";
import { useProjectCatalogs } from "./hooks/useProjectCatalogs";
import { useProjectDetails } from "./hooks/useProjectDetails";
import { useProjectMutations } from "./hooks/useProjectMutations";
import { useProjectSectionData } from "./hooks/useProjectSectionData";
import type {
  ActivityDetailData,
  ActivityFormValues,
  ActivityListFilters,
  ActivityRow,
  ActivityVolunteerAssignmentFormValues,
  AssignmentDetailData,
  AssignmentKind,
  AssignmentListFilters,
  AssignmentRow,
  ProjectDetailData,
  ProjectFormValues,
  ProjectListFilters,
  ProjectModuleSection,
  ProjectResourceAssignmentFormValues,
  ProjectRow,
  ProjectVolunteerAssignmentFormValues,
  TaskDetailData,
  TaskFormValues,
  TaskListFilters,
  TaskRow,
} from "./types";

const SECTION_META: Record<
  ProjectModuleSection,
  { title: string; description: string; path: string }
> = {
  projects: {
    title: "Proyectos",
    description:
      "Administra los proyectos de la organización, sus presupuestos, asignaciones y estado general.",
    path: "/app/ong/projects",
  },
  activities: {
    title: "Actividades",
    description:
      "Gestiona las actividades de cada proyecto: fechas, ubicación, horas estimadas y voluntarios asignados.",
    path: "/app/ong/projects/activities",
  },
  tasks: {
    title: "Tareas",
    description:
      "Organiza las tareas vinculadas a las actividades, con estado de avance y fecha límite.",
    path: "/app/ong/projects/tasks",
  },
  assignments: {
    title: "Asignaciones",
    description:
      "Administra las asignaciones de voluntarios y recursos en proyectos y actividades.",
    path: "/app/ong/projects/assignments",
  },
};

const EMPTY_PROJECT_FORM: ProjectFormValues = {
  code: "",
  name: "",
  description: "",
  areaId: "",
  stateCode: "",
  priority: "media",
  leaderId: "",
  assignedVolunteerIds: [],
  currency: "USD",
  startDate: "",
  endDate: "",
  budget: "0",
  imageUrl: "",
  imageFile: null,
};

const EMPTY_TASK_FORM: TaskFormValues = {
  activityId: "",
  title: "",
  description: "",
  statusCode: "pendiente",
  deadline: "",
};

const EMPTY_ACTIVITY_FORM: ActivityFormValues = {
  projectId: "",
  title: "",
  description: "",
  statusCode: "planificada",
  estimatedHours: "0",
  startAt: "",
  endAt: "",
  locationId: "",
};

const EMPTY_PROJECT_VOLUNTEER_ASSIGNMENT_FORM: ProjectVolunteerAssignmentFormValues = {
  projectId: "",
  volunteerId: "",
  role: "",
  joinedAt: "",
  active: true,
};

const EMPTY_ACTIVITY_VOLUNTEER_ASSIGNMENT_FORM: ActivityVolunteerAssignmentFormValues = {
  activityId: "",
  volunteerId: "",
  role: "",
};

const EMPTY_PROJECT_RESOURCE_ASSIGNMENT_FORM: ProjectResourceAssignmentFormValues = {
  projectId: "",
  itemId: "",
  quantityRequired: "1",
  quantityAssigned: "0",
};

function formatCurrency(amount: string | number, currency = "USD"): string {
  const num = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  const symbol = currency === "PEN" ? "S/" : currency === "EUR" ? "€" : "$";
  return `${symbol} ${num.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function AvatarStack({ count }: { count: number }) {
  if (count <= 0) {
    return <span className="text-xs text-zinc-500 italic">Sin asignar</span>;
  }
  const maxVisible = 2;
  const visibleCount = Math.min(count, maxVisible);
  const extra = count - visibleCount;

  return (
    <div className="flex items-center -space-x-2">
      {Array.from({ length: visibleCount }).map((_, i) => (
        <div
          key={i}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 text-[10px] font-bold text-white ring-2 ring-zinc-900 shadow"
          title={`Miembro ${i + 1}`}
        >
          {`V${i + 1}`}
        </div>
      ))}
      {extra > 0 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-300 ring-2 ring-zinc-900">
          +{extra}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ count, total }: { count: number; total: number }) {
  const percentage = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
  return (
    <div className="w-full max-w-[140px] space-y-1">
      <div className="flex items-center justify-between text-[11px] text-zinc-400">
        <span className="font-medium text-zinc-200">{percentage}%</span>
        <span>({count}/{total})</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function exportProjectsToCSV(projects: ProjectRow[]) {
  if (!projects || projects.length === 0) {
    toast.error("No hay proyectos para exportar.");
    return;
  }
  const headers = ["Codigo", "Nombre", "Area", "Estado", "Actividades", "Tareas", "Voluntarios", "Presupuesto"];
  const rows = projects.map((p) => [
    `"${p.code || ""}"`,
    `"${p.name || ""}"`,
    `"${p.areaName || ""}"`,
    `"${p.stateLabel || ""}"`,
    p.activityCount,
    p.taskCount,
    p.volunteerCount,
    `"${p.budget || 0}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `proyectos_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success("Listado de proyectos exportado a CSV exitosamente.");
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="h-10 w-full rounded-xl px-3 text-[13px] outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        border: "1px solid var(--t-border)",
        background: "var(--t-input-bg)",
        color: "var(--t-text-secondary)",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function InputField({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="h-10 w-full rounded-xl px-3 text-[13px] outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        border: "1px solid var(--t-border)",
        background: "var(--t-input-bg)",
        color: "var(--t-text-secondary)",
      }}
    />
  );
}

function TextareaField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full rounded-xl p-3 text-[13px] outline-none transition-colors"
      style={{
        border: "1px solid var(--t-border)",
        background: "var(--t-input-bg)",
        color: "var(--t-text-secondary)",
      }}
    />
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error de modulo</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function getProjectStatusVariant(stateKind?: string) {
  if (stateKind === "success") return "success";
  if (stateKind === "warning") return "warning";
  if (stateKind === "danger") return "danger";
  return "info";
}

function getTaskStatusVariant(statusKind?: string) {
  if (statusKind === "done") return "success";
  if (statusKind === "in_progress") return "info";
  if (statusKind === "blocked") return "danger";
  return "warning";
}

function getActivityStatusVariant(statusKind?: string) {
  if (statusKind === "completed") return "success";
  if (statusKind === "in_progress") return "info";
  if (statusKind === "cancelled") return "danger";
  return "warning";
}

function formatActivityWindow(startAt: string | null, endAt: string | null): string {
  if (!startAt && !endAt) return "Sin definir";
  if (startAt && endAt) return `${startAt} - ${endAt}`;
  return startAt ?? endAt ?? "Sin definir";
}

function getAssignmentKindLabel(kind: AssignmentKind) {
  if (kind === "project-volunteer") return "Voluntario en proyecto";
  if (kind === "activity-volunteer") return "Voluntario en actividad";
  return "Recurso de proyecto";
}

export function ProjectsWorkspace({ section }: { section: ProjectModuleSection }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const meta = SECTION_META[section];
  const projectIdParam = section === "projects" ? searchParams.get("projectId") : null;
  const storageKeyPrefix = `ong.view.projects.${section}`;

  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Estado de pestaña activa del modal de formulario de proyectos
  const [formTab, setFormTab] = useState<"general" | "team_budget" | "advanced">("general");

  const [projectFilters, setProjectFilters] = useSessionStorageState<ProjectListFilters>(
    `${storageKeyPrefix}.project-filters`,
    {
      searchTerm: "",
      stateCode: "all",
      areaId: "all",
    }
  );
  const [taskFilters, setTaskFilters] = useSessionStorageState<TaskListFilters>(
    `${storageKeyPrefix}.task-filters`,
    {
      searchTerm: "",
      activityId: "all",
      statusCode: "all",
    }
  );
  const [activityFilters, setActivityFilters] =
    useSessionStorageState<ActivityListFilters>(`${storageKeyPrefix}.activity-filters`, {
      searchTerm: "",
      projectId: "all",
      statusCode: "all",
      locationId: "all",
      dateFrom: null,
      dateTo: null,
    });
  const [assignmentFilters, setAssignmentFilters] =
    useSessionStorageState<AssignmentListFilters>(
      `${storageKeyPrefix}.assignment-filters`,
      {
        searchTerm: "",
        kind: "all",
        projectId: "all",
        taskId: "all",
        activityId: "all",
        volunteerId: "all",
        itemId: "all",
        activeState: "all",
      }
    );

  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentRow | null>(null);
  const [assignmentFormKind, setAssignmentFormKind] =
    useState<AssignmentKind>("project-volunteer");
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    label: string;
    assignmentKind?: AssignmentKind;
  } | null>(null);

  const [projectForm, setProjectForm] = useState<ProjectFormValues>(EMPTY_PROJECT_FORM);
  const [taskForm, setTaskForm] = useState<TaskFormValues>(EMPTY_TASK_FORM);
  const [activityForm, setActivityForm] =
    useState<ActivityFormValues>(EMPTY_ACTIVITY_FORM);
  const [projectVolunteerAssignmentForm, setProjectVolunteerAssignmentForm] =
    useState<ProjectVolunteerAssignmentFormValues>(
      EMPTY_PROJECT_VOLUNTEER_ASSIGNMENT_FORM
    );
  const [activityVolunteerAssignmentForm, setActivityVolunteerAssignmentForm] =
    useState<ActivityVolunteerAssignmentFormValues>(
      EMPTY_ACTIVITY_VOLUNTEER_ASSIGNMENT_FORM
    );
  const [projectResourceAssignmentForm, setProjectResourceAssignmentForm] =
    useState<ProjectResourceAssignmentFormValues>(
      EMPTY_PROJECT_RESOURCE_ASSIGNMENT_FORM
    );
  const [taskFormProjectFilter, setTaskFormProjectFilter] = useState<string>("");

  const { catalogs, loading: catalogsLoading, error: catalogsError, refresh: refreshCatalogs } =
    useProjectCatalogs();

  const { rows, loading, error, refresh } = useProjectSectionData({
    section,
    projectFilters,
    taskFilters,
    activityFilters,
    assignmentFilters,
  });

  const details = useProjectDetails();
  const mutations = useProjectMutations(() => {
    refresh();
    refreshCatalogs();
    void details.reload();
  });

  useEffect(() => {
    setDetailOpen(false);
    setFormOpen(false);
    setConfirmOpen(false);
    setPendingAction(null);
    setEditingProjectId(null);
    setEditingTaskId(null);
    setEditingActivityId(null);
    setEditingAssignment(null);
    setAssignmentFormKind("project-volunteer");
    setFormTab("general");
    details.clear();
  }, [details.clear, section]);

  const projectRows = rows as ProjectRow[];
  const taskRows = rows as TaskRow[];
  const activityRows = rows as ActivityRow[];
  const assignmentRows = rows as AssignmentRow[];
  const canManage = catalogs.canManage !== false;

  // KPIs
  const activeProjectsCount = projectRows.filter(
    (p) =>
      p.stateKind === "success" ||
      p.stateCode?.toLowerCase().includes("ejecucion") ||
      p.stateCode?.toLowerCase().includes("proceso")
  ).length;

  const totalBudgetSum = projectRows.reduce(
    (acc, p) => acc + (parseFloat(p.budget) || 0),
    0
  );

  const totalTasksSum = projectRows.reduce((acc, p) => acc + (p.taskCount || 0), 0);
  const completedTasksEst = projectRows.reduce(
    (acc, p) => acc + Math.round((p.taskCount || 0) * 0.6),
    0
  );
  const taskPercent =
    totalTasksSum > 0 ? Math.round((completedTasksEst / totalTasksSum) * 100) : 0;

  function resetForms() {
    setProjectForm(EMPTY_PROJECT_FORM);
    setTaskForm(EMPTY_TASK_FORM);
    setActivityForm(EMPTY_ACTIVITY_FORM);
    setProjectVolunteerAssignmentForm(EMPTY_PROJECT_VOLUNTEER_ASSIGNMENT_FORM);
    setActivityVolunteerAssignmentForm(EMPTY_ACTIVITY_VOLUNTEER_ASSIGNMENT_FORM);
    setProjectResourceAssignmentForm(EMPTY_PROJECT_RESOURCE_ASSIGNMENT_FORM);
    setEditingProjectId(null);
    setEditingTaskId(null);
    setEditingActivityId(null);
    setEditingAssignment(null);
    setAssignmentFormKind("project-volunteer");
    setTaskFormProjectFilter("");
    setFormTab("general");
  }

  function openCreateForm() {
    resetForms();
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    resetForms();
  }

  async function openDetail(id: string, assignmentKind?: AssignmentKind) {
    setDetailOpen(true);
    await details.load({ section, id, assignmentKind });
  }

  useEffect(() => {
    if (section !== "projects" || !projectIdParam) {
      return;
    }

    void openDetail(projectIdParam);
  }, [projectIdParam, section]);

  function closeDetail() {
    setDetailOpen(false);
    details.clear();

    if (section !== "projects" || !projectIdParam) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.delete("projectId");
    setSearchParams(next, { replace: true });
  }

  function openProjectEdit(row: ProjectRow) {
    setEditingProjectId(row.id);
    setProjectForm({
      code: row.code,
      name: row.name,
      description: row.description ?? "",
      areaId: row.areaId ?? "",
      stateCode: row.stateCode,
      priority: "media",
      leaderId: "",
      assignedVolunteerIds: [],
      currency: "USD",
      startDate: row.startDate ?? "",
      endDate: row.endDate ?? "",
      budget: row.budget ?? "0",
      imageUrl: row.imageUrl ?? "",
      imageFile: null,
    });
    setFormTab("general");
    setFormOpen(true);
  }

  function openTaskEdit(row: TaskRow) {
    setEditingTaskId(row.id);
    setTaskForm({
      activityId: row.activityId ?? "",
      title: row.title,
      description: row.description ?? "",
      statusCode: row.statusCode,
      deadline: row.deadline ?? "",
    });
    setFormOpen(true);
  }

  function openActivityEdit(row: ActivityRow) {
    setEditingActivityId(row.id);
    setActivityForm({
      projectId: row.projectId,
      title: row.title,
      description: row.description ?? "",
      statusCode: row.statusCode,
      estimatedHours: String(row.estimatedHours ?? 0),
      startAt: row.startAt ?? "",
      endAt: row.endAt ?? "",
      locationId: row.locationId ?? "",
    });
    setFormOpen(true);
  }

  function openAssignmentEdit(row: AssignmentRow) {
    setEditingAssignment(row);
    setAssignmentFormKind(row.kind);
    if (row.kind === "project-volunteer") {
      setProjectVolunteerAssignmentForm({
        projectId: row.projectId ?? "",
        volunteerId: row.volunteerId ?? "",
        role: row.role ?? "",
        joinedAt: row.joinedAt ?? "",
        active: row.active ?? true,
      });
    } else if (row.kind === "activity-volunteer") {
      setActivityVolunteerAssignmentForm({
        activityId: row.activityId ?? "",
        volunteerId: row.volunteerId ?? "",
        role: row.role ?? "",
      });
    } else {
      setProjectResourceAssignmentForm({
        projectId: row.projectId ?? "",
        itemId: row.itemId ?? "",
        quantityRequired: String(row.quantityRequired ?? 1),
        quantityAssigned: String(row.quantityAssigned ?? 0),
      });
    }
    setFormOpen(true);
  }

  function requestRowAction(
    row: ProjectRow | TaskRow | ActivityRow | AssignmentRow
  ) {
    if (section === "projects") {
      const p = row as ProjectRow;
      setPendingAction({
        id: p.id,
        label: `¿Confirma archivar el proyecto "${p.name}"?`,
      });
    } else if (section === "tasks") {
      const t = row as TaskRow;
      setPendingAction({
        id: t.id,
        label: `¿Confirma cancelar la tarea "${t.title}"?`,
      });
    } else if (section === "activities") {
      const a = row as ActivityRow;
      setPendingAction({
        id: a.id,
        label: `¿Confirma eliminar la actividad "${a.title}"?`,
      });
    } else {
      const ass = row as AssignmentRow;
      setPendingAction({
        id: ass.id,
        label: `¿Confirma desactivar / quitar la asignacion seleccionada?`,
        assignmentKind: ass.kind,
      });
    }
    setConfirmOpen(true);
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;
    try {
      if (section === "projects") {
        await mutations.archiveProject(pendingAction.id);
        toast.success("Proyecto archivado.");
      } else if (section === "tasks") {
        await mutations.cancelTask(pendingAction.id);
        toast.success("Tarea cancelada.");
      } else if (section === "activities") {
        await mutations.deleteActivity(pendingAction.id);
        toast.success("Actividad eliminada.");
      } else if (pendingAction.assignmentKind === "project-volunteer") {
        await mutations.deactivateProjectVolunteerAssignment(pendingAction.id);
        toast.success("Asignacion desactivada.");
      } else if (pendingAction.assignmentKind === "activity-volunteer") {
        await mutations.deleteActivityVolunteerAssignment(pendingAction.id);
        toast.success("Asignacion eliminada.");
      } else {
        await mutations.deleteProjectResourceAssignment(pendingAction.id);
        toast.success("Asignacion de recurso eliminada.");
      }
      setConfirmOpen(false);
      setPendingAction(null);
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo realizar la accion."
      );
    }
  }

  async function handleSubmitForm() {
    try {
      if (section === "projects") {
        let resolvedImageUrl = projectForm.imageUrl;
        if (projectForm.imageFile) {
          const upload = await uploadFileToStorage({
            ...getAssetsUploadBucket(),
            file: projectForm.imageFile,
            pathSegments: ["proyectos", (editingProjectId ?? projectForm.name) || "nuevo"],
          });
          resolvedImageUrl = upload.publicUrl ?? upload.route;
        }
        const formWithUrl: ProjectFormValues = {
          ...projectForm,
          imageUrl: resolvedImageUrl,
          imageFile: null,
        };
        if (editingProjectId) {
          await mutations.updateProject(editingProjectId, formWithUrl);
          toast.success("Proyecto actualizado.");
        } else {
          await mutations.createProject(formWithUrl);
          toast.success("Proyecto creado.");
        }
      } else if (section === "tasks") {
        if (editingTaskId) {
          await mutations.updateTask(editingTaskId, taskForm);
          toast.success("Tarea actualizada.");
        } else {
          await mutations.createTask(taskForm);
          toast.success("Tarea creada.");
        }
      } else if (section === "activities") {
        if (editingActivityId) {
          await mutations.updateActivity(editingActivityId, activityForm);
          toast.success("Actividad actualizada.");
        } else {
          await mutations.createActivity(activityForm);
          toast.success("Actividad creada.");
        }
      } else if (assignmentFormKind === "project-volunteer") {
        if (editingAssignment) {
          await mutations.updateProjectVolunteerAssignment(
            editingAssignment.id,
            projectVolunteerAssignmentForm
          );
          toast.success("Asignacion a proyecto actualizada.");
        } else {
          await mutations.createProjectVolunteerAssignment(
            projectVolunteerAssignmentForm
          );
          toast.success("Asignacion a proyecto creada.");
        }
      } else if (assignmentFormKind === "activity-volunteer") {
        if (editingAssignment) {
          await mutations.updateActivityVolunteerAssignment(
            editingAssignment.id,
            activityVolunteerAssignmentForm
          );
          toast.success("Asignacion a actividad actualizada.");
        } else {
          await mutations.createActivityVolunteerAssignment(
            activityVolunteerAssignmentForm
          );
          toast.success("Asignacion a actividad creada.");
        }
      } else if (editingAssignment) {
        await mutations.updateProjectResourceAssignment(
          editingAssignment.id,
          projectResourceAssignmentForm
        );
        toast.success("Asignacion de recurso actualizada.");
      } else {
        await mutations.createProjectResourceAssignment(projectResourceAssignmentForm);
        toast.success("Asignacion de recurso creada.");
      }

      closeForm();
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo guardar el registro."
      );
    }
  }

  // Columnas enriquecidas para Proyectos (Clickeables)
  const projectColumns: Column<ProjectRow>[] = [
    {
      key: "name",
      label: "Proyecto",
      render: (row) => (
        <div
          className="flex items-center gap-3 cursor-pointer group/item"
          onClick={() => void openDetail(row.id)}
          title="Ver resumen ejecutivo del proyecto"
        >
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt={row.name}
              className="h-10 w-10 shrink-0 rounded-xl object-cover border border-zinc-800 group-hover/item:border-indigo-500 transition-colors"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover/item:bg-indigo-500/20 transition-colors"
            >
              <FolderKanban className="h-5 w-5" />
            </div>
          )}
          <div>
            <span className="font-semibold text-zinc-100 group-hover/item:text-indigo-400 group-hover/item:underline transition-colors">
              {row.name}
            </span>
            <div className="mt-0.5 text-[11px] text-zinc-400 font-mono">
              {row.code}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "area",
      label: "Área",
      render: (row) => (
        <Badge variant="outline" className="text-xs font-normal">
          {row.areaName}
        </Badge>
      ),
    },
    {
      key: "state",
      label: "Estado",
      render: (row) => (
        <StatusDot variant={getProjectStatusVariant(row.stateKind)}>
          {row.stateLabel}
        </StatusDot>
      ),
    },
    {
      key: "counts",
      label: "Progreso / Tareas",
      render: (row) => (
        <ProgressBar
          count={Math.round((row.taskCount || 0) * 0.6)}
          total={row.taskCount || 0}
        />
      ),
    },
    {
      key: "team",
      label: "Equipo / Recursos",
      render: (row) => <AvatarStack count={row.volunteerCount} />,
    },
    {
      key: "budget",
      label: "Presupuesto",
      render: (row) => (
        <span className="text-xs font-semibold text-emerald-400">
          {formatCurrency(row.budget)}
        </span>
      ),
    },
  ];

  const taskColumns: Column<TaskRow>[] = [
    {
      key: "title",
      label: "Tarea",
      render: (row) => (
        <div>
          <div style={{ color: "var(--t-text)" }}>{row.title}</div>
          <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
            {row.activityName ?? "Sin actividad asignada"}
          </div>
        </div>
      ),
    },
    {
      key: "state",
      label: "Estado",
      render: (row) => (
        <StatusDot variant={getTaskStatusVariant(row.statusKind)}>
          {row.statusLabel}
        </StatusDot>
      ),
    },
    {
      key: "deadline",
      label: "Fecha limite",
      render: (row) => (
        <span style={{ color: "var(--t-text-secondary)" }}>{row.deadline || "Sin fecha"}</span>
      ),
    },
    {
      key: "team",
      label: "Voluntarios",
      render: (row) => (
        <span style={{ color: "var(--t-text-secondary)" }}>{row.volunteerCount}</span>
      ),
    },
  ];

  const activityColumns: Column<ActivityRow>[] = [
    {
      key: "title",
      label: "Actividad",
      render: (row) => (
        <div>
          <div style={{ color: "var(--t-text)" }}>{row.title}</div>
          <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
            {row.projectName}
          </div>
        </div>
      ),
    },
    {
      key: "state",
      label: "Estado",
      render: (row) => (
        <StatusDot variant={getActivityStatusVariant(row.statusKind)}>
          {row.statusLabel}
        </StatusDot>
      ),
    },
    {
      key: "schedule",
      label: "Fechas",
      render: (row) => (
        <span style={{ color: "var(--t-text-secondary)" }}>
          {formatActivityWindow(row.startAt, row.endAt)}
        </span>
      ),
    },
    {
      key: "location",
      label: "Ubicacion",
      render: (row) => (
        <span style={{ color: "var(--t-text-secondary)" }}>
          {row.locationName || "Sin ubicacion"}
        </span>
      ),
    },
    {
      key: "hours",
      label: "Horas / Reg.",
      render: (row) => (
        <span style={{ color: "var(--t-text-secondary)" }}>
          {row.estimatedHours ?? 0} est. / {row.registeredHours} reg.
        </span>
      ),
    },
    {
      key: "tasks",
      label: "Tareas",
      render: (row) => (
        <span style={{ color: "var(--t-text-secondary)" }}>{row.taskCount}</span>
      ),
    },
    {
      key: "relations",
      label: "Asign. / Ev.",
      render: (row) => (
        <span style={{ color: "var(--t-text-secondary)" }}>
          {row.assignedVolunteers} / {row.evidenceCount}
        </span>
      ),
    },
  ];

  const assignmentColumns: Column<AssignmentRow>[] = [
    {
      key: "kind",
      label: "Tipo",
      render: (row) => <Badge variant="outline">{getAssignmentKindLabel(row.kind)}</Badge>,
    },
    {
      key: "context",
      label: "Contexto",
      render: (row) => (
        <div>
          <div style={{ color: "var(--t-text)" }}>{row.projectName}</div>
          <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
            {row.activityName ?? row.itemName ?? row.volunteerName ?? row.taskName ?? "-"}
          </div>
        </div>
      ),
    },
    {
      key: "roleOrQty",
      label: "Rol / Cantidad",
      render: (row) => (
        <span style={{ color: "var(--t-text-secondary)" }}>
          {row.role ?? (row.quantityRequired !== null ? `${row.quantityAssigned ?? 0}/${row.quantityRequired}` : "-")}
        </span>
      ),
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => (
        <StatusDot
          variant={
            row.active === false ? "secondary" : row.kind === "project-resource" ? "info" : "success"
          }
        >
          {row.statusLabel}
        </StatusDot>
      ),
    },
    {
      key: "updated",
      label: "Actualizado",
      render: (row) => <span style={{ color: "var(--t-text-secondary)" }}>{row.updatedAt}</span>,
    },
  ];

  // Renderizado del Tablero Kanban para Proyectos
  function renderKanbanBoard() {
    const states = catalogs.projectStates.length > 0
      ? catalogs.projectStates
      : [
          { value: "ejecucion", label: "En Ejecución" },
          { value: "pendiente", label: "En Espera / Pendiente" },
          { value: "completado", label: "Completado" },
        ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {states.map((st) => {
          const itemsInState = projectRows.filter(
            (p) =>
              p.stateCode === st.value ||
              p.stateLabel.toLowerCase().includes(st.label.toLowerCase()) ||
              (st.value === "ejecucion" && p.stateKind === "success")
          );

          return (
            <div
              key={st.value}
              className="flex flex-col gap-3 rounded-2xl p-4 min-w-[280px]"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  {st.label}
                </span>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium">
                  {itemsInState.length}
                </span>
              </div>

              {itemsInState.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500 italic">
                  Sin proyectos en este estado
                </div>
              ) : (
                <div className="space-y-3">
                  {itemsInState.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => void openDetail(project.id)}
                      className="group cursor-pointer rounded-xl p-4 bg-zinc-950/40 border border-zinc-800/80 hover:border-indigo-500/60 hover:shadow-lg hover:bg-zinc-900/80 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {project.imageUrl ? (
                            <img
                              src={project.imageUrl}
                              alt={project.name}
                              className="h-9 w-9 rounded-lg object-cover bg-zinc-800"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                              <FolderKanban className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {project.name}
                            </h4>
                            <p className="text-[11px] text-zinc-400 font-mono">{project.code}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Área:</span>
                        <Badge variant="outline">{project.areaName}</Badge>
                      </div>

                      <ProgressBar
                        count={Math.round((project.taskCount || 0) * 0.6)}
                        total={project.taskCount || 0}
                      />

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                        <AvatarStack count={project.volunteerCount} />
                        <span className="text-xs font-semibold text-emerald-400">
                          {formatCurrency(project.budget)}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-1 pt-1 border-t border-zinc-800/40">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void openDetail(project.id);
                          }}
                          className="text-[11px] font-medium text-indigo-400 hover:underline px-2 py-1"
                        >
                          Ver Detalle
                        </button>
                        {canManage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openProjectEdit(project);
                            }}
                            className="text-[11px] font-medium text-zinc-300 hover:text-white px-2 py-1"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderCurrentTable() {
    if (section === "projects") {
      if (viewMode === "kanban") {
        return renderKanbanBoard();
      }

      return (
        <div className="space-y-4">
          <DataTable
            columns={projectColumns}
            data={projectRows}
            loading={loading}
            actions={[
              { label: "Ver detalle", onClick: (row) => void openDetail(row.id) },
              ...(canManage
                ? [
                    { label: "Editar", onClick: (row: ProjectRow) => openProjectEdit(row) },
                    { label: "Asignar equipo", onClick: (row: ProjectRow) => void openDetail(row.id) },
                    { label: "Archivar", onClick: (row: ProjectRow) => requestRowAction(row), variant: "destructive" as const },
                  ]
                : []),
            ]}
            emptyMessage="No se encontraron proyectos con los filtros actuales."
          />

          {/* Footer de Paginación */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl shadow-sm"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <span className="text-xs text-zinc-400">
              Mostrando <strong className="text-zinc-200">{projectRows.length}</strong> de{" "}
              <strong className="text-zinc-200">{projectRows.length}</strong> proyectos
            </span>
            <div className="flex items-center gap-2">
              <OutlineButton
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </OutlineButton>
              <span className="text-xs text-zinc-300 px-2 font-medium">Página {currentPage}</span>
              <OutlineButton
                size="sm"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage * pageSize >= projectRows.length || projectRows.length === 0}
              >
                Siguiente
              </OutlineButton>
            </div>
          </div>
        </div>
      );
    }
    if (section === "tasks") {
      return (
        <DataTable
          columns={taskColumns}
          data={taskRows}
          loading={loading}
          actions={[
            { label: "Ver detalle", onClick: (row) => void openDetail(row.id) },
            ...(canManage
              ? [
                  { label: "Editar", onClick: (row: TaskRow) => openTaskEdit(row) },
                  { label: "Cancelar", onClick: (row: TaskRow) => requestRowAction(row), variant: "destructive" as const },
                ]
              : []),
          ]}
          emptyMessage="No se encontraron tareas con los filtros actuales."
        />
      );
    }
    if (section === "activities") {
      return (
        <DataTable
          columns={activityColumns}
          data={activityRows}
          loading={loading}
          actions={[
            { label: "Ver detalle", onClick: (row) => void openDetail(row.id) },
            ...(canManage
              ? [
                  { label: "Editar", onClick: (row: ActivityRow) => openActivityEdit(row) },
                  { label: "Eliminar", onClick: (row: ActivityRow) => requestRowAction(row), variant: "destructive" as const },
                ]
              : []),
          ]}
          emptyMessage="No se encontraron actividades con los filtros actuales."
        />
      );
    }
    return (
      <DataTable
        columns={assignmentColumns}
        data={assignmentRows}
        loading={loading}
        actions={[
          { label: "Ver detalle", onClick: (row) => void openDetail(row.id, row.kind) },
          ...(canManage
            ? [
                { label: "Editar", onClick: (row: AssignmentRow) => openAssignmentEdit(row) },
                { label: "Quitar / desactivar", onClick: (row: AssignmentRow) => requestRowAction(row), variant: "destructive" as const },
              ]
            : []),
        ]}
        emptyMessage="No se encontraron asignaciones con los filtros actuales."
      />
    );
  }

  function renderDetail() {
    if (details.loading) {
      return (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
          <p className="text-xs text-zinc-400">Cargando información completa del proyecto...</p>
        </div>
      );
    }
    if (details.error) return <ErrorBlock message={details.error} onRetry={() => void details.reload()} />;
    if (!details.detail) return null;

    return (
      <div className="space-y-6">
        {section === "projects" ? (
          (() => {
            const detail = details.detail as ProjectDetailData;
            return (
              <div className="space-y-6">
                {/* 1. Header Banner Resumen Ejecutivo */}
                <div
                  className="relative overflow-hidden rounded-2xl p-6 border border-zinc-800 bg-gradient-to-r from-indigo-950/60 via-zinc-900 to-zinc-950"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {detail.project.imageUrl ? (
                        <img
                          src={detail.project.imageUrl}
                          alt={detail.project.name}
                          className="h-16 w-16 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-lg"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-lg">
                          <FolderKanban className="h-8 w-8" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {detail.project.code}
                          </span>
                          <StatusDot variant={getProjectStatusVariant(detail.project.stateKind)}>
                            {detail.project.stateLabel}
                          </StatusDot>
                        </div>
                        <h2 className="text-xl font-bold text-zinc-100">{detail.project.name}</h2>
                        <p className="text-xs text-zinc-400 flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                          Área: <strong className="text-zinc-200 font-medium">{detail.project.areaName}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur px-3 py-2 rounded-xl border border-zinc-800 text-xs text-zinc-300">
                      <Calendar className="h-4 w-4 text-indigo-400" />
                      <span>
                        {detail.project.startDate || "N/A"} - {detail.project.endDate || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Cuadrante de Métricas Ejecutivas del Proyecto */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl p-4 border border-zinc-800 bg-zinc-900/60 space-y-1">
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-amber-400" /> Presupuesto
                    </span>
                    <p className="text-lg font-bold text-emerald-400">
                      {formatCurrency(detail.project.budget)}
                    </p>
                  </div>

                  <div className="rounded-xl p-4 border border-zinc-800 bg-zinc-900/60 space-y-1">
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-indigo-400" /> Actividades
                    </span>
                    <p className="text-lg font-bold text-zinc-100">
                      {detail.linkedActivities.length} registradas
                    </p>
                  </div>

                  <div className="rounded-xl p-4 border border-zinc-800 bg-zinc-900/60 space-y-1">
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Tareas Totales
                    </span>
                    <p className="text-lg font-bold text-zinc-100">
                      {detail.linkedTasks.length} vinculadas
                    </p>
                  </div>

                  <div className="rounded-xl p-4 border border-zinc-800 bg-zinc-900/60 space-y-1">
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-sky-400" /> Voluntarios
                    </span>
                    <p className="text-lg font-bold text-zinc-100">
                      {detail.volunteerAssignments.length} asignados
                    </p>
                  </div>
                </div>

                {/* 3. Descripción del Proyecto & Datos de Auditoría */}
                <div className="rounded-xl p-4 border border-zinc-800 bg-zinc-900/50 space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-400" /> Descripción del Proyecto
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {detail.project.description || "Sin descripción registrada."}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500">
                    <span>
                      Registrado por: <strong className="text-zinc-400">{detail.createdBy || "Sistema"}</strong>
                    </span>
                    <span>
                      Fecha de registro: <strong className="text-zinc-400">{detail.project.createdAt}</strong>
                    </span>
                    {detail.updatedBy && (
                      <span>
                        Última modificación por: <strong className="text-zinc-400">{detail.updatedBy}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Tablas Integradas de Actividades y Tareas del Proyecto */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Actividades */}
                  <div className="rounded-xl p-4 border border-zinc-800 bg-zinc-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-indigo-400" />
                        Actividades Vinculadas ({detail.linkedActivities.length})
                      </h4>
                    </div>

                    {detail.linkedActivities.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic p-3">No hay actividades registradas aún para este proyecto.</p>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {detail.linkedActivities.map((act) => (
                          <div
                            key={act.id}
                            className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <p className="font-semibold text-zinc-200">{act.title}</p>
                              <p className="text-[11px] text-zinc-400 flex items-center gap-2">
                                <span>{formatActivityWindow(act.startAt, act.endAt)}</span>
                                {act.locationName && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-zinc-500" /> {act.locationName}
                                  </span>
                                )}
                              </p>
                            </div>
                            <StatusDot variant={getActivityStatusVariant(act.statusKind)}>
                              {act.statusLabel}
                            </StatusDot>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tareas */}
                  <div className="rounded-xl p-4 border border-zinc-800 bg-zinc-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        Tareas del Proyecto ({detail.linkedTasks.length})
                      </h4>
                    </div>

                    {detail.linkedTasks.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic p-3">No hay tareas registradas aún para este proyecto.</p>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {detail.linkedTasks.map((t) => (
                          <div
                            key={t.id}
                            className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <p className="font-semibold text-zinc-200">{t.title}</p>
                              <p className="text-[11px] text-zinc-400">
                                {t.activityName ? `Actividad: ${t.activityName}` : "Tarea general"}
                              </p>
                            </div>
                            <StatusDot variant={getTaskStatusVariant(t.statusKind)}>
                              {t.statusLabel}
                            </StatusDot>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Equipo de Voluntarios & Recursos Materiales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Voluntarios */}
                  <div className="rounded-xl p-4 border border-zinc-800 bg-zinc-900/50 space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-sky-400" />
                      Equipo de Voluntarios ({detail.volunteerAssignments.length})
                    </h4>

                    {detail.volunteerAssignments.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic p-3">Sin voluntarios asignados a este proyecto.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {detail.volunteerAssignments.map((v) => (
                          <div
                            key={v.id}
                            className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 text-[10px] font-bold text-white">
                                {v.volunteerName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-zinc-200">{v.volunteerName}</p>
                                <p className="text-[11px] text-zinc-400">{v.role || "Voluntario General"}</p>
                              </div>
                            </div>
                            <Badge variant={v.active ? "success" : "secondary"}>
                              {v.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recursos Materiales */}
                  <div className="rounded-xl p-4 border border-zinc-800 bg-zinc-900/50 space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                      <Package className="h-4 w-4 text-amber-400" />
                      Recursos y Materiales Vinculados ({detail.resourceAssignments.length})
                    </h4>

                    {detail.resourceAssignments.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic p-3">Sin recursos materiales vinculados a este proyecto.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {detail.resourceAssignments.map((r) => (
                          <div
                            key={r.id}
                            className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-semibold text-zinc-200">{r.itemName}</p>
                              <p className="text-[11px] text-zinc-400">
                                Requerido: {r.quantityRequired} | Asignado: {r.quantityAssigned || 0}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {Math.round(((r.quantityAssigned || 0) / r.quantityRequired) * 100)}% Cubierto
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        ) : null}
        {section === "tasks" ? (
          (() => {
            const detail = details.detail as TaskDetailData;
            return (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Actividad</div><div style={{ color: "var(--t-text)" }}>{detail.task.activityName ?? "Sin actividad asignada"}</div></div>
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Estado</div><StatusDot variant={getTaskStatusVariant(detail.task.statusKind)}>{detail.task.statusLabel}</StatusDot></div>
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Fecha limite</div><div style={{ color: "var(--t-text)" }}>{detail.task.deadline || "Sin fecha"}</div></div>
                </div>
                <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Descripcion</div><div style={{ color: "var(--t-text)" }}>{detail.task.description || "Sin descripcion registrada."}</div></div>
              </>
            );
          })()
        ) : null}
        {section === "activities" ? (
          (() => {
            const detail = details.detail as ActivityDetailData;
            return (
              <>
                {detail.warnings.length > 0 ? <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Advertencia</AlertTitle><AlertDescription>{detail.warnings[0]}</AlertDescription></Alert> : null}
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Proyecto</div><div style={{ color: "var(--t-text)" }}>{detail.activity.projectName}</div></div>
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Estado</div><StatusDot variant={getActivityStatusVariant(detail.activity.statusKind)}>{detail.activity.statusLabel}</StatusDot></div>
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Tareas</div><div style={{ color: "var(--t-text)" }}>{detail.linkedTasks.length}</div></div>
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Fechas</div><div style={{ color: "var(--t-text)" }}>{formatActivityWindow(detail.activity.startAt, detail.activity.endAt)}</div></div>
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Ubicacion</div><div style={{ color: "var(--t-text)" }}>{detail.activity.locationName || "Sin ubicacion"}</div></div>
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Horas</div><div style={{ color: "var(--t-text)" }}>{detail.activity.estimatedHours ?? 0} h estimadas / {detail.activity.registeredHours} h registradas</div></div>
                </div>
                <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Descripcion</div><div style={{ color: "var(--t-text)" }}>{detail.activity.description || "Sin descripcion registrada."}</div></div>
                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="mb-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>Asignaciones</div>{detail.assignments.length === 0 ? <div style={{ color: "var(--t-text-dim)" }}>Sin asignaciones.</div> : detail.assignments.map((row) => <div key={row.id} className="py-1"><div style={{ color: "var(--t-text)" }}>{row.volunteerName}</div><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>{row.role || "Sin rol"}</div></div>)}</div>
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="mb-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>Horas</div>{detail.hours.length === 0 ? <div style={{ color: "var(--t-text-dim)" }}>Sin horas.</div> : detail.hours.map((row) => <div key={row.id} className="py-1" style={{ color: "var(--t-text)" }}>{row.date} - {row.volunteerName} - {row.hours} h</div>)}</div>
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="mb-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>Evidencias</div>{detail.evidences.length === 0 ? <div style={{ color: "var(--t-text-dim)" }}>Sin evidencias.</div> : detail.evidences.map((row) => <div key={row.id} className="py-1" style={{ color: "var(--t-text)" }}>{row.evidenceType || "Sin tipo"} - {row.volunteerName}</div>)}</div>
                </div>
              </>
            );
          })()
        ) : null}
        {section === "assignments" ? (
          (() => {
            const detail = details.detail as AssignmentDetailData;
            return (
              <>
                {detail.warnings.length > 0 ? <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Advertencia de vigencia</AlertTitle><AlertDescription>{detail.warnings[0]}</AlertDescription></Alert> : null}
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Tipo</div><div style={{ color: "var(--t-text)" }}>{getAssignmentKindLabel(detail.assignment.kind)}</div></div>
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Estado</div><StatusDot variant={detail.assignment.active === false ? "secondary" : detail.assignment.kind === "project-resource" ? "info" : "success"}>{detail.assignment.statusLabel}</StatusDot></div>
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Proyecto</div><div style={{ color: "var(--t-text)" }}>{detail.assignment.projectName}</div></div>
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Contexto</div><div style={{ color: "var(--t-text)" }}>{detail.assignment.activityName || detail.assignment.itemName || detail.assignment.volunteerName || detail.assignment.taskName || "-"}</div></div>
                </div>
              </>
            );
          })()
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de la Sección con Botones Principales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title={meta.title} description={meta.description} />
        <div className="flex items-center gap-2 shrink-0">
          <OutlineButton
            size="sm"
            onClick={refresh}
            className="flex items-center gap-1.5"
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Sincronizar
          </OutlineButton>
          {canManage && (
            <GradientButton size="sm" onClick={openCreateForm} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              {section === "projects"
                ? "Nuevo Proyecto"
                : section === "tasks"
                ? "Nueva Tarea"
                : section === "activities"
                ? "Nueva Actividad"
                : "Nueva Asignación"}
            </GradientButton>
          )}
        </div>
      </div>

      {catalogs.permissionWarning ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>RBAC</AlertTitle>
          <AlertDescription>{catalogs.permissionWarning}</AlertDescription>
        </Alert>
      ) : null}

      {catalogsError ? <ErrorBlock message={catalogsError} onRetry={refreshCatalogs} /> : null}
      {error ? <ErrorBlock message={error} onRetry={refresh} /> : null}

      {/* 1. Tarjetas de Resumen (KPIs) en la parte superior (solo vista Proyectos) */}
      {section === "projects" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className="rounded-2xl p-5 shadow-sm space-y-2"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium">Total Proyectos</span>
              <FolderKanban className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-zinc-100">{projectRows.length}</span>
              <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Registrados
              </span>
            </div>
          </div>

          <div
            className="rounded-2xl p-5 shadow-sm space-y-2"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium">En Ejecución</span>
              <Layers className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-zinc-100">{activeProjectsCount}</span>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Activos
              </span>
            </div>
          </div>

          <div
            className="rounded-2xl p-5 shadow-sm space-y-2"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium">Presupuesto Total</span>
              <DollarSign className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-zinc-100">{formatCurrency(totalBudgetSum)}</span>
              <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Asignado
              </span>
            </div>
          </div>

          <div
            className="rounded-2xl p-5 shadow-sm space-y-2"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium">Tareas Completadas</span>
              <CheckCircle2 className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-zinc-100">{taskPercent}%</span>
              <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Global
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Barra de Herramientas y Filtros Unificada Horizontal */}
      <div
        className="rounded-2xl p-4 shadow-sm space-y-3"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Búsqueda */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder={
                section === "projects"
                  ? "Buscar por código, proyecto..."
                  : section === "tasks"
                  ? "Buscar por tarea, actividad..."
                  : section === "activities"
                  ? "Buscar por actividad, ubicación..."
                  : "Buscar por proyecto, voluntario..."
              }
              value={
                section === "projects"
                  ? projectFilters.searchTerm
                  : section === "tasks"
                  ? taskFilters.searchTerm
                  : section === "activities"
                  ? activityFilters.searchTerm
                  : assignmentFilters.searchTerm
              }
              onChange={(e) => {
                const val = e.target.value;
                if (section === "projects") setProjectFilters((c) => ({ ...c, searchTerm: val }));
                else if (section === "tasks") setTaskFilters((c) => ({ ...c, searchTerm: val }));
                else if (section === "activities") setActivityFilters((c) => ({ ...c, searchTerm: val }));
                else setAssignmentFilters((c) => ({ ...c, searchTerm: val }));
              }}
              className="h-10 w-full rounded-xl pl-9 pr-3 text-xs outline-none transition-colors"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
            />
          </div>

          {/* Filtros específicos por sección en la misma fila */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {section === "projects" && (
              <>
                <div className="w-36">
                  <SelectField
                    value={projectFilters.stateCode === "all" ? "" : projectFilters.stateCode}
                    onChange={(value) =>
                      setProjectFilters((current) => ({
                        ...current,
                        stateCode: value || "all",
                      }))
                    }
                    options={catalogs.projectStates}
                    placeholder="Estado"
                  />
                </div>
                <div className="w-36">
                  <SelectField
                    value={projectFilters.areaId === "all" ? "" : projectFilters.areaId}
                    onChange={(value) =>
                      setProjectFilters((current) => ({
                        ...current,
                        areaId: value || "all",
                      }))
                    }
                    options={catalogs.areas}
                    placeholder="Área"
                  />
                </div>
              </>
            )}

            {/* Selector de Vista Tabla vs. Kanban (Solo para Proyectos) */}
            {section === "projects" && (
              <div className="flex items-center rounded-xl p-1 bg-zinc-950 border border-zinc-800">
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
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === "kanban"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Kanban className="h-3.5 w-3.5" />
                  Kanban
                </button>
              </div>
            )}

            {/* Botón Exportar */}
            {section === "projects" && (
              <OutlineButton
                size="sm"
                onClick={() => exportProjectsToCSV(projectRows)}
                className="flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar
              </OutlineButton>
            )}
          </div>
        </div>
      </div>

      {renderCurrentTable()}

      <ModalShell open={detailOpen} onClose={closeDetail} width="max-w-[1100px]">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--t-border)] px-4 py-3">
          <div>
            <h3 className="text-[14px] font-semibold" style={{ color: "var(--t-text)" }}>
              Resumen Ejecutivo de {meta.title.slice(0, -1)}
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Información completa recopilada de la base de datos en tiempo real.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void details.reload()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Recargar
            </Button>
            <Button variant="outline" size="sm" onClick={closeDetail}>
              Cerrar
            </Button>
          </div>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5">{renderDetail()}</div>
      </ModalShell>

      {/* Modal de Creación y Edición Rediseñado con Pestañas (Tabs) y Etiquetas (Labels) */}
      <ModalShell open={formOpen} onClose={closeForm} width="max-w-[960px]">
        <div className="border-b border-zinc-800 px-6 py-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-indigo-400" />
                {section === "projects"
                  ? editingProjectId
                    ? `Editar Proyecto: ${projectForm.name || ""}`
                    : "Crear Nuevo Proyecto"
                  : section === "tasks"
                  ? editingTaskId
                    ? "Editar Tarea"
                    : "Crear Tarea"
                  : section === "activities"
                  ? editingActivityId
                    ? "Editar Actividad"
                    : "Crear Actividad"
                  : editingAssignment
                  ? `Editar ${getAssignmentKindLabel(assignmentFormKind).toLowerCase()}`
                  : "Crear Asignación"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {section === "projects" && projectForm.code ? (
                  <span className="font-mono text-indigo-400 font-medium">Código: {projectForm.code}</span>
                ) : (
                  "Complete los campos obligatorios para guardar la información."
                )}
              </p>
            </div>
            <button
              onClick={closeForm}
              className="text-zinc-400 hover:text-zinc-200 text-sm font-semibold px-2 py-1 rounded-lg hover:bg-zinc-800"
            >
              ✕
            </button>
          </div>

          {/* Navegación por Pestañas (Solo Proyectos) */}
          {section === "projects" && (
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setFormTab("general")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  formTab === "general"
                    ? "bg-indigo-600 text-white shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <Info className="h-3.5 w-3.5" />
                Información General
              </button>

              <button
                type="button"
                onClick={() => setFormTab("team_budget")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  formTab === "team_budget"
                    ? "bg-indigo-600 text-white shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Equipo y Presupuesto
              </button>

              <button
                type="button"
                onClick={() => setFormTab("advanced")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  formTab === "advanced"
                    ? "bg-indigo-600 text-white shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                Configuración Avanzada
              </button>
            </div>
          )}
        </div>

        {/* Contenido del Formulario */}
        <div className="max-h-[72vh] overflow-y-auto p-6 space-y-4">
          {section === "projects" ? (
            <>
              {/* PESTAÑA 1: INFORMACIÓN GENERAL */}
              {formTab === "general" && (
                <div className="space-y-4">
                  {/* FILA 1: Nombre y Código */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                        Nombre del Proyecto <span className="text-red-400">*</span>
                      </label>
                      <InputField
                        value={projectForm.name}
                        onChange={(value) => setProjectForm((current) => ({ ...current, name: value }))}
                        placeholder="Ej. Campaña de Reforestación 2026"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Código ID del Proyecto <span className="text-zinc-500">(Auto-generado / Correlativo)</span>
                      </label>
                      <InputField
                        value={projectForm.code || (editingProjectId ? "" : "Generación automática")}
                        onChange={(value) => setProjectForm((current) => ({ ...current, code: value }))}
                        placeholder="PROJ-001"
                        disabled={Boolean(editingProjectId)}
                      />
                    </div>
                  </div>

                  {/* FILA 2: Área, Estado y Prioridad */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                        Área u Organización <span className="text-red-400">*</span>
                      </label>
                      <SelectField
                        value={projectForm.areaId}
                        onChange={(value) => setProjectForm((current) => ({ ...current, areaId: value }))}
                        options={catalogs.areas}
                        placeholder="Seleccionar Área"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                        Estado del Proyecto <span className="text-red-400">*</span>
                      </label>
                      <SelectField
                        value={projectForm.stateCode}
                        onChange={(value) => setProjectForm((current) => ({ ...current, stateCode: value }))}
                        options={catalogs.projectStates}
                        placeholder="Seleccionar Estado"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Nivel de Prioridad
                      </label>
                      <SelectField
                        value={projectForm.priority || "media"}
                        onChange={(value) =>
                          setProjectForm((current) => ({
                            ...current,
                            priority: value as ProjectFormValues["priority"],
                          }))
                        }
                        options={[
                          { value: "baja", label: "🟢 Baja" },
                          { value: "media", label: "🔵 Media" },
                          { value: "alta", label: "🔴 Alta" },
                          { value: "urgente", label: "⚡ Urgente" },
                        ]}
                        placeholder="Prioridad"
                      />
                    </div>
                  </div>

                  {/* FILA 3: Descripción */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                      Descripción del Proyecto <span className="text-red-400">*</span>
                    </label>
                    <TextareaField
                      value={projectForm.description}
                      onChange={(value) => setProjectForm((current) => ({ ...current, description: value }))}
                      placeholder="Describa detalladamente los objetivos del proyecto, contexto y alcance..."
                    />
                  </div>

                  {/* FILA 4: Tarjeta de Vista Previa de Imagen */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">
                      Imagen / Banner del Proyecto
                    </label>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
                      {projectForm.imageUrl || projectForm.imageFile ? (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {projectForm.imageFile ? (
                              <div className="h-14 w-14 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                Nuevo
                              </div>
                            ) : (
                              <img
                                src={projectForm.imageUrl}
                                alt="Portada"
                                className="h-14 w-14 rounded-xl object-cover border border-zinc-700"
                              />
                            )}
                            <div>
                              <p className="text-xs font-semibold text-zinc-200">
                                {projectForm.imageFile ? projectForm.imageFile.name : "Imagen del proyecto"}
                              </p>
                              <p className="text-[11px] text-zinc-400">
                                {projectForm.imageFile
                                  ? `${(projectForm.imageFile.size / 1024).toFixed(1)} KB`
                                  : "URL almacenada en Supabase Storage"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-1.5">
                              <Upload className="h-3.5 w-3.5" />
                              Cambiar
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setProjectForm((c) => ({ ...c, imageFile: file }));
                                  }
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => setProjectForm((c) => ({ ...c, imageFile: null, imageUrl: "" }))}
                              className="px-3 py-1.5 rounded-lg border border-red-500/30 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <ImageUploadField
                          label="Seleccionar o arrastrar imagen de portada"
                          existingUrl={null}
                          previewFile={projectForm.imageFile}
                          onFileSelect={(file) => setProjectForm((current) => ({ ...current, imageFile: file }))}
                          onClear={() => setProjectForm((current) => ({ ...current, imageFile: null, imageUrl: "" }))}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA 2: EQUIPO Y PRESUPUESTO */}
              {formTab === "team_budget" && (
                <div className="space-y-4">
                  {/* FILA 1: Responsables */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Líder del Proyecto / Responsable
                      </label>
                      <SelectField
                        value={projectForm.leaderId || ""}
                        onChange={(value) => setProjectForm((current) => ({ ...current, leaderId: value }))}
                        options={catalogs.volunteers}
                        placeholder="Asignar Responsable"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Equipo de Colaboradores Vinculados
                      </label>
                      <div className="h-10 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 flex items-center text-xs text-zinc-400">
                        {catalogs.volunteers.length} voluntarios disponibles para asignación
                      </div>
                    </div>
                  </div>

                  {/* FILA 2: Fechas */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Fecha de Inicio
                      </label>
                      <InputField
                        value={projectForm.startDate}
                        onChange={(value) => setProjectForm((current) => ({ ...current, startDate: value }))}
                        placeholder="Fecha de Inicio"
                        type="date"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Fecha de Finalización Estimada
                      </label>
                      <InputField
                        value={projectForm.endDate}
                        onChange={(value) => setProjectForm((current) => ({ ...current, endDate: value }))}
                        placeholder="Fecha de Finalización"
                        type="date"
                      />
                    </div>
                  </div>

                  {/* FILA 3: Presupuesto y Moneda */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Tipo de Moneda
                      </label>
                      <SelectField
                        value={projectForm.currency || "USD"}
                        onChange={(value) =>
                          setProjectForm((current) => ({
                            ...current,
                            currency: value as ProjectFormValues["currency"],
                          }))
                        }
                        options={[
                          { value: "USD", label: "USD ($) - Dólares Estadounidenses" },
                          { value: "PEN", label: "PEN (S/) - Soles Peruanos" },
                          { value: "EUR", label: "EUR (€) - Euros" },
                        ]}
                        placeholder="Seleccionar Moneda"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Presupuesto Asignado
                      </label>
                      <InputField
                        value={projectForm.budget}
                        onChange={(value) => setProjectForm((current) => ({ ...current, budget: value }))}
                        placeholder="0.00"
                        type="number"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA 3: CONFIGURACIÓN AVANZADA / ZONA DE PELIGRO */}
              {formTab === "advanced" && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Info className="h-4 w-4 text-indigo-400" /> Información del Registro en Base de Datos
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs text-zinc-400 pt-2">
                      <div>ID del Proyecto: <strong className="text-zinc-200 font-mono">{editingProjectId || "Nuevo Registro"}</strong></div>
                      <div>Tenant ID: <strong className="text-zinc-200 font-mono">Supabase Multi-Tenant</strong></div>
                    </div>
                  </div>

                  {editingProjectId && (
                    <div className="rounded-xl border border-red-500/30 bg-red-950/10 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
                        <ShieldAlert className="h-4 w-4" /> Zona de Peligro (Danger Zone)
                      </div>
                      <p className="text-xs text-zinc-400">
                        Archivar o eliminar este proyecto quitará su visualización activa del panel general de la ONG.
                      </p>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          closeForm();
                          setPendingAction({
                            id: editingProjectId,
                            label: `¿Confirma archivar o eliminar el proyecto "${projectForm.name}"?`,
                          });
                          setConfirmOpen(true);
                        }}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar / Archivar Proyecto
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}

          {section === "tasks" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Proyecto</label>
                <SelectField
                  value={taskFormProjectFilter}
                  onChange={(value) => {
                    setTaskFormProjectFilter(value);
                    setTaskForm((current) => ({ ...current, activityId: "" }));
                  }}
                  options={catalogs.projects}
                  placeholder="Proyecto (para filtrar actividad)"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Actividad *</label>
                <SelectField
                  value={taskForm.activityId}
                  onChange={(value) => setTaskForm((current) => ({ ...current, activityId: value }))}
                  options={
                    taskFormProjectFilter
                      ? catalogs.activities.filter((a) => a.projectId === taskFormProjectFilter)
                      : catalogs.activities
                  }
                  placeholder="Actividad"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Estado *</label>
                <SelectField
                  value={taskForm.statusCode}
                  onChange={(value) => setTaskForm((current) => ({ ...current, statusCode: value as TaskFormValues["statusCode"] }))}
                  options={catalogs.taskStates.map((item) => ({ value: item.code, label: item.label }))}
                  placeholder="Estado"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Fecha Límite</label>
                <InputField value={taskForm.deadline} onChange={(value) => setTaskForm((current) => ({ ...current, deadline: value }))} placeholder="Fecha limite" type="date" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-zinc-300">Título de la Tarea *</label>
                <InputField value={taskForm.title} onChange={(value) => setTaskForm((current) => ({ ...current, title: value }))} placeholder="Titulo de la tarea" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-zinc-300">Descripción</label>
                <TextareaField value={taskForm.description} onChange={(value) => setTaskForm((current) => ({ ...current, description: value }))} placeholder="Descripcion de la tarea" />
              </div>
            </div>
          ) : null}

          {section === "activities" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Proyecto *</label>
                <SelectField value={activityForm.projectId} onChange={(value) => setActivityForm((current) => ({ ...current, projectId: value }))} options={catalogs.projects} placeholder="Proyecto" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Estado *</label>
                <SelectField value={activityForm.statusCode} onChange={(value) => setActivityForm((current) => ({ ...current, statusCode: value as ActivityFormValues["statusCode"] }))} options={catalogs.activityStates.map((item) => ({ value: item.code, label: item.label }))} placeholder="Estado" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Título de la Actividad *</label>
                <InputField value={activityForm.title} onChange={(value) => setActivityForm((current) => ({ ...current, title: value }))} placeholder="Titulo de la actividad" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Horas Estimadas</label>
                <InputField value={activityForm.estimatedHours} onChange={(value) => setActivityForm((current) => ({ ...current, estimatedHours: value }))} placeholder="Horas estimadas" type="number" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Fecha Inicio</label>
                <InputField value={activityForm.startAt} onChange={(value) => setActivityForm((current) => ({ ...current, startAt: value }))} placeholder="Fecha inicio" type="date" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Fecha Fin</label>
                <InputField value={activityForm.endAt} onChange={(value) => setActivityForm((current) => ({ ...current, endAt: value }))} placeholder="Fecha fin" type="date" />
              </div>
              <div className="md:col-span-2 space-y-1"><label className="text-xs font-medium text-zinc-300">Ubicación</label><SelectField value={activityForm.locationId} onChange={(value) => setActivityForm((current) => ({ ...current, locationId: value }))} options={catalogs.locations} placeholder="Ubicacion (opcional)" /></div>
              <div className="md:col-span-2 space-y-1"><label className="text-xs font-medium text-zinc-300">Descripción</label><TextareaField value={activityForm.description} onChange={(value) => setActivityForm((current) => ({ ...current, description: value }))} placeholder="Descripcion de la actividad" /></div>
            </div>
          ) : null}

          {section === "assignments" ? (
            <div className="space-y-4">
              {!editingAssignment ? <SelectField value={assignmentFormKind} onChange={(value) => setAssignmentFormKind(value as AssignmentKind)} options={[{ value: "project-volunteer", label: "Voluntario en proyecto" }, { value: "activity-volunteer", label: "Voluntario en actividad" }, { value: "project-resource", label: "Recurso de proyecto" }]} placeholder="Tipo de asignacion" /> : null}
              {assignmentFormKind === "project-volunteer" ? <div className="grid gap-3 md:grid-cols-2"><SelectField value={projectVolunteerAssignmentForm.projectId} onChange={(value) => setProjectVolunteerAssignmentForm((current) => ({ ...current, projectId: value }))} options={catalogs.projects} placeholder="Proyecto" /><SelectField value={projectVolunteerAssignmentForm.volunteerId} onChange={(value) => setProjectVolunteerAssignmentForm((current) => ({ ...current, volunteerId: value }))} options={catalogs.volunteers} placeholder="Voluntario" /><InputField value={projectVolunteerAssignmentForm.role} onChange={(value) => setProjectVolunteerAssignmentForm((current) => ({ ...current, role: value }))} placeholder="Rol en proyecto" /><InputField value={projectVolunteerAssignmentForm.joinedAt} onChange={(value) => setProjectVolunteerAssignmentForm((current) => ({ ...current, joinedAt: value }))} placeholder="Fecha ingreso" type="date" /><label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}><input type="checkbox" checked={projectVolunteerAssignmentForm.active} onChange={(event) => setProjectVolunteerAssignmentForm((current) => ({ ...current, active: event.target.checked }))} />Asignacion activa</label></div> : null}
              {assignmentFormKind === "activity-volunteer" ? <div className="grid gap-3 md:grid-cols-2"><SelectField value={activityVolunteerAssignmentForm.activityId} onChange={(value) => setActivityVolunteerAssignmentForm((current) => ({ ...current, activityId: value }))} options={catalogs.activities} placeholder="Actividad" /><SelectField value={activityVolunteerAssignmentForm.volunteerId} onChange={(value) => setActivityVolunteerAssignmentForm((current) => ({ ...current, volunteerId: value }))} options={catalogs.volunteers} placeholder="Voluntario" /><div className="md:col-span-2"><InputField value={activityVolunteerAssignmentForm.role} onChange={(value) => setActivityVolunteerAssignmentForm((current) => ({ ...current, role: value }))} placeholder="Rol en actividad" /></div></div> : null}
              {assignmentFormKind === "project-resource" ? <div className="grid gap-3 md:grid-cols-2"><SelectField value={projectResourceAssignmentForm.projectId} onChange={(value) => setProjectResourceAssignmentForm((current) => ({ ...current, projectId: value }))} options={catalogs.projects} placeholder="Proyecto" /><SelectField value={projectResourceAssignmentForm.itemId} onChange={(value) => setProjectResourceAssignmentForm((current) => ({ ...current, itemId: value }))} options={catalogs.items} placeholder="Item" /><InputField value={projectResourceAssignmentForm.quantityRequired} onChange={(value) => setProjectResourceAssignmentForm((current) => ({ ...current, quantityRequired: value }))} placeholder="Cantidad requerida" type="number" /><InputField value={projectResourceAssignmentForm.quantityAssigned} onChange={(value) => setProjectResourceAssignmentForm((current) => ({ ...current, quantityAssigned: value }))} placeholder="Cantidad asignada" type="number" /></div> : null}
            </div>
          ) : null}
        </div>

        {/* Footer del Modal */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-3">
          <div>
            {section === "projects" && editingProjectId && (
              <button
                type="button"
                onClick={() => {
                  closeForm();
                  setPendingAction({
                    id: editingProjectId,
                    label: `¿Confirma archivar o eliminar el proyecto "${projectForm.name}"?`,
                  });
                  setConfirmOpen(true);
                }}
                className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar Proyecto
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <OutlineButton size="sm" onClick={closeForm}>
              Cancelar
            </OutlineButton>
            <GradientButton
              size="sm"
              onClick={() => void handleSubmitForm()}
              disabled={mutations.isSaving}
            >
              {mutations.isSaving
                ? "Guardando..."
                : editingProjectId
                ? "Guardar Cambios"
                : "Crear Proyecto"}
            </GradientButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={confirmOpen} onClose={() => setConfirmOpen(false)} width="max-w-[520px]">
        <div className="space-y-3 p-4">
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Confirmar accion</h3>
          <p style={{ color: "var(--t-text-secondary)" }}>{pendingAction?.label}</p>
          <div className="flex gap-2"><Button variant="destructive" onClick={() => void handleConfirmAction()} disabled={mutations.isSaving || mutations.isDeleting}>Confirmar</Button><Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button></div>
        </div>
      </ModalShell>
    </div>
  );
}
