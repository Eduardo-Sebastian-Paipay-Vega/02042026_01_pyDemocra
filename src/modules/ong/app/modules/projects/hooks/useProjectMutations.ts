import { useCallback, useState } from "react";
import type {
  ActivityFormValues,
  ActivityVolunteerAssignmentFormValues,
  ProjectFormValues,
  ProjectResourceAssignmentFormValues,
  ProjectVolunteerAssignmentFormValues,
  TaskFormValues,
} from "../types";
import {
  createActivity,
  deleteActivity,
  updateActivity,
} from "../../../services/proyectos/activities.service";
import {
  createActivityVolunteerAssignment,
  createProjectResourceAssignment,
  createProjectVolunteerAssignment,
  deactivateProjectVolunteerAssignment,
  removeActivityVolunteerAssignment,
  removeProjectResourceAssignment,
  updateActivityVolunteerAssignment,
  updateProjectResourceAssignment,
  updateProjectVolunteerAssignment,
} from "../../../services/proyectos/assignments.service";
import {
  archiveProject,
  createProject,
  updateProject,
} from "../../../services/proyectos/projects.service";
import {
  cancelTask,
  createTask,
  updateTask,
} from "../../../services/proyectos/tasks.service";

export function useProjectMutations(onSuccess?: () => void) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const wrapSave = useCallback(
    async <TResult,>(executor: () => Promise<TResult>) => {
      if (isSaving) {
        return null as TResult | null;
      }

      setIsSaving(true);
      try {
        const response = await executor();
        onSuccess?.();
        return response;
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, onSuccess]
  );

  const wrapDelete = useCallback(
    async (executor: () => Promise<void>) => {
      if (isDeleting) {
        return;
      }

      setIsDeleting(true);
      try {
        await executor();
        onSuccess?.();
      } finally {
        setIsDeleting(false);
      }
    },
    [isDeleting, onSuccess]
  );

  return {
    isSaving,
    isDeleting,
    createProject: (input: ProjectFormValues) => wrapSave(() => createProject(input)),
    updateProject: (id: string, input: ProjectFormValues) =>
      wrapSave(() => updateProject(id, input)),
    archiveProject: (id: string) => wrapSave(() => archiveProject(id)),

    createTask: (input: TaskFormValues) => wrapSave(() => createTask(input)),
    updateTask: (id: string, input: TaskFormValues) =>
      wrapSave(() => updateTask(id, input)),
    cancelTask: (id: string) => wrapSave(() => cancelTask(id)),

    createActivity: (input: ActivityFormValues) => wrapSave(() => createActivity(input)),
    updateActivity: (id: string, input: ActivityFormValues) =>
      wrapSave(() => updateActivity(id, input)),
    deleteActivity: (id: string) => wrapDelete(() => deleteActivity(id)),

    createProjectVolunteerAssignment: (input: ProjectVolunteerAssignmentFormValues) =>
      wrapSave(() => createProjectVolunteerAssignment(input)),
    updateProjectVolunteerAssignment: (
      id: string,
      input: ProjectVolunteerAssignmentFormValues
    ) => wrapSave(() => updateProjectVolunteerAssignment(id, input)),
    deactivateProjectVolunteerAssignment: (id: string) =>
      wrapSave(() => deactivateProjectVolunteerAssignment(id)),

    createActivityVolunteerAssignment: (input: ActivityVolunteerAssignmentFormValues) =>
      wrapSave(() => createActivityVolunteerAssignment(input)),
    updateActivityVolunteerAssignment: (
      id: string,
      input: ActivityVolunteerAssignmentFormValues
    ) => wrapSave(() => updateActivityVolunteerAssignment(id, input)),
    removeActivityVolunteerAssignment: (id: string) =>
      wrapDelete(() => removeActivityVolunteerAssignment(id)),

    createProjectResourceAssignment: (input: ProjectResourceAssignmentFormValues) =>
      wrapSave(() => createProjectResourceAssignment(input)),
    updateProjectResourceAssignment: (
      id: string,
      input: ProjectResourceAssignmentFormValues
    ) => wrapSave(() => updateProjectResourceAssignment(id, input)),
    removeProjectResourceAssignment: (id: string) =>
      wrapDelete(() => removeProjectResourceAssignment(id)),
  };
}

