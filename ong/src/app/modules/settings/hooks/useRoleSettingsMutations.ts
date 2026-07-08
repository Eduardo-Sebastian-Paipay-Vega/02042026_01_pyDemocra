import { useCallback, useState } from "react";
import type { RoleMutationInput } from "../types";
import {
  createRole,
  deleteRole,
  updateRole,
} from "../../../services/configuracion/roles.service";

export function useRoleSettingsMutations(onCompleted?: () => void) {
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const save = useCallback(
    async (input: RoleMutationInput) => {
      if (isSaving) {
        return;
      }

      setIsSaving(true);
      try {
        if (input.roleId) {
          await updateRole(input);
        } else {
          await createRole(input);
        }
        onCompleted?.();
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, onCompleted]
  );

  const remove = useCallback(
    async (roleId: string) => {
      if (isRemoving) {
        return;
      }

      setIsRemoving(true);
      try {
        await deleteRole(roleId);
        onCompleted?.();
      } finally {
        setIsRemoving(false);
      }
    },
    [isRemoving, onCompleted]
  );

  return {
    isSaving,
    isRemoving,
    save,
    remove,
  };
}
