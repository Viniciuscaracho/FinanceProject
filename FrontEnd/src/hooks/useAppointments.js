import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../lib/api'
import {
  normalizeAppointments,
  normalizeAppointment,
} from '../utils/appointmentUtils'

// ─── Query-key helpers ────────────────────────────────────────────────────────
export const appointmentsKeys = {
  all: ['appointments'],
  list: (filters) => ['appointments', 'list', filters],
  professionals: ['appointment-professionals'],
  services: ['appointment-services'],
}

function buildApiFilters(filters) {
  const f = {}
  if (filters.status !== 'all') f.status = filters.status
  if (filters.payment_status !== 'all') f.payment_status = filters.payment_status
  if (filters.account_user_id !== 'all') f.account_user_id = filters.account_user_id
  if (filters.start_date) f.start_date = filters.start_date
  if (filters.end_date) f.end_date = filters.end_date
  return f
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useAppointments() {
  const qc = useQueryClient()

  const [filters, setFilters] = useState({
    status: 'all',
    payment_status: 'all',
    account_user_id: 'all',
    start_date: '',
    end_date: '',
  })

  const apiFilters = useMemo(() => buildApiFilters(filters), [filters])

  const { data: appointments = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: appointmentsKeys.list(apiFilters),
    queryFn: async () => {
      const res = await apiService.getAppointments(apiFilters)
      const list = Array.isArray(res) ? res : (res.appointments || [])
      return normalizeAppointments(list)
    },
    staleTime: 2 * 60 * 1000,
  })

  const error = queryError?.message ?? null

  // ── Mutations ───────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiService.updateAppointment(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: appointmentsKeys.list(apiFilters) })
      const prev = qc.getQueryData(appointmentsKeys.list(apiFilters))
      qc.setQueryData(appointmentsKeys.list(apiFilters), (old) =>
        old
          ? old.map((apt) =>
              apt.id === id ? normalizeAppointment({ ...apt, ...data }) : apt
            )
          : old
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(appointmentsKeys.list(apiFilters), ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: appointmentsKeys.all }),
  })

  const createMutation = useMutation({
    mutationFn: (data) => apiService.createAppointment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: appointmentsKeys.all }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => apiService.deleteAppointment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: appointmentsKeys.all }),
  })

  // ── Derived ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    totalRevenue: appointments
      .filter((a) => a.payment_status === 'paid')
      .reduce((sum, a) => sum + (a.price?.cents || 0), 0),
  }), [appointments])

  // ── Public API (keeps same shape as before for AppointmentsCalendar compat) ─
  const loadAppointments = useCallback(() => {
    qc.invalidateQueries({ queryKey: appointmentsKeys.all })
  }, [qc])

  const loadMonth = useCallback(() => {
    qc.invalidateQueries({ queryKey: appointmentsKeys.all })
  }, [qc])

  const updateAppointment = useCallback(
    (id, data) => updateMutation.mutateAsync({ id, data }),
    [updateMutation]
  )

  const createAppointment = useCallback(
    (data) => createMutation.mutateAsync(data),
    [createMutation]
  )

  const deleteAppointment = useCallback(
    (id) => deleteMutation.mutateAsync(id),
    [deleteMutation]
  )

  return {
    appointments,
    loading,
    error,
    filters,
    setFilters,
    loadAppointments,
    loadMonth,
    updateAppointment,
    createAppointment,
    deleteAppointment,
    stats,
  }
}

// ─── Resources hook ───────────────────────────────────────────────────────────
export function useAppointmentResources() {
  const { data: professionals = [], isLoading: profLoading } = useQuery({
    queryKey: appointmentsKeys.professionals,
    queryFn: async () => {
      const res = await apiService.getAppointmentProfessionals()
      return Array.isArray(res) ? res : []
    },
    staleTime: 10 * 60 * 1000,
  })

  const { data: services = [], isLoading: svcLoading } = useQuery({
    queryKey: appointmentsKeys.services,
    queryFn: async () => {
      const res = await apiService.getAppointmentServices()
      return Array.isArray(res) ? res : (res?.services || res?.data || [])
    },
    staleTime: 10 * 60 * 1000,
  })

  return {
    professionals,
    services,
    loading: profLoading || svcLoading,
  }
}
