import { useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import {
  User,
  Apple,
  Clock,
  Phone,
  Edit,
  Trash2,
  ExternalLink,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Link2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { FluidSection } from '@/components/design'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/format'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_OPTIONS,
  resolveStatus,
  normalizePaymentStatus,
} from '@/utils/appointmentUtils'
import { useAppointmentsContext } from '@/contexts/AppointmentsContext'
import { T, DISPLAY } from '@/lib/tokens'

const STATUS_PILL_COLORS = {
  pending:   { color: '#F59E0B', label: 'Pendente'   },
  confirmed: { color: '#4C60AA', label: 'Confirmado' },
  completed: { color: '#10B981', label: 'Concluído'  },
  canceled:  { color: '#D1D5DB', label: 'Cancelado'  },
  no_show:   { color: '#D1D5DB', label: 'Não veio'   },
}

const colHelper = createColumnHelper()

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusSelect({ appointmentId, status, onChange }) {
  return (
    <Select value={status} onValueChange={(v) => onChange(appointmentId, v)}>
      <SelectTrigger className="w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function PaymentSelect({ appointmentId, status, onChange }) {
  return (
    <Select value={status} onValueChange={(v) => onChange(appointmentId, v)}>
      <SelectTrigger className="w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PAYMENT_STATUS_OPTIONS.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DeleteDialog({ appointment, onConfirm, isSubmitting, isOpen, onOpenChange }) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" title="Excluir">
          <Trash2 className="w-4 h-4 mr-1.5 text-red-500" />
          Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent data-testid="delete-appointment-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir este agendamento? Esta ação não pode
            ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Excluindo…
              </>
            ) : (
              'Excluir'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Mobile card ───────────────────────────────────────────────────────────────

function MobileAppointmentCard({
  appointment,
  onEdit,
  onDelete,
  onOpenConsultation,
  onStatusChange,
  onPaymentStatusChange,
  isDeleteOpen,
  onDeleteOpenChange,
  isDeleting,
}) {
  const status = resolveStatus(appointment.status)
  const paymentStatus = normalizePaymentStatus(appointment.payment_status)

  return (
    <Card className="border-border shadow-sm">
      {/* Coloured top bar by status */}
      <div
        className="h-1 w-full rounded-t-lg"
        style={{ background: STATUS_PILL_COLORS[status]?.color || '#9CA3AF' }}
      />
      <CardContent className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base text-text-primary truncate">
              {appointment.client?.name || appointment.client?.whatsapp_number || 'N/A'}
            </p>
            <p className="text-sm text-text-secondary mt-0.5">
              {appointment.service?.name || 'N/A'}
            </p>
          </div>
          <p className="text-lg font-bold text-[#5B7A9E] dark:text-[#7BA3D1] shrink-0">
            {formatCurrency(
              appointment.price?.cents || 0,
              appointment.price?.currency || 'BRL'
            )}
          </p>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>
              {format(new Date(appointment.start_time), 'HH:mm', { locale: ptBR })}
              {' – '}
              {format(new Date(appointment.end_time), 'HH:mm', { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{appointment.professional?.name || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <Clock className="w-3.5 h-3.5 shrink-0 text-transparent" />
            <span className="text-text-tertiary text-xs">
              {format(new Date(appointment.start_time), "dd 'de' MMM yyyy", { locale: ptBR })}
            </span>
          </div>
          {appointment.client?.whatsapp_number && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs">{appointment.client.whatsapp_number}</span>
            </div>
          )}
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <span
            className="text-xs font-semibold px-2 py-0.5"
            style={{
              borderRadius: 20,
              background: (STATUS_PILL_COLORS[status]?.color || '#9CA3AF') + '18',
              color: STATUS_PILL_COLORS[status]?.color || '#9CA3AF',
            }}
          >
            {STATUS_LABELS[status] || status}
          </span>
          <Badge className={cn('text-xs', PAYMENT_STATUS_COLORS[paymentStatus])}>
            {PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus}
          </Badge>
          {appointment.booking_source === 'public_link' && (
            <Badge variant="outline" className="text-xs" style={{ color: T.brand, borderColor: T.brand + '80', background: T.chip }}>
              <Link2 className="w-3 h-3 mr-1" />
              Link Público
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex flex-wrap gap-2 pt-3 border-t border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            onClick={() => onOpenConsultation(appointment)}
            style={{ background: T.chip, color: T.brand, border: `1px solid ${T.brand}40` }}
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Anotações
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(appointment)}
          >
            <Edit className="w-4 h-4 mr-1.5" />
            Editar
          </Button>
          {appointment.payment_link_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(appointment.payment_link_url, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Pag.
            </Button>
          )}
          <DeleteDialog
            appointment={appointment}
            onConfirm={() => onDelete(appointment)}
            isSubmitting={isDeleting}
            isOpen={isDeleteOpen}
            onOpenChange={onDeleteOpenChange}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Pagination bar ────────────────────────────────────────────────────────────

function PaginationBar({ table, total }) {
  const { pageIndex, pageSize } = table.getState().pagination
  const from = total === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
      <p className="text-sm text-text-secondary">
        {total === 0
          ? 'Nenhum registro'
          : `${from}–${to} de ${total} agendamentos`}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm px-2">
          {pageIndex + 1} / {table.getPageCount() || 1}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => table.setPageSize(Number(v))}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}/pág
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function AppointmentsTable({ onEdit, onDelete, onOpenConsultation }) {
  const {
    filteredAppointments,
    pagination,
    setPagination,
    error,
    updateAppointment,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    selectedAppointment,
    setSelectedAppointment,
    isSubmitting,
  } = useAppointmentsContext()

  const handleStatusChange = useCallback(
    async (id, newStatus) => {
      try {
        await updateAppointment(id, { status: newStatus })
        toast.success('Status atualizado')
      } catch (err) {
        toast.error('Erro ao atualizar status: ' + (err.message || 'desconhecido'))
      }
    },
    [updateAppointment]
  )

  const handlePaymentStatusChange = useCallback(
    async (id, newStatus) => {
      try {
        await updateAppointment(id, { payment_status: newStatus })
        toast.success('Status de pagamento atualizado')
      } catch (err) {
        toast.error('Erro: ' + (err.message || 'desconhecido'))
      }
    },
    [updateAppointment]
  )

  // ── Column definitions ───────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      colHelper.accessor(
        (apt) => apt.client?.name || apt.client?.whatsapp_number || 'N/A',
        {
          id: 'client',
          header: 'Cliente',
          cell: ({ row, getValue }) => {
            const apt = row.original
            const aptStatus = resolveStatus(apt.status)
            const aptStatusColor = STATUS_PILL_COLORS[aptStatus]?.color || '#9CA3AF'
            const clientName = getValue()
            const initials = clientName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
            return (
              <div className="flex items-center gap-2">
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ width: 30, height: 30, background: aptStatusColor + '20', color: aptStatusColor }}
                >
                  {initials}
                </div>
                <div>
                  <p className="font-medium">{clientName}</p>
                  {apt.client?.whatsapp_number && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {apt.client.whatsapp_number}
                    </p>
                  )}
                </div>
              </div>
            )
          },
        }
      ),
      colHelper.accessor((apt) => apt.service?.name || 'N/A', {
        id: 'service',
        header: 'Serviço',
        cell: ({ getValue }) => (
          <div className="flex items-center gap-2">
            <Apple className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{getValue()}</span>
          </div>
        ),
      }),
      colHelper.accessor((apt) => apt.professional?.name || 'N/A', {
        id: 'professional',
        header: 'Profissional',
      }),
      colHelper.accessor('start_time', {
        header: 'Data / Hora',
        cell: ({ row }) => {
          const apt = row.original
          return (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-sm">
                  {format(new Date(apt.start_time), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(apt.start_time), 'HH:mm', { locale: ptBR })}
                  {' – '}
                  {format(new Date(apt.end_time), 'HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
          )
        },
      }),
      colHelper.accessor((apt) => apt.price?.cents || 0, {
        id: 'price',
        header: 'Valor',
        cell: ({ row }) => {
          const apt = row.original
          return (
            <span className="font-semibold text-[#5B7A9E] dark:text-[#7BA3D1]">
              {formatCurrency(apt.price?.cents || 0, apt.price?.currency || 'BRL')}
            </span>
          )
        },
      }),
      colHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const apt = row.original
          const status = resolveStatus(apt.status)
          return (
            <StatusSelect
              appointmentId={apt.id}
              status={status}
              onChange={handleStatusChange}
            />
          )
        },
      }),
      colHelper.accessor('payment_status', {
        header: 'Pagamento',
        cell: ({ row }) => {
          const apt = row.original
          const ps = normalizePaymentStatus(apt.payment_status)
          return (
            <PaymentSelect
              appointmentId={apt.id}
              status={ps}
              onChange={handlePaymentStatusChange}
            />
          )
        },
      }),
      colHelper.display({
        id: 'origin',
        header: 'Origem',
        cell: ({ row }) => {
          const apt = row.original
          if (apt.booking_source === 'public_link') {
            return (
              <Badge variant="outline" className="text-xs whitespace-nowrap" style={{ color: T.brand, borderColor: T.brand + '80', background: T.chip }}>
                <Link2 className="w-3 h-3 mr-1" />
                Link Público
              </Badge>
            )
          }
          return <span className="text-xs text-gray-400">Manual</span>
        },
      }),
      colHelper.display({
        id: 'actions',
        header: 'Ações',
        cell: ({ row }) => {
          const apt = row.original
          const isThisDeleteOpen =
            isDeleteDialogOpen && selectedAppointment?.id === apt.id
          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => onOpenConsultation(apt)}
                style={{ background: T.chip, color: T.brand, border: `1px solid ${T.brand}40` }}
              >
                <FileText className="w-4 h-4 mr-1.5" />
                Anotações
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(apt)}
              >
                <Edit className="w-4 h-4 mr-1.5" />
                Editar
              </Button>
              {apt.payment_link_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(apt.payment_link_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Link
                </Button>
              )}
              <DeleteDialog
                appointment={apt}
                onConfirm={() => onDelete(apt)}
                isSubmitting={isSubmitting}
                isOpen={isThisDeleteOpen}
                onOpenChange={(open) => {
                  if (open) {
                    setSelectedAppointment(apt)
                    setIsDeleteDialogOpen(true)
                  } else {
                    setIsDeleteDialogOpen(false)
                    setSelectedAppointment(null)
                  }
                }}
              />
            </div>
          )
        },
      }),
    ],
    [
      handleStatusChange,
      handlePaymentStatusChange,
      onEdit,
      onDelete,
      onOpenConsultation,
      isDeleteDialogOpen,
      selectedAppointment,
      isSubmitting,
      setIsDeleteDialogOpen,
      setSelectedAppointment,
    ]
  )

  const table = useReactTable({
    data: filteredAppointments,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const pageRows = table.getRowModel().rows
  const total = filteredAppointments.length

  return (
    <FluidSection
      title={`Lista de Agendamentos (${total})`}
      subtitle="Gerencie seus agendamentos"
      gradient="from-[#5B7A9E] to-[#6B8FA3]"
    >
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {total === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <>
          {/* ── Mobile: card list ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 md:hidden">
            {pageRows.map((row) => {
              const apt = row.original
              const isThisDeleteOpen =
                isDeleteDialogOpen && selectedAppointment?.id === apt.id
              return (
                <MobileAppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onOpenConsultation={onOpenConsultation}
                  onStatusChange={handleStatusChange}
                  onPaymentStatusChange={handlePaymentStatusChange}
                  isDeleteOpen={isThisDeleteOpen}
                  onDeleteOpenChange={(open) => {
                    if (!open) {
                      setIsDeleteDialogOpen(false)
                      setSelectedAppointment(null)
                    }
                  }}
                  isDeleting={isSubmitting}
                />
              )
            })}
          </div>

          {/* ── Desktop: table ─────────────────────────────────────────────── */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="hover:bg-transparent">
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => {
                const apt = row.original
                const aptStatus = resolveStatus(apt.status)
                const aptStatusColor = STATUS_PILL_COLORS[aptStatus]?.color || '#9CA3AF'
                return (
                  <TableRow
                    key={row.id}
                    style={{ borderLeft: `3px solid ${aptStatusColor}`, transition: 'background 100ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
              </TableBody>
            </Table>
          </div>

          <PaginationBar table={table} total={total} />
        </>
      )}
    </FluidSection>
  )
}
