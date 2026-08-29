import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/core/components/ui/sheet";
import { Button } from "@/core/components/ui/button";
import { UserRound } from "lucide-react";
import type { BeneficiaryListRow } from "../../types";

interface BeneficiaryDrawerPreviewProps {
  open: boolean;
  onClose: () => void;
  beneficiary: BeneficiaryListRow | null;
  onOpenFullDetail: (id: string) => void;
}

export function BeneficiaryDrawerPreview({ open, onClose, beneficiary, onOpenFullDetail }: BeneficiaryDrawerPreviewProps) {
  if (!beneficiary) return null;

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent side="right" className="sm:max-w-[425px] overflow-y-auto" style={{ background: "var(--t-surface)", borderLeft: "1px solid var(--t-border-strong)" }}>
        <SheetHeader>
          <SheetTitle style={{ color: "var(--t-text)" }}>Vista Previa Rápida</SheetTitle>
          <SheetDescription style={{ color: "var(--t-text-secondary)" }}>
            Resumen del perfil del beneficiario
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b" style={{ borderColor: "var(--t-border)" }}>
            {beneficiary.photoUrl ? (
              <img src={beneficiary.photoUrl} alt={beneficiary.fullName} className="h-16 w-16 rounded-full object-cover border" style={{ borderColor: "var(--t-border)" }} />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full shrink-0" style={{ background: "var(--t-hover)" }}>
                <UserRound className="h-8 w-8" style={{ color: "var(--t-text-dim)" }} />
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium leading-tight" style={{ color: "var(--t-text)" }}>{beneficiary.fullName}</h3>
              <p className="text-sm mt-1" style={{ color: "var(--t-text-secondary)" }}>{beneficiary.documentLabel}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>Contacto</h4>
            <div className="text-sm space-y-1.5" style={{ color: "var(--t-text-secondary)" }}>
              <p>Teléfono: {beneficiary.phone || 'No registrado'}</p>
              <p>Dirección: {beneficiary.address || 'No registrada'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>Métricas</h4>
            <div className="rounded-lg border p-4 text-sm flex justify-around" style={{ background: "var(--t-input-bg)", borderColor: "var(--t-border)", color: "var(--t-text-dim)" }}>
              <div className="text-center">
                <span className="block font-bold text-base" style={{ color: "var(--t-text)" }}>{beneficiary.projectCount}</span>
                <span className="text-xs">Proyectos</span>
              </div>
              <div className="text-center">
                <span className="block font-bold text-base" style={{ color: "var(--t-text)" }}>{beneficiary.medicalRecordCount}</span>
                <span className="text-xs">Fichas Clínicas</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>Observaciones</h4>
            <div className="p-3 rounded-lg border text-sm" style={{ background: "var(--t-input-bg)", borderColor: "var(--t-border)", color: "var(--t-text-dim)" }}>
              {beneficiary.notes ? (
                <p>{beneficiary.notes}</p>
              ) : (
                <p className="italic text-xs">Sin observaciones registradas.</p>
              )}
            </div>
          </div>
          
          <div className="pt-4 pb-8">
            <Button 
              className="w-full transition-opacity hover:opacity-90 h-10" 
              style={{ background: "var(--t-primary)", color: "white" }}
              onClick={() => {
                onClose();
                onOpenFullDetail(beneficiary.id);
              }}
            >
              Ver detalles completos
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
