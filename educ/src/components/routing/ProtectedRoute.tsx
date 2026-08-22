/**
 * EDUCACION OS — Protected Route
 *
 * Guards a route against unauthenticated access and missing permissions.
 *
 * Usage:
 *   <ProtectedRoute permission="educa:cursos:view">
 *     <CursosPage />
 *   </ProtectedRoute>
 */

import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@educ/context/AuthContext'
import type { Permission } from '@educ/lib/rbac/permissions'
import { getModule } from '@educ/lib/modules/registry'
import { pathToViewId } from '@educ/lib/routes/routeMap'

// ─── Access Denied Screen ────────────────────────────────────────────────────

function AccessDeniedScreen({ permission }: { permission?: Permission }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', width: '100%',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 40 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 28,
        }}>🔒</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--tx)', marginBottom: 8 }}>
          Acceso Restringido
        </h2>
        <p style={{ fontSize: 14, color: 'var(--tx-2)', marginBottom: 16 }}>
          No tienes los permisos necesarios para acceder a este módulo.
        </p>
        {permission && (
          <code style={{
            fontSize: 11, color: 'var(--tx-3)',
            background: 'var(--s3)', borderRadius: 4,
            padding: '4px 8px',
          }}>
            Permiso requerido: {permission}
          </code>
        )}
      </div>
    </div>
  )
}

// ─── Not Found Screen ─────────────────────────────────────────────────────────

export function NotFoundScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', width: '100%',
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 64, fontWeight: 800, color: 'var(--tx-3)', lineHeight: 1 }}>404</p>
        <p style={{ fontSize: 16, color: 'var(--tx-2)', marginTop: 8 }}>
          Ruta no encontrada
        </p>
      </div>
    </div>
  )
}

// ─── Route Loader ─────────────────────────────────────────────────────────────

export function RouteLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', width: '100%',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid var(--blue)', borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
        }} />
        <p style={{ fontSize: 13, color: 'var(--tx-3)' }}>Cargando módulo…</p>
      </div>
    </div>
  )
}

// ─── Protected Route ─────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  children: ReactNode
  /** Optional explicit permission. If omitted, auto-resolved from URL path. */
  permission?: Permission
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { session, can, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    // Retornamos un fondo oscuro liso sin spinner para evitar "parpadeos" molestos
    // ya que la carga suele tomar solo unos pocos milisegundos.
    return <div className="min-h-screen bg-[#090909]" />;
  }

  // Not authenticated → send to login, preserving the intended destination
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Resolve permission from module registry if not explicitly provided
  const resolvedPermission: Permission | undefined =
    permission ??
    (() => {
      const viewId = pathToViewId(location.pathname)
      if (!viewId) return undefined
      return getModule(viewId)?.permission
    })()

  // Check permission
  if (resolvedPermission && !can(resolvedPermission)) {
    return <AccessDeniedScreen permission={resolvedPermission} />
  }

  return <>{children}</>
}
