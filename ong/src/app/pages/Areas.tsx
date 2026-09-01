import { useState, useMemo } from "react";
import { motion, type Variants } from "motion/react";
import { Database, Plus, AlertCircle, FolderOpen, RefreshCcw, LineChart, Activity, Calendar } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { DataTable, Column } from "@/core/components/shared/DataTable";
import { TableSkeleton } from "@/core/components/shared/TableSkeleton";
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
import type { AreaRow } from "../services/gobernanza/areas.service";

const KpiCard = ({ title, value, badge }: { title: string, value: string | number, badge?: { text: string, type: "emerald" | "purple" | "amber" } }) => {
  const badgeClasses = {
    emerald: "bg-[#161D17] text-[#08996A] border-[#08996A]/20",
    purple: "bg-[#1F181E] text-[#8B5CF6] border-[#8B5CF6]/20",
    amber: "bg-[#231C11] text-[#D97706] border-[#D97706]/20",
  };

  return (
    <div className="bg-[#171512] border border-[#26231F] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs text-[#A4A29F] font-medium tracking-wide">{title}</h3>
        {badge && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${badgeClasses[badge.type]}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-[#F9F7F3] mt-1">{value}</div>
    </div>
  );
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const areaSchema = z.object({
  code: z.string().min(2, "El código es requerido y debe tener al menos 2 caracteres"),
  name: z.string().min(3, "El nombre es requerido y debe tener al menos 3 caracteres"),
  description: z.string(),
  active: z.boolean(),
});

type AreaFormValues = z.infer<typeof areaSchema>;

export function Areas() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 350);
  
  const { areas, loading, error, refresh, handleCreate, handleUpdate, handleToggleStatus } = useAreas(debouncedSearchTerm);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaRow | null>(null);
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AreaFormValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: { code: "", name: "", description: "", active: true }
  });

  const openCreateModal = () => {
    setEditingArea(null);
    reset({ code: "", name: "", description: "", active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (area: AreaRow) => {
    setEditingArea(area);
    reset({
      code: area.code || "",
      name: area.name || "",
      description: area.description || "",
      active: area.active,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: AreaFormValues) => {
    let success = false;
    
    if (editingArea) {
      success = await handleUpdate(editingArea.id, data);
    } else {
      success = await handleCreate(data);
    }
    
    if (success) {
      setIsModalOpen(false);
    }
  };

  const columns: Column<AreaRow>[] = useMemo(() => [
    {
      key: "area",
      label: "ÁREA",
      render: (row) => (
        <div>
          <div className="font-medium" style={{ color: "var(--t-text)" }}>{row.name}</div>
          <div className="mt-1 flex">
             <Badge variant="outline" className="text-[10px] font-normal" style={{ color: "var(--t-text-dim)" }}>
               {row.code}
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
          {row.description || "-"}
        </span>
      ),
    },
    {
      key: "projects",
      label: "PROYECTOS",
      render: (row) => (
        <Badge variant={row.projectCount > 0 ? "default" : "secondary"}>
          {row.projectCount} proyectos
        </Badge>
      ),
    },
    {
      key: "status",
      label: "ESTADO",
      render: (row) => (
        <StatusDot variant={row.active ? "success" : "secondary"}>
          {row.active ? "Activo" : "Inactivo"}
        </StatusDot>
      ),
    },
  ], []);

  const actions = useMemo(() => [
    {
      label: "Editar",
      onClick: (row: AreaRow) => openEditModal(row),
    },
    {
      label: (row: AreaRow) => (row.active ? "Desactivar" : "Activar"),
      variant: "destructive" as const,
      onClick: (row: AreaRow) => handleToggleStatus(row.id, row.active),
    },
  ], [handleToggleStatus]);

  let content: React.ReactNode = null;
  if (loading) {
    content = <TableSkeleton rows={5} columns={4} />;
  } else if (error) {
    content = (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border" style={{ background: "var(--t-surface)", borderColor: "var(--t-border)", boxShadow: "var(--t-shadow)" }}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-lg font-medium mb-2" style={{ color: "var(--t-text)" }}>No se pudo cargar las áreas</h3>
        <p className="text-sm mb-6 max-w-md" style={{ color: "var(--t-text-secondary)" }}>{error}</p>
        <Button onClick={refresh} variant="outline" className="gap-2">
          <RefreshCcw className="h-4 w-4" /> Reintentar
        </Button>
      </div>
    );
  } else if (areas.length === 0) {
    content = (
      <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border" style={{ background: "var(--t-surface)", borderColor: "var(--t-border)", boxShadow: "var(--t-shadow)" }}>
        <div className="flex h-16 w-16 items-center justify-center rounded-full mb-6" style={{ background: "var(--t-hover)" }}>
          <FolderOpen className="h-8 w-8" style={{ color: "var(--t-muted)" }} />
        </div>
        <h3 className="text-xl font-medium mb-2" style={{ color: "var(--t-text)" }}>No hay áreas registradas</h3>
        <p className="text-sm mb-8 max-w-md" style={{ color: "var(--t-text-secondary)" }}>
          Las áreas organizacionales te permiten agrupar y organizar los proyectos de la ONG. Comienza creando la primera área.
        </p>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva área
        </Button>
      </div>
    );
  } else {
    content = (
      <DataTable
        columns={columns}
        data={areas}
        actions={actions}
      />
    );
  }

  return (
    <div className="bg-[#100F0D] text-[#F9F7F3] min-h-screen p-6 font-sans">
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
        {/* Header Superior */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Áreas Organizacionales</h1>
            <p className="text-sm text-[#A4A29F] mt-1">Gestión de las áreas funcionales de la ONG y proyectos.</p>
          </div>
          <div className="flex items-center gap-3">
            <Input 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar área..."
              className="bg-[#171512] border-[#26231F] text-[#F9F7F3] h-10 w-64"
              disabled={!!error && !loading}
            />
            <Button onClick={openCreateModal} className="bg-[#356C92] hover:bg-[#356C92]/90 text-white border-none h-10 px-4">
              <Plus className="h-4 w-4 mr-2" /> Nueva área
            </Button>
          </div>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Columna Izquierda (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* KPI Cards */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard title="TOTAL ÁREAS" value={areas.length.toString()} badge={{text: "+1", type: "emerald"}} />
              <KpiCard title="ÁREAS ACTIVAS" value={areas.filter(a => a.active).length.toString()} badge={{text: "ok", type: "emerald"}} />
              <KpiCard title="TOTAL PROYECTOS" value={areas.reduce((acc, a) => acc + a.projectCount, 0).toString()} badge={{text: "activos", type: "purple"}} />
              <KpiCard title="ÁREAS INACTIVAS" value={areas.filter(a => !a.active).length.toString()} badge={{text: "atención", type: "amber"}} />
            </motion.div>

            {/* Gráfico / Evolución */}
            <motion.div variants={fadeUp} className="bg-[#171512] border border-[#26231F] rounded-xl p-4 h-[280px] flex flex-col">
              <h2 className="font-semibold text-[#F9F7F3] mb-4">Evolución de Proyectos</h2>
              <div className="flex-1 bg-[#23211D] rounded-xl flex flex-col items-center justify-center text-center">
                <LineChart className="h-8 w-8 text-[#686561] mb-3" />
                <h3 className="text-sm font-medium text-[#F9F7F3]">Sin datos suficientes</h3>
                <p className="text-xs text-[#A4A29F] max-w-[200px] mt-1">
                  Se requiere más historial para generar gráficos de evolución.
                </p>
              </div>
            </motion.div>

            {/* DataTable de Áreas */}
            <motion.div variants={fadeUp} className="bg-[#171512] border border-[#26231F] rounded-xl p-4 overflow-hidden">
              <h2 className="font-semibold text-[#F9F7F3] mb-4">Directorio de Áreas</h2>
              {/* To ensure the table looks right, wrapping it, assuming it uses standard colors */}
              <div className="[&_th]:bg-[#100F0D] [&_th]:text-[#A4A29F] [&_td]:border-[#26231F] [&_th]:border-[#26231F]">
                {content}
              </div>
            </motion.div>
          </div>

          {/* Columna Derecha (1/3) */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Agenda de Hoy */}
            <motion.div variants={fadeUp} className="bg-[#171512] border border-[#26231F] rounded-xl p-4">
              <h2 className="font-semibold text-[#F9F7F3] mb-4">Agenda de Hoy</h2>
              <div className="bg-[#23211D] p-6 rounded-xl flex flex-col items-center justify-center text-center">
                <Calendar className="h-8 w-8 text-[#686561] mb-3" />
                <h3 className="text-sm font-medium text-[#F9F7F3]">Agenda libre</h3>
                <p className="text-xs text-[#A4A29F] max-w-[200px] mt-1">
                  No tienes eventos ni reuniones programadas para hoy.
                </p>
              </div>
            </motion.div>

            {/* Feed en Vivo */}
            <motion.div variants={fadeUp} className="bg-[#171512] border border-[#26231F] rounded-xl p-4">
              <h2 className="font-semibold text-[#F9F7F3] mb-4">Feed en Vivo</h2>
              <div className="bg-[#23211D] p-6 rounded-xl flex flex-col items-center justify-center text-center">
                <Activity className="h-8 w-8 text-[#686561] mb-3" />
                <h3 className="text-sm font-medium text-[#F9F7F3]">Sin actividad reciente</h3>
                <p className="text-xs text-[#A4A29F] max-w-[200px] mt-1">
                  Las actualizaciones de las áreas aparecerán aquí en tiempo real.
                </p>
              </div>
            </motion.div>

            {/* Accesos Directos */}
            <motion.div variants={fadeUp} className="bg-[#171512] border border-[#26231F] rounded-xl p-4">
              <h2 className="font-semibold mb-4 text-[#F9F7F3]">Accesos Directos</h2>
              <div className="space-y-2">
                <button onClick={openCreateModal} className="w-full hover:bg-[#1F1D1A] transition-colors rounded-lg p-3 flex justify-between items-center bg-[#1F1D1A]/50 border border-transparent hover:border-[#26231F]">
                  <span className="text-sm font-medium text-[#F9F7F3]">Registrar nueva área</span>
                  <span className="bg-[#100F0D] text-xs px-2 py-1 rounded text-[#A4A29F] border border-[#26231F]">+</span>
                </button>
                <button onClick={refresh} className="w-full hover:bg-[#1F1D1A] transition-colors rounded-lg p-3 flex justify-between items-center bg-[#1F1D1A]/50 border border-transparent hover:border-[#26231F]">
                  <span className="text-sm font-medium text-[#F9F7F3]">Sincronizar datos</span>
                  <span className="bg-[#100F0D] text-xs px-2 py-1 rounded text-[#A4A29F] border border-[#26231F] flex items-center justify-center">
                    <RefreshCcw className="h-3 w-3"/>
                  </span>
                </button>
              </div>
            </motion.div>

          </div>
        </div>
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

          <form id="area-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <>
                    <Input
                      id="code"
                      placeholder="Ej: FIN-01"
                      disabled={isSubmitting}
                      {...field}
                    />
                    {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
                  </>
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Área</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <>
                    <Input
                      id="name"
                      placeholder="Ej: Finanzas"
                      disabled={isSubmitting}
                      {...field}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <>
                    <Textarea
                      id="description"
                      placeholder="Breve descripción del área..."
                      disabled={isSubmitting}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                    {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                  </>
                )}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: "var(--t-border)", background: "var(--t-hover)" }}>
              <div className="space-y-0.5">
                <Label htmlFor="active">Estado del área</Label>
                <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  Las áreas inactivas no podrán recibir nuevos proyectos.
                </p>
              </div>
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>
          </form>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              type="button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="area-form"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
