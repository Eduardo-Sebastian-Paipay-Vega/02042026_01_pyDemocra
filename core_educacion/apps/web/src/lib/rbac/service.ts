/**
 * EDUCACION OS — RBAC Service
 *
 * Provides the capability API that all modules use.
 * Components never inspect raw role strings — they ask:
 *   "Can I perform this capability?"
 *
 * Future backend integration: replace buildSession() by
 * parsing JWT claims or calling a Supabase edge function.
 */

import type { Permission, ModuleId } from './permissions'
import { ROLE_PERMISSIONS, type RoleId } from './roles'

// ─── Session Model ────────────────────────────────────────────────────────────

export interface UserSession {
  userId: string
  name: string
  email: string
  /** The primary display role (for UI labels only, NOT architecture) */
  primaryRole: RoleId
  /** All active roles (a user can have multiple) */
  roles: RoleId[]
  /** Computed flat permission set from all active roles */
  permissions: Set<Permission>
}

// ─── Session Builder ──────────────────────────────────────────────────────────

export function buildSession(
  name: string,
  primaryRole: RoleId,
  extraRoles: RoleId[] = [],
): UserSession {
  const allRoles = [primaryRole, ...extraRoles] as RoleId[]
  const permissions = new Set<Permission>()

  for (const role of allRoles) {
    const rolePerms = ROLE_PERMISSIONS[role] ?? []
    for (const p of rolePerms) {
      permissions.add(p)
    }
  }

  return {
    userId: `mock-${primaryRole}-001`,
    name,
    email: `${name.toLowerCase().replace(/\s/g, '.')}@democra.edu`,
    primaryRole,
    roles: allRoles,
    permissions,
  }
}

// ─── Capability API ───────────────────────────────────────────────────────────

/** Check if a session has a specific permission */
export function hasPermission(session: UserSession, permission: Permission): boolean {
  return session.permissions.has(permission)
}

/** Check if a session has ALL of the listed permissions */
export function hasAllPermissions(session: UserSession, perms: Permission[]): boolean {
  return perms.every(p => session.permissions.has(p))
}

/** Check if a session has ANY of the listed permissions */
export function hasAnyPermission(session: UserSession, perms: Permission[]): boolean {
  return perms.some(p => session.permissions.has(p))
}

// ─── Module Access ────────────────────────────────────────────────────────────

const MODULE_GATE: Record<ModuleId, Permission> = {
  educa:        'educa:view',
  finanzas:     'finanzas:view',
  ews:          'ews:view',
  comunicacion: 'comunicacion:view',
  institution:  'institution:view',
  ia:           'ia:view',
  bienestar:    'bienestar:view',
  profile:      'profile:view',
  settings:     'settings:view',
  identidad:    'identidad:pasaporte:view',
}

export function canAccessModule(session: UserSession, moduleId: ModuleId): boolean {
  const gate = MODULE_GATE[moduleId]
  return gate ? session.permissions.has(gate) : false
}

// ─── Mock Sessions (replaces hardcoded role strings) ──────────────────────────

export const MOCK_SESSIONS: Record<RoleId, UserSession> = {
  prime:       buildSession('Admin Prime',        'prime'),
  director:    buildSession('Director García',    'director'),
  docente:     buildSession('Prof. Rodríguez',    'docente'),
  coordinador: buildSession('Coord. Martínez',    'coordinador'),
  padres:      buildSession('Apoderado López',    'padres'),
  cfo:         buildSession('CFO Torres',         'cfo'),
  estudiante:  buildSession('Estudiante Pérez',   'estudiante'),
  tutor:       buildSession('Tutor Académico',    'tutor'),
}
