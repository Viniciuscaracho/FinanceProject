import React, { useEffect, useMemo, useState, useRef } from "react";
import { format, addDays, isSameDay, isToday, getDay } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

// Horas de 6h às 23h
const hours = Array.from({ length: 18 }, (_, i) => 6 + i);
const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Header do calendário
function CalendarHeader({ weekStart, onPrev, onNext, onToday }) {
  const weekEnd = addDays(weekStart, 6);
  const formatted = `${format(weekStart, "d", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMMM", { locale: ptBR })}`;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white dark:bg-gray-800">
      <div className="flex gap-2 items-center">
        <button 
          className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-sm font-medium" 
          onClick={onToday}
        >
          Hoje
        </button>
        <button 
          className="px-2 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-lg" 
          onClick={onPrev}
        >
          ‹
        </button>
        <button 
          className="px-2 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-lg" 
          onClick={onNext}
        >
          ›
        </button>
      </div>
      <div className="font-semibold text-base text-gray-900 dark:text-gray-100">{formatted}</div>
    </div>
  );
}

// Card de evento
function EventCard({ event, onClick }) {
  const duration = event.end - event.start;
  const height = Math.max(duration * 60, 40); // Mínimo 40px
  const startTime = `${String(event.start).padStart(2, '0')}:00`;
  const endTime = `${String(event.end).padStart(2, '0')}:00`;

  return (
    <div
      className="absolute left-1 right-1 rounded px-2 py-1 text-white text-xs shadow cursor-pointer hover:shadow-md transition-all z-10"
      style={{
        top: "2px",
        height: `${height}px`,
        backgroundColor: event.color || '#3b82f6',
        minHeight: '40px'
      }}
      title={`${event.title} — ${startTime} - ${endTime}`}
      onClick={() => onClick?.(event)}
    >
      <div className="font-semibold truncate">{event.title}</div>
      <div className="opacity-90 text-[10px]">{startTime} - {endTime}</div>
      {event.clientName && (
        <div className="opacity-80 text-[9px] truncate mt-1">{event.clientName}</div>
      )}
    </div>
  );
}

// Componente principal
export default function WeekCalendar({ appointments = [], onEventClick }) {
  const [baseDate, setBaseDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [weekOffset, setWeekOffset] = useState(0);
  const scrollContainerRef = useRef(null);
  const timeColumnRef = useRef(null);

  const days = useMemo(() => {
    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() + (weekOffset * 7));
    return Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  }, [baseDate, weekOffset]);

  // Converter appointments para eventos
  const events = useMemo(() => {
    return appointments
      .filter(apt => apt.start_time && apt.end_time)
      .map(apt => {
        const startDate = new Date(apt.start_time);
        const endDate = new Date(apt.end_time);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

        const dayIndex = days.findIndex(d => isSameDay(d, startDate));
        if (dayIndex === -1) return null;

        const startHour = startDate.getHours();
        const endHour = endDate.getHours();
        const endMinutes = endDate.getMinutes();
        const endHourAdjusted = endMinutes > 0 ? endHour + 1 : endHour;

        const status = typeof apt.status === 'number' 
          ? ['pending', 'confirmed', 'completed', 'canceled', 'no_show'][apt.status] || 'pending'
          : apt.status || 'pending';

        const statusColorMap = {
          pending: '#f59e0b',
          confirmed: '#10b981',
          completed: '#3b82f6',
          canceled: '#ef4444',
          no_show: '#6b7280'
        };

        return {
          id: apt.id,
          title: apt?.service?.name || 'Serviço',
          clientName: apt?.client?.name || apt?.client?.whatsapp_number || 'Cliente',
          dayIndex,
          start: startHour,
          end: endHourAdjusted,
          color: statusColorMap[status] || '#6b7280',
          appointment: apt
        };
      })
      .filter(Boolean);
  }, [appointments, days]);

  // Sincronizar scroll vertical da coluna de horas com o grid
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const timeColumn = timeColumnRef.current;
    
    if (!scrollContainer || !timeColumn) return;

    const handleScroll = () => {
      timeColumn.scrollTop = scrollContainer.scrollTop;
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  function go(offsetDays) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + offsetDays);
    setBaseDate(d);
    setWeekOffset(0);
  }

  function goToday() {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    setBaseDate(d);
    setWeekOffset(0);
  }

  const handleEventClick = (event) => {
    if (onEventClick && event.appointment) {
      onEventClick(event.appointment);
    }
  };

  // Calcular posição da linha de hora atual
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimePosition = currentHour < 6 || currentHour >= 24 ? null : 
    ((currentHour - 6) * 60 + currentMinutes) * (100 / (18 * 60));

  return (
    <div className="w-full h-full border border-gray-200 rounded-lg bg-white dark:bg-gray-800 shadow-sm flex flex-col overflow-hidden">
      <CalendarHeader
        weekStart={days[0]}
        onPrev={() => go(-7)}
        onNext={() => go(+7)}
        onToday={goToday}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Coluna de horas fixa (estilo Google Calendar) */}
        <div 
          ref={timeColumnRef}
          className="w-16 border-r border-gray-200 overflow-y-auto overflow-x-hidden flex-shrink-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="h-[60px]"></div> {/* Espaço para header */}
          {hours.map((hour) => {
            const isCurrentHour = isToday(days[0]) && currentHour === hour;
            return (
              <div
                key={hour}
                className={`h-[60px] border-b border-gray-100 text-xs px-2 flex items-start pt-1 ${
                  isCurrentHour 
                    ? 'text-blue-600 font-semibold' 
                    : 'text-gray-500'
                }`}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            );
          })}
        </div>

        {/* Grid principal com scroll */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div style={{ minWidth: '1400px' }}>
            {/* Header dos dias */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-white dark:bg-gray-800 sticky top-0 z-20">
              {days.map((d, i) => {
                const isTodayDate = isToday(d);
                return (
                  <div
                    key={i}
                    className={`h-[60px] border-r border-gray-200 text-center py-2 ${
                      isTodayDate ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                      {dayNames[getDay(d)]}
                    </div>
                    <div className={`text-sm font-semibold ${
                      isTodayDate 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {format(d, "d", { locale: ptBR })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grid de horas e dias */}
            <div className="relative" style={{ height: `${hours.length * 60}px` }}>
              {/* Linha de hora atual */}
              {isToday(days[0]) && currentTimePosition !== null && (
                <div
                  className="absolute left-0 right-0 z-30 pointer-events-none"
                  style={{
                    top: `${currentTimePosition}%`,
                    height: '2px',
                    backgroundColor: '#ea4335',
                    zIndex: 30
                  }}
                >
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow"></div>
                </div>
              )}

              {/* Grid de células */}
              <div className="grid grid-cols-7">
                {days.map((d, dayIndex) => (
                  <div key={dayIndex} className="relative border-r border-gray-100">
                    {hours.map((hour) => {
                      const isTodayColumn = isToday(d);
                      return (
                        <div
                          key={`${dayIndex}-${hour}`}
                          className={`h-[60px] border-b border-gray-100 relative ${
                            isTodayColumn ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          {/* Eventos neste slot */}
                          {events
                            .filter(e => e.dayIndex === dayIndex && e.start === hour)
                            .map(event => (
                              <EventCard
                                key={event.id}
                                event={event}
                                onClick={handleEventClick}
                              />
                            ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
