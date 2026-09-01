import { Link } from "react-router-dom";
import { ChevronRight, FileText, Settings, Users, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export function DashboardShortcuts() {
  const shortcuts = [
    {
      id: "reports",
      label: "Reportes Analíticos",
      icon: FileText,
      path: "/ong/app/metricas",
      count: null,
    },
    {
      id: "users",
      label: "Gestión de Usuarios",
      icon: Users,
      path: "/ong/app/configuracion",
      count: 2,
    },
    {
      id: "alerts",
      label: "Alertas del Sistema",
      icon: ShieldAlert,
      path: "/ong/app",
      count: 12,
    },
    {
      id: "settings",
      label: "Configuración Global",
      icon: Settings,
      path: "/ong/app/configuracion",
      count: null,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-bg-card border border-border-subtle rounded-xl overflow-hidden shadow-lg">
      <div className="p-5 border-b border-border-subtle">
        <h2 className="text-lg font-semibold text-text-primary">Accesos Directos</h2>
      </div>
      <div className="flex flex-col flex-1 p-2">
        {shortcuts.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          >
            <Link
              to={item.path}
              className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-bg-hover group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#26231F]/50 text-text-secondary group-hover:text-text-primary group-hover:bg-[#26231F] transition-colors">
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.count !== null && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#26231F] text-text-secondary">
                    {item.count} {item.count === 1 ? 'pendiente' : 'pendientes'}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
