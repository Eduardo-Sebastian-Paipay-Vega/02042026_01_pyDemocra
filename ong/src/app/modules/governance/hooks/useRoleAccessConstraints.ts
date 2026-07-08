import { useCallback, useState } from "react";
import type { RoleAccessConstraintFormInput, RoleAccessConstraintMutationInput } from "../types";
import {
  createRoleAccessConstraint,
  deleteRoleAccessConstraint,
  updateRoleAccessConstraint,
} from "../../../services/gobernanza/sensitiveAccess.service";

export function useRoleAccessConstraints(onCompleted?: () => void) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const create = useCallback(
    async (input: RoleAccessConstraintFormInput) => {
      if (isCreating) {
        return;
      }

      setIsCreating(true);
      try {
        await createRoleAccessConstraint(input);
        onCompleted?.();
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, onCompleted]
  );

  const update = useCallback(
    async (input: RoleAccessConstraintMutationInput) => {
      if (isUpdating) {
        return;
      }

      setIsUpdating(true);
      try {
        await updateRoleAccessConstraint(input);
        onCompleted?.();
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, onCompleted]
  );

  const remove = useCallback(
    async (constraintId: string) => {
      if (isRemoving) {
        return;
      }

      setIsRemoving(true);
      try {
        await deleteRoleAccessConstraint(constraintId);
        onCompleted?.();
      } finally {
        setIsRemoving(false);
      }
    },
    [isRemoving, onCompleted]
  );

  return {
    isCreating,
    isUpdating,
    isRemoving,
    create,
    update,
    remove,
  };
}
