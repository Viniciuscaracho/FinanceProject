import { useState, useEffect, useMemo, useCallback, useRef, startTransition } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO, getDaysInMonth, addDays, startOfDay, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Phone, FileText, Check, X, AlertCircle, MessageCircle } from 'lucide-react'
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
import { normalizeAppointments, normalizeStatus, STATUS_CONFIG } from '@/utils/appointmentUtils'
import { formatCurrency } from '@/utils/format'
import { ConsultationModal } from './ConsultationModal'
import { useAppointments } from '@/hooks/useAppointments'
import { MiniCalendar } from './MiniCalendar'
import { T, DISPLAY } from '@/lib/tokens'
import { openWhatsApp, WA_TEMPLATES, getAppointmentPhone } from '@/lib/whatsapp'
import { useIsMobile } from '@/hooks/use-mobile'
import { Sheet, SheetContent } from '@/components/ui/sheet'

const STATUS_COLORS = {
  pending:   { color: '#F59E0B', label: 'Pendente'   },
  confirmed: { color: '#4C60AA', label: 'Confirmado' },
  completed: { color: '#10B981', label: 'Concluído'  },
  canceled:  { color: '#D1D5DB', label: 'Cancelado'  },
  no_show:   { color: '#D1D5DB', label: 'Não veio'   },
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Capacidade diária de referência para a barra de progresso da view semanal
const DAILY_CAPACITY = 8

// Statuses que não ocupam slot (excluídos da contagem de capacidade)
const INACTIVE_STATUSES = new Set(['canceled', 'no_show'])

// Cores dos indicadores de status no calendário mensal
const STATUS_DOT_COLORS = {
  pending:   'bg-amber-400',
  confirmed: 'bg-[#4C60AA]',
  completed: 'bg-[#10B981]',
  canceled:  'bg-gray-300',
  no_show:   'bg-gray-300',
}

// Indicador visual de status (anel + ícone) usado nos cards da view diária
function StatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const iconCls = cn('flex-shrink-0', cfg.iconColor)

  let inner
  if (status === 'completed') {
    inner = <Check className={cn(iconCls, 'size-2.5')} strokeWidth={3} />
  } else if (status === 'canceled') {
    inner = <X className={cn(iconCls, 'size-2.5')} strokeWidth={3} />
  } else if (status === 'no_show') {
    inner = <AlertCircle className={cn(iconCls, 'size-2.5')} strokeWidth={2.5} />
  } else {
    inner = <div className={cn('size-1.5 rounded-full', cfg.dot)} />
  }

  return (
    <div className={cn(
      'size-4 rounded-full flex items-center justify-center',
      cfg.ring,
      cfg.pulse && 'animate-pulse',
    )}>
      {inner}
    </div>
  )
}

export function AppointmentsCalendar({ newlyCreatedAppointment, onHighlightDone }) {
  const isMobile = useIsMobile()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month') // 'month' | 'week' | 'day'
  const [selectedProfessional, setSelectedProfessional] = useState('all')
  const [professionals, setProfessionals] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedAppointmentId, setExpandedAppointmentId] = useState(null)
  const [mobileSheetApt, setMobileSheetApt] = useState(null)
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false)
  const [selectedAppointmentForConsultation, setSelectedAppointmentForConsultation] = useState(null)
  const [highlightedAptId, setHighlightedAptId] = useState(null)
  const highlightTimerRef = useRef(null)

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

  // Ao receber um agendamento recém-criado: trocar para day view e navegar até a data
  useEffect(() => {
    if (!newlyCreatedAppointment?.start_time) return
    const appointmentDate = parseISO(newlyCreatedAppointment.start_time)
    startTransition(() => {
      setViewMode('day')
      setCurrentDate(appointmentDate)
    })
  }, [newlyCreatedAppointment])

  // Após o refetch trazer o novo agendamento, scrollar e destacar o card
  useEffect(() => {
    if (!newlyCreatedAppointment?.id || viewMode !== 'day') return
    const isInList = allAppointments.some(
      (apt) => String(apt.id) === String(newlyCreatedAppointment.id)
    )
    if (!isInList) return

    const timer = setTimeout(() => {
      const el = document.querySelector(
        `[data-apt-id="${newlyCreatedAppointment.id}"]`
      )
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
      setHighlightedAptId(String(newlyCreatedAppointment.id))
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedAptId(null)
        onHighlightDone?.()
      }, 3000)
    }, 120)

    return () => clearTimeout(timer)
  }, [allAppointments, viewMode, newlyCreatedAppointment, onHighlightDone])

  // Carregar mês quando currentDate mudar (otimizado para fluidez)
  useEffect(() => {
    if (!loadMonth) return
    
    // Usar startTransition para tornar a mudança de mês não-bloqueante
    startTransition(() => {
      // Carregar mês atual imediatamente (prioridade)
      loadMonth(currentDate).catch(err => {
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

  const goToPrevious = useCallback(() => {
    startTransition(() => {
      setCurrentDate(prev =>
        viewMode === 'week' ? addDays(prev, -7) :
        viewMode === 'day'  ? addDays(prev, -1) :
        subMonths(prev, 1)
      )
    })
  }, [viewMode])

  const goToNext = useCallback(() => {
    startTransition(() => {
      setCurrentDate(prev =>
        viewMode === 'week' ? addDays(prev, 7) :
        viewMode === 'day'  ? addDays(prev, 1) :
        addMonths(prev, 1)
      )
    })
  }, [viewMode])

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

  // Handler para expandir/colapsar agendamento (desktop) ou abrir sheet (mobile)
  const handleToggleExpand = (apt) => {
    if (isMobile) {
      setMobileSheetApt(apt)
    } else {
      setExpandedAppointmentId(prev => prev === apt.id ? null : apt.id)
    }
  }

  // Handler para atualizar status do agendamento
  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await apiService.updateAppointment(appointmentId, { status: newStatus })
      if (loadMonth) await loadMonth(currentDate)
    } catch (error) {
    }
  }

  // Handler para reagendar por drag & drop
  const handleReschedule = useCallback(async (aptId, newStartISO, newEndISO) => {
    try {
      await apiService.updateAppointment(aptId, {
        start_time: newStartISO,
        end_time: newEndISO,
      })
      if (loadMonth) await loadMonth(currentDate)
    } catch (error) {
    }
  }, [loadMonth, currentDate])

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
                        <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: T.brand }}>
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
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: T.brand }}>
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

      {/* Layout de duas colunas: mini-cal + calendário principal */}
      <div className="flex gap-6 items-start">
        {/* Mini-calendário lateral */}
        <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-6">
          <MiniCalendar
            currentDate={currentDate}
            appointments={allAppointments}
            onDateSelect={(day) => startTransition(() => setCurrentDate(day))}
          />
        </aside>

        {/* Calendário principal */}
        <div className="flex-1 min-w-0 space-y-6">

      {/* Header do Calendário */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              className="size-9 rounded-full border-neutral-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="size-9 rounded-full border-neutral-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="min-w-[150px]">
            {viewMode === 'week' ? (
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                {format(startOfWeek(currentDate, { weekStartsOn: 1 }), "d MMM", { locale: ptBR })}
                {' – '}
                {format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), "d MMM", { locale: ptBR })}
              </h2>
            ) : (
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white capitalize">
                {format(currentDate, "MMMM", { locale: ptBR })}
              </h2>
            )}
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              {format(currentDate, "yyyy")}
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={goToToday}
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: T.brand }}
          >
            Hoje
          </Button>
        </div>

        {/* Toggle Mês/Semana/Dia */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-gray-800 rounded-xl p-1 border border-neutral-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('month')}
            className={cn(
              "rounded-lg text-xs font-bold uppercase tracking-wider px-4",
              viewMode === 'month'
                ? "bg-white dark:bg-gray-700 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            )}
            style={viewMode === 'month' ? { color: T.brand } : {}}
          >
            Mês
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('week')}
            className={cn(
              "rounded-lg text-xs font-bold uppercase tracking-wider px-4",
              viewMode === 'week'
                ? "bg-white dark:bg-gray-700 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            )}
            style={viewMode === 'week' ? { color: T.brand } : {}}
          >
            Semana
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('day')}
            className={cn(
              "rounded-lg text-xs font-bold uppercase tracking-wider px-4",
              viewMode === 'day'
                ? "bg-white dark:bg-gray-700 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            )}
            style={viewMode === 'day' ? { color: T.brand } : {}}
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
                          load === 'low'   && "bg-[#EEF2FA]/30 hover:bg-[#EEF2FA]/60",
                          load === 'mid'   && "bg-[#EEF2FA]/55 hover:bg-[#EEF2FA]/80",
                          load === 'high'  && "bg-[#EEF2FA]/80 hover:bg-[#EEF2FA]",
                          cell.isToday && "z-10",
                          !cell.isCurrentMonth && "opacity-30"
                        )}
                        style={cell.isToday ? { boxShadow: `inset 0 0 0 2px ${T.brand}` } : {}}
                      >
                        {/* Número do dia */}
                        <span
                          className={cn(
                            "text-sm font-semibold leading-none self-start",
                            load === 'empty' ? "text-neutral-300 dark:text-gray-600" : "text-neutral-700 dark:text-gray-200",
                            cell.isToday && "flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-xs"
                          )}
                          style={cell.isToday ? { background: T.brand } : {}}
                        >
                          {cell.dayNumber}
                        </span>

                        {/* Badge de quantidade */}
                        {cell.appointmentCount > 0 && (
                          <span className="absolute top-2 right-2 text-[10px] font-bold leading-none text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center" style={{ background: T.brand }}>
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
                                  className="h-1 flex-1 rounded-full"
                                  style={{ background: STATUS_COLORS[status]?.color || '#9CA3AF' }}
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

      {/* Visualização Semanal */}
      {viewMode === 'week' && (
        <WeekView
          currentDate={currentDate}
          appointments={appointments}
          onReschedule={handleReschedule}
          onDayClick={(day) => {
            setSelectedDay(day)
            setIsModalOpen(true)
            setExpandedAppointmentId(null)
          }}
          onAppointmentClick={(apt) => {
            setSelectedDay(parseISO(apt.start_time))
            setIsModalOpen(true)
            setExpandedAppointmentId(null)
          }}
        />
      )}

      {/* Visualização Diária */}
      {viewMode === 'day' && (
        <DayView
          currentDate={currentDate}
          appointments={appointments}
          professionals={professionals}
          selectedProfessional={selectedProfessional}
          onDateChange={setCurrentDate}
          highlightedAptId={highlightedAptId}
          onReschedule={handleReschedule}
          onAppointmentClick={(apt) => {
            setSelectedDay(parseISO(apt.start_time))
            setIsModalOpen(true)
            setExpandedAppointmentId(null)
          }}
        />
      )}

        </div>{/* /flex-1 calendário principal */}
      </div>{/* /flex gap-6 layout */}

      {/* Modal Central - Agendamentos do Dia */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[520px] p-0 flex flex-col overflow-hidden [&>button]:top-6 [&>button]:right-6 [&>button]:z-10 rounded-[2rem] border-none shadow-2xl">
          {/* Header Fixo (estilo landing page) */}
          <DialogHeader className="px-8 pt-8 pb-6 border-b border-neutral-100 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-[#1A1C1E] sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: T.brand }}>
                  Agenda do dia
                </p>
                <DialogTitle className="text-2xl font-bold text-neutral-900 dark:text-white capitalize">
                  {selectedDay && format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                </DialogTitle>
              </div>
              <div className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider" style={{ background: T.chip, color: T.brand }}>
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

                  const statusColor = STATUS_COLORS[status]?.color || '#9CA3AF'
                  const initials = clientName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

                  return (
                    <div
                      key={apt.id}
                      className={cn(
                        "group flex flex-col rounded-2xl transition-all duration-200 border",
                        isExpanded
                          ? "border-[#4C60AA]/20 shadow-sm"
                          : "border-transparent hover:border-neutral-100 dark:hover:border-gray-700"
                      )}
                      style={{
                        borderLeft: `3px solid ${statusColor}`,
                        background: isExpanded ? T.chip : 'transparent',
                        transition: 'background 100ms',
                      }}
                      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = T.bg }}
                      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}
                    >
                      {/* Linha principal — clicável para expandir status actions */}
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer"
                        onClick={() => handleToggleExpand(apt)}
                      >
                        {/* Initials avatar */}
                        <div
                          className="flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
                          style={{ width: 30, height: 30, background: statusColor + '20', color: statusColor }}
                        >
                          {initials}
                        </div>

                        {/* Horário + Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold" style={{ color: statusColor }}>
                              {startTime}
                            </span>
                            <p className={cn(
                              "text-sm font-bold truncate",
                              status === 'canceled' ? 'text-neutral-400 line-through' :
                              status === 'completed' ? 'text-neutral-400 line-through' :
                              'text-neutral-900 dark:text-gray-100'
                            )}>
                              {clientName}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-neutral-500 truncate">{serviceName}</p>
                            <span
                              className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5"
                              style={{ borderRadius: 20, background: statusColor + '18', color: statusColor }}
                            >
                              {STATUS_COLORS[status]?.label || status}
                            </span>
                          </div>
                        </div>

                        {/* Ações rápidas — sempre visíveis */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {getAppointmentPhone(apt) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openWhatsApp(getAppointmentPhone(apt), WA_TEMPLATES.confirmation(apt))
                              }}
                              className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
                              style={{ background: '#25D36618', color: '#25D366' }}
                              title="Avisar via WhatsApp"
                            >
                              <MessageCircle className="size-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAppointmentForConsultation(apt)
                              setIsConsultationModalOpen(true)
                              setExpandedAppointmentId(null)
                            }}
                            className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ background: T.chip, color: T.brand }}
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
                          <div className="flex items-center gap-1.5 px-1 text-[11px] text-neutral-500 font-medium border-t border-neutral-100 dark:border-gray-800 pt-3">
                            <User className="size-3" />
                            <span>{professionalName}</span>
                            <span className="mx-1 text-neutral-300">·</span>
                            <span>{price}</span>
                          </div>

                          <div className="flex gap-2">
                            {getAppointmentPhone(apt) && (
                              <Button
                                size="sm"
                                onClick={() => openWhatsApp(getAppointmentPhone(apt), WA_TEMPLATES.confirmation(apt))}
                                className="h-8 text-[10px] font-bold uppercase tracking-wider px-3"
                                style={{ background: '#25D36618', color: '#25D366', borderRadius: 8, border: '1px solid #25D36630' }}
                              >
                                <MessageCircle className="size-3 mr-1.5" />
                                Avisar
                              </Button>
                            )}
                            {status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => { handleUpdateStatus(apt.id, 'confirmed'); setExpandedAppointmentId(null) }}
                                className="flex-1 text-[10px] font-bold uppercase tracking-wider h-8"
                                style={{ background: T.brand, color: '#fff', borderRadius: 8 }}
                              >
                                Confirmar
                              </Button>
                            )}
                            {status === 'confirmed' && (
                              <Button
                                size="sm"
                                onClick={() => { handleUpdateStatus(apt.id, 'completed'); setExpandedAppointmentId(null) }}
                                className="flex-1 text-[10px] font-bold uppercase tracking-wider h-8"
                                style={{ background: T.green, color: '#fff', borderRadius: 8 }}
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

      {/* Bottom Sheet de ações rápidas — Mobile */}
      <Sheet open={!!mobileSheetApt} onOpenChange={(o) => { if (!o) setMobileSheetApt(null) }}>
        <SheetContent side="bottom" style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: '0 0 env(safe-area-inset-bottom)' }}>
          {mobileSheetApt && (() => {
            const apt    = mobileSheetApt
            const status = normalizeStatus(apt.status)
            const sc     = STATUS_COLORS[status] ?? { color: '#9CA3AF', label: status }
            const clientName    = apt?.client?.name || apt?.contact?.name || apt?.whatsapp_number || 'Cliente'
            const serviceName   = apt?.service?.name || 'Serviço'
            const startTime     = apt.start_time ? format(parseISO(apt.start_time), 'HH:mm') : ''
            const price         = formatCurrency(apt.price?.cents || apt.price_cents || 0, apt.price?.currency || apt.price_currency || 'BRL')
            const phone         = getAppointmentPhone(apt)
            const close         = () => setMobileSheetApt(null)

            return (
              <div style={{ padding: '20px 20px 28px' }}>
                {/* Handle */}
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 20px' }} />

                {/* Client info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: sc.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: sc.color }}>
                      {clientName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{clientName}</p>
                    <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>{serviceName} · {startTime} · {price}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: sc.color, background: sc.color + '18', borderRadius: 20, padding: '4px 10px', flexShrink: 0 }}>
                    {sc.label}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {phone && (
                    <button
                      onClick={() => { openWhatsApp(phone, WA_TEMPLATES.confirmation(apt)); close() }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px', borderRadius: 14,
                        background: '#25D36618', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#25D36628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageCircle size={20} style={{ color: '#25D366' }} />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#1d7a3f' }}>Avisar via WhatsApp</span>
                    </button>
                  )}

                  {status === 'pending' && (
                    <button
                      onClick={() => { handleUpdateStatus(apt.id, 'confirmed'); close() }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px', borderRadius: 14,
                        background: T.chip, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: T.brand + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={20} style={{ color: T.brand }} />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Confirmar agendamento</span>
                    </button>
                  )}

                  {status === 'confirmed' && (
                    <button
                      onClick={() => { handleUpdateStatus(apt.id, 'completed'); close() }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px', borderRadius: 14,
                        background: T.green + '10', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: T.green + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={20} style={{ color: T.green }} />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Concluir atendimento</span>
                    </button>
                  )}

                  <button
                    onClick={() => { close(); setSelectedAppointmentForConsultation(apt); setIsConsultationModalOpen(true) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 14,
                      background: T.chip, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: T.brand + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={20} style={{ color: T.brand }} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Anotações da sessão</span>
                  </button>
                </div>
              </div>
            )
          })()}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Componente de Visualização Diária (grade completa de horários com drag & drop)
function DayView({ currentDate, appointments, professionals, selectedProfessional, onDateChange, onAppointmentClick, highlightedAptId, onReschedule }) {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedAptId, setDraggedAptId] = useState(null)
  const [dragOverSlot, setDragOverSlot] = useState(null)
  const gridRef = useRef(null)

  const filteredAppointments = useMemo(() => {
    const dayApts = appointments
      .filter(apt => apt.start_time && isSameDay(parseISO(apt.start_time), currentDate))
      .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime())
    if (selectedProfessional === 'all') return dayApts
    return dayApts.filter(apt => {
      const profId = apt.professional?.id?.toString() || apt.account_user_id?.toString()
      return profId === selectedProfessional.toString()
    })
  }, [appointments, currentDate, selectedProfessional])

  const appointmentsBySlot = useMemo(() => {
    const grouped = {}
    filteredAppointments.forEach(apt => {
      const d = parseISO(apt.start_time)
      const h = d.getHours()
      const m = d.getMinutes() < 30 ? 0 : 30
      const key = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      grouped[key] = grouped[key] ? [...grouped[key], apt] : [apt]
    })
    return grouped
  }, [filteredAppointments])

  // Slots de 30 min de 6h às 23h
  const timeSlots = useMemo(() => {
    const slots = []
    for (let h = 6; h <= 23; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`)
      if (h < 23) slots.push(`${String(h).padStart(2, '0')}:30`)
    }
    return slots
  }, [])

  // Scroll automático ao primeiro agendamento (ou 08:00) ao mudar de dia
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const first = filteredAppointments[0]
    const targetH = first?.start_time ? parseISO(first.start_time).getHours() : 8
    const slotKey = `${String(Math.max(targetH - 1, 6)).padStart(2, '0')}:00`
    const el = grid.querySelector(`[data-slot="${slotKey}"]`)
    if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, [currentDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragStart = (e, apt) => {
    e.dataTransfer.setData('text/plain', String(apt.id))
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
    setDraggedAptId(String(apt.id))
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setDraggedAptId(null)
    setDragOverSlot(null)
  }

  const handleSlotDrop = (e, slotTime) => {
    e.preventDefault()
    const aptId = e.dataTransfer.getData('text/plain')
    const apt = appointments.find(a => String(a.id) === aptId)
    if (!apt?.start_time) { handleDragEnd(); return }

    const origStart = parseISO(apt.start_time)
    const origEnd = apt.end_time ? parseISO(apt.end_time) : null
    const durationMs = origEnd ? origEnd.getTime() - origStart.getTime() : 60 * 60 * 1000

    const [h, m] = slotTime.split(':').map(Number)
    const origSlotM = origStart.getMinutes() < 30 ? 0 : 30
    if (isSameDay(origStart, currentDate) && origStart.getHours() === h && origSlotM === m) {
      handleDragEnd(); return
    }

    const newStart = new Date(currentDate)
    newStart.setHours(h, m, 0, 0)
    const newEnd = new Date(newStart.getTime() + durationMs)

    handleDragEnd()
    onReschedule?.(aptId, newStart.toISOString(), newEnd.toISOString())
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-neutral-200 dark:border-gray-800 overflow-hidden shadow-sm">
      {/* Header do dia */}
      <div className="px-8 py-6 border-b border-neutral-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: T.brand }}>Visão Diária</p>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white capitalize">
              {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider mr-2" style={{ background: T.chip, color: T.brand }}>
              {filteredAppointments.length} Total
            </div>
            <Button variant="outline" size="icon" className="size-8 rounded-full border-neutral-200" onClick={() => onDateChange(addDays(currentDate, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8 rounded-full border-neutral-200" onClick={() => onDateChange(addDays(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grade de horários */}
      <div ref={gridRef} className="overflow-y-auto max-h-[580px]">
        <div className="px-6 py-2">
          {timeSlots.map(slot => {
            const isHour = slot.endsWith(':00')
            const slotApts = appointmentsBySlot[slot] || []
            const isDropTarget = isDragging && dragOverSlot === slot

            return (
              <div
                key={slot}
                data-slot={slot}
                className={cn(
                  'flex gap-4 transition-colors duration-100',
                  isDropTarget && 'bg-blue-50 dark:bg-blue-900/20 rounded-xl'
                )}
                onDragOver={e => { e.preventDefault(); setDragOverSlot(slot) }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverSlot(null) }}
                onDrop={e => handleSlotDrop(e, slot)}
              >
                {/* Label de horário */}
                <div className="w-14 flex-shrink-0 text-right pt-[10px]">
                  {isHour ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.brand }}>{slot}</span>
                  ) : (
                    <span className="text-[9px] text-neutral-300 dark:text-gray-700">{slot}</span>
                  )}
                </div>

                {/* Conteúdo do slot */}
                <div className={cn(
                  'flex-1 border-t min-h-[36px] py-1 space-y-2',
                  isHour
                    ? 'border-neutral-100 dark:border-gray-800'
                    : 'border-dashed border-neutral-100/60 dark:border-gray-800/40'
                )}>
                  {slotApts.map(apt => {
                    const aptStatus = normalizeStatus(apt.status)
                    const aptStatusColor = STATUS_COLORS[aptStatus]?.color || '#9CA3AF'
                    const aptClientName = apt?.client?.name || apt?.contact?.name || 'Cliente'
                    const aptInitials = aptClientName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                    return (
                    <div
                      key={apt.id}
                      draggable
                      onDragStart={e => handleDragStart(e, apt)}
                      onDragEnd={handleDragEnd}
                      data-apt-id={apt.id}
                      className={cn(
                        'group flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 border border-transparent cursor-grab active:cursor-grabbing select-none',
                        String(apt.id) === String(highlightedAptId) && 'apt-highlight',
                        isDragging && draggedAptId === String(apt.id) && 'opacity-40'
                      )}
                      style={{ borderLeft: `3px solid ${aptStatusColor}`, transition: 'background 100ms' }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.bg }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      onClick={() => !isDragging && onAppointmentClick(apt)}
                    >
                      <div
                        className="flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
                        style={{ width: 30, height: 30, background: aptStatusColor + '20', color: aptStatusColor }}
                      >
                        {aptInitials}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-neutral-900 dark:text-gray-100">
                            {aptClientName}
                          </p>
                          <span className="text-[10px] font-bold text-neutral-500">
                            {formatCurrency(apt.price?.cents || apt.price_cents || 0, apt.price?.currency || apt.price_currency || 'BRL')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] text-neutral-500">{apt?.service?.name || 'Serviço'}</p>
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5"
                            style={{ borderRadius: 20, background: aptStatusColor + '18', color: aptStatusColor }}
                          >
                            {STATUS_COLORS[aptStatus]?.label || aptStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  )})}

                  {/* Indicador de soltar para slots vazios */}
                  {isDropTarget && slotApts.length === 0 && (
                    <div className="h-9 rounded-xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: T.brand + '80' }}>
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.brand }}>Soltar aqui</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Barra de capacidade para o cabeçalho da view semanal
function CapacityBar({ count, capacity }) {
  const pct = capacity > 0 ? Math.min((count / capacity) * 100, 100) : 0
  const colorClass =
    pct >= 100 ? 'bg-red-500' :
    pct >= 75  ? 'bg-amber-400' :
    'bg-emerald-500'

  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-neutral-400 mb-0.5">
        <span>{count}/{capacity}</span>
        {pct >= 100 && <span className="text-red-500">Lotado</span>}
      </div>
      <div className="h-1 w-full bg-neutral-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// Card compacto para a view semanal (com suporte a drag)
function WeekAppointmentCard({ apt, onDragStart, onDragEnd, isDragging, onClick }) {
  const status = normalizeStatus(apt.status)
  const startTime = apt.start_time ? format(parseISO(apt.start_time), 'HH:mm') : ''
  const clientName = apt?.client?.name || apt?.contact?.name || 'Cliente'

  const cardStyle = Object.fromEntries(
    Object.entries(STATUS_CONFIG).map(([s, c]) => [
      s,
      cn(c.border, c.card, c.dim && 'opacity-60'),
    ])
  )

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'px-2 py-1.5 rounded-lg border-l-2 transition-all select-none cursor-grab active:cursor-grabbing',
        isDragging ? 'opacity-40' : 'hover:brightness-95',
        cardStyle[status] || cardStyle.pending
      )}
      onClick={onClick}
    >
      <p className="text-[9px] font-bold text-neutral-400">{startTime}</p>
      <p className="text-[11px] font-semibold text-neutral-800 dark:text-gray-200 truncate leading-tight">
        {clientName}
      </p>
    </div>
  )
}

// View semanal com 7 colunas, barra de capacidade e drag & drop
function WeekView({ currentDate, appointments, onDayClick, onAppointmentClick, onReschedule }) {
  const [dragOverDayKey, setDragOverDayKey] = useState(null)
  const [draggedAptId, setDraggedAptId] = useState(null)

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  const aptsByDay = useMemo(() => {
    return days.map(day => {
      const dayApts = appointments
        .filter(apt => apt.start_time && isSameDay(parseISO(apt.start_time), day))
        .sort((a, b) => parseISO(a.start_time) - parseISO(b.start_time))
      const activeCount = dayApts.filter(
        apt => !INACTIVE_STATUSES.has(normalizeStatus(apt.status))
      ).length
      return { day, apts: dayApts, activeCount }
    })
  }, [days, appointments])

  const handleDragStart = (e, apt) => {
    e.dataTransfer.setData('text/plain', String(apt.id))
    e.dataTransfer.effectAllowed = 'move'
    setDraggedAptId(String(apt.id))
  }

  const handleDragEnd = () => {
    setDraggedAptId(null)
    setDragOverDayKey(null)
  }

  const handleDrop = (e, targetDay) => {
    e.preventDefault()
    const aptId = e.dataTransfer.getData('text/plain')
    const apt = appointments.find(a => String(a.id) === aptId)
    if (!apt?.start_time) { handleDragEnd(); return }

    const origStart = parseISO(apt.start_time)
    if (isSameDay(origStart, targetDay)) { handleDragEnd(); return }

    const origEnd = apt.end_time ? parseISO(apt.end_time) : null
    const durationMs = origEnd ? origEnd.getTime() - origStart.getTime() : 60 * 60 * 1000

    const newStart = new Date(targetDay)
    newStart.setHours(origStart.getHours(), origStart.getMinutes(), 0, 0)
    const newEnd = new Date(newStart.getTime() + durationMs)

    handleDragEnd()
    onReschedule?.(aptId, newStart.toISOString(), newEnd.toISOString())
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-neutral-200 dark:border-gray-800 overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 divide-x divide-neutral-100 dark:divide-gray-800">
        {aptsByDay.map(({ day, apts, activeCount }) => {
          const dayKey = day.toISOString()
          const isDropTarget = dragOverDayKey === dayKey && draggedAptId !== null

          return (
            <div
              key={dayKey}
              className={cn(
                'flex flex-col min-h-[320px] transition-colors duration-100',
                isDropTarget && 'bg-blue-50/60 dark:bg-blue-900/10'
              )}
              onDragOver={e => { e.preventDefault(); setDragOverDayKey(dayKey) }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDayKey(null) }}
              onDrop={e => handleDrop(e, day)}
            >
              {/* Cabeçalho com capacidade */}
              <div
                className={cn(
                  'px-3 py-3 border-b border-neutral-100 dark:border-gray-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-gray-800/50 transition-colors',
                  isDropTarget && 'bg-[#EEF2FA]/70'
                )}
                style={isToday(day) ? { background: T.chip } : {}}
                onClick={() => onDayClick(day)}
              >
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: isToday(day) ? T.brand : undefined }}>
                  {format(day, 'EEE', { locale: ptBR })}
                </p>
                <p className="text-lg font-bold leading-none mt-0.5" style={{ color: isToday(day) ? T.brand : undefined }}>
                  {format(day, 'd')}
                </p>
                <CapacityBar count={activeCount} capacity={DAILY_CAPACITY} />
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-[240px]">
                {apts.map(apt => (
                  <WeekAppointmentCard
                    key={apt.id}
                    apt={apt}
                    onDragStart={e => handleDragStart(e, apt)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedAptId === String(apt.id)}
                    onClick={() => onAppointmentClick(apt)}
                  />
                ))}

                {isDropTarget && (
                  <div className="h-9 rounded-lg border-2 border-dashed flex items-center justify-center" style={{ borderColor: T.brand + '80' }}>
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: T.brand }}>Reagendar aqui</span>
                  </div>
                )}

                {apts.length === 0 && !isDropTarget && (
                  <p className="text-center text-[10px] text-neutral-200 dark:text-gray-700 pt-6 font-medium select-none">—</p>
                )}
              </div>
            </div>
          )
        })}
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
          STATUS_CONFIG[status]?.iconColor || 'text-blue-600'
        )}>
          {startTime}
        </span>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className={cn(
            "text-sm font-bold",
            status === 'canceled' ? 'text-red-400 line-through' :
            status === 'completed' ? 'text-neutral-400 line-through' :
            'text-neutral-900 dark:text-gray-100'
          )}>
            {clientName}
          </p>
          <span className="text-[10px] font-bold text-neutral-500">{price}</span>
        </div>
        <p className="text-[11px] text-neutral-500">{serviceName}</p>
      </div>

      <div className="flex flex-col items-center">
        <StatusDot status={status} />
      </div>
    </div>
  )
}


