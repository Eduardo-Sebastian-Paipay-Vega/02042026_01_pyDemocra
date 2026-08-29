import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Users, Briefcase, Clock, FileCheck2, Activity, CheckCircle2, AlertTriangle } from "lucide-react";
import type { DashboardMetricValues } from "../../modules/home/types";

function AnimatedCounter({ value, isTime = false }: { value: number; isTime?: boolean }) {
  const spring = useSpring(0, { bounce: 0, duration: 1500 });
  const display = useTransform(spring, (current) => {
    const val = isTime ? Math.round(current * 10) / 10 : Math.round(current);
    return val.toLocaleString("es-PE");
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

interface DashboardKpiGridProps {
  metrics: DashboardMetricValues;
  loading: boolean;
}

export function DashboardKpiGrid({ metrics, loading }: DashboardKpiGridProps) {
  const kpis = [
    {
      id: "volunteers",
      title: "Voluntarios Activos",
      value: metrics.volunteersActive,
      icon: Users,
      color: "text-emerald-600 dark:text-[#08996A]",
      bgColor: "bg-emerald-50 dark:bg-[#08996A]/10",
      badge: "En sistema",
      badgeIcon: CheckCircle2,
      badgeColor: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-[#161D17] dark:text-[#08996A] dark:border-[#08996A]/20",
    },
    {
      id: "projects",
      title: "Proyectos en Curso",
      value: metrics.projectsActive,
      icon: Briefcase,
      color: "text-blue-600 dark:text-[#356C92]",
      bgColor: "bg-blue-50 dark:bg-[#356C92]/10",
      badge: "Activos",
      badgeIcon: Activity,
      badgeColor: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-[#10141A] dark:text-[#356C92] dark:border-[#356C92]/20",
    },
    {
      id: "hours",
      title: "Horas Aprobadas",
      value: metrics.hoursApproved,
      icon: Clock,
      color: "text-purple-600 dark:text-[#8B5CF6]",
      bgColor: "bg-purple-50 dark:bg-[#8B5CF6]/10",
      badge: "Auditado OK",
      badgeIcon: CheckCircle2,
      badgeColor: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-[#1F181E] dark:text-[#8B5CF6] dark:border-[#8B5CF6]/20",
      isTime: true,
    },
    {
      id: "pending",
      title: "Horas por Revisar",
      value: metrics.approvalsPending,
      icon: FileCheck2,
      color: "text-amber-600 dark:text-[#D97706]",
      bgColor: "bg-amber-50 dark:bg-[#D97706]/10",
      badge: "Requiere atención",
      badgeIcon: AlertTriangle,
      badgeColor: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-[#231C11] dark:text-[#D97706] dark:border-[#D97706]/20",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#171512] border border-neutral-200 dark:border-[#26231F] p-6 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-neutral-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-10 w-10 bg-neutral-200 dark:bg-zinc-800 rounded-xl"></div>
            </div>
            <div className="mt-4 h-8 w-16 bg-neutral-200 dark:bg-zinc-800 rounded"></div>
            <div className="mt-4 h-6 w-28 bg-neutral-200 dark:bg-zinc-800 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const BadgeIcon = kpi.badgeIcon;
        return (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#171512] border border-neutral-200 dark:border-[#26231F] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20"
          >
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-sm font-medium text-neutral-500 dark:text-[#A4A29F]">
                {kpi.title}
              </h3>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bgColor}`}>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2 relative z-10">
              <p className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-[#F9F7F3]">
                <AnimatedCounter value={kpi.value} isTime={kpi.isTime} />
                {kpi.isTime && "h"}
              </p>
            </div>
            <div className="mt-4 flex items-center relative z-10">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs border ${kpi.badgeColor}`}>
                <BadgeIcon className="h-3.5 w-3.5" />
                {kpi.badge}
              </span>
            </div>
            
            {/* Sparkline Decorativo */}
            <div className="absolute -bottom-2 -right-2 opacity-5 dark:opacity-10 pointer-events-none transition-transform duration-500 group-hover:scale-110">
              <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 80C20 60 40 70 60 40C80 10 100 30 120 0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={kpi.color} />
              </svg>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
