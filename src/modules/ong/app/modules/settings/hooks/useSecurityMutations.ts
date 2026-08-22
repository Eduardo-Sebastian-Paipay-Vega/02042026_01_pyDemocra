import { useCallback, useState } from "react";
import type {
  DeviceTrustInput,
  SessionTerminationInput,
  TerminalMutationInput,
} from "../types";
import {
  createTerminal,
  deleteTerminal,
  setDeviceTrust,
  terminateSession,
  updateTerminal,
} from "../../../services/configuracion/security.service";

export function useSecurityMutations(onCompleted?: () => void) {
  const [isTerminatingSession, setIsTerminatingSession] = useState(false);
  const [isUpdatingDevice, setIsUpdatingDevice] = useState(false);
  const [isSavingTerminal, setIsSavingTerminal] = useState(false);
  const [isRemovingTerminal, setIsRemovingTerminal] = useState(false);

  const closeSession = useCallback(
    async (input: SessionTerminationInput) => {
      if (isTerminatingSession) {
        return;
      }

      setIsTerminatingSession(true);
      try {
        await terminateSession(input);
        onCompleted?.();
      } finally {
        setIsTerminatingSession(false);
      }
    },
    [isTerminatingSession, onCompleted]
  );

  const updateDeviceTrust = useCallback(
    async (input: DeviceTrustInput) => {
      if (isUpdatingDevice) {
        return;
      }

      setIsUpdatingDevice(true);
      try {
        await setDeviceTrust(input);
        onCompleted?.();
      } finally {
        setIsUpdatingDevice(false);
      }
    },
    [isUpdatingDevice, onCompleted]
  );

  const saveTerminal = useCallback(
    async (input: TerminalMutationInput) => {
      if (isSavingTerminal) {
        return;
      }

      setIsSavingTerminal(true);
      try {
        if (input.terminalId) {
          await updateTerminal(input);
        } else {
          await createTerminal(input);
        }
        onCompleted?.();
      } finally {
        setIsSavingTerminal(false);
      }
    },
    [isSavingTerminal, onCompleted]
  );

  const removeTerminal = useCallback(
    async (terminalId: string) => {
      if (isRemovingTerminal) {
        return;
      }

      setIsRemovingTerminal(true);
      try {
        await deleteTerminal(terminalId);
        onCompleted?.();
      } finally {
        setIsRemovingTerminal(false);
      }
    },
    [isRemovingTerminal, onCompleted]
  );

  return {
    isTerminatingSession,
    isUpdatingDevice,
    isSavingTerminal,
    isRemovingTerminal,
    closeSession,
    updateDeviceTrust,
    saveTerminal,
    removeTerminal,
  };
}

