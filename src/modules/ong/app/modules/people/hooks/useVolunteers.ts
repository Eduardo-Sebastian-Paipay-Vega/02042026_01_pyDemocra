import { useCallback, useEffect, useState } from "react";
import type {
  VolunteerCatalogData,
  VolunteerListData,
  VolunteerListRow,
} from "../types";
import {
  fetchVolunteerCatalogs,
  listVolunteers,
} from "../../../services/personas/volunteers.service";

const EMPTY_CATALOGS: VolunteerCatalogData = {
  stateOptions: [],
  documentTypeOptions: [],
  genderOptions: [],
  countryOptions: [],
  skillOptions: [],
  operationalRoleOptions: [],
};

const EMPTY_DATA: VolunteerListData = {
  rows: [],
  stateOptions: [],
};

export function useVolunteers() {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VolunteerListData>(EMPTY_DATA);
  const [catalogs, setCatalogs] = useState<VolunteerCatalogData>(EMPTY_CATALOGS);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  const upsertRow = useCallback((row: VolunteerListRow) => {
    setData((current) => {
      const nextRows = [...current.rows];
      const currentIndex = nextRows.findIndex((item) => item.id === row.id);

      if (currentIndex >= 0) {
        nextRows[currentIndex] = row;
      } else {
        nextRows.unshift(row);
      }

      nextRows.sort(
        (left, right) =>
          left.lastName.localeCompare(right.lastName, "es", { sensitivity: "base" }) ||
          left.firstName.localeCompare(right.firstName, "es", { sensitivity: "base" })
      );

      return {
        ...current,
        rows: nextRows,
      };
    });
    setError(null);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [listData, catalogData] = await Promise.all([
          listVolunteers(),
          fetchVolunteerCatalogs(),
        ]);

        if (!isActive) {
          return;
        }

        setData(listData);
        setCatalogs(catalogData);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el modulo de voluntarios."
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
  }, [reloadToken]);

  return {
    loading,
    error,
    rows: data.rows,
    stateOptions: data.stateOptions,
    catalogs,
    refresh,
    upsertRow,
  };
}
