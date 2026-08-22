import type { CSSProperties } from "react";
import { BaseTenantShell } from "../../core/shell/BaseTenantShell";
import { ThemeProvider, useTheme } from "../../modules/ong/app/lib/theme-context";

// TODO: Replace with GYM-specific notifications hook in the future
function useGymNotifications() {
  return {
    items: [],
    loading: false,
    error: null,
    refresh: () => {},
  };
}

function GymShellInner() {
  const { vars } = useTheme();
  const {
    items,
    loading,
    error,
    refresh,
  } = useGymNotifications();

  return (
    <BaseTenantShell
      themeVars={vars as CSSProperties}
      notifications={items}
      notificationsLoading={loading}
      notificationsError={error}
      onRetryNotifications={refresh}
    />
  );
}

export function GymShell() {
  return (
    <ThemeProvider>
      <GymShellInner />
    </ThemeProvider>
  );
}

