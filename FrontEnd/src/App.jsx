import { Suspense, lazy } from 'react'
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
import { TermsAcceptanceModal } from './components/TermsAcceptanceModal'
import { Analytics } from './components/Analytics'

const LandingPageNutri       = lazy(() => import('./pages/LandingPageNutri').then(m => ({ default: m.LandingPageNutri })))
const GoogleAuthCallback     = lazy(() => import('./pages/GoogleAuthCallback').then(m => ({ default: m.GoogleAuthCallback })))
const PrivacyPolicy          = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })))
const TermsOfUse             = lazy(() => import('./pages/TermsOfUse').then(m => ({ default: m.TermsOfUse })))
const PublicMealPlan         = lazy(() => import('./pages/PublicMealPlan'))
const NutritionistDirectory  = lazy(() => import('./pages/NutritionistDirectory'))
const NutritionistProfile    = lazy(() => import('./pages/NutritionistProfile'))
const NutritionistNearMe     = lazy(() => import('./pages/NutritionistNearMe'))
const PublicReviewForm       = lazy(() => import('./pages/PublicReviewForm'))
const OgImageTemplate        = lazy(() => import('./pages/OgImageTemplate'))

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

function Root() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <PageSkeleton />
  if (!isAuthenticated) return <LandingPage />
  return (
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
        <Dashboard />
      </Suspense>
    </Layout>
  )
}

function NutriRoot() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <PageSkeleton />
  if (!isAuthenticated) return <LandingPage />
  return (
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
        <Dashboard />
      </Suspense>
    </Layout>
  )
}

function AppContent() {
  const { isAuthenticated, needsTermsAcceptance } = useAuth()

  return (
    <Router>
      <Analytics />
      <Routes>
        {isNutriDomain && <Route path="/" element={<NutriRoot />} />}
        {isNutriDomain && <Route path="/landing" element={<Navigate to="/" replace />} />}
        {isNutriDomain && <Route path="/landing-nutri" element={<Navigate to="/" replace />} />}
        {!isNutriDomain && <Route path="/" element={<Root />} />}
        {!isNutriDomain && <Route path="/landing" element={<Navigate to="/" replace />} />}
        {!isNutriDomain && (
          <Route path="/landing-nutri" element={
            <Suspense fallback={<PageSkeleton />}><LandingPageNutri /></Suspense>
          } />
        )}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/auth/google" element={
          <Suspense fallback={<PageSkeleton />}><GoogleAuthCallback /></Suspense>
        } />
        <Route path="/descobrir" element={
          <Suspense fallback={<PageSkeleton />}><PublicDiscover /></Suspense>
        } />
        <Route path="/descobrir/:id" element={
          <Suspense fallback={<PageSkeleton />}><PublicProfessionalProfile /></Suspense>
        } />

        {/* SEO directory — /nutricionistas/* */}
        <Route path="/nutricionistas/perto-de-mim" element={
          <Suspense fallback={<PageSkeleton />}><NutritionistNearMe /></Suspense>
        } />
        <Route path="/nutricionistas" element={
          <Suspense fallback={<PageSkeleton />}><NutritionistDirectory /></Suspense>
        } />
        <Route path="/nutricionistas/especialidade/:spec" element={
          <Suspense fallback={<PageSkeleton />}><NutritionistDirectory /></Suspense>
        } />
        <Route path="/nutricionistas/:cidade" element={
          <Suspense fallback={<PageSkeleton />}><NutritionistDirectory /></Suspense>
        } />
        <Route path="/nutricionistas/:cidade/:segment" element={
          <Suspense fallback={<PageSkeleton />}><NutritionistDirectory /></Suspense>
        } />
        <Route path="/nutricionista/:slug" element={
          <Suspense fallback={<PageSkeleton />}><NutritionistProfile /></Suspense>
        } />
        <Route path="/avaliar/:id" element={
          <Suspense fallback={<PageSkeleton />}><PublicReviewForm /></Suspense>
        } />
        <Route path="/og/nutricionista/:slug" element={
          <Suspense fallback={null}><OgImageTemplate /></Suspense>
        } />
        <Route path="/agendar/:token" element={
          <Suspense fallback={<PageSkeleton />}><PublicAppointmentBooking /></Suspense>
        } />
        <Route path="/agendar/gerenciar/:manage_token" element={
          <Suspense fallback={<PageSkeleton />}><AppointmentManage /></Suspense>
        } />
        <Route path="/anamnese/responder/:token" element={
          <Suspense fallback={<PageSkeleton />}><PublicAnamneseForm /></Suspense>
        } />
        <Route path="/d/:token" element={
          <Suspense fallback={<PageSkeleton />}><PublicPatientDocument /></Suspense>
        } />
        <Route path="/plano/:token" element={
          <Suspense fallback={<PageSkeleton />}><PublicMealPlan /></Suspense>
        } />
        <Route path="/politica-de-privacidade" element={
          <Suspense fallback={<PageSkeleton />}><PrivacyPolicy /></Suspense>
        } />
        <Route path="/termos-de-uso" element={
          <Suspense fallback={<PageSkeleton />}><TermsOfUse /></Suspense>
        } />

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
      {needsTermsAcceptance && <TermsAcceptanceModal />}
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
