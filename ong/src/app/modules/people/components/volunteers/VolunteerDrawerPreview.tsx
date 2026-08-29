import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/core/components/ui/sheet";
import { Button } from "@/core/components/ui/button";
import type { VolunteerListRow } from "../../types";

interface VolunteerPreviewModalProps {
  open: boolean;
  onClose: () => void;
  volunteer: VolunteerListRow | null;
  onOpenFullDetail: (id: string) => void;
}

export function VolunteerDrawerPreview({ open, onClose, volunteer, onOpenFullDetail }: VolunteerPreviewModalProps) {
  if (!volunteer) return null;

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent side="right" className="sm:max-w-[425px] overflow-y-auto" style={{ background: "var(--t-surface)", borderLeft: "1px solid var(--t-border-strong)" }}>
        <SheetHeader>
          <SheetTitle style={{ color: "var(--t-text)" }}>Vista Previa Rápida</SheetTitle>
          <SheetDescription style={{ color: "var(--t-text-secondary)" }}>
            Resumen del perfil del voluntario
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b" style={{ borderColor: "var(--t-border)" }}>
            {volunteer.photoUrl ? (
              <img src={volunteer.photoUrl} alt={volunteer.fullName} className="h-16 w-16 rounded-full object-cover border" style={{ borderColor: "var(--t-border)" }} />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full shrink-0" style={{ background: "var(--t-hover)" }}>
                <span className="text-xl font-medium" style={{ color: "var(--t-text-secondary)" }}>
                  {volunteer.fullName.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium leading-tight" style={{ color: "var(--t-text)" }}>{volunteer.fullName}</h3>
              <p className="text-sm mt-1" style={{ color: "var(--t-text-secondary)" }}>{volunteer.documentLabel}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>Contacto</h4>
            <div className="text-sm space-y-1.5" style={{ color: "var(--t-text-secondary)" }}>
              <p>Email: {volunteer.email || 'No registrado'}</p>
              <p>Teléfono: {volunteer.phone || 'No registrado'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>Contacto de Emergencia</h4>
            <div className="p-3 rounded-lg border text-sm" style={{ background: "var(--t-input-bg)", borderColor: "var(--t-border)", color: "var(--t-text-dim)" }}>
              <p className="italic text-xs">Integración con bd real requerida (Ficha Médica / Sensible)</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>Resumen de Habilidades</h4>
            <div className="p-3 rounded-lg border text-sm" style={{ background: "var(--t-input-bg)", borderColor: "var(--t-border)", color: "var(--t-text-dim)" }}>
              {volunteer.skillCount > 0 ? (
                <p>El voluntario tiene {volunteer.skillCount} habilidad(es) registrada(s). Ver detalles completos para más información.</p>
              ) : (
                <p className="italic text-xs">Sin habilidades registradas.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>Últimas Actividades</h4>
            <div className="p-3 rounded-lg border text-sm" style={{ background: "var(--t-input-bg)", borderColor: "var(--t-border)", color: "var(--t-text-dim)" }}>
              {volunteer.activityCount > 0 ? (
                <p>Ha participado en {volunteer.activityCount} actividad(es). Ver detalles completos.</p>
              ) : (
                <p className="italic text-xs">Sin actividades recientes.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>Métricas</h4>
            <div className="rounded-lg border p-4 text-sm flex justify-between" style={{ background: "var(--t-input-bg)", borderColor: "var(--t-border)", color: "var(--t-text-dim)" }}>
              <div className="text-center">
                <span className="block font-bold text-base" style={{ color: "var(--t-text)" }}>{volunteer.approvedHours}</span>
                <span className="text-xs">Horas</span>
              </div>
              <div className="text-center">
                <span className="block font-bold text-base" style={{ color: "var(--t-text)" }}>{volunteer.projectCount}</span>
                <span className="text-xs">Proyectos</span>
              </div>
              <div className="text-center">
                <span className="block font-bold text-base" style={{ color: "var(--t-text)" }}>{volunteer.roleCount}</span>
                <span className="text-xs">Roles</span>
              </div>
            </div>
          </div>
          
          <div className="pt-4 pb-8">
            <Button 
              className="w-full transition-opacity hover:opacity-90 h-10" 
              style={{ background: "var(--t-primary)", color: "white" }}
              onClick={() => {
                onClose();
                onOpenFullDetail(volunteer.id);
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
