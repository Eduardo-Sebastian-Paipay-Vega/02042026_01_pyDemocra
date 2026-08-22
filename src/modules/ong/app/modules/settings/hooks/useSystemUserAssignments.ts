import { useCallback, useState } from "react";
import type {
  SystemUserAssignmentInput,
  SystemUserProvisionInput,
  SystemUserProvisionResult,
  SystemUserSessionsRevokeInput,
  SystemUserSessionsRevokeResult,
} from "../types";
import {
  provisionSystemUser,
  revokeSystemUserAccess,
  revokeSystemUserSessions,
  upsertSystemUserAssignments,
} from "../../../services/configuracion/systemUsers.service";

export function useSystemUserAssignments(onCompleted?: () => void) {
  const [isSaving, setIsSaving] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);

  const save = useCallback(
    async (input: SystemUserAssignmentInput) => {
      if (isSaving) {
        return;
      }

      setIsSaving(true);
      try {
        await upsertSystemUserAssignments(input);
        onCompleted?.();
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, onCompleted]
  );

  const revoke = useCallback(
    async (userId: string) => {
      if (isRevoking) {
        return;
      }

      setIsRevoking(true);
      try {
        await revokeSystemUserAccess(userId);
        onCompleted?.();
      } finally {
        setIsRevoking(false);
      }
    },
    [isRevoking, onCompleted]
  );

  const provision = useCallback(
    async (input: SystemUserProvisionInput): Promise<SystemUserProvisionResult | null> => {
      if (isProvisioning) {
        return null;
      }

      setIsProvisioning(true);
      try {
        const response = await provisionSystemUser(input);
        onCompleted?.();
        return response;
      } finally {
        setIsProvisioning(false);
      }
    },
    [isProvisioning, onCompleted]
  );

  const revokeSessions = useCallback(
    async (
      input: SystemUserSessionsRevokeInput
    ): Promise<SystemUserSessionsRevokeResult | null> => {
      if (isRevokingSessions) {
        return null;
      }

      setIsRevokingSessions(true);
      try {
        const response = await revokeSystemUserSessions(input);
        onCompleted?.();
        return response;
      } finally {
        setIsRevokingSessions(false);
      }
    },
    [isRevokingSessions, onCompleted]
  );

  return {
    isSaving,
    isRevoking,
    isProvisioning,
    isRevokingSessions,
    save,
    revoke,
    provision,
    revokeSessions,
  };
}

