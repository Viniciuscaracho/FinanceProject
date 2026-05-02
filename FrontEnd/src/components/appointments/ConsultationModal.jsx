import { useState, useEffect, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Clock,
  User,
  Scissors,
  DollarSign,
  Save,
  Loader2,
  FileText,
  X,
  CheckCircle2,
  FileDown,
  GraduationCap,
  Paperclip,
  Upload,
  Trash2,
  Download,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { apiService } from '@/lib/api'
import { formatCurrency } from '@/utils/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  pending:   { label: 'Pendente',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  completed: { label: 'Concluído',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  canceled:  { label: 'Cancelado',  color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  no_show:   { label: 'Não compareceu', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

function getFileExt(filename = '') {
  return filename.split('.').pop()?.toUpperCase().slice(0, 4) || 'FILE'
}

function getExtColor(ext = '') {
  const map = { PDF: 'bg-red-100 text-red-600', PNG: 'bg-purple-100 text-purple-600', JPG: 'bg-purple-100 text-purple-600', JPEG: 'bg-purple-100 text-purple-600', DOC: 'bg-blue-100 text-blue-600', DOCX: 'bg-blue-100 text-blue-600', XLS: 'bg-green-100 text-green-600', XLSX: 'bg-green-100 text-green-600' }
  return map[ext] || 'bg-gray-100 text-gray-600'
}

// Cache simples em memória — evita recarregar ao reabrir o mesmo agendamento
const _cache = new Map() // id -> { note, attachments, ts }
const CACHE_TTL = 60_000  // 60 s

function cacheGet(id) {
  const entry = _cache.get(id)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(id); return null }
  return entry
}
function cacheSet(id, data) {
  _cache.set(id, { ...data, ts: Date.now() })
}
function cacheInvalidate(id) {
  _cache.delete(id)
}

export function ConsultationModal({ appointment, open, onOpenChange }) {
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentNote, setCurrentNote] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const autoSaveTimeoutRef = useRef(null)
  const textareaRef = useRef(null)
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false)
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const fileInputRef = useRef(null)

  // Carrega notas + anexos em paralelo, usando cache quando disponível
  useEffect(() => {
    if (!open || !appointment?.id) {
      if (!open) {
        setNotes('')
        setCurrentNote(null)
        setHasUnsavedChanges(false)
        setLastSaved(null)
        setAttachments([])
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
      }
      return
    }

    const id = appointment.id
    const cached = cacheGet(id)

    if (cached) {
      // Abertura instantânea — sem nenhuma requisição
      const { note, attachments: cachedAttachments } = cached
      setCurrentNote(note ?? null)
      setNotes(note?.notes ?? '')
      setLastSaved(note?.updated_at ?? null)
      setAttachments(cachedAttachments ?? [])
      return
    }

    // Primeira abertura: busca notas e anexos ao mesmo tempo
    setIsLoading(true)
    setIsLoadingAttachments(true)

    Promise.all([
      apiService.getAppointmentNotes(id).catch(() => null),
      apiService.getAppointmentAttachments(id).catch(() => null),
    ]).then(([notesRes, attRes]) => {
      const note = notesRes?.notes?.[0] ?? null
      const atts = attRes?.attachments ?? []

      setCurrentNote(note)
      setNotes(note?.notes ?? '')
      setLastSaved(note?.updated_at ?? null)
      setAttachments(atts)
      cacheSet(id, { note, attachments: atts })
    }).finally(() => {
      setIsLoading(false)
      setIsLoadingAttachments(false)
    })
  }, [open, appointment?.id])

  // Auto-save após 2 segundos de inatividade
  useEffect(() => {
    if (hasUnsavedChanges && notes.trim().length >= 3) {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
      autoSaveTimeoutRef.current = setTimeout(() => { handleAutoSave() }, 2000)
    }
    return () => { if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current) }
  }, [notes, hasUnsavedChanges])

  const loadAttachments = async () => {
    if (!appointment?.id) return
    try {
      setIsLoadingAttachments(true)
      const response = await apiService.getAppointmentAttachments(appointment.id)
      const atts = response.attachments || []
      setAttachments(atts)
      const cached = cacheGet(appointment.id)
      if (cached) cacheSet(appointment.id, { ...cached, attachments: atts })
    } catch (error) {
      if (error.status !== 404) toast.error('Erro ao carregar anexos')
    } finally {
      setIsLoadingAttachments(false)
    }
  }

  const loadAppointmentNote = async () => {
    if (!appointment?.id) return
    try {
      setIsLoading(true)
      const response = await apiService.getAppointmentNotes(appointment.id)
      if (response.notes && response.notes.length > 0) {
        const note = response.notes[0]
        setCurrentNote(note)
        setNotes(note.notes || '')
        setLastSaved(note.updated_at)
      } else {
        setCurrentNote(null)
        setNotes('')
        setLastSaved(null)
      }
    } catch (error) {
      if (error.status !== 404) toast.error('Erro ao carregar anotação')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotesChange = (value) => {
    setNotes(value)
    setHasUnsavedChanges(true)
  }

  const handleAutoSave = async () => {
    if (!appointment?.id || !notes.trim() || notes.trim().length < 3) {
      return
    }

    try {
      setIsSaving(true)
      
      if (currentNote) {
        // Atualizar anotação existente
        await apiService.updateAppointmentNote(
          appointment.id,
          currentNote.id,
          { notes }
        )
      } else {
        // Criar nova anotação
        const response = await apiService.createAppointmentNote(
          appointment.id,
          { notes }
        )
        if (response.note) {
          setCurrentNote(response.note)
        }
      }

      setHasUnsavedChanges(false)
      setLastSaved(new Date().toISOString())
      cacheInvalidate(appointment.id)
      toast.success('Anotação salva automaticamente', {
        duration: 1500,
        position: 'bottom-right'
      })
    } catch (error) {
      console.error('Erro ao salvar anotação:', error)
      toast.error('Erro ao salvar anotação automaticamente')
    } finally {
      setIsSaving(false)
    }
  }

  const handleManualSave = async () => {
    if (!appointment?.id) return

    if (!notes.trim() || notes.trim().length < 3) {
      toast.error('A anotação deve ter pelo menos 3 caracteres')
      return
    }

    try {
      setIsSaving(true)
      
      if (currentNote) {
        await apiService.updateAppointmentNote(
          appointment.id,
          currentNote.id,
          { notes }
        )
      } else {
        const response = await apiService.createAppointmentNote(
          appointment.id,
          { notes }
        )
        if (response.note) {
          setCurrentNote(response.note)
        }
      }

      setHasUnsavedChanges(false)
      setLastSaved(new Date().toISOString())
      cacheInvalidate(appointment.id)
      toast.success('Anotação salva com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar anotação:', error)
      toast.error(error.message || 'Erro ao salvar anotação')
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenDocumentDialog = async () => {
    try {
      setIsDocumentDialogOpen(true)
      const response = await apiService.getProfessionalDocumentTemplatesForAppointment(appointment.id)
      setTemplates(response.templates || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      toast.error('Erro ao carregar templates de documentos')
    }
  }

  const handleGenerateDocument = async () => {
    if (!selectedTemplateId) {
      toast.error('Selecione um template')
      return
    }

    try {
      setIsGeneratingDocument(true)
      const response = await apiService.generateProfessionalDocumentFromAppointment(
        appointment.id,
        selectedTemplateId,
        {
          document_content: notes, // Usar as anotações como conteúdo
          progress: '', // Pode ser preenchido depois
          instructions: '', // Pode ser preenchido depois
          observations: '' // Pode ser preenchido depois
        }
      )

      if (response.success) {
        setGeneratedDocument(response.content)
        if (response.attachment) {
          setAttachments(prev => [...prev, response.attachment])
        }
        toast.success('Documento gerado e anexado à sessão!')
      } else {
        toast.error(response.error || 'Erro ao gerar documento')
      }
    } catch (error) {
      console.error('Erro ao gerar documento:', error)
      toast.error(error.message || 'Erro ao gerar documento')
    } finally {
      setIsGeneratingDocument(false)
    }
  }

  const handlePrintDocument = () => {
    if (!generatedDocument) return
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Documento Profissional</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${generatedDocument}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleFileSelect = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      setIsUploadingAttachment(true)
      const response = await apiService.uploadAppointmentAttachments(appointment.id, files)
      setAttachments(response.attachments || [])
      toast.success('Anexos adicionados com sucesso!')
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast.error(error.message || 'Erro ao fazer upload dos anexos')
    } finally {
      setIsUploadingAttachment(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Tem certeza que deseja remover este anexo?')) {
      return
    }

    try {
      await apiService.deleteAppointmentAttachment(appointment.id, attachmentId)
      setAttachments(attachments.filter(att => att.id !== attachmentId))
      toast.success('Anexo removido com sucesso!')
    } catch (error) {
      console.error('Erro ao remover anexo:', error)
      toast.error(error.message || 'Erro ao remover anexo')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const formatLastSaved = (dateString) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffSecs = Math.floor(diffMs / 1000)
      const diffMins = Math.floor(diffSecs / 60)

      if (diffSecs < 60) {
        return 'agora mesmo'
      } else if (diffMins < 60) {
        return `há ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
      } else {
        return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
      }
    } catch {
      return null
    }
  }

  if (!appointment) return null

  const clientName = appointment.contact?.name || appointment.whatsapp_number || 'Cliente'
  const serviceName = appointment.service?.name || 'Serviço'
  const professionalName = appointment.professional?.name || appointment.account_user?.user?.name || 'Profissional'
  const statusKey = appointment.status || 'pending'
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending
  const initials = clientName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 px-6 pt-6 pb-5 flex-shrink-0">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>

          <SheetHeader className="p-0">
            <SheetTitle className="sr-only">Sessão do cliente</SheetTitle>
            <SheetDescription className="sr-only">
              Detalhes e anotações da sessão do agendamento
            </SheetDescription>
          </SheetHeader>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white text-xl font-bold">{initials}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-0.5">Sessão do cliente</p>
              <h2 className="text-xl font-bold text-white truncate">{clientName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-300">{serviceName}</span>
                <span className="text-gray-600">·</span>
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", statusCfg.color)}>
                  {statusCfg.label}
                </span>
              </div>
            </div>
          </div>

          {/* Chips de info */}
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
              <User className="h-3.5 w-3.5 text-gray-300" />
              <span className="text-xs text-gray-200 font-medium">{professionalName}</span>
            </div>
            {appointment.start_time && (
              <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-300" />
                <span className="text-xs text-gray-200 font-medium">
                  {format(new Date(appointment.start_time), "dd 'de' MMM, yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
            {appointment.start_time && appointment.end_time && (
              <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-300" />
                <span className="text-xs text-gray-200 font-medium">
                  {format(new Date(appointment.start_time), 'HH:mm')} – {format(new Date(appointment.end_time), 'HH:mm')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
              <DollarSign className="h-3.5 w-3.5 text-gray-300" />
              <span className="text-xs text-gray-200 font-medium">
                {formatCurrency(appointment.price?.cents || 0, appointment.price?.currency || 'BRL')}
              </span>
            </div>
          </div>
        </div>

        {/* ── Body (scrollável) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-gray-50 dark:bg-gray-950">

          {/* Anotações */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Anotações da Sessão</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isSaving && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Salvando…
                  </span>
                )}
                {!isSaving && hasUnsavedChanges && (
                  <span className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Não salvo
                  </span>
                )}
                {!isSaving && !hasUnsavedChanges && lastSaved && (
                  <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Salvo {formatLastSaved(lastSaved)}
                  </span>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
              </div>
            ) : (
              <Textarea
                id="session-notes"
                ref={textareaRef}
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Anotações, observações, diagnóstico, tratamento…"
                className="min-h-[220px] resize-y border-0 rounded-none focus-visible:ring-0 bg-transparent text-sm leading-relaxed"
                disabled={isSaving}
              />
            )}
          </div>

          {/* Anexos */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Anexos
                  {attachments.length > 0 && (
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold px-1.5 py-0.5 rounded-full">
                      {attachments.length}
                    </span>
                  )}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploadingAttachment}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAttachment}
                className="h-8 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-1.5"
              >
                {isUploadingAttachment ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando…</>
                ) : (
                  <><Upload className="h-3.5 w-3.5" /> Adicionar</>
                )}
              </Button>
            </div>

            {isLoadingAttachments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : attachments.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {attachments.map((att) => {
                  const ext = getFileExt(att.filename)
                  return (
                    <div key={att.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0", getExtColor(ext))}>
                        {ext}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{att.filename}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(att.byte_size)}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {att.url && (
                          <button
                            onClick={() => window.open(att.url, '_blank')}
                            className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                          >
                            <Download className="h-4 w-4 text-gray-500" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-10 w-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                  <Paperclip className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Nenhum anexo ainda</p>
                <p className="text-xs text-gray-400 mt-0.5">Clique em "Adicionar" para enviar arquivos</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenDocumentDialog}
            disabled={isSaving || !currentNote}
            className="gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Gerar Documento</span>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              onClick={handleManualSave}
              disabled={isSaving || !notes.trim() || notes.trim().length < 3 || !hasUnsavedChanges}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…</>
              ) : (
                <><Save className="h-3.5 w-3.5" /> Salvar</>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>

      {/* Dialog para Gerar Documento Profissional */}
      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Gerar Documento Profissional
            </DialogTitle>
          </DialogHeader>

          {!generatedDocument ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-select">Selecione o Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger id="template-select">
                    <SelectValue placeholder="Selecione um template de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                        {template.professional_type_label && (
                          <span className="text-muted-foreground ml-2">
                            ({template.professional_type_label})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templates.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum template disponível. Crie templates em "Modelos de Documentos".
                  </p>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Nota:</strong> O documento será gerado usando as anotações da sessão e informações do agendamento.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-white">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: generatedDocument }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {!generatedDocument ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsDocumentDialogOpen(false)}
                  disabled={isGeneratingDocument}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGenerateDocument}
                  disabled={isGeneratingDocument || !selectedTemplateId}
                >
                  {isGeneratingDocument ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4 mr-2" />
                      Gerar Documento
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedDocument(null)
                    setSelectedTemplateId('')
                  }}
                >
                  Gerar Outro
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrintDocument}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Imprimir/Salvar PDF
                </Button>
                <Button
                  onClick={() => setIsDocumentDialogOpen(false)}
                >
                  Fechar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}

