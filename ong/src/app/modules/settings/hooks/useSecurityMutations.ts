import { useCallback, useState, useRef } from "react";
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

  const isTerminatingRef = useRef(false);
  const isUpdatingRef = useRef(false);
  const isSavingRef = useRef(false);
  const isRemovingRef = useRef(false);

  const closeSession = useCallback(
    async (input: SessionTerminationInput) => {
      if (isTerminatingRef.current) {
        return;
      }

      isTerminatingRef.current = true;
      setIsTerminatingSession(true);
      try {
        await terminateSession(input);
        onCompleted?.();
      } finally {
        isTerminatingRef.current = false;
        setIsTerminatingSession(false);
      }
    },
    [isTerminatingSession, onCompleted]
  );

  const updateDeviceTrust = useCallback(
    async (input: DeviceTrustInput) => {
      if (isUpdatingRef.current) {
        return;
      }

      isUpdatingRef.current = true;
      setIsUpdatingDevice(true);
      try {
        await setDeviceTrust(input);
        onCompleted?.();
      } finally {
        isUpdatingRef.current = false;
        setIsUpdatingDevice(false);
      }
    },
    [isUpdatingDevice, onCompleted]
  );

  const saveTerminal = useCallback(
    async (input: TerminalMutationInput) => {
      if (isSavingRef.current) {
        return;
      }

      isSavingRef.current = true;
      setIsSavingTerminal(true);
      try {
        if (input.terminalId) {
          await updateTerminal(input);
        } else {
          await createTerminal(input);
        }
        onCompleted?.();
      } finally {
        isSavingRef.current = false;
        setIsSavingTerminal(false);
      }
    },
    [isSavingTerminal, onCompleted]
  );

  const removeTerminal = useCallback(
    async (terminalId: string) => {
      if (isRemovingRef.current) {
        return;
      }

      isRemovingRef.current = true;
      setIsRemovingTerminal(true);
      try {
        await deleteTerminal(terminalId);
        onCompleted?.();
      } finally {
        isRemovingRef.current = false;
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
