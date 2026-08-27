import { motion } from "framer-motion";
import { CalendarX, MapPin, Clock } from "lucide-react";
import type { DashboardTimelineItem } from "../../modules/home/types";

interface DashboardTimelineProps {
  timeline: DashboardTimelineItem[];
  loading: boolean;
}

export function DashboardTimeline({ timeline, loading }: DashboardTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="relative mt-1">
              <div className="h-2 w-2 rounded-full bg-neutral-200 dark:bg-zinc-700" />
              <div className="absolute left-1 top-4 h-full w-px -translate-x-1/2 bg-neutral-200 dark:bg-zinc-800" />
            </div>
            <div className="flex-1">
              <div className="h-4 w-32 bg-neutral-200 dark:bg-zinc-700 rounded mb-2" />
              <div className="h-3 w-48 bg-neutral-200 dark:bg-zinc-800 rounded mb-2" />
              <div className="h-3 w-24 bg-neutral-200 dark:bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="h-12 w-12 rounded-full bg-neutral-100 dark:bg-zinc-900 flex items-center justify-center mb-3">
          <CalendarX className="h-6 w-6 text-neutral-400 dark:text-zinc-600" />
        </div>
        <p className="text-sm font-medium text-neutral-900 dark:text-zinc-100">
          No hay actividades
        </p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-zinc-400">
          No hay eventos programados para hoy.
        </p>
        <button className="mt-4 px-4 py-2 text-sm font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
          + Programar Actividad
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      {timeline.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex gap-4 group"
        >
          <div className="relative mt-1.5 flex flex-col items-center">
            <div className={`h-2.5 w-2.5 rounded-full ${item.dotColor} ring-4 ring-white dark:ring-zinc-950 z-10`} />
            {index !== timeline.length - 1 && (
              <div className="absolute top-3 bottom-[-24px] w-px bg-neutral-200 dark:bg-zinc-800" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <h4 className="text-base font-medium text-neutral-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {item.title}
            </h4>
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-zinc-400">
              {item.subtitle}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm font-medium text-neutral-500 dark:text-zinc-400 bg-neutral-100 dark:bg-zinc-900 px-2 py-1 rounded-md">
                <Clock className="h-3 w-3" />
                {item.time}
              </div>
              {item.locationName && (
                <div className="flex items-center gap-1 text-sm font-medium text-neutral-500 dark:text-zinc-400">
                  <MapPin className="h-3 w-3 text-red-400" />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.locationName)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline hover:text-red-500 transition-colors"
                  >
                    {item.locationName}
                  </a>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
