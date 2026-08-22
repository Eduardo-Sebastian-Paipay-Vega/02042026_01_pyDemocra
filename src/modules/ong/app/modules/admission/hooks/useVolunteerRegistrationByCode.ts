import { useCallback, useEffect, useState } from "react";
import {
  consumeVolunteerRegistrationCode,
  getVolunteerRegistrationCatalogs,
  previewVolunteerRegistrationCode,
} from "../../../services/admision/volunteerRegistration.service";
import type {
  AdmissionPublicRegistrationCatalogs,
  AdmissionPublicRegistrationCodePreview,
  AdmissionPublicVolunteerRegistrationInput,
  AdmissionPublicVolunteerRegistrationResult,
} from "../types";

const EMPTY_CATALOGS: AdmissionPublicRegistrationCatalogs = {
  documentTypes: [],
  genders: [],
  countries: [],
};

export function useVolunteerRegistrationByCode() {
  const [catalogs, setCatalogs] =
    useState<AdmissionPublicRegistrationCatalogs>(EMPTY_CATALOGS);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [catalogsError, setCatalogsError] = useState<string | null>(null);
  const [preview, setPreview] =
    useState<AdmissionPublicRegistrationCodePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const refreshCatalogs = useCallback(() => {
    setCatalogsLoading(true);
    setCatalogsError(null);

    void getVolunteerRegistrationCatalogs()
      .then((response) => {
        setCatalogs(response);
      })
      .catch((error) => {
        setCatalogs(EMPTY_CATALOGS);
        setCatalogsError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los catalogos publicos."
        );
      })
      .finally(() => {
        setCatalogsLoading(false);
      });
  }, []);

  useEffect(() => {
    refreshCatalogs();
  }, [refreshCatalogs]);

  const loadPreview = useCallback(
    async (input: {
      code: string;
      tenantId?: string | null;
    }): Promise<AdmissionPublicRegistrationCodePreview | null> => {
      setPreviewLoading(true);
      setPreviewError(null);
      setSubmitError(null);

      try {
        const response = await previewVolunteerRegistrationCode(input);
        setPreview(response);
        return response;
      } catch (error) {
        setPreview(null);
        setPreviewError(
          error instanceof Error
            ? error.message
            : "No se pudo validar el codigo de registro."
        );
        return null;
      } finally {
        setPreviewLoading(false);
      }
    },
    []
  );

  const submit = useCallback(
    async (
      input: AdmissionPublicVolunteerRegistrationInput
    ): Promise<AdmissionPublicVolunteerRegistrationResult | null> => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const response = await consumeVolunteerRegistrationCode(input);
        return response;
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "No se pudo completar el registro del voluntario."
        );
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    catalogs,
    catalogsLoading,
    catalogsError,
    preview,
    previewLoading,
    previewError,
    isSubmitting,
    submitError,
    loadPreview,
    submit,
    refreshCatalogs,
    clearPreview: () => setPreview(null),
    clearPreviewError: () => setPreviewError(null),
    clearSubmitError: () => setSubmitError(null),
  };
}

