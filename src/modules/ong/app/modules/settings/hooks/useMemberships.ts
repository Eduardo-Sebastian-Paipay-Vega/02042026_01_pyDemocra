import { useCallback, useEffect, useState } from "react";
import type { AppDatabase } from "../../../../lib/db/ong/app-database";
import {
  listMemberships,
  deactivateMembership,
  type MembershipFilters,
} from "../../../services/ace/ace.service";

type MembershipRow = AppDatabase["public"]["Tables"]["memberships"]["Row"];

interface UseMembershipsState {
  memberships: MembershipRow[];
  loading: boolean;
  error: string | null;
}

export function useMemberships(filters: MembershipFilters = {}) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<UseMembershipsState>({
    memberships: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    listMemberships(filters)
      .then((memberships) => {
        if (!active) return;
        setState({ memberships, loading: false, error: null });
      })
      .catch((err) => {
        if (!active) return;
        setState({
          memberships: [],
          loading: false,
          error: err instanceof Error ? err.message : "No se pudieron cargar las membresÃ­as.",
        });
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken]);

  const deactivate = useCallback(
    async (membershipId: string): Promise<void> => {
      await deactivateMembership(membershipId);
      refresh();
    },
    [refresh]
  );

  return {
    ...state,
    refresh,
    deactivate,
  };
}

