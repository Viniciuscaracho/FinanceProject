import React, { useEffect, useRef, useState, useCallback } from "react";
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

/**
 * CalendarHorizontal.jsx
 * - 3 semanas renderizadas: [prev, current, next]
 * - scroll horizontal com snap
 * - ao detectar que o usuário navegou para prev/next, atualiza currentDate e "re-centra" sem animação
 */

/* util: gera dados simples de uma semana */
function generateWeekFrom(date) {
  const base = new Date(date);
  // encontra domingo (início da semana)
  const start = startOfWeek(base, { weekStartsOn: 0 });

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(start, i);
    return {
      iso: format(d, "yyyy-MM-dd"),
      label: format(d, "EEE", { locale: ptBR }).toUpperCase(),
      day: d.getDate(),
      dateObj: d,
    };
  });

  return { days, startDate: start };
}

// Horários de 08:00 até 16:00
const HOURS = Array.from({ length: 9 }, (_, i) => 8 + i);

export default function CalendarHorizontal({ 
  appointments = [], 
  onEventClick,
  onViewFullCalendar 
}) {
  const containerRef = useRef(null);
  const isUserInteractingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [weeks, setWeeks] = useState([]);

  // cria prev / current / next
  useEffect(() => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 7);
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 7);

    setWeeks([
      generateWeekFrom(prev),
      generateWeekFrom(currentDate),
      generateWeekFrom(next),
    ]);
  }, [currentDate]);

  // sempre que semanas mudam, move instantaneamente para o centro (sem animação)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // garantir que compute width seja a da viewport
    const width = window.innerWidth || el.clientWidth;
    // mover instantaneamente para o centro
    el.scrollLeft = width;
  }, [weeks]);

  // util: ir para prev/next via estado
  const goPrevWeekByState = useCallback(() => {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setDate(d.getDate() - 7);
      return n;
    });
  }, []);

  const goNextWeekByState = useCallback(() => {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setDate(d.getDate() + 7);
      return n;
    });
  }, []);

  const goToday = () => setCurrentDate(new Date());

  // trata scroll: converte roda vertical em rolagem horizontal quando o mouse estiver sobre o container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      // quando o ponteiro está sobre o calendário, transform vertical wheel em horizontal scroll
      // e previne o scroll vertical da página
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollBy({ left: e.deltaY, behavior: "auto" });
      }
      // deixar o onScroll cuidar do snap / troca de semanas
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // atacha handlers de teclado (left / right)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") {
        goPrevWeekByState();
      } else if (e.key === "ArrowRight") {
        goNextWeekByState();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrevWeekByState, goNextWeekByState]);

  // scroll handler: detecta quando o usuário "saiu" da coluna do meio (index 1).
  // usamos debounce para esperar o snap acabar e então atualizar o state (invisível ao usuário).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      isUserInteractingRef.current = true;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        // quando parar de rolar, decide em qual "slide" estamos
        const width = window.innerWidth || el.clientWidth;
        const index = Math.round(el.scrollLeft / width); // 0,1,2
        // se saiu do centro:
        if (index === 0) {
          // move state 1 semana para trás e re-renderiza as 3 semanas, que serão recentradas pelo effect acima
          goPrevWeekByState();
        } else if (index === 2) {
          goNextWeekByState();
        } else {
          // index === 1 -> permanece
          // garantir que esteja perfeitamente centrado (snap já deve ter centralizado, mas asseguramos)
          el.scrollTo({ left: width, behavior: "smooth" });
        }
        isUserInteractingRef.current = false;
      }, 120); // short debounce para detectar "fim" do scroll
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [weeks, goPrevWeekByState, goNextWeekByState]); // rebind quando semanas mudam

  // Obter intervalo de datas da semana atual (a do meio)
  const currentWeek = weeks.length > 1 ? weeks[1] : weeks[0];
  const dateRange = currentWeek
    ? (() => {
        const first = currentWeek.days[0].dateObj;
        const last = currentWeek.days[6].dateObj;
        return `${format(first, "d", { locale: ptBR })} - ${format(
          last,
          "d 'de' MMMM",
          { locale: ptBR }
        )}`;
      })()
    : "";

  return (
    <div className="w-full p-4">
      {/* header de controle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={goToday}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm font-medium transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={goPrevWeekByState}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-lg font-semibold transition-colors"
          >
            ←
          </button>
          <button
            onClick={goNextWeekByState}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-lg font-semibold transition-colors"
          >
            →
          </button>
        </div>

        <div className="flex items-center gap-4">
          {dateRange && (
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {dateRange}
            </div>
          )}
          {onViewFullCalendar && (
            <button
              onClick={onViewFullCalendar}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              Calendário Completo
            </button>
          )}
        </div>
      </div>

      {/* container horizontal */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide bg-white dark:bg-surface-elevated border border-border rounded-lg"
        style={{ WebkitOverflowScrolling: "touch" }} // touch momentum
      >
        {weeks.map((week, idx) => (
          <div
            key={`week-${week.startDate.getTime()}-${idx}`}
            className="min-w-full snap-center border-l border-gray-200"
          >
            <WeekView week={week} appointments={appointments} onEventClick={onEventClick} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* visualização de uma semana com grid e eventos */
function WeekView({ week, appointments = [], onEventClick }) {
  // Converter appointments para eventos organizados por dia e hora
  const eventsByDayAndHour = {};

  appointments.forEach((apt) => {
    if (!apt.start_time || !apt.end_time) return;

    const startDate = new Date(apt.start_time);
    const endDate = new Date(apt.end_time);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;

    // Encontrar qual dia da semana corresponde
    const dayIndex = week.days.findIndex((d) => isSameDay(d.dateObj, startDate));
    if (dayIndex === -1) return;

    const startHour = startDate.getHours();
    const startMinutes = startDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinutes = endDate.getMinutes();

    const key = `${dayIndex}-${startHour}`;
    if (!eventsByDayAndHour[key]) {
      eventsByDayAndHour[key] = [];
    }

    // Status colors
    const status =
      typeof apt.status === "number"
        ? ["pending", "confirmed", "completed", "canceled", "no_show"][apt.status] ||
          "pending"
        : apt.status || "pending";

    const statusColorMap = {
      pending: "bg-amber-500",
      confirmed: "bg-emerald-500",
      completed: "bg-blue-500",
      canceled: "bg-red-500",
      no_show: "bg-gray-500",
    };

    const clientName =
      apt?.client?.name || apt?.client?.whatsapp_number || "Cliente";
    const serviceName = apt?.service?.name || "Serviço";

    eventsByDayAndHour[key].push({
      id: apt.id,
      title: serviceName,
      clientName: clientName,
      startHour,
      startMinutes,
      endHour,
      endMinutes,
      color: statusColorMap[status] || "bg-gray-500",
      appointment: apt,
    });
  });

  // Contar agendamentos por dia
  const appointmentsCountByDay = week.days.map((day) => {
    return appointments.filter((apt) => {
      if (!apt.start_time) return false;
      const aptDate = new Date(apt.start_time);
      return isSameDay(aptDate, day.dateObj);
    }).length;
  });

  return (
    <div className="w-full">
      {/* Cabeçalho dos dias */}
      <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b bg-gray-50 dark:bg-surface">
        <div className="border-r"></div>
        {week.days.map((d, index) => (
          <div
            key={d.iso}
            className={`py-3 text-center border-r ${
              isToday(d.dateObj)
                ? "bg-blue-50 dark:bg-blue-950/20"
                : "bg-gray-50 dark:bg-surface"
            }`}
          >
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
              {d.label}
            </div>
            <div
              className={`text-lg font-bold mt-1 ${
                isToday(d.dateObj)
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {d.day}
            </div>
            {appointmentsCountByDay[index] > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                -{appointmentsCountByDay[index]}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Grid de horários */}
      <div className="grid grid-cols-[80px_repeat(7,1fr)] max-h-[600px] overflow-y-auto scrollbar-hide">
        {HOURS.map((hour) => (
          <div key={hour} className="contents">
            {/* Coluna de horas */}
            <div className="border-r border-b px-2 py-4 text-xs text-gray-500 dark:text-gray-400 text-right">
              {String(hour).padStart(2, "0")}:00
            </div>

            {/* Células dos dias */}
            {week.days.map((day, dayIndex) => {
              const events = eventsByDayAndHour[`${dayIndex}-${hour}`] || [];
              return (
                <div
                  key={`${day.iso}-${hour}`}
                  className="relative border-r border-b min-h-[64px] p-1"
                >
                  {events.map((event) => {
                    // Calcular altura baseada na duração
                    const durationMinutes =
                      (event.endHour - event.startHour) * 60 +
                      event.endMinutes -
                      event.startMinutes;
                    const height = Math.max((durationMinutes / 60) * 64 - 2, 48);

                    return (
                      <div
                        key={event.id}
                        className={`${event.color} text-white rounded p-1.5 mb-1 cursor-pointer hover:opacity-90 transition-opacity text-xs shadow-sm`}
                        style={{ height: `${height}px` }}
                        onClick={() => onEventClick && onEventClick(event.appointment)}
                        title={`${event.title} - ${event.clientName}`}
                      >
                        <div className="font-semibold truncate">{event.title}</div>
                        <div className="opacity-90 text-[10px] mt-0.5">
                          {String(event.startHour).padStart(2, "0")}:
                          {String(event.startMinutes).padStart(2, "0")} -{" "}
                          {String(event.endHour).padStart(2, "0")}:
                          {String(event.endMinutes).padStart(2, "0")}
                        </div>
                        {event.clientName && (
                          <div className="opacity-80 text-[9px] mt-1 truncate">
                            {event.clientName}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ESCONDE BARRAS DE ROLAGEM */
const styles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// Adicionar estilos ao documento se ainda não existirem
if (typeof document !== "undefined") {
  const styleId = "calendar-horizontal-scrollbar-hide";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = styles;
    document.head.appendChild(style);
  }
}
