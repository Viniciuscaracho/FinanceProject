import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  User,
  Clock,
  Loader2,
  AlertCircle,
  StickyNote,
  RefreshCw,
  CheckCircle2,
  Circle,
  ListTodo,
  ChevronRight,
  Apple,
} from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { apiService } from '@/lib/api'
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/appointmentUtils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { T, DISPLAY } from '@/lib/tokens'
import { toast } from 'sonner'

export function AppointmentNotes() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentNote, setCurrentNote] = useState(null)
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [pendingTasksFromPrevious, setPendingTasksFromPrevious] = useState([])

  useEffect(() => {
    loadAppointments()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [appointments, searchTerm, statusFilter])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const response = await apiService.getAppointments()
      const appointmentsData = response.appointments || response || []
      // appointment_note já vem embutido na resposta do backend — sem N+1
      for (const apt of appointmentsData) {
        if (apt.appointment_note) apt.note = apt.appointment_note
      }
      setAppointments(appointmentsData)
    } catch (err) {
      toast.error('Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  const filterAppointments = () => {
    let filtered = [...appointments]

    // Filtro por status
    if (statusFilter !== 'all') {
      const statusMap = {
        'completed': 2,
        'confirmed': 1,
        'pending': 0,
        'canceled': 3
      }
      filtered = filtered.filter(apt => apt.status === statusMap[statusFilter])
    }

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(apt => {
        const clientName = apt.contact?.name || apt.whatsapp_number || ''
        const serviceName = apt.service?.name || ''
        return (
          clientName.toLowerCase().includes(term) ||
          serviceName.toLowerCase().includes(term) ||
          apt.note?.notes?.toLowerCase().includes(term)
        )
      })
    }

    // Ordenar por data mais recente
    filtered.sort((a, b) => {
      const dateA = new Date(a.start_time)
      const dateB = new Date(b.start_time)
      return dateB - dateA
    })

    setFilteredAppointments(filtered)
  }

  const handleOpenDialog = async (appointment, note = null) => {
    setSelectedAppointment(appointment)
    setCurrentNote(note)
    setNotes(note?.notes || '')
    setNewTaskDescription('')
    
    // Carregar tarefas pendentes da sessão anterior
    try {
      const appointmentData = await apiService.getAppointment(appointment.id)
      setPendingTasksFromPrevious(appointmentData.previous_session_pending_tasks || [])
    } catch (err) {
      setPendingTasksFromPrevious([])
    }
    
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedAppointment(null)
    setCurrentNote(null)
    setNotes('')
  }

  const handleSave = async () => {
    if (!selectedAppointment || !notes.trim()) return

    try {
      setIsSubmitting(true)
      let note
      if (currentNote) {
        const response = await apiService.updateAppointmentNote(
          selectedAppointment.id,
          currentNote.id,
          { notes }
        )
        note = response.note
      } else {
        const response = await apiService.createAppointmentNote(selectedAppointment.id, { notes })
        note = response.note
      }

      if (newTaskDescription.trim() && note) {
        await apiService.addPatientTask(selectedAppointment.id, note.id, newTaskDescription.trim())
      }

      toast.success('Anotação salva com sucesso!')

      // Sincroniza na timeline de coaching do atleta (fire-and-forget)
      const contactId = selectedAppointment.contact?.id
      if (contactId && notes.trim().length >= 10) {
        apiService.createTimelineEvent(contactId, notes.trim(), 'session_note').catch(() => {})
      }

      handleCloseDialog()
      loadAppointments()
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar anotação')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTask = async () => {
    if (!selectedAppointment || !currentNote || !newTaskDescription.trim()) return

    try {
      setIsSubmitting(true)
      const response = await apiService.addPatientTask(
        selectedAppointment.id,
        currentNote.id,
        newTaskDescription.trim()
      )
      setCurrentNote(response.note)
      setNewTaskDescription('')
      loadAppointments()
    } catch (err) {
      toast.error(err.message || 'Erro ao adicionar tarefa')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteTask = async (taskId) => {
    if (!selectedAppointment || !currentNote) return

    try {
      setIsSubmitting(true)
      const response = await apiService.completePatientTask(
        selectedAppointment.id,
        currentNote.id,
        taskId
      )
      setCurrentNote(response.note)
      loadAppointments()
    } catch (err) {
      toast.error(err.message || 'Erro ao marcar tarefa como concluída')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveTask = async (taskId) => {
    if (!selectedAppointment || !currentNote) return

    try {
      setIsSubmitting(true)
      const response = await apiService.removePatientTask(
        selectedAppointment.id,
        currentNote.id,
        taskId
      )
      setCurrentNote(response.note)
      loadAppointments()
    } catch (err) {
      toast.error(err.message || 'Erro ao remover tarefa')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentNote) return

    try {
      setIsSubmitting(true)
      await apiService.deleteAppointmentNote(selectedAppointment.id, currentNote.id)
      toast.success('Anotação excluída')
      handleCloseDialog()
      setIsDeleteDialogOpen(false)
      loadAppointments()
    } catch (err) {
      toast.error(err.message || 'Erro ao excluir anotação')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (rawStatus) => {
    const numericMap = { 0: 'pending', 1: 'confirmed', 2: 'completed', 3: 'canceled', 4: 'no_show' }
    const key = typeof rawStatus === 'number' ? (numericMap[rawStatus] ?? 'pending') : (rawStatus || 'pending')
    const colorMap = {
      pending:   { color: T.amber, bg: T.amber + '18' },
      confirmed: { color: T.brand, bg: T.brand + '18' },
      completed: { color: T.green, bg: T.green + '18' },
      canceled:  { color: T.red,   bg: T.red + '18' },
      no_show:   { color: T.muted, bg: T.muted + '18' },
    }
    const c = colorMap[key] || { color: T.muted, bg: T.muted + '18' }
    return (
      <span style={{ borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600, background: c.bg, color: c.color }}>
        {STATUS_LABELS[key] || 'Desconhecido'}
      </span>
    )
  }

  return (
    <div data-testid="appointment-notes-page" style={{ minHeight: '100vh', background: T.bg, ...DISPLAY }}>
      <div className="relative z-10 w-full max-w-full min-w-0 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1" style={{ color: T.text }}>
              Anotações de Sessões
            </h1>
            <p style={{ fontSize: 14, color: T.muted }}>
              Gerencie anotações clínicas e acompanhamentos dos seus pacientes
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: T.muted }} />
              <Input
                placeholder="Buscar por cliente, serviço ou anotação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'completed', label: 'Concluídos' },
                { value: 'confirmed', label: 'Confirmados' },
                { value: 'pending', label: 'Pendentes' },
                { value: 'canceled', label: 'Cancelados' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', border: '1px solid', fontFamily: 'inherit',
                    borderColor: statusFilter === opt.value ? T.brand : T.border,
                    background: statusFilter === opt.value ? T.chip : T.white,
                    color: statusFilter === opt.value ? T.brand : T.text,
                    transition: 'all 150ms', whiteSpace: 'nowrap',
                  }}>
                  {opt.label}
                </button>
              ))}
              <button type="button"
                onClick={loadAppointments}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                  borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: `1px solid ${T.border}`, background: T.white, color: T.text,
                  fontFamily: 'inherit', transition: 'all 150ms',
                }}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Agendamentos */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <StickyNote className="h-4 w-4" style={{ color: T.brand }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
              Agendamentos
            </span>
            <span style={{ marginLeft: 4, fontSize: 12, color: T.muted, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, padding: '2px 8px', fontWeight: 500 }}>
              {filteredAppointments.length}
            </span>
          </div>
          <div className={isMobile ? "" : "p-0"}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: T.brand }} />
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FileText className="h-12 w-12 mx-auto text-text-tertiary mb-4" />
                <p className="text-text-secondary">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Nenhum agendamento encontrado com os filtros aplicados.'
                    : 'Nenhum agendamento encontrado.'}
                </p>
              </div>
            ) : isMobile ? (
              /* Mobile: card list */
              <div className="divide-y divide-border">
                {filteredAppointments.map((appointment) => {
                  const hasNote = !!appointment.note
                  const client = appointment.contact?.name || appointment.whatsapp_number || 'Sem cliente'
                  const service = appointment.service?.name || '-'
                  const notePreview = hasNote
                    ? appointment.note.notes.substring(0, 60) + (appointment.note.notes.length > 60 ? '…' : '')
                    : null

                  return (
                    <button
                      key={appointment.id}
                      className="w-full text-left px-4 py-3 active:bg-muted/60 transition-colors"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      onClick={() => handleOpenDialog(appointment, appointment.note)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Ícone de status nota */}
                        <div style={{ marginTop: 2, width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: hasNote ? T.chip : T.light }}>
                          {hasNote
                            ? <StickyNote className="h-4 w-4" style={{ color: T.brand }} />
                            : <Plus className="h-4 w-4" style={{ color: T.muted }} />
                          }
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-sm text-foreground truncate">{client}</span>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                            <Apple className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{service}</span>
                            <span className="mx-0.5">·</span>
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{formatDate(appointment.start_time)}</span>
                          </div>
                          {notePreview ? (
                            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {notePreview}
                            </p>
                          ) : (
                            <p className="mt-1.5 text-xs text-muted-foreground italic">
                              Toque para adicionar anotação
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                          {hasNote && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedAppointment(appointment)
                                setCurrentNote(appointment.note)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive active:bg-destructive/10 transition-colors"
                              style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              /* Desktop: tabela */
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
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id} style={{ transition: 'background 100ms' }}
                      onMouseEnter={e => e.currentTarget.style.background = T.bg}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-text-tertiary" />
                          <span className="text-sm">{formatDate(appointment.start_time)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-text-tertiary" />
                          <span>{appointment.contact?.name || appointment.whatsapp_number || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{appointment.service?.name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                      <TableCell>
                        {appointment.note ? (
                          <p className="text-sm text-text-secondary truncate max-w-xs">
                            {appointment.note.notes.substring(0, 50)}
                            {appointment.note.notes.length > 50 ? '...' : ''}
                          </p>
                        ) : (
                          <span className="text-sm text-text-tertiary italic">Sem anotação</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(appointment, appointment.note)}
                          >
                            {appointment.note ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                          </Button>
                          {appointment.note && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAppointment(appointment)
                                setCurrentNote(appointment.note)
                                setIsDeleteDialogOpen(true)
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
          </div>
        </div>

        {/* Dialog para criar/editar anotação */}
        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent data-testid="appointment-note-dialog" className="sm:max-w-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <StickyNote className="h-5 w-5" style={{ color: T.brand }} />
                </div>
                <div>
                  <DialogTitle style={{ margin: 0 }}>
                    {currentNote ? 'Editar Anotação' : 'Nova Anotação'}
                  </DialogTitle>
                  <DialogDescription style={{ margin: 0 }}>
                    {currentNote ? 'Atualize o conteúdo desta anotação.' : 'Registre observações importantes sobre o atendimento.'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4">
                <div style={{ borderRadius: 10, background: T.bg, border: `1px solid ${T.border}`, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.text }}>
                      <User className="h-3.5 w-3.5 flex-shrink-0" style={{ color: T.muted }} />
                      <span>{selectedAppointment.contact?.name || selectedAppointment.whatsapp_number || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.text }}>
                      <Apple className="h-3.5 w-3.5 flex-shrink-0" style={{ color: T.muted }} />
                      <span>{selectedAppointment.service?.name || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.muted }}>
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{formatDate(selectedAppointment.start_time)}</span>
                    </div>
                  </div>
                </div>
                {/* Tarefas Pendentes da Sessão Anterior */}
                {pendingTasksFromPrevious.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <Label className="text-sm font-semibold text-amber-800">
                        Pendências do Atendimento Anterior
                      </Label>
                    </div>
                    <div className="space-y-2">
                      {pendingTasksFromPrevious.map((task) => (
                        <div key={task.id} className="flex items-start gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-amber-200">
                          <Circle className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                          <span className="text-sm text-amber-900 flex-1">{task.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Anotação *</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Digite as anotações do atendimento (anamnese, evolução, orientações, plano alimentar, etc.)"
                    className="w-full min-h-[200px] px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                  <p className="text-xs text-text-tertiary">
                    Mínimo de 3 caracteres. Use este espaço para evolução nutricional, orientações alimentares, plano dietético, etc.
                  </p>
                </div>

                {/* Tarefas do Paciente - Só mostra se já existe anotação */}
                {currentNote && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <ListTodo className="h-4 w-4" />
                      <Label className="text-sm font-semibold">Tarefas para o Paciente</Label>
                    </div>
                    
                    {/* Lista de tarefas */}
                    {currentNote.patient_tasks && currentNote.patient_tasks.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {currentNote.patient_tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`flex items-start gap-2 p-3 rounded border ${
                              task.status === 'completed'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 flex-shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 mt-0.5 text-gray-400 flex-shrink-0" />
                            )}
                            <span
                              className={`text-sm flex-1 ${
                                task.status === 'completed'
                                  ? 'text-green-900 line-through'
                                  : 'text-gray-900'
                              }`}
                            >
                              {task.description}
                            </span>
                            <div className="flex gap-1">
                              {task.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCompleteTask(task.id)}
                                  disabled={isSubmitting}
                                  className="h-7 w-7 p-0"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveTask(task.id)}
                                disabled={isSubmitting}
                                className="h-7 w-7 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Adicionar nova tarefa */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Adicionar tarefa para o paciente fazer..."
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newTaskDescription.trim()) {
                            handleAddTask()
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleAddTask}
                        disabled={isSubmitting || !newTaskDescription.trim()}
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-text-tertiary">
                      As tarefas adicionadas aqui serão lembradas no próximo atendimento do paciente.
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSubmitting || !notes.trim() || notes.trim().length < 3}
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
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent data-testid="delete-note-dialog">
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
                onClick={handleDelete}
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
      </div>
    </div>
  )
}

