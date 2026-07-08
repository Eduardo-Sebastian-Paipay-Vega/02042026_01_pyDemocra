import { useCallback, useState, useRef } from "react";
import type { VolunteerDetailData, VolunteerUpsertInput } from "../types";
import {
  createVolunteer,
  deactivateVolunteer,
  updateVolunteer,
} from "../../../services/personas/volunteers.service";

export function useVolunteerMutations(onSuccess?: () => void) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const isSavingRef = useRef(false);
  const isDeactivatingRef = useRef(false);

  const create = useCallback(
    async (input: VolunteerUpsertInput): Promise<VolunteerDetailData | null> => {
      if (isSavingRef.current) {
        return null;
      }

      isSavingRef.current = true;
      setIsSaving(true);
      try {
        const response = await createVolunteer(input);
        onSuccess?.();
        return response;
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    },
    [isSaving, onSuccess]
  );

  const update = useCallback(
    async (
      volunteerId: string,
      input: VolunteerUpsertInput
    ): Promise<VolunteerDetailData | null> => {
      if (isSavingRef.current) {
        return null;
      }

      isSavingRef.current = true;
      setIsSaving(true);
      try {
        const response = await updateVolunteer(volunteerId, input);
        onSuccess?.();
        return response;
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    },
    [isSaving, onSuccess]
  );

  const deactivate = useCallback(
    async (volunteerId: string): Promise<VolunteerDetailData | null> => {
      if (isDeactivatingRef.current) {
        return null;
      }

      isDeactivatingRef.current = true;
      setIsDeactivating(true);
      try {
        const response = await deactivateVolunteer(volunteerId);
        onSuccess?.();
        return response;
      } finally {
        isDeactivatingRef.current = false;
        setIsDeactivating(false);
      }
    },
    [isDeactivating, onSuccess]
  );

  return {
    isSaving,
    isDeactivating,
    create,
    update,
    deactivate,
  };
}
