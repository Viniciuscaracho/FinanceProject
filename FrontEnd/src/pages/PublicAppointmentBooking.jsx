import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Calendar, Clock, User, Phone, Mail, CheckCircle2, ArrowLeft, MessageCircle, Video, Copy, Repeat, ChevronRight } from 'lucide-react'
import { apiService } from '../lib/api'

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const recurrenceOptions = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
  { value: 'daily', label: 'Diário' },
]

export function PublicAppointmentBooking() {
  const { token } = useParams()
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1) // 1: Service (opcional), 2: Professionals/Time, 3: Client Info, 4: Success
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Data
  const [services, setServices] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [professionalSlots, setProfessionalSlots] = useState({}) // { professionalId: { date: [slots] } }
  const [loadingSlots, setLoadingSlots] = useState({}) // { professionalId: true/false }
  
  // Selected values
  const [selectedService, setSelectedService] = useState(null)
  const [expandedProfessional, setExpandedProfessional] = useState(null) // ID do profissional expandido
  const [selectedProfessional, setSelectedProfessional] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  
  // Client info
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [googleMeetLink, setGoogleMeetLink] = useState('')
  
  // Appointment result
  const [appointmentResult, setAppointmentResult] = useState(null)

  // Online / Meet helpers
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('weekly')
  const [recurrenceOccurrences, setRecurrenceOccurrences] = useState(4)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  const [meetLinkCopied, setMeetLinkCopied] = useState(false)

  // Calendar wheel block ref
  const calendarRef = useRef(null)

  // Calendar
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [linkConfig, setLinkConfig] = useState({ days_ahead: 15, link_type: 'normal' })
  const [companyInfo, setCompanyInfo] = useState(null)

  const isOnlineService = (linkConfig?.enable_google_meet === true) ||
    selectedService?.auto_meet === true ||
    selectedService?.metadata?.auto_meet === true ||
    selectedService?.modality === 'online'

  const isValidGoogleMeetLink = (link) => {
    if (!link) return false
    const normalized = link.trim()
    const pattern = /^https:\/\/meet\.google\.com\/[A-Za-z0-9]{3}-[A-Za-z0-9]{4}-[A-Za-z0-9]{3}(?:\?[^\s]*)?$/
    return pattern.test(normalized)
  }
  
  useEffect(() => {
    loadInitialData()
  }, [token])
  
  // Carregar slots quando um profissional é expandido e uma data é selecionada
  useEffect(() => {
    if (expandedProfessional && selectedDate) {
      loadAvailableSlotsForProfessional(expandedProfessional, selectedDate)
    }
  }, [expandedProfessional, selectedDate, selectedService])
  
  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { services: servicesData, professionals: professionalsData, config: configData, company: companyData } =
        await apiService.getPublicAppointmentFull(token).catch(() => ({
          services: [],
          professionals: [],
          config: { days_ahead: 15, link_type: 'normal' },
          company: null
        }))

      setServices(servicesData)
      setProfessionals(professionalsData)
      setLinkConfig(configData)
      setCompanyInfo(companyData || null)
      
      // Auto-select service if only one option
      if (servicesData.length === 1) {
        setSelectedService(servicesData[0])
      }
      
      // Se tiver apenas um serviço, já pode ir para a tela de profissionais
      if (servicesData.length === 1) {
        setStep(2)
      } else if (servicesData.length > 1) {
        setStep(1) // Mostrar seleção de serviço primeiro
      } else {
        setStep(2) // Sem serviços, ir direto para profissionais
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }
  
  const loadAvailableSlotsForProfessional = async (professionalId, date) => {
    if (!professionalId || !date) {
      return
    }
    
    const dateStr = date.toISOString().split('T')[0]
    const cacheKey = `${professionalId}-${dateStr}`
    
    // Verificar se já temos os slots em cache
    if (professionalSlots[professionalId]?.[dateStr]) {
      return
    }
    
    try {
      setLoadingSlots(prev => ({ ...prev, [professionalId]: true }))
      setError(null)
      
      
      const result = await apiService.getPublicAvailableSlots(token, {
        professionalId,
        date: dateStr,
        serviceId: selectedService?.id,
      })
      
      // Armazenar slots no cache
      setProfessionalSlots(prev => ({
        ...prev,
        [professionalId]: {
          ...(prev[professionalId] || {}),
          [dateStr]: result.available_slots || []
        }
      }))
    } catch (err) {
      setError(err.message || 'Erro ao carregar horários disponíveis')
      
      // Armazenar array vazio em caso de erro
      setProfessionalSlots(prev => ({
        ...prev,
        [professionalId]: {
          ...(prev[professionalId] || {}),
          [dateStr]: []
        }
      }))
    } finally {
      setLoadingSlots(prev => ({ ...prev, [professionalId]: false }))
    }
  }
  
  const handleServiceSelect = (serviceId) => {
    
    // Tentar encontrar o serviço com diferentes comparações
    let service = services.find(s => s.id === serviceId)
    if (!service) {
      service = services.find(s => s.id.toString() === serviceId.toString())
    }
    if (!service) {
      service = services.find(s => Number(s.id) === Number(serviceId))
    }
    
    if (service) {
      // Garantir que o serviço tem todas as propriedades necessárias
      const serviceToSet = {
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        duration_minutes: service.duration_minutes
      }
      setSelectedService(serviceToSet)
      setStep(2)
      setError(null) // Limpar erros anteriores
    } else {
      setError(`Serviço não encontrado. ID buscado: ${serviceId}`)
    }
  }
  
  const handleProfessionalExpand = (professionalId) => {
    const professional = professionals.find(p => 
      p.id === professionalId || 
      p.id.toString() === professionalId.toString() ||
      Number(p.id) === Number(professionalId)
    )
    
    if (!professional) {
      setError(`Profissional não encontrado`)
      return
    }
    
    // Se já está expandido, colapsar
    if (expandedProfessional === professionalId) {
      setExpandedProfessional(null)
      setSelectedDate(null)
      setSelectedSlot(null)
    } else {
      // Expandir novo profissional
      setExpandedProfessional(professionalId)
      setSelectedProfessional(professional)
      setSelectedDate(null)
      setSelectedSlot(null)
      setError(null)
    }
  }
  
  const handleProfessionalSelect = (professional) => {
    setSelectedProfessional(professional)
    setError(null)
  }

  const changeMonth = (delta) => {
    setCurrentMonth((prevMonth) => {
      const nextMonth = new Date(prevMonth)
      nextMonth.setMonth(prevMonth.getMonth() + delta)
      return nextMonth
    })
  }

  const handleCalendarWheel = (event) => {
    // Bloquear qualquer navegação por rolagem no calendário (somente botões mudam mês)
    event.preventDefault()
    event.stopPropagation()
    // Bloquear handlers nativos adicionais (Safari/trackpads)
    if (event.nativeEvent && typeof event.nativeEvent.stopImmediatePropagation === 'function') {
      event.nativeEvent.stopImmediatePropagation()
    }
    return false
  }

  useEffect(() => {
    const el = calendarRef.current
    if (!el) return

    const wheelListener = (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation()
      }
      return false
    }

    // Listener não-passivo para garantir que preventDefault funcione em trackpads/mouse
    el.addEventListener('wheel', wheelListener, { passive: false })

    return () => {
      el.removeEventListener('wheel', wheelListener, { passive: false })
    }
  }, [])

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    // loadAvailableSlotsForProfessional será chamado pelo useEffect
  }
  
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validação mais específica com trim
    const trimmedClientName = clientName?.trim() || ''
    const trimmedClientPhone = clientPhone?.trim() || ''
    const trimmedMeetLink = googleMeetLink?.trim() || ''
    
    
    const missingFields = []
    if (!selectedService) {
      missingFields.push('Serviço')
    } else if (!selectedService.id) {
      missingFields.push('Serviço')
    }
    if (!selectedProfessional || !selectedProfessional.id) {
      missingFields.push('Profissional')
    }
    if (!selectedSlot || !selectedSlot.start_time) {
      missingFields.push('Data e Horário')
    }
    if (!trimmedClientName) {
      missingFields.push('Nome completo')
    }
    if (!trimmedClientPhone) {
      missingFields.push('WhatsApp')
    }
    if (isOnlineService && !trimmedMeetLink) {
      missingFields.push('Link do Google Meet')
    }
    
    if (missingFields.length > 0) {
      const errorMsg = `Por favor, preencha os seguintes campos: ${missingFields.join(', ')}`
      setError(errorMsg)
      return
    }
    
    // Validar formato do WhatsApp (deve ter pelo menos 10 dígitos)
    const phoneDigits = trimmedClientPhone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      setError('Por favor, informe um número de WhatsApp válido (com DDD)')
      return
    }

    // Validar link do Meet quando necessário
    if (isOnlineService) {
      if (!isValidGoogleMeetLink(trimmedMeetLink)) {
        setError('Informe um link válido do Google Meet (formato https://meet.google.com/xxx-xxxx-xxx)')
        return
      }
    } else if (trimmedMeetLink && !isValidGoogleMeetLink(trimmedMeetLink)) {
      setError('O link do Google Meet informado é inválido. Use o formato https://meet.google.com/xxx-xxxx-xxx')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      setMeetLinkCopied(false)
      
      
      const appointmentData = {
        service_id: selectedService.id,
        account_user_id: selectedProfessional.id,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        whatsapp_number: phoneDigits,
        client_name: trimmedClientName,
        client_email: clientEmail?.trim() || null
      }

      if (trimmedMeetLink) {
        appointmentData.google_meet_link = trimmedMeetLink
      }
      
      const sanitizedOccurrences = Math.min(Math.max(parseInt(recurrenceOccurrences, 10) || 1, 1), 24)
      if (recurrenceEnabled) {
        appointmentData.recurrence_pattern = {
          frequency: recurrenceFrequency,
          occurrences: sanitizedOccurrences,
          ...(recurrenceEndDate ? { end_date: recurrenceEndDate } : {})
        }
      }

      if (isOnlineService) {
        appointmentData.enable_google_meet = true
      }
      
      const result = await apiService.createPublicAppointment(token, appointmentData)
      
      if (result.success) {
        setAppointmentResult(result)
        setStep(4)
      } else {
        const errorMessage = result.errors?.join(', ') || result.error || 'Erro ao criar agendamento'
        setError(errorMessage)
      }
    } catch (err) {
      
      // Extrair mensagem de erro de diferentes formatos
      let errorMessage = 'Erro ao criar agendamento';
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        errorMessage = err.errors.join(', ');
      } else if (err.data?.errors && Array.isArray(err.data.errors)) {
        errorMessage = err.data.errors.join(', ');
      } else if (err.data?.error) {
        errorMessage = typeof err.data.error === 'string' ? err.data.error : JSON.stringify(err.data.error);
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.errors) {
        errorMessage = Array.isArray(err.response.data.errors) 
          ? err.response.data.errors.join(', ')
          : err.response.data.errors;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    // Calcular data máxima permitida baseado em days_ahead
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxDate = new Date(today)
    maxDate.setDate(today.getDate() + (linkConfig.days_ahead || 15))
    
    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push(date)
    }
    
    return { days, maxDate }
  }
  
  const formatTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  
  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })
  }
  
  // Estilos personalizados para página pública de agendamento
  const publicStyles = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundLight: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    primary: '#667eea',
    primaryDark: '#5568d3',
    primaryLight: '#818cf8',
    text: '#1f2937',
    textLight: '#6b7280',
    cardBg: '#ffffff',
    border: '#e5e7eb',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b'
  }
  
  // Enquanto dados iniciais são carregados, exibir loader independente do passo
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100" style={{ 
        colorScheme: 'light',
        backgroundColor: '#f9fafb',
        backgroundImage: 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)'
      }}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }
  
  if (error && step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100" style={{ 
        colorScheme: 'light',
        backgroundColor: '#f9fafb',
        backgroundImage: 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)'
      }}>
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => loadInitialData()}>Tentar novamente</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (step === 4) {
    const googleMeetLink = appointmentResult?.google_meet_link || appointmentResult?.appointment?.google_meet_link
    const recurrenceSummary = appointmentResult?.recurrence

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl">
          {/* Success Icon - Minimalist */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-3">
              Agendamento confirmado
            </h1>
            <p className="text-base text-gray-600 max-w-md mx-auto">
              Seu agendamento foi realizado com sucesso. Você receberá uma confirmação em breve.
            </p>
          </div>

          {/* Details Card - Clean and Minimal */}
              {selectedService && selectedSlot && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 mb-8">
              <div className="space-y-6">
                {/* Service */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Serviço
                    </p>
                    <p className="text-lg font-medium text-gray-900 mb-1">
                      {selectedService.name}
                    </p>
                    {selectedService.price?.formatted && (
                      <p className="text-sm text-gray-600">
                        {selectedService.price.formatted}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100"></div>

                {/* Professional */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Profissional
                    </p>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedProfessional?.name || 'Não informado'}
              </p>
            </div>
                </div>

                <div className="border-t border-gray-100"></div>

                {/* Date & Time */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Data e Horário
                    </p>
                    <p className="text-lg font-medium text-gray-900 mb-1">
                      {formatDate(new Date(selectedSlot.start_time))}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatTime(selectedSlot.start_time)}
                    </p>
                  </div>
                </div>

                {recurrenceSummary?.count ? (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                      <Repeat className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                        Recorrência
                      </p>
                      <p className="text-sm text-gray-800">
                        {recurrenceSummary.count} ocorrência{recurrenceSummary.count !== 1 ? 's' : ''} - {recurrenceSummary.frequency}
                        {recurrenceSummary.end_date ? ` (até ${new Date(recurrenceSummary.end_date).toLocaleDateString('pt-BR')})` : ''}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Meet Link */}
          {googleMeetLink && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-emerald-100 flex items-center justify-center">
                    <Video className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Atendimento online</p>
                    <p className="text-sm text-emerald-800">Use o link abaixo para entrar no Google Meet no horário marcado.</p>
                    <p className="text-xs text-emerald-700 mt-1 break-all">{googleMeetLink}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button onClick={() => window.open(googleMeetLink, '_blank')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Video className="h-4 w-4 mr-2" /> Entrar no Google Meet
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(googleMeetLink)
                      setMeetLinkCopied(true)
                      setTimeout(() => setMeetLinkCopied(false), 1500)
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" /> {meetLinkCopied ? 'Copiado!' : 'Copiar link'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Info Box - Subtle */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Informações importantes
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {googleMeetLink ? 'Guarde este link para acessar a sessão online. Caso precise reagendar, entre em contato conosco.' : 'Chegue com alguns minutos de antecedência. Em caso de necessidade de cancelamento ou remarcação, entre em contato conosco.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons - Clean and Integrated */}
          <div className="space-y-3">
            {/* WhatsApp Button - Integrated Style */}
            {(() => {
              // Tentar encontrar o número de WhatsApp em diferentes lugares da resposta
              const whatsappNumber = appointmentResult?.appointment?.company_whatsapp ||
                                     appointmentResult?.company_whatsapp ||
                                     appointmentResult?.appointment?.company_whatsapp_number ||
                                     null

              const googleMeetLink = appointmentResult?.google_meet_link || appointmentResult?.appointment?.google_meet_link

              if (!whatsappNumber) return null
              
              return (
                <button
                  onClick={() => {
                    const serviceName = selectedService?.name || 'serviço'
                    const professionalName = selectedProfessional?.name || 'profissional'
                    const date = selectedSlot ? formatDate(new Date(selectedSlot.start_time)) : ''
                    const time = selectedSlot ? formatTime(selectedSlot.start_time) : ''
                    const meetLine = googleMeetLink ? `\n🔗 Google Meet: ${googleMeetLink}` : ''
                    
                    const message = encodeURIComponent(
                      `Olá! Acabei de realizar um agendamento:\n\n` +
                      `📅 Serviço: ${serviceName}\n` +
                      `👤 Profissional: ${professionalName}\n` +
                      `📆 Data: ${date}\n` +
                      `⏰ Horário: ${time}${meetLine}\n\n` +
                      `Gostaria de confirmar ou tirar alguma dúvida.`
                    )
                    
                    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`
                    window.open(whatsappUrl, '_blank')
                  }}
                  className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium h-11 rounded-lg flex items-center justify-center gap-2.5 transition-colors duration-200 shadow-sm hover:shadow"
                >
                  {/* WhatsApp Icon SVG */}
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0"
                  >
                    <path 
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" 
                      fill="currentColor"
                    />
                  </svg>
                  <span>Falar no WhatsApp</span>
                </button>
              )
            })()}
            
            <div className="flex flex-col sm:flex-row gap-3">
              {appointmentResult?.payment_link_url && (
                <Button
                  onClick={() => window.location.href = appointmentResult.payment_link_url}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white h-11 font-medium"
                >
                  Realizar Pagamento
                </Button>
              )}
              <Button
                onClick={() => {
                  setStep(1)
                  setSelectedService(null)
                  setSelectedProfessional(null)
                  setSelectedDate(null)
                  setSelectedSlot(null)
                  setClientName('')
                  setClientPhone('')
                  setClientEmail('')
                  setAppointmentResult(null)
                  setRecurrenceEnabled(false)
                  setRecurrenceFrequency('weekly')
                  setRecurrenceOccurrences(4)
                  setRecurrenceEndDate('')
                  setMeetLinkCopied(false)
                  setGoogleMeetLink('')
                }}
                variant="outline"
                className="flex-1 border-gray-300 hover:bg-gray-50 h-11 font-medium"
              >
                Fazer Novo Agendamento
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-full min-h-screen bg-gray-50 flex justify-center py-6 sm:py-10 px-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Agendar Horário</h1>
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className="text-lg">←</span>
              <span className="hidden sm:inline">Voltar</span>
            </button>
          )}
        </div>

        {companyInfo && Object.keys(companyInfo).length > 0 && (
          <div className="mb-8 sm:mb-10 flex items-center gap-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4 sm:p-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-base">
                {(companyInfo.name || 'E').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-0.5">
                Você está agendando com
              </p>
              <p className="text-base font-bold text-indigo-900 truncate">
                {companyInfo.name || 'Nossa empresa'}
              </p>
              {companyInfo.email && (
                <p className="text-xs text-indigo-700 mt-0.5">{companyInfo.email}</p>
              )}
            </div>
            {(companyInfo.whatsapp_number || companyInfo.cell_phone_number || companyInfo.phone_number) && (
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-xs text-indigo-500 mb-0.5">Contato</p>
                <p className="text-sm font-semibold text-indigo-900">
                  {companyInfo.whatsapp_number || companyInfo.cell_phone_number || companyInfo.phone_number}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stepper */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 sm:mb-12">
          {[1, 2, 3].map((s, index) => {
            const isActive = step === s
            const isDone = step > s
            return (
              <div key={index} className="flex items-center gap-2 sm:gap-4">
                {/* Circle */}
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full font-semibold text-sm sm:text-base transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md scale-105"
                      : isDone
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {isDone ? '✓' : s}
                </div>
                {/* Line (except last) */}
                {s !== 3 && (
                  <div
                    className={`w-12 sm:w-16 h-1 rounded-full transition-all duration-200 ${
                      isDone || isActive ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
            
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {/* Step 1: Select Service */}
        {step === 1 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
              Selecione o serviço
            </h2>
            <div className="space-y-4">
               {services.map((service) => (
                 <button
                   key={service.id}
                   type="button"
                   onClick={(e) => {
                     e.preventDefault()
                     handleServiceSelect(service.id)
                   }}
                   className="w-full text-left"
                 >
                  <div className="w-full flex items-center gap-4 px-5 py-4 border-2 border-gray-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/50 rounded-xl shadow-sm transition-all duration-200 group">
                    <div className="w-11 h-11 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center flex-shrink-0 transition-colors">
                      <span className="text-indigo-700 font-bold text-base">{service.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h3 className="text-base font-bold text-gray-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{service.description}</p>
                      )}
                      <p className="text-sm font-semibold text-emerald-600 mt-1">
                        {service.price?.formatted || 'R$ 0,00'}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 flex-shrink-0 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
            
        {/* Step 2: Select Professional and Time (Nova interface otimizada) */}
        {step === 2 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
              {selectedService ? `Agendar ${selectedService.name}` : 'Selecione o profissional e horário'}
            </h2>
            
            {selectedService && (
              <div className="bg-blue-50 border-2 border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6">
                <p className="font-medium">
                  <strong>Serviço:</strong> {selectedService.name} - {selectedService.price?.formatted || 'R$ 0,00'}
                </p>
              </div>
            )}

            {!loading && professionals.length === 0 && (
              <div className="border-2 border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 rounded-lg mb-6">
                Nenhum profissional disponível para este link no momento. Tente novamente em instantes ou confirme se o link está ativo.
              </div>
            )}

            {/* Lista de Profissionais com Horários */}
            <div className="space-y-4">
              {professionals.map((professional) => {
                const isExpanded = expandedProfessional === professional.id
                const dateStr = selectedDate?.toISOString().split('T')[0]
                const slots = professionalSlots[professional.id]?.[dateStr] || []
                const isLoading = loadingSlots[professional.id]
                
                return (
                  <div
                    key={professional.id}
                    className={`border-2 rounded-xl shadow-sm transition-all duration-200 ${
                      isExpanded
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    {/* Cabeçalho do Profissional */}
                    <button
                      onClick={() => handleProfessionalExpand(professional.id)}
                      className="w-full text-left px-6 py-5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${
                            isExpanded
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {professional.name?.charAt(0) || 'P'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-lg font-semibold text-gray-900 block truncate">
                              {professional.name}
                            </span>
                            {isExpanded && selectedDate && (
                              <span className="text-sm text-gray-600">
                                {formatDate(selectedDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`font-semibold text-xl flex-shrink-0 ml-4 transition-transform ${
                          isExpanded ? 'text-indigo-600 rotate-180' : 'text-gray-400'
                        }`}>
                          ⌵
                        </span>
                      </div>
                    </button>
                    
                    {/* Conteúdo Expandido: Calendário e Horários */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-gray-200 pt-4">
                        {/* Calendário */}
                        <div
                          ref={calendarRef}
                          className="mb-6"
                          onWheelCapture={handleCalendarWheel}
                          onWheel={handleCalendarWheel}
                          style={{ overscrollBehavior: 'contain' }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => changeMonth(-1)}
                            >
                              ‹
                            </Button>
                            <h4 className="font-semibold text-gray-900">
                              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => changeMonth(1)}
                            >
                              ›
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-7 gap-2 mb-4">
                            {weekDays.map((day) => (
                              <div key={day} className="text-center font-semibold text-sm text-gray-600">
                                {day}
                              </div>
                            ))}
                            {(() => {
                              const { days, maxDate } = getDaysInMonth()
                              return days.map((date, idx) => {
                                if (!date) return <div key={idx} />
                                
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                const dateOnly = new Date(date)
                                dateOnly.setHours(0, 0, 0, 0)
                                
                                const isSelected = selectedDate && 
                                  date.toDateString() === selectedDate.toDateString()
                                const isPast = dateOnly < today
                                const isFuture = dateOnly > maxDate
                                const isToday = dateOnly.toDateString() === today.toDateString()
                                const isDisabled = isPast || isFuture
                                
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => !isDisabled && handleDateSelect(date)}
                                    disabled={isDisabled}
                                    className={`h-10 rounded transition-colors ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white'
                                        : isDisabled
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : isToday
                                        ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-600'
                                        : 'bg-white hover:bg-gray-100 text-gray-900'
                                    }`}
                                  >
                                    {date.getDate()}
                                  </button>
                                )
                              })
                            })()}
                          </div>
                        </div>
                        
                        {/* Horários Disponíveis */}
                        {selectedDate ? (
                          <div>
                            <h4 className="font-semibold mb-3 text-base">
                              Horários disponíveis para {formatDate(selectedDate)}
                            </h4>
                            {isLoading ? (
                              <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                <span className="ml-2 text-gray-600">Carregando horários...</span>
                              </div>
                            ) : slots.length === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-gray-500 mb-2">
                                  Não há horários disponíveis para esta data.
                                </p>
                                <p className="text-sm text-gray-400">
                                  Tente selecionar outra data.
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {slots.map((slot, idx) => {
                                  const isSelected = selectedSlot && 
                                    slot.start_time === selectedSlot.start_time
                                  
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        setSelectedSlot(slot)
                                        handleProfessionalSelect(professional)
                                      }}
                                      className={`p-3 rounded-lg border-2 transition-all ${
                                        isSelected
                                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-semibold'
                                          : 'border-gray-200 hover:border-indigo-300 bg-white text-gray-900'
                                      }`}
                                    >
                                      <Clock className="h-4 w-4 inline mr-1" />
                                      {formatTime(slot.start_time)}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                            
                            {/* Botão para continuar */}
                            {selectedSlot && (
                              <div className="mt-6">
                                <Button
                                  onClick={() => setStep(3)}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                  Continuar com este horário
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500">
                              Selecione uma data para ver os horários disponíveis
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
            
        {/* Step 3: Client Information */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
              Informações do Cliente
            </h2>
                
                {selectedService && selectedSlot && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Serviço</span>
                      <span className="font-semibold text-gray-900">{selectedService.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Profissional</span>
                      <span className="font-semibold text-gray-900">{selectedProfessional?.name || '–'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Data</span>
                      <span className="font-semibold text-gray-900">{formatDate(new Date(selectedSlot.start_time))}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Horário</span>
                      <span className="font-semibold text-gray-900">{formatTime(selectedSlot.start_time)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 mt-0.5 border-t border-gray-200">
                      <span className="text-gray-500">Valor</span>
                      <span className="font-bold text-emerald-600">{selectedService.price?.formatted || 'R$ 0,00'}</span>
                    </div>
                  </div>
                )}

                {isOnlineService && (
                  <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-4 py-4 rounded-lg mb-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-md bg-white/70 flex items-center justify-center">
                        <Video className="h-5 w-5 text-indigo-700" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Atendimento online</p>
                        <p className="text-sm text-indigo-800">
                          Gere um link autêntico do Google Meet, copie e cole abaixo para compartilhar com o profissional e manter na sua confirmação.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="sm:w-auto border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                        onClick={() => window.open('https://meet.google.com/new', '_blank', 'noopener')}
                      >
                        <Video className="h-4 w-4 mr-2" /> Gerar link no Google Meet
                      </Button>
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="googleMeetLink">Cole aqui o link do Meet *</Label>
                        <Input
                          id="googleMeetLink"
                          value={googleMeetLink}
                          onChange={(e) => {
                            setGoogleMeetLink(e.target.value)
                            setError(null)
                          }}
                          placeholder="https://meet.google.com/xxx-xxxx-xxx"
                          className={`w-full ${isOnlineService && !googleMeetLink?.trim() ? 'border-red-300' : ''}`}
                        />
                        <p className="text-xs text-indigo-800">Abra o Meet, copie o link gerado e cole neste campo.</p>
                        {googleMeetLink && !isValidGoogleMeetLink(googleMeetLink) && (
                          <p className="text-xs text-red-600">Use o formato https://meet.google.com/xxx-xxxx-xxx</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">Repetir agendamento (opcional)</p>
                        <p className="text-sm text-gray-600">Ideal para aulas, terapias ou consultas semanais.</p>
                      </div>
                      <input
                        type="checkbox"
                        className="h-5 w-5 mt-1 accent-indigo-600"
                        checked={recurrenceEnabled}
                        onChange={(e) => setRecurrenceEnabled(e.target.checked)}
                      />
                    </div>

                    {recurrenceEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Frequência</Label>
                          <Select value={recurrenceFrequency} onValueChange={setRecurrenceFrequency}>
                            <SelectTrigger>
                              <SelectValue placeholder="Escolha a frequência" />
                            </SelectTrigger>
                            <SelectContent>
                              {recurrenceOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Número de sessões</Label>
                          <Input
                            type="number"
                            min={1}
                            max={24}
                            value={recurrenceOccurrences}
                            onChange={(e) => setRecurrenceOccurrences(e.target.value)}
                            placeholder="Ex: 4"
                          />
                          <p className="text-xs text-gray-500">Máximo de 24 ocorrências.</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Data final (opcional)</Label>
                          <Input
                            type="date"
                            value={recurrenceEndDate}
                            onChange={(e) => setRecurrenceEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Seus dados</p>
                    <div className="space-y-1.5">
                      <Label htmlFor="clientName">Nome completo *</Label>
                      <Input
                        id="clientName"
                        value={clientName}
                        onChange={(e) => { setClientName(e.target.value); setError(null) }}
                        required
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="clientPhone">WhatsApp *</Label>
                      <Input
                        id="clientPhone"
                        value={clientPhone}
                        onChange={(e) => { setClientPhone(e.target.value); setError(null) }}
                        required
                        placeholder="(00) 00000-0000"
                      />
                      {clientPhone?.trim() && clientPhone.replace(/\D/g, '').length < 10 && (
                        <p className="text-xs text-amber-600">Informe um número válido com DDD</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="clientEmail">
                        E-mail <span className="font-normal text-gray-400">(opcional)</span>
                      </Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
                    {error}
                  </div>
                )}
                
                <div className="mt-6">
                  <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 font-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : (
                      'Confirmar Agendamento'
                    )}
                  </Button>
                </div>
          </form>
        )}
      </div>
    </div>
  )
}

