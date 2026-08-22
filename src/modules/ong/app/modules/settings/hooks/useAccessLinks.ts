import { useCallback, useEffect, useState } from "react";
import type { AppDatabase } from "../../../../lib/db/ong/app-database";
import {
  listAccessLinks,
  createAccessLink,
  revokeAccessLink,
  updateAccessLink,
  type AccessLinkFilters,
  type CreateAccessLinkInput,
  type UpdateAccessLinkInput,
} from "../../../services/ace/ace.service";

type AccessLinkRow = AppDatabase["public"]["Tables"]["access_links"]["Row"];

interface UseAccessLinksState {
  links: AccessLinkRow[];
  loading: boolean;
  error: string | null;
}

export function useAccessLinks(filters: AccessLinkFilters = {}) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<UseAccessLinksState>({
    links: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    listAccessLinks(filters)
      .then((links) => {
        if (!active) return;
        setState({ links, loading: false, error: null });
      })
      .catch((err) => {
        if (!active) return;
        setState({
          links: [],
          loading: false,
          error: err instanceof Error ? err.message : "No se pudieron cargar los links de acceso.",
        });
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken]);

  const create = useCallback(
    async (input: CreateAccessLinkInput): Promise<AccessLinkRow> => {
      const created = await createAccessLink(input);
      refresh();
      return created;
    },
    [refresh]
  );

  const revoke = useCallback(
    async (linkId: string): Promise<void> => {
      await revokeAccessLink(linkId);
      refresh();
    },
    [refresh]
  );

  const update = useCallback(
    async (linkId: string, input: UpdateAccessLinkInput): Promise<AccessLinkRow> => {
      const updated = await updateAccessLink(linkId, input);
      refresh();
      return updated;
    },
    [refresh]
  );

  return {
    ...state,
    refresh,
    create,
    revoke,
    update,
  };
}

