import { useState, useMemo } from "react";
import { motion, type Variants } from "motion/react";
import { Database, Plus } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { FilterBar } from "../components/shared/FilterBar";
import { DataTable, Column } from "../components/shared/DataTable";
import { StatusDot } from "@/core/components/ui/status-dot";
import { ModalShell } from "@/core/components/ui/modal-shell";
import { Input } from "@/core/components/ui/input";
import { Textarea } from "@/core/components/ui/textarea";
import { Switch } from "@/core/components/ui/switch";
import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import { Badge } from "@/core/components/ui/badge";
import { useAreas } from "../modules/governance/hooks/useAreas";
import { useDebouncedValue } from "../lib/useDebouncedValue";
import type { AreaWithProjects } from "../services/gobernanza/areas.service";

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

export function Areas() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 350);
  
  const { areas, loading, refresh, handleCreate, handleUpdate, handleToggleStatus } = useAreas(debouncedSearchTerm);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaWithProjects | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: "",
    nombre_area: "",
    descripcion: "",
    activo: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingArea(null);
    setFormData({ codigo: "", nombre_area: "", descripcion: "", activo: true });
    setIsModalOpen(true);
  };

  const openEditModal = (area: AreaWithProjects) => {
    setEditingArea(area);
    setFormData({
      codigo: area.codigo || "",
      nombre_area: area.nombre_area || "",
      descripcion: area.descripcion || "",
      activo: area.activo,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async () => {
    if (!formData.codigo.trim() || !formData.nombre_area.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    let success = false;
    
    if (editingArea) {
      success = await handleUpdate(editingArea.id, formData);
    } else {
      success = await handleCreate(formData);
    }
    
    setIsSubmitting(false);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const columns: Column<AreaWithProjects>[] = useMemo(() => [
    {
      key: "area",
      label: "ÁREA",
      render: (row) => (
        <div>
          <div className="font-medium" style={{ color: "var(--t-text)" }}>{row.nombre_area}</div>
          <div className="mt-1 flex">
             <Badge variant="outline" className="text-[10px] font-normal" style={{ color: "var(--t-text-dim)" }}>
               {row.codigo}
             </Badge>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      label: "DESCRIPCIÓN",
      render: (row) => (
        <span className="text-[13px] line-clamp-2" style={{ color: "var(--t-text-secondary)" }}>
          {row.descripcion || "-"}
        </span>
      ),
    },
    {
      key: "projects",
      label: "PROYECTOS",
      render: (row) => (
        <Badge variant={row.proyectos_count > 0 ? "default" : "secondary"}>
          {row.proyectos_count} proyectos
        </Badge>
      ),
    },
    {
      key: "status",
      label: "ESTADO",
      render: (row) => (
        <StatusDot variant={row.activo ? "success" : "secondary"}>
          {row.activo ? "Activo" : "Inactivo"}
        </StatusDot>
      ),
    },
  ], []);

  const actions = useMemo(() => [
    {
      label: "Editar",
      onClick: (row: AreaWithProjects) => openEditModal(row),
    },
    {
      label: (row: AreaWithProjects) => (row.activo ? "Desactivar" : "Activar"),
      variant: "destructive" as const,
      onClick: (row: AreaWithProjects) => handleToggleStatus(row.id, row.activo),
    },
  ], [handleToggleStatus]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Áreas Organizacionales"
          description="Gestión de las áreas funcionales de la ONG. Las áreas agrupan proyectos."
          action={{
            label: "Nueva área",
            icon: Plus,
            onClick: openCreateModal,
          }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div className="space-y-1">
              <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                Las áreas agrupan proyectos. Desactivar un área no elimina la información histórica asociada.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <FilterBar
          searchPlaceholder="Buscar por código o nombre..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <DataTable
          columns={columns}
          data={areas}
          loading={loading}
          actions={actions}
          emptyMessage="No se encontraron áreas organizacionales."
        />
      </motion.div>

      <ModalShell
        open={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        width="max-w-[500px]"
      >
        <div className="space-y-6 p-6">
          <div>
            <h3 className="text-lg font-medium" style={{ color: "var(--t-text)" }}>
              {editingArea ? "Editar área" : "Nueva área"}
            </h3>
            <p className="text-sm" style={{ color: "var(--t-text-dim)" }}>
              {editingArea ? "Modifica los datos del área seleccionada." : "Registra una nueva área organizativa."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                placeholder="Ej: FIN-01"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nombre_area">Nombre del Área</Label>
              <Input
                id="nombre_area"
                placeholder="Ej: Finanzas"
                value={formData.nombre_area}
                onChange={(e) => setFormData({ ...formData, nombre_area: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Breve descripción del área..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                disabled={isSubmitting}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: "var(--t-border)", background: "var(--t-hover)" }}>
              <div className="space-y-0.5">
                <Label htmlFor="activo">Estado del área</Label>
                <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  Las áreas inactivas no podrán recibir nuevos proyectos.
                </p>
              </div>
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || !formData.codigo.trim() || !formData.nombre_area.trim()}
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
