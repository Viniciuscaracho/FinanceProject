import { Calendar as CalendarIcon, CheckCircle, AlertCircle, DollarSign } from 'lucide-react'
import { StatCard } from '@/components/design'
import { useAppointmentsContext } from '@/contexts/AppointmentsContext'
import { formatCurrency } from '@/utils/format'

export function AppointmentsStats() {
  const { appointments, stats } = useAppointmentsContext()

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatCard
        title="Total"
        value={appointments.length.toString()}
        icon={CalendarIcon}
        gradient="from-blue-400 to-cyan-500"
      />
      <StatCard
        title="Confirmados"
        value={stats.confirmed.toString()}
        icon={CheckCircle}
        gradient="from-green-400 to-emerald-500"
      />
      <StatCard
        title="Aguardando Pagamento"
        value={stats.pending.toString()}
        icon={AlertCircle}
        gradient="from-yellow-400 to-orange-500"
      />
      <StatCard
        title="Receita Total"
        value={formatCurrency(stats.totalRevenue)}
        icon={DollarSign}
        gradient="from-[#6B8FA3] to-[#5B7A9E]"
      />
    </div>
  )
}
