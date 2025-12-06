import { useState, useEffect } from 'react'
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
import { Loader2, Calendar, Clock, User, Phone, Mail, CheckCircle2, ArrowLeft, MessageCircle } from 'lucide-react'
import { apiService } from '../lib/api'

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

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
  
  // Appointment result
  const [appointmentResult, setAppointmentResult] = useState(null)
  
  // Calendar
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
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
      
      const [servicesData, professionalsData] = await Promise.all([
        apiService.getPublicAppointmentServices(token),
        apiService.getPublicAppointmentProfessionals(token)
      ])
      
      setServices(servicesData)
      setProfessionals(professionalsData)
      
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
      
      console.log('🕐 Loading available slots:', {
        token,
        professionalId,
        date: dateStr,
        serviceId: selectedService?.id
      })
      
      const result = await apiService.getPublicAvailableSlots(
        token,
        professionalId,
        dateStr,
        selectedService?.id
      )
      
      console.log('✅ Available slots result:', result)
      
      // Armazenar slots no cache
      setProfessionalSlots(prev => ({
        ...prev,
        [professionalId]: {
          ...(prev[professionalId] || {}),
          [dateStr]: result.available_slots || []
        }
      }))
    } catch (err) {
      console.error('❌ Error loading available slots:', err)
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
    console.log('🔍 Selecting service:', {
      serviceId,
      serviceIdType: typeof serviceId,
      services: services.map(s => ({ id: s.id, idType: typeof s.id, name: s.name })),
      servicesLength: services.length
    })
    
    // Tentar encontrar o serviço com diferentes comparações
    let service = services.find(s => s.id === serviceId)
    if (!service) {
      service = services.find(s => s.id.toString() === serviceId.toString())
    }
    if (!service) {
      service = services.find(s => Number(s.id) === Number(serviceId))
    }
    
    console.log('✅ Service found:', service)
    
    if (service) {
      // Garantir que o serviço tem todas as propriedades necessárias
      const serviceToSet = {
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        duration_minutes: service.duration_minutes
      }
      console.log('📦 Setting service:', serviceToSet)
      setSelectedService(serviceToSet)
      setStep(2)
      setError(null) // Limpar erros anteriores
      console.log('✅ Service selected successfully:', serviceToSet.name, 'ID:', serviceToSet.id)
    } else {
      console.error('❌ Service not found:', serviceId, 'Available IDs:', services.map(s => s.id))
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
    
    // Debug: verificar todos os estados
    console.log('🔍 Validating form:', {
      selectedService: selectedService,
      selectedServiceId: selectedService?.id,
      selectedServiceIdType: typeof selectedService?.id,
      selectedProfessional: selectedProfessional?.id,
      selectedSlot: selectedSlot?.start_time,
      clientName: trimmedClientName,
      clientPhone: trimmedClientPhone,
      services: services.map(s => ({ id: s.id, name: s.name }))
    })
    
    const missingFields = []
    if (!selectedService) {
      missingFields.push('Serviço')
      console.warn('⚠️ Service missing: selectedService is null/undefined')
    } else if (!selectedService.id) {
      missingFields.push('Serviço')
      console.warn('⚠️ Service missing: selectedService exists but has no id:', selectedService)
    }
    if (!selectedProfessional || !selectedProfessional.id) {
      missingFields.push('Profissional')
      console.warn('⚠️ Professional missing:', selectedProfessional)
    }
    if (!selectedSlot || !selectedSlot.start_time) {
      missingFields.push('Data e Horário')
      console.warn('⚠️ Slot missing:', selectedSlot)
    }
    if (!trimmedClientName) {
      missingFields.push('Nome completo')
    }
    if (!trimmedClientPhone) {
      missingFields.push('WhatsApp')
    }
    
    if (missingFields.length > 0) {
      const errorMsg = `Por favor, preencha os seguintes campos: ${missingFields.join(', ')}`
      console.error('❌ Validation failed:', errorMsg)
      setError(errorMsg)
      return
    }
    
    // Validar formato do WhatsApp (deve ter pelo menos 10 dígitos)
    const phoneDigits = trimmedClientPhone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      setError('Por favor, informe um número de WhatsApp válido (com DDD)')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('📝 Submitting appointment:', {
        service_id: selectedService.id,
        account_user_id: selectedProfessional.id,
        start_time: selectedSlot.start_time,
        client_name: trimmedClientName,
        whatsapp_number: phoneDigits
      })
      
      const appointmentData = {
        service_id: selectedService.id,
        account_user_id: selectedProfessional.id,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        whatsapp_number: phoneDigits,
        client_name: trimmedClientName,
        client_email: clientEmail?.trim() || null
      }
      
      const result = await apiService.createPublicAppointment(token, appointmentData)
      
      console.log('✅ Appointment result:', result)
      console.log('📱 WhatsApp number check:', {
        appointment: result?.appointment,
        company_whatsapp: result?.appointment?.company_whatsapp,
        direct_whatsapp: result?.company_whatsapp
      })
      
      if (result.success) {
        setAppointmentResult(result)
        setStep(4)
      } else {
        const errorMessage = result.errors?.join(', ') || result.error || 'Erro ao criar agendamento'
        setError(errorMessage)
      }
    } catch (err) {
      console.error('❌ Error creating appointment:', err)
      console.error('  Error details:', {
        message: err.message,
        status: err.status,
        data: err.data,
        errors: err.errors
      })
      
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
    
    return days
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
  
  if (loading && step === 1) {
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
                  Chegue com alguns minutos de antecedência. Em caso de necessidade de cancelamento ou remarcação, entre em contato conosco.
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
              
              console.log('🔍 WhatsApp button check:', {
                appointmentResult,
                whatsappNumber,
                hasAppointment: !!appointmentResult?.appointment,
                appointmentKeys: appointmentResult?.appointment ? Object.keys(appointmentResult.appointment) : [],
                appointmentWhatsapp: appointmentResult?.appointment?.company_whatsapp,
                directWhatsapp: appointmentResult?.company_whatsapp
              })
              
              // Se não tiver número, não mostrar o botão
              if (!whatsappNumber) {
                console.warn('⚠️ WhatsApp number not found in response')
                return null
              }
              
              return (
                <button
                  onClick={() => {
                    const serviceName = selectedService?.name || 'serviço'
                    const professionalName = selectedProfessional?.name || 'profissional'
                    const date = selectedSlot ? formatDate(new Date(selectedSlot.start_time)) : ''
                    const time = selectedSlot ? formatTime(selectedSlot.start_time) : ''
                    
                    const message = encodeURIComponent(
                      `Olá! Acabei de realizar um agendamento:\n\n` +
                      `📅 Serviço: ${serviceName}\n` +
                      `👤 Profissional: ${professionalName}\n` +
                      `📆 Data: ${date}\n` +
                      `⏰ Horário: ${time}\n\n` +
                      `Gostaria de confirmar ou tirar alguma dúvida.`
                    )
                    
                    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`
                    console.log('📱 Opening WhatsApp:', whatsappUrl)
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
                     console.log('🖱️ Service button clicked:', service.id, typeof service.id)
                     handleServiceSelect(service.id)
                   }}
                   className="w-full text-left"
                 >
                  <div className="w-full flex items-center justify-between px-6 py-5 border-2 border-gray-200 hover:border-indigo-600 bg-white hover:bg-indigo-50 text-gray-800 rounded-xl shadow-sm transition-all duration-200">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      )}
                      <p className="text-lg font-bold text-indigo-600">
                        {service.price?.formatted || 'R$ 0,00'}
                      </p>
                    </div>
                    <span className="text-indigo-600 font-semibold text-xl ml-4 flex-shrink-0">⌵</span>
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
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const prevMonth = new Date(currentMonth)
                                prevMonth.setMonth(prevMonth.getMonth() - 1)
                                setCurrentMonth(prevMonth)
                              }}
                            >
                              ‹
                            </Button>
                            <h4 className="font-semibold text-gray-900">
                              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const nextMonth = new Date(currentMonth)
                                nextMonth.setMonth(nextMonth.getMonth() + 1)
                                setCurrentMonth(nextMonth)
                              }}
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
                            {getDaysInMonth().map((date, idx) => {
                              if (!date) return <div key={idx} />
                              
                              const isSelected = selectedDate && 
                                date.toDateString() === selectedDate.toDateString()
                              const isPast = date < new Date().setHours(0, 0, 0, 0)
                              const isToday = date.toDateString() === new Date().toDateString()
                              
                              return (
                                <button
                                  key={idx}
                                  onClick={() => !isPast && handleDateSelect(date)}
                                  disabled={isPast}
                                  className={`h-10 rounded transition-colors ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white'
                                      : isPast
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : isToday
                                      ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-600'
                                      : 'bg-white hover:bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  {date.getDate()}
                                </button>
                              )
                            })}
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
                
                {/* Debug info - remover depois */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded mb-4 text-xs" style={{ backgroundColor: '#fefce8', borderColor: '#fde047', color: '#854d0e' }}>
                    <p>Debug: Service={selectedService?.id ? 'OK' : 'MISSING'}, 
                       Professional={selectedProfessional?.id ? 'OK' : 'MISSING'}, 
                       Slot={selectedSlot?.start_time ? 'OK' : 'MISSING'}</p>
                  </div>
                )}
                
                {selectedService && selectedSlot && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
                    <p><strong>Serviço:</strong> {selectedService.name} (ID: {selectedService.id})</p>
                    <p><strong>Profissional:</strong> {selectedProfessional?.name || 'Não selecionado'}</p>
                    <p><strong>Data:</strong> {formatDate(new Date(selectedSlot.start_time))}</p>
                    <p><strong>Horário:</strong> {formatTime(selectedSlot.start_time)}</p>
                    <p><strong>Valor:</strong> {selectedService.price?.formatted || 'R$ 0,00'}</p>
                  </div>
                )}
                
                {(!selectedService || !selectedSlot) && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
                    <p className="font-semibold">Atenção: Algumas informações estão faltando</p>
                    {!selectedService && (
                      <div>
                        <p>• Serviço não selecionado</p>
                        <p className="text-xs mt-1">Debug: selectedService = {selectedService ? JSON.stringify(selectedService) : 'null/undefined'}</p>
                        <p className="text-xs">Available services: {services.map(s => s.id).join(', ')}</p>
                      </div>
                    )}
                    {!selectedProfessional && <p>• Profissional não selecionado</p>}
                    {!selectedSlot && <p>• Data e horário não selecionados</p>}
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => {
                        console.log('🔙 Going back - Current state:', {
                          selectedService,
                          selectedProfessional,
                          selectedSlot,
                          step
                        })
                    if (!selectedService) setStep(1)
                    else setStep(2)
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar para corrigir
                    </Button>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="clientName">Nome completo *</Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => {
                        setClientName(e.target.value)
                        setError(null) // Limpar erro ao digitar
                      }}
                      required
                      placeholder="Seu nome completo"
                      className={!clientName?.trim() ? 'border-red-300' : ''}
                    />
                    {!clientName?.trim() && (
                      <p className="text-xs text-red-500 mt-1">Este campo é obrigatório</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="clientPhone">WhatsApp *</Label>
                    <Input
                      id="clientPhone"
                      value={clientPhone}
                      onChange={(e) => {
                        setClientPhone(e.target.value)
                        setError(null) // Limpar erro ao digitar
                      }}
                      required
                      placeholder="(00) 00000-0000"
                      className={!clientPhone?.trim() ? 'border-red-300' : ''}
                    />
                    {!clientPhone?.trim() && (
                      <p className="text-xs text-red-500 mt-1">Este campo é obrigatório</p>
                    )}
                    {clientPhone?.trim() && clientPhone.replace(/\D/g, '').length < 10 && (
                      <p className="text-xs text-yellow-600 mt-1">Informe um número válido com DDD</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="clientEmail">E-mail (opcional)</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
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
                    className="w-full" 
                    disabled={loading || !clientName?.trim() || !clientPhone?.trim()}
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
                  {(!clientName?.trim() || !clientPhone?.trim()) && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Preencha todos os campos obrigatórios para continuar
                    </p>
                  )}
                </div>
          </form>
        )}
      </div>
    </div>
  )
}

