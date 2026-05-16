import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Loader2, Clock, User, CheckCircle2, ChevronLeft, ChevronRight,
  Video, Copy, Repeat, ArrowLeft, MapPin, Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiService } from '../lib/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const RECURRENCE_OPTIONS = [
  { value: 'weekly',     label: 'Semanal' },
  { value: 'biweekly',  label: 'Quinzenal' },
  { value: 'monthly',   label: 'Mensal' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual',label: 'Semestral' },
  { value: 'annual',    label: 'Anual' },
  { value: 'daily',     label: 'Diário' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatDateShort(date) {
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ companyInfo, selectedService, selectedProfessional, selectedSlot, onBack, step }) {
  return (
    <div style={{
      borderRight: '1px solid #E5E7EB',
      padding: '36px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      background: '#FAFAFA',
      minHeight: '100%',
    }}>
      {/* Back */}
      {step > 1 && (
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 28, width: 'fit-content' }}
          onMouseEnter={e => e.currentTarget.style.color = '#111827'}
          onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
        >
          <ArrowLeft size={15} /> Voltar
        </button>
      )}

      {/* Company */}
      {companyInfo && Object.keys(companyInfo).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#4F46E5' }}>
              {(companyInfo.name || 'C').charAt(0).toUpperCase()}
            </span>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
            Agendamento com
          </p>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
            {companyInfo.name}
          </p>
          {companyInfo.email && (
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{companyInfo.email}</p>
          )}
        </div>
      )}

      {/* Separator */}
      {selectedService && <div style={{ height: 1, background: '#E5E7EB', marginBottom: 20 }} />}

      {/* Service */}
      {selectedService && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
            {selectedService.name}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {selectedService.duration_minutes && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6B7280' }}>
                <Clock size={14} style={{ flexShrink: 0 }} />
                {selectedService.duration_minutes} minutos
              </div>
            )}
            {selectedService.price?.formatted && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#059669', fontWeight: 600 }}>
                <span style={{ fontSize: 14 }}>R$</span>
                {selectedService.price.formatted}
              </div>
            )}
            {selectedService.description && (
              <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.5, marginTop: 2 }}>
                {selectedService.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Professional (after selection) */}
      {selectedProfessional && (
        <>
          <div style={{ height: 1, background: '#E5E7EB', marginBottom: 16 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#4F46E5' }}>
                {selectedProfessional.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 1 }}>Profissional</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{selectedProfessional.name}</p>
            </div>
          </div>
        </>
      )}

      {/* Selected date + time */}
      {selectedSlot && (
        <>
          <div style={{ height: 1, background: '#E5E7EB', marginBottom: 16 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
              <Calendar size={14} style={{ color: '#4F46E5', flexShrink: 0 }} />
              {formatDate(new Date(selectedSlot.start_time))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
              <Clock size={14} style={{ color: '#4F46E5', flexShrink: 0 }} />
              {formatTime(selectedSlot.start_time)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── MobileHeader ─────────────────────────────────────────────────────────────

function MobileHeader({ companyInfo, selectedService, selectedProfessional, onBack, step }) {
  return (
    <div style={{ borderBottom: '1px solid #E5E7EB', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, background: '#fff' }}>
      {step > 1 && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {companyInfo?.name || 'Agendamento'}
        </p>
        {selectedService && (
          <p style={{ fontSize: 12, color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedService.name}{selectedProfessional ? ` · ${selectedProfessional.name}` : ''}
          </p>
        )}
      </div>
      {/* Step pills */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ width: 8, height: 8, borderRadius: '50%', background: step >= s ? '#4F46E5' : '#E5E7EB' }} />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PublicAppointmentBooking() {
  const { token } = useParams()
  const isMobile = useIsMobile()

  // ── Data state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [services, setServices] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [professionalSlots, setProfessionalSlots] = useState({})
  const [loadingSlots, setLoadingSlots] = useState({})
  const [linkConfig, setLinkConfig] = useState({ days_ahead: 15 })
  const [companyInfo, setCompanyInfo] = useState(null)

  // ── Selection state ─────────────────────────────────────────────────────────
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedProfessional, setSelectedProfessional] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // ── Client info ─────────────────────────────────────────────────────────────
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [intakeAnswers, setIntakeAnswers] = useState({})

  // ── Anamnese ────────────────────────────────────────────────────────────────
  const [anamneseAnswers, setAnamneseAnswers] = useState({})

  // ── Online / recurrence ─────────────────────────────────────────────────────
  const [googleMeetLink, setGoogleMeetLink] = useState('')
  const [meetLinkCopied, setMeetLinkCopied] = useState(false)
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('weekly')
  const [recurrenceOccurrences, setRecurrenceOccurrences] = useState(4)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')

  // ── Result ──────────────────────────────────────────────────────────────────
  const [appointmentResult, setAppointmentResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  // ── Calendar wheel block ────────────────────────────────────────────────────
  const calendarRef = useRef(null)
  useEffect(() => {
    const el = calendarRef.current
    if (!el) return
    const block = (e) => { e.preventDefault(); e.stopPropagation() }
    el.addEventListener('wheel', block, { passive: false })
    return () => el.removeEventListener('wheel', block)
  }, [])

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => { loadInitialData() }, [token])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      const { services: svcs, professionals: profs, config, company } =
        await apiService.getPublicAppointmentFull(token).catch(() => ({
          services: [], professionals: [], config: { days_ahead: 15 }, company: null,
        }))
      setServices(svcs)
      setProfessionals(profs)
      setLinkConfig(config)
      setCompanyInfo(company || null)

      if (svcs.length === 1) {
        setSelectedService(svcs[0])
        setStep(2)
      } else if (svcs.length === 0) {
        setStep(2)
      } else {
        setStep(1)
      }

      // Auto-select single professional
      if (profs.length === 1) setSelectedProfessional(profs[0])
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // ── Slot loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedProfessional && selectedDate) {
      loadSlots(selectedProfessional.id, selectedDate)
    }
  }, [selectedProfessional, selectedDate, selectedService])

  const loadSlots = async (profId, date) => {
    const dateStr = date.toISOString().split('T')[0]
    if (professionalSlots[profId]?.[dateStr]) return
    try {
      setLoadingSlots(prev => ({ ...prev, [profId]: true }))
      const result = await apiService.getPublicAvailableSlots(token, {
        professionalId: profId,
        date: dateStr,
        serviceId: selectedService?.id,
      })
      setProfessionalSlots(prev => ({
        ...prev,
        [profId]: { ...(prev[profId] || {}), [dateStr]: result.available_slots || [] },
      }))
    } catch {
      setProfessionalSlots(prev => ({
        ...prev,
        [profId]: { ...(prev[profId] || {}), [dateStr]: [] },
      }))
    } finally {
      setLoadingSlots(prev => ({ ...prev, [profId]: false }))
    }
  }

  // ── Calendar helpers ────────────────────────────────────────────────────────
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const maxDate = new Date(today)
    maxDate.setDate(today.getDate() + (linkConfig.days_ahead || 15))
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d))
    return { days, maxDate, today }
  }

  const isValidGoogleMeetLink = (link) => {
    if (!link) return false
    return /^https:\/\/meet\.google\.com\/[A-Za-z0-9]{3}-[A-Za-z0-9]{4}-[A-Za-z0-9]{3}(?:\?[^\s]*)?$/.test(link.trim())
  }

  const isOnlineService = linkConfig?.enable_google_meet === true ||
    selectedService?.auto_meet === true ||
    selectedService?.modality === 'online'

  // ── Handlers ────────────────────────────────────────────────────────────────
  const selectService = (service) => {
    setSelectedService(service)
    setSelectedProfessional(professionals.length === 1 ? professionals[0] : null)
    setSelectedDate(null)
    setSelectedSlot(null)
    setStep(2)
  }

  const selectProfessional = (prof) => {
    setSelectedProfessional(prof)
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  const selectDate = (date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  const selectSlot = (slot) => {
    setSelectedSlot(slot)
    // Auto-advance to step 3 after brief visual feedback
    setTimeout(() => setStep(3), 220)
  }

  const goBack = () => {
    if (step === 3) { setStep(2); setSelectedSlot(null); setFormError(null) }
    else if (step === 2 && services.length > 1) { setStep(1); setSelectedService(null) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = clientName.trim()
    const phone = clientPhone.trim()
    const phoneDigits = phone.replace(/\D/g, '')

    const missing = []
    if (!name) missing.push('Nome completo')
    if (!phone) missing.push('WhatsApp')
    if (phoneDigits.length < 10) missing.push('WhatsApp válido com DDD')
    if (isOnlineService && !isValidGoogleMeetLink(googleMeetLink)) missing.push('Link do Google Meet')
    const intakeQs = linkConfig?.intake_form || []
    for (const q of intakeQs) {
      if (q.required && !intakeAnswers[q.id]) missing.push(q.question || 'Pergunta obrigatória')
    }
    const anamneseFields = linkConfig?.anamnese_template?.fields || []
    for (const f of anamneseFields) {
      if (f.required && !anamneseAnswers[f.id || f.label]) missing.push(f.label || 'Campo obrigatório da anamnese')
    }

    if (missing.length) { setFormError(`Preencha: ${missing.join(', ')}`); return }

    try {
      setSubmitting(true)
      setFormError(null)
      const data = {
        service_id: selectedService?.id,
        account_user_id: selectedProfessional?.id,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        whatsapp_number: phoneDigits,
        client_name: name,
        client_email: clientEmail.trim() || null,
        notes: notes.trim() || null,
        intake_responses: Object.keys(intakeAnswers).length > 0 ? intakeAnswers : undefined,
      }
      if (googleMeetLink.trim()) data.google_meet_link = googleMeetLink.trim()
      if (isOnlineService) data.enable_google_meet = true
      if (recurrenceEnabled) {
        const occ = Math.min(Math.max(parseInt(recurrenceOccurrences) || 1, 1), 24)
        data.recurrence_pattern = {
          frequency: recurrenceFrequency,
          occurrences: occ,
          ...(recurrenceEndDate ? { end_date: recurrenceEndDate } : {}),
        }
      }
      const result = await apiService.createPublicAppointment(token, data)
      if (result.success) {
        const manageToken = result.appointment?.manage_token || result.manage_token
        if (manageToken && Object.keys(anamneseAnswers).length > 0) {
          const templateId = linkConfig?.anamnese_template?.id
          await apiService.submitPublicAnamnese(manageToken, {
            anamnese_template_id: templateId,
            responses: anamneseAnswers,
          }).catch(() => {})
        }
        setAppointmentResult(result)
        setStep(4)
      } else {
        setFormError(result.errors?.join(', ') || result.error || 'Erro ao criar agendamento')
      }
    } catch (err) {
      const msg = err.errors?.join(', ') || err.data?.errors?.join(', ') || err.data?.error || err.message || 'Erro ao criar agendamento'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <Loader2 size={36} style={{ color: '#4F46E5', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (error && step === 1) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#EF4444', marginBottom: 16 }}>{error}</p>
          <Button onClick={loadInitialData}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  // ── Step 4: Success ─────────────────────────────────────────────────────────
  if (step === 4) {
    const meetLink = appointmentResult?.google_meet_link || appointmentResult?.appointment?.google_meet_link
    const manageToken = appointmentResult?.appointment?.manage_token || appointmentResult?.manage_token
    const recurrenceSummary = appointmentResult?.recurrence
    const whatsappNumber = appointmentResult?.appointment?.company_whatsapp || appointmentResult?.company_whatsapp
    const hasAnamnese = !!(appointmentResult?.appointment?.anamnese_template_id && manageToken && Object.keys(anamneseAnswers).length === 0)

    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          {/* Icon */}
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={40} style={{ color: '#059669' }} strokeWidth={2} />
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: 8 }}>
            Agendamento confirmado!
          </h1>
          <p style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 32 }}>
            Você receberá uma confirmação em breve.
          </p>

          {/* Summary card */}
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
            {[
              selectedService && { label: 'Serviço', value: selectedService.name },
              selectedProfessional && { label: 'Profissional', value: selectedProfessional.name },
              selectedSlot && { label: 'Data', value: formatDate(new Date(selectedSlot.start_time)) },
              selectedSlot && { label: 'Horário', value: formatTime(selectedSlot.start_time) },
              recurrenceSummary?.count && { label: 'Recorrência', value: `${recurrenceSummary.count}x ${recurrenceSummary.frequency}` },
            ].filter(Boolean).map((row, i, arr) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <span style={{ fontSize: 14, color: '#9CA3AF' }}>{row.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Meet link */}
          {meetLink && (
            <div style={{ border: '1px solid #A7F3D0', background: '#ECFDF5', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Video size={18} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#065F46', marginBottom: 4 }}>Atendimento online</p>
                <p style={{ fontSize: 12, color: '#047857', wordBreak: 'break-all' }}>{meetLink}</p>
                <button
                  onClick={() => window.open(meetLink, '_blank')}
                  style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  Entrar no Google Meet →
                </button>
              </div>
            </div>
          )}

          {/* Manage link */}
          {manageToken && (
            <div style={{ border: '1px solid #C7D2FE', background: '#EEF2FF', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Calendar size={18} style={{ color: '#4F46E5', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#3730A3', marginBottom: 2 }}>Precisa cancelar ou reagendar?</p>
                <a
                  href={`/agendar/gerenciar/${manageToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'underline' }}
                >
                  Gerenciar agendamento →
                </a>
              </div>
            </div>
          )}

          {/* Anamnese link */}
          {hasAnamnese && (
            <div style={{ border: '1px solid #D8B4FE', background: '#F5F3FF', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>📋</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#5B21B6', marginBottom: 2 }}>Preencha sua anamnese</p>
                <p style={{ fontSize: 12, color: '#7C3AED', marginBottom: 8 }}>
                  O profissional precisa dessas informações para preparar o seu atendimento.
                </p>
                <a
                  href={`/anamnese/responder/${manageToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', fontSize: 13, fontWeight: 600, color: '#fff', background: '#7C3AED', padding: '7px 16px', borderRadius: 8, textDecoration: 'none' }}
                >
                  Preencher agora →
                </a>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {whatsappNumber && (
              <button
                onClick={() => {
                  const msg = encodeURIComponent(
                    `Olá! Confirmei meu agendamento:\n\n` +
                    `📅 ${selectedService?.name || 'Serviço'}\n` +
                    `👤 ${selectedProfessional?.name || ''}\n` +
                    `📆 ${selectedSlot ? formatDate(new Date(selectedSlot.start_time)) : ''} às ${selectedSlot ? formatTime(selectedSlot.start_time) : ''}`
                  )
                  window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, '_blank')
                }}
                style={{ width: '100%', padding: '12px 20px', borderRadius: 10, background: '#25D366', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                Falar no WhatsApp
              </button>
            )}
            <button
              onClick={() => {
                setStep(1); setSelectedService(null); setSelectedProfessional(null)
                setSelectedDate(null); setSelectedSlot(null); setClientName(''); setClientPhone('')
                setClientEmail(''); setNotes(''); setAppointmentResult(null); setIntakeAnswers({})
                setAnamneseAnswers({}); setRecurrenceEnabled(false); setGoogleMeetLink('')
                if (services.length === 1) { setSelectedService(services[0]); setStep(2) }
              }}
              style={{ width: '100%', padding: '12px 20px', borderRadius: 10, background: 'transparent', color: '#6B7280', fontWeight: 500, fontSize: 14, border: '1px solid #E5E7EB', cursor: 'pointer' }}
            >
              Fazer novo agendamento
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Steps 1–3: Two-column layout ───────────────────────────────────────────
  const { days, maxDate, today } = getDaysInMonth()
  const dateStr = selectedDate?.toISOString().split('T')[0]
  const slots = selectedProfessional ? (professionalSlots[selectedProfessional.id]?.[dateStr] || []) : []
  const isLoadingSlots = selectedProfessional ? !!loadingSlots[selectedProfessional.id] : false

  return (
    <div style={{ minHeight: '100vh', background: '#fff', colorScheme: 'light' }}>
      {/* Mobile header */}
      {isMobile && (
        <MobileHeader
          companyInfo={companyInfo}
          selectedService={selectedService}
          selectedProfessional={selectedProfessional}
          onBack={goBack}
          step={step}
        />
      )}

      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        minHeight: isMobile ? 'auto' : '100vh',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '280px 1fr',
      }}>
        {/* Left sidebar */}
        {!isMobile && (
          <Sidebar
            companyInfo={companyInfo}
            selectedService={selectedService}
            selectedProfessional={selectedProfessional}
            selectedSlot={selectedSlot}
            onBack={goBack}
            step={step}
          />
        )}

        {/* Right content */}
        <div style={{ padding: isMobile ? '28px 20px' : '40px 48px' }}>

          {/* ── Step 1: Service selection ─────────────────────────────────── */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                Selecione o serviço
              </h2>
              <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 28 }}>
                Escolha o tipo de atendimento que deseja agendar
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => selectService(service)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
                      border: '1px solid #E5E7EB', borderRadius: 12, background: '#fff',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.background = '#FAFBFF' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#fff' }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#4F46E5' }}>
                        {service.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 2 }}>{service.name}</p>
                      {service.description && (
                        <p style={{ fontSize: 13, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.description}</p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {service.price?.formatted && (
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#059669' }}>{service.price.formatted}</p>
                      )}
                      {service.duration_minutes && (
                        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{service.duration_minutes} min</p>
                      )}
                    </div>
                    <ChevronRight size={18} style={{ color: '#D1D5DB', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Pick a time ───────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                Selecione um horário
              </h2>
              <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 28 }}>
                Escolha a data e o horário que funcionam para você
              </p>

              {/* Professional pills (only if multiple) */}
              {professionals.length > 1 && (
                <div style={{ marginBottom: 28 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                    Profissional
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {professionals.map(prof => {
                      const isSelected = selectedProfessional?.id === prof.id
                      return (
                        <button
                          key={prof.id}
                          onClick={() => selectProfessional(prof)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 16px', borderRadius: 100,
                            border: `2px solid ${isSelected ? '#4F46E5' : '#E5E7EB'}`,
                            background: isSelected ? '#EEF2FF' : '#fff',
                            color: isSelected ? '#4F46E5' : '#374151',
                            fontWeight: isSelected ? 700 : 400,
                            fontSize: 14, cursor: 'pointer', transition: 'all 150ms',
                          }}
                        >
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: isSelected ? '#4F46E5' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: isSelected ? '#fff' : '#6B7280', flexShrink: 0 }}>
                            {prof.name?.charAt(0)?.toUpperCase()}
                          </div>
                          {prof.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {!selectedProfessional && professionals.length > 1 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF', fontSize: 14 }}>
                  Selecione um profissional para ver os horários disponíveis
                </div>
              )}

              {(selectedProfessional || professionals.length <= 1) && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: selectedDate && !isMobile ? '1fr 1fr' : '1fr',
                  gap: 32,
                  alignItems: 'start',
                }}>
                  {/* Calendar */}
                  <div ref={calendarRef}>
                    {/* Month navigation */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <button
                        onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                        style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
                        {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </span>
                      <button
                        onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                        style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Day headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
                      {WEEK_DAYS.map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9CA3AF', padding: '4px 0', letterSpacing: '0.03em' }}>
                          {d.charAt(0)}
                        </div>
                      ))}
                    </div>

                    {/* Day cells */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                      {days.map((date, idx) => {
                        if (!date) return <div key={idx} />
                        const d = new Date(date); d.setHours(0, 0, 0, 0)
                        const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
                        const isPast = d < today
                        const isFuture = d > maxDate
                        const isToday = d.toDateString() === today.toDateString()
                        const isDisabled = isPast || isFuture

                        return (
                          <button
                            key={idx}
                            onClick={() => !isDisabled && selectDate(date)}
                            disabled={isDisabled}
                            style={{
                              aspectRatio: '1',
                              borderRadius: '50%',
                              border: 'none',
                              background: isSelected ? '#4F46E5' : 'transparent',
                              color: isSelected ? '#fff' : isDisabled ? '#D1D5DB' : '#111827',
                              fontWeight: isSelected ? 700 : isToday ? 700 : 400,
                              fontSize: 13,
                              cursor: isDisabled ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              position: 'relative',
                              transition: 'all 120ms',
                              outline: isToday && !isSelected ? '2px solid #4F46E5' : 'none',
                              outlineOffset: -2,
                            }}
                            onMouseEnter={e => { if (!isDisabled && !isSelected) e.currentTarget.style.background = '#EEF2FF' }}
                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                          >
                            {date.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Slots column */}
                  {selectedDate && (
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>
                        {formatDate(selectedDate)}
                      </p>
                      {isLoadingSlots ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                          <Loader2 size={24} style={{ color: '#4F46E5', animation: 'spin 1s linear infinite' }} />
                        </div>
                      ) : slots.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                          <p style={{ fontSize: 14, color: '#9CA3AF' }}>Sem horários disponíveis</p>
                          <p style={{ fontSize: 12, color: '#D1D5DB', marginTop: 4 }}>Tente outra data</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                          {slots.map(slot => (
                            <button
                              key={slot.start_time}
                              onClick={() => selectSlot(slot)}
                              style={{
                                padding: '13px 18px',
                                borderRadius: 10,
                                border: '1px solid #E5E7EB',
                                background: '#fff',
                                color: '#111827',
                                fontWeight: 600,
                                fontSize: 15,
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 130ms',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.color = '#4F46E5'; e.currentTarget.style.background = '#EEF2FF' }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#111827'; e.currentTarget.style.background = '#fff' }}
                            >
                              {formatTime(slot.start_time)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {!selectedDate && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, color: '#9CA3AF', fontSize: 14 }}>
                      ← Selecione uma data
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Your details ─────────────────────────────────────── */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                Seus dados
              </h2>
              <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 28 }}>
                Preencha suas informações para confirmar o agendamento
              </p>

              {/* Mobile summary (no sidebar on mobile) */}
              {isMobile && selectedSlot && (
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px', marginBottom: 24, background: '#FAFAFA' }}>
                  {selectedService && (
                    <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 6 }}>{selectedService.name}</p>
                  )}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {selectedProfessional && (
                      <span style={{ fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <User size={13} /> {selectedProfessional.name}
                      </span>
                    )}
                    <span style={{ fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Calendar size={13} /> {formatDateShort(new Date(selectedSlot.start_time))}
                    </span>
                    <span style={{ fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={13} /> {formatTime(selectedSlot.start_time)}
                    </span>
                  </div>
                </div>
              )}

              {/* Online service: Meet link */}
              {isOnlineService && (
                <div style={{ border: '1px solid #C7D2FE', background: '#EEF2FF', borderRadius: 12, padding: '16px 18px', marginBottom: 24 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                    <Video size={18} style={{ color: '#4F46E5', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: '#3730A3', marginBottom: 2 }}>Atendimento online</p>
                      <p style={{ fontSize: 12, color: '#4F46E5' }}>Gere um link no Google Meet e cole abaixo.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
                    <button type="button" onClick={() => window.open('https://meet.google.com/new', '_blank', 'noopener')} style={{ fontSize: 13, fontWeight: 600, color: '#4F46E5', background: '#fff', border: '1px solid #C7D2FE', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Gerar link no Meet
                    </button>
                    <input
                      type="text"
                      value={googleMeetLink}
                      onChange={e => { setGoogleMeetLink(e.target.value); setFormError(null) }}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid #C7D2FE', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}
                    />
                  </div>
                  {googleMeetLink && !isValidGoogleMeetLink(googleMeetLink) && (
                    <p style={{ fontSize: 12, color: '#EF4444', marginTop: 6 }}>Formato inválido. Use: https://meet.google.com/xxx-xxxx-xxx</p>
                  )}
                </div>
              )}

              {/* Form fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 440 }}>
                <div>
                  <Label htmlFor="cf-name">Nome completo *</Label>
                  <Input id="cf-name" value={clientName} onChange={e => { setClientName(e.target.value); setFormError(null) }} placeholder="Seu nome completo" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="cf-phone">WhatsApp *</Label>
                  <Input id="cf-phone" value={clientPhone} onChange={e => { setClientPhone(e.target.value); setFormError(null) }} placeholder="(00) 00000-0000" className="mt-1" />
                  {clientPhone && clientPhone.replace(/\D/g, '').length < 10 && (
                    <p style={{ fontSize: 12, color: '#F59E0B', marginTop: 4 }}>Informe o número com DDD</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cf-email">E-mail <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span></Label>
                  <Input id="cf-email" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="seu@email.com" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="cf-notes">Observações <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span></Label>
                  <textarea
                    id="cf-notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Alguma informação extra para o profissional..."
                    rows={3}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginTop: 4 }}
                    onFocus={e => e.currentTarget.style.borderColor = '#4F46E5'}
                    onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                  />
                </div>

                {/* Intake form questions */}
                {(linkConfig?.intake_form || []).length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                      Informações adicionais
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {linkConfig.intake_form.map(q => (
                        <div key={q.id}>
                          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                            {q.question}{q.required && <span style={{ color: '#EF4444' }}> *</span>}
                          </label>
                          {q.type === 'text' && (
                            <input
                              type="text"
                              required={q.required}
                              value={intakeAnswers[q.id] || ''}
                              onChange={e => setIntakeAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                              placeholder="Sua resposta..."
                              style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                            />
                          )}
                          {q.type === 'yes_no' && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              {['Sim', 'Não'].map(opt => (
                                <button key={opt} type="button" onClick={() => setIntakeAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: `2px solid ${intakeAnswers[q.id] === opt ? '#4F46E5' : '#E5E7EB'}`, background: intakeAnswers[q.id] === opt ? '#EEF2FF' : '#fff', color: intakeAnswers[q.id] === opt ? '#4F46E5' : '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 120ms' }}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                          {q.type === 'select' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {(q.options || []).map(opt => (
                                <button key={opt} type="button" onClick={() => setIntakeAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                  style={{ padding: '10px 14px', borderRadius: 8, border: `2px solid ${intakeAnswers[q.id] === opt ? '#4F46E5' : '#E5E7EB'}`, background: intakeAnswers[q.id] === opt ? '#EEF2FF' : '#fff', color: intakeAnswers[q.id] === opt ? '#4F46E5' : '#374151', fontWeight: intakeAnswers[q.id] === opt ? 600 : 400, fontSize: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 120ms' }}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Anamnese form (mandatory when template configured) */}
                {linkConfig?.anamnese_template && (linkConfig.anamnese_template.fields || []).length > 0 && (
                  <div style={{ border: '1px solid #DDD6FE', borderRadius: 12, overflow: 'hidden', background: '#FAFBFF' }}>
                    <div style={{ padding: '14px 16px', background: '#F5F3FF', borderBottom: '1px solid #DDD6FE', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>📋</span>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: '#5B21B6', marginBottom: 2 }}>
                          {linkConfig.anamnese_template.name || 'Formulário de Anamnese'}
                          <span style={{ fontSize: 12, fontWeight: 400, color: '#7C3AED', marginLeft: 6 }}>(obrigatório)</span>
                        </p>
                        {linkConfig.anamnese_template.description && (
                          <p style={{ fontSize: 12, color: '#7C3AED' }}>{linkConfig.anamnese_template.description}</p>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {(linkConfig.anamnese_template.fields || []).map((field, idx) => {
                        const key = field.id || field.label || idx
                        const val = anamneseAnswers[key] || ''
                        const isRequired = field.required !== false
                        return (
                          <div key={key}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                              {field.label || field.question}
                              {isRequired && <span style={{ color: '#EF4444' }}> *</span>}
                            </label>
                            {field.type === 'checkbox' && (
                              <div style={{ display: 'flex', gap: 8 }}>
                                {['Sim', 'Não'].map(opt => (
                                  <button key={opt} type="button"
                                    onClick={() => { setAnamneseAnswers(prev => ({ ...prev, [key]: opt })); setFormError(null) }}
                                    style={{ flex: 1, padding: '10px', borderRadius: 8, border: `2px solid ${val === opt ? '#7C3AED' : '#DDD6FE'}`, background: val === opt ? '#EDE9FE' : '#fff', color: val === opt ? '#5B21B6' : '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 120ms' }}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )}
                            {(!field.type || field.type === 'text' || field.type === 'short_text') && (
                              <input
                                type="text"
                                value={val}
                                onChange={e => { setAnamneseAnswers(prev => ({ ...prev, [key]: e.target.value })); setFormError(null) }}
                                placeholder="Sua resposta..."
                                style={{ width: '100%', padding: '9px 12px', border: '1px solid #DDD6FE', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
                                onFocus={e => e.currentTarget.style.borderColor = '#7C3AED'}
                                onBlur={e => e.currentTarget.style.borderColor = '#DDD6FE'}
                              />
                            )}
                            {(field.type === 'long_text' || field.type === 'textarea') && (
                              <textarea
                                value={val}
                                onChange={e => { setAnamneseAnswers(prev => ({ ...prev, [key]: e.target.value })); setFormError(null) }}
                                placeholder="Sua resposta..."
                                rows={3}
                                style={{ width: '100%', padding: '9px 12px', border: '1px solid #DDD6FE', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical', background: '#fff' }}
                                onFocus={e => e.currentTarget.style.borderColor = '#7C3AED'}
                                onBlur={e => e.currentTarget.style.borderColor = '#DDD6FE'}
                              />
                            )}
                            {field.type === 'yes_no' && (
                              <div style={{ display: 'flex', gap: 8 }}>
                                {['Sim', 'Não'].map(opt => (
                                  <button key={opt} type="button"
                                    onClick={() => { setAnamneseAnswers(prev => ({ ...prev, [key]: opt })); setFormError(null) }}
                                    style={{ flex: 1, padding: '10px', borderRadius: 8, border: `2px solid ${val === opt ? '#7C3AED' : '#DDD6FE'}`, background: val === opt ? '#EDE9FE' : '#fff', color: val === opt ? '#5B21B6' : '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 120ms' }}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )}
                            {(field.type === 'select' || field.type === 'multiple_choice') && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {(field.options || []).map(opt => (
                                  <button key={opt} type="button"
                                    onClick={() => { setAnamneseAnswers(prev => ({ ...prev, [key]: opt })); setFormError(null) }}
                                    style={{ padding: '10px 14px', borderRadius: 8, border: `2px solid ${val === opt ? '#7C3AED' : '#DDD6FE'}`, background: val === opt ? '#EDE9FE' : '#fff', color: val === opt ? '#5B21B6' : '#374151', fontWeight: val === opt ? 600 : 400, fontSize: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 120ms' }}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )}
                            {field.type === 'number' && (
                              <input
                                type="number"
                                value={val}
                                onChange={e => { setAnamneseAnswers(prev => ({ ...prev, [key]: e.target.value })); setFormError(null) }}
                                placeholder="0"
                                style={{ width: '100%', padding: '9px 12px', border: '1px solid #DDD6FE', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
                                onFocus={e => e.currentTarget.style.borderColor = '#7C3AED'}
                                onBlur={e => e.currentTarget.style.borderColor = '#DDD6FE'}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Recurrence (collapsible) */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setRecurrenceEnabled(v => !v)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#FAFAFA', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Repeat size={15} style={{ color: '#6B7280' }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Repetir agendamento</span>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>(opcional)</span>
                    </div>
                    <ChevronRight size={16} style={{ color: '#9CA3AF', transform: recurrenceEnabled ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 200ms' }} />
                  </button>
                  {recurrenceEnabled && (
                    <div style={{ padding: '16px', borderTop: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <Label>Frequência</Label>
                        <Select value={recurrenceFrequency} onValueChange={setRecurrenceFrequency}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {RECURRENCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <Label>Número de sessões</Label>
                          <Input type="number" min={1} max={24} value={recurrenceOccurrences} onChange={e => setRecurrenceOccurrences(e.target.value)} className="mt-1" />
                          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Máx. 24 sessões</p>
                        </div>
                        <div>
                          <Label>Data final</Label>
                          <Input type="date" value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} className="mt-1" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {formError && (
                <div style={{ marginTop: 20, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 14, color: '#991B1B', maxWidth: 440 }}>
                  {formError}
                </div>
              )}

              {/* Submit */}
              <div style={{ marginTop: 28, maxWidth: 440 }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%', padding: '14px 20px', borderRadius: 10,
                    background: submitting ? '#A5B4FC' : '#4F46E5',
                    color: '#fff', fontWeight: 700, fontSize: 15, border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#4338CA' }}
                  onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = '#4F46E5' }}
                >
                  {submitting ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Confirmando...</> : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
