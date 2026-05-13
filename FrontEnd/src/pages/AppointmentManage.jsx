import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { apiService } from '../lib/api'
import { format, parseISO, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  try {
    return format(parseISO(isoStr), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return isoStr
  }
}

function formatDateShort(isoStr) {
  if (!isoStr) return ''
  try {
    return format(parseISO(isoStr), 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

const STATUS_LABELS = {
  pending: 'Aguardando confirmação',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  canceled: 'Cancelado',
  no_show: 'Não compareceu',
}

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  canceled: 'bg-red-100 text-red-800',
  no_show: 'bg-orange-100 text-orange-800',
}

export function AppointmentManage() {
  const { manage_token } = useParams()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('detail') // 'detail' | 'reschedule' | 'done'
  const [doneMessage, setDoneMessage] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState(null)

  // Reschedule state
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.getManageAppointment(manage_token)
      setAppointment(data)
    } catch (e) {
      setError(e.message || 'Agendamento não encontrado.')
    } finally {
      setLoading(false)
    }
  }, [manage_token])

  useEffect(() => { load() }, [load])

  const loadSlots = useCallback(async (date) => {
    if (!appointment?.link_token || !date) return
    setSlotsLoading(true)
    setSlots([])
    setSelectedSlot(null)
    try {
      const data = await apiService.getPublicAvailableSlots(appointment.link_token, {
        professionalId: appointment.professional?.id,
        serviceId: appointment.service?.id,
        date,
        excludeAppointmentId: appointment.id,
      })
      setSlots(data.available_slots || [])
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [appointment])

  useEffect(() => {
    if (selectedDate) loadSlots(selectedDate)
  }, [selectedDate, loadSlots])

  const handleCancel = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return
    setActionLoading(true)
    setActionError(null)
    try {
      await apiService.cancelManageAppointment(manage_token)
      setDoneMessage('Seu agendamento foi cancelado com sucesso.')
      setView('done')
    } catch (e) {
      setActionError(e.message || 'Erro ao cancelar agendamento.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!selectedSlot) return
    setActionLoading(true)
    setActionError(null)
    try {
      const result = await apiService.rescheduleManageAppointment(manage_token, selectedSlot.start_time, selectedSlot.end_time)
      setAppointment(result.appointment)
      setDoneMessage(`Agendamento reagendado para ${formatDateTime(selectedSlot.start_time)}.`)
      setView('done')
    } catch (e) {
      setActionError(e.message || 'Erro ao reagendar.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">😕</div>
          <h1 className="text-lg font-bold text-gray-800 mb-2">Agendamento não encontrado</h1>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (view === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-lg font-bold text-gray-800 mb-2">Pronto!</h1>
          <p className="text-sm text-gray-600">{doneMessage}</p>
        </div>
      </div>
    )
  }

  const statusLabel = STATUS_LABELS[appointment.status] || appointment.status
  const statusColor = STATUS_COLORS[appointment.status] || 'bg-gray-100 text-gray-700'
  const canManage = appointment.can_manage

  if (view === 'reschedule') {
    const today = formatDateShort(new Date().toISOString())
    const deadlineDate = appointment.manage_deadline ? formatDateShort(appointment.manage_deadline) : undefined

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => { setView('detail'); setActionError(null) }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
          >
            ← Voltar
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-1">Reagendar agendamento</h2>
            <p className="text-sm text-gray-500 mb-6">Escolha uma nova data e horário.</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova data</label>
              <input
                type="date"
                min={today}
                max={deadlineDate}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {selectedDate && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Horários disponíveis</p>
                {slotsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhum horário disponível nesta data.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map(slot => (
                      <button
                        key={slot.start_time}
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors ${
                          selectedSlot?.start_time === slot.start_time
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {slot.formatted_time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
                {actionError}
              </div>
            )}

            <button
              onClick={handleReschedule}
              disabled={!selectedSlot || actionLoading}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 text-sm transition-colors"
            >
              {actionLoading ? 'Reagendando...' : 'Confirmar Reagendamento'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-8 text-white text-center">
            <div className="text-4xl mb-3">📅</div>
            <h1 className="text-xl font-bold mb-1">Seu Agendamento</h1>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
              {statusLabel}
            </span>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100">
              {appointment.service && (
                <Row label="Serviço" value={appointment.service.name} />
              )}
              {appointment.professional && (
                <Row label="Profissional" value={appointment.professional.name} />
              )}
              <Row label="Data e horário" value={formatDateTime(appointment.start_time)} />
              {appointment.company_name && (
                <Row label="Local" value={appointment.company_name} />
              )}
              {appointment.google_meet_link && (
                <div className="px-4 py-3 flex items-start gap-3">
                  <span className="text-sm text-gray-500 min-w-[110px]">Reunião</span>
                  <a
                    href={appointment.google_meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 font-medium underline break-all"
                  >
                    Acessar Google Meet
                  </a>
                </div>
              )}
            </div>

            {!canManage && appointment.status !== 'canceled' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                O prazo para gerenciar este agendamento encerrou. Cancelamentos e reagendamentos devem ser feitos com pelo menos {appointment.cancel_reschedule_hours}h de antecedência.
              </div>
            )}

            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {actionError}
              </div>
            )}

            {canManage && (
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => { setView('reschedule'); setActionError(null) }}
                  className="w-full rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 text-sm transition-colors"
                >
                  🔄 Reagendar
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="w-full rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 font-semibold py-3 text-sm transition-colors"
                >
                  {actionLoading ? 'Cancelando...' : '✕ Cancelar agendamento'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <span className="text-sm text-gray-500 min-w-[110px] flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  )
}
