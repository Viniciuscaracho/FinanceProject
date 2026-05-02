import { useState, useEffect } from 'react'
import { format, addDays, addWeeks, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Loader2, Clock, User, Scissors, Phone, DollarSign, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/utils/appointmentUtils'
import {
  formatWhatsAppNumber,
  isValidWhatsAppNumber,
  validateDateTimeRange,
  calculateEndTime
} from '@/utils/appointmentUtils'
import { formatCurrency } from '@/utils/format'

const RECURRENCE_FREQUENCIES = [
  { value: 'daily',      label: 'Diária' },
  { value: 'weekly',     label: 'Semanal' },
  { value: 'biweekly',   label: 'Quinzenal' },
  { value: 'monthly',    label: 'Mensal' },
  { value: 'bimonthly',  label: 'Bimestral' },
  { value: 'quarterly',  label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual',     label: 'Anual' },
]

function calcLastOccurrenceDate(startDate, startTime, frequency, occurrences) {
  if (!startDate || !startTime || !frequency || occurrences < 2) return null
  const [h, m] = startTime.split(':').map(Number)
  let base = new Date(startDate)
  base.setHours(h, m, 0, 0)

  const advanceFns = {
    daily:      (d, n) => addDays(d, n),
    weekly:     (d, n) => addWeeks(d, n),
    biweekly:   (d, n) => addWeeks(d, n * 2),
    monthly:    (d, n) => addMonths(d, n),
    bimonthly:  (d, n) => addMonths(d, n * 2),
    quarterly:  (d, n) => addMonths(d, n * 3),
    semiannual: (d, n) => addMonths(d, n * 6),
    annual:     (d, n) => addMonths(d, n * 12),
  }

  const advance = advanceFns[frequency]
  if (!advance) return null
  return advance(base, occurrences - 1)
}

export function AppointmentForm({
  open,
  onOpenChange,
  appointment,
  initialDate,
  professionals,
  services,
  onSubmit,
  isSubmitting
}) {
  const isMobile = useIsMobile()
  const isEdit = !!appointment

  const [formData, setFormData] = useState({
    account_user_id: '',
    service_id: '',
    contact_id: '',
    start_date: undefined,
    start_time: '',
    end_date: undefined,
    end_time: '',
    whatsapp_number: '',
    price_cents: '',
    price_currency: 'BRL',
    status: 'pending',
    payment_status: 'pending'
  })

  const [errors, setErrors] = useState({})
  const [recurrence, setRecurrence] = useState({
    enabled: false,
    frequency: 'weekly',
    occurrences: 4,
  })

  // Carregar dados do appointment quando editar ou quando initialDate mudar
  useEffect(() => {
    if (appointment) {
      let startDate = undefined
      let startTime = ''
      let endDate = undefined
      let endTime = ''
      
      if (appointment.start_time) {
        const startDateObj = new Date(appointment.start_time)
        startDate = startDateObj
        startTime = format(startDateObj, 'HH:mm')
      }
      
      if (appointment.end_time) {
        const endDateObj = new Date(appointment.end_time)
        endDate = endDateObj
        endTime = format(endDateObj, 'HH:mm')
      }

      const priceCents = appointment.price?.cents || appointment.price_cents || 0
      const priceValue = priceCents > 0 ? (priceCents / 100).toString() : ''

      setFormData({
        account_user_id: appointment.professional?.id?.toString() || appointment.account_user_id?.toString() || '',
        service_id: appointment.service?.id?.toString() || appointment.service_id?.toString() || '',
        contact_id: appointment.client?.id?.toString() || appointment.contact_id?.toString() || '',
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        whatsapp_number: appointment.client?.whatsapp_number || appointment.whatsapp_number || '',
        price_cents: priceValue,
        price_currency: appointment.price?.currency || appointment.price_currency || 'BRL',
        status: appointment.status || 'pending',
        payment_status: appointment.payment_status || 'pending'
      })
    } else {
      // Se houver initialDate, usar ela, senão resetar
      const startDate = initialDate ? new Date(initialDate) : undefined
      setFormData({
        account_user_id: '',
        service_id: '',
        contact_id: '',
        start_date: startDate,
        start_time: '',
        end_date: startDate,
        end_time: '',
        whatsapp_number: '',
        price_cents: '',
        price_currency: 'BRL',
        status: 'pending',
        payment_status: 'pending'
      })
    }
    setErrors({})
    setRecurrence({ enabled: false, frequency: 'weekly', occurrences: 4 })
  }, [appointment, initialDate, open])

  // Atualizar preço quando serviço é selecionado
  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.id.toString() === serviceId)
    setFormData(prev => ({
      ...prev,
      service_id: serviceId,
      price_cents: service?.selling_price_cents ? (service.selling_price_cents / 100).toString() : prev.price_cents
    }))
  }

  // Calcular end_time quando start_time ou serviço mudar
  useEffect(() => {
    if (formData.start_date && formData.start_time && formData.service_id && !isEdit) {
      const service = services.find(s => s.id.toString() === formData.service_id)
      const duration = service?.metadata?.duration_minutes || 60
      const calculated = calculateEndTime(formData.start_date, formData.start_time, duration)
      
      if (calculated) {
        setFormData(prev => ({
          ...prev,
          end_date: calculated.endDate,
          end_time: calculated.endTime
        }))
      }
    }
  }, [formData.start_date, formData.start_time, formData.service_id, isEdit, services])

  // Sincronizar data de fim com data de início quando for o mesmo dia
  useEffect(() => {
    if (formData.start_date && !formData.end_date && !isEdit) {
      setFormData(prev => ({
        ...prev,
        end_date: prev.start_date
      }))
    }
  }, [formData.start_date, isEdit])

  // Formatar valor monetário com máscara em tempo real
  const formatCurrencyInput = (value) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '')
    
    if (!numbers) return ''
    
    // Converte para número e divide por 100 (centavos)
    const cents = parseInt(numbers, 10)
    const reais = cents / 100
    
    // Formata no padrão brasileiro: R$ 1.234,56
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const handlePriceChange = (value) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '')
    
    if (!numbers) {
      setFormData(prev => ({ ...prev, price_cents: '' }))
      return
    }
    
    // Converte para número (centavos)
    const cents = parseInt(numbers, 10)
    const reais = (cents / 100).toFixed(2)
    
    setFormData(prev => ({ ...prev, price_cents: reais }))
  }

  // Obter valor formatado para exibição
  const getFormattedPrice = () => {
    if (!formData.price_cents) return ''
    return formatCurrencyInput(formData.price_cents)
  }

  const handleWhatsAppChange = (value) => {
    const formatted = formatWhatsAppNumber(value)
    setFormData(prev => ({ ...prev, whatsapp_number: formatted }))
    
    // Validar
    if (formatted && !isValidWhatsAppNumber(formatted)) {
      setErrors(prev => ({ ...prev, whatsapp_number: 'Número de WhatsApp inválido' }))
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.whatsapp_number
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.account_user_id) {
      newErrors.account_user_id = 'Profissional é obrigatório'
    }
    if (!formData.service_id) {
      newErrors.service_id = 'Serviço é obrigatório'
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Data de início é obrigatória'
    }
    if (!formData.start_time) {
      newErrors.start_time = 'Horário de início é obrigatório'
    }
    if (!formData.end_date) {
      newErrors.end_date = 'Data de fim é obrigatória'
    }
    if (!formData.end_time) {
      newErrors.end_time = 'Horário de fim é obrigatório'
    }
    // WhatsApp é opcional, mas se preenchido, deve ser válido
    if (formData.whatsapp_number && !isValidWhatsAppNumber(formData.whatsapp_number)) {
      newErrors.whatsapp_number = 'Número de WhatsApp inválido'
    }
    if (!formData.price_cents || parseFloat(formData.price_cents) <= 0) {
      newErrors.price_cents = 'Valor deve ser maior que zero'
    }

    // Validar range de data/hora
    if (formData.start_date && formData.start_time && formData.end_date && formData.end_time) {
      const rangeValidation = validateDateTimeRange(
        formData.start_date,
        formData.start_time,
        formData.end_date,
        formData.end_time
      )
      if (!rangeValidation.valid) {
        newErrors.dateRange = rangeValidation.error
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const submitData = { ...formData }

    // Converter preço para centavos
    if (submitData.price_cents) {
      submitData.price_cents = Math.round(parseFloat(submitData.price_cents) * 100)
    }

    // Combinar data e hora
    if (submitData.start_date) {
      const date = new Date(submitData.start_date)
      const [hours = '00', minutes = '00'] = (submitData.start_time || '00:00').split(':')
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      submitData.start_time = date.toISOString()
    }
    
    if (submitData.end_date) {
      const date = new Date(submitData.end_date)
      const [hours = '00', minutes = '00'] = (submitData.end_time || '00:00').split(':')
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      submitData.end_time = date.toISOString()
    }

    // Remover campos auxiliares
    delete submitData.start_date
    delete submitData.end_date

    // Remover campos vazios
    Object.keys(submitData).forEach(key => {
      if (submitData[key] === '' || submitData[key] === null || submitData[key] === undefined) {
        delete submitData[key]
      }
    })

    // Incluir recorrência apenas em criação
    if (!isEdit && recurrence.enabled) {
      submitData.recurrence_pattern = {
        frequency: recurrence.frequency,
        occurrences: recurrence.occurrences,
      }
    }

    await onSubmit(submitData)
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent 
        className={cn(
          "max-w-2xl",
          isMobile && "max-w-full"
        )}
        side={isMobile ? "bottom" : undefined}
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className={cn(isMobile && "text-lg")}>
            {isEdit ? 'Editar Agendamento' : 'Novo Agendamento'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className={cn(isMobile && "text-sm")}>
            {isEdit 
              ? 'Atualize os dados do agendamento'
              : 'Preencha os dados para criar um novo agendamento'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form onSubmit={handleSubmit}>
            <div className={cn(
              "grid gap-6 py-4",
              isMobile && "gap-4 py-2"
            )}>
            {errors.dateRange && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errors.dateRange}
              </div>
            )}

            {/* Seção: Profissional e Serviço */}
            <div className={cn("space-y-4", isMobile && "space-y-3")}>
              <h3 className={cn(
                "text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2",
                isMobile && "text-xs"
              )}>
                <Scissors className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
                Informações do Serviço
              </h3>
              <div className={cn(
                "grid grid-cols-1 gap-4",
                !isMobile && "sm:grid-cols-2"
              )}>
                <div className="space-y-2">
                  <Label htmlFor="professional" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profissional *
                  </Label>
                  <Select
                    value={formData.account_user_id}
                    onValueChange={(value) => setFormData({ ...formData, account_user_id: value })}
                    required
                  >
                    <SelectTrigger className={cn(
                      "h-11",
                      errors.account_user_id && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}>
                      <SelectValue placeholder="Selecione o profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id.toString()}>
                          {prof.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.account_user_id && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.account_user_id}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service" className="flex items-center gap-2">
                    <Scissors className="h-4 w-4" />
                    Serviço *
                  </Label>
                  <Select
                    value={formData.service_id}
                    onValueChange={handleServiceChange}
                    required
                  >
                    <SelectTrigger className={cn(
                      "h-11",
                      errors.service_id && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}>
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{service.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatCurrency(service.selling_price_cents || 0)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.service_id && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.service_id}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Seção: Data e Horário */}
            <div className={cn("space-y-4", isMobile && "space-y-3")}>
              <h3 className={cn(
                "text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2",
                isMobile && "text-xs"
              )}>
                <Clock className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
                Data e Horário
              </h3>
              
              {/* Data e Hora de Início - Combinados */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Início *
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11",
                          !formData.start_date && "text-muted-foreground",
                          errors.start_date && "border-red-500 focus:border-red-500 focus:ring-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? (
                          format(formData.start_date, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span className="text-muted-foreground">Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => {
                          setFormData(prev => ({ 
                            ...prev, 
                            start_date: date,
                            end_date: date // Sincronizar data de fim
                          }))
                        }}
                        locale={ptBR}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <div className="space-y-1">
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => {
                          const time = e.target.value
                          setFormData(prev => ({ ...prev, start_time: time }))
                        }}
                        required
                        className={cn(
                          "h-11 pl-10 text-base",
                          errors.start_time && "border-red-500 focus:border-red-500 focus:ring-red-500"
                        )}
                        step="300"
                        title="Formato: HH:MM (ex: 09:00, 14:30)"
                      />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, start_time: '08:00' }))}
                      >
                        08:00
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, start_time: '08:30' }))}
                      >
                        08:30
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, start_time: '09:00' }))}
                      >
                        09:00
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, start_time: '09:30' }))}
                      >
                        09:30
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, start_time: '10:00' }))}
                      >
                        10:00
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, start_time: '10:30' }))}
                      >
                        10:30
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, start_time: '14:00' }))}
                      >
                        14:00
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, start_time: '14:30' }))}
                      >
                        14:30
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, start_time: '15:00' }))}
                      >
                        15:00
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, start_time: '15:30' }))}
                      >
                        15:30
                      </Button>
                    </div>
                  </div>
                </div>
                {(errors.start_date || errors.start_time) && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.start_date || errors.start_time}
                  </p>
                )}
              </div>

              {/* Data e Hora de Fim - Combinados */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Fim *
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11",
                          !formData.end_date && "text-muted-foreground",
                          errors.end_date && "border-red-500 focus:border-red-500 focus:ring-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.end_date ? (
                          format(formData.end_date, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span className="text-muted-foreground">Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.end_date}
                        onSelect={(date) => setFormData({ ...formData, end_date: date })}
                        locale={ptBR}
                        initialFocus
                        disabled={(date) => formData.start_date && date < formData.start_date}
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <div className="space-y-1">
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => {
                          const time = e.target.value
                          setFormData(prev => ({ ...prev, end_time: time }))
                        }}
                        required
                        className={cn(
                          "h-11 pl-10 text-base",
                          errors.end_time && "border-red-500 focus:border-red-500 focus:ring-red-500"
                        )}
                        step="300"
                        title="Formato: HH:MM (ex: 09:00, 14:30)"
                      />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, end_time: '10:00' }))}
                      >
                        10:00
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, end_time: '10:30' }))}
                      >
                        10:30
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, end_time: '11:00' }))}
                      >
                        11:00
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, end_time: '11:30' }))}
                      >
                        11:30
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, end_time: '12:00' }))}
                      >
                        12:00
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, end_time: '12:30' }))}
                      >
                        12:30
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, end_time: '16:00' }))}
                      >
                        16:00
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, end_time: '16:30' }))}
                      >
                        16:30
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, end_time: '17:00' }))}
                      >
                        17:00
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFormData(prev => ({ ...prev, end_time: '17:30' }))}
                      >
                        17:30
                      </Button>
                    </div>
                  </div>
                </div>
                {(errors.end_date || errors.end_time) && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.end_date || errors.end_time}
                  </p>
                )}
              </div>
            </div>

            {/* Seção: Repetir Agendamento */}
            {!isEdit && (
              <div className={cn("space-y-4", isMobile && "space-y-3")}>
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    "text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2",
                    isMobile && "text-xs"
                  )}>
                    <RefreshCw className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
                    Repetir Agendamento
                  </h3>
                  <Switch
                    checked={recurrence.enabled}
                    onCheckedChange={(checked) =>
                      setRecurrence(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>

                {recurrence.enabled && (
                  <div className="space-y-4 pl-1">
                    <div className={cn(
                      "grid grid-cols-1 gap-4",
                      !isMobile && "sm:grid-cols-2"
                    )}>
                      <div className="space-y-2">
                        <Label>Frequência</Label>
                        <Select
                          value={recurrence.frequency}
                          onValueChange={(v) => setRecurrence(prev => ({ ...prev, frequency: v }))}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RECURRENCE_FREQUENCIES.map(f => (
                              <SelectItem key={f.value} value={f.value}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Número de sessões (1–24)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={24}
                          value={recurrence.occurrences}
                          onChange={(e) => {
                            const val = Math.min(24, Math.max(1, parseInt(e.target.value) || 1))
                            setRecurrence(prev => ({ ...prev, occurrences: val }))
                          }}
                          className="h-11"
                        />
                      </div>
                    </div>

                    {formData.start_date && formData.start_time && (() => {
                      const lastDate = calcLastOccurrenceDate(
                        formData.start_date,
                        formData.start_time,
                        recurrence.frequency,
                        recurrence.occurrences
                      )
                      const freqLabel = RECURRENCE_FREQUENCIES.find(f => f.value === recurrence.frequency)?.label || ''
                      return lastDate ? (
                        <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2">
                          {recurrence.occurrences} agendamentos ({freqLabel.toLowerCase()}), de{' '}
                          <strong>{format(formData.start_date, 'dd/MM/yyyy', { locale: ptBR })}</strong> até{' '}
                          <strong>{format(lastDate, 'dd/MM/yyyy', { locale: ptBR })}</strong>
                        </p>
                      ) : null
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Seção: Cliente e Valor */}
            <div className={cn("space-y-4", isMobile && "space-y-3")}>
              <h3 className={cn(
                "text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2",
                isMobile && "text-xs"
              )}>
                <User className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
                Cliente e Pagamento
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  WhatsApp do Cliente
                  <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="whatsapp_number"
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={formData.whatsapp_number}
                    onChange={(e) => handleWhatsAppChange(e.target.value)}
                    className={cn(
                      "h-11 pl-10",
                      errors.whatsapp_number && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                  />
                </div>
                {errors.whatsapp_number && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.whatsapp_number}
                  </p>
                )}
                {!errors.whatsapp_number && (
                  <p className="text-xs text-muted-foreground">
                    Informe o WhatsApp para facilitar o contato com o cliente
                  </p>
                )}
              </div>

              <div className={cn(
                "grid grid-cols-1 gap-4",
                !isMobile && "sm:grid-cols-2"
              )}>
                <div className="space-y-2">
                  <Label htmlFor="price_cents" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Valor (R$) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium pointer-events-none z-10">
                      R$
                    </span>
                    <Input
                      id="price_cents"
                      type="text"
                      placeholder="0,00"
                      value={getFormattedPrice()}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      required
                      className={cn(
                        "h-11 pl-12 text-base",
                        errors.price_cents && "border-red-500 focus:border-red-500 focus:ring-red-500"
                      )}
                      inputMode="decimal"
                    />
                  </div>
                  {errors.price_cents && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.price_cents}
                    </p>
                  )}
                  {formData.service_id && !errors.price_cents && formData.price_cents && (
                    <p className="text-xs text-muted-foreground">
                      Valor sugerido do serviço selecionado
                    </p>
                  )}
                  {!formData.price_cents && (
                    <p className="text-xs text-muted-foreground">
                      Digite apenas números (ex: 30 ou 30,50)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status do Agendamento</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <ResponsiveDialogFooter className={cn(
            isMobile && "flex-col gap-2 sticky bottom-0 bg-background pt-4 border-t"
          )}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className={cn(isMobile && "w-full")}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className={cn(isMobile && "w-full")}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}


