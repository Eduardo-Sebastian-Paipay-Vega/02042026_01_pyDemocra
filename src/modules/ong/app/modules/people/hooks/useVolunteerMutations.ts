import { useCallback, useState } from "react";
import type { VolunteerDetailData, VolunteerUpsertInput } from "../types";
import {
  createVolunteer,
  deactivateVolunteer,
  updateVolunteer,
} from "../../../services/personas/volunteers.service";

export function useVolunteerMutations(onSuccess?: () => void) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const create = useCallback(
    async (input: VolunteerUpsertInput): Promise<VolunteerDetailData | null> => {
      if (isSaving) {
        return null;
      }

      setIsSaving(true);
      try {
        const response = await createVolunteer(input);
        onSuccess?.();
        return response;
      } finally {
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
      if (isSaving) {
        return null;
      }

      setIsSaving(true);
      try {
        const response = await updateVolunteer(volunteerId, input);
        onSuccess?.();
        return response;
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, onSuccess]
  );

  const deactivate = useCallback(
    async (volunteerId: string): Promise<VolunteerDetailData | null> => {
      if (isDeactivating) {
        return null;
      }

      setIsDeactivating(true);
      try {
        const response = await deactivateVolunteer(volunteerId);
        onSuccess?.();
        return response;
      } finally {
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
