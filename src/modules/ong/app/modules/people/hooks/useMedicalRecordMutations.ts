import { useCallback, useState } from "react";
import type {
  BeneficiaryMedicalDetail,
  BeneficiaryMedicalRecordInput,
  VolunteerSensitiveDetail,
  VolunteerSensitiveRecordInput,
} from "../types";
import {
  saveBeneficiaryMedicalRecord,
  saveVolunteerSensitiveRecord,
} from "../../../services/clinico/medicalRecords.service";

export function useMedicalRecordMutations(onSuccess?: () => void) {
  const [isSaving, setIsSaving] = useState(false);

  const saveBeneficiary = useCallback(
    async (options: {
      beneficiaryId: string;
      input: BeneficiaryMedicalRecordInput;
    }): Promise<BeneficiaryMedicalDetail | null> => {
      if (isSaving) {
        return null;
      }

      setIsSaving(true);
      try {
        const response = await saveBeneficiaryMedicalRecord(options);
        onSuccess?.();
        return response;
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, onSuccess]
  );

  const saveVolunteer = useCallback(
    async (options: {
      volunteerId: string;
      input: VolunteerSensitiveRecordInput;
    }): Promise<VolunteerSensitiveDetail | null> => {
      if (isSaving) {
        return null;
      }

      setIsSaving(true);
      try {
        const response = await saveVolunteerSensitiveRecord(options);
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
    saveBeneficiary,
    saveVolunteer,
  };
}

