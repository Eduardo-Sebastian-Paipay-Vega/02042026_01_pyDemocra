import { useCallback, useState } from "react";
import type {
  IdCardDetailData,
  IdCardTemplateDetailData,
  IdCardTemplateUpsertInput,
  IdCardUpsertInput,
} from "../types";
import {
  createIdCard,
  createIdCardTemplate,
  revokeIdCard,
  setIdCardTemplateActive,
  updateIdCard,
  updateIdCardTemplate,
} from "../../../services/personas/idCards.service";

export function useIdCardMutations(onSuccess?: () => void) {
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [isTogglingTemplate, setIsTogglingTemplate] = useState(false);
  const [isRevokingCard, setIsRevokingCard] = useState(false);

  const createTemplate = useCallback(
    async (input: IdCardTemplateUpsertInput): Promise<IdCardTemplateDetailData | null> => {
      if (isSavingTemplate) {
        return null;
      }

      setIsSavingTemplate(true);
      try {
        const response = await createIdCardTemplate(input);
        onSuccess?.();
        return response;
      } finally {
        setIsSavingTemplate(false);
      }
    },
    [isSavingTemplate, onSuccess]
  );

  const updateTemplate = useCallback(
    async (
      templateId: string,
      input: IdCardTemplateUpsertInput
    ): Promise<IdCardTemplateDetailData | null> => {
      if (isSavingTemplate) {
        return null;
      }

      setIsSavingTemplate(true);
      try {
        const response = await updateIdCardTemplate(templateId, input);
        onSuccess?.();
        return response;
      } finally {
        setIsSavingTemplate(false);
      }
    },
    [isSavingTemplate, onSuccess]
  );

  const toggleTemplate = useCallback(
    async (
      templateId: string,
      nextActive: boolean
    ): Promise<IdCardTemplateDetailData | null> => {
      if (isTogglingTemplate) {
        return null;
      }

      setIsTogglingTemplate(true);
      try {
        const response = await setIdCardTemplateActive(templateId, nextActive);
        onSuccess?.();
        return response;
      } finally {
        setIsTogglingTemplate(false);
      }
    },
    [isTogglingTemplate, onSuccess]
  );

  const createCardMutation = useCallback(
    async (input: IdCardUpsertInput): Promise<IdCardDetailData | null> => {
      if (isSavingCard) {
        return null;
      }

      setIsSavingCard(true);
      try {
        const response = await createIdCard(input);
        onSuccess?.();
        return response;
      } finally {
        setIsSavingCard(false);
      }
    },
    [isSavingCard, onSuccess]
  );

  const updateCardMutation = useCallback(
    async (cardId: string, input: IdCardUpsertInput): Promise<IdCardDetailData | null> => {
      if (isSavingCard) {
        return null;
      }

      setIsSavingCard(true);
      try {
        const response = await updateIdCard(cardId, input);
        onSuccess?.();
        return response;
      } finally {
        setIsSavingCard(false);
      }
    },
    [isSavingCard, onSuccess]
  );

  const revokeCardMutation = useCallback(
    async (cardId: string): Promise<IdCardDetailData | null> => {
      if (isRevokingCard) {
        return null;
      }

      setIsRevokingCard(true);
      try {
        const response = await revokeIdCard(cardId);
        onSuccess?.();
        return response;
      } finally {
        setIsRevokingCard(false);
      }
    },
    [isRevokingCard, onSuccess]
  );

  return {
    isSavingTemplate,
    isSavingCard,
    isTogglingTemplate,
    isRevokingCard,
    createTemplate,
    updateTemplate,
    toggleTemplate,
    createCard: createCardMutation,
    updateCard: updateCardMutation,
    revokeCard: revokeCardMutation,
  };
}

