import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type {
  GovernanceCatalogEntryField,
  GovernanceCatalogEntryRow,
  GovernanceCatalogKey,
  GovernanceCatalogSummaryRow,
} from "../../modules/governance/types";
import {
  comunicacionesSchema,
  ongSchema,
  publicSchema,
  resolveGovernanceCapabilities,
  rrhhSchema,
  sanitizeSearchTerm,
  toDisplayValue,
  toFriendlyError,
} from "./shared";

type PublicPermissionRow = AppDatabase["public"]["Tables"]["cat_permissions"]["Row"];
type PublicDocumentTypeRow = AppDatabase["public"]["Tables"]["cat_tipos_documento"]["Row"];
type PublicGenderRow = AppDatabase["public"]["Tables"]["cat_generos"]["Row"];
type PublicCountryRow = AppDatabase["public"]["Tables"]["cat_paises"]["Row"];
type PublicCurrencyRow = AppDatabase["public"]["Tables"]["cat_monedas"]["Row"];
type PublicModuleStatusRow = AppDatabase["public"]["Tables"]["cat_module_statuses"]["Row"];
type VolunteerStateRow = AppDatabase["ong"]["Tables"]["estados_voluntario"]["Row"];
type UnitRow = AppDatabase["ong"]["Tables"]["unidades_medida"]["Row"];
type ObjectStateRow = AppDatabase["ong"]["Tables"]["estados_objeto"]["Row"];
type ProjectStateRow = AppDatabase["ong"]["Tables"]["estados_proyecto"]["Row"];
type InventoryTransactionTypeRow =
  AppDatabase["ong"]["Tables"]["tipo_transaccion_inventario"]["Row"];
type SkillRow = AppDatabase["rrhh"]["Tables"]["habilidades"]["Row"];
type NotificationChannelRow =
  AppDatabase["comunicaciones"]["Tables"]["canales_notificacion"]["Row"];

interface CatalogDefinition {
  key: GovernanceCatalogKey;
  schemaName: string;
  tableName: string;
  label: string;
  description: string;
  statusLabel: string;
  canWrite: boolean;
  primaryColumn: string;
  sourceReference: string;
  fields: Array<{ key: string; label: string }>;
}

const CATALOG_DEFINITIONS: CatalogDefinition[] = [
  {
    key: "public.cat_permissions",
    schemaName: "public",
    tableName: "cat_permissions",
    label: "Permisos del core",
    description: "Permisos reales del sistema sembrados por el Core IAM.",
    statusLabel: "Solo lectura",
    canWrite: false,
    primaryColumn: "id",
    sourceReference:
      "guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt",
    fields: [
      { key: "id", label: "Permiso" },
      { key: "description", label: "Descripcion" },
      { key: "module", label: "Modulo" },
      { key: "created_at", label: "Creado" },
    ],
  },
  {
    key: "public.cat_tipos_documento",
    schemaName: "public",
    tableName: "cat_tipos_documento",
    label: "Tipos de documento",
    description: "Catalogo global de tipos de documento expuesto a formularios.",
    statusLabel: "Solo lectura",
    canWrite: false,
    primaryColumn: "codigo",
    sourceReference:
      "guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt",
    fields: [
      { key: "codigo", label: "Codigo" },
      { key: "nombre", label: "Nombre" },
    ],
  },
  {
    key: "public.cat_generos",
    schemaName: "public",
    tableName: "cat_generos",
    label: "Generos",
    description: "Catalogo global de genero reutilizado por voluntarios y beneficiarios.",
    statusLabel: "Solo lectura",
    canWrite: false,
    primaryColumn: "codigo",
    sourceReference:
      "guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt",
    fields: [
      { key: "codigo", label: "Codigo" },
      { key: "nombre", label: "Nombre" },
    ],
  },
  {
    key: "public.cat_paises",
    schemaName: "public",
    tableName: "cat_paises",
    label: "Paises",
    description: "Catalogo global de paises consumido por ubicaciones y personas.",
    statusLabel: "Solo lectura",
    canWrite: false,
    primaryColumn: "codigo",
    sourceReference:
      "guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt",
    fields: [
      { key: "codigo", label: "Codigo" },
      { key: "nombre", label: "Nombre" },
    ],
  },
  {
    key: "public.cat_monedas",
    schemaName: "public",
    tableName: "cat_monedas",
    label: "Monedas",
    description: "Catalogo global de monedas reutilizado por Finanzas.",
    statusLabel: "Solo lectura",
    canWrite: false,
    primaryColumn: "codigo",
    sourceReference:
      "guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt",
    fields: [
      { key: "codigo", label: "Codigo" },
      { key: "nombre", label: "Nombre" },
      { key: "simbolo", label: "Simbolo" },
    ],
  },
  {
    key: "public.cat_module_statuses",
    schemaName: "public",
    tableName: "cat_module_statuses",
    label: "Estados de modulo",
    description: "Catalogo del core para habilitacion de modulos por tenant.",
    statusLabel: "Solo lectura",
    canWrite: false,
    primaryColumn: "codigo",
    sourceReference:
      "guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt",
    fields: [
      { key: "codigo", label: "Codigo" },
      { key: "nombre", label: "Nombre" },
    ],
  },
  {
    key: "ong.estados_voluntario",
    schemaName: "ong",
    tableName: "estados_voluntario",
    label: "Estados de voluntario",
    description: "Catalogo ONG para el ciclo de vida de voluntarios.",
    statusLabel: "Solo lectura",
    canWrite: false,
    primaryColumn: "codigo",
    sourceReference:
      "guidelines/BD/Parte 2 - Script maestro documental de ONG módulos complementarios.txt",
    fields: [
      { key: "codigo", label: "Codigo" },
      { key: "nombre_estado", label: "Nombre" },
      { key: "descripcion", label: "Descripcion" },
      { key: "orden_visual", label: "Orden" },
    ],
  },
  {
    key: "ong.unidades_medida",
    schemaName: "ong",
    tableName: "unidades_medida",
    label: "Unidades de medida",
    description: "Catalogo ONG para items y recursos de inventario.",
    statusLabel: "Solo lectura",
    canWrite: false,
    primaryColumn: "codigo",
    sourceReference:
      "guidelines/BD/Parte 2 - Script maestro documental de ONG módulos complementarios.txt",
    fields: [
      { key: "codigo", label: "Codigo" },
      { key: "nombre", label: "Nombre" },
      { key: "abreviatura", label: "Abreviatura" },
    ],
  },
  {
    key: "ong.estados_objeto",
    schemaName: "ong",
    tableName: "estados_objeto",
    label: "Estados de objeto",
    description: "Catalogo ONG para clasificar el estado de items.",
    statusLabel: "Solo lectura",
    canWrite: false,
    primaryColumn: "codigo",
    sourceReference:
      "guidelines/BD/Parte 2 - Script maestro documental de ONG módulos complementarios.txt",
    fields: [
      { key: "codigo", label: "Codigo" },
      { key: "nombre", label: "Nombre" },
      { key: "descripcion", label: "Descripcion" },
    ],
  },
  {
    key: "ong.estados_proyecto",
    schemaName: "ong",
    tableName: "estados_proyecto",
    label: "Estados de proyecto",
    description: "Catalogo ONG para proyectos.",
    statusLabel: "Solo lectura",
    canWrite: false,
    primaryColumn: "codigo",
    sourceReference:
      "guidelines/BD/Parte 2 - Script maestro documental de ONG módulos complementarios.txt",
    fields: [
      { key: "codigo", label: "Codigo" },
      { key: "nombre_estado", label: "Nombre" },
      { key: "orden_visual", label: "Orden" },
    ],
  },
  {
    key: "ong.tipo_transaccion_inventario",
    schemaName: "ong",
    tableName: "tipo_transaccion_inventario",
    label: "Tipos de transaccion de inventario",
    description: "Catalogo ONG para entradas, salidas y ajustes de inventario.",
    statusLabel: "Solo lectura",
    canWrite: false,
    primaryColumn: "codigo",
    sourceReference:
      "guidelines/BD/Parte 2 - Script maestro documental de ONG módulos complementarios.txt",
    fields: [
      { key: "codigo", label: "Codigo" },
      { key: "nombre", label: "Nombre" },
      { key: "signo", label: "Signo" },
    ],
  },
  {
    key: "rrhh.habilidades",
    schemaName: "rrhh",
    tableName: "habilidades",
    label: "Habilidades",
    description: "Catalogo RRHH usado para asignar habilidades a voluntarios.",
    statusLabel: "Solo lectura",
    canWrite: false,
    primaryColumn: "codigo",
    sourceReference:
      "guidelines/BD/Parte 2 - Script maestro documental de ONG módulos complementarios.txt",
    fields: [
      { key: "codigo", label: "Codigo" },
      { key: "nombre", label: "Nombre" },
    ],
  },
  {
    key: "comunicaciones.canales_notificacion",
    schemaName: "comunicaciones",
    tableName: "canales_notificacion",
    label: "Canales de notificacion",
    description: "Catalogo de canales reales para el modulo de notificaciones.",
    statusLabel: "Solo lectura",
    canWrite: false,
    primaryColumn: "codigo",
    sourceReference:
      "guidelines/BD/Parte 2 - Script maestro documental de ONG módulos complementarios.txt",
    fields: [
      { key: "codigo", label: "Codigo" },
      { key: "nombre", label: "Nombre" },
    ],
  },
];

function getCatalogDefinition(key: GovernanceCatalogKey): CatalogDefinition {
  const definition = CATALOG_DEFINITIONS.find((item) => item.key === key);
  if (!definition) {
    throw new Error("No se encontro la definicion del catalogo solicitado.");
  }
  return definition;
}

function mapFields(
  definition: CatalogDefinition,
  row: Record<string, unknown>
): GovernanceCatalogEntryField[] {
  return definition.fields.map((field) => ({
    label: field.label,
    value: toDisplayValue(row[field.key]),
  }));
}

function mapCatalogRow(
  definition: CatalogDefinition,
  row: Record<string, unknown>,
  secondaryKey: string,
  tertiaryKey?: string
): GovernanceCatalogEntryRow {
  const rowId = toDisplayValue(row[definition.primaryColumn]);

  return {
    id: rowId,
    catalogKey: definition.key,
    primaryValue: rowId,
    secondaryValue: toDisplayValue(row[secondaryKey]),
    tertiaryValue: tertiaryKey ? toDisplayValue(row[tertiaryKey]) : "-",
    supportLabel: definition.statusLabel,
    fields: mapFields(definition, row),
    raw: row,
  };
}

async function fetchCatalogCount(key: GovernanceCatalogKey): Promise<number | null> {
  switch (key) {
    case "public.cat_permissions": {
      const { count, error } = await publicSchema()
        .from("cat_permissions")
        .select("id", { count: "exact", head: true });
      if (error) {
        throw new Error(error.message);
      }
      return count ?? null;
    }
    case "public.cat_tipos_documento": {
      const { count, error } = await publicSchema()
        .from("cat_tipos_documento")
        .select("codigo", { count: "exact", head: true });
      if (error) {
        throw new Error(error.message);
      }
      return count ?? null;
    }
    case "public.cat_generos": {
      const { count, error } = await publicSchema()
        .from("cat_generos")
        .select("codigo", { count: "exact", head: true });
      if (error) {
        throw new Error(error.message);
      }
      return count ?? null;
    }
    case "public.cat_paises": {
      const { count, error } = await publicSchema()
        .from("cat_paises")
        .select("codigo", { count: "exact", head: true });
      if (error) {
        throw new Error(error.message);
      }
      return count ?? null;
    }
    case "public.cat_monedas": {
      const { count, error } = await publicSchema()
        .from("cat_monedas")
        .select("codigo", { count: "exact", head: true });
      if (error) {
        throw new Error(error.message);
      }
      return count ?? null;
    }
    case "public.cat_module_statuses": {
      const { count, error } = await publicSchema()
        .from("cat_module_statuses")
        .select("codigo", { count: "exact", head: true });
      if (error) {
        throw new Error(error.message);
      }
      return count ?? null;
    }
    case "ong.estados_voluntario": {
      const { count, error } = await ongSchema()
        .from("estados_voluntario")
        .select("codigo", { count: "exact", head: true });
      if (error) {
        throw new Error(error.message);
      }
      return count ?? null;
    }
    case "ong.unidades_medida": {
      const { count, error } = await ongSchema()
        .from("unidades_medida")
        .select("codigo", { count: "exact", head: true });
      if (error) {
        throw new Error(error.message);
      }
      return count ?? null;
    }
    case "ong.estados_objeto": {
      const { count, error } = await ongSchema()
        .from("estados_objeto")
        .select("codigo", { count: "exact", head: true });
      if (error) {
        throw new Error(error.message);
      }
      return count ?? null;
    }
    case "ong.estados_proyecto": {
      const { count, error } = await ongSchema()
        .from("estados_proyecto")
        .select("codigo", { count: "exact", head: true });
      if (error) {
        throw new Error(error.message);
      }
      return count ?? null;
    }
    case "ong.tipo_transaccion_inventario": {
      const { count, error } = await ongSchema()
        .from("tipo_transaccion_inventario")
        .select("codigo", { count: "exact", head: true });
      if (error) {
        throw new Error(error.message);
      }
      return count ?? null;
    }
    case "rrhh.habilidades": {
      const { count, error } = await rrhhSchema()
        .from("habilidades")
        .select("codigo", { count: "exact", head: true });
      if (error) {
        throw new Error(error.message);
      }
      return count ?? null;
    }
    case "comunicaciones.canales_notificacion": {
      const { count, error } = await comunicacionesSchema()
        .from("canales_notificacion")
        .select("codigo", { count: "exact", head: true });
      if (error) {
        throw new Error(error.message);
      }
      return count ?? null;
    }
  }
}

export async function listGovernanceCatalogSummaries(): Promise<GovernanceCatalogSummaryRow[]> {
  try {
    const access = await resolveGovernanceCapabilities();
    if (!access.canReadCatalogs) {
      throw new Error(
        "La vista de catalogos requiere `governance.catalogs.read` o tenant admin."
      );
    }

    const counts = await Promise.all(
      CATALOG_DEFINITIONS.map((definition) =>
        fetchCatalogCount(definition.key).catch(() => null)
      )
    );

    return CATALOG_DEFINITIONS.map((definition, index) => ({
      id: definition.key,
      key: definition.key,
      schemaName: definition.schemaName,
      tableName: definition.tableName,
      label: definition.label,
      description: definition.description,
      statusLabel: definition.statusLabel,
      canWrite: definition.canWrite,
      primaryColumn: definition.primaryColumn,
      sourceReference: definition.sourceReference,
      rowCount: counts[index],
    }));
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudieron cargar los catalogos reales de Gobernanza.")
    );
  }
}

export async function listGovernanceCatalogEntries(
  key: GovernanceCatalogKey,
  searchTerm: string
): Promise<GovernanceCatalogEntryRow[]> {
  const definition = getCatalogDefinition(key);
  const searchPattern = sanitizeSearchTerm(searchTerm);

  try {
    const access = await resolveGovernanceCapabilities();
    if (!access.canReadCatalogs) {
      throw new Error(
        "La vista de catalogos requiere `governance.catalogs.read` o tenant admin."
      );
    }

    switch (key) {
      case "public.cat_permissions": {
        let query = publicSchema()
          .from("cat_permissions")
          .select("id, description, module, created_at")
          .order("module", { ascending: true })
          .order("id", { ascending: true })
          .limit(200);

        if (searchPattern) {
          query = query.or(
            `id.ilike.%${searchPattern}%,description.ilike.%${searchPattern}%,module.ilike.%${searchPattern}%`
          );
        }

        const { data, error } = await query;
        if (error) {
          throw new Error(error.message);
        }

        return ((data ?? []) as PublicPermissionRow[]).map((row) =>
          mapCatalogRow(definition, row, "description", "module")
        );
      }
      case "public.cat_tipos_documento": {
        let query = publicSchema()
          .from("cat_tipos_documento")
          .select("codigo, nombre")
          .order("nombre", { ascending: true })
          .limit(200);

        if (searchPattern) {
          query = query.or(`codigo.ilike.%${searchPattern}%,nombre.ilike.%${searchPattern}%`);
        }

        const { data, error } = await query;
        if (error) {
          throw new Error(error.message);
        }

        return ((data ?? []) as PublicDocumentTypeRow[]).map((row) =>
          mapCatalogRow(definition, row, "nombre")
        );
      }
      case "public.cat_generos": {
        let query = publicSchema()
          .from("cat_generos")
          .select("codigo, nombre")
          .order("nombre", { ascending: true })
          .limit(200);

        if (searchPattern) {
          query = query.or(`codigo.ilike.%${searchPattern}%,nombre.ilike.%${searchPattern}%`);
        }

        const { data, error } = await query;
        if (error) {
          throw new Error(error.message);
        }

        return ((data ?? []) as PublicGenderRow[]).map((row) =>
          mapCatalogRow(definition, row, "nombre")
        );
      }
      case "public.cat_paises": {
        let query = publicSchema()
          .from("cat_paises")
          .select("codigo, nombre")
          .order("nombre", { ascending: true })
          .limit(200);

        if (searchPattern) {
          query = query.or(`codigo.ilike.%${searchPattern}%,nombre.ilike.%${searchPattern}%`);
        }

        const { data, error } = await query;
        if (error) {
          throw new Error(error.message);
        }

        return ((data ?? []) as PublicCountryRow[]).map((row) =>
          mapCatalogRow(definition, row, "nombre")
        );
      }
      case "public.cat_monedas": {
        let query = publicSchema()
          .from("cat_monedas")
          .select("codigo, nombre, simbolo")
          .order("nombre", { ascending: true })
          .limit(200);

        if (searchPattern) {
          query = query.or(
            `codigo.ilike.%${searchPattern}%,nombre.ilike.%${searchPattern}%,simbolo.ilike.%${searchPattern}%`
          );
        }

        const { data, error } = await query;
        if (error) {
          throw new Error(error.message);
        }

        return ((data ?? []) as PublicCurrencyRow[]).map((row) =>
          mapCatalogRow(definition, row, "nombre", "simbolo")
        );
      }
      case "public.cat_module_statuses": {
        let query = publicSchema()
          .from("cat_module_statuses")
          .select("codigo, nombre")
          .order("nombre", { ascending: true })
          .limit(200);

        if (searchPattern) {
          query = query.or(`codigo.ilike.%${searchPattern}%,nombre.ilike.%${searchPattern}%`);
        }

        const { data, error } = await query;
        if (error) {
          throw new Error(error.message);
        }

        return ((data ?? []) as PublicModuleStatusRow[]).map((row) =>
          mapCatalogRow(definition, row, "nombre")
        );
      }
      case "ong.estados_voluntario": {
        let query = ongSchema()
          .from("estados_voluntario")
          .select("codigo, nombre_estado, descripcion, orden_visual")
          .order("orden_visual", { ascending: true })
          .limit(200);

        if (searchPattern) {
          query = query.or(
            `codigo.ilike.%${searchPattern}%,nombre_estado.ilike.%${searchPattern}%,descripcion.ilike.%${searchPattern}%`
          );
        }

        const { data, error } = await query;
        if (error) {
          throw new Error(error.message);
        }

        return ((data ?? []) as VolunteerStateRow[]).map((row) =>
          mapCatalogRow(definition, row, "nombre_estado", "descripcion")
        );
      }
      case "ong.unidades_medida": {
        let query = ongSchema()
          .from("unidades_medida")
          .select("codigo, nombre, abreviatura")
          .order("nombre", { ascending: true })
          .limit(200);

        if (searchPattern) {
          query = query.or(
            `codigo.ilike.%${searchPattern}%,nombre.ilike.%${searchPattern}%,abreviatura.ilike.%${searchPattern}%`
          );
        }

        const { data, error } = await query;
        if (error) {
          throw new Error(error.message);
        }

        return ((data ?? []) as UnitRow[]).map((row) =>
          mapCatalogRow(definition, row, "nombre", "abreviatura")
        );
      }
      case "ong.estados_objeto": {
        let query = ongSchema()
          .from("estados_objeto")
          .select("codigo, nombre, descripcion")
          .order("nombre", { ascending: true })
          .limit(200);

        if (searchPattern) {
          query = query.or(
            `codigo.ilike.%${searchPattern}%,nombre.ilike.%${searchPattern}%,descripcion.ilike.%${searchPattern}%`
          );
        }

        const { data, error } = await query;
        if (error) {
          throw new Error(error.message);
        }

        return ((data ?? []) as ObjectStateRow[]).map((row) =>
          mapCatalogRow(definition, row, "nombre", "descripcion")
        );
      }
      case "ong.estados_proyecto": {
        let query = ongSchema()
          .from("estados_proyecto")
          .select("codigo, nombre_estado, orden_visual")
          .order("orden_visual", { ascending: true })
          .limit(200);

        if (searchPattern) {
          query = query.or(
            `codigo.ilike.%${searchPattern}%,nombre_estado.ilike.%${searchPattern}%`
          );
        }

        const { data, error } = await query;
        if (error) {
          throw new Error(error.message);
        }

        return ((data ?? []) as ProjectStateRow[]).map((row) =>
          mapCatalogRow(definition, row, "nombre_estado", "orden_visual")
        );
      }
      case "ong.tipo_transaccion_inventario": {
        let query = ongSchema()
          .from("tipo_transaccion_inventario")
          .select("codigo, nombre, signo")
          .order("nombre", { ascending: true })
          .limit(200);

        if (searchPattern) {
          query = query.or(`codigo.ilike.%${searchPattern}%,nombre.ilike.%${searchPattern}%`);
        }

        const { data, error } = await query;
        if (error) {
          throw new Error(error.message);
        }

        return ((data ?? []) as InventoryTransactionTypeRow[]).map((row) =>
          mapCatalogRow(definition, row, "nombre", "signo")
        );
      }
      case "rrhh.habilidades": {
        let query = rrhhSchema()
          .from("habilidades")
          .select("codigo, nombre")
          .order("nombre", { ascending: true })
          .limit(200);

        if (searchPattern) {
          query = query.or(`codigo.ilike.%${searchPattern}%,nombre.ilike.%${searchPattern}%`);
        }

        const { data, error } = await query;
        if (error) {
          throw new Error(error.message);
        }

        return ((data ?? []) as SkillRow[]).map((row) =>
          mapCatalogRow(definition, row, "nombre")
        );
      }
      case "comunicaciones.canales_notificacion": {
        let query = comunicacionesSchema()
          .from("canales_notificacion")
          .select("codigo, nombre")
          .order("nombre", { ascending: true })
          .limit(200);

        if (searchPattern) {
          query = query.or(`codigo.ilike.%${searchPattern}%,nombre.ilike.%${searchPattern}%`);
        }

        const { data, error } = await query;
        if (error) {
          throw new Error(error.message);
        }

        return ((data ?? []) as NotificationChannelRow[]).map((row) =>
          mapCatalogRow(definition, row, "nombre")
        );
      }
    }
  } catch (error) {
    throw new Error(
      toFriendlyError(
        error,
        `No se pudo cargar el catalogo ${definition.schemaName}.${definition.tableName}.`
      )
    );
  }
}
