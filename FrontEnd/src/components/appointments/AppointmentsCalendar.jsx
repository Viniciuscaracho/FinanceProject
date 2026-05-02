import { useState, useEffect, useMemo, useCallback, useRef, startTransition } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO, getDaysInMonth, addDays, startOfDay, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Phone, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { apiService } from '@/lib/api'
import { normalizeAppointments, normalizeStatus } from '@/utils/appointmentUtils'
import { formatCurrency } from '@/utils/format'
import { ConsultationModal } from './ConsultationModal'
import { useAppointments } from '@/hooks/useAppointments'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Cores dos indicadores de status (estilo landing page)
const STATUS_DOT_COLORS = {
  pending: 'bg-yellow-400',
  confirmed: 'bg-green-500',
  completed: 'bg-blue-600',
  canceled: 'bg-red-500',
  no_show: 'bg-gray-400'
}

export function AppointmentsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month') // 'month' | 'day'
  const [selectedProfessional, setSelectedProfessional] = useState('all')
  const [professionals, setProfessionals] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedAppointmentId, setExpandedAppointmentId] = useState(null)
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false)
  const [selectedAppointmentForConsultation, setSelectedAppointmentForConsultation] = useState(null)
  
  // Refs para scroll horizontal
  const scrollContainerRef = useRef(null)
  const isUserInteractingRef = useRef(false)
  const scrollTimeoutRef = useRef(null)
  const [dayViewDate, setDayViewDate] = useState(new Date())
  
  // Usar hook useAppointments para gerenciar appointments com cache
  const {
    appointments: allAppointments,
    loading,
    loadMonth,
    setFilters: setAppointmentFilters
  } = useAppointments()
  
  // Filtrar appointments por profissional selecionado
  const appointments = useMemo(() => {
    if (selectedProfessional === 'all') {
      return allAppointments
    }
    return allAppointments.filter(apt => {
      const profId = apt.professional?.id?.toString() || apt.account_user_id?.toString()
      return profId === selectedProfessional
    })
  }, [allAppointments, selectedProfessional])

  // Carregar profissionais
  useEffect(() => {
    const loadProfessionals = async () => {
      try {
        const data = await apiService.getAppointmentProfessionals()
        setProfessionals(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Erro ao carregar profissionais:', error)
      }
    }
    loadProfessionals()
  }, [])

  // Sincronizar filtro de profissional com hook
  useEffect(() => {
    setAppointmentFilters(prev => ({
      ...prev,
      account_user_id: selectedProfessional === 'all' ? 'all' : selectedProfessional
    }))
  }, [selectedProfessional, setAppointmentFilters])

  // Carregar mês quando currentDate mudar (otimizado para fluidez)
  useEffect(() => {
    if (!loadMonth) return
    
    // Usar startTransition para tornar a mudança de mês não-bloqueante
    startTransition(() => {
      // Carregar mês atual imediatamente (prioridade)
      loadMonth(currentDate).catch(err => {
        console.error('Erro ao carregar mês:', err)
      })
    })
    
    // Carregar meses adjacentes em background (sem bloquear UI)
    // Usar requestIdleCallback se disponível, senão setTimeout
    const scheduleBackgroundLoad = (callback) => {
      if (window.requestIdleCallback) {
        requestIdleCallback(callback, { timeout: 200 })
      } else {
        setTimeout(callback, 50)
      }
    }
    
    scheduleBackgroundLoad(() => {
      loadMonth(subMonths(currentDate, 1)).catch(() => {})
      loadMonth(addMonths(currentDate, 1)).catch(() => {})
    })
  }, [currentDate, loadMonth])

  // Calcular meses para scroll horizontal (anterior, atual, próximo)
  const months = useMemo(() => {
    return [
      subMonths(currentDate, 1),
      currentDate,
      addMonths(currentDate, 1)
    ]
  }, [currentDate])

  // Navegação do calendário (otimizada com startTransition)
  const goToPreviousMonth = useCallback(() => {
    startTransition(() => {
      setCurrentDate(subMonths(currentDate, 1))
    })
  }, [currentDate])

  const goToNextMonth = useCallback(() => {
    startTransition(() => {
      setCurrentDate(addMonths(currentDate, 1))
    })
  }, [currentDate])

  const goToToday = useCallback(() => {
    startTransition(() => {
      setCurrentDate(new Date())
    })
  }, [])

  // Centralizar scroll no mês atual quando meses mudarem (otimizado para fluidez)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || viewMode !== 'month') return

    // Usar startTransition para tornar o scroll não-bloqueante
    startTransition(() => {
      // Usar apenas um requestAnimationFrame para reduzir delay
      requestAnimationFrame(() => {
        const width = container.clientWidth
        if (width > 0) {
          // Centralizar no mês do meio (índice 1)
          // Cada mês ocupa 100% da largura, então o índice 1 está em width * 1
          // Usar 'auto' ao invés de 'smooth' para atualização instantânea
          container.scrollTo({ 
            left: width, 
            behavior: 'auto' // Instantâneo para remover delay
          })
        }
      })
    })
  }, [months, viewMode])

  // Handler de scroll para detectar mudança de mês (melhorado para fluidez)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let isScrolling = false
    let scrollEndTimer = null

    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true
        isUserInteractingRef.current = true
      }

      // Limpar timer anterior
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer)
      }

      // Aguardar fim do scroll para atualizar (reduzido para melhor responsividade)
      scrollEndTimer = setTimeout(() => {
        const width = container.clientWidth
        if (width === 0) return // Aguardar se ainda não tem largura
        
        const scrollLeft = container.scrollLeft
        const index = Math.round(scrollLeft / width)

        // Só atualizar se realmente mudou de mês
        // Usar uma margem de tolerância para evitar atualizações desnecessárias
        const tolerance = width * 0.1 // 10% de tolerância
        const expectedPosition = index * width
        
        if (Math.abs(scrollLeft - expectedPosition) < tolerance) {
          if (index === 0) {
            // Scrollou para o mês anterior
            goToPreviousMonth()
          } else if (index === 2) {
            // Scrollou para o próximo mês
            goToNextMonth()
          }
        }

        isScrolling = false
        isUserInteractingRef.current = false
      }, 100) // Reduzido de 200ms para 100ms para melhor responsividade
    }

    // Usar 'scrollend' se disponível (melhor performance e fluidez)
    let handleScrollEnd = null
    
    if ('onscrollend' in container) {
      handleScrollEnd = () => {
        const width = container.clientWidth
        if (width === 0) return
        
        const scrollLeft = container.scrollLeft
        const index = Math.round(scrollLeft / width)

        // Só atualizar se realmente mudou de mês (não está no meio)
        if (index === 0) {
          goToPreviousMonth()
        } else if (index === 2) {
          goToNextMonth()
        }

        isUserInteractingRef.current = false
        isScrolling = false
      }
      
      container.addEventListener('scrollend', handleScrollEnd, { passive: true })
    } else {
      container.addEventListener('scroll', handleScroll, { passive: true })
    }
    
    // Cleanup function única para ambos os casos
    return () => {
      if (handleScrollEnd) {
        container.removeEventListener('scrollend', handleScrollEnd)
      } else {
        container.removeEventListener('scroll', handleScroll)
      }
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer)
      }
    }
  }, [goToPreviousMonth, goToNextMonth])


  // Calcular células do calendário para um mês específico
  const getCalendarCellsForMonth = useCallback((monthDate) => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const cells = []
    let currentDay = calendarStart

    while (currentDay <= calendarEnd) {
      const dayAppointments = appointments.filter(apt => {
        if (!apt.start_time) return false
        const aptDate = parseISO(apt.start_time)
        return isSameDay(aptDate, currentDay)
      })

      // Agrupar status para mostrar dots
      const statusCounts = {}
      dayAppointments.forEach(apt => {
        const status = normalizeStatus(apt.status)
        statusCounts[status] = (statusCounts[status] || 0) + 1
      })

      cells.push({
        date: new Date(currentDay),
        dayNumber: currentDay.getDate(),
        isCurrentMonth: isSameMonth(currentDay, monthDate),
        isToday: isToday(currentDay),
        appointments: dayAppointments,
        appointmentCount: dayAppointments.length,
        statusCounts
      })

      currentDay = addDays(currentDay, 1)
    }

    return cells
  }, [appointments])

  // Calcular células para cada mês
  const monthsCells = useMemo(() => {
    return months.map(month => ({
      month,
      cells: getCalendarCellsForMonth(month)
    }))
  }, [months, getCalendarCellsForMonth])

  // Contar total de agendamentos apenas do mês atual
  const totalAppointments = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    
    return appointments.filter(apt => {
      if (!apt.start_time) return false
      const aptDate = parseISO(apt.start_time)
      // Verificar se o agendamento está dentro do mês atual
      return aptDate >= monthStart && aptDate <= monthEnd
    }).length
  }, [appointments, currentDate])

  // Agendamentos do dia selecionado (ordenados por horário)
  const selectedDayAppointments = useMemo(() => {
    if (!selectedDay) return []
    const filtered = appointments.filter(apt => {
      if (!apt.start_time) return false
      const aptDate = parseISO(apt.start_time)
      return isSameDay(aptDate, selectedDay)
    })
    
    // Ordenar por horário de início
    return filtered.sort((a, b) => {
      const timeA = parseISO(a.start_time).getTime()
      const timeB = parseISO(b.start_time).getTime()
      return timeA - timeB
    })
  }, [selectedDay, appointments])

  // Handler para clicar em um dia
  const handleDayClick = (day) => {
    setSelectedDay(day.date)
    setIsModalOpen(true)
    setExpandedAppointmentId(null) // Resetar expansão ao abrir novo dia
  }

  // Handler para expandir/colapsar agendamento
  const handleToggleExpand = (appointmentId) => {
    setExpandedAppointmentId(prev => prev === appointmentId ? null : appointmentId)
  }

  // Handler para atualizar status do agendamento
  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await apiService.updateAppointment(appointmentId, { status: newStatus })
      // Recarregar mês atual (o hook gerencia o cache)
      if (loadMonth) {
        await loadMonth(currentDate)
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const selectedProfessionalName = useMemo(() => {
    if (selectedProfessional === 'all') return null
    const prof = professionals.find(p => p.id?.toString() === selectedProfessional.toString())
    return prof ? (prof.name || prof.first_name || 'Profissional') : null
  }, [selectedProfessional, professionals])

  return (
    <div className="w-full space-y-6">
      {/* Header da Página */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          Calendário de Agendamentos
        </h1>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Veja e gerencie os agendamentos por dia e profissional
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Todos os profissionais">
                {selectedProfessional === 'all' ? (
                  'Todos os profissionais'
                ) : (
                  <div className="flex items-center gap-2">
                    {selectedProfessionalName && (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                          {selectedProfessionalName.charAt(0).toUpperCase()}
                        </div>
                        <span>{selectedProfessionalName}</span>
                      </div>
                    )}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os profissionais</SelectItem>
              {professionals.map((prof) => (
                <SelectItem key={prof.id} value={prof.id?.toString()}>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                      {(prof.name || prof.first_name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <span>{prof.name || prof.first_name || 'Profissional'}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-sm text-gray-800 dark:text-gray-200">
            <span className="font-semibold">{totalAppointments}</span> agendamentos em {format(currentDate, "MMMM", { locale: ptBR })}
          </div>
        </div>
      </div>

      {/* Header do Calendário */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              className="size-9 rounded-full border-neutral-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              className="size-9 rounded-full border-neutral-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="min-w-[150px]">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white capitalize">
              {format(currentDate, "MMMM", { locale: ptBR })}
            </h2>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              {format(currentDate, "yyyy")}
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={goToToday}
            className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            Hoje
          </Button>
        </div>

        {/* Toggle Mês/Dia */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-gray-800 rounded-xl p-1 border border-neutral-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('month')}
            className={cn(
              "rounded-lg text-xs font-bold uppercase tracking-wider px-4",
              viewMode === 'month' 
                ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600" 
                : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            Mês
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('day')}
            className={cn(
              "rounded-lg text-xs font-bold uppercase tracking-wider px-4",
              viewMode === 'day' 
                ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600" 
                : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            Dia
          </Button>
        </div>
      </div>

      {/* Visualização Mensal com Scroll Horizontal */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-neutral-200 dark:border-gray-800 overflow-hidden relative shadow-sm">
          {/* Container com scroll horizontal invisível */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto scroll-hide"
            style={{
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE/Edge
              WebkitOverflowScrolling: 'touch', // iOS
              scrollBehavior: 'auto', // Mudado para 'auto' para remover delay
              scrollSnapType: 'x mandatory',
              overscrollBehaviorX: 'contain',
              // Permitir que a rolagem vertical continue para a página
              overscrollBehaviorY: 'auto'
            }}
            onWheel={(e) => {
              // Bloquear mudanças de mês em rolagem vertical; permitir apenas gestos horizontais
              const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
              if (!isHorizontal) return // deixa o scroll vertical passar para a página
              // Para gestos horizontais, seguimos o comportamento padrão de scroll do container
            }}
          >
            {monthsCells.map((monthData, monthIndex) => (
              <div
                key={monthData.month.getTime()}
                className="w-full flex-shrink-0 flex flex-col"
                style={{ 
                  minWidth: '100%', 
                  maxWidth: '100%',
                  width: '100%',
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always',
                }}
              >
                {/* Dias da semana */}
                <div className="grid grid-cols-7 border-b border-neutral-100 dark:border-gray-800">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className="text-center text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-gray-500 py-3"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grid do calendário */}
                <div className="grid grid-cols-7 divide-x divide-y divide-neutral-100 dark:divide-gray-800/60">
                  {monthData.cells.map((cell, index) => {
                    const load = cell.appointmentCount === 0 ? 'empty'
                      : cell.appointmentCount <= 2 ? 'low'
                      : cell.appointmentCount <= 5 ? 'mid'
                      : 'high'
                    return (
                      <div
                        key={`${monthData.month.getTime()}-${index}`}
                        onClick={() => handleDayClick(cell)}
                        className={cn(
                          "min-h-[84px] flex flex-col p-2 relative cursor-pointer group transition-colors duration-150",
                          load === 'empty' && "bg-white dark:bg-gray-900 hover:bg-neutral-50 dark:hover:bg-gray-800/60",
                          load === 'low'   && "bg-blue-50/40 dark:bg-blue-900/10 hover:bg-blue-50/80",
                          load === 'mid'   && "bg-blue-50/70 dark:bg-blue-900/20 hover:bg-blue-100/60",
                          load === 'high'  && "bg-blue-100/80 dark:bg-blue-900/30 hover:bg-blue-100",
                          cell.isToday && "ring-2 ring-inset ring-blue-500 z-10",
                          !cell.isCurrentMonth && "opacity-30"
                        )}
                      >
                        {/* Número do dia */}
                        <span className={cn(
                          "text-sm font-semibold leading-none self-start",
                          load === 'empty' ? "text-neutral-300 dark:text-gray-600" : "text-neutral-700 dark:text-gray-200",
                          cell.isToday && "flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-xs"
                        )}>
                          {cell.dayNumber}
                        </span>

                        {/* Badge de quantidade */}
                        {cell.appointmentCount > 0 && (
                          <span className="absolute top-2 right-2 text-[10px] font-bold leading-none bg-blue-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                            {cell.appointmentCount}
                          </span>
                        )}

                        {/* Barra de status na base */}
                        {cell.appointmentCount > 0 && (
                          <div className="flex gap-px mt-auto pt-2">
                            {Object.entries(cell.statusCounts).map(([status, count]) =>
                              Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                                <div
                                  key={`${status}-${i}`}
                                  className={cn("h-1 flex-1 rounded-full", STATUS_DOT_COLORS[status] || 'bg-gray-400')}
                                />
                              ))
                            )}
                          </div>
                        )}

                        {/* Tooltip no hover */}
                        {cell.appointmentCount > 0 && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-semibold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl">
                            {cell.appointmentCount} agendamento{cell.appointmentCount > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visualização Diária */}
      {viewMode === 'day' && (
        <DayView 
          currentDate={currentDate}
          appointments={appointments}
          professionals={professionals}
          selectedProfessional={selectedProfessional}
          onDateChange={setCurrentDate}
          onAppointmentClick={(apt) => {
            setSelectedDay(parseISO(apt.start_time))
            setIsModalOpen(true)
            setExpandedAppointmentId(null)
          }}
        />
      )}

      {/* Modal Central - Agendamentos do Dia */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[520px] max-h-[80vh] p-0 flex flex-col overflow-hidden [&>button]:top-6 [&>button]:right-6 [&>button]:z-10 rounded-[2rem] border-none shadow-2xl">
          {/* Header Fixo (estilo landing page) */}
          <DialogHeader className="px-8 pt-8 pb-6 border-b border-neutral-100 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-[#1A1C1E] sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                  Agenda do dia
                </p>
                <DialogTitle className="text-2xl font-bold text-neutral-900 dark:text-white capitalize">
                  {selectedDay && format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                </DialogTitle>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                {selectedDayAppointments.length} Total
              </div>
            </div>
          </DialogHeader>

          {/* Corpo com Scroll */}
          <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0 bg-white dark:bg-[#1A1C1E]">
            {selectedDayAppointments.length === 0 ? (
              <div className="text-center py-16 text-neutral-400">
                <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">Nenhum agendamento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayAppointments.map((apt) => {
                  const status = normalizeStatus(apt.status)
                  const startTime = apt.start_time ? format(parseISO(apt.start_time), 'HH:mm') : ''
                  const clientName = apt?.client?.name || apt?.contact?.name || apt?.whatsapp_number || 'Cliente'
                  const serviceName = apt?.service?.name || 'Serviço'
                  const professionalName = apt?.account_user?.name || apt?.account_user?.first_name || 'Profissional'
                  const isExpanded = expandedAppointmentId === apt.id
                  const price = formatCurrency(apt.price?.cents || apt.price_cents || 0, apt.price?.currency || apt.price_currency || 'BRL')

                  return (
                    <div
                      key={apt.id}
                      className={cn(
                        "group flex flex-col rounded-2xl transition-all duration-200 border",
                        isExpanded
                          ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50 shadow-sm"
                          : "hover:bg-neutral-50 dark:hover:bg-gray-800 border-transparent hover:border-neutral-100 dark:hover:border-gray-700"
                      )}
                    >
                      {/* Linha principal — clicável para expandir status actions */}
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer"
                        onClick={() => handleToggleExpand(apt.id)}
                      >
                        {/* Horário */}
                        <div className="text-center min-w-[40px]">
                          <span className={cn(
                            "text-[11px] font-bold block",
                            status === 'completed' ? 'text-neutral-400' : 'text-blue-600'
                          )}>
                            {startTime}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-bold truncate",
                            status === 'completed' ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-gray-100'
                          )}>
                            {clientName}
                          </p>
                          <p className="text-[11px] text-neutral-500 truncate">{serviceName}</p>
                        </div>

                        {/* Status dot */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {status === 'completed' ? (
                            <div className="size-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                              <div className="size-1.5 rounded-full bg-emerald-600" />
                            </div>
                          ) : status === 'confirmed' ? (
                            <div className="size-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <div className="size-1.5 rounded-full bg-blue-600" />
                            </div>
                          ) : status === 'pending' ? (
                            <div className="size-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center animate-pulse">
                              <div className="size-1.5 rounded-full bg-yellow-600" />
                            </div>
                          ) : (
                            <div className="size-4 rounded-full bg-neutral-100 dark:bg-gray-700 flex items-center justify-center">
                              <div className="size-1.5 rounded-full bg-neutral-300 dark:bg-gray-500" />
                            </div>
                          )}

                          {/* Botão de anotações — sempre visível */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAppointmentForConsultation(apt)
                              setIsConsultationModalOpen(true)
                              setExpandedAppointmentId(null)
                            }}
                            className={cn(
                              "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
                              "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40",
                              "text-blue-600 dark:text-blue-400"
                            )}
                            title="Anotações da sessão"
                          >
                            <FileText className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Ações de status (expandidas) */}
                      {isExpanded && (
                        <div
                          className="px-4 pb-4 space-y-2 animate-in fade-in duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1.5 px-1 text-[11px] text-neutral-500 font-medium border-t border-blue-100/50 dark:border-blue-900/20 pt-3">
                            <User className="size-3" />
                            <span>{professionalName}</span>
                            <span className="mx-1 text-neutral-300">·</span>
                            <span>{price}</span>
                          </div>

                          <div className="flex gap-2">
                            {status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => { handleUpdateStatus(apt.id, 'confirmed'); setExpandedAppointmentId(null) }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider h-8"
                              >
                                Confirmar
                              </Button>
                            )}
                            {status === 'confirmed' && (
                              <Button
                                size="sm"
                                onClick={() => { handleUpdateStatus(apt.id, 'completed'); setExpandedAppointmentId(null) }}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider h-8"
                              >
                                Concluir
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Sessão */}
      <ConsultationModal
        appointment={selectedAppointmentForConsultation}
        open={isConsultationModalOpen}
        onOpenChange={setIsConsultationModalOpen}
      />
    </div>
  )
}

// Componente de Visualização Diária
function DayView({ currentDate, appointments, professionals, selectedProfessional, onDateChange, onAppointmentClick }) {
  // Filtrar agendamentos do dia selecionado (ordenados por horário)
  const dayAppointments = useMemo(() => {
    const filtered = appointments.filter(apt => {
      if (!apt.start_time) return false
      const aptDate = parseISO(apt.start_time)
      return isSameDay(aptDate, currentDate)
    })
    
    // Ordenar por horário de início
    return filtered.sort((a, b) => {
      const timeA = parseISO(a.start_time).getTime()
      const timeB = parseISO(b.start_time).getTime()
      return timeA - timeB
    })
  }, [appointments, currentDate])

  // Filtrar por profissional se selecionado (mantém ordem por horário)
  const filteredAppointments = useMemo(() => {
    if (selectedProfessional === 'all') return dayAppointments
    // Filtrar mantendo a ordem original (já ordenada por horário)
    return dayAppointments.filter(apt => {
      const profId = apt.professional?.id?.toString() || apt.account_user_id?.toString()
      return profId === selectedProfessional.toString()
    })
  }, [dayAppointments, selectedProfessional])

  // Agrupar agendamentos por horário (agrupar em slots de 30 minutos)
  const appointmentsByHour = useMemo(() => {
    const grouped = {}
    filteredAppointments.forEach(apt => {
      if (!apt.start_time) return
      const aptDate = parseISO(apt.start_time)
      const hour = aptDate.getHours()
      const minute = aptDate.getMinutes()
      // Arredondar para o slot de 30 minutos mais próximo
      const roundedMinute = minute < 30 ? 0 : 30
      const timeKey = `${hour.toString().padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}`
      
      if (!grouped[timeKey]) {
        grouped[timeKey] = []
      }
      grouped[timeKey].push(apt)
    })
    
    // Ordenar por horário (já ordenado, mas garantir ordem dentro de cada slot)
    return Object.keys(grouped)
      .sort()
      .reduce((acc, time) => {
        // Ordenar agendamentos dentro de cada slot por horário de início
        acc[time] = grouped[time].sort((a, b) => {
          const aTime = parseISO(a.start_time).getTime()
          const bTime = parseISO(b.start_time).getTime()
          return aTime - bTime
        })
        return acc
      }, {})
  }, [filteredAppointments])

  // Gerar slots de horário (6h às 23h)
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 6; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      if (hour < 23) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`)
      }
    }
    return slots
  }, [])

  // Agrupar profissionais para visualização em colunas (se houver muitos)
  const shouldShowByProfessional = professionals.length > 0 && professionals.length <= 8

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-neutral-200 dark:border-gray-800 overflow-hidden shadow-sm">
      {/* Header do dia */}
      <div className="px-8 py-6 border-b border-neutral-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Visão Diária</p>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white capitalize">
              {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider mr-2">
              {filteredAppointments.length} Total
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-full border-neutral-200"
              onClick={() => onDateChange(addDays(currentDate, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-full border-neutral-200"
              onClick={() => onDateChange(addDays(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-300">
            <CalendarIcon className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">Nenhum agendamento</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(appointmentsByHour).map(([timeSlot, slotAppointments]) => (
              <div key={timeSlot} className="flex gap-6">
                {/* Coluna de horário */}
                <div className="w-16 flex-shrink-0 pt-4">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider text-right">
                    {timeSlot}
                  </div>
                </div>

                {/* Coluna de agendamentos */}
                <div className="flex-1 space-y-3">
                  {slotAppointments.map(apt => (
                    <div 
                      key={apt.id}
                      className="group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border border-transparent hover:border-neutral-100 dark:hover:border-gray-700 hover:bg-neutral-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => onAppointmentClick(apt)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-neutral-900 dark:text-gray-100">
                            {apt?.client?.name || apt?.contact?.name || 'Cliente'}
                          </p>
                          <span className="text-[10px] font-bold text-neutral-500">
                            {formatCurrency(apt.price?.cents || apt.price_cents || 0, apt.price?.currency || apt.price_currency || 'BRL')}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500">{apt?.service?.name || 'Serviço'}</p>
                      </div>

                      <div className="flex flex-col items-center">
                        {normalizeStatus(apt.status) === 'completed' ? (
                          <div className="size-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <div className="size-1.5 rounded-full bg-emerald-600" />
                          </div>
                        ) : normalizeStatus(apt.status) === 'confirmed' ? (
                          <div className="size-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <div className="size-1.5 rounded-full bg-blue-600" />
                          </div>
                        ) : (
                          <div className="size-4 rounded-full bg-neutral-100 dark:bg-gray-700 flex items-center justify-center">
                            <div className="size-1.5 rounded-full bg-neutral-300 dark:bg-gray-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Componente de Card de Agendamento (Estilo Landing Page)
function AppointmentCard({ appointment, onClick }) {
  const status = normalizeStatus(appointment.status)
  const startTime = appointment.start_time ? format(parseISO(appointment.start_time), 'HH:mm') : ''
  const clientName = appointment?.client?.name || appointment?.contact?.name || appointment?.whatsapp_number || 'Cliente'
  const serviceName = appointment?.service?.name || 'Serviço'
  const price = formatCurrency(appointment.price?.cents || appointment.price_cents || 0, appointment.price?.currency || appointment.price_currency || 'BRL')

  return (
    <div 
      className={cn(
        "group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border border-transparent hover:border-neutral-100 dark:hover:border-gray-700 hover:bg-neutral-50 dark:hover:bg-gray-800 cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="text-center min-w-[45px]">
        <span className={cn(
          "text-[10px] font-bold block",
          status === 'completed' ? 'text-neutral-400' : 'text-blue-600'
        )}>
          {startTime}
        </span>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className={cn(
            "text-sm font-bold",
            status === 'completed' ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-gray-100'
          )}>
            {clientName}
          </p>
          <span className="text-[10px] font-bold text-neutral-500">{price}</span>
        </div>
        <p className="text-[11px] text-neutral-500">{serviceName}</p>
      </div>

      <div className="flex flex-col items-center">
        {status === 'completed' ? (
          <div className="size-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <div className="size-1.5 rounded-full bg-emerald-600" />
          </div>
        ) : status === 'confirmed' ? (
          <div className="size-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <div className="size-1.5 rounded-full bg-blue-600" />
          </div>
        ) : status === 'pending' ? (
          <div className="size-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center animate-pulse">
            <div className="size-1.5 rounded-full bg-yellow-600" />
          </div>
        ) : (
          <div className="size-4 rounded-full bg-neutral-100 dark:bg-gray-700 flex items-center justify-center">
            <div className="size-1.5 rounded-full bg-neutral-300 dark:bg-gray-500" />
          </div>
        )}
      </div>
    </div>
  )
}


