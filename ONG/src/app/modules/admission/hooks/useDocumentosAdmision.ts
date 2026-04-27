import { useCallback, useEffect, useState } from "react";
import {
  createDocumentoAdmision,
  listDocumentosBySolicitud,
  removeDocumentoAdmision,
  updateDocumentoAdmision,
} from "../../../services/admision/solicitudesAdmision.service";
import type {
  AdmissionDocumentCreateInput,
  AdmissionDocumentRow,
  AdmissionDocumentUpdateInput,
} from "../types";

interface AdmissionDocumentsState {
  rows: AdmissionDocumentRow[];
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: AdmissionDocumentsState = {
  rows: [],
  loading: false,
  error: null,
};

function sortDocumentRows(rows: AdmissionDocumentRow[]) {
  return [...rows].sort(
    (left, right) =>
      new Date(right.updatedAt || right.createdAt).getTime() -
      new Date(left.updatedAt || left.createdAt).getTime()
  );
}

export function useDocumentosAdmision(requestId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<AdmissionDocumentsState>(INITIAL_STATE);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!requestId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    listDocumentosBySolicitud(requestId)
      .then((rows) => {
        if (!isActive) {
          return;
        }

        setState({
          rows,
          loading: false,
          error: null,
        });
      })
      .catch((loadError: unknown) => {
        if (!isActive) {
          return;
        }

        setState({
          rows: [],
          loading: false,
          error:
            loadError instanceof Error
              ? loadError.message
              : "No se pudieron cargar los documentos de admision.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [requestId, reloadToken]);

  return {
    rows: state.rows,
    loading: state.loading,
    error: state.error,
    isCreating,
    isUpdating,
    isRemoving,
    create: async (input: AdmissionDocumentCreateInput) => {
      if (isCreating) {
        return null;
      }
      setIsCreating(true);
      try {
        const response = await createDocumentoAdmision(input);
        setState((current) => ({
          rows: sortDocumentRows([response, ...current.rows.filter((row) => row.id !== response.id)]),
          loading: false,
          error: null,
        }));
        return response;
      } finally {
        setIsCreating(false);
      }
    },
    update: async (input: AdmissionDocumentUpdateInput) => {
      if (isUpdating) {
        return null;
      }
      setIsUpdating(true);
      try {
        const response = await updateDocumentoAdmision(input);
        setState((current) => ({
          rows: sortDocumentRows(
            current.rows.some((row) => row.id === response.id)
              ? current.rows.map((row) => (row.id === response.id ? response : row))
              : [response, ...current.rows]
          ),
          loading: false,
          error: null,
        }));
        return response;
      } finally {
        setIsUpdating(false);
      }
    },
    remove: async (documentId: string) => {
      if (isRemoving) {
        return null;
      }
      setIsRemoving(true);
      try {
        const response = await removeDocumentoAdmision(documentId);
        setState((current) => ({
          rows: current.rows.filter((row) => row.id !== documentId),
          loading: false,
          error: null,
        }));
        return response;
      } finally {
        setIsRemoving(false);
      }
    },
    refresh,
  };
}
