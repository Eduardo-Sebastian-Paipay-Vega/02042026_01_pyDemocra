import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import {
  changeEstadoAdmision,
  convertSolicitudToVoluntario,
  createSolicitud,
  generateRegistrationCodeBySolicitud,
  listSolicitudes,
  updateSolicitud,
} from "../../../services/admision/solicitudesAdmision.service";
import type {
  AdmissionConvertInput,
  AdmissionCreateInput,
  AdmissionFilters,
  AdmissionGenerateRegistrationCodeInput,
  AdmissionKpis,
  AdmissionListData,
  AdmissionRegistrationCodeRow,
  AdmissionStateChangeInput,
  AdmissionUpdateInput,
} from "../types";

const EMPTY_KPIS: AdmissionKpis = {
  total: 0,
  pending: 0,
  review: 0,
  interview: 0,
  onboarding: 0,
  approved: 0,
  rejected: 0,
  converted: 0,
  pendingConversion: 0,
};

const EMPTY_DATA: AdmissionListData = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  stateOptions: [],
  kpis: EMPTY_KPIS,
  warnings: [],
};

export function useSolicitudesAdmision(filters: AdmissionFilters) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdmissionListData>(EMPTY_DATA);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingState, setIsChangingState] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const debouncedSearchTerm = useDebouncedValue(filters.searchTerm, 350);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await listSolicitudes({
          searchTerm: debouncedSearchTerm,
          status: filters.status,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          page: filters.page,
          pageSize: filters.pageSize,
        });

        if (!isActive) {
          return;
        }

        setData(response);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setData(EMPTY_DATA);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar las solicitudes de admision."
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
  }, [
    debouncedSearchTerm,
    filters.dateFrom,
    filters.dateTo,
    filters.page,
    filters.pageSize,
    filters.status,
    reloadToken,
  ]);

  const create = useCallback(
    async (input: AdmissionCreateInput) => {
      if (isCreating) {
        return null;
      }

      setIsCreating(true);
      try {
        const response = await createSolicitud(input);
        refresh();
        return response;
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, refresh]
  );

  const update = useCallback(
    async (input: AdmissionUpdateInput) => {
      if (isUpdating) {
        return null;
      }

      setIsUpdating(true);
      try {
        const response = await updateSolicitud(input);
        refresh();
        return response;
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, refresh]
  );

  const changeState = useCallback(
    async (input: AdmissionStateChangeInput) => {
      if (isChangingState) {
        return null;
      }

      setIsChangingState(true);
      try {
        const response = await changeEstadoAdmision(input);
        refresh();
        return response;
      } finally {
        setIsChangingState(false);
      }
    },
    [isChangingState, refresh]
  );

  const convert = useCallback(
    async (input: AdmissionConvertInput) => {
      if (isConverting) {
        return null;
      }

      setIsConverting(true);
      try {
        const response = await convertSolicitudToVoluntario(input);
        refresh();
        return response;
      } finally {
        setIsConverting(false);
      }
    },
    [isConverting, refresh]
  );

  const generateRegistrationCode = useCallback(
    async (
      input: AdmissionGenerateRegistrationCodeInput
    ): Promise<AdmissionRegistrationCodeRow | null> => {
      if (isGeneratingCode) {
        return null;
      }

      setIsGeneratingCode(true);
      try {
        const response = await generateRegistrationCodeBySolicitud(input);
        refresh();
        return response;
      } finally {
        setIsGeneratingCode(false);
      }
    },
    [isGeneratingCode, refresh]
  );

  return {
    loading,
    error,
    warnings: data.warnings,
    rows: data.rows,
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
    stateOptions: data.stateOptions,
    kpis: data.kpis,
    isCreating,
    isUpdating,
    isChangingState,
    isConverting,
    isGeneratingCode,
    create,
    update,
    changeState,
    convert,
    generateRegistrationCode,
    refresh,
  };
}
