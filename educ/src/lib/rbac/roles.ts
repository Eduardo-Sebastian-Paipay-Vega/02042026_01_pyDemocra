/**
 * EDUCACION OS — Role → Permission Mapping
 *
 * This is the ONLY place where roles translate to permissions.
 * Roles are configuration. Modules are architecture.
 *
 * To add a new role: add one entry to ROLE_PERMISSIONS.
 * No feature directory changes are required.
 *
 * Future: Replace this map with a JWT claims parser or
 * a Supabase RPC call that returns the user's permissions array.
 */

import type { Permission } from './permissions'

export type RoleId =
  | 'prime'
  | 'director'
  | 'docente'
  | 'coordinador'
  | 'padres'
  | 'cfo'
  | 'estudiante'
  | 'tutor'

// ─── Default permissions shared by every authenticated user ───────────────────
const BASE_PERMISSIONS: Permission[] = [
  'profile:view',
  'profile:edit',
  'settings:view',
  'settings:edit',
  'ia:demi:view',
  'ia:demi:interact',
  'comunicacion:avisos:view',
]

// ─── Role → Permission mapping ────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<RoleId, Permission[]> = {

  prime: [
    // Prime has ALL permissions
    ...BASE_PERMISSIONS,
    // educa
    'educa:view', 'educa:cursos:view', 'educa:cursos:create', 'educa:cursos:edit',
    'educa:evaluaciones:view', 'educa:evaluaciones:create', 'educa:evaluaciones:grade',
    'educa:asistencia:view', 'educa:asistencia:manage',
    'educa:calificaciones:view', 'educa:calificaciones:manage',
    'educa:items:view', 'educa:items:create', 'educa:items:manage',
    'educa:gamificacion:view', 'educa:gamificacion:manage',
    'educa:lab3d:view', 'educa:adaptive:view', 'educa:proctoring:manage',
    'educa:peer_review:view', 'educa:cat_irt:view', 'educa:psico:view',
    'educa:digital_twin:view', 'educa:cognitive_load:view',
    // finanzas
    'finanzas:view', 'finanzas:pagos:view', 'finanzas:pagos:create',
    'finanzas:reportes:view', 'finanzas:reportes:export',
    'finanzas:deudores:view', 'finanzas:tokens:view', 'finanzas:tokens:manage',
    'finanzas:erp:manage',
    // ews
    'ews:view', 'ews:alerts:view', 'ews:alerts:intervene',
    'ews:behavioral:view', 'ews:behavioral:manage',
    // comunicacion
    'comunicacion:view', 'comunicacion:chat:view', 'comunicacion:chat:send',
    'comunicacion:avisos:view', 'comunicacion:avisos:create',
    'comunicacion:circulares:view', 'comunicacion:circulares:create',
    'comunicacion:red_social:view',
    // institution
    'institution:view', 'institution:director:full',
    'institution:matricula:view', 'institution:matricula:manage',
    'institution:usuarios:view', 'institution:usuarios:manage',
    'institution:espacios:view', 'institution:espacios:manage',
    'institution:horarios:view', 'institution:horarios:manage',
    'institution:nomina:view', 'institution:nomina:manage',
    'institution:gobernanza:view', 'institution:gobernanza:manage',
    'institution:privacidad:view', 'institution:privacidad:manage',
    'institution:mantenimiento:view', 'institution:becas:view', 'institution:becas:manage',
    'institution:emergencias:view', 'institution:emergencias:manage',
    'institution:auditoria:view', 'institution:clima:view',
    'institution:alumni:view', 'institution:esg:view',
    'institution:benchmarking:view', 'institution:transparencia:view',
    // ia
    'ia:view', 'ia:agentes:view', 'ia:agentes:manage',
    'ia:federated:view', 'ia:federated:manage',
    'ia:knowledge_graph:view', 'ia:plugins:view', 'ia:plugins:manage',
    // bienestar
    'bienestar:view', 'bienestar:salud_mental:view',
    'bienestar:bullying:view', 'bienestar:bullying:intervene',
    'bienestar:clanes:view', 'bienestar:clanes:manage',
    'bienestar:clubes:view', 'bienestar:clubes:manage',
    'bienestar:iep:view', 'bienestar:iep:manage',
    'bienestar:aprendizaje_servicio:view', 'bienestar:p2p_marketplace:view',
    // identidad
    'identidad:pasaporte:view', 'identidad:sovereign:view',
    'identidad:marketplace_b2b:view', 'identidad:marketplace_b2b:manage',
  ],

  director: [
    ...BASE_PERMISSIONS,
    'educa:view', 'educa:cursos:view', 'educa:evaluaciones:view',
    'educa:asistencia:view', 'educa:calificaciones:view',
    'educa:gamificacion:view', 'educa:items:view', 'educa:adaptive:view',
    'educa:digital_twin:view', 'educa:lab3d:view', 'educa:psico:view',
    'educa:cat_irt:view', 'educa:peer_review:view', 'educa:proctoring:manage',
    'finanzas:view', 'finanzas:pagos:view', 'finanzas:reportes:view',
    'finanzas:reportes:export', 'finanzas:deudores:view', 'finanzas:erp:manage',
    'ews:view', 'ews:alerts:view', 'ews:alerts:intervene',
    'ews:behavioral:view', 'ews:behavioral:manage',
    'comunicacion:view', 'comunicacion:avisos:create', 'comunicacion:circulares:create',
    'comunicacion:red_social:view',
    'institution:view', 'institution:director:full',
    'institution:matricula:view', 'institution:matricula:manage',
    'institution:usuarios:view', 'institution:usuarios:manage',
    'institution:espacios:view', 'institution:espacios:manage',
    'institution:horarios:view', 'institution:horarios:manage',
    'institution:nomina:view', 'institution:nomina:manage',
    'institution:gobernanza:view', 'institution:gobernanza:manage',
    'institution:privacidad:view', 'institution:privacidad:manage',
    'institution:mantenimiento:view', 'institution:becas:view', 'institution:becas:manage',
    'institution:emergencias:view', 'institution:emergencias:manage',
    'institution:auditoria:view', 'institution:clima:view',
    'institution:alumni:view', 'institution:esg:view',
    'institution:benchmarking:view', 'institution:transparencia:view',
    'ia:view', 'ia:agentes:view', 'ia:agentes:manage',
    'ia:federated:view', 'ia:knowledge_graph:view', 'ia:plugins:view', 'ia:plugins:manage',
    'bienestar:view', 'bienestar:salud_mental:view',
    'bienestar:bullying:view', 'bienestar:bullying:intervene',
    'bienestar:clanes:view', 'bienestar:iep:view', 'bienestar:iep:manage',
    'identidad:pasaporte:view', 'identidad:marketplace_b2b:view', 'identidad:marketplace_b2b:manage',
  ],

  docente: [
    ...BASE_PERMISSIONS,
    'educa:view', 'educa:cursos:view', 'educa:cursos:create', 'educa:cursos:edit',
    'educa:evaluaciones:view', 'educa:evaluaciones:create', 'educa:evaluaciones:grade',
    'educa:asistencia:view', 'educa:asistencia:manage',
    'educa:calificaciones:view', 'educa:calificaciones:manage',
    'educa:items:view', 'educa:items:create', 'educa:items:manage',
    'educa:gamificacion:view', 'educa:lab3d:view', 'educa:adaptive:view',
    'educa:proctoring:manage', 'educa:peer_review:view', 'educa:cat_irt:view',
    'educa:digital_twin:view',
    'comunicacion:view', 'comunicacion:chat:view', 'comunicacion:chat:send',
    'comunicacion:avisos:view',
    'ews:view', 'ews:alerts:view',
    'bienestar:salud_mental:view', 'bienestar:bullying:view', 'bienestar:bullying:intervene',
    'bienestar:iep:view', 'bienestar:iep:manage',
    'bienestar:p2p_marketplace:view',
  ],

  coordinador: [
    ...BASE_PERMISSIONS,
    'educa:view', 'educa:cursos:view', 'educa:calificaciones:view',
    'educa:asistencia:view', 'educa:evaluaciones:view',
    'institution:view', 'institution:matricula:view', 'institution:matricula:manage',
    'institution:horarios:view', 'institution:horarios:manage',
    'ews:view', 'ews:alerts:view', 'ews:alerts:intervene',
    'comunicacion:view', 'comunicacion:avisos:view', 'comunicacion:circulares:view',
    'finanzas:deudores:view', 'finanzas:reportes:view',
  ],

  padres: [
    ...BASE_PERMISSIONS,
    'educa:view', 'educa:calificaciones:view', 'educa:asistencia:view',
    'educa:gamificacion:view',
    'finanzas:view', 'finanzas:pagos:view', 'finanzas:pagos:create',
    'comunicacion:view', 'comunicacion:chat:view', 'comunicacion:chat:send',
    'comunicacion:avisos:view',
    'bienestar:salud_mental:view',
    'identidad:pasaporte:view',
  ],

  cfo: [
    ...BASE_PERMISSIONS,
    'finanzas:view', 'finanzas:pagos:view', 'finanzas:pagos:create',
    'finanzas:reportes:view', 'finanzas:reportes:export',
    'finanzas:deudores:view', 'finanzas:tokens:view', 'finanzas:tokens:manage',
    'finanzas:erp:manage',
    'institution:auditoria:view',
  ],

  estudiante: [
    ...BASE_PERMISSIONS,
    'educa:view', 'educa:cursos:view', 'educa:calificaciones:view',
    'educa:asistencia:view', 'educa:evaluaciones:view',
    'educa:gamificacion:view', 'educa:lab3d:view', 'educa:adaptive:view',
    'educa:peer_review:view', 'educa:cat_irt:view', 'educa:psico:view',
    'educa:cognitive_load:view',
    'comunicacion:view', 'comunicacion:chat:view', 'comunicacion:chat:send',
    'comunicacion:red_social:view',
    'bienestar:salud_mental:view', 'bienestar:clanes:view',
    'bienestar:clubes:view', 'bienestar:aprendizaje_servicio:view',
    'bienestar:p2p_marketplace:view',
    'identidad:pasaporte:view', 'identidad:sovereign:view',
  ],

  tutor: [
    ...BASE_PERMISSIONS,
    'educa:view', 'educa:calificaciones:view', 'educa:asistencia:view',
    'ews:view', 'ews:alerts:view', 'ews:alerts:intervene',
    'comunicacion:view', 'comunicacion:chat:view', 'comunicacion:chat:send',
    'bienestar:salud_mental:view',
  ],
}
