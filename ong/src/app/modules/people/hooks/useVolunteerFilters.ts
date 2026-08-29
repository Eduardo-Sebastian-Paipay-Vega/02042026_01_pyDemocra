import { useState, useMemo } from "react";
import type { PeopleRecordStatusKind, VolunteerListRow } from "../types";

export interface VolunteerFilterState {
  search: string;
  stateKind: "all" | PeopleRecordStatusKind;
  skills: string[];
  roles: string[];
}

export function useVolunteerFilters(rows: VolunteerListRow[]) {
  const [filters, setFilters] = useState<VolunteerFilterState>({
    search: "",
    stateKind: "all",
    skills: [],
    roles: [],
  });

  const updateFilter = (key: keyof VolunteerFilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filteredRows = useMemo(() => {
    const term = filters.search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.fullName.toLowerCase().includes(term) ||
        row.documentLabel.toLowerCase().includes(term) ||
        row.email.toLowerCase().includes(term) ||
        row.phone.toLowerCase().includes(term) ||
        row.stateLabel.toLowerCase().includes(term);

      const matchesState = filters.stateKind === "all" || row.stateKind === filters.stateKind;
      
      // Extension point for advanced filters:
      const matchesSkills = filters.skills.length === 0 || true; // Stub: Cross with db.json relations
      const matchesRoles = filters.roles.length === 0 || true;   // Stub: Cross with db.json relations

      return matchesSearch && matchesState && matchesSkills && matchesRoles;
    });
  }, [filters, rows]);

  return {
    filters,
    updateFilter,
    filteredRows,
  };
}
