import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FluidSection } from '@/components/design'
import { useAppointmentsContext } from '@/contexts/AppointmentsContext'

const DEFAULT_FILTERS = {
  status: 'all',
  payment_status: 'all',
  account_user_id: 'all',
  start_date: '',
  end_date: '',
}

export function AppointmentsFilters() {
  const {
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    professionals,
  } = useAppointmentsContext()

  const setFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }))

  const hasActiveFilters =
    searchTerm ||
    filters.status !== 'all' ||
    filters.payment_status !== 'all' ||
    filters.account_user_id !== 'all' ||
    filters.start_date ||
    filters.end_date

  const clearAll = () => {
    setSearchTerm('')
    setFilters(DEFAULT_FILTERS)
  }

  return (
    <FluidSection
      title="Filtros"
      subtitle="Busque e filtre agendamentos"
      gradient="from-cyan-500 to-blue-500"
    >
      <div className="space-y-3">
        {/* Linha 1: busca + limpar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cliente, serviço, profissional ou telefone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="shrink-0 gap-1.5 text-gray-500 hover:text-gray-800">
              <X className="w-3.5 h-3.5" />
              Limpar
            </Button>
          )}
        </div>

        {/* Linha 2: selects + datas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Select value={filters.status} onValueChange={(v) => setFilter('status', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Status do Agendamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Aguardando Pagamento</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
              <SelectItem value="no_show">Não Compareceu</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.payment_status} onValueChange={(v) => setFilter('payment_status', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Status do Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Pagamentos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
              <SelectItem value="refunded">Reembolsado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.account_user_id} onValueChange={(v) => setFilter('account_user_id', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Profissionais</SelectItem>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium px-0.5">De</label>
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilter('start_date', e.target.value)}
              max={filters.end_date || undefined}
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium px-0.5">Até</label>
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilter('end_date', e.target.value)}
              min={filters.start_date || undefined}
              className="h-10"
            />
          </div>
        </div>
      </div>
    </FluidSection>
  )
}
