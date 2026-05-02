import { useState, useEffect, useMemo, useCallback, useRef, startTransition, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard, FluidSection } from '@/components/design'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  RefreshCw,
  ExternalLink,
  Phone,
  Plus,
  Edit,
  Trash2,
  Download,
  CalendarDays
} from 'lucide-react'
import { apiService } from '../lib/api'
import { format, parse, isSameMonth, isSameDay, addDays, getDay, startOfWeek, isToday, addMonths, subMonths, startOfMonth, endOfMonth, startOfDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../styles/calendar.css'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { TrendingUp, Percent, BarChart3, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useAppointments, useAppointmentResources } from '@/hooks/useAppointments'
import { AppointmentForm } from '@/components/appointments/AppointmentForm'
import { AppointmentsCalendar } from '@/components/appointments/AppointmentsCalendar'
import { AppointmentsFilters } from '@/components/appointments/AppointmentsFilters'
import { AppointmentsStats } from '@/components/appointments/AppointmentsStats'
import { AppointmentsTable } from '@/components/appointments/AppointmentsTable'
import { AppointmentsProvider, useAppointmentsContext } from '@/contexts/AppointmentsContext'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_OPTIONS,
  normalizeStatus,
  normalizePaymentStatus,
  resolveStatus,
  getClientName,
} from '@/utils/appointmentUtils'
import { formatCurrency } from '@/utils/format'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CalendarTooltip } from '@/components/appointments/CalendarTooltip'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ConsultationModal } from '@/components/appointments/ConsultationModal'

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']

// Localizer para react-big-calendar
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'pt-BR': ptBR }
})

// Componente customizado para renderizar eventos - Versão completamente reescrita
const EventComponent = memo(({ event, view }) => {
  const apt = event.appointment
  if (!apt) {
    return (
      <div style={{ 
        padding: '8px', 
        backgroundColor: event.style?.backgroundColor || '#6b7280',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '13px'
      }}>
        {event.title || 'Agendamento'}
      </div>
    )
  }
  
  const clientName = apt?.client?.name || apt?.client?.whatsapp_number || 'Cliente'
  const serviceName = apt?.service?.name || 'Serviço'
  const startTime = format(new Date(event.start), 'HH:mm', { locale: ptBR })
  const endTime = format(new Date(event.end), 'HH:mm', { locale: ptBR })
  const status = event.status || 'pending'
  const bgColor = event.style?.backgroundColor || '#6b7280'
  
  // Para visualização mensal - Design simples e compacto (padrão Google Calendar)
  if (view === 'month' || view === Views.MONTH) {
    // Truncar nomes para caber no espaço
    const shortClientName = clientName.length > 18 ? clientName.substring(0, 18) + '...' : clientName
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            style={{
              padding: '2px 6px',
              backgroundColor: bgColor,
              color: '#ffffff',
              borderRadius: '3px',
              fontSize: '11px',
              fontWeight: '500',
              lineHeight: '1.3',
              cursor: 'pointer',
              borderLeft: `3px solid rgba(255,255,255,0.5)`,
              marginBottom: '1px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              boxSizing: 'border-box',
              display: 'block'
            }}
          >
            <span style={{ fontWeight: '600', marginRight: '4px' }}>{startTime}</span>
            {shortClientName}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="p-0 border-0 bg-transparent shadow-none max-w-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
            <CalendarTooltip appointment={apt} />
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }
  
  // Para visualizações semana/dia - Design moderno e elegante
  const displayClientName = clientName.length > 20 ? clientName.substring(0, 20) + '...' : clientName
  const displayServiceName = serviceName.length > 30 ? serviceName.substring(0, 30) + '...' : serviceName
  
  // Criar gradiente sutil baseado na cor
  const getGradient = (color) => {
    const colorMap = {
      '#f59e0b': 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
      '#10b981': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      '#3b82f6': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      '#ef4444': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      '#6b7280': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
    }
    return colorMap[color] || `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
  }
  
  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '80px',
      padding: '12px 14px',
      background: getGradient(bgColor),
      color: '#ffffff',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
      borderLeft: `4px solid rgba(255,255,255,0.3)`,
      borderTop: `1px solid rgba(255,255,255,0.2)`,
      overflow: 'hidden',
      position: 'relative',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer'
    }}>
      {/* Efeito de brilho sutil */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        pointerEvents: 'none'
      }}></div>
      
      {/* Linha do horário */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '2px'
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          flexShrink: 0,
          boxShadow: '0 0 0 2px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.2)'
        }}></div>
        <span style={{
          fontSize: '11px',
          fontWeight: '600',
          letterSpacing: '0.3px',
          opacity: 0.95,
          textTransform: 'uppercase',
          fontFamily: 'Inter, sans-serif'
        }}>
          {startTime} - {endTime}
        </span>
      </div>
      
      {/* Nome do cliente */}
      <div style={{
        fontSize: '16px',
        fontWeight: '700',
        lineHeight: '1.4',
        marginBottom: '4px',
        textShadow: '0 1px 3px rgba(0,0,0,0.3)',
        letterSpacing: '-0.01em',
        fontFamily: 'Inter, sans-serif'
      }}>
        {displayClientName}
      </div>
      
      {/* Nome do serviço */}
      <div style={{
        fontSize: '13px',
        fontWeight: '500',
        lineHeight: '1.4',
        opacity: 0.9,
        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        fontFamily: 'Inter, sans-serif'
      }}>
        {displayServiceName}
      </div>
    </div>
  )
})

// Pure date helpers — defined outside component to avoid re-creation on each render
const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR })
}

// Componente de Calendário (legado - não usado mais, mantido para referência)
// Renomeado para evitar conflito com o componente importado
function AppointmentsCalendarLegacy({ appointments, professionals, selectedProfessional, onEventClick, onSelectSlot }) {
  const isMobile = useIsMobile()
  const [view, setView] = useState(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const wheelScrollAccumulator = useRef(0) // Acumulador de scroll para mudança de mês
  const lastMonthChangeTime = useRef(0) // Timestamp da última mudança de mês
  
  // Estado para o sidebar de eventos do dia
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayEvents, setDayEvents] = useState([])
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false)
  
  // Log quando o Sheet é aberto
  useEffect(() => {
    if (isDaySheetOpen) {
      console.log('📋 ========== SHEET ABERTO ==========')
      console.log('📅 Data selecionada:', selectedDay ? format(selectedDay, 'dd/MM/yyyy') : 'N/A')
      console.log('📊 Total de eventos:', dayEvents.length)
      console.log('📋 Primeiros 5 eventos:', dayEvents.slice(0, 5).map(e => ({
        id: e.id,
        title: e.title,
        start: e.start?.toString(),
        appointment: e.appointment ? 'Sim' : 'Não'
      })))
      console.log('📋 ========== FIM SHEET ==========')
    }
  }, [isDaySheetOpen, selectedDay, dayEvents])
  
  // Calcular meses para navegação (anterior, atual, próximo)
  const prevMonth = useMemo(() => subMonths(date, 1), [date])
  const nextMonth = useMemo(() => addMonths(date, 1), [date])
  
  // Resetar acumulador quando a data mudar
  useEffect(() => {
    wheelScrollAccumulator.current = 0
    lastMonthChangeTime.current = Date.now()
  }, [date])
  
  // Suporte a gestos touch/swipe
  const handleTouchStart = useCallback((e) => {
    if (view === Views.MONTH) {
      touchStartX.current = e.touches[0].clientX
    }
  }, [view])
  
  const handleTouchEnd = useCallback((e) => {
    if (view !== Views.MONTH) return
    
    touchEndX.current = e.changedTouches[0].clientX
    const swipeDistance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50 // Mínimo de 50px para considerar swipe
    
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe para esquerda = mês anterior (passado)
        setDate(prevMonth)
      } else {
        // Swipe para direita = próximo mês (futuro)
        setDate(nextMonth)
      }
    }
  }, [view, prevMonth, nextMonth])

  // Memoizar filtro de appointments para performance
  const filteredAppointments = useMemo(() => {
    return selectedProfessional !== 'all'
      ? appointments.filter(apt => {
          const profId = apt.professional?.id?.toString() || apt.account_user_id?.toString()
          return profId === selectedProfessional
        })
      : appointments
  }, [appointments, selectedProfessional])

  // Determinar se devemos usar recursos na visualização de dia (precisa ser antes de events)
  const shouldUseResources = useMemo(() => {
    if (view !== Views.DAY || isMobile || professionals.length === 0) {
      return false
    }
    
    const resourceIds = professionals.map(p => p.id.toString())
    const selectedDayStr = format(date, 'yyyy-MM-dd')
    
    // Verificar se há appointments do dia com profissionais válidos
    const appointmentsForDay = filteredAppointments.filter(apt => {
      if (!apt.start_time) return false
      const aptDayStr = format(new Date(apt.start_time), 'yyyy-MM-dd')
      return aptDayStr === selectedDayStr
    })
    
    if (appointmentsForDay.length === 0) {
      return false
    }
    
    // Verificar se todos os appointments têm profissional válido
    const allHaveValidProfessional = appointmentsForDay.every(apt => {
      const profId = apt.professional?.id?.toString() || apt.account_user_id?.toString()
      return profId && resourceIds.includes(profId)
    })
    
    return allHaveValidProfessional
  }, [view, date, filteredAppointments, professionals, isMobile])

  // Converter agendamentos para eventos do calendário (memoizado para performance)
  const events = useMemo(() => {
    let appointmentsToUse = filteredAppointments
    
    // Na visualização de dia, filtrar apenas eventos do dia selecionado
    if (view === Views.DAY) {
      const selectedDayStr = format(date, 'yyyy-MM-dd')
      appointmentsToUse = filteredAppointments.filter(apt => {
        if (!apt.start_time) return false
        const aptDayStr = format(new Date(apt.start_time), 'yyyy-MM-dd')
        return aptDayStr === selectedDayStr
      })
      console.log('📅 Visualização DIA - Filtrando eventos para:', {
        selectedDay: selectedDayStr,
        totalAppointments: filteredAppointments.length,
        filteredForDay: appointmentsToUse.length,
        shouldUseResources: shouldUseResources
      })
    }
    
    const validAppointments = appointmentsToUse.filter(apt => apt.start_time && apt.end_time)
    
    console.log('🔄 ========== CONVERSÃO DE APPOINTMENTS ==========')
    console.log('📊 Estatísticas:', {
      totalAppointments: filteredAppointments.length,
      appointmentsToUse: appointmentsToUse.length,
      withDates: validAppointments.length,
      currentDate: date,
      currentMonth: format(date, 'yyyy-MM'),
      currentDay: format(date, 'yyyy-MM-dd'),
      view: view
    })
    
    if (validAppointments.length > 0) {
      console.log('📅 Primeiros 5 appointments:', validAppointments.slice(0, 5).map(apt => ({
        id: apt.id,
        start_time: apt.start_time,
        end_time: apt.end_time,
        client: apt.client?.name || apt.client?.whatsapp_number,
        parsedStart: new Date(apt.start_time).toString(),
        parsedEnd: new Date(apt.end_time).toString(),
        month: format(new Date(apt.start_time), 'yyyy-MM'),
        day: format(new Date(apt.start_time), 'dd')
      })))
    }
    
    const mappedEvents = validAppointments
      .map(apt => {
        const status = normalizeStatus(apt.status)
      
        // Cores baseadas no status - mais vibrantes e contrastantes
        const statusColorMap = {
          pending: '#f59e0b',      // amarelo/laranja
          confirmed: '#10b981',    // verde
          completed: '#3b82f6',    // azul
          canceled: '#ef4444',     // vermelho
          no_show: '#6b7280'       // cinza
        }

        // Converter string de data para objeto Date usando parseISO para garantir parsing correto
        // parseISO trata corretamente strings ISO com ou sem timezone
        let startDate
        let endDate
        
        try {
          // Tentar usar parseISO primeiro (melhor para strings ISO)
          startDate = parseISO(apt.start_time)
          endDate = parseISO(apt.end_time)
        } catch (e) {
          // Fallback para new Date se parseISO falhar
          startDate = new Date(apt.start_time)
          endDate = new Date(apt.end_time)
        }

        // Validar datas
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn('⚠️ Data inválida para appointment:', apt.id, apt.start_time, apt.end_time)
          return null
        }

        const bgColor = statusColorMap[status] || '#6b7280'
        
        // Para visualização mensal, usar as datas originais mas garantir que estejam no timezone local
        // O BigCalendar precisa das datas no formato correto para renderizar
        // Não converter para 00:00-23:59, manter os horários originais
        const eventStart = startDate
        const eventEnd = endDate
        
        // Log detalhado para debug (apenas para visualização mensal e dia)
        if (view === Views.MONTH || view === Views.DAY) {
          const eventDay = format(startDate, 'yyyy-MM-dd')
          const currentMonthStr = format(date, 'yyyy-MM')
          const eventMonth = format(startDate, 'yyyy-MM')
          
          if (view === Views.DAY) {
            console.log(`📅 Evento ${apt.id} na visualização DIA:`, {
              appointmentId: apt.id,
              originalStartTime: apt.start_time,
              parsedStartDate: startDate.toString(),
              eventStart: eventStart.toString(),
              eventEnd: eventEnd.toString(),
              startTime: format(startDate, 'HH:mm'),
              endTime: format(endDate, 'HH:mm'),
              client: apt.client?.name || apt.client?.whatsapp_number,
              service: apt.service?.name,
              status: status
            })
          }
        }
        
        // Determinar o resource do evento apenas se vamos usar recursos
        // Se não vamos usar recursos, não definir o campo resource
        let eventResource = undefined
        if (shouldUseResources) {
          if (apt.professional?.id) {
            eventResource = apt.professional.id.toString()
          } else if (apt.account_user_id) {
            eventResource = apt.account_user_id.toString()
          }
        }
        
        const eventObj = {
          id: apt.id,
          title: `${apt.client?.name || apt.client?.whatsapp_number || 'Cliente'} - ${apt.service?.name || 'Serviço'}`,
          start: eventStart,
          end: eventEnd,
          appointment: apt,
          status: status,
          style: {
            backgroundColor: bgColor,
            borderColor: bgColor,
            color: '#ffffff',
            borderLeft: `5px solid ${bgColor}`,
            fontWeight: '600',
            minWidth: '100px'
          }
        }
        
        // Só adicionar resource se vamos usar recursos
        if (eventResource) {
          eventObj.resource = eventResource
        }
        
        return eventObj
      })
      .filter(Boolean) // Remover nulls
    
    // Log final com estatísticas dos eventos criados
    console.log('✅ ========== ESTATÍSTICAS DOS EVENTOS ==========')
    console.log('📊 Total de eventos criados:', mappedEvents.length)
    
    const eventsByMonth = mappedEvents.reduce((acc, evt) => {
      const month = format(evt.start, 'yyyy-MM')
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {})
    console.log('📅 Eventos por mês:', eventsByMonth)
    
    const eventsByDay = mappedEvents.reduce((acc, evt) => {
      const day = format(evt.start, 'yyyy-MM-dd')
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {})
    console.log('📆 Eventos por dia (primeiros 10):', Object.entries(eventsByDay).slice(0, 10))
    
    const currentMonthStr = format(date, 'yyyy-MM')
    const eventsInCurrentMonth = mappedEvents.filter(evt => 
      format(evt.start, 'yyyy-MM') === currentMonthStr
    )
    console.log('🎯 Eventos no mês atual:', {
      currentMonth: currentMonthStr,
      count: eventsInCurrentMonth.length,
      events: eventsInCurrentMonth.map(evt => ({
        id: evt.id,
        day: format(evt.start, 'dd'),
        title: evt.title
      }))
    })
    
    // Log de dias com muitos eventos
    const daysWithManyEvents = Object.entries(eventsByDay)
      .filter(([day, count]) => count > 3)
      .map(([day, count]) => {
        const dayEvents = mappedEvents.filter(evt => format(evt.start, 'yyyy-MM-dd') === day)
        return { 
          day, 
          count, 
          eventIds: dayEvents.map(e => e.id),
          events: dayEvents.map(e => ({ id: e.id, title: e.title }))
        }
      })
    
    if (daysWithManyEvents.length > 0) {
      console.log('⚠️ Dias com muitos eventos (>3):', daysWithManyEvents)
      console.log('📋 Detalhes dos dias com muitos eventos:')
      daysWithManyEvents.forEach(({ day, count, events }) => {
        console.log(`  - ${day}: ${count} eventos`, events)
      })
    }
    
    // Log específico para visualização de dia
    if (view === Views.DAY) {
      const selectedDayStr = format(date, 'yyyy-MM-dd')
      const eventsForDay = mappedEvents.filter(evt => format(evt.start, 'yyyy-MM-dd') === selectedDayStr)
      console.log('📅 ========== EVENTOS PARA O DIA SELECIONADO ==========')
      console.log('📆 Dia:', selectedDayStr)
      console.log('📊 Total de eventos para este dia:', eventsForDay.length)
      console.log('📋 Eventos ordenados por horário:', eventsForDay
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .map(evt => ({
          id: evt.id,
          title: evt.title,
          start: format(evt.start, 'HH:mm'),
          end: format(evt.end, 'HH:mm'),
          resource: evt.resource,
          hasResource: !!evt.resource,
          startFull: evt.start.toString()
        }))
      )
      
      // Verificar quantos eventos têm resource válido
      const resourceIds = professionals.map(p => p.id.toString())
      const eventsWithValidResource = eventsForDay.filter(evt => 
        evt.resource && resourceIds.includes(evt.resource)
      )
      const eventsWithoutResource = eventsForDay.filter(evt => !evt.resource)
      const eventsWithInvalidResource = eventsForDay.filter(evt => 
        evt.resource && !resourceIds.includes(evt.resource)
      )
      
      console.log('✅ Eventos com resource válido:', eventsWithValidResource.length)
      console.log('❌ Eventos sem resource:', eventsWithoutResource.length)
      console.log('⚠️ Eventos com resource inválido:', eventsWithInvalidResource.length)
      
      console.log('📅 ========== FIM EVENTOS DO DIA ==========')
    }
    
    console.log('✅ ========== FIM DAS ESTATÍSTICAS ==========')
    
    return mappedEvents
  }, [filteredAppointments, view, date, shouldUseResources])
  
  // Debug: log dos eventos criados
  useEffect(() => {
    const currentMonthStr = format(date, 'yyyy-MM')
    const eventsInCurrentMonth = events.filter(evt => {
      const evtMonth = format(evt.start, 'yyyy-MM')
      return evtMonth === currentMonthStr
    })
    
    // Agrupar eventos por dia
    const eventsByDay = eventsInCurrentMonth.reduce((acc, evt) => {
      const day = format(evt.start, 'yyyy-MM-dd')
      if (!acc[day]) acc[day] = []
      acc[day].push(evt)
      return acc
    }, {})
    
    const daysWithMultipleEvents = Object.entries(eventsByDay)
      .filter(([day, evts]) => evts.length > 3)
      .map(([day, evts]) => ({ day, count: evts.length }))
    
    console.log('📅 Events criados:', {
      total: events.length,
      currentMonth: currentMonthStr,
      eventsInCurrentMonth: eventsInCurrentMonth.length,
      eventsInOtherMonths: events.length - eventsInCurrentMonth.length,
      daysWithEvents: Object.keys(eventsByDay).length,
      daysWithMultipleEvents: daysWithMultipleEvents,
      sampleEvents: events.slice(0, 5).map(evt => ({
        id: evt.id,
        title: evt.title,
        start: evt.start.toISOString(),
        end: evt.end.toISOString(),
        month: format(evt.start, 'yyyy-MM'),
        day: format(evt.start, 'dd')
      })),
      allMonths: [...new Set(events.map(evt => format(evt.start, 'yyyy-MM')))].sort()
    })
    
    if (eventsInCurrentMonth.length === 0 && events.length > 0) {
      const otherMonths = [...new Set(events.map(evt => format(evt.start, 'yyyy-MM')))].sort()
      console.warn('⚠️ Nenhum evento no mês atual!', {
        currentMonth: currentMonthStr,
        eventsInOtherMonths: otherMonths,
        totalEvents: events.length,
        message: `Os ${events.length} eventos estão em outros meses. Navegue para um dos meses: ${otherMonths.join(', ')}`
      })
    }
    
    if (daysWithMultipleEvents.length > 0) {
      console.warn('⚠️ Alguns dias têm muitos eventos (pode estar limitado pelo BigCalendar):', daysWithMultipleEvents)
    }
  }, [events, date])

  // Recursos (profissionais) para visualização por recurso
  const resources = professionals.map(prof => ({
    id: prof.id.toString(),
    title: prof.name
  }))

  // Mensagens em português
  const messages = {
    allDay: 'Dia inteiro',
    previous: 'Anterior',
    next: 'Próximo',
    today: 'Hoje',
    month: 'Mês',
    day: 'Dia',
    date: 'Data',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Não há agendamentos neste período.',
    showMore: total => `+ Ver mais ${total}`
  }

  // Formatação de eventos - Design simples para mês, moderno para semana/dia
  const eventStyleGetter = (event, start, end, isSelected) => {
    const status = event.status || 'pending'
    const isCanceled = status === 'canceled'
    const bgColor = event.style?.backgroundColor || '#6b7280'
    
    // Para visualização mensal, estilo simples e compacto
    if (view === Views.MONTH) {
      return {
        style: {
          backgroundColor: bgColor,
          borderColor: bgColor,
          color: '#ffffff',
          borderLeft: `3px solid rgba(255,255,255,0.5)`,
          borderRadius: '3px',
          padding: '2px 6px',
          fontSize: '11px',
          opacity: isCanceled ? 0.6 : 1,
          cursor: 'pointer',
          boxShadow: isCanceled 
            ? '0 1px 2px rgba(0,0,0,0.1)' 
            : isSelected
            ? '0 0 0 2px rgba(59, 130, 246, 0.3)'
            : '0 1px 2px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          display: 'block',
          fontWeight: '500',
          zIndex: isSelected ? 20 : 2,
          margin: '1px 0',
          width: '100%',
          position: 'relative'
        },
        className: `rbc-event-custom rbc-event-${status} ${isSelected ? 'rbc-selected' : ''}`
      }
    }
    
    // Para visualizações semana/dia - Design moderno e elegante
    const duration = (end - start) / (1000 * 60) // duração em minutos
    const minHeight = Math.max(80, duration * 1.3) // ~1.3px por minuto, mínimo 80px
    
    // Criar gradiente sutil
    const getGradient = (color) => {
      const colorMap = {
        '#f59e0b': 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
        '#10b981': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        '#3b82f6': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        '#ef4444': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        '#6b7280': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
      }
      return colorMap[color] || `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
    }
    
    return {
      style: {
        background: getGradient(bgColor),
        borderColor: 'transparent',
        color: '#ffffff',
        borderLeft: `5px solid rgba(255,255,255,0.5)`,
        borderRadius: '12px',
        border: '2px solid rgba(255,255,255,0.2)',
        padding: '8px 12px',
        fontSize: '14px',
        minHeight: `${minHeight}px`,
        opacity: isCanceled ? 0.7 : 1,
        cursor: 'pointer',
        boxShadow: isCanceled 
          ? '0 4px 12px rgba(0,0,0,0.25)' 
          : isSelected
          ? '0 12px 32px rgba(0,0,0,0.35), 0 0 0 4px rgba(59, 130, 246, 0.4)'
          : '0 6px 20px rgba(0,0,0,0.25), 0 3px 8px rgba(0,0,0,0.15)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        fontWeight: '700',
        zIndex: isSelected ? 20 : 2,
        margin: '4px 6px',
        width: 'calc(100% - 12px)',
        position: 'relative',
        transform: isSelected ? 'scale(1.03)' : 'scale(1)',
        textShadow: '0 1px 3px rgba(0,0,0,0.3)'
      },
      className: `rbc-event-custom rbc-event-${status} ${isSelected ? 'rbc-selected' : ''}`
    }
  }

  // Formatação de slots de tempo
  const slotPropGetter = (date) => {
    const hour = date.getHours()
    const isBusinessHours = hour >= 8 && hour < 20
    return {
      className: isBusinessHours ? 'rbc-business-hour' : 'rbc-off-hours'
    }
  }

  // Renderizar calendário para um mês específico
  const renderMonthCalendar = (monthDate, isVisible = true) => {
    const monthStr = format(monthDate, 'yyyy-MM')
    const eventsForMonth = events.filter(evt => {
      try {
        const evtMonth = format(evt.start, 'yyyy-MM')
        return evtMonth === monthStr
      } catch (e) {
        console.error('Erro ao filtrar evento por mês:', e, evt)
        return false
      }
    })
    
    console.log('📅 ========== RENDERIZANDO CALENDÁRIO ==========')
    console.log('📊 BigCalendar recebendo:', {
      month: monthStr,
      monthDate: monthDate.toString(),
      totalEvents: events.length,
      eventsForThisMonth: eventsForMonth.length,
      isVisible: isVisible,
      view: view,
      sampleEvents: eventsForMonth.slice(0, 5).map(evt => ({
        id: evt.id,
        day: format(evt.start, 'dd'),
        title: evt.title,
        start: evt.start?.toString(),
        end: evt.end?.toString(),
        startType: typeof evt.start,
        isDate: evt.start instanceof Date
      })),
      allEventMonths: [...new Set(events.map(e => {
        try {
          return format(e.start, 'yyyy-MM')
        } catch (err) {
          return 'ERROR'
        }
      }))].sort()
    })
    console.log('📅 ========== FIM DO RENDER ==========')
    
    return (
      <div 
        key={format(monthDate, 'yyyy-MM')}
        className={cn(
          "flex-shrink-0 w-full h-full",
          !isVisible && "pointer-events-none"
        )}
        style={{ minWidth: '100%' }}
      >
        <BigCalendar
          localizer={localizer}
          events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%', minHeight: view === Views.DAY ? '800px' : '600px' }}
        view={view}
        onView={(newView) => {
          console.log('🔄 Mudando visualização:', { from: view, to: newView, date: date.toString() })
          setView(newView)
        }}
        date={view === Views.DAY ? date : monthDate}
        onNavigate={(newDate) => {
          if (isVisible) {
            console.log('📅 Navegando para:', { newDate: newDate.toString(), view, isVisible })
            setDate(newDate)
          }
        }}
        messages={messages}
        onShowMore={(events, date) => {
          console.log('📅 BigCalendar montado/atualizado:', {
            eventsCount: events.length,
            view: view,
            date: monthDate.toString(),
            eventsSample: events.slice(0, 3).map(e => ({
              id: e.id,
              title: e.title,
              start: e.start?.toString(),
              end: e.end?.toString()
            }))
          })
          console.log('🔍 BigCalendar onShowMore chamado:', {
            date: date.toString(),
            eventsCount: events.length,
            events: events.map(e => ({ id: e.id, title: e.title, start: e.start.toString() }))
          })
        }}
        eventPropGetter={eventStyleGetter}
        slotPropGetter={slotPropGetter}
        onSelectEvent={onEventClick}
        onSelectSlot={onSelectSlot}
        selectable={true}
        toolbar={isVisible}
        components={{
          event: (props) => {
            try {
              // Na visualização de dia, sempre renderizar eventos
              if (view === Views.DAY) {
                console.log('📅 Renderizando evento na visualização de DIA:', {
                  id: props.event.id,
                  title: props.event.title,
                  start: props.event.start?.toString(),
                  end: props.event.end?.toString(),
                  view: view
                })
                return <EventComponent {...props} view={view} />
              }
              
              // Na visualização mensal, não renderizar (o indicador já mostra)
              if (view === Views.MONTH) {
                return null
              }
              
              // Para outras visualizações, renderizar normalmente
              return <EventComponent {...props} view={view} />
            } catch (error) {
              console.error('Error rendering event:', error, props)
              // Fallback robusto para renderização padrão
              return (
                <div style={{ 
                  padding: '2px 6px', 
                  backgroundColor: props.event.style?.backgroundColor || '#6b7280',
                  color: '#ffffff', 
                  fontSize: '11px',
                  fontWeight: '500',
                  borderRadius: '3px',
                  borderLeft: '3px solid rgba(255,255,255,0.5)'
                }}>
                  {props.event.title || 'Agendamento'}
                </div>
              )
            }
          },
          eventWrapper: (props) => {
            // Filtrar props que não devem ir para o DOM
            const { continuesPrior, continuesAfter, slotStart, slotEnd, ...domProps } = props
            return <div {...domProps} style={{ ...props.style, display: 'block', visibility: 'visible', opacity: 1 }} />
          },
          month: {
            dateCellWrapper: (props) => {
              // Renderizar todos os eventos do dia sem limite
              // O BigCalendar passa a data como 'value' ou 'date'
              const cellDate = props.value || props.date
              
              if (!cellDate) {
                return <div {...props}>{props.children}</div>
              }
              
              const eventsForDay = events.filter(evt => {
                try {
                  const evtDate = format(evt.start, 'yyyy-MM-dd')
                  const cellDateStr = format(cellDate, 'yyyy-MM-dd')
                  return evtDate === cellDateStr
                } catch (e) {
                  return false
                }
              })
              
              // Se houver eventos, mostrar apenas um indicador e esconder os eventos do BigCalendar
              const hasEvents = eventsForDay.length > 0
              
              return (
                <div 
                  {...props} 
                  className="rbc-date-cell"
                  style={{ 
                    ...props.style, 
                    position: 'relative',
                    minHeight: '120px',
                    height: 'auto',
                    padding: '4px',
                    overflow: 'visible'
                  }}
                >
                  {/* Esconder eventos do BigCalendar quando há muitos eventos */}
                  <div style={{ display: hasEvents ? 'none' : 'block' }}>
                    {props.children}
                  </div>
                  
                  {/* Mostrar indicador quando há eventos */}
                  {hasEvents && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        right: '4px',
                        bottom: '4px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        border: '2px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '6px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.2s',
                        zIndex: 10
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log('🖱️ Clicou no indicador de eventos:', {
                          date: format(cellDate, 'dd/MM/yyyy'),
                          eventsCount: eventsForDay.length,
                          events: eventsForDay.map(e => ({ id: e.id, title: e.title }))
                        })
                        setSelectedDay(cellDate)
                        setDayEvents(eventsForDay)
                        setIsDaySheetOpen(true)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)'
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
                      }}
                      title={`Clique para ver todos os ${eventsForDay.length} agendamentos`}
                    >
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#3b82f6',
                        lineHeight: '1'
                      }}>
                        {eventsForDay.length}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: '#3b82f6',
                        textAlign: 'center',
                        fontWeight: '500'
                      }}>
                        {eventsForDay.length === 1 ? 'agendamento' : 'agendamentos'}
                      </div>
                    </div>
                  )}
                </div>
              )
            },
            event: (props) => {
              // Na visualização mensal, não renderizar eventos individuais (o indicador já mostra)
              // Na visualização de dia, renderizar normalmente
              if (view === Views.MONTH) {
                return null
              }
              
              // Para visualização de dia, renderizar o evento normalmente
              return <EventComponent {...props} view={view} />
            }
          },
          toolbar: isVisible ? undefined : () => null // Ocultar toolbar nos meses laterais
        }}
        resources={shouldUseResources ? resources : undefined}
        resourceIdAccessor="id"
        resourceTitleAccessor="title"
        defaultView={Views.MONTH}
        views={[Views.MONTH, Views.DAY]}
        culture="pt-BR"
        popup={true}
        popupOffset={{ x: 10, y: 10 }}
        step={30}
        timeslots={2}
        eventLimit={false}
        min={view === Views.DAY ? new Date(monthDate.getFullYear(), monthDate.getMonth(), monthDate.getDate(), 6, 0) : new Date(2024, 0, 1, 6, 0)}
        max={view === Views.DAY ? new Date(monthDate.getFullYear(), monthDate.getMonth(), monthDate.getDate(), 23, 0) : new Date(2024, 0, 1, 23, 0)}
        dayPropGetter={(date) => {
          const isTodayDate = isToday(date)
          return {
            className: isTodayDate ? 'rbc-today' : '',
            style: isTodayDate ? {
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fontWeight: 'bold'
            } : {}
          }
        }}
        formats={{
          timeGutterFormat: (date, culture, localizer) => localizer.format(date, 'HH:mm', culture),
          eventTimeRangeFormat: ({ start, end }, culture, localizer) => 
            `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`
        }}
      />
    </div>
    )
  }

  // Para visualização mensal: renderizar apenas o mês atual
  // Detectar scroll e mudar mês diretamente (sem renderizar múltiplos meses)
  return (
    <div 
      className="h-full w-full calendar-container overflow-hidden"
      onWheel={(e) => {
        // Na visualização mensal, detectar scroll e mudar mês diretamente
        if (view === Views.MONTH) {
          // Usar stopPropagation ao invés de preventDefault para evitar erro de passive listener
          e.stopPropagation()
          
          // Debounce: evitar mudanças muito rápidas (mínimo 400ms entre mudanças)
          const now = Date.now()
          const timeSinceLastChange = now - lastMonthChangeTime.current
          if (timeSinceLastChange < 400) {
            return // Ignorar se mudou mês recentemente
          }
          
          // Acumular scroll para detectar direção
          const scrollDelta = e.deltaX !== 0 ? e.deltaX : e.deltaY
          wheelScrollAccumulator.current += scrollDelta
          
          // Threshold aumentado para mudança de mês (acumular até 250px)
          // Isso torna menos sensível e requer mais scroll para mudar
          const threshold = 250
          
          if (Math.abs(wheelScrollAccumulator.current) >= threshold) {
            if (wheelScrollAccumulator.current < 0) {
              // Scroll para esquerda (negativo) = mês anterior (passado)
              setDate(prevMonth)
            } else {
              // Scroll para direita (positivo) = próximo mês (futuro)
              setDate(nextMonth)
            }
            // Resetar acumulador e timestamp
            wheelScrollAccumulator.current = 0
            lastMonthChangeTime.current = Date.now()
          }
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Renderizar apenas o mês atual - sem scroll físico */}
      {renderMonthCalendar(date, true)}
      
      {/* Sidebar para mostrar todos os eventos de um dia */}
      <Sheet open={isDaySheetOpen} onOpenChange={(open) => {
        console.log('📋 Sheet estado mudou:', { open, dayEventsCount: dayEvents.length, selectedDay })
        setIsDaySheetOpen(open)
      }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedDay ? format(selectedDay, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Agendamentos'}
            </SheetTitle>
            <SheetDescription>
              {dayEvents.length} {dayEvents.length === 1 ? 'agendamento' : 'agendamentos'} neste dia
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            {dayEvents.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <p>Nenhum agendamento para este dia</p>
              </div>
            ) : (
              dayEvents
                .sort((a, b) => {
                  // Ordenar por horário de início
                  const timeA = new Date(a.start).getTime()
                  const timeB = new Date(b.start).getTime()
                  return timeA - timeB
                })
                .map((evt) => {
                  const status = evt.status || 'pending'
                  const statusColorMap = {
                    pending: '#f59e0b',
                    confirmed: '#10b981',
                    completed: '#3b82f6',
                    canceled: '#ef4444',
                    no_show: '#6b7280'
                  }
                  const bgColor = statusColorMap[status] || '#6b7280'
                  const apt = evt.appointment || evt
                  
                  return (
                    <Card
                      key={evt.id}
                      className="cursor-pointer hover:shadow-md transition-all duration-200 border-border"
                      style={{ borderLeft: `4px solid ${bgColor}` }}
                      onClick={() => {
                        onEventClick(evt)
                        setIsDaySheetOpen(false)
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-text-primary mb-1 break-words">
                              {apt?.client?.name || apt?.client?.whatsapp_number || 'Cliente'}
                            </h3>
                            <p className="text-sm text-text-secondary mb-2">
                              {apt?.service?.name || 'Serviço'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge 
                                style={{ backgroundColor: bgColor, color: '#fff' }}
                                className="text-xs"
                              >
                                {STATUS_LABELS[status] || status}
                              </Badge>
                              {apt?.payment_status && (
                                <Badge variant="outline" className="text-xs">
                                  {PAYMENT_STATUS_LABELS[apt.payment_status] || apt.payment_status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 text-right flex-shrink-0">
                            <p className="text-lg font-bold text-[#5B7A9E] dark:text-[#7BA3D1]">
                              {formatCurrency(apt?.price?.cents || 0, apt?.price?.currency || 'BRL')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-secondary pt-3 border-t border-border">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className="font-medium text-text-primary">Horário:</span>{' '}
                            {format(evt.start, 'HH:mm')} - {format(evt.end, 'HH:mm')}
                          </div>
                          {apt?.professional && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span className="font-medium text-text-primary">Profissional:</span>{' '}
                              <span className="break-words">{apt.professional.name}</span>
                            </div>
                          )}
                          {apt?.client?.whatsapp_number && (
                            <div className="sm:col-span-2 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span className="font-medium text-text-primary">WhatsApp:</span>{' '}
                              <span className="break-all">{apt.client.whatsapp_number}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function AppointmentsPage() {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState('calendar')

  const {
    appointments,
    filteredAppointments,
    loading,
    error,
    loadAppointments,
    updateAppointment,
    createAppointment,
    deleteAppointment,
    stats,
    professionals,
    services,
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
  } = useAppointmentsContext()
  
  // Relatórios states
  const [summary, setSummary] = useState(null)
  const [byProfessional, setByProfessional] = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [reportsError, setReportsError] = useState(null)
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd')
  )
  const [selectedProfessionalReport, setSelectedProfessionalReport] = useState('all')
  const [dateError, setDateError] = useState(null)
  const [exporting, setExporting] = useState(false)
  
  // Estados para aba de Anotações
  const [appointmentsWithNotes, setAppointmentsWithNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesSearchTerm, setNotesSearchTerm] = useState('')
  const [notesStatusFilter, setNotesStatusFilter] = useState('all')
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isNoteDeleteDialogOpen, setIsNoteDeleteDialogOpen] = useState(false)
  const [currentNote, setCurrentNote] = useState(null)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    if (activeTab === 'reports') {
      // Validar datas antes de carregar
      let hasError = false
      let errorMessage = null

      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        if (start > end) {
          hasError = true
          errorMessage = 'A data inicial não pode ser maior que a data final'
        } else {
          const diffTime = Math.abs(end - start)
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          if (diffDays > 365) {
            hasError = true
            errorMessage = 'O período selecionado não pode ser maior que 1 ano'
          }
        }
      }
      
      setDateError(errorMessage)
      
      if (!hasError && startDate && endDate) {
        loadReports()
      }
    }
  }, [activeTab, startDate, endDate, selectedProfessionalReport])

  // Funções removidas - agora usamos hooks customizados

  const loadReports = async () => {
    if (dateError) {
      return
    }

    try {
      setReportsLoading(true)
      setReportsError(null)

      const professionalId = selectedProfessionalReport !== 'all' ? selectedProfessionalReport : null

      const [summaryResponse, byProfessionalResponse] = await Promise.all([
        apiService.getAppointmentReportsSummary(startDate, endDate),
        apiService.getAppointmentReportsByProfessional(startDate, endDate, professionalId)
      ])

      setSummary(summaryResponse?.summary || null)
      setByProfessional(byProfessionalResponse?.report || [])
    } catch (err) {
      console.error('Error loading reports:', err)
      const errorMessage = err?.response?.data?.error || err?.message || 'Erro ao carregar relatórios. Verifique sua conexão e tente novamente.'
      setReportsError(errorMessage)
      setSummary(null)
      setByProfessional([])
    } finally {
      setReportsLoading(false)
    }
  }

  const exportReportsToCSV = () => {
    try {
      setExporting(true)
      
      const csvRows = []
      
      csvRows.push([
        'Profissional',
        'Data',
        'Serviço',
        'Cliente',
        'Valor (R$)',
        'Comissão (R$)',
        'Receita Líquida (R$)'
      ].join(','))

      byProfessional.forEach((prof) => {
        if (prof.appointments && prof.appointments.length > 0) {
          prof.appointments.forEach((apt) => {
            const revenue = (apt.price?.cents || 0) / 100
            const commission = (apt.commission?.cents || 0) / 100
            const netRevenue = revenue - commission
            
            csvRows.push([
              `"${prof.professional.name}"`,
              formatDate(apt.date),
              `"${apt.service || 'N/A'}"`,
              `"${apt.client || 'N/A'}"`,
              revenue.toFixed(2).replace('.', ','),
              commission.toFixed(2).replace('.', ','),
              netRevenue.toFixed(2).replace('.', ',')
            ].join(','))
          })
        }
      })

      if (summary) {
        csvRows.push('')
        csvRows.push('RESUMO GERAL')
        csvRows.push(['Métrica', 'Valor'].join(','))
        csvRows.push(['Total de Agendamentos', summary.total_appointments || 0].join(','))
        csvRows.push(['Confirmados', summary.confirmed || 0].join(','))
        csvRows.push(['Receita Total (R$)', (summary.total_revenue?.cents || 0) / 100].join(','))
        csvRows.push(['Comissões Totais (R$)', (summary.total_commissions?.cents || 0) / 100].join(','))
        csvRows.push(['Receita Líquida (R$)', (summary.net_revenue?.cents || 0) / 100].join(','))
      }

      const csvContent = csvRows.join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const fileName = `relatorio_agendamentos_${startDate}_${endDate}.csv`
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting CSV:', err)
      setReportsError('Erro ao exportar relatório. Tente novamente.')
    } finally {
      setExporting(false)
    }
  }

  // Status badge for the notes tab (appointments from raw API may still have numeric status)
  const STATUS_BADGE_MAP = {
    0: { label: 'Pendente', variant: 'secondary' },
    1: { label: 'Confirmado', variant: 'default' },
    2: { label: 'Concluído', variant: 'default' },
    3: { label: 'Cancelado', variant: 'destructive' },
    4: { label: 'Não compareceu', variant: 'outline' },
  }
  const getStatusBadge = (status) => {
    const info = STATUS_BADGE_MAP[status] ?? { label: 'Desconhecido', variant: 'secondary' }
    return <Badge variant={info.variant}>{info.label}</Badge>
  }

  const handleCreate = useCallback(() => {
    setSelectedAppointment(null)
    setSelectedDate(null)
    setIsFormDialogOpen(true)
  }, [])

  const handleEdit = useCallback((appointment) => {
    setSelectedAppointment(appointment)
    setIsFormDialogOpen(true)
  }, [])

  const handleOpenConsultation = (appointment) => {
    setSelectedAppointment(appointment)
    setIsConsultationModalOpen(true)
  }

  // Funções para aba de Anotações
  const loadAppointmentsWithNotes = async () => {
    try {
      setNotesLoading(true)
      const response = await apiService.getAppointments()
      const appointmentsData = response.appointments || response || []
      
      // Filtrar apenas agendamentos que têm anotações (já vêm na resposta do backend)
      const appointmentsWithNotesData = appointmentsData.filter(appointment => {
        // A anotação já vem no appointment_note do backend
        if (appointment.appointment_note) {
          appointment.note = appointment.appointment_note
          return true
        }
        return false
      })
      
      setAppointmentsWithNotes(appointmentsWithNotesData)
    } catch (err) {
      console.error('Error loading appointments with notes:', err)
      toast.error('Erro ao carregar agendamentos com anotações')
    } finally {
      setNotesLoading(false)
    }
  }

  const filteredAppointmentsWithNotes = useMemo(() => {
    let filtered = [...appointmentsWithNotes]

    if (notesStatusFilter !== 'all') {
      // resolveStatus handles both numeric (0,1,2…) and string statuses
      filtered = filtered.filter(
        (apt) => resolveStatus(apt.status) === notesStatusFilter
      )
    }

    if (notesSearchTerm) {
      const term = notesSearchTerm.toLowerCase()
      filtered = filtered.filter((apt) => {
        const clientName = getClientName(apt)?.toLowerCase() ?? ''
        const serviceName = apt.service?.name?.toLowerCase() ?? ''
        const note = apt.note?.notes?.toLowerCase() ?? ''
        return clientName.includes(term) || serviceName.includes(term) || note.includes(term)
      })
    }

    filtered.sort(
      (a, b) => new Date(b.start_time) - new Date(a.start_time)
    )

    return filtered
  }, [appointmentsWithNotes, notesSearchTerm, notesStatusFilter])

  const handleOpenNoteDialog = (appointment, note = null) => {
    setSelectedAppointment(appointment)
    setCurrentNote(note)
    setNoteText(note?.notes || '')
    setIsNoteDialogOpen(true)
  }

  const handleCloseNoteDialog = () => {
    setIsNoteDialogOpen(false)
    setSelectedAppointment(null)
    setCurrentNote(null)
    setNoteText('')
  }

  const handleSaveNote = async () => {
    if (!selectedAppointment || !noteText.trim()) {
      return
    }

    try {
      setIsSubmitting(true)
      if (currentNote) {
        await apiService.updateAppointmentNote(
          selectedAppointment.id,
          currentNote.id,
          { notes: noteText }
        )
      } else {
        await apiService.createAppointmentNote(selectedAppointment.id, { notes: noteText })
      }
      handleCloseNoteDialog()
      loadAppointmentsWithNotes()
      toast.success('Anotação salva com sucesso!')
    } catch (err) {
      console.error('Error saving note:', err)
      toast.error(err.message || 'Erro ao salvar anotação')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!currentNote) return

    try {
      setIsSubmitting(true)
      await apiService.deleteAppointmentNote(selectedAppointment.id, currentNote.id)
      handleCloseNoteDialog()
      setIsNoteDeleteDialogOpen(false)
      loadAppointmentsWithNotes()
      toast.success('Anotação excluída com sucesso!')
    } catch (err) {
      console.error('Error deleting note:', err)
      toast.error(err.message || 'Erro ao excluir anotação')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Carregar agendamentos com anotações quando a aba for ativada
  useEffect(() => {
    if (activeTab === 'notes') {
      loadAppointmentsWithNotes()
    }
  }, [activeTab])

  // Handler para quando clicar em um slot/dia no calendário
  const handleSelectSlot = useCallback((slotInfo) => {
    setSelectedAppointment(null)
    setSelectedDate(slotInfo.start)
    setIsFormDialogOpen(true)
  }, [])

  const handleDelete = (appointment) => {
    setSelectedAppointment(appointment)
    setIsDeleteDialogOpen(true)
  }

  // Função removida - o backend cria contato automaticamente se necessário

  const handleSubmit = async (submitData) => {
    setIsSubmitting(true)
    try {
      if (selectedAppointment) {
        await updateAppointment(selectedAppointment.id, submitData)
        toast.success('Agendamento atualizado com sucesso')
      } else {
        await createAppointment(submitData)
        toast.success('Agendamento criado com sucesso')
      }

      setIsFormDialogOpen(false)
      setSelectedAppointment(null)
    } catch (err) {
      console.error('Error saving appointment:', err)
      const errorMessage = err.message || 'Erro desconhecido'
      toast.error('Erro ao salvar agendamento: ' + errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedAppointment) return
    
    setIsSubmitting(true)
    try {
      await deleteAppointment(selectedAppointment.id)
      setIsDeleteDialogOpen(false)
      setSelectedAppointment(null)
      toast.success('Agendamento excluído com sucesso')
    } catch (err) {
      console.error('Error deleting appointment:', err)
      toast.error('Erro ao deletar agendamento: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = () => {
    try {
      if (filteredAppointments.length === 0) {
        toast.warning('Não há agendamentos para exportar')
        return
      }

      // Criar CSV dos agendamentos filtrados
      const headers = ['Cliente', 'Serviço', 'Profissional', 'Data/Hora', 'Valor', 'Status', 'Pagamento']
      
      const rows = filteredAppointments.map(apt => {
        const statusKey = normalizeStatus(apt.status)
        const paymentStatusKey = normalizePaymentStatus(apt.payment_status)

        return [
          apt.client?.name || apt.client?.whatsapp_number || apt.whatsapp_number || 'N/A',
          apt.service?.name || 'N/A',
          apt.professional?.name || 'N/A',
          formatDateTime(apt.start_time),
          formatCurrency(apt.price?.cents || apt.price_cents || 0, apt.price?.currency || apt.price_currency || 'BRL'),
          STATUS_LABELS[statusKey] || statusKey || 'N/A',
          PAYMENT_STATUS_LABELS[paymentStatusKey] || paymentStatusKey || 'N/A'
        ]
      })

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
          // Escapar aspas e quebras de linha no CSV
          const cellStr = String(cell || '').replace(/"/g, '""')
          return `"${cellStr}"`
        }).join(','))
      ].join('\n')

      // Adicionar BOM para Excel reconhecer UTF-8
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `agendamentos_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Agendamentos exportados com sucesso')
    } catch (err) {
      console.error('Error exporting appointments:', err)
      toast.error('Erro ao exportar agendamentos: ' + (err.message || 'Erro desconhecido'))
    }
  }

  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
          <p className="text-text-secondary">Carregando agendamentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-surface transition-colors duration-200">
      <div className="relative z-10 space-y-8 w-full max-w-full min-w-0 overflow-x-hidden p-4 md:p-6 lg:p-8">
        {/* Header - Bold Typography */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-2 responsive-text-xl text-text-primary transition-all duration-200">
              Agendamentos
            </h1>
            <p className="text-base md:text-lg text-text-secondary transition-colors duration-200">
              Gerencie todos os agendamentos do sistema
            </p>
          </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button 
            onClick={handleExport} 
            variant="outline" 
            size="sm"
            className="transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <Button 
            onClick={loadAppointments} 
            variant="outline" 
            size="sm"
            className="transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <Button 
            onClick={handleCreate}
            className="transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Novo Agendamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
          
          <AppointmentForm
            open={isFormDialogOpen}
            onOpenChange={(open) => {
              setIsFormDialogOpen(open)
              if (!open) {
                setSelectedAppointment(null)
                setSelectedDate(null)
              }
            }}
            appointment={selectedAppointment}
            initialDate={selectedDate}
            professionals={professionals}
            services={services}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 h-auto p-1 bg-neutral-100 dark:bg-gray-800/70 border border-neutral-200 dark:border-gray-700 rounded-2xl w-full sm:w-auto gap-0.5">
          <TabsTrigger
            value="calendar"
            className="rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all duration-150"
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Calendário</span>
            <span className="sm:hidden">Cal.</span>
          </TabsTrigger>
          <TabsTrigger
            value="list"
            className="rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all duration-150"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Lista
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all duration-150"
          >
            <FileText className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Anotações</span>
            <span className="sm:hidden">Notas</span>
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all duration-150"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Calendário Tab */}
        <TabsContent value="calendar" className="space-y-6">
          {loading && appointments.length === 0 ? (
            <div className="flex items-center justify-center h-[600px] bg-white dark:bg-surface-elevated rounded-lg border border-border">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
                <p className="text-text-secondary">Carregando agendamentos...</p>
              </div>
            </div>
          ) : (
            <AppointmentsCalendar />
          )}
        </TabsContent>

        {/* Lista Tab */}
        <TabsContent value="list" className="space-y-6 animate-in fade-in-50 duration-300">
          <AppointmentsFilters />
          <AppointmentsStats />
          <AppointmentsTable
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpenConsultation={handleOpenConsultation}
          />
        </TabsContent>

        {/* Anotações Tab */}
        <TabsContent value="notes" className="space-y-6 animate-in fade-in-50 duration-300">
          <FluidSection
            title="Anotações de Sessões"
            subtitle="Agendamentos com anotações"
            gradient="from-purple-500 to-pink-500"
          >
            {/* Filtros */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                      <Input
                        placeholder="Buscar por cliente, serviço ou anotação..."
                        value={notesSearchTerm}
                        onChange={(e) => setNotesSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-full sm:w-48">
                    <Select value={notesStatusFilter} onValueChange={setNotesStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="completed">Concluídos</SelectItem>
                        <SelectItem value="confirmed">Confirmados</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
                        <SelectItem value="canceled">Cancelados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    onClick={loadAppointmentsWithNotes}
                    disabled={notesLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${notesLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Agendamentos com Anotações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Agendamentos com Anotações ({filteredAppointmentsWithNotes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  </div>
                ) : filteredAppointmentsWithNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-text-tertiary mb-4" />
                    <p className="text-text-secondary">
                      {notesSearchTerm || notesStatusFilter !== 'all'
                        ? 'Nenhum agendamento encontrado com os filtros aplicados.'
                        : 'Nenhum agendamento com anotações encontrado.'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Anotação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAppointmentsWithNotes.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-text-tertiary" />
                              <span className="text-sm">
                                {format(new Date(appointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-text-tertiary" />
                              <span>
                                {appointment.contact?.name || appointment.whatsapp_number || '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {appointment.service?.name || '-'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(appointment.status)}
                          </TableCell>
                          <TableCell>
                            {appointment.note ? (
                              <div className="max-w-xs">
                                <p className="text-sm text-text-secondary truncate">
                                  {appointment.note.notes.substring(0, 50)}
                                  {appointment.note.notes.length > 50 ? '...' : ''}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-text-tertiary italic">
                                Sem anotação
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenConsultation(appointment)}
                                title="Abrir sessão"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenNoteDialog(appointment, appointment.note)}
                              >
                                {appointment.note ? (
                                  <Edit className="h-4 w-4" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                              {appointment.note && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAppointment(appointment)
                                    setCurrentNote(appointment.note)
                                    setIsNoteDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </FluidSection>

          {/* Dialog para criar/editar anotação */}
          <Dialog open={isNoteDialogOpen} onOpenChange={handleCloseNoteDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {currentNote ? 'Editar Anotação' : 'Nova Anotação'}
                </DialogTitle>
              </DialogHeader>
              {selectedAppointment && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Agendamento:</p>
                    <p className="text-sm text-text-secondary">
                      <strong>Cliente:</strong> {selectedAppointment.contact?.name || selectedAppointment.whatsapp_number || '-'}
                    </p>
                    <p className="text-sm text-text-secondary">
                      <strong>Serviço:</strong> {selectedAppointment.service?.name || '-'}
                    </p>
                    <p className="text-sm text-text-secondary">
                      <strong>Data:</strong> {format(new Date(selectedAppointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Anotação *</Label>
                    <textarea
                      id="notes"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Digite as anotações da sessão..."
                      className="w-full min-h-[200px] px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                    <p className="text-xs text-text-tertiary">
                      Mínimo de 3 caracteres.
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleCloseNoteDialog}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveNote}
                  disabled={isSubmitting || !noteText.trim() || noteText.trim().length < 3}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog de confirmação de exclusão */}
          <AlertDialog open={isNoteDeleteDialogOpen} onOpenChange={setIsNoteDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteNote}
                  disabled={isSubmitting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    'Excluir'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* Relatórios Tab */}
        <TabsContent value="reports" className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Filters */}
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Data Inicial
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      setDateError(null)
                    }}
                    max={endDate}
                  />
                  {dateError && startDate && endDate && new Date(startDate) > new Date(endDate) && (
                    <p className="text-xs text-red-600 mt-1">{dateError}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Data Final
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      setDateError(null)
                    }}
                    min={startDate}
                  />
                  {dateError && startDate && endDate && new Date(startDate) <= new Date(endDate) && (
                    <p className="text-xs text-red-600 mt-1">{dateError}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Profissional
                  </label>
                  <Select value={selectedProfessionalReport} onValueChange={setSelectedProfessionalReport}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os Profissionais" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Profissionais</SelectItem>
                      {professionals.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id.toString()}>
                          {prof.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <Button 
                  onClick={loadReports} 
                  variant="outline" 
                  size="sm"
                  disabled={reportsLoading || !!dateError}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${reportsLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportReportsToCSV}
                  disabled={exporting || !summary || byProfessional.length === 0 || !!dateError}
                >
                  <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
                  {exporting ? 'Exportando...' : 'Exportar'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {(reportsError || dateError) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{reportsError || dateError}</p>
                </div>
              </div>
            </div>
          )}

          {reportsLoading && !summary && !reportsError && !dateError ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
                <p className="text-gray-600">Carregando relatórios...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <StatCard
                    title="Total de Agendamentos"
                    value={summary.total_appointments || 0}
                    icon={CalendarIcon}
                    gradient="from-blue-400 to-cyan-500"
                  />
                  <StatCard
                    title="Confirmados"
                    value={summary.confirmed || 0}
                    icon={TrendingUp}
                    gradient="from-green-400 to-emerald-500"
                  />
                  <StatCard
                    title="Receita Total"
                    value={formatCurrency(summary.total_revenue?.cents || 0, summary.total_revenue?.currency || 'BRL')}
                    icon={DollarSign}
                    gradient="from-[#6B8FA3] to-[#5B7A9E]"
                  />
                  <StatCard
                    title="Comissões Totais"
                    value={formatCurrency(summary.total_commissions?.cents || 0, summary.total_commissions?.currency || 'BRL')}
                    icon={Percent}
                    gradient="from-orange-400 to-amber-500"
                  />
                </div>
              )}

              {/* Net Revenue Card */}
              {summary && (
                <FluidSection
                  title="Receita Líquida"
                  subtitle="Receita Total - Comissões"
                  gradient="from-green-500 to-emerald-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-black text-gray-900 dark:text-white">
                        {formatCurrency(summary.net_revenue?.cents || 0, summary.net_revenue?.currency || 'BRL')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Margem</p>
                      <p className="text-2xl font-black text-green-700 dark:text-green-400">
                        {(summary.total_revenue?.cents || 0) > 0
                          ? (((summary.net_revenue?.cents || 0) / (summary.total_revenue?.cents || 1)) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </FluidSection>
              )}

              {/* Charts */}
              {byProfessional.length > 0 && !reportsLoading && (
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
                  <FluidSection
                    title="Receita por Profissional"
                    subtitle="Análise de receita e comissões"
                    gradient="from-blue-500 to-indigo-500"
                    icon={BarChart3}
                  >
                    <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                      <BarChart data={byProfessional.map((prof) => ({
                        name: prof.professional?.name || 'N/A',
                        receita: (prof.total_revenue?.cents || 0) / 100,
                        comissao: (prof.total_commission?.cents || 0) / 100,
                        lucro: ((prof.total_revenue?.cents || 0) - (prof.total_commission?.cents || 0)) / 100
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                          angle={isMobile ? -45 : 0}
                          textAnchor={isMobile ? 'end' : 'middle'}
                          height={isMobile ? 80 : 30}
                        />
                        <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <RechartsTooltip formatter={(value) => formatCurrency(value * 100)} />
                        {!isMobile && <Legend />}
                        <Bar dataKey="receita" fill="#10b981" name="Receita" />
                        <Bar dataKey="comissao" fill="#f59e0b" name="Comissão" />
                        <Bar dataKey="lucro" fill="#3b82f6" name="Lucro Líquido" />
                      </BarChart>
                    </ResponsiveContainer>
                    {isMobile && (
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-xs">Receita</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                          <span className="text-xs">Comissão</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span className="text-xs">Lucro</span>
                        </div>
                      </div>
                    )}
                  </FluidSection>

                  <Card>
                    <CardHeader>
                      <CardTitle className={isMobile ? "text-base" : ""}>Distribuição de Receita</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                        <PieChart>
                          <Pie
                            data={byProfessional.map((prof) => ({
                              name: prof.professional?.name || 'N/A',
                              value: (prof.total_revenue?.cents || 0) / 100
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={isMobile ? false : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={isMobile ? 60 : 80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {byProfessional.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => formatCurrency(value * 100)} />
                          {isMobile && <Legend />}
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Detailed Report by Professional */}
              <Card>
                <CardHeader>
                  <CardTitle>Relatório Detalhado por Profissional</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-green-500 mr-2" />
                      <p className="text-gray-600">Carregando detalhes...</p>
                    </div>
                  ) : byProfessional.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-base font-medium mb-2">Nenhum dado disponível</p>
                      <p className="text-sm">Não há agendamentos para o período selecionado</p>
                      {startDate && endDate && (
                        <p className="text-xs text-gray-400 mt-2">
                          Período: {formatDate(startDate)} até {formatDate(endDate)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {byProfessional.map((prof) => (
                        <Card key={prof.professional.id} className="border-l-4 border-l-blue-500">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">{prof.professional?.name || 'N/A'}</CardTitle>
                                <p className="text-sm text-gray-600 mt-1">
                                  {prof.total_services || 0} agendamento(s) no período
                                </p>
                              </div>
                              <Badge variant="outline" className="text-lg">
                                {prof.total_services || 0} serviços
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-4'} gap-4 mb-4`}>
                              <div>
                                <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Receita Bruta</p>
                                <p className={`font-bold text-green-600 ${isMobile ? 'text-base' : 'text-xl'}`}>
                                  {formatCurrency(prof.total_revenue?.cents || 0, prof.total_revenue?.currency || 'BRL')}
                                </p>
                              </div>
                              <div>
                                <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Comissão</p>
                                <p className={`font-bold text-orange-600 ${isMobile ? 'text-base' : 'text-xl'}`}>
                                  {formatCurrency(prof.total_commission?.cents || 0, prof.total_commission?.currency || 'BRL')}
                                </p>
                                {!isMobile && (
                                  <p className="text-xs text-gray-500">
                                    {(prof.total_revenue?.cents || 0) > 0
                                      ? (((prof.total_commission?.cents || 0) / (prof.total_revenue?.cents || 1)) * 100).toFixed(1)
                                      : 0}% da receita
                                  </p>
                                )}
                              </div>
                              <div>
                                <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Repasse Pendente</p>
                                <p className={`font-bold text-blue-600 ${isMobile ? 'text-base' : 'text-xl'}`}>
                                  {formatCurrency(prof.pending_payout?.cents || 0, prof.pending_payout?.currency || 'BRL')}
                                </p>
                              </div>
                              <div>
                                <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Receita Líquida</p>
                                <p className={`font-bold text-[#5B7A9E] ${isMobile ? 'text-base' : 'text-xl'}`}>
                                  {formatCurrency(
                                    (prof.total_revenue?.cents || 0) - (prof.total_commission?.cents || 0),
                                    prof.total_revenue?.currency || 'BRL'
                                  )}
                                </p>
                              </div>
                            </div>

                            {prof.appointments && prof.appointments.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-medium text-text-primary mb-2">Serviços Realizados:</p>
                                
                                <div className="block md:hidden space-y-3">
                                  {prof.appointments.map((apt) => (
                                    <Card key={apt.id} className="hover:shadow-md transition-shadow border-border">
                                      <CardContent className="!px-4 !py-4 md:!px-6 md:!py-5">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                          <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-base text-text-primary dark:text-text-primary mb-2 break-words">
                                              {apt.service || 'N/A'}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2">
                                              {apt.client && (
                                                <Badge variant="outline" className="text-xs">
                                                  {apt.client}
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex-shrink-0 text-right">
                                            <p className="text-lg font-bold text-[#5B7A9E] dark:text-[#7BA3D1]">
                                              {formatCurrency(apt.price?.cents || 0, apt.price?.currency || 'BRL')}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-secondary pt-3 border-t border-border">
                                          <div className="min-w-0">
                                            <span className="font-medium text-text-primary">Data:</span>{' '}
                                            {formatDate(apt.date)}
                                          </div>
                                          {(apt.commission?.cents || 0) > 0 && (
                                            <div className="min-w-0">
                                              <span className="font-medium text-text-primary">Comissão:</span>{' '}
                                              {formatCurrency(apt.commission.cents, apt.commission.currency || 'BRL')}
                                            </div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>

                                <div className="hidden md:block overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Serviço</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Comissão</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {prof.appointments.map((apt) => (
                                        <TableRow key={apt.id}>
                                          <TableCell>{formatDate(apt.date)}</TableCell>
                                          <TableCell>{apt.service}</TableCell>
                                          <TableCell>{apt.client || 'N/A'}</TableCell>
                                          <TableCell>
                                            {formatCurrency(apt.price?.cents || 0, apt.price?.currency || 'BRL')}
                                          </TableCell>
                                          <TableCell>
                                            {formatCurrency(
                                              apt.commission?.cents || 0,
                                              apt.commission?.currency || 'BRL'
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Sessão */}
      <ConsultationModal
        appointment={selectedAppointment}
        open={isConsultationModalOpen}
        onOpenChange={setIsConsultationModalOpen}
      />
      </div>
    </div>
  )
}

export function Appointments() {
  return (
    <AppointmentsProvider>
      <AppointmentsPage />
    </AppointmentsProvider>
  )
}
