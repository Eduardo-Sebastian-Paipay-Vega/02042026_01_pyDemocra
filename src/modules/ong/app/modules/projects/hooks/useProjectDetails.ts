import { useCallback, useState } from "react";
import type {
  AssignmentDetailData,
  AssignmentRow,
  ProjectDetailData,
  ProjectModuleSection,
  TaskDetailData,
  ActivityDetailData,
} from "../types";
import { getActivityDetail } from "../../../services/proyectos/activities.service";
import { getAssignmentDetail } from "../../../services/proyectos/assignments.service";
import { getProjectDetail } from "../../../services/proyectos/projects.service";
import { getTaskDetail } from "../../../services/proyectos/tasks.service";

type SectionDetail =
  | ProjectDetailData
  | TaskDetailData
  | ActivityDetailData
  | AssignmentDetailData
  | null;

interface DetailRequest {
  section: ProjectModuleSection;
  id: string;
  assignmentKind?: AssignmentRow["kind"];
}

export function useProjectDetails() {
  const [detail, setDetail] = useState<SectionDetail>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<DetailRequest | null>(null);

  const clear = useCallback(() => {
    setDetail(null);
    setLoading(false);
    setError(null);
    setRequest(null);
  }, []);

  const load = useCallback(async (nextRequest: DetailRequest) => {
    setRequest(nextRequest);
    setLoading(true);
    setError(null);

    try {
      const response =
        nextRequest.section === "projects"
          ? await getProjectDetail(nextRequest.id)
          : nextRequest.section === "tasks"
          ? await getTaskDetail(nextRequest.id)
          : nextRequest.section === "activities"
          ? await getActivityDetail(nextRequest.id)
          : await getAssignmentDetail(
              nextRequest.assignmentKind ?? "project-volunteer",
              nextRequest.id
            );

      if (!response) {
        throw new Error("El registro ya no esta disponible.");
      }

      setDetail(response);
      return response;
    } catch (loadError) {
      setDetail(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el detalle solicitado."
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    if (!request) {
      return null;
    }

    return load(request);
  }, [load, request]);

  return {
    detail,
    loading,
    error,
    load,
    reload,
    clear,
  };
}

