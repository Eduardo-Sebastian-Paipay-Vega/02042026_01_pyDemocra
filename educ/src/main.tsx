import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SettingsProvider } from '@/core/context/SettingsContext'
import { AuthProvider } from './context/AuthContext'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'

document.title = 'democra.pro · EduOS'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
