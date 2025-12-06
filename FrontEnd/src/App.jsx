import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { BankAccountProvider } from './contexts/BankAccountContext'
import { queryClient } from './lib/queryClient'
import { Layout } from './components/layout/Layout'
import { Login } from './components/Login'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { Contacts } from './pages/Contacts'
import { Appointments } from './pages/Appointments'
import { FinancialReports } from './pages/FinancialReports'
import { Professionals } from './pages/Professionals'
import { Services } from './pages/Services'
import { WorkingHours } from './pages/WorkingHours'
import { Imports } from './pages/Imports'
import { PublicAppointmentBooking } from './pages/PublicAppointmentBooking'
import { AppointmentLinks } from './pages/AppointmentLinks'
import { LandingPage } from './pages/LandingPage'
import { Subscription } from './pages/Subscription'
import { Admin } from './pages/Admin'
import { AdminAccountDetails } from './pages/AdminAccountDetails'
import { Profile } from './pages/Profile'
import { Settings } from './pages/Settings'
import { CompanySettings } from './pages/CompanySettings'
import { Toaster } from './components/ui/sonner'
import './App.css'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/agendar/:token" element={<PublicAppointmentBooking />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/transactions" element={
          <ProtectedRoute>
            <Layout>
              <Transactions />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/contacts" element={
          <ProtectedRoute>
            <Layout>
              <Contacts />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/appointments" element={
          <ProtectedRoute>
            <Layout>
              <Appointments />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/appointment-links" element={
          <ProtectedRoute>
            <Layout>
              <AppointmentLinks />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/professionals" element={
          <ProtectedRoute>
            <Layout>
              <Professionals />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/services" element={
          <ProtectedRoute>
            <Layout>
              <Services />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/working-hours" element={
          <ProtectedRoute>
            <Layout>
              <WorkingHours />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Layout>
              <FinancialReports />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/imports" element={
          <ProtectedRoute>
            <Layout>
              <Imports />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/subscription" element={
          <ProtectedRoute>
            <Layout>
              <Subscription />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reconciliations" element={
          <ProtectedRoute>
            <Layout>
              <div className="p-8 text-center text-gray-500">Página de Conciliações em desenvolvimento</div>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/accounts/:id" element={
          <ProtectedRoute>
            <Layout>
              <AdminAccountDetails />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <Layout>
              <Admin />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/company-settings" element={
          <ProtectedRoute>
            <Layout>
              <CompanySettings />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BankAccountProvider>
            <AppContent />
            <Toaster />
          </BankAccountProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App

