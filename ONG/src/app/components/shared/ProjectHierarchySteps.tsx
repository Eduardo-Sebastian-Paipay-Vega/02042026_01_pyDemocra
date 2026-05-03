import { useLocation } from "react-router";
import { FolderKanban, Calendar, ListTodo, Users } from "lucide-react";
import { ONG_SHELL_BASE_PATH } from "../../tenant/navigation";

const STEPS = [
  {
    label: "Proyectos",
    icon: FolderKanban,
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.35)",
    paths: [`${ONG_SHELL_BASE_PATH}/projects`],
  },
  {
    label: "Actividades",
    icon: Calendar,
    color: "#7c3aed",
    glow: "rgba(124,58,237,0.35)",
    paths: [
      `${ONG_SHELL_BASE_PATH}/projects/activities`,
      `${ONG_SHELL_BASE_PATH}/operation/attendance`,
      `${ONG_SHELL_BASE_PATH}/operation/hours`,
      `${ONG_SHELL_BASE_PATH}/operation/evidence`,
    ],
  },
  {
    label: "Tareas",
    icon: ListTodo,
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.35)",
    paths: [`${ONG_SHELL_BASE_PATH}/projects/tasks`],
  },
  {
    label: "Asignaciones",
    icon: Users,
    color: "#6366f1",
    glow: "rgba(99,102,241,0.35)",
    paths: [`${ONG_SHELL_BASE_PATH}/projects/assignments`],
  },
] as const;

export function ProjectHierarchySteps() {
  const { pathname } = useLocation();

  const activeIndex = STEPS.findIndex((step) =>
    step.paths.some((p) => pathname === p || pathname.startsWith(p + "/"))
  );

  if (activeIndex === -1) return null;

  return (
    <div
      className="flex items-center overflow-x-auto px-4 py-2.5"
      style={{
        background: "var(--t-surface)",
        border: "1px solid var(--t-border)",
        borderRadius: "1rem",
        scrollbarWidth: "none",
        gap: 0,
      }}
    >
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx === activeIndex;
        const isPast = idx < activeIndex;
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={step.label} className="flex items-center shrink-0">
            {/* Node */}
            <div className="flex flex-col items-center gap-1" style={{ minWidth: 72 }}>
              <div
                className="flex items-center justify-center transition-all duration-200"
                style={{
                  width: isActive ? 36 : 28,
                  height: isActive ? 36 : 28,
                  borderRadius: "50%",
                  background: isActive
                    ? `radial-gradient(circle, ${step.color}22 0%, ${step.color}44 100%)`
                    : isPast
                    ? "var(--t-hover)"
                    : "transparent",
                  border: isActive
                    ? `2px solid ${step.color}`
                    : isPast
                    ? "1px solid var(--t-border)"
                    : "1.5px dashed var(--t-border)",
                  boxShadow: isActive ? `0 0 10px ${step.glow}` : "none",
                }}
              >
                <Icon
                  style={{
                    width: isActive ? 16 : 13,
                    height: isActive ? 16 : 13,
                    color: isActive
                      ? step.color
                      : isPast
                      ? "var(--t-text-dim)"
                      : "var(--t-text-tertiary)",
                    flexShrink: 0,
                  }}
                />
              </div>
              <span
                className="whitespace-nowrap text-center transition-all duration-200"
                style={{
                  fontSize: isActive ? "11px" : "10px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? step.color
                    : isPast
                    ? "var(--t-text-dim)"
                    : "var(--t-text-tertiary)",
                  letterSpacing: isActive ? "0.01em" : "0",
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className="shrink-0"
                style={{
                  height: 2,
                  width: 32,
                  marginBottom: 18,
                  borderRadius: 1,
                  background: isPast
                    ? `linear-gradient(90deg, ${step.color}66, ${STEPS[idx + 1].color}66)`
                    : "var(--t-border)",
                  transition: "background 0.2s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
