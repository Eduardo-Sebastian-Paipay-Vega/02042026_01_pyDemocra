import { useCallback, useEffect, useState } from "react";
import type {
  ActivityListFilters,
  ActivityRow,
  AssignmentListFilters,
  AssignmentRow,
  ProjectListFilters,
  ProjectModuleSection,
  ProjectRow,
  TaskListFilters,
  TaskRow,
} from "../types";
import { listActivities } from "../../../services/proyectos/activities.service";
import { listAssignments } from "../../../services/proyectos/assignments.service";
import { listProjects } from "../../../services/proyectos/projects.service";
import { listTasks } from "../../../services/proyectos/tasks.service";

type SectionRows = ProjectRow[] | TaskRow[] | ActivityRow[] | AssignmentRow[];

const EMPTY_ROWS: SectionRows = [];

interface UseProjectSectionDataInput {
  section: ProjectModuleSection;
  projectFilters: ProjectListFilters;
  taskFilters: TaskListFilters;
  activityFilters: ActivityListFilters;
  assignmentFilters: AssignmentListFilters;
}

export function useProjectSectionData({
  section,
  projectFilters,
  taskFilters,
  activityFilters,
  assignmentFilters,
}: UseProjectSectionDataInput) {
  const [rows, setRows] = useState<SectionRows>(EMPTY_ROWS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const loader =
      section === "projects"
        ? listProjects(projectFilters)
        : section === "tasks"
        ? listTasks(taskFilters)
        : section === "activities"
        ? listActivities(activityFilters)
        : listAssignments(assignmentFilters);

    loader
      .then((response) => {
        if (!active) {
          return;
        }
        setRows(response);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setRows(EMPTY_ROWS);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la seccion del modulo Proyectos."
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    section,
    reloadToken,
    projectFilters.searchTerm,
    projectFilters.stateCode,
    projectFilters.areaId,
    taskFilters.searchTerm,
    taskFilters.activityId,
    taskFilters.statusCode,
    activityFilters.searchTerm,
    activityFilters.projectId,
    activityFilters.statusCode,
    activityFilters.locationId,
    activityFilters.dateFrom,
    activityFilters.dateTo,
    assignmentFilters.searchTerm,
    assignmentFilters.kind,
    assignmentFilters.projectId,
    assignmentFilters.taskId,
    assignmentFilters.activityId,
    assignmentFilters.volunteerId,
    assignmentFilters.itemId,
    assignmentFilters.activeState,
  ]);

  return {
    rows,
    loading,
    error,
    refresh,
  };
}
