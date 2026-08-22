/**
 * EDUCACION OS — Permission Type Taxonomy
 *
 * Permissions follow the pattern: domain:resource:action
 * This layer is frontend-only. It is designed to be
 * replaced by a backend authorization source (e.g. JWT claims,
 * Supabase RLS policies, Casbin rules) without restructuring modules.
 */

// ─── Domain Permissions ───────────────────────────────────────────────────────

export type PermissionEduca =
  | 'educa:view'
  | 'educa:cursos:view'
  | 'educa:cursos:create'
  | 'educa:cursos:edit'
  | 'educa:evaluaciones:view'
  | 'educa:evaluaciones:create'
  | 'educa:evaluaciones:grade'
  | 'educa:asistencia:view'
  | 'educa:asistencia:manage'
  | 'educa:calificaciones:view'
  | 'educa:calificaciones:manage'
  | 'educa:items:view'
  | 'educa:items:create'
  | 'educa:items:manage'
  | 'educa:gamificacion:view'
  | 'educa:gamificacion:manage'
  | 'educa:lab3d:view'
  | 'educa:adaptive:view'
  | 'educa:proctoring:manage'
  | 'educa:peer_review:view'
  | 'educa:cat_irt:view'
  | 'educa:psico:view'
  | 'educa:digital_twin:view'
  | 'educa:cognitive_load:view'

export type PermissionFinanzas =
  | 'finanzas:view'
  | 'finanzas:pagos:view'
  | 'finanzas:pagos:create'
  | 'finanzas:reportes:view'
  | 'finanzas:reportes:export'
  | 'finanzas:deudores:view'
  | 'finanzas:tokens:view'
  | 'finanzas:tokens:manage'
  | 'finanzas:erp:manage'

export type PermissionEWS =
  | 'ews:view'
  | 'ews:alerts:view'
  | 'ews:alerts:intervene'
  | 'ews:behavioral:view'
  | 'ews:behavioral:manage'

export type PermissionComunicacion =
  | 'comunicacion:view'
  | 'comunicacion:chat:view'
  | 'comunicacion:chat:send'
  | 'comunicacion:avisos:view'
  | 'comunicacion:avisos:create'
  | 'comunicacion:circulares:view'
  | 'comunicacion:circulares:create'
  | 'comunicacion:red_social:view'

export type PermissionInstitution =
  | 'institution:view'
  | 'institution:director:full'
  | 'institution:matricula:view'
  | 'institution:matricula:manage'
  | 'institution:usuarios:view'
  | 'institution:usuarios:manage'
  | 'institution:espacios:view'
  | 'institution:espacios:manage'
  | 'institution:horarios:view'
  | 'institution:horarios:manage'
  | 'institution:nomina:view'
  | 'institution:nomina:manage'
  | 'institution:gobernanza:view'
  | 'institution:gobernanza:manage'
  | 'institution:privacidad:view'
  | 'institution:privacidad:manage'
  | 'institution:mantenimiento:view'
  | 'institution:becas:view'
  | 'institution:becas:manage'
  | 'institution:emergencias:view'
  | 'institution:emergencias:manage'
  | 'institution:auditoria:view'
  | 'institution:clima:view'
  | 'institution:alumni:view'
  | 'institution:esg:view'
  | 'institution:benchmarking:view'
  | 'institution:transparencia:view'

export type PermissionIA =
  | 'ia:view'
  | 'ia:demi:view'
  | 'ia:demi:interact'
  | 'ia:agentes:view'
  | 'ia:agentes:manage'
  | 'ia:federated:view'
  | 'ia:federated:manage'
  | 'ia:knowledge_graph:view'
  | 'ia:plugins:view'
  | 'ia:plugins:manage'

export type PermissionBienestar =
  | 'bienestar:view'
  | 'bienestar:salud_mental:view'
  | 'bienestar:bullying:view'
  | 'bienestar:bullying:intervene'
  | 'bienestar:clanes:view'
  | 'bienestar:clanes:manage'
  | 'bienestar:clubes:view'
  | 'bienestar:clubes:manage'
  | 'bienestar:iep:view'
  | 'bienestar:iep:manage'
  | 'bienestar:aprendizaje_servicio:view'
  | 'bienestar:p2p_marketplace:view'

export type PermissionProfile =
  | 'profile:view'
  | 'profile:edit'
  | 'settings:view'
  | 'settings:edit'

export type PermissionIdentidad =
  | 'identidad:pasaporte:view'
  | 'identidad:sovereign:view'
  | 'identidad:marketplace_b2b:view'
  | 'identidad:marketplace_b2b:manage'

// ─── Union Type ───────────────────────────────────────────────────────────────

export type Permission =
  | PermissionEduca
  | PermissionFinanzas
  | PermissionEWS
  | PermissionComunicacion
  | PermissionInstitution
  | PermissionIA
  | PermissionBienestar
  | PermissionProfile
  | PermissionIdentidad

// ─── Module Identifiers ───────────────────────────────────────────────────────

export type ModuleId =
  | 'educa'
  | 'finanzas'
  | 'ews'
  | 'comunicacion'
  | 'institution'
  | 'ia'
  | 'bienestar'
  | 'profile'
  | 'settings'
  | 'identidad'
