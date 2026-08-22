import { useCallback, useState } from "react";
import type { GovernanceRestoreCandidateRow } from "../types";
import { restoreGovernanceSoftDeletedRecord } from "../../../services/gobernanza/retention.service";

export function useGovernanceRestore(onCompleted?: () => void) {
  const [isRestoring, setIsRestoring] = useState(false);

  const restore = useCallback(
    async (row: GovernanceRestoreCandidateRow) => {
      if (isRestoring) {
        return;
      }

      setIsRestoring(true);
      try {
        await restoreGovernanceSoftDeletedRecord(row.schemaName, row.tableName, row.id);
        onCompleted?.();
      } finally {
        setIsRestoring(false);
      }
    },
    [isRestoring, onCompleted]
  );

  return {
    isRestoring,
    restore,
  };
}

