import { useState, useMemo } from "react";
import type { BeneficiaryListRow, BeneficiaryProfileKind } from "../types";

export interface BeneficiaryFilterState {
  search: string;
  profileKind: "all" | BeneficiaryProfileKind;
  missingDocs: boolean;
}

export function useBeneficiaryFilters(rows: BeneficiaryListRow[]) {
  const [filters, setFilters] = useState<BeneficiaryFilterState>({
    search: "",
    profileKind: "all",
    missingDocs: false,
  });

  const updateFilter = (key: keyof BeneficiaryFilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filteredRows = useMemo(() => {
    const term = filters.search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.fullName.toLowerCase().includes(term) ||
        row.documentLabel.toLowerCase().includes(term) ||
        row.profileLabel.toLowerCase().includes(term) ||
        row.genderLabel.toLowerCase().includes(term) ||
        row.phone.toLowerCase().includes(term);

      const matchesProfile = filters.profileKind === "all" || row.profileKind === filters.profileKind;

      const matchesDocs = !filters.missingDocs || (!row.documentNumber || !row.phone);

      return matchesSearch && matchesProfile && matchesDocs;
    });
  }, [filters, rows]);

  return {
    filters,
    updateFilter,
    filteredRows,
  };
}
