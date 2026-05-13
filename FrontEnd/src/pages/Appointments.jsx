import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FluidSection } from '@/components/design'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Calendar as CalendarIcon,
  Loader2,
  Search,
  RefreshCw,
  User,
  Plus,
  Edit,
  Trash2,
  Download,
  CalendarDays,
} from 'lucide-react'
import { apiService } from '../lib/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'
import { AppointmentForm } from '@/components/appointments/AppointmentForm'
import { AppointmentsCalendar } from '@/components/appointments/AppointmentsCalendar'
import { AppointmentsFilters } from '@/components/appointments/AppointmentsFilters'
import { AppointmentsStats } from '@/components/appointments/AppointmentsStats'
import { AppointmentsTable } from '@/components/appointments/AppointmentsTable'
import { AppointmentsProvider, useAppointmentsContext } from '@/contexts/AppointmentsContext'
import {
  STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  normalizeStatus,
  normalizePaymentStatus,
  resolveStatus,
  getClientName,
} from '@/utils/appointmentUtils'
import { formatCurrency } from '@/utils/format'
import { ConsultationModal } from '@/components/appointments/ConsultationModal'


// Pure date helpers — defined outside component to avoid re-creation on each render
const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}


function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState('calendar')

  const {
    appointments,
    filteredAppointments,
    loading,
    error,
    loadAppointments,
    updateAppointment,
    createAppointment,
    deleteAppointment,
    stats,
    professionals,
    services,
    selectedAppointment,
    setSelectedAppointment,
    selectedDate,
    setSelectedDate,
    isFormDialogOpen,
    setIsFormDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isConsultationModalOpen,
    setIsConsultationModalOpen,
    isSubmitting,
    setIsSubmitting,
    newlyCreatedAppointment,
    setNewlyCreatedAppointment,
  } = useAppointmentsContext()
  
  // Estados para aba de Anotações
  const [appointmentsWithNotes, setAppointmentsWithNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesSearchTerm, setNotesSearchTerm] = useState('')
  const [notesStatusFilter, setNotesStatusFilter] = useState('all')
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isNoteDeleteDialogOpen, setIsNoteDeleteDialogOpen] = useState(false)
  const [currentNote, setCurrentNote] = useState(null)
  const [noteText, setNoteText] = useState('')

  // Status badge for the notes tab
  const STATUS_PILL_MAP = {
    pending:   { color: '#F59E0B', label: 'Pendente'   },
    confirmed: { color: '#4C60AA', label: 'Confirmado' },
    completed: { color: '#10B981', label: 'Concluído'  },
    canceled:  { color: '#D1D5DB', label: 'Cancelado'  },
    no_show:   { color: '#D1D5DB', label: 'Não veio'   },
  }
  const getStatusBadge = (rawStatus) => {
    const numericMap = { 0: 'pending', 1: 'confirmed', 2: 'completed', 3: 'canceled', 4: 'no_show' }
    const key = typeof rawStatus === 'number' ? (numericMap[rawStatus] ?? 'pending') : (rawStatus || 'pending')
    const cfg = STATUS_PILL_MAP[key] || { color: '#9CA3AF', label: 'Desconhecido' }
    return (
      <span
        style={{
          borderRadius: 20,
          padding: '3px 8px',
          fontSize: 11,
          fontWeight: 600,
          background: cfg.color + '18',
          color: cfg.color,
        }}
      >
        {cfg.label}
      </span>
    )
  }

  const handleCreate = useCallback(() => {
    setSelectedAppointment(null)
    setSelectedDate(null)
    setIsFormDialogOpen(true)
  }, [])

  const handleEdit = useCallback((appointment) => {
    setSelectedAppointment(appointment)
    setIsFormDialogOpen(true)
  }, [])

  const handleOpenConsultation = (appointment) => {
    setSelectedAppointment(appointment)
    setIsConsultationModalOpen(true)
  }

  // Funções para aba de Anotações
  const loadAppointmentsWithNotes = async () => {
    try {
      setNotesLoading(true)
      const response = await apiService.getAppointments()
      const appointmentsData = response.appointments || response || []
      
      // Filtrar apenas agendamentos que têm anotações (já vêm na resposta do backend)
      const appointmentsWithNotesData = appointmentsData.filter(appointment => {
        // A anotação já vem no appointment_note do backend
        if (appointment.appointment_note) {
          appointment.note = appointment.appointment_note
          return true
        }
        return false
      })
      
      setAppointmentsWithNotes(appointmentsWithNotesData)
    } catch (err) {
      toast.error('Erro ao carregar agendamentos com anotações')
    } finally {
      setNotesLoading(false)
    }
  }

  const filteredAppointmentsWithNotes = useMemo(() => {
    let filtered = [...appointmentsWithNotes]

    if (notesStatusFilter !== 'all') {
      // resolveStatus handles both numeric (0,1,2…) and string statuses
      filtered = filtered.filter(
        (apt) => resolveStatus(apt.status) === notesStatusFilter
      )
    }

    if (notesSearchTerm) {
      const term = notesSearchTerm.toLowerCase()
      filtered = filtered.filter((apt) => {
        const clientName = getClientName(apt)?.toLowerCase() ?? ''
        const serviceName = apt.service?.name?.toLowerCase() ?? ''
        const note = apt.note?.notes?.toLowerCase() ?? ''
        return clientName.includes(term) || serviceName.includes(term) || note.includes(term)
      })
    }

    filtered.sort(
      (a, b) => new Date(b.start_time) - new Date(a.start_time)
    )

    return filtered
  }, [appointmentsWithNotes, notesSearchTerm, notesStatusFilter])

  const handleOpenNoteDialog = (appointment, note = null) => {
    setSelectedAppointment(appointment)
    setCurrentNote(note)
    setNoteText(note?.notes || '')
    setIsNoteDialogOpen(true)
  }

  const handleCloseNoteDialog = () => {
    setIsNoteDialogOpen(false)
    setSelectedAppointment(null)
    setCurrentNote(null)
    setNoteText('')
  }

  const handleSaveNote = async () => {
    if (!selectedAppointment || !noteText.trim()) {
      return
    }

    try {
      setIsSubmitting(true)
      if (currentNote) {
        await apiService.updateAppointmentNote(
          selectedAppointment.id,
          currentNote.id,
          { notes: noteText }
        )
      } else {
        await apiService.createAppointmentNote(selectedAppointment.id, { notes: noteText })
      }
      handleCloseNoteDialog()
      loadAppointmentsWithNotes()
      toast.success('Anotação salva com sucesso!')
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar anotação')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!currentNote) return

    try {
      setIsSubmitting(true)
      await apiService.deleteAppointmentNote(selectedAppointment.id, currentNote.id)
      handleCloseNoteDialog()
      setIsNoteDeleteDialogOpen(false)
      loadAppointmentsWithNotes()
      toast.success('Anotação excluída com sucesso!')
    } catch (err) {
      toast.error(err.message || 'Erro ao excluir anotação')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Carregar agendamentos com anotações quando a aba for ativada
  useEffect(() => {
    if (activeTab === 'notes') {
      loadAppointmentsWithNotes()
    }
  }, [activeTab])

  // Handler para quando clicar em um slot/dia no calendário
  const handleSelectSlot = useCallback((slotInfo) => {
    setSelectedAppointment(null)
    setSelectedDate(slotInfo.start)
    setIsFormDialogOpen(true)
  }, [])

  const handleDelete = (appointment) => {
    setSelectedAppointment(appointment)
    setIsDeleteDialogOpen(true)
  }

  // Função removida - o backend cria contato automaticamente se necessário

  const handleSubmit = async (submitData) => {
    setIsSubmitting(true)
    try {
      if (selectedAppointment) {
        await updateAppointment(selectedAppointment.id, submitData)
        toast.success('Agendamento atualizado com sucesso')
      } else {
        const result = await createAppointment(submitData)
        const created = result?.appointment ?? result
        if (created?.id) {
          setNewlyCreatedAppointment(created)
          setActiveTab('calendar')
        }
        toast.success('Agendamento criado com sucesso')
      }

      setIsFormDialogOpen(false)
      setSelectedAppointment(null)
    } catch (err) {
      const errorMessage = err.message || 'Erro desconhecido'
      toast.error('Erro ao salvar agendamento: ' + errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedAppointment) return
    
    setIsSubmitting(true)
    try {
      await deleteAppointment(selectedAppointment.id)
      setIsDeleteDialogOpen(false)
      setSelectedAppointment(null)
      toast.success('Agendamento excluído com sucesso')
    } catch (err) {
      toast.error('Erro ao deletar agendamento: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = () => {
    try {
      if (filteredAppointments.length === 0) {
        toast.warning('Não há agendamentos para exportar')
        return
      }

      // Criar CSV dos agendamentos filtrados
      const headers = ['Cliente', 'Serviço', 'Profissional', 'Data/Hora', 'Valor', 'Status', 'Pagamento']
      
      const rows = filteredAppointments.map(apt => {
        const statusKey = normalizeStatus(apt.status)
        const paymentStatusKey = normalizePaymentStatus(apt.payment_status)

        return [
          apt.client?.name || apt.client?.whatsapp_number || apt.whatsapp_number || 'N/A',
          apt.service?.name || 'N/A',
          apt.professional?.name || 'N/A',
          formatDateTime(apt.start_time),
          formatCurrency(apt.price?.cents || apt.price_cents || 0, apt.price?.currency || apt.price_currency || 'BRL'),
          STATUS_LABELS[statusKey] || statusKey || 'N/A',
          PAYMENT_STATUS_LABELS[paymentStatusKey] || paymentStatusKey || 'N/A'
        ]
      })

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
          // Escapar aspas e quebras de linha no CSV
          const cellStr = String(cell || '').replace(/"/g, '""')
          return `"${cellStr}"`
        }).join(','))
      ].join('\n')

      // Adicionar BOM para Excel reconhecer UTF-8
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `agendamentos_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Agendamentos exportados com sucesso')
    } catch (err) {
      toast.error('Erro ao exportar agendamentos: ' + (err.message || 'Erro desconhecido'))
    }
  }

  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: '#4C60AA' }} />
          <p className="text-text-secondary">Carregando agendamentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="appointments-page" className="relative min-h-screen bg-surface transition-colors duration-200">
      <div className="relative z-10 space-y-3 w-full max-w-full min-w-0 overflow-x-hidden p-3 md:p-4">
        {/* Header compacto */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg sm:text-xl font-bold text-text-primary leading-tight">
            Agendamentos
          </h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadAppointments}
            variant="outline"
            size="sm"
            className="h-8 px-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="h-8 px-2 hidden sm:flex"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button
            onClick={handleCreate}
            size="sm"
            className="h-8"
            data-testid="new-appointment-btn"
            style={{ background: '#4C60AA', color: '#fff', borderRadius: 8 }}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Novo Agendamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
          
          <AppointmentForm
            open={isFormDialogOpen}
            onOpenChange={(open) => {
              setIsFormDialogOpen(open)
              if (!open) {
                setSelectedAppointment(null)
                setSelectedDate(null)
              }
            }}
            appointment={selectedAppointment}
            initialDate={selectedDate}
            professionals={professionals}
            services={services}
            appointments={appointments}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-3 h-9 p-0.5 bg-muted border border-border rounded-xl w-full sm:w-auto gap-0.5">
          <TabsTrigger
            value="calendar"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-[#4C60AA] data-[state=active]:shadow-sm transition-all duration-150 flex-1 sm:flex-none"
          >
            <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Calendário</span>
            <span className="sm:hidden">Cal.</span>
          </TabsTrigger>
          <TabsTrigger
            value="list"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-[#4C60AA] data-[state=active]:shadow-sm transition-all duration-150 flex-1 sm:flex-none"
          >
            <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
            Lista
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-[#4C60AA] data-[state=active]:shadow-sm transition-all duration-150 flex-1 sm:flex-none"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Anotações</span>
            <span className="sm:hidden">Notas</span>
          </TabsTrigger>
        </TabsList>

        {/* Calendário Tab */}
        <TabsContent value="calendar" className="space-y-3">
          {loading && appointments.length === 0 ? (
            <div className="flex items-center justify-center h-[600px] bg-card rounded-lg border border-border">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: '#4C60AA' }} />
                <p className="text-text-secondary">Carregando agendamentos...</p>
              </div>
            </div>
          ) : (
            <AppointmentsCalendar
              newlyCreatedAppointment={newlyCreatedAppointment}
              onHighlightDone={() => setNewlyCreatedAppointment(null)}
            />
          )}
        </TabsContent>

        {/* Lista Tab */}
        <TabsContent value="list" className="space-y-3 animate-in fade-in-50 duration-300">
          <AppointmentsFilters />
          <AppointmentsStats />
          <AppointmentsTable
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpenConsultation={handleOpenConsultation}
          />
        </TabsContent>

        {/* Anotações Tab */}
        <TabsContent value="notes" className="space-y-3 animate-in fade-in-50 duration-300">
          <FluidSection
            title="Anotações de Sessões"
            subtitle="Agendamentos com anotações"
            gradient="from-purple-500 to-pink-500"
          >
            {/* Filtros */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                      <Input
                        placeholder="Buscar por cliente, serviço ou anotação..."
                        value={notesSearchTerm}
                        onChange={(e) => setNotesSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-full sm:w-48">
                    <Select value={notesStatusFilter} onValueChange={setNotesStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="completed">Concluídos</SelectItem>
                        <SelectItem value="confirmed">Confirmados</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
                        <SelectItem value="canceled">Cancelados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    onClick={loadAppointmentsWithNotes}
                    disabled={notesLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${notesLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Agendamentos com Anotações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Agendamentos com Anotações ({filteredAppointmentsWithNotes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  </div>
                ) : filteredAppointmentsWithNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-text-tertiary mb-4" />
                    <p className="text-text-secondary">
                      {notesSearchTerm || notesStatusFilter !== 'all'
                        ? 'Nenhum agendamento encontrado com os filtros aplicados.'
                        : 'Nenhum agendamento com anotações encontrado.'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Anotação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAppointmentsWithNotes.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-text-tertiary" />
                              <span className="text-sm">
                                {format(new Date(appointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-text-tertiary" />
                              <span>
                                {appointment.contact?.name || appointment.whatsapp_number || '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {appointment.service?.name || '-'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(appointment.status)}
                          </TableCell>
                          <TableCell>
                            {appointment.note ? (
                              <div className="max-w-xs">
                                <p className="text-sm text-text-secondary truncate">
                                  {appointment.note.notes.substring(0, 50)}
                                  {appointment.note.notes.length > 50 ? '...' : ''}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-text-tertiary italic">
                                Sem anotação
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenConsultation(appointment)}
                                title="Abrir sessão"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenNoteDialog(appointment, appointment.note)}
                              >
                                {appointment.note ? (
                                  <Edit className="h-4 w-4" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                              {appointment.note && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAppointment(appointment)
                                    setCurrentNote(appointment.note)
                                    setIsNoteDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </FluidSection>

          {/* Dialog para criar/editar anotação */}
          <Dialog open={isNoteDialogOpen} onOpenChange={handleCloseNoteDialog}>
            <DialogContent data-testid="note-dialog" className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {currentNote ? 'Editar Anotação' : 'Nova Anotação'}
                </DialogTitle>
                <DialogDescription>
                  {currentNote ? 'Atualize o conteúdo desta anotação.' : 'Registre observações importantes sobre o atendimento.'}
                </DialogDescription>
              </DialogHeader>
              {selectedAppointment && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Agendamento:</p>
                    <p className="text-sm text-text-secondary">
                      <strong>Cliente:</strong> {selectedAppointment.contact?.name || selectedAppointment.whatsapp_number || '-'}
                    </p>
                    <p className="text-sm text-text-secondary">
                      <strong>Serviço:</strong> {selectedAppointment.service?.name || '-'}
                    </p>
                    <p className="text-sm text-text-secondary">
                      <strong>Data:</strong> {format(new Date(selectedAppointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Anotação *</Label>
                    <textarea
                      id="notes"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Digite as anotações da sessão..."
                      className="w-full min-h-[200px] px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                    <p className="text-xs text-text-tertiary">
                      Mínimo de 3 caracteres.
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleCloseNoteDialog}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveNote}
                  disabled={isSubmitting || !noteText.trim() || noteText.trim().length < 3}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog de confirmação de exclusão */}
          <AlertDialog open={isNoteDeleteDialogOpen} onOpenChange={setIsNoteDeleteDialogOpen}>
            <AlertDialogContent data-testid="delete-appointment-dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteNote}
                  disabled={isSubmitting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    'Excluir'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>

      {/* Modal de Sessão */}
      <ConsultationModal
        appointment={selectedAppointment}
        open={isConsultationModalOpen}
        onOpenChange={setIsConsultationModalOpen}
      />
      </div>
    </div>
  )
}

export function Appointments() {
  return (
    <AppointmentsProvider>
      <AppointmentsPage />
    </AppointmentsProvider>
  )
}
