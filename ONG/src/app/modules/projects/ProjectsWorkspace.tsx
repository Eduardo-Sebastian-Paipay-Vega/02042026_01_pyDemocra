import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { AlertCircle, FolderKanban } from "lucide-react";
import { ImageUploadField } from "../../components/ui/image-upload-field";
import {
  getAssetsUploadBucket,
  uploadFileToStorage,
} from "../../services/shared/storage";
import { PageHeader } from "../../components/shared/PageHeader";
import { FilterBar } from "../../components/shared/FilterBar";
import { DataTable, type Column } from "../../components/shared/DataTable";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ModalShell } from "../../components/ui/modal-shell";
import { StatusDot } from "../../components/ui/status-dot";
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
      "Administra los proyectos de la organización con área, estado, equipo y presupuesto.",
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
  statusCode: "pendiente",
  startAt: "",
  endAt: "",
  locationId: "",
  estimatedHours: "",
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
  quantityRequired: "",
  quantityAssigned: "0",
};

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
      className="h-10 rounded-xl px-3 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
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
      className="h-10 rounded-xl px-3 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
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
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={4}
      className="rounded-xl px-3 py-2 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
      style={{
        border: "1px solid var(--t-border)",
        background: "var(--t-input-bg)",
        color: "var(--t-text-secondary)",
      }}
    />
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>{message}</span>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

function getProjectStatusVariant(kind: ProjectRow["stateKind"]) {
  if (kind === "active") return "success";
  if (kind === "planning") return "warning";
  if (kind === "completed") return "info";
  if (kind === "cancelled") return "destructive";
  return "secondary";
}

function getTaskStatusVariant(kind: TaskRow["statusKind"]) {
  if (kind === "in-progress") return "warning";
  if (kind === "completed") return "success";
  if (kind === "cancelled") return "destructive";
  return "secondary";
}

function getActivityStatusVariant(kind: ActivityRow["statusKind"]) {
  if (kind === "planned") return "info";
  if (kind === "in-progress") return "warning";
  if (kind === "completed") return "success";
  if (kind === "cancelled") return "destructive";
  return "secondary";
}

function formatActivityWindow(startAt: string | null, endAt: string | null) {
  if (!startAt && !endAt) {
    return "Sin fechas";
  }
  if (startAt && endAt) {
    return startAt === endAt ? startAt : `${startAt} - ${endAt}`;
  }
  return startAt ?? endAt ?? "Sin fechas";
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
  // Used only in the Task form UI to cascade-filter activities by project.
  // Not part of TaskFormValues — purely presentational.
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
    details.clear();
  }, [details.clear, section]);

  const projectRows = rows as ProjectRow[];
  const taskRows = rows as TaskRow[];
  const activityRows = rows as ActivityRow[];
  const assignmentRows = rows as AssignmentRow[];
  const canManage = catalogs.canManage !== false;

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
      description: row.description,
      areaId: row.areaId,
      stateCode: row.stateCode,
      startDate: row.startDate ?? "",
      endDate: row.endDate ?? "",
      budget: String(row.budget),
      imageUrl: row.imageUrl ?? "",
      imageFile: null,
    });
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
      startAt: row.startAt ?? "",
      endAt: row.endAt ?? "",
      locationId: row.locationId ?? "",
      estimatedHours: row.estimatedHours !== null ? String(row.estimatedHours) : "",
    });
    setFormOpen(true);
  }

  function openAssignmentEdit(row: AssignmentRow) {
    setEditingAssignment(row);
    setAssignmentFormKind(row.kind);

    if (row.kind === "project-volunteer") {
      setProjectVolunteerAssignmentForm({
        projectId: row.projectId,
        volunteerId: row.volunteerId ?? "",
        role: row.role ?? "",
        joinedAt: row.joinedAt ?? "",
        active: row.active !== false,
      });
    } else if (row.kind === "activity-volunteer") {
      setActivityVolunteerAssignmentForm({
        activityId: row.activityId ?? "",
        volunteerId: row.volunteerId ?? "",
        role: row.role ?? "",
      });
    } else {
      setProjectResourceAssignmentForm({
        projectId: row.projectId,
        itemId: row.itemId ?? "",
        quantityRequired:
          row.quantityRequired !== null ? String(row.quantityRequired) : "",
        quantityAssigned:
          row.quantityAssigned !== null ? String(row.quantityAssigned) : "0",
      });
    }

    setFormOpen(true);
  }

  function requestRowAction(row: ProjectRow | TaskRow | ActivityRow | AssignmentRow) {
    if (section === "projects") {
      const project = row as ProjectRow;
      setPendingAction({
        id: project.id,
        label: `Archivar proyecto "${project.name}"`,
      });
    } else if (section === "tasks") {
      const task = row as TaskRow;
      setPendingAction({
        id: task.id,
        label: `Cancelar tarea "${task.title}"`,
      });
    } else if (section === "activities") {
      const activity = row as ActivityRow;
      setPendingAction({
        id: activity.id,
        label: `Eliminar actividad "${activity.title}"`,
      });
    } else {
      const assignment = row as AssignmentRow;
      setPendingAction({
        id: assignment.id,
        assignmentKind: assignment.kind,
        label:
          assignment.kind === "project-volunteer"
            ? `Desactivar asignacion de ${assignment.volunteerName}`
            : assignment.kind === "activity-volunteer"
            ? `Eliminar asignacion de ${assignment.volunteerName}`
            : `Eliminar recurso ${assignment.itemName}`,
      });
    }

    setConfirmOpen(true);
  }

  async function handleConfirmAction() {
    if (!pendingAction) {
      return;
    }

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
        toast.success("Asignacion a proyecto desactivada.");
      } else if (pendingAction.assignmentKind === "activity-volunteer") {
        await mutations.removeActivityVolunteerAssignment(pendingAction.id);
        toast.success("Asignacion a actividad eliminada.");
      } else {
        await mutations.removeProjectResourceAssignment(pendingAction.id);
        toast.success("Asignacion de recurso eliminada.");
      }

      setConfirmOpen(false);
      setPendingAction(null);
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo completar la accion."
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
            pathSegments: ["proyectos", projectForm.code || "proyecto"],
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

  const projectFiltersView = (
    <div className="grid gap-3 md:grid-cols-2">
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
      <SelectField
        value={projectFilters.areaId === "all" ? "" : projectFilters.areaId}
        onChange={(value) =>
          setProjectFilters((current) => ({
            ...current,
            areaId: value || "all",
          }))
        }
        options={catalogs.areas}
        placeholder="Area"
      />
    </div>
  );

  const taskFiltersView = (
    <div className="grid gap-3 md:grid-cols-2">
      <SelectField
        value={taskFilters.activityId === "all" ? "" : taskFilters.activityId}
        onChange={(value) =>
          setTaskFilters((current) => ({
            ...current,
            activityId: value || "all",
          }))
        }
        options={catalogs.activities}
        placeholder="Actividad"
      />
      <SelectField
        value={taskFilters.statusCode === "all" ? "" : taskFilters.statusCode}
        onChange={(value) =>
          setTaskFilters((current) => ({
            ...current,
            statusCode: (value as TaskListFilters["statusCode"]) || "all",
          }))
        }
        options={catalogs.taskStates.map((item) => ({
          value: item.code,
          label: item.label,
        }))}
        placeholder="Estado"
      />
    </div>
  );

  const activityFiltersView = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <SelectField
        value={activityFilters.projectId === "all" ? "" : activityFilters.projectId}
        onChange={(value) =>
          setActivityFilters((current) => ({
            ...current,
            projectId: value || "all",
          }))
        }
        options={catalogs.projects}
        placeholder="Proyecto"
      />
      <SelectField
        value={activityFilters.statusCode === "all" ? "" : activityFilters.statusCode}
        onChange={(value) =>
          setActivityFilters((current) => ({
            ...current,
            statusCode: (value as ActivityListFilters["statusCode"]) || "all",
          }))
        }
        options={catalogs.activityStates.map((item) => ({
          value: item.code,
          label: item.label,
        }))}
        placeholder="Estado"
      />
      <SelectField
        value={activityFilters.locationId === "all" ? "" : activityFilters.locationId}
        onChange={(value) =>
          setActivityFilters((current) => ({
            ...current,
            locationId: value || "all",
          }))
        }
        options={catalogs.locations}
        placeholder="Ubicacion"
      />
      <InputField
        value={activityFilters.dateFrom ?? ""}
        onChange={(value) =>
          setActivityFilters((current) => ({
            ...current,
            dateFrom: value || null,
          }))
        }
        placeholder="Desde"
        type="date"
      />
      <InputField
        value={activityFilters.dateTo ?? ""}
        onChange={(value) =>
          setActivityFilters((current) => ({
            ...current,
            dateTo: value || null,
          }))
        }
        placeholder="Hasta"
        type="date"
      />
    </div>
  );

  const assignmentFiltersView = (
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
      <SelectField
        value={assignmentFilters.kind === "all" ? "" : assignmentFilters.kind}
        onChange={(value) =>
          setAssignmentFilters((current) => ({
            ...current,
            kind: (value as AssignmentListFilters["kind"]) || "all",
          }))
        }
        options={[
          { value: "project-volunteer", label: "Voluntarios de proyecto" },
          { value: "activity-volunteer", label: "Voluntarios de actividad" },
          { value: "project-resource", label: "Recursos de proyecto" },
        ]}
        placeholder="Tipo"
      />
      <SelectField
        value={assignmentFilters.projectId === "all" ? "" : assignmentFilters.projectId}
        onChange={(value) =>
          setAssignmentFilters((current) => ({
            ...current,
            projectId: value || "all",
          }))
        }
        options={catalogs.projects}
        placeholder="Proyecto"
      />
      <SelectField
        value={assignmentFilters.activityId === "all" ? "" : assignmentFilters.activityId}
        onChange={(value) =>
          setAssignmentFilters((current) => ({
            ...current,
            activityId: value || "all",
          }))
        }
        options={catalogs.activities}
        placeholder="Actividad"
      />
      <SelectField
        value={assignmentFilters.volunteerId === "all" ? "" : assignmentFilters.volunteerId}
        onChange={(value) =>
          setAssignmentFilters((current) => ({
            ...current,
            volunteerId: value || "all",
          }))
        }
        options={catalogs.volunteers}
        placeholder="Voluntario"
      />
      <SelectField
        value={assignmentFilters.itemId === "all" ? "" : assignmentFilters.itemId}
        onChange={(value) =>
          setAssignmentFilters((current) => ({
            ...current,
            itemId: value || "all",
          }))
        }
        options={catalogs.items}
        placeholder="Item"
      />
      <SelectField
        value={assignmentFilters.activeState === "all" ? "" : assignmentFilters.activeState}
        onChange={(value) =>
          setAssignmentFilters((current) => ({
            ...current,
            activeState:
              (value as AssignmentListFilters["activeState"]) || "all",
          }))
        }
        options={[
          { value: "active", label: "Solo activas" },
          { value: "inactive", label: "Solo inactivas" },
        ]}
        placeholder="Vigencia"
      />
    </div>
  );

  const projectColumns: Column<ProjectRow>[] = [
    {
      key: "name",
      label: "Proyecto",
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt={row.name}
              className="h-10 w-10 shrink-0 rounded-xl object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "var(--t-hover)" }}
            >
              <FolderKanban className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            </div>
          )}
          <div>
            <span style={{ color: "var(--t-text)" }}>{row.name}</span>
            <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
              {row.code}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "area",
      label: "Area",
      render: (row) => <span style={{ color: "var(--t-text-secondary)" }}>{row.areaName}</span>,
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
      label: "Act. / Tareas",
      render: (row) => (
        <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
          {row.activityCount} / {row.taskCount}
        </span>
      ),
    },
    {
      key: "team",
      label: "Equipo / Recursos",
      render: (row) => (
        <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
          {row.volunteerCount} / {row.resourceCount}
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

  function renderCurrentTable() {
    if (section === "projects") {
      return (
        <DataTable
          columns={projectColumns}
          data={projectRows}
          loading={loading}
          actions={[
            { label: "Ver detalle", onClick: (row) => void openDetail(row.id) },
            ...(canManage
              ? [
                  { label: "Editar", onClick: (row: ProjectRow) => openProjectEdit(row) },
                  { label: "Archivar", onClick: (row: ProjectRow) => requestRowAction(row), variant: "destructive" as const },
                ]
              : []),
          ]}
          emptyMessage="No se encontraron proyectos con los filtros actuales."
        />
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
    if (details.loading) return <p style={{ color: "var(--t-text-dim)" }}>Cargando detalle...</p>;
    if (details.error) return <ErrorBlock message={details.error} onRetry={() => void details.reload()} />;
    if (!details.detail) return null;
    return (
      <div className="space-y-4">
        {section === "projects" ? (
          (() => {
            const detail = details.detail as ProjectDetailData;
            return (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Estado</div><StatusDot variant={getProjectStatusVariant(detail.project.stateKind)}>{detail.project.stateLabel}</StatusDot></div>
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Area</div><div style={{ color: "var(--t-text)" }}>{detail.project.areaName}</div></div>
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Presupuesto</div><div style={{ color: "var(--t-text)" }}>{detail.project.budget}</div></div>
                </div>
                <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Descripcion</div><div style={{ color: "var(--t-text)" }}>{detail.project.description}</div></div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="mb-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>Equipo asignado</div>{detail.volunteerAssignments.length === 0 ? <div style={{ color: "var(--t-text-dim)" }}>Sin voluntarios asignados.</div> : detail.volunteerAssignments.map((row) => <div key={row.id} className="flex items-center justify-between py-1"><span style={{ color: "var(--t-text)" }}>{row.volunteerName}</span><Badge variant={row.active ? "success" : "secondary"}>{row.role ?? (row.active ? "Activo" : "Inactivo")}</Badge></div>)}</div>
                  <div className="rounded-xl border border-[var(--t-border)] p-3"><div className="mb-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>Recursos vinculados</div>{detail.resourceAssignments.length === 0 ? <div style={{ color: "var(--t-text-dim)" }}>Sin recursos vinculados.</div> : detail.resourceAssignments.map((row) => <div key={row.id} className="flex items-center justify-between py-1"><span style={{ color: "var(--t-text)" }}>{row.itemName}</span><span style={{ color: "var(--t-text-secondary)" }}>{row.quantityAssigned}/{row.quantityRequired}</span></div>)}</div>
                </div>
              </>
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
      <PageHeader title={meta.title} description={meta.description} action={{ label: "Actualizar", onClick: refresh }} />

      <div className="flex flex-wrap gap-2">
        {(Object.keys(SECTION_META) as ProjectModuleSection[]).map((item) => (
          <Link
            key={item}
            to={SECTION_META[item].path}
            className="rounded-full border px-3 py-1 text-[12px] transition-colors"
            style={{
              borderColor: item === section ? "rgba(61,107,255,0.4)" : "var(--t-border)",
              background: item === section ? "rgba(61,107,255,0.12)" : "var(--t-input-bg)",
              color: item === section ? "var(--t-text)" : "var(--t-text-secondary)",
            }}
          >
            {SECTION_META[item].title}
          </Link>
        ))}
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

      <div className="flex flex-wrap gap-2">
        {canManage ? (
          <Button onClick={openCreateForm} disabled={catalogsLoading || mutations.isSaving}>
            {section === "projects"
              ? "Crear proyecto"
              : section === "tasks"
              ? "Crear tarea"
              : section === "activities"
              ? "Crear actividad"
              : "Crear asignacion"}
          </Button>
        ) : null}
      </div>

      <FilterBar
        searchPlaceholder={
          section === "projects"
            ? "Buscar por codigo, proyecto, area o estado..."
            : section === "tasks"
            ? "Buscar por tarea, actividad o estado..."
            : section === "activities"
            ? "Buscar por actividad, descripcion, estado, ubicacion o proyecto..."
            : "Buscar por proyecto, voluntario, actividad, recurso o estado..."
        }
        searchValue={section === "projects" ? projectFilters.searchTerm : section === "tasks" ? taskFilters.searchTerm : section === "activities" ? activityFilters.searchTerm : assignmentFilters.searchTerm}
        onSearchChange={(value) => {
          if (section === "projects") setProjectFilters((current) => ({ ...current, searchTerm: value }));
          else if (section === "tasks") setTaskFilters((current) => ({ ...current, searchTerm: value }));
          else if (section === "activities") setActivityFilters((current) => ({ ...current, searchTerm: value }));
          else setAssignmentFilters((current) => ({ ...current, searchTerm: value }));
        }}
      />

      {section === "projects" ? projectFiltersView : section === "tasks" ? taskFiltersView : section === "activities" ? activityFiltersView : assignmentFiltersView}

      {renderCurrentTable()}

      <ModalShell open={detailOpen} onClose={closeDetail} width="max-w-[1100px]">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--t-border)] px-4 py-3">
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Detalle de {meta.title.toLowerCase()}</h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>Información del registro seleccionado.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void details.reload()}>Recargar</Button>
            <Button variant="outline" size="sm" onClick={closeDetail}>Cerrar</Button>
          </div>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-4">{renderDetail()}</div>
      </ModalShell>

      <ModalShell open={formOpen} onClose={closeForm} width="max-w-[980px]">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--t-border)] px-4 py-3">
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              {section === "projects" ? editingProjectId ? "Editar proyecto" : "Crear proyecto" : section === "tasks" ? editingTaskId ? "Editar tarea" : "Crear tarea" : section === "activities" ? editingActivityId ? "Editar actividad" : "Crear actividad" : editingAssignment ? `Editar ${getAssignmentKindLabel(assignmentFormKind).toLowerCase()}` : "Crear asignacion"}
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>Complete los campos y guarde los cambios.</p>
          </div>
          <Button variant="outline" size="sm" onClick={closeForm}>Cerrar</Button>
        </div>
        <div className="max-h-[75vh] space-y-4 overflow-y-auto p-4">
          {section === "projects" ? <div className="grid gap-3 md:grid-cols-2"><InputField value={projectForm.code} onChange={(value) => setProjectForm((current) => ({ ...current, code: value }))} placeholder="Codigo (ej: PROJ-001, auto si vacío)" /><InputField value={projectForm.name} onChange={(value) => setProjectForm((current) => ({ ...current, name: value }))} placeholder="Nombre del proyecto" /><SelectField value={projectForm.areaId} onChange={(value) => setProjectForm((current) => ({ ...current, areaId: value }))} options={catalogs.areas} placeholder="Area" /><SelectField value={projectForm.stateCode} onChange={(value) => setProjectForm((current) => ({ ...current, stateCode: value }))} options={catalogs.projectStates} placeholder="Estado" /><InputField value={projectForm.startDate} onChange={(value) => setProjectForm((current) => ({ ...current, startDate: value }))} placeholder="Fecha inicio" type="date" /><InputField value={projectForm.endDate} onChange={(value) => setProjectForm((current) => ({ ...current, endDate: value }))} placeholder="Fecha fin" type="date" /><InputField value={projectForm.budget} onChange={(value) => setProjectForm((current) => ({ ...current, budget: value }))} placeholder="Presupuesto" type="number" /><div className="md:col-span-2"><ImageUploadField label="Imagen del proyecto (opcional)" existingUrl={projectForm.imageUrl || null} previewFile={projectForm.imageFile} onFileSelect={(file) => setProjectForm((current) => ({ ...current, imageFile: file }))} onClear={() => setProjectForm((current) => ({ ...current, imageFile: null, imageUrl: "" }))} /></div><div className="md:col-span-2"><TextareaField value={projectForm.description} onChange={(value) => setProjectForm((current) => ({ ...current, description: value }))} placeholder="Descripcion del proyecto" /></div></div> : null}
          {section === "tasks" ? (
            <div className="grid gap-3 md:grid-cols-2">
              {/* Cascading: first pick a project to filter the activities list */}
              <SelectField
                value={taskFormProjectFilter}
                onChange={(value) => {
                  setTaskFormProjectFilter(value);
                  setTaskForm((current) => ({ ...current, activityId: "" }));
                }}
                options={catalogs.projects}
                placeholder="Proyecto (para filtrar actividad)"
              />
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
              <SelectField
                value={taskForm.statusCode}
                onChange={(value) => setTaskForm((current) => ({ ...current, statusCode: value as TaskFormValues["statusCode"] }))}
                options={catalogs.taskStates.map((item) => ({ value: item.code, label: item.label }))}
                placeholder="Estado"
              />
              <InputField value={taskForm.deadline} onChange={(value) => setTaskForm((current) => ({ ...current, deadline: value }))} placeholder="Fecha limite" type="date" />
              <InputField value={taskForm.title} onChange={(value) => setTaskForm((current) => ({ ...current, title: value }))} placeholder="Titulo de la tarea" />
              <div className="md:col-span-2">
                <TextareaField value={taskForm.description} onChange={(value) => setTaskForm((current) => ({ ...current, description: value }))} placeholder="Descripcion de la tarea" />
              </div>
            </div>
          ) : null}
          {section === "activities" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <SelectField value={activityForm.projectId} onChange={(value) => setActivityForm((current) => ({ ...current, projectId: value }))} options={catalogs.projects} placeholder="Proyecto" />
              <SelectField value={activityForm.statusCode} onChange={(value) => setActivityForm((current) => ({ ...current, statusCode: value as ActivityFormValues["statusCode"] }))} options={catalogs.activityStates.map((item) => ({ value: item.code, label: item.label }))} placeholder="Estado" />
              <InputField value={activityForm.title} onChange={(value) => setActivityForm((current) => ({ ...current, title: value }))} placeholder="Titulo de la actividad" />
              <InputField value={activityForm.estimatedHours} onChange={(value) => setActivityForm((current) => ({ ...current, estimatedHours: value }))} placeholder="Horas estimadas" type="number" />
              <InputField value={activityForm.startAt} onChange={(value) => setActivityForm((current) => ({ ...current, startAt: value }))} placeholder="Fecha inicio" type="date" />
              <InputField value={activityForm.endAt} onChange={(value) => setActivityForm((current) => ({ ...current, endAt: value }))} placeholder="Fecha fin" type="date" />
              <div className="md:col-span-2"><SelectField value={activityForm.locationId} onChange={(value) => setActivityForm((current) => ({ ...current, locationId: value }))} options={catalogs.locations} placeholder="Ubicacion (opcional)" /></div>
              <div className="md:col-span-2"><TextareaField value={activityForm.description} onChange={(value) => setActivityForm((current) => ({ ...current, description: value }))} placeholder="Descripcion de la actividad" /></div>
            </div>
          ) : null}
          {section === "assignments" ? <div className="space-y-4">{!editingAssignment ? <SelectField value={assignmentFormKind} onChange={(value) => setAssignmentFormKind(value as AssignmentKind)} options={[{ value: "project-volunteer", label: "Voluntario en proyecto" }, { value: "activity-volunteer", label: "Voluntario en actividad" }, { value: "project-resource", label: "Recurso de proyecto" }]} placeholder="Tipo de asignacion" /> : null}{assignmentFormKind === "project-volunteer" ? <div className="grid gap-3 md:grid-cols-2"><SelectField value={projectVolunteerAssignmentForm.projectId} onChange={(value) => setProjectVolunteerAssignmentForm((current) => ({ ...current, projectId: value }))} options={catalogs.projects} placeholder="Proyecto" /><SelectField value={projectVolunteerAssignmentForm.volunteerId} onChange={(value) => setProjectVolunteerAssignmentForm((current) => ({ ...current, volunteerId: value }))} options={catalogs.volunteers} placeholder="Voluntario" /><InputField value={projectVolunteerAssignmentForm.role} onChange={(value) => setProjectVolunteerAssignmentForm((current) => ({ ...current, role: value }))} placeholder="Rol en proyecto" /><InputField value={projectVolunteerAssignmentForm.joinedAt} onChange={(value) => setProjectVolunteerAssignmentForm((current) => ({ ...current, joinedAt: value }))} placeholder="Fecha ingreso" type="date" /><label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}><input type="checkbox" checked={projectVolunteerAssignmentForm.active} onChange={(event) => setProjectVolunteerAssignmentForm((current) => ({ ...current, active: event.target.checked }))} />Asignacion activa</label></div> : null}{assignmentFormKind === "activity-volunteer" ? <div className="grid gap-3 md:grid-cols-2"><SelectField value={activityVolunteerAssignmentForm.activityId} onChange={(value) => setActivityVolunteerAssignmentForm((current) => ({ ...current, activityId: value }))} options={catalogs.activities} placeholder="Actividad" /><SelectField value={activityVolunteerAssignmentForm.volunteerId} onChange={(value) => setActivityVolunteerAssignmentForm((current) => ({ ...current, volunteerId: value }))} options={catalogs.volunteers} placeholder="Voluntario" /><div className="md:col-span-2"><InputField value={activityVolunteerAssignmentForm.role} onChange={(value) => setActivityVolunteerAssignmentForm((current) => ({ ...current, role: value }))} placeholder="Rol en actividad" /></div></div> : null}{assignmentFormKind === "project-resource" ? <div className="grid gap-3 md:grid-cols-2"><SelectField value={projectResourceAssignmentForm.projectId} onChange={(value) => setProjectResourceAssignmentForm((current) => ({ ...current, projectId: value }))} options={catalogs.projects} placeholder="Proyecto" /><SelectField value={projectResourceAssignmentForm.itemId} onChange={(value) => setProjectResourceAssignmentForm((current) => ({ ...current, itemId: value }))} options={catalogs.items} placeholder="Item" /><InputField value={projectResourceAssignmentForm.quantityRequired} onChange={(value) => setProjectResourceAssignmentForm((current) => ({ ...current, quantityRequired: value }))} placeholder="Cantidad requerida" type="number" /><InputField value={projectResourceAssignmentForm.quantityAssigned} onChange={(value) => setProjectResourceAssignmentForm((current) => ({ ...current, quantityAssigned: value }))} placeholder="Cantidad asignada" type="number" /></div> : null}</div> : null}
        </div>
        <div className="flex gap-2 border-t border-[var(--t-border)] px-4 py-3"><Button onClick={() => void handleSubmitForm()} disabled={mutations.isSaving}>{mutations.isSaving ? "Guardando..." : "Guardar"}</Button><Button variant="outline" onClick={closeForm}>Cancelar</Button></div>
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
