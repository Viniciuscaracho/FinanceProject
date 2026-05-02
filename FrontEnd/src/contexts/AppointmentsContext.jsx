import { createContext, useContext, useState, useMemo, useEffect } from 'react'
import { useAppointments, useAppointmentResources } from '@/hooks/useAppointments'
import { getClientName } from '@/utils/appointmentUtils'

const AppointmentsContext = createContext(null)

export function useAppointmentsContext() {
  const ctx = useContext(AppointmentsContext)
  if (!ctx) throw new Error('useAppointmentsContext must be used inside AppointmentsProvider')
  return ctx
}

export function AppointmentsProvider({ children }) {
  const appointmentsData = useAppointments()
  const resourcesData = useAppointmentResources()

  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

  // Dialog / selection state
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset para página 0 sempre que filtros ou busca mudarem
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [searchTerm, appointmentsData.filters])

  // Search normalises phone digits so "11999" matches "(11) 9999…"
  const filteredAppointments = useMemo(() => {
    const apts = appointmentsData.appointments
    if (!searchTerm) return apts
    const q = searchTerm.toLowerCase()
    const qDigits = searchTerm.replace(/\D/g, '')
    return apts.filter((apt) => {
      const name = getClientName(apt)?.toLowerCase() ?? ''
      const phone = apt.client?.whatsapp_number?.replace(/\D/g, '') ?? ''
      return (
        name.includes(q) ||
        (qDigits && phone.includes(qDigits)) ||
        apt.service?.name?.toLowerCase().includes(q) ||
        apt.professional?.name?.toLowerCase().includes(q)
      )
    })
  }, [appointmentsData.appointments, searchTerm])

  const value = {
    // ── Data (from hook / React Query) ────────────────────────────────────────
    ...appointmentsData,
    ...resourcesData,
    filteredAppointments,

    // ── Search ────────────────────────────────────────────────────────────────
    searchTerm,
    setSearchTerm,

    // ── Pagination ────────────────────────────────────────────────────────────
    pagination,
    setPagination: (updater) => {
      setPagination((prev) =>
        typeof updater === 'function' ? updater(prev) : updater
      )
    },

    // ── Dialog / selection ────────────────────────────────────────────────────
    selectedAppointment,
    setSelectedAppointment,
    selectedDate,
    setSelectedDate,
    isFormDialogOpen,
    setIsFormDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isConsultationModalOpen,
    setIsConsultationModalOpen,
    isSubmitting,
    setIsSubmitting,
  }

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  )
}
