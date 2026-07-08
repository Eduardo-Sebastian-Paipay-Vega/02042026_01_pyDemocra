import { useCallback, useState } from "react";
import type { BeneficiaryDetailData, BeneficiaryUpsertInput } from "../types";
import {
  createBeneficiary,
  updateBeneficiary,
} from "../../../services/personas/beneficiaries.service";

export function useBeneficiaryMutations(onSuccess?: () => void) {
  const [isSaving, setIsSaving] = useState(false);

  const create = useCallback(
    async (input: BeneficiaryUpsertInput): Promise<BeneficiaryDetailData | null> => {
      if (isSaving) {
        return null;
      }

      setIsSaving(true);
      try {
        const response = await createBeneficiary(input);
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
      beneficiaryId: string,
      input: BeneficiaryUpsertInput
    ): Promise<BeneficiaryDetailData | null> => {
      if (isSaving) {
        return null;
      }

      setIsSaving(true);
      try {
        const response = await updateBeneficiary(beneficiaryId, input);
        onSuccess?.();
        return response;
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, onSuccess]
  );

  return {
    isSaving,
    create,
    update,
  };
}
