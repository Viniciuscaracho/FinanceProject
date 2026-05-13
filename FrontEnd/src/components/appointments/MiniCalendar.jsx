import { useState, useEffect, useMemo } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO, addDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Seg→Dom
const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

export function MiniCalendar({ currentDate, appointments = [], onDateSelect, className }) {
  const [miniMonth, setMiniMonth] = useState(() => startOfMonth(currentDate))

  // Sincroniza com o calendário principal quando ele navega para outro mês
  useEffect(() => {
    setMiniMonth(prev => {
      const next = startOfMonth(currentDate)
      return isSameMonth(prev, next) ? prev : next
    })
  }, [currentDate])

  const days = useMemo(() => {
    const start = startOfWeek(miniMonth, { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(miniMonth), { weekStartsOn: 1 })
    const result = []
    let d = start
    while (d <= end) { result.push(new Date(d)); d = addDays(d, 1) }
    return result
  }, [miniMonth])

  const datesWithApts = useMemo(() => {
    const s = new Set()
    appointments.forEach(apt => {
      if (apt.start_time) s.add(format(parseISO(apt.start_time), 'yyyy-MM-dd'))
    })
    return s
  }, [appointments])

  return (
    <div className={className ?? 'bg-white dark:bg-gray-900 rounded-2xl border border-neutral-200 dark:border-gray-800 p-4 shadow-sm select-none'}>
      {/* Cabeçalho do mês */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-bold text-neutral-800 dark:text-gray-200 capitalize">
          {format(miniMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <div className="flex gap-0.5">
          <button
            onClick={() => setMiniMonth(m => subMonths(m, 1))}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-gray-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setMiniMonth(m => addMonths(m, 1))}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-gray-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-gray-300 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Cabeçalho dias da semana */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-bold uppercase tracking-wide text-neutral-400 py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd')
          const isSelected = isSameDay(day, currentDate)
          const isCurrentMonth = isSameMonth(day, miniMonth)
          const isT = isToday(day)
          const hasApt = datesWithApts.has(key) && isCurrentMonth

          return (
            <button
              key={key}
              onClick={() => onDateSelect(day)}
              className={cn(
                'flex flex-col items-center py-0.5 rounded-lg group',
                !isCurrentMonth && 'opacity-25 pointer-events-none'
              )}
            >
              <span className={cn(
                'w-7 h-7 flex items-center justify-center text-[11px] font-semibold rounded-full transition-colors',
                isSelected
                  ? 'bg-blue-600 text-white'
                  : isT
                    ? 'ring-2 ring-blue-400 text-blue-600 dark:text-blue-400'
                    : 'text-neutral-700 dark:text-gray-300 group-hover:bg-neutral-100 dark:group-hover:bg-gray-800'
              )}>
                {format(day, 'd')}
              </span>
              <span className={cn('mt-0.5 h-1 w-1 rounded-full', hasApt ? 'bg-blue-400' : 'invisible')} />
            </button>
          )
        })}
      </div>

      {/* Botão Hoje */}
      <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-gray-800">
        <button
          onClick={() => {
            const today = new Date()
            setMiniMonth(startOfMonth(today))
            onDateSelect(today)
          }}
          className="w-full text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          Hoje
        </button>
      </div>
    </div>
  )
}
