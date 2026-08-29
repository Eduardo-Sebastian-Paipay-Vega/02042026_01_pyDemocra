import { DataTable, type Column } from "@/core/components/shared/DataTable";
import type { VolunteerListRow } from "../../types";

interface VolunteersTableProps {
  columns: Column<VolunteerListRow>[];
  data: VolunteerListRow[];
  loading: boolean;
  actions: any[];
  onRowClick: (row: VolunteerListRow) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  emptyMessage: string;
}

export function VolunteersTable({
  columns,
  data,
  loading,
  actions,
  onRowClick,
  selectedIds,
  onSelectionChange,
  emptyMessage,
}: VolunteersTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      actions={actions}
      onRowClick={onRowClick}
      selectable={true}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      emptyMessage={emptyMessage}
    />
  );
}
