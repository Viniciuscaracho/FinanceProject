import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, getDay } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

// ===============================
// GOOGLE CALENDAR STYLE CALENDAR
// ALL-IN-ONE REACT + TAILWIND
// ===============================

// Utils -------------------------------------

function getMonthMatrix(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const matrix = [];
  let dayCounter = 1;
  let nextCounter = 1;

  for (let row = 0; row < 6; row++) {
    const week = [];
    for (let col = 0; col < 7; col++) {
      const cellIndex = row * 7 + col;

      if (cellIndex < firstDay) {
        week.push({
          day: prevMonthDays - (firstDay - cellIndex - 1),
          currentMonth: false,
          date: new Date(year, month - 1, prevMonthDays - (firstDay - cellIndex - 1)),
        });
      } else if (dayCounter > daysInMonth) {
        week.push({
          day: nextCounter++,
          currentMonth: false,
          date: new Date(year, month + 1, nextCounter - 1),
        });
      } else {
        week.push({
          day: dayCounter++,
          currentMonth: true,
          date: new Date(year, month, dayCounter - 1),
        });
      }
    }
    matrix.push(week);
  }

  return matrix;
}

function isTodayDate(date, day) {
  const today = new Date();
  return (
    today.getDate() === day &&
    today.getMonth() === date.getMonth() &&
    today.getFullYear() === date.getFullYear()
  );
}

// Status colors map - cores mais vibrantes e modernas
const statusColorMap = {
  pending: "bg-amber-500 hover:bg-amber-600",
  confirmed: "bg-emerald-500 hover:bg-emerald-600",
  completed: "bg-blue-500 hover:bg-blue-600",
  canceled: "bg-red-500 hover:bg-red-600",
  no_show: "bg-gray-500 hover:bg-gray-600",
};

function getStatusColor(status) {
  const statusStr =
    typeof status === "number"
      ? ["pending", "confirmed", "completed", "canceled", "no_show"][status] || "pending"
      : status || "pending";
  return statusColorMap[statusStr] || "bg-gray-500 border-gray-600";
}

// --------------------------------------------
// COMPONENTE PRINCIPAL
// --------------------------------------------

export default function FullCalendar({ 
  appointments = [], 
  onEventClick,
  hours = { start: 8, end: 20 }, // 8h às 20h por padrão
  resourceName, // Nome do recurso/profissional exibido no header
  onViewFullCalendar // Callback para botão "Calendário Semanal"
}) {
  const [view, setView] = useState("week");
  const [date, setDate] = useState(new Date());

  const next = () => {
    const d = new Date(date);
    if (view === "month") d.setMonth(date.getMonth() + 1);
    if (view === "week") d.setDate(date.getDate() + 7);
    if (view === "day") d.setDate(date.getDate() + 1);
    if (view === "agenda") d.setDate(date.getDate() + 7);
    setDate(d);
  };

  const prev = () => {
    const d = new Date(date);
    if (view === "month") d.setMonth(date.getMonth() - 1);
    if (view === "week") d.setDate(date.getDate() - 7);
    if (view === "day") d.setDate(date.getDate() - 1);
    if (view === "agenda") d.setDate(date.getDate() - 7);
    setDate(d);
  };

  const reset = () => setDate(new Date());

  // Formatar data baseado na view
  const getDateLabel = () => {
    if (view === "month") {
      return format(date, "MMMM yyyy", { locale: ptBR });
    } else if (view === "week") {
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, "dd", { locale: ptBR })} - ${format(weekEnd, "dd 'de' MMMM", { locale: ptBR })}`;
    } else if (view === "day") {
      return format(date, "EEEE 'de' dd 'de' MMMM", { locale: ptBR });
    } else {
      // agenda
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, "dd", { locale: ptBR })} - ${format(weekEnd, "dd 'de' MMMM", { locale: ptBR })}`;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface">
      {/* ======================== */}
      {/* HEADER SUPERIOR */}
      {/* ======================== */}
      {onViewFullCalendar && (
        <div className="flex justify-end px-6 pt-4">
          <button
            onClick={onViewFullCalendar}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Calendário Semanal
          </button>
        </div>
      )}

      {/* ======================== */}
      {/* HEADER PRINCIPAL */}
      {/* ======================== */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-border rounded-md overflow-hidden">
            <button
              onClick={reset}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={prev}
              className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors border-l border-border"
            >
              ←
            </button>
            <button
              onClick={next}
              className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors border-l border-border"
            >
              →
            </button>
          </div>
          <h2 className="text-2xl font-semibold text-text-primary capitalize ml-2">
            {getDateLabel()}
          </h2>
        </div>

        <div className="flex items-center gap-1 border border-border rounded-md overflow-hidden bg-surface-elevated">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              view === "day"
                ? "bg-brand-accent text-white"
                : "text-text-secondary hover:text-text-primary hover:bg-surface"
            }`}
            onClick={() => setView("day")}
          >
            Dia
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-border ${
              view === "week"
                ? "bg-brand-accent text-white"
                : "text-text-secondary hover:text-text-primary hover:bg-surface"
            }`}
            onClick={() => setView("week")}
          >
            Semana
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-border ${
              view === "month"
                ? "bg-brand-accent text-white"
                : "text-text-secondary hover:text-text-primary hover:bg-surface"
            }`}
            onClick={() => setView("month")}
          >
            Mês
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-border ${
              view === "agenda"
                ? "bg-brand-accent text-white"
                : "text-text-secondary hover:text-text-primary hover:bg-surface"
            }`}
            onClick={() => setView("agenda")}
          >
            Agenda
          </button>
        </div>
      </div>

      {/* ======================== */}
      {/* SWITCH DE VIEWS */}
      {/* ======================== */}
      <div className="flex-1 bg-surface-elevated overflow-hidden">
        {view === "month" && (
          <MonthView date={date} appointments={appointments} onEventClick={onEventClick} resourceName={resourceName} />
        )}
        {view === "week" && (
          <WeekView date={date} appointments={appointments} onEventClick={onEventClick} hours={hours} resourceName={resourceName} />
        )}
        {view === "day" && (
          <DayView date={date} appointments={appointments} onEventClick={onEventClick} hours={hours} resourceName={resourceName} />
        )}
        {view === "agenda" && (
          <AgendaView date={date} appointments={appointments} onEventClick={onEventClick} />
        )}
      </div>
    </div>
  );
}

/////////////////////////////////////////////////////////
// MONTH VIEW — estilo Google Calendar
/////////////////////////////////////////////////////////

function MonthView({ date, appointments = [], onEventClick, resourceName }) {
  const matrix = getMonthMatrix(date);

  // Criar lista de eventos com informações de span (multi-dia)
  const flatMatrix = matrix.flat();
  
  // Para cada evento, determinar em quais células ele aparece
  const cellEvents = {}; // cellIndex -> [events]
  
  appointments.forEach((apt) => {
    if (!apt.start_time || !apt.end_time) return;
    const startDate = new Date(apt.start_time);
    const endDate = new Date(apt.end_time);
    
    // Encontrar todas as células que o evento cobre
    flatMatrix.forEach((cell, cellIndex) => {
      const cellDate = cell.date;
      // Verificar se o evento cruza este dia
      if (
        (cellDate >= startDate && cellDate <= endDate) ||
        isSameDay(cellDate, startDate) ||
        isSameDay(cellDate, endDate)
      ) {
        if (!cellEvents[cellIndex]) {
          cellEvents[cellIndex] = [];
        }
        cellEvents[cellIndex].push({
          appointment: apt,
          startDate,
          endDate,
          startCellIndex: flatMatrix.findIndex((c) => isSameDay(c.date, startDate)),
          isStart: isSameDay(cellDate, startDate),
          isEnd: isSameDay(cellDate, endDate),
        });
      }
    });
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header com nome do recurso */}
      {resourceName && (
        <div className="text-center py-3 border-b border-border bg-surface font-semibold text-text-primary">
          {resourceName}
        </div>
      )}
      
      <div className="grid grid-cols-7 border-t border-l border-border flex-1 overflow-auto">
        {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((d) => (
          <div
            key={d}
            className="border-r border-b border-border p-3 text-center text-xs font-semibold text-text-secondary bg-surface sticky top-0 z-10 uppercase tracking-wide"
          >
            {d}
          </div>
        ))}

        {flatMatrix.map((cell, i) => {
          const eventsInCell = cellEvents[i] || [];
          
          // Separar eventos que começam aqui (multi-dia) dos eventos simples
          const multiDayEvents = eventsInCell.filter(
            (e) => e.isStart && e.startCellIndex !== undefined && 
            (isSameDay(e.endDate, e.startDate) === false || 
             Math.abs((e.endDate - e.startDate) / (1000 * 60 * 60 * 24)) >= 1)
          );
          
          const simpleEvents = eventsInCell.filter(
            (e) => !multiDayEvents.some((mde) => mde.appointment.id === e.appointment.id)
          ).slice(0, 3 - multiDayEvents.length);

          return (
            <div
              key={i}
              className={`border-r border-b border-border p-3 relative min-h-[140px] ${
                cell.currentMonth
                  ? "bg-surface-elevated"
                  : "bg-surface text-text-secondary opacity-60"
              } ${
                isTodayDate(date, cell.day)
                  ? "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-brand-accent"
                  : ""
              }`}
            >
              <span
                className={`text-base font-semibold ${
                  isTodayDate(date, cell.day)
                    ? "text-brand-accent"
                    : cell.currentMonth
                    ? "text-text-primary"
                    : "text-text-secondary"
                }`}
              >
                {cell.day}
              </span>

              {/* Eventos multi-dia (que se estendem por várias células) */}
              {multiDayEvents.map((event) => {
                const clientName =
                  event.appointment?.client?.name || 
                  event.appointment?.client?.whatsapp_number || 
                  "Cliente";
                const serviceName = event.appointment?.service?.name || "Serviço";
                const statusColor = getStatusColor(event.appointment.status);
                
                // Calcular quantos dias o evento cobre
                const daysDiff = Math.ceil((event.endDate - event.startDate) / (1000 * 60 * 60 * 24)) + 1;
                const col = i % 7;
                const remainingCols = 7 - col;
                const spanDays = Math.min(daysDiff, remainingCols);

                return (
                  <div
                    key={event.appointment.id}
                    className={`mt-2 text-xs ${statusColor} text-white px-2 py-1.5 rounded-md cursor-pointer hover:opacity-90 transition-all shadow-sm font-medium truncate`}
                    style={{
                      width: `${(spanDays / 7) * 100}%`,
                    }}
                    onClick={() => onEventClick && onEventClick(event.appointment)}
                    title={`${serviceName} – ${clientName} ${format(event.startDate, "HH:mm")}`}
                  >
                    <span className="font-semibold">{format(event.startDate, "HH:mm")}</span> {serviceName}
                  </div>
                );
              })}

              {/* Eventos simples do dia */}
              {simpleEvents.map((event) => {
                const startTime = event.startDate;
                const clientName =
                  event.appointment?.client?.name || 
                  event.appointment?.client?.whatsapp_number || 
                  "Cliente";
                const serviceName = event.appointment?.service?.name || "Serviço";
                const statusColor = getStatusColor(event.appointment.status);

                return (
                  <div
                    key={event.appointment.id}
                    className={`mt-2 text-xs ${statusColor} text-white px-2 py-1.5 rounded-md cursor-pointer hover:opacity-90 transition-all shadow-sm font-medium truncate`}
                    onClick={() => onEventClick && onEventClick(event.appointment)}
                    title={`${serviceName} – ${clientName} ${format(startTime, "HH:mm")}`}
                  >
                    <span className="font-semibold">{format(startTime, "HH:mm")}</span> {serviceName}
                  </div>
                );
              })}

              {eventsInCell.length > 3 && (
                <div className="mt-2 text-xs text-text-secondary px-2 font-medium">
                  +{eventsInCell.length - 3} mais
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/////////////////////////////////////////////////////////
// WEEK VIEW — estilo Google Calendar
/////////////////////////////////////////////////////////

function WeekView({ date, appointments = [], onEventClick, hours = { start: 8, end: 20 }, resourceName }) {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const week = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const hourRange = Array.from({ length: hours.end - hours.start }, (_, i) => hours.start + i);

  // Agrupar appointments por dia e hora
  const appointmentsByDayAndHour = {};
  appointments.forEach((apt) => {
    if (!apt.start_time || !apt.end_time) return;
    const startDate = new Date(apt.start_time);
    const dayIndex = week.findIndex((d) => isSameDay(d, startDate));
    if (dayIndex === -1) return;

    const startHour = startDate.getHours();
    const key = `${dayIndex}-${startHour}`;
    if (!appointmentsByDayAndHour[key]) {
      appointmentsByDayAndHour[key] = [];
    }
    appointmentsByDayAndHour[key].push(apt);
  });

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Header com nome do recurso */}
      {resourceName && (
        <div className="text-center py-3 border-b border-border bg-surface font-semibold text-text-primary sticky top-0 z-20">
          {resourceName}
        </div>
      )}
      
      <div className="grid grid-cols-[80px_1fr] flex-1">
        {/* Coluna dos horários */}
        <div className="border-r border-border bg-surface">
          {hourRange.map((hour) => (
            <div
              key={hour}
              className="h-20 border-b border-border text-xs text-text-secondary px-3 flex items-start pt-2 font-medium"
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Conteúdo da semana */}
        <div className="grid grid-cols-7 border-l border-border">
          {/* Header dos dias */}
          {week.map((d, i) => (
            <div
              key={i}
              className={`text-center py-3 border-r border-b border-border ${
                isToday(d)
                  ? "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-brand-accent"
                  : "bg-surface-elevated"
              }`}
            >
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                {format(d, "EEE", { locale: ptBR })}
              </div>
              <div
                className={`text-xl font-bold mt-1 ${
                  isToday(d) ? "text-brand-accent" : "text-text-primary"
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          ))}

          {/* Grade */}
          {week.map((_, col) => (
            <div key={col} className="border-r border-border relative">
              {/* Linhas horizontais */}
              {hourRange.map((_, row) => (
                <div key={row} className="h-20 border-b border-border" />
              ))}

            {/* Eventos */}
            {hourRange.map((hour, row) => {
              const key = `${col}-${hour}`;
              const events = appointmentsByDayAndHour[key] || [];

              return events.map((apt) => {
                const startDate = new Date(apt.start_time);
                const endDate = new Date(apt.end_time);
                const startHour = startDate.getHours();
                const startMinutes = startDate.getMinutes();
                const endHour = endDate.getHours();
                const endMinutes = endDate.getMinutes();

                // Calcular altura baseada na duração
                const durationMinutes =
                  (endHour - startHour) * 60 + endMinutes - startMinutes;
                const height = Math.max((durationMinutes / 60) * 80 - 4, 56);

                const topOffset = (startMinutes / 60) * 80;

                const clientName =
                  apt?.client?.name || apt?.client?.whatsapp_number || "Cliente";
                const serviceName = apt?.service?.name || "Serviço";
                const statusColor = getStatusColor(apt.status);

                return (
                  <div
                    key={apt.id}
                    className={`absolute left-2 right-2 ${statusColor} text-white text-xs rounded-md px-3 py-2 shadow-md cursor-pointer hover:opacity-90 transition-all z-10`}
                    style={{
                      top: `${row * 80 + topOffset}px`,
                      height: `${height}px`,
                    }}
                    onClick={() => onEventClick && onEventClick(apt)}
                    title={`${serviceName} – ${clientName}`}
                  >
                    <div className="font-bold truncate mb-1">{serviceName}</div>
                    <div className="opacity-90 text-[11px] font-medium">
                      {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                    </div>
                    {clientName && (
                      <div className="opacity-80 text-[10px] mt-1 truncate">{clientName}</div>
                    )}
                  </div>
                );
              });
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/////////////////////////////////////////////////////////
// DAY VIEW — estilo Google Calendar
/////////////////////////////////////////////////////////

function DayView({ date, appointments = [], onEventClick, hours = { start: 8, end: 20 }, resourceName }) {
  const hourRange = Array.from({ length: hours.end - hours.start }, (_, i) => hours.start + i);

  // Filtrar appointments do dia
  const dayAppointments = appointments.filter((apt) => {
    if (!apt.start_time) return false;
    return isSameDay(new Date(apt.start_time), date);
  });

  // Agrupar por hora
  const appointmentsByHour = {};
  dayAppointments.forEach((apt) => {
    const startDate = new Date(apt.start_time);
    const hour = startDate.getHours();
    if (!appointmentsByHour[hour]) {
      appointmentsByHour[hour] = [];
    }
    appointmentsByHour[hour].push(apt);
  });

  // Linha do horário atual (se for hoje)
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const isCurrentDay = isToday(date);
  const currentTimeOffset = isCurrentDay
    ? (currentHour - hours.start) * 64 + (currentMinutes / 60) * 64
    : null;

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Header com nome do recurso */}
      {resourceName && (
        <div className="text-center py-3 border-b border-border bg-surface font-semibold text-text-primary sticky top-0 z-20">
          {resourceName}
        </div>
      )}
      
      <div className="grid grid-cols-[80px_1fr] flex-1">
        {/* Horários */}
        <div className="border-r border-border bg-surface">
          {hourRange.map((hour) => (
            <div
              key={hour}
              className="h-20 border-b border-border text-xs text-text-secondary flex items-start px-3 pt-2 font-medium"
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Coluna do dia */}
        <div className="relative">
          {/* Linhas */}
          {hourRange.map((_, i) => (
            <div key={i} className="h-20 border-b border-border" />
          ))}

        {/* Eventos */}
        {dayAppointments.map((apt) => {
          const startDate = new Date(apt.start_time);
          const endDate = new Date(apt.end_time);
          const startHour = startDate.getHours();
          const startMinutes = startDate.getMinutes();
          const endHour = endDate.getHours();
          const endMinutes = endDate.getMinutes();

          // Calcular posição e altura
          const topOffset = (startHour - hours.start) * 80 + (startMinutes / 60) * 80;
          const durationMinutes =
            (endHour - startHour) * 60 + endMinutes - startMinutes;
          const height = Math.max((durationMinutes / 60) * 80 - 4, 56);

          const clientName =
            apt?.client?.name || apt?.client?.whatsapp_number || "Cliente";
          const serviceName = apt?.service?.name || "Serviço";
          const statusColor = getStatusColor(apt.status);

          return (
            <div
              key={apt.id}
              className={`absolute left-3 right-3 ${statusColor} text-white text-sm px-4 py-3 rounded-md shadow-md cursor-pointer hover:opacity-90 transition-all z-10`}
              style={{
                top: `${topOffset}px`,
                height: `${height}px`,
              }}
              onClick={() => onEventClick && onEventClick(apt)}
              title={`${serviceName} – ${clientName}`}
            >
              <div className="font-bold mb-1">{serviceName}</div>
              <div className="opacity-90 text-xs font-medium">
                {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
              </div>
              {clientName && (
                <div className="opacity-80 text-xs mt-2">{clientName}</div>
              )}
            </div>
          );
        })}

        {/* Linha do horário atual */}
        {isCurrentDay && currentTimeOffset !== null && (
          <div
            className="absolute left-0 right-0 flex items-center z-20"
            style={{ top: `${(currentHour - hours.start) * 80 + (currentMinutes / 60) * 80}px` }}
          >
            <div className="w-4 h-4 bg-white border-[3px] border-brand-accent rounded-full -ml-2 shadow-md" />
            <div className="h-[2px] bg-brand-accent flex-1" />
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

/////////////////////////////////////////////////////////
// AGENDA VIEW — lista de eventos
/////////////////////////////////////////////////////////

function AgendaView({ date, appointments = [], onEventClick }) {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = addDays(weekStart, 6);

  // Filtrar e ordenar appointments da semana
  const weekAppointments = appointments
    .filter((apt) => {
      if (!apt.start_time) return false;
      const aptDate = new Date(apt.start_time);
      return aptDate >= weekStart && aptDate <= weekEnd;
    })
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  // Agrupar por dia
  const appointmentsByDay = {};
  weekAppointments.forEach((apt) => {
    const aptDate = new Date(apt.start_time);
    const dateKey = format(aptDate, "yyyy-MM-dd");
    if (!appointmentsByDay[dateKey]) {
      appointmentsByDay[dateKey] = [];
    }
    appointmentsByDay[dateKey].push(apt);
  });

  // Gerar dias da semana
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const day = addDays(weekStart, i);
    return {
      date: day,
      dateKey: format(day, "yyyy-MM-dd"),
      appointments: appointmentsByDay[format(day, "yyyy-MM-dd")] || [],
    };
  });

  return (
    <div className="h-full overflow-auto">
      {weekDays.map((day) => (
        <div key={day.dateKey} className="border-b border-border">
          {/* Header do dia */}
          <div
            className={`px-6 py-4 font-bold text-lg ${
              isToday(day.date)
                ? "bg-blue-50 dark:bg-blue-950/30 text-brand-accent border-l-4 border-l-brand-accent"
                : "bg-surface text-text-primary border-l-4 border-l-transparent"
            }`}
          >
            {format(day.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </div>

          {/* Eventos do dia */}
          {day.appointments.length === 0 ? (
            <div className="px-6 py-12 text-center text-text-secondary text-sm">
              Nenhum agendamento neste dia
            </div>
          ) : (
            <div className="divide-y divide-border">
              {day.appointments.map((apt) => {
                const startDate = new Date(apt.start_time);
                const endDate = new Date(apt.end_time);
                const clientName =
                  apt?.client?.name || apt?.client?.whatsapp_number || "Cliente";
                const serviceName = apt?.service?.name || "Serviço";
                const statusColor = getStatusColor(apt.status);

                return (
                  <div
                    key={apt.id}
                    className="px-6 py-4 hover:bg-surface cursor-pointer transition-colors"
                    onClick={() => onEventClick && onEventClick(apt)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center min-w-[80px]">
                        <div className="text-base font-bold text-text-primary">
                          {format(startDate, "HH:mm")}
                        </div>
                        <div className="text-xs text-text-secondary font-medium">
                          {format(endDate, "HH:mm")}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-4 h-4 rounded ${statusColor.split(' ')[0]}`} />
                          <div className="font-bold text-text-primary text-base">
                            {serviceName}
                          </div>
                        </div>
                        <div className="text-sm text-text-secondary ml-7">
                          {clientName}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
