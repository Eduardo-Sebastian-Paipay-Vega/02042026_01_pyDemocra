import { OngShell } from "../../industries/ong/OngShell";
import { ONG_MODULE_IDS } from "../../industries/ong/registry";
import type { IndustryDefinition, IndustryId } from "./registry-types";

const INDUSTRY_REGISTRY: IndustryDefinition[] = [
  {
    id: "ong",
    name: "ONG",
    description: "Shell operativo completo para organizaciones sin fines de lucro.",
    status: "active",
    basePath: "/app/ong",
    shell: OngShell,
    supportedModuleIds: [...ONG_MODULE_IDS],
    fallbackRouteId: "home",
    landingPriorityRouteIds: [
      "home",
      "projects",
      "operation-activities",
      "operation-hours",
      "volunteers",
      "admission-requests",
      "inventory",
      "finance",
      "notifications-history",
      "system-users",
      "roles",
      "security",
    ],
  },
  {
    id: "gym",
    name: "Gym",
    description: "Industria registrada para futura integracion dentro del mismo runtime.",
    status: "planned",
    basePath: "/app/gym",
    supportedModuleIds: [],
    fallbackRouteId: null,
    landingPriorityRouteIds: [],
  },
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
