import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, PAYMENT_STATUS_LABELS, STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/utils/appointmentUtils'
import { formatCurrency } from '@/utils/format'
import { User, Clock, Apple, DollarSign, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CalendarTooltip({ appointment }) {
  if (!appointment) return null

  const status = appointment.status || 'pending'
  const paymentStatus = appointment.payment_status || 'pending'
  const startTime = appointment.start_time ? format(new Date(appointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'
  const endTime = appointment.end_time ? format(new Date(appointment.end_time), 'HH:mm', { locale: ptBR }) : '-'

  return (
    <div className="p-4 space-y-3 min-w-[280px] bg-white dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base mb-1.5 text-gray-900 dark:text-white truncate">
            {appointment.client?.name || appointment.client?.whatsapp_number || 'Cliente'}
          </h4>
          {appointment.client?.whatsapp_number && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{appointment.client.whatsapp_number}</span>
            </div>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end flex-shrink-0">
          <Badge className={cn(
            STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
            "border border-gray-300 dark:border-gray-600"
          )} variant="outline">
            {STATUS_LABELS[status] || status}
          </Badge>
          <Badge className={cn(
            PAYMENT_STATUS_COLORS[paymentStatus] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
            "border border-gray-300 dark:border-gray-600"
          )} variant="outline">
            {PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus}
          </Badge>
        </div>
      </div>

      <div className="space-y-2 text-sm border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center gap-2.5">
          <Apple className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300 truncate">{appointment.service?.name || 'Serviço'}</span>
        </div>
        
        <div className="flex items-center gap-2.5">
          <User className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300 truncate">{appointment.professional?.name || 'Profissional'}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300">{startTime} - {endTime}</span>
        </div>

        {appointment.price?.cents && (
          <div className="flex items-center gap-2.5 pt-1">
            <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(appointment.price.cents, appointment.price.currency || 'BRL')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}


