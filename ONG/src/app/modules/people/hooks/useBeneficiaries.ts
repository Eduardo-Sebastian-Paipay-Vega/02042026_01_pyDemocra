import { useCallback, useEffect, useState } from "react";
import type {
  BeneficiaryCatalogData,
  BeneficiaryListData,
  BeneficiaryListRow,
} from "../types";
import {
  fetchBeneficiaryCatalogs,
  listBeneficiaries,
} from "../../../services/personas/beneficiaries.service";

const EMPTY_CATALOGS: BeneficiaryCatalogData = {
  documentTypeOptions: [],
  genderOptions: [],
  countryOptions: [],
};

const EMPTY_DATA: BeneficiaryListData = {
  rows: [],
};

export function useBeneficiaries() {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BeneficiaryListData>(EMPTY_DATA);
  const [catalogs, setCatalogs] = useState<BeneficiaryCatalogData>(EMPTY_CATALOGS);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  const upsertRow = useCallback((row: BeneficiaryListRow) => {
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
          listBeneficiaries(),
          fetchBeneficiaryCatalogs(),
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

        setData(EMPTY_DATA);
        setCatalogs(EMPTY_CATALOGS);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el modulo de beneficiarios."
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
    catalogs,
    refresh,
    upsertRow,
  };
}
