import { useCallback, useEffect, useState } from "react";
import {
  createComprobanteFinanciero,
  listComprobantesByTransaccion,
  removeOrVoidComprobanteFinanciero,
  updateComprobanteFinanciero,
} from "../../../services/recursos/comprobantesFinancieros.service";
import type {
  FinancialReceiptCreateInput,
  FinancialReceiptRow,
  FinancialReceiptUpdateInput,
} from "../types";

export function useComprobantesFinancieros(transactionId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FinancialReceiptRow[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!transactionId) {
      setRows([]);
      setError(null);
      setLoading(false);
      return;
    }

    const tid = transactionId;
    let isActive = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await listComprobantesByTransaccion(tid);

        if (!isActive) {
          return;
        }

        setRows(response);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setRows([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar los comprobantes."
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, [transactionId, reloadToken]);

  const create = useCallback(
    async (input: FinancialReceiptCreateInput) => {
      if (isCreating) {
        return null;
      }

      setIsCreating(true);
      try {
        const result = await createComprobanteFinanciero(input);
        refresh();
        return result;
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, refresh]
  );

  const update = useCallback(
    async (input: FinancialReceiptUpdateInput) => {
      if (isUpdating) {
        return null;
      }

      setIsUpdating(true);
      try {
        const result = await updateComprobanteFinanciero(input);
        refresh();
        return result;
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, refresh]
  );

  const remove = useCallback(
    async (receiptId: string) => {
      if (isRemoving) {
        return null;
      }

      setIsRemoving(true);
      try {
        const result = await removeOrVoidComprobanteFinanciero(receiptId);
        refresh();
        return result;
      } finally {
        setIsRemoving(false);
      }
    },
    [isRemoving, refresh]
  );

  return {
    loading,
    error,
    rows,
    isCreating,
    isUpdating,
    isRemoving,
    create,
    update,
    remove,
    refresh,
  };
}
