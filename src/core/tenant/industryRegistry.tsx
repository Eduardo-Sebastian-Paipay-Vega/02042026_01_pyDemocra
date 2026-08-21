import type { IndustryDefinition, IndustryId } from "./registry-types";

// Vite inyectará automáticamente todos los registry.tsx que encuentre en industries/
const modules = import.meta.glob('../../industries/*/registry.tsx', { eager: true });

// Mapea dinámicamente las industrias que tengan INDUSTRY_DEFINITION exportado
const dynamicIndustries: IndustryDefinition[] = Object.values(modules)
  .map((mod: any) => mod.INDUSTRY_DEFINITION)
  .filter(Boolean);

const PLANNED_INDUSTRIES: IndustryDefinition[] = [
  {
    id: "health",
    name: "Health",
    description: "Industria registrada para futura integracion dentro del mismo runtime.",
    status: "planned",
    basePath: "/app/health",
    supportedModuleIds: [],
    fallbackRouteId: null,
    landingPriorityRouteIds: [],
  },
  {
    id: "retail",
    name: "Retail",
    description: "Industria registrada para futura integracion dentro del mismo runtime.",
    status: "planned",
    basePath: "/app/retail",
    supportedModuleIds: [],
    fallbackRouteId: null,
    landingPriorityRouteIds: [],
  },
];

const INDUSTRY_REGISTRY: IndustryDefinition[] = [
  ...dynamicIndustries,
  ...PLANNED_INDUSTRIES,
];

export function listIndustryDefinitions() {
  return INDUSTRY_REGISTRY;
}

export function listActiveIndustryDefinitions() {
  return INDUSTRY_REGISTRY.filter((definition) => definition.status === "active");
}

export function getIndustryDefinition(industryId: string | null | undefined) {
  return INDUSTRY_REGISTRY.find((definition) => definition.id === industryId) ?? null;
}

export function isActiveIndustryId(industryId: string | null | undefined): industryId is IndustryId {
  return INDUSTRY_REGISTRY.some(
    (definition) => definition.id === industryId && definition.status === "active"
  );
}
