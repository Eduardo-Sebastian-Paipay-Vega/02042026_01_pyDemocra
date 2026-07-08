import { useCallback, useState } from "react";
import type { NotificationTemplateMutationInput } from "../types";
import {
  createNotificationTemplate,
  setNotificationTemplateActiveState,
  updateNotificationTemplate,
} from "../../../services/notificaciones/templates.service";

export function useNotificationTemplateMutations(onCompleted?: () => void) {
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const save = useCallback(
    async (input: NotificationTemplateMutationInput) => {
      if (isSaving) {
        return;
      }

      setIsSaving(true);
      try {
        if (input.templateId) {
          await updateNotificationTemplate(input);
        } else {
          await createNotificationTemplate(input);
        }
        onCompleted?.();
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, onCompleted]
  );

  const toggleActive = useCallback(
    async (templateId: string, active: boolean) => {
      if (isToggling) {
        return;
      }

      setIsToggling(true);
      try {
        await setNotificationTemplateActiveState(templateId, active);
        onCompleted?.();
      } finally {
        setIsToggling(false);
      }
    },
    [isToggling, onCompleted]
  );

  return {
    isSaving,
    isToggling,
    save,
    toggleActive,
  };
}
