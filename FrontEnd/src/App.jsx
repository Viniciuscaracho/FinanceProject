import { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { BankAccountProvider } from './contexts/BankAccountContext'
import { queryClient } from './lib/queryClient'
import { Layout } from './components/layout/Layout'
import { Login } from './components/Login'
import { Toaster } from './components/ui/sonner'
import { ModalProvider } from './components/ui/enhanced-modal'
import { CommandPaletteProvider } from './contexts/CommandPaletteContext'
import ErrorBoundary from './components/ErrorBoundary'
import { PageSkeleton } from './components/Skeleton'
import { LandingPage, Dashboard, PublicAppointmentBooking, AppointmentManage, PublicDiscover, PublicProfessionalProfile, PublicAnamneseForm, PublicPatientDocument, protectedRoutes } from './config/routes'
import PublicMealPlan from './pages/PublicMealPlan'
import { LandingPageNutri } from './pages/LandingPageNutri'

const isNutriDomain = window.location.hostname.includes('orbinutri')
import './App.css'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, error } = useAuth()

  if (loading) return <PageSkeleton />

  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Erro de Conexão</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return children
}

function NutriRoot() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <PageSkeleton />
  if (!isAuthenticated) return <LandingPageNutri />
  return (
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
        <Dashboard />
      </Suspense>
    </Layout>
  )
}

function AppContent() {
  const { isAuthenticated } = useAuth()

  return (
    <Router>
      <Routes>
        {isNutriDomain && <Route path="/" element={<NutriRoot />} />}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/landing-nutri" element={<LandingPageNutri />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/descobrir" element={<PublicDiscover />} />
        <Route path="/descobrir/:id" element={<PublicProfessionalProfile />} />
        <Route path="/agendar/:token" element={<PublicAppointmentBooking />} />
        <Route path="/agendar/gerenciar/:manage_token" element={<AppointmentManage />} />
        <Route path="/anamnese/responder/:token" element={<PublicAnamneseForm />} />
        <Route path="/d/:token" element={<PublicPatientDocument />} />
        <Route path="/plano/:token" element={<PublicMealPlan />} />

        {protectedRoutes.map(({ path, element: Page }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageSkeleton />}>
                    <Page />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
        ))}
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <BankAccountProvider>
                <CommandPaletteProvider>
                <ModalProvider>
                  <AppContent />
                  <Toaster />
                </ModalProvider>
              </CommandPaletteProvider>
              </BankAccountProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </HelmetProvider>
  )
}

export default App
