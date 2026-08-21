/**
 * EDUCACION OS — App Root
 *
 * Minimal mount point. All routing/layout/auth is handled
 * inside AppRouter → AppShell → ProtectedRoute chain.
 */
import AppRouter from '@/AppRouter'

export default function App() {
  return <AppRouter />
}
