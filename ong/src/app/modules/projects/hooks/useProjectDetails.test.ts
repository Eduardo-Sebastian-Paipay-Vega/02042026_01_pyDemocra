import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useProjectDetails } from "./useProjectDetails";
import * as activitiesService from "../../../services/proyectos/activities.service";
import * as assignmentsService from "../../../services/proyectos/assignments.service";
import * as projectsService from "../../../services/proyectos/projects.service";
import * as tasksService from "../../../services/proyectos/tasks.service";

vi.mock("../../../services/proyectos/activities.service", () => ({
  getActivityDetail: vi.fn(),
}));
vi.mock("../../../services/proyectos/assignments.service", () => ({
  getAssignmentDetail: vi.fn(),
}));
vi.mock("../../../services/proyectos/projects.service", () => ({
  getProjectDetail: vi.fn(),
}));
vi.mock("../../../services/proyectos/tasks.service", () => ({
  getTaskDetail: vi.fn(),
}));

describe("useProjectDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("empieza en el estado inicial sin llamar a ningun servicio", () => {
    const { result } = renderHook(() => useProjectDetails());

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("load() con section 'projects' delega a getProjectDetail", async () => {
    const mockDetail = { id: "proj-1", nombre: "Proyecto A" };
    vi.mocked(projectsService.getProjectDetail).mockResolvedValue(mockDetail as any);

    const { result } = renderHook(() => useProjectDetails());

    let returned: unknown;
    await act(async () => {
      returned = await result.current.load({ section: "projects", id: "proj-1" });
    });

    expect(projectsService.getProjectDetail).toHaveBeenCalledWith("proj-1");
    expect(returned).toEqual(mockDetail);
    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("load() con section 'tasks' delega a getTaskDetail", async () => {
    const mockDetail = { id: "task-1", titulo: "Tarea A" };
    vi.mocked(tasksService.getTaskDetail).mockResolvedValue(mockDetail as any);

    const { result } = renderHook(() => useProjectDetails());

    await act(async () => {
      await result.current.load({ section: "tasks", id: "task-1" });
    });

    expect(tasksService.getTaskDetail).toHaveBeenCalledWith("task-1");
    expect(result.current.detail).toEqual(mockDetail);
  });

  it("load() con section 'activities' delega a getActivityDetail", async () => {
    const mockDetail = { id: "act-1", nombre: "Actividad A" };
    vi.mocked(activitiesService.getActivityDetail).mockResolvedValue(mockDetail as any);

    const { result } = renderHook(() => useProjectDetails());

    await act(async () => {
      await result.current.load({ section: "activities", id: "act-1" });
    });

    expect(activitiesService.getActivityDetail).toHaveBeenCalledWith("act-1");
    expect(result.current.detail).toEqual(mockDetail);
  });

  it("load() con cualquier otra section delega a getAssignmentDetail usando assignmentKind (o el valor por defecto)", async () => {
    const mockDetail = { id: "asig-1", tipo: "project-volunteer" };
    vi.mocked(assignmentsService.getAssignmentDetail).mockResolvedValue(mockDetail as any);

    const { result } = renderHook(() => useProjectDetails());

    await act(async () => {
      await result.current.load({ section: "assignments", id: "asig-1" });
    });

    expect(assignmentsService.getAssignmentDetail).toHaveBeenCalledWith(
      "project-volunteer",
      "asig-1"
    );
    expect(result.current.detail).toEqual(mockDetail);
  });

  it("load() usa el assignmentKind explicito cuando se provee", async () => {
    vi.mocked(assignmentsService.getAssignmentDetail).mockResolvedValue({ id: "asig-2" } as any);

    const { result } = renderHook(() => useProjectDetails());

    await act(async () => {
      await result.current.load({
        section: "assignments",
        id: "asig-2",
        assignmentKind: "project-task",
      });
    });

    expect(assignmentsService.getAssignmentDetail).toHaveBeenCalledWith(
      "project-task",
      "asig-2"
    );
  });

  it("load() falla con un error especifico cuando el servicio resuelve null (registro ya no disponible)", async () => {
    vi.mocked(projectsService.getProjectDetail).mockResolvedValue(null as any);

    const { result } = renderHook(() => useProjectDetails());

    let returned: unknown = "not-set";
    await act(async () => {
      returned = await result.current.load({ section: "projects", id: "proj-1" });
    });

    expect(returned).toBeNull();
    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("El registro ya no esta disponible.");
    expect(result.current.loading).toBe(false);
  });

  it("load() expone el mensaje del Error cuando el servicio rechaza", async () => {
    vi.mocked(projectsService.getProjectDetail).mockRejectedValue(new Error("503 DB Offline"));

    const { result } = renderHook(() => useProjectDetails());

    await act(async () => {
      await result.current.load({ section: "projects", id: "proj-1" });
    });

    expect(result.current.detail).toBeNull();
    expect(result.current.error).toBe("503 DB Offline");
    expect(result.current.loading).toBe(false);
  });

  it("load() usa un mensaje de fallback cuando el error no es una instancia de Error", async () => {
    vi.mocked(projectsService.getProjectDetail).mockRejectedValue("raw string failure");

    const { result } = renderHook(() => useProjectDetails());

    await act(async () => {
      await result.current.load({ section: "projects", id: "proj-1" });
    });

    expect(result.current.error).toBe("No se pudo cargar el detalle solicitado.");
  });

  it("reload() repite la ultima peticion de load()", async () => {
    vi.mocked(projectsService.getProjectDetail).mockResolvedValue({ id: "proj-1" } as any);

    const { result } = renderHook(() => useProjectDetails());

    await act(async () => {
      await result.current.load({ section: "projects", id: "proj-1" });
    });
    expect(projectsService.getProjectDetail).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.reload();
    });
    expect(projectsService.getProjectDetail).toHaveBeenCalledTimes(2);
  });

  it("reload() no hace nada si no hubo una peticion previa de load()", async () => {
    const { result } = renderHook(() => useProjectDetails());

    let returned: unknown = "not-set";
    await act(async () => {
      returned = await result.current.reload();
    });

    expect(returned).toBeNull();
    expect(projectsService.getProjectDetail).not.toHaveBeenCalled();
  });

  it("clear() vuelve al estado inicial", async () => {
    vi.mocked(projectsService.getProjectDetail).mockResolvedValue({ id: "proj-1" } as any);

    const { result } = renderHook(() => useProjectDetails());

    await act(async () => {
      await result.current.load({ section: "projects", id: "proj-1" });
    });
    expect(result.current.detail).not.toBeNull();

    act(() => {
      result.current.clear();
    });

    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
