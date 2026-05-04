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
  ListTodo
} from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { apiService } from '@/lib/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function AppointmentNotes() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentNote, setCurrentNote] = useState(null)

  useEffect(() => {
    loadAppointments()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [appointments, searchTerm, statusFilter])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getAppointments()
      const appointmentsData = response.appointments || response || []
      setAppointments(appointmentsData)
      
      // Carregar anotações para cada agendamento
      for (const appointment of appointmentsData) {
        try {
          const notesResponse = await apiService.getAppointmentNotes(appointment.id)
          if (notesResponse.notes && notesResponse.notes.length > 0) {
            appointment.note = notesResponse.notes[0] // Assumindo uma anotação por agendamento
          }
        } catch (err) {
          // Se não houver anotação, não faz nada
        }
      }
      setAppointments([...appointmentsData])
    } catch (err) {
      console.error('Error loading appointments:', err)
      setError('Erro ao carregar agendamentos')
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
      console.error('Error loading pending tasks:', err)
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
    if (!selectedAppointment || !notes.trim()) {
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      let note
      if (currentNote) {
        // Atualizar anotação existente
        const response = await apiService.updateAppointmentNote(
          selectedAppointment.id,
          currentNote.id,
          { notes }
        )
        note = response.note
      } else {
        // Criar nova anotação
        const response = await apiService.createAppointmentNote(selectedAppointment.id, { notes })
        note = response.note
      }

      // Adicionar nova tarefa se houver
      if (newTaskDescription.trim() && note) {
        await apiService.addPatientTask(selectedAppointment.id, note.id, newTaskDescription.trim())
      }

      handleCloseDialog()
      loadAppointments()
    } catch (err) {
      console.error('Error saving note:', err)
      setError(err.message || 'Erro ao salvar anotação')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTask = async () => {
    if (!selectedAppointment || !currentNote || !newTaskDescription.trim()) {
      return
    }

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
      console.error('Error adding task:', err)
      setError(err.message || 'Erro ao adicionar tarefa')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteTask = async (taskId) => {
    if (!selectedAppointment || !currentNote) {
      return
    }

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
      console.error('Error completing task:', err)
      setError(err.message || 'Erro ao marcar tarefa como concluída')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveTask = async (taskId) => {
    if (!selectedAppointment || !currentNote) {
      return
    }

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
      console.error('Error removing task:', err)
      setError(err.message || 'Erro ao remover tarefa')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentNote) return

    try {
      setIsSubmitting(true)
      setError(null)
      await apiService.deleteAppointmentNote(selectedAppointment.id, currentNote.id)
      handleCloseDialog()
      setIsDeleteDialogOpen(false)
      loadAppointments()
    } catch (err) {
      console.error('Error deleting note:', err)
      setError(err.message || 'Erro ao excluir anotação')
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

  const getStatusBadge = (status) => {
    const statusMap = {
      0: { label: 'Pendente', variant: 'secondary' },
      1: { label: 'Confirmado', variant: 'default' },
      2: { label: 'Concluído', variant: 'default' },
      3: { label: 'Cancelado', variant: 'destructive' },
      4: { label: 'Não compareceu', variant: 'outline' }
    }
    const statusInfo = statusMap[status] || { label: 'Desconhecido', variant: 'secondary' }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="relative z-10 w-full max-w-full min-w-0 px-3 py-4 sm:px-6 sm:py-6 md:px-10 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 text-text-primary">
              Anotações de Sessões
            </h1>
            <p className="text-lg text-text-secondary">
              Gerencie anotações de sessões para nutricionistas, psicólogos e outros profissionais de saúde
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <Input
                    placeholder="Buscar por cliente, serviço ou anotação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                onClick={loadAppointments}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Agendamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Agendamentos ({filteredAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-text-tertiary mb-4" />
                <p className="text-text-secondary">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Nenhum agendamento encontrado com os filtros aplicados.'
                    : 'Nenhum agendamento encontrado.'}
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
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-text-tertiary" />
                          <span className="text-sm">
                            {formatDate(appointment.start_time)}
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
                            onClick={() => handleOpenDialog(appointment, appointment.note)}
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
          </CardContent>
        </Card>

        {/* Dialog para criar/editar anotação */}
        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {currentNote ? 'Editar Anotação' : 'Nova Anotação'}
              </DialogTitle>
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
                    <strong>Data:</strong> {formatDate(selectedAppointment.start_time)}
                  </p>
                </div>
                {/* Tarefas Pendentes da Sessão Anterior */}
                {pendingTasksFromPrevious.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <Label className="text-sm font-semibold text-amber-800">
                        Tarefas Pendentes da Sessão Anterior
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
                    placeholder="Digite as anotações da sessão (sintomas, diagnóstico, tratamento, observações, etc.)"
                    className="w-full min-h-[200px] px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                  <p className="text-xs text-text-tertiary">
                    Mínimo de 3 caracteres. Use este espaço para anotações clínicas, observações importantes, plano de tratamento, etc.
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
                      As tarefas adicionadas aqui serão lembradas na próxima sessão do paciente.
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
          <AlertDialogContent>
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

