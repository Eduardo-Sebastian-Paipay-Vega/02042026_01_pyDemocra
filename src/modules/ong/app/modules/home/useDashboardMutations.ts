import { useCallback, useState } from "react";
import {
  cancelDashboardActivity,
  createDashboardActivity,
  resolveDashboardAdmission,
  resolveDashboardHour,
  updateDashboardActivity,
} from "./homeService";
import type { DashboardActivityFormInput } from "./types";

export function useDashboardMutations(onSuccess?: () => void) {
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [isResolvingHours, setIsResolvingHours] = useState(false);
  const [isResolvingAdmission, setIsResolvingAdmission] = useState(false);
  const [isCancellingActivity, setIsCancellingActivity] = useState(false);

  const createActivity = useCallback(
    async (input: DashboardActivityFormInput) => {
      if (isSavingActivity) {
        return null;
      }

      setIsSavingActivity(true);
      try {
        const detail = await createDashboardActivity(input);
        onSuccess?.();
        return detail;
      } finally {
        setIsSavingActivity(false);
      }
    },
    [isSavingActivity, onSuccess]
  );

  const updateActivity = useCallback(
    async (activityId: string, input: DashboardActivityFormInput) => {
      if (isSavingActivity) {
        return null;
      }

      setIsSavingActivity(true);
      try {
        const detail = await updateDashboardActivity(activityId, input);
        onSuccess?.();
        return detail;
      } finally {
        setIsSavingActivity(false);
      }
    },
    [isSavingActivity, onSuccess]
  );

  const cancelActivity = useCallback(
    async (activityId: string) => {
      if (isCancellingActivity) {
        return;
      }

      setIsCancellingActivity(true);
      try {
        await cancelDashboardActivity(activityId);
        onSuccess?.();
      } finally {
        setIsCancellingActivity(false);
      }
    },
    [isCancellingActivity, onSuccess]
  );

  const resolveHour = useCallback(
    async (options: {
      hourId: string;
      targetStatus: "approved" | "rejected";
      reviewerId?: string | null;
      comment?: string;
    }) => {
      if (isResolvingHours) {
        return;
      }

      setIsResolvingHours(true);
      try {
        await resolveDashboardHour(options);
        onSuccess?.();
      } finally {
        setIsResolvingHours(false);
      }
    },
    [isResolvingHours, onSuccess]
  );

  const resolveAdmission = useCallback(
    async (options: {
      requestId: string;
      targetStatus: "approved" | "rejected";
      reviewerId?: string | null;
      comment?: string;
    }) => {
      if (isResolvingAdmission) {
        return;
      }

      setIsResolvingAdmission(true);
      try {
        await resolveDashboardAdmission(options);
        onSuccess?.();
      } finally {
        setIsResolvingAdmission(false);
      }
    },
    [isResolvingAdmission, onSuccess]
  );

  return {
    isSavingActivity,
    isResolvingHours,
    isResolvingAdmission,
    isCancellingActivity,
    createActivity,
    updateActivity,
    cancelActivity,
    resolveHour,
    resolveAdmission,
  };
}
