import { useCallback, useState } from "react";
import {
  assignVoluntarioActividad,
  changeEstadoActividad,
  createActividad,
  removeAsignacionActividad,
  softDeleteActividad,
  updateActividad,
  updateAsignacionActividad,
} from "../../../services/operacion/actividades.service";
import type {
  ActivityAssignmentCreateInput,
  ActivityAssignmentUpdateInput,
  ActivityCreateInput,
  ActivityUpdateInput,
} from "../types";

export function useActividadMutations(onSuccess?: () => void) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState(false);

  const create = useCallback(
    async (input: ActivityCreateInput) => {
      if (isSaving) {
        return null;
      }
      setIsSaving(true);
      try {
        const response = await createActividad(input);
        onSuccess?.();
        return response;
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, onSuccess]
  );

  const update = useCallback(
    async (activityId: string, input: ActivityUpdateInput) => {
      if (isSaving) {
        return null;
      }
      setIsSaving(true);
      try {
        const response = await updateActividad(activityId, input);
        onSuccess?.();
        return response;
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, onSuccess]
  );

  const remove = useCallback(
    async (activityId: string, actorId?: string | null) => {
      if (isDeleting) {
        return;
      }
      setIsDeleting(true);
      try {
        await softDeleteActividad(activityId, actorId);
        onSuccess?.();
      } finally {
        setIsDeleting(false);
      }
    },
    [isDeleting, onSuccess]
  );

  const quickChangeState = useCallback(
    async (activityId: string, stateId: number, actorId?: string | null) => {
      if (isSaving) {
        return;
      }
      setIsSaving(true);
      try {
        await changeEstadoActividad(activityId, stateId, actorId);
        onSuccess?.();
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, onSuccess]
  );

  const assignVolunteer = useCallback(
    async (input: ActivityAssignmentCreateInput) => {
      if (isAssigning) {
        return null;
      }
      setIsAssigning(true);
      try {
        const response = await assignVoluntarioActividad(input);
        onSuccess?.();
        return response;
      } finally {
        setIsAssigning(false);
      }
    },
    [isAssigning, onSuccess]
  );

  const updateAssignment = useCallback(
    async (input: ActivityAssignmentUpdateInput) => {
      if (isUpdatingAssignment) {
        return null;
      }
      setIsUpdatingAssignment(true);
      try {
        const response = await updateAsignacionActividad(input);
        onSuccess?.();
        return response;
      } finally {
        setIsUpdatingAssignment(false);
      }
    },
    [isUpdatingAssignment, onSuccess]
  );

  const removeAssignment = useCallback(
    async (assignmentId: string) => {
      if (isUpdatingAssignment) {
        return;
      }
      setIsUpdatingAssignment(true);
      try {
        await removeAsignacionActividad(assignmentId);
        onSuccess?.();
      } finally {
        setIsUpdatingAssignment(false);
      }
    },
    [isUpdatingAssignment, onSuccess]
  );

  return {
    isSaving,
    isDeleting,
    isAssigning,
    isUpdatingAssignment,
    create,
    update,
    remove,
    quickChangeState,
    assignVolunteer,
    updateAssignment,
    removeAssignment,
  };
}
