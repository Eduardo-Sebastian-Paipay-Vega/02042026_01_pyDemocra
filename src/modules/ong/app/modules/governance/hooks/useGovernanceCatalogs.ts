import { useCallback, useEffect, useState } from "react";
import type {
  GovernanceCatalogEntryRow,
  GovernanceCatalogKey,
  GovernanceCatalogSummaryRow,
} from "../types";
import {
  listGovernanceCatalogEntries,
  listGovernanceCatalogSummaries,
} from "../../../services/gobernanza/catalogs.service";

export function useGovernanceCatalogs(
  selectedCatalogKey: GovernanceCatalogKey,
  searchTerm: string
) {
  const [reloadToken, setReloadToken] = useState(0);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [catalogsError, setCatalogsError] = useState<string | null>(null);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [catalogs, setCatalogs] = useState<GovernanceCatalogSummaryRow[]>([]);
  const [rows, setRows] = useState<GovernanceCatalogEntryRow[]>([]);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setCatalogsLoading(true);
    setCatalogsError(null);

    listGovernanceCatalogSummaries()
      .then((response) => {
        if (!active) {
          return;
        }
        setCatalogs(response);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setCatalogs([]);
        setCatalogsError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar los catalogos de Gobernanza."
        );
      })
      .finally(() => {
        if (active) {
          setCatalogsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [reloadToken]);

  useEffect(() => {
    let active = true;
    setRowsLoading(true);
    setRowsError(null);

    listGovernanceCatalogEntries(selectedCatalogKey, searchTerm)
      .then((response) => {
        if (!active) {
          return;
        }
        setRows(response);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setRows([]);
        setRowsError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el catalogo seleccionado."
        );
      })
      .finally(() => {
        if (active) {
          setRowsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [reloadToken, searchTerm, selectedCatalogKey]);

  return {
    catalogs,
    rows,
    selectedCatalog:
      catalogs.find((catalog) => catalog.key === selectedCatalogKey) ?? null,
    catalogsLoading,
    rowsLoading,
    catalogsError,
    rowsError,
    refresh,
  };
}

