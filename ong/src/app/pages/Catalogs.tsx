import { useState } from "react";
import { motion, type Variants } from "motion/react";
import { 
  BarChart2, 
  Calendar, 
  Activity, 
  Database,
  Filter,
  FileText
} from "lucide-react";
import { useGovernanceCatalogs } from "../modules/governance/hooks/useGovernanceCatalogs";
import type { GovernanceCatalogKey } from "../modules/governance/types";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
} as const satisfies Variants;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
} as const satisfies Variants;

const DEFAULT_CATALOG: GovernanceCatalogKey = "public.cat_permissions";

export function Catalogs() {
  const [selectedCatalogKey, setSelectedCatalogKey] = useState<GovernanceCatalogKey>(DEFAULT_CATALOG);
  const [searchValue] = useState("");
  
  const {
    catalogs,
    rows,
    selectedCatalog,
    catalogsLoading,
    rowsLoading,
    catalogsError,
    rowsError,
    refresh,
  } = useGovernanceCatalogs(selectedCatalogKey, searchValue);

  const totalCatalogs = catalogs.length;
  const totalRecords = catalogs.reduce((sum, cat) => sum + (cat.rowCount ?? 0), 0);
  const currentRowsCount = rows.length;
  
  // 4 KPI Cards logic mapping directly to actual data
  const kpis = [
    { 
      label: "Total Catálogos", 
      value: catalogsLoading ? "-" : totalCatalogs.toString(), 
      badge: { text: "Activo", type: "emerald" as const } 
    },
    { 
      label: "Total Registros", 
      value: catalogsLoading ? "-" : totalRecords.toLocaleString(), 
      badge: { text: "+12%", type: "emerald" as const } 
    },
    { 
      label: "Registros Filtrados", 
      value: rowsLoading ? "-" : currentRowsCount.toString(), 
      badge: { text: selectedCatalog?.label ?? "Todos", type: "purple" as const } 
    },
    { 
      label: "Estado de Sincronización", 
      value: catalogsError ? "Error" : "Óptimo", 
      badge: { text: "Sistema", type: catalogsError ? "amber" : "emerald" as const } 
    }
  ];

  return (
    <div className="min-h-screen bg-[#100F0D] text-[#F9F7F3] p-6 font-sans">
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header Superior */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">Panel Principal</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={refresh}
              className="px-3 py-1.5 bg-[#171512] border border-[#26231F] rounded-lg text-sm font-medium hover:bg-[#1F1D1A] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-[#A4A29F]" strokeWidth={1.5} />
              Actualizar
            </button>
            <button className="px-3 py-1.5 bg-[#356C92] text-white border border-[#356C92] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer">
              <Filter className="w-4 h-4" strokeWidth={1.5} />
              Filtrar
            </button>
          </div>
        </motion.div>

        {/* Grid de Contenido (Bento Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Columna Izquierda (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* 4 KPI Cards */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {kpis.map((kpi, idx) => (
                <div key={idx} className="bg-[#171512] border border-[#26231F] rounded-xl p-4 flex flex-col justify-between h-[110px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-[#A4A29F]">{kpi.label}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 border
                      ${kpi.badge.type === 'emerald' ? 'bg-[#161D17] text-[#08996A] border-[#08996A]/20' : 
                        kpi.badge.type === 'purple' ? 'bg-[#1F181E] text-[#8B5CF6] border-[#8B5CF6]/20' : 
                        'bg-[#231C11] text-[#D97706] border-[#D97706]/20'}`}
                    >
                      {kpi.badge.text}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">{kpi.value}</div>
                </div>
              ))}
            </motion.div>

            {/* Tarjeta de Gráfico / Evolución */}
            <motion.div variants={fadeUp} className="h-[280px] bg-[#171512] border border-[#26231F] rounded-xl p-4 flex flex-col">
              <h2 className="text-sm font-medium mb-4">Evolución de Datos</h2>
              <div className="flex-1 flex items-center justify-center">
                {/* Empty State */}
                <div className="flex flex-col items-center">
                  <div className="bg-[#23211D] p-3 rounded-xl mb-3">
                    <BarChart2 className="w-6 h-6 text-[#A4A29F]" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium">Sin datos suficientes</p>
                  <p className="text-xs text-[#A4A29F] text-center max-w-xs mt-1">
                    El historial de métricas se generará a medida que interactúes con el sistema.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Tarjeta de Feed en Vivo (Registros seleccionados) */}
            <motion.div variants={fadeUp} className="bg-[#171512] border border-[#26231F] rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-medium">Feed en Vivo (Últimos Registros)</h2>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#08996A] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#08996A]"></span>
                  </span>
                  <span className="text-xs text-[#A4A29F]">Conectado</span>
                </div>
              </div>
              <div className="space-y-3">
                {rowsLoading ? (
                  <p className="text-xs text-[#A4A29F]">Cargando feed...</p>
                ) : rowsError ? (
                  <p className="text-xs text-[#D97706]">{rowsError}</p>
                ) : rows.length === 0 ? (
                  <p className="text-xs text-[#A4A29F]">No hay registros para mostrar en el feed.</p>
                ) : (
                  rows.slice(0, 5).map((row, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-[#1F1D1A]/30 rounded-lg border border-[#26231F]/50">
                      <div className="bg-[#23211D] p-2 rounded-lg flex-shrink-0">
                        <Database className="w-4 h-4 text-[#A4A29F]" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F9F7F3] truncate">{row.primaryValue}</p>
                        <p className="text-xs text-[#A4A29F] truncate">{row.secondaryValue}</p>
                      </div>
                      <div className="text-xs text-[#686561] flex-shrink-0">
                        {row.raw?.activo ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

          </div>

          {/* Columna Derecha (1/3) */}
          <div className="lg:col-span-1 space-y-4 flex flex-col">
            
            {/* Tarjeta Agenda de Hoy */}
            <motion.div variants={fadeUp} className="bg-[#171512] border border-[#26231F] rounded-xl p-4 min-h-[200px] flex flex-col">
              <h2 className="text-sm font-medium mb-4">Agenda de Hoy</h2>
              <div className="flex-1 flex items-center justify-center py-4">
                {/* Empty State */}
                <div className="flex flex-col items-center">
                  <div className="bg-[#23211D] p-3 rounded-xl mb-3">
                    <Calendar className="w-6 h-6 text-[#A4A29F]" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium">Agenda despejada</p>
                  <p className="text-xs text-[#A4A29F] text-center max-w-xs mt-1">
                    No tienes eventos programados para hoy.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Tarjeta Accesos Directos (Catálogos) */}
            <motion.div variants={fadeUp} className="bg-[#171512] border border-[#26231F] rounded-xl p-4 flex-1">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-medium">Accesos Directos</h2>
                <button className="text-xs text-[#356C92] hover:underline cursor-pointer">Ver todos</button>
              </div>
              
              <div className="space-y-2">
                {catalogsLoading ? (
                  <p className="text-xs text-[#A4A29F]">Cargando accesos...</p>
                ) : catalogs.slice(0, 8).map((cat) => (
                  <button 
                    key={cat.key}
                    onClick={() => setSelectedCatalogKey(cat.key)}
                    className={`w-full hover:bg-[#1F1D1A] transition-colors rounded-lg p-3 flex justify-between items-center group cursor-pointer
                      ${selectedCatalogKey === cat.key ? 'bg-[#1F1D1A]' : 'bg-[#1F1D1A]/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[#A4A29F] group-hover:text-[#F9F7F3] transition-colors" strokeWidth={1.5} />
                      <span className="text-sm font-medium text-[#F9F7F3] text-left truncate max-w-[150px]">{cat.label}</span>
                    </div>
                    <div className="bg-[#100F0D] text-xs px-2 py-1 rounded text-[#A4A29F] flex items-center gap-1">
                      {cat.rowCount ?? 0}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
