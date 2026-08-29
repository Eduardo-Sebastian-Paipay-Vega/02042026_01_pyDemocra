import { Link } from "react-router-dom";
import { UserRound, ChevronRight, AlertTriangle } from "lucide-react";
import { DataTable, type Column } from "@/core/components/shared/DataTable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/core/components/ui/tooltip";
import { useClipboard } from "../../hooks/useClipboard";
import { formatPeopleDate } from "../people-shared";
import type { BeneficiaryListRow } from "../../types";

interface BeneficiariesTableProps {
  data: BeneficiaryListRow[];
  loading: boolean;
  actions: any[];
  onRowClick: (row: BeneficiaryListRow) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  emptyMessage: string;
}

export function BeneficiariesTable({
  data,
  loading,
  actions,
  onRowClick,
  selectedIds,
  onSelectionChange,
  emptyMessage,
}: BeneficiariesTableProps) {
  const { copy } = useClipboard();

  const columns: Column<BeneficiaryListRow>[] = [
    {
      key: "fullName",
      label: "Beneficiario",
      render: (row) => {
        const isMissingDocs = !row.documentNumber || !row.phone;
        
        return (
          <div className="flex items-center gap-3">
            {row.photoUrl ? (
              <img
                src={row.photoUrl}
                alt={row.fullName}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
                style={{ border: "1px solid var(--t-border)" }}
              />
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--t-hover)" }}
              >
                <UserRound className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <div style={{ color: "var(--t-text)" }}>{row.fullName}</div>
                {isMissingDocs && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="h-4 w-4 text-amber-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Documentación incompleta</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="mt-0.5 text-[11px] cursor-pointer hover:underline" 
                      style={{ color: "var(--t-text-secondary)" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (row.documentNumber) copy(row.documentNumber);
                      }}
                    >
                      {row.documentLabel}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copiar documento</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        );
      },
    },
    {
      key: "profile",
      label: "Perfil",
      render: (row) => {
        let colors = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
        if (row.profileKind === "child") colors = "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300";
        else if (row.profileKind === "senior") colors = "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors}`}>
            {row.profileLabel}
          </span>
        );
      },
    },
    {
      key: "tracking",
      label: "Relacion",
      render: (row) => (
        <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
          <div>{row.projectCount} proyectos</div>
          <div>
            {row.hasMedicalRecord ? (
              <Link 
                to="/ong/app/clinico/medical_records"
                className="text-[#4a7ba7] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {row.medicalRecordCount} fichas
              </Link>
            ) : (
              "Sin ficha medica"
            )}
          </div>
        </div>
      ),
    },
    {
      key: "updatedAt",
      label: "Actualizado",
      render: (row) => (
        <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
          {formatPeopleDate(row.updatedAt)}
        </span>
      ),
    },
    {
      key: "affordance",
      label: "",
      render: () => (
        <ChevronRight className="h-4 w-4 ml-auto" style={{ color: "var(--t-text-dim)" }} />
      ),
    },
  ];

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
