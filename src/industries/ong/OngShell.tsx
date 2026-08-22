import type { CSSProperties } from "react";
import { BaseTenantShell } from "../../core/shell/BaseTenantShell";
import { useHomeNotifications } from "../../modules/ong/app/modules/home/useHomeNotifications";
import { ThemeProvider, useTheme } from "../../modules/ong/app/lib/theme-context";

function OngShellInner() {
  const { vars } = useTheme();
  const {
    items,
    loading,
    error,
    refresh,
  } = useHomeNotifications();

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

export function OngShell() {
  return (
    <ThemeProvider>
      <OngShellInner />
    </ThemeProvider>
  );
}

