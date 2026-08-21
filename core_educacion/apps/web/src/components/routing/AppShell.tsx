/**
 * EDUCACION OS — App Shell (Router-integrated)
 *
 * Layout wrapper rendered for all authenticated routes.
 * Sidebar + Navbar + main content area.
 * Reads location from React Router to sync sidebar active state.
 */

import { useState, lazy, Suspense } from 'react'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import { AIAssistantWidget } from '@/features/demi/AIAssistantWidget'
import { RouteLoader } from '@/components/routing/ProtectedRoute'
import { pathToViewId, viewIdToPath } from '@/lib/routes/routeMap'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))

export default function AppShell() {
  const { session, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [pinned, setPinned] = useState(
    () => localStorage.getItem('sidebar-pinned') !== 'false'
  )

  const togglePin = () =>
    setPinned(p => {
      const next = !p
      localStorage.setItem('sidebar-pinned', String(next))
      return next
    })

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Derive active view from current URL for sidebar highlight
  const activeView = pathToViewId(location.pathname) ?? 'dashboard'

  // Navigate by viewId — sidebar calls this
  const handleNavigate = (viewId: string) => {
    navigate(viewIdToPath(viewId))
  }

  if (!session) return null // ProtectedRoute handles redirect

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{
        width: pinned ? 220 : 52,
        flexShrink: 0,
        position: 'relative',
        transition: 'width 220ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        <Sidebar
          role={session.primaryRole}
          activeView={activeView}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          userName={session.name}
          pinned={pinned}
          onTogglePin={togglePin}
        />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Navbar
          activeView={activeView}
          role={session.primaryRole}
          pinned={pinned}
          onTogglePin={togglePin}
          onNavigate={handleNavigate}
        />
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* DEMI floating widget */}
      {location.pathname !== '/demi' && location.pathname !== '/settings' && (
        <AIAssistantWidget />
      )}
    </div>
  )
}
