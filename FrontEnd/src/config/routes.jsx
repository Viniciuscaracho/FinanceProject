import { lazy } from 'react'

// Public pages - carregam imediatamente
export { LandingPage } from '../pages/LandingPage'
export { PublicAppointmentBooking } from '../pages/PublicAppointmentBooking'
export { AppointmentManage } from '../pages/AppointmentManage'
export { PublicDiscover } from '../pages/PublicDiscover'
export { PublicProfessionalProfile } from '../pages/PublicProfessionalProfile'
export { PublicAnamneseForm } from '../pages/PublicAnamneseForm'
export { PublicPatientDocument } from '../pages/PublicPatientDocument'

// Protected pages - lazy loaded
export const Dashboard = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })))
export const Transactions = lazy(() => import('../pages/Transactions').then(m => ({ default: m.Transactions })))
export const Contacts = lazy(() => import('../pages/Contacts').then(m => ({ default: m.Contacts })))
export const Appointments = lazy(() => import('../pages/Appointments').then(m => ({ default: m.Appointments })))
export const FinancialReports = lazy(() => import('../pages/FinancialReports').then(m => ({ default: m.FinancialReports })))
export const DocumentTemplates = lazy(() => import('../pages/DocumentTemplates').then(m => ({ default: m.DocumentTemplates })))
export const DocumentTemplateForm = lazy(() => import('../pages/DocumentTemplateForm').then(m => ({ default: m.DocumentTemplateForm })))
export const Commissions = lazy(() => import('../pages/Commissions').then(m => ({ default: m.Commissions })))
export const Professionals = lazy(() => import('../pages/Professionals').then(m => ({ default: m.Professionals })))
export const Services = lazy(() => import('../pages/Services').then(m => ({ default: m.Services })))
export const WorkingHours = lazy(() => import('../pages/WorkingHours').then(m => ({ default: m.WorkingHours })))
export const Imports = lazy(() => import('../pages/Imports').then(m => ({ default: m.Imports })))
export const AppointmentLinks = lazy(() => import('../pages/AppointmentLinks').then(m => ({ default: m.AppointmentLinks })))
export const AppointmentNotes = lazy(() => import('../pages/AppointmentNotes').then(m => ({ default: m.AppointmentNotes })))
export const Subscription = lazy(() => import('../pages/Subscription').then(m => ({ default: m.Subscription })))
export const Admin = lazy(() => import('../pages/Admin').then(m => ({ default: m.Admin })))
export const AdminAccountDetails = lazy(() => import('../pages/AdminAccountDetails').then(m => ({ default: m.AdminAccountDetails })))
export const Profile = lazy(() => import('../pages/Profile').then(m => ({ default: m.Profile })))
export const Settings = lazy(() => import('../pages/Settings').then(m => ({ default: m.Settings })))
export const CompanySettings = lazy(() => import('../pages/CompanySettings').then(m => ({ default: m.CompanySettings })))
export const Vitrine = lazy(() => import('../pages/Vitrine').then(m => ({ default: m.Vitrine })))
export const AnamneseTemplates = lazy(() => import('../pages/AnamneseTemplates').then(m => ({ default: m.AnamneseTemplates })))
export const PatientProfile = lazy(() => import('../pages/PatientProfile').then(m => ({ default: m.PatientProfile })))
export const MealPlanBuilder = lazy(() => import('../pages/MealPlanBuilder'))

export const protectedRoutes = [
  { path: '/',                              element: Dashboard },
  { path: '/transactions',                  element: Transactions },
  { path: '/contacts',                      element: Contacts },
  { path: '/contacts/:id',                  element: PatientProfile },
  { path: '/contacts/:contactId/meal-plans/:planId', element: MealPlanBuilder },
  { path: '/appointments',                  element: Appointments },
  { path: '/appointment-links',             element: AppointmentLinks },
  { path: '/appointment-notes',             element: AppointmentNotes },
  { path: '/professionals',                 element: Professionals },
  { path: '/services',                      element: Services },
  { path: '/working-hours',                 element: WorkingHours },
  { path: '/reports',                       element: FinancialReports },
  { path: '/commissions',                   element: Commissions },
  { path: '/imports',                       element: Imports },
  { path: '/document-templates',            element: DocumentTemplates },
  { path: '/document-templates/:type/new',  element: DocumentTemplateForm },
  { path: '/document-templates/:type/:id/edit', element: DocumentTemplateForm },
  { path: '/subscription',                  element: Subscription },
  { path: '/admin',                         element: Admin },
  { path: '/admin/accounts/:id',            element: AdminAccountDetails },
  { path: '/profile',                       element: Profile },
  { path: '/settings',                      element: Settings },
  { path: '/company-settings',              element: CompanySettings },
  { path: '/vitrine',                       element: Vitrine },
  { path: '/anamnese',                      element: AnamneseTemplates },
  {
    path: '/reconciliations',
    element: lazy(() => Promise.resolve({
      default: () => (
        <div className="p-8 text-center text-gray-500">Página de Conciliações em desenvolvimento</div>
      )
    }))
  },
]
