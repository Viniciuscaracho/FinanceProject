import { useState, useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { DocumentEditor } from '@/components/DocumentEditor'
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
  Eye,
  AlertCircle,
  Video,
  ExternalLink,
  ClipboardList,
  Target,
  Plus,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Link2,
  Copy,
  Edit,
  MessageCircle,
  History,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { apiService } from '@/lib/api'
import { formatCurrency } from '@/utils/format'
import { openWhatsApp, getContactPhone } from '@/lib/whatsapp'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { T, DISPLAY } from '@/lib/tokens'

const STATUS_CONFIG = {
  pending:   { label: 'Pendente',       color: '#F59E0B' },
  confirmed: { label: 'Confirmado',     color: '#4C60AA' },
  completed: { label: 'Concluído',      color: '#10B981' },
  canceled:  { label: 'Cancelado',      color: '#D1D5DB' },
  no_show:   { label: 'Não compareceu', color: '#D1D5DB' },
}

function getFileExt(filename = '') {
  return filename.split('.').pop()?.toUpperCase().slice(0, 4) || 'FILE'
}

function isPreviewable(att) {
  const type = (att.content_type || '').toLowerCase()
  const ext = getFileExt(att.filename).toLowerCase()
  return (
    type.startsWith('image/') ||
    type === 'application/pdf' ||
    type === 'text/html' ||
    ext === 'pdf' ||
    ext === 'html'
  )
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

  const textareaRef = useRef(null)
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false)
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState(null)
  const fileInputRef = useRef(null)

  // Anamnese state
  const [anamneseResponse, setAnamneseResponse] = useState(null)
  const [anamneseTemplates, setAnamneseTemplates] = useState([])
  const [anamneseTemplateId, setAnamneseTemplateId] = useState('')
  const [anamneseAnswers, setAnamneseAnswers] = useState({})
  const [isSavingAnamnese, setIsSavingAnamnese] = useState(false)
  const [anamneseExpanded, setAnamneseExpanded] = useState(false)
  const [lastAnamnese, setLastAnamnese] = useState(null)
  const [loadingLastAnamnese, setLoadingLastAnamnese] = useState(false)
  const [anamneseHistory, setAnamneseHistory] = useState([])
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [expandedHistoryId, setExpandedHistoryId] = useState(null)

  // Patient Goals state
  const [goals, setGoals] = useState([])
  const [goalsExpanded, setGoalsExpanded] = useState(false)
  const [newGoal, setNewGoal] = useState({ title: '', unit: '', target_value: '', current_value: '', deadline: '', notes: '' })
  const [showNewGoalForm, setShowNewGoalForm] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)
  const [progressGoalId, setProgressGoalId] = useState(null)
  const [progressValue, setProgressValue] = useState('')
  const [progressNote, setProgressNote] = useState('')
  const [progressDate, setProgressDate] = useState('')
  const [showGoalHistoryId, setShowGoalHistoryId] = useState(null)

  // Patient Documents state
  const [patientDocs, setPatientDocs] = useState([])
  const [docsExpanded, setDocsExpanded] = useState(false)
  const [showNewDocDialog, setShowNewDocDialog] = useState(false)
  const [newDoc, setNewDoc] = useState({ title: '', document_type: 'plano_alimentar', content: '' })
  const [savingDoc, setSavingDoc] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)
  const [editingDocContent, setEditingDocContent] = useState('')
  const [savingEditDoc, setSavingEditDoc] = useState(false)

  // Carrega notas + anexos em paralelo, usando cache quando disponível
  useEffect(() => {
    if (!open || !appointment?.id) {
      if (!open) {
        setNotes('')
        setCurrentNote(null)
        setHasUnsavedChanges(false)
        setLastSaved(null)
        setAttachments([])
        setPreviewAttachment(null)
        setAnamneseResponse(null)
        setAnamneseAnswers({})
        setAnamneseTemplateId('')
        setAnamneseExpanded(false)
        setLastAnamnese(null)
        setAnamneseHistory([])
        setHistoryExpanded(false)
        setExpandedHistoryId(null)
        setGoals([])
        setGoalsExpanded(false)
        setShowNewGoalForm(false)
        setProgressGoalId(null)
        setProgressValue('')
        setProgressNote('')
        setProgressDate('')
        setShowGoalHistoryId(null)
        setPatientDocs([])
        setDocsExpanded(false)
        setShowNewDocDialog(false)
        setNewDoc({ title: '', document_type: 'plano_alimentar', content: '' })
        setEditingDoc(null)
        setEditingDocContent('')
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

  const getPlainText = (html) => html.replace(/<[^>]*>/g, '').trim()

  const handleNotesChange = (value) => {
    setNotes(value)
    setHasUnsavedChanges(true)
  }

  const handleManualSave = async () => {
    if (!appointment?.id) return

    if (getPlainText(notes).length < 3) {
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
      const atts = response.attachments || []
      setAttachments(atts)
      cacheInvalidate(appointment.id)
      toast.success('Anexos adicionados com sucesso!')
    } catch (error) {
      // Se for erro de servidor (5xx), o arquivo pode ter sido salvo mesmo assim.
      // Recarregar lista para manter UI sincronizada.
      if (error.status >= 500) {
        await loadAttachments()
        toast.warning('Upload concluído com avisos. Verificando arquivos...')
      } else {
        toast.error(error.message || 'Erro ao fazer upload dos anexos')
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
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
      toast.error(error.message || 'Erro ao remover anexo')
    }
  }

  const loadAnamnese = async () => {
    if (!appointment?.id) return
    const [anamRes, templRes] = await Promise.all([
      apiService.getAnamneseResponse(appointment.id).catch(() => ({ response: null })),
      apiService.getAnamneseTemplates().catch(() => ({ templates: [] })),
    ])
    const resp = anamRes?.response ?? null
    setAnamneseResponse(resp)
    setAnamneseTemplates(templRes?.templates || [])
    if (resp) {
      setAnamneseTemplateId(resp.anamnese_template_id?.toString() || '')
      setAnamneseAnswers(resp.responses || {})
    } else if (appointment?.anamnese_template_id) {
      setAnamneseTemplateId(appointment.anamnese_template_id.toString())
    }

    // Busca última anamnese do paciente para oferecer pré-preenchimento
    if (!resp && appointment?.contact?.id) {
      apiService.getLastAnamneseResponse(appointment.contact.id)
        .then(r => { if (r?.response) setLastAnamnese(r.response) })
        .catch(() => {})
    }
  }

  const handleCarryForward = () => {
    if (!lastAnamnese) return
    const tplId = lastAnamnese.anamnese_template_id?.toString() || ''
    setAnamneseTemplateId(tplId)
    setAnamneseAnswers(lastAnamnese.responses || {})
    setLastAnamnese(null)
    toast.success('Respostas da última consulta carregadas. Revise e salve.')
  }

  const handleAnamneseExpand = () => {
    if (!anamneseExpanded) loadAnamnese()
    setAnamneseExpanded(prev => !prev)
  }

  const handleSaveAnamnese = async () => {
    if (!appointment?.id) return
    setIsSavingAnamnese(true)
    try {
      const res = await apiService.saveAnamneseResponse(appointment.id, {
        anamnese_template_id: anamneseTemplateId || null,
        responses: anamneseAnswers,
      })
      setAnamneseResponse(res.response)
      toast.success('Anamnese salva!')
    } catch (e) {
      toast.error(e?.message || 'Erro ao salvar anamnese')
    } finally {
      setIsSavingAnamnese(false)
    }
  }

  const handleTemplateChange = async (templateId) => {
    setAnamneseTemplateId(templateId)
    setAnamneseAnswers({})
    if (!appointment?.id) return
    try {
      await apiService.setAppointmentAnamneseTemplate(appointment.id, templateId || null)
    } catch {
      // silent — não crítico
    }
  }

  const handleCopyAnamneseLink = () => {
    if (!appointment?.manage_token) return
    const link = `${import.meta.env.VITE_PUBLIC_URL || window.location.origin}/anamnese/responder/${appointment.manage_token}`
    navigator.clipboard.writeText(link).then(() => toast.success('Link copiado!'))
  }

  const handleSendAnamneseWhatsApp = async () => {
    if (!appointment?.id) return
    try {
      const res = await apiService.sendAnamneseWhatsApp(appointment.id)
      if (res.sent_via_api) {
        toast.success('Formulário enviado pelo WhatsApp!')
      } else if (res.whatsapp_link) {
        window.open(res.whatsapp_link, '_blank')
        toast.success('WhatsApp aberto com a mensagem pronta')
      } else {
        toast.success('Link gerado!')
      }
    } catch (e) {
      // Fallback: open WhatsApp Web directly from frontend
      const link = `${import.meta.env.VITE_PUBLIC_URL || window.location.origin}/anamnese/responder/${appointment.manage_token}`
      const phone = getContactPhone(appointment.contact)
      if (!phone) { toast.error('Paciente sem número de WhatsApp cadastrado'); return }
      const msg = `Olá! Por favor, preencha o formulário antes da nossa consulta:\n${link}`
      openWhatsApp(phone, msg)
    }
  }

  const handleHistoryExpand = async () => {
    if (!historyExpanded && anamneseHistory.length === 0 && appointment?.contact?.id) {
      setLoadingHistory(true)
      try {
        const res = await apiService.getAnamneseHistory(appointment.contact.id)
        setAnamneseHistory(res.responses || [])
      } catch { /* silent */ } finally {
        setLoadingHistory(false)
      }
    }
    setHistoryExpanded(prev => !prev)
  }

  const loadGoals = async () => {
    if (!appointment?.contact?.id) return
    const res = await apiService.getPatientGoals(appointment.contact.id).catch(() => ({ goals: [] }))
    setGoals(res.goals || [])
  }

  const handleGoalsExpand = () => {
    if (!goalsExpanded) loadGoals()
    setGoalsExpanded(prev => !prev)
  }

  const handleSaveGoal = async () => {
    if (!newGoal.title.trim() || !appointment?.contact?.id) return
    setSavingGoal(true)
    try {
      const res = await apiService.createPatientGoal(appointment.contact.id, newGoal)
      setGoals(prev => [res.goal, ...prev])
      setNewGoal({ title: '', unit: '', target_value: '', current_value: '', deadline: '', notes: '' })
      setShowNewGoalForm(false)
      toast.success('Meta adicionada!')
    } catch (e) {
      toast.error(e?.message || 'Erro ao salvar meta')
    } finally {
      setSavingGoal(false)
    }
  }

  const handleAddProgress = async (goal) => {
    if (!progressValue || !appointment?.contact?.id) return
    try {
      const res = await apiService.addPatientGoalProgress(
        appointment.contact.id, goal.id,
        parseFloat(progressValue),
        progressNote || null,
        progressDate || null
      )
      setGoals(prev => prev.map(g => g.id === goal.id ? res.goal : g))
      setProgressGoalId(null)
      setProgressValue('')
      setProgressNote('')
      setProgressDate('')
      toast.success('Progresso registrado!')
    } catch (e) {
      toast.error(e?.message || 'Erro ao registrar progresso')
    }
  }

  const handleUpdateGoalStatus = async (goal, status) => {
    if (!appointment?.contact?.id) return
    try {
      const res = await apiService.updatePatientGoal(appointment.contact.id, goal.id, { status })
      setGoals(prev => prev.map(g => g.id === goal.id ? res.goal : g))
      toast.success(status === 'completed' ? 'Meta concluída!' : 'Meta atualizada')
    } catch (e) {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleDeleteGoal = async (goalId) => {
    if (!appointment?.contact?.id) return
    if (!window.confirm('Remover esta meta?')) return
    try {
      await apiService.deletePatientGoal(appointment.contact.id, goalId)
      setGoals(prev => prev.filter(g => g.id !== goalId))
      toast.success('Meta removida')
    } catch {
      toast.error('Erro ao remover meta')
    }
  }

  const loadPatientDocs = async () => {
    if (!appointment?.contact?.id) return
    const res = await apiService.getPatientDocuments(appointment.contact.id).catch(() => ({ documents: [] }))
    setPatientDocs(res.documents || [])
  }

  const handleDocsExpand = () => {
    if (!docsExpanded) loadPatientDocs()
    setDocsExpanded(prev => !prev)
  }

  const handleOpenNewDoc = async () => {
    if (templates.length === 0 && appointment?.id) {
      try {
        const res = await apiService.getProfessionalDocumentTemplatesForAppointment(appointment.id)
        setTemplates(res.templates || [])
      } catch { /* silent */ }
    }
    setNewDoc({ title: '', document_type: 'plano_alimentar', content: '' })
    setShowNewDocDialog(true)
  }

  const handleNewDocTemplateChange = (templateId) => {
    const tpl = templates.find(t => String(t.id) === templateId)
    setNewDoc(prev => ({ ...prev, content: tpl?.content || '' }))
  }

  const handleCreateDoc = async () => {
    if (!newDoc.title.trim() || !appointment?.contact?.id) return
    setSavingDoc(true)
    try {
      const res = await apiService.createPatientDocument(appointment.contact.id, newDoc)
      setPatientDocs(prev => [res.document, ...prev])
      setShowNewDocDialog(false)
      toast.success('Documento criado!')
    } catch (e) {
      toast.error(e?.message || 'Erro ao criar documento')
    } finally {
      setSavingDoc(false)
    }
  }

  const handleToggleDocShared = async (doc) => {
    try {
      const res = await apiService.togglePatientDocumentShared(appointment.contact.id, doc.id)
      setPatientDocs(prev => prev.map(d => d.id === doc.id ? res.document : d))
      toast.success(res.document.shared ? 'Link ativado!' : 'Link desativado')
    } catch {
      toast.error('Erro ao alterar compartilhamento')
    }
  }

  const handleCopyDocLink = (doc) => {
    const link = `${import.meta.env.VITE_PUBLIC_URL || window.location.origin}/d/${doc.public_token}`
    navigator.clipboard.writeText(link).then(() => toast.success('Link copiado!'))
  }

  const handleDeleteDoc = async (docId) => {
    if (!appointment?.contact?.id) return
    if (!window.confirm('Remover este documento?')) return
    try {
      await apiService.deletePatientDocument(appointment.contact.id, docId)
      setPatientDocs(prev => prev.filter(d => d.id !== docId))
      toast.success('Documento removido')
    } catch {
      toast.error('Erro ao remover documento')
    }
  }

  const handleOpenEditDoc = (doc) => {
    setEditingDoc(doc)
    setEditingDocContent(doc.content || '')
  }

  const handleSaveEditDoc = async () => {
    if (!editingDoc || !appointment?.contact?.id) return
    setSavingEditDoc(true)
    try {
      const res = await apiService.updatePatientDocument(appointment.contact.id, editingDoc.id, { content: editingDocContent })
      setPatientDocs(prev => prev.map(d => d.id === editingDoc.id ? res.document : d))
      setEditingDoc(null)
      setEditingDocContent('')
      toast.success('Documento salvo!')
    } catch {
      toast.error('Erro ao salvar documento')
    } finally {
      setSavingEditDoc(false)
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
      <SheetContent data-testid="consultation-modal" className="w-full sm:max-w-2xl p-0 flex flex-col overflow-hidden" showCloseButton={false}>
        {/* ── Header ── */}
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 px-6 pt-6 pb-5 flex-shrink-0">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>

          <SheetHeader className="p-0">
            <SheetTitle className="sr-only">Atendimento do paciente</SheetTitle>
            <SheetDescription className="sr-only">
              Detalhes e anotações do atendimento
            </SheetDescription>
          </SheetHeader>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: T.brand }}>
              <span className="text-white text-xl font-bold">{initials}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: T.chip }}>Atendimento do paciente</p>
              <h2 className="text-xl font-bold text-white truncate">{clientName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-300">{serviceName}</span>
                <span className="text-gray-600">·</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5"
                  style={{ borderRadius: 20, background: statusCfg.color + '28', color: statusCfg.color === '#D1D5DB' ? '#6B6B6B' : '#fff' }}
                >
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
            {appointment.service?.modality && appointment.service.modality !== 'presencial' && (
              <div className="flex items-center gap-1.5 bg-blue-500/20 rounded-lg px-3 py-1.5">
                <Video className="h-3.5 w-3.5 text-blue-300" />
                <span className="text-xs text-blue-200 font-medium">
                  {appointment.service.modality === 'online' ? 'Online' : 'Híbrido'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Body (scrollável) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-gray-50 dark:bg-gray-950">

          {/* Anotações */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" style={{ color: T.brand }} />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Anotações do Atendimento</span>
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
              <div className="p-5 space-y-3 animate-pulse">
                <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full w-full" />
                <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full w-5/6" />
                <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full w-3/4" />
                <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full w-full" />
                <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full w-2/3" />
                <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full w-4/5" />
              </div>
            ) : (
              <div className={isSaving ? 'pointer-events-none opacity-60' : undefined}>
                <DocumentEditor
                  key={appointment?.id}
                  content={notes}
                  onChange={handleNotesChange}
                  placeholder="Evolução, orientações nutricionais, plano alimentar, observações…"
                  className="border-0 rounded-none shadow-none"
                />
              </div>
            )}
          </div>

          {/* Anamnese */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={handleAnamneseExpand}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" style={{ color: T.brand }} />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Anamnese</span>
                {(appointment?.anamnese_filled || anamneseResponse) ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#10B98120', color: '#10B981' }}>Preenchida</span>
                ) : appointment?.anamnese_template_id ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#F59E0B20', color: '#D97706' }}>Aguardando paciente</span>
                ) : null}
              </div>
              {anamneseExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>

            {anamneseExpanded && (
              <div className="p-4 space-y-4">
                {/* Banner: pré-preencher da última consulta */}
                {lastAnamnese && !anamneseResponse && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10,
                    background: '#7C3AED18', border: '1px solid #7C3AED40', gap: 12,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', margin: 0 }}>Retorno detectado</p>
                      <p style={{ fontSize: 11, color: '#9B72CF', margin: '2px 0 0' }}>
                        Pré-preencha com as respostas da última consulta e edite só o que mudou.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCarryForward}
                      style={{
                        flexShrink: 0, padding: '6px 12px', borderRadius: 8,
                        background: '#7C3AED', color: '#fff', border: 'none',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Usar anterior
                    </button>
                  </div>
                )}

                {/* Template selector + link */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Template de anamnese</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                      value={anamneseTemplateId}
                      onChange={e => handleTemplateChange(e.target.value)}
                      style={{
                        flex: 1, padding: '7px 10px', borderRadius: 8,
                        border: `1px solid ${T.border}`, fontSize: 13,
                        fontFamily: 'inherit', cursor: 'pointer',
                      }}
                    >
                      <option value="">Sem template (livre)</option>
                      {anamneseTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    {anamneseTemplateId && appointment?.manage_token && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={handleCopyAnamneseLink}
                          title="Copiar link"
                          style={{
                            padding: '7px 10px', borderRadius: 8,
                            border: `1px solid ${T.border}`, background: T.light,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                            fontSize: 12, fontWeight: 600, color: T.brand, fontFamily: 'inherit',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Link2 size={13} /> Copiar
                        </button>
                        <button
                          type="button"
                          onClick={handleSendAnamneseWhatsApp}
                          title="Enviar pelo WhatsApp"
                          style={{
                            padding: '7px 10px', borderRadius: 8,
                            border: 'none', background: '#25D366',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                            fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <MessageCircle size={13} /> WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                  {anamneseTemplateId && appointment?.manage_token && (
                    <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                      Envie o link via WhatsApp para o paciente preencher antes da consulta.
                    </p>
                  )}
                </div>

                {/* Fields from selected template */}
                {anamneseTemplateId && (() => {
                  const tpl = anamneseTemplates.find(t => t.id.toString() === anamneseTemplateId)
                  if (!tpl?.fields?.length) return null
                  return (
                    <div className="space-y-3">
                      {tpl.fields.map(field => (
                        <div key={field.id} className="space-y-1">
                          <label className="text-xs font-semibold text-gray-600">
                            {field.label}
                            {field.required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
                          </label>
                          {field.type === 'textarea' && (
                            <textarea
                              rows={3}
                              value={anamneseAnswers[field.id] || ''}
                              onChange={e => setAnamneseAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                            />
                          )}
                          {(field.type === 'text' || field.type === 'number' || field.type === 'date') && (
                            <input
                              type={field.type}
                              value={anamneseAnswers[field.id] || ''}
                              onChange={e => setAnamneseAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
                            />
                          )}
                          {field.type === 'select' && (
                            <select
                              value={anamneseAnswers[field.id] || ''}
                              onChange={e => setAnamneseAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit' }}
                            >
                              <option value="">Selecione…</option>
                              {(field.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                            </select>
                          )}
                          {field.type === 'checkbox' && (
                            <div style={{ display: 'flex', gap: 16 }}>
                              {['Sim', 'Não'].map(opt => (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                                  <input
                                    type="radio"
                                    name={`field_${field.id}`}
                                    value={opt}
                                    checked={anamneseAnswers[field.id] === opt}
                                    onChange={() => setAnamneseAnswers(prev => ({ ...prev, [field.id]: opt }))}
                                    style={{ accentColor: T.brand }}
                                  />
                                  {opt}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* Free-form when no template */}
                {!anamneseTemplateId && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Observações livres</label>
                    <textarea
                      rows={4}
                      value={anamneseAnswers['__free__'] || ''}
                      onChange={e => setAnamneseAnswers({ '__free__': e.target.value })}
                      placeholder="Histórico, queixas, observações importantes…"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                <Button
                  size="sm"
                  onClick={handleSaveAnamnese}
                  disabled={isSavingAnamnese}
                  style={{ background: T.brand, color: '#fff' }}
                  className="gap-2"
                >
                  {isSavingAnamnese ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Salvar anamnese
                </Button>
              </div>
            )}
          </div>

          {/* Histórico de Anamneses */}
          {appointment?.contact?.id && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={handleHistoryExpand}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" style={{ color: T.brand }} />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Histórico de Anamneses</span>
                  {anamneseHistory.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: T.chip, color: T.brand }}>{anamneseHistory.length}</span>
                  )}
                </div>
                {historyExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>

              {historyExpanded && (
                <div className="p-4 space-y-3">
                  {loadingHistory ? (
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" style={{ color: T.brand }} />
                    </div>
                  ) : anamneseHistory.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Nenhuma anamnese registrada para este paciente</p>
                  ) : (
                    anamneseHistory.map(resp => {
                      const isExpanded = expandedHistoryId === resp.id
                      const templateName = resp.anamnese_template?.name || 'Formulário livre'
                      const date = resp.appointment_start_time
                        ? format(new Date(resp.appointment_start_time), "dd/MM/yyyy", { locale: ptBR })
                        : format(new Date(resp.created_at), "dd/MM/yyyy", { locale: ptBR })
                      const fields = resp.anamnese_template?.fields || []
                      const answers = resp.responses || {}

                      return (
                        <div key={resp.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                          <button
                            type="button"
                            onClick={() => setExpandedHistoryId(isExpanded ? null : resp.id)}
                            style={{
                              width: '100%', padding: '10px 14px', textAlign: 'left',
                              background: isExpanded ? T.chip : T.white, border: 'none',
                              cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'space-between', fontFamily: 'inherit',
                            }}
                          >
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{templateName}</span>
                              <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>{date}</span>
                            </div>
                            {isExpanded ? <ChevronUp size={14} style={{ color: T.muted }} /> : <ChevronDown size={14} style={{ color: T.muted }} />}
                          </button>

                          {isExpanded && (
                            <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.border}`, background: T.light, display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {fields.length > 0 ? fields.map(field => {
                                const val = answers[field.id]
                                if (!val) return null
                                return (
                                  <div key={field.id}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, margin: '0 0 2px' }}>{field.label}</p>
                                    <p style={{ fontSize: 13, color: T.text, margin: 0, lineHeight: 1.5 }}>{val}</p>
                                  </div>
                                )
                              }) : (
                                answers['__free__'] && (
                                  <div>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, margin: '0 0 2px' }}>Observações</p>
                                    <p style={{ fontSize: 13, color: T.text, margin: 0, lineHeight: 1.5 }}>{answers['__free__']}</p>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Metas do paciente */}
          {appointment?.contact?.id && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={handleGoalsExpand}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" style={{ color: T.brand }} />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Metas do Paciente</span>
                  {goals.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: T.chip, color: T.brand }}>{goals.length}</span>
                  )}
                </div>
                {goalsExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>

              {goalsExpanded && (
                <div className="p-4 space-y-3">
                  {goals.length === 0 && !showNewGoalForm && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-400">Nenhuma meta cadastrada para este paciente</p>
                    </div>
                  )}

                  {goals.map(goal => {
                    const statusColors = { active: '#10B981', completed: '#4C60AA', abandoned: '#9CA3AF' }
                    const statusLabels = { active: 'Ativa', completed: 'Concluída', abandoned: 'Abandonada' }
                    const color = statusColors[goal.status] || '#9CA3AF'
                    const isActive = goal.status === 'active'
                    const pct = (goal.current_value != null && goal.target_value != null && goal.target_value > 0)
                      ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
                      : null
                    const historyEntries = goal.progress_history || []
                    const showHistory = showGoalHistoryId === goal.id
                    return (
                      <div key={goal.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px' }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: 13 }}>{goal.title}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 20, background: color + '20', color }}>
                                {statusLabels[goal.status] || goal.status}
                              </span>
                            </div>
                            {(goal.current_value != null || goal.target_value != null) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, fontSize: 12, color: T.muted }}>
                                <TrendingUp size={12} style={{ color: T.brand }} />
                                <span>
                                  {goal.current_value != null ? `Atual: ${goal.current_value}` : ''}
                                  {goal.current_value != null && goal.target_value != null ? ' → ' : ''}
                                  {goal.target_value != null ? `Meta: ${goal.target_value}` : ''}
                                  {goal.unit ? ` ${goal.unit}` : ''}
                                </span>
                                {pct != null && <span style={{ fontWeight: 700, color: T.brand }}>{pct}%</span>}
                              </div>
                            )}
                            {/* Progress bar */}
                            {pct != null && (
                              <div style={{ marginTop: 6, height: 5, borderRadius: 99, background: T.border, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s' }} />
                              </div>
                            )}
                            {goal.deadline && (
                              <p style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                                Prazo: {new Date(goal.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(goal.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.border, padding: 4, flexShrink: 0 }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Action row */}
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          {isActive && (
                            <button type="button"
                              onClick={() => { setProgressGoalId(progressGoalId === goal.id ? null : goal.id); setProgressValue(''); setProgressNote(''); setProgressDate('') }}
                              style={{ fontSize: 11, fontWeight: 600, color: T.brand, background: T.chip, border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                              + Registrar
                            </button>
                          )}
                          {historyEntries.length > 0 && (
                            <button type="button"
                              onClick={() => setShowGoalHistoryId(showHistory ? null : goal.id)}
                              style={{ fontSize: 11, fontWeight: 600, color: T.muted, background: T.light, border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                              {showHistory ? '▲' : '▼'} Histórico ({historyEntries.length})
                            </button>
                          )}
                          {isActive && (
                            <button type="button"
                              onClick={() => handleUpdateGoalStatus(goal, 'completed')}
                              style={{ fontSize: 11, fontWeight: 600, color: T.brand, background: T.chip, border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                              ✓ Concluir
                            </button>
                          )}
                          {!isActive && (
                            <button type="button"
                              onClick={() => handleUpdateGoalStatus(goal, 'active')}
                              style={{ fontSize: 11, fontWeight: 600, color: '#10B981', background: '#10B98120', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                              ↺ Reativar
                            </button>
                          )}
                        </div>

                        {/* Progress entry form */}
                        {progressGoalId === goal.id && (
                          <div style={{ marginTop: 10, padding: '10px 12px', background: T.light, borderRadius: 8, border: `1px solid ${T.border}` }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                              <input
                                type="number" step="any" value={progressValue}
                                onChange={e => setProgressValue(e.target.value)}
                                placeholder={`Valor${goal.unit ? ` (${goal.unit})` : ''}`}
                                style={{ padding: '6px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit' }}
                              />
                              <input
                                type="date" value={progressDate}
                                onChange={e => setProgressDate(e.target.value)}
                                style={{ padding: '6px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit' }}
                              />
                            </div>
                            <input
                              type="text" value={progressNote}
                              onChange={e => setProgressNote(e.target.value)}
                              placeholder="Observação (opcional)"
                              style={{ width: '100%', padding: '6px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 6 }}
                            />
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <Button size="sm" variant="ghost" onClick={() => { setProgressGoalId(null); setProgressValue(''); setProgressNote(''); setProgressDate('') }} style={{ fontSize: 11 }}>Cancelar</Button>
                              <Button size="sm" onClick={() => handleAddProgress(goal)} disabled={!progressValue} style={{ background: T.brand, color: '#fff', fontSize: 11 }}>OK</Button>
                            </div>
                          </div>
                        )}

                        {/* Progress history */}
                        {showHistory && historyEntries.length > 0 && (
                          <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                            {[...historyEntries].reverse().map((entry, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 12, color: T.text, padding: '3px 0', borderBottom: i < historyEntries.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                                <div>
                                  <span style={{ fontWeight: 700 }}>{entry.value}{goal.unit ? ` ${goal.unit}` : ''}</span>
                                  {entry.note && <span style={{ color: T.muted, marginLeft: 6 }}>{entry.note}</span>}
                                </div>
                                <span style={{ color: T.muted, fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
                                  {entry.date ? new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {showNewGoalForm ? (
                    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px', background: T.light }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 3 }}>Título da meta *</label>
                          <input type="text" value={newGoal.title} onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))}
                            placeholder="Ex: Emagrecer 5kg" style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 3 }}>Valor atual</label>
                          <input type="number" step="any" value={newGoal.current_value} onChange={e => setNewGoal(p => ({ ...p, current_value: e.target.value }))}
                            placeholder="72" style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 3 }}>Meta</label>
                          <input type="number" step="any" value={newGoal.target_value} onChange={e => setNewGoal(p => ({ ...p, target_value: e.target.value }))}
                            placeholder="65" style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 3 }}>Unidade</label>
                          <input type="text" value={newGoal.unit} onChange={e => setNewGoal(p => ({ ...p, unit: e.target.value }))}
                            placeholder="kg, mg/dL…" style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 3 }}>Prazo</label>
                          <input type="date" value={newGoal.deadline} onChange={e => setNewGoal(p => ({ ...p, deadline: e.target.value }))}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Button size="sm" variant="ghost" onClick={() => setShowNewGoalForm(false)} disabled={savingGoal} style={{ fontSize: 12 }}>Cancelar</Button>
                        <Button size="sm" onClick={handleSaveGoal} disabled={savingGoal || !newGoal.title.trim()} style={{ background: T.brand, color: '#fff', fontSize: 12 }} className="gap-1.5">
                          {savingGoal ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setShowNewGoalForm(true)} className="gap-2 w-full" style={{ fontSize: 12 }}>
                      <Plus className="h-3.5 w-3.5" /> Nova meta
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Documentos do Paciente */}
          {appointment?.contact?.id && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={handleDocsExpand}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" style={{ color: T.brand }} />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Documentos do Paciente</span>
                  {patientDocs.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: T.chip, color: T.brand }}>{patientDocs.length}</span>
                  )}
                </div>
                {docsExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>

              {docsExpanded && (
                <div className="p-4 space-y-3">
                  {patientDocs.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-400">Nenhum documento criado para este paciente</p>
                    </div>
                  )}

                  {patientDocs.map(doc => (
                    <div key={doc.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{doc.title}</span>
                            {doc.document_type_label && (
                              <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 20, background: T.chip, color: T.brand }}>
                                {doc.document_type_label}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
                            Atualizado {formatDate(doc.updated_at)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.border, padding: 4 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditDoc(doc)}
                          style={{ fontSize: 11, fontWeight: 600, color: T.brand, background: T.chip, border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Edit size={11} /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleDocShared(doc)}
                          style={{ fontSize: 11, fontWeight: 600, color: doc.shared ? '#10B981' : T.muted, background: doc.shared ? '#10B98120' : T.light, border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Link2 size={11} /> {doc.shared ? 'Link ativo' : 'Ativar link'}
                        </button>
                        {doc.shared && (
                          <button
                            type="button"
                            onClick={() => handleCopyDocLink(doc)}
                            style={{ fontSize: 11, fontWeight: 600, color: '#fff', background: T.brand, border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <Copy size={11} /> Copiar link
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <Button size="sm" variant="outline" onClick={handleOpenNewDoc} className="gap-2 w-full" style={{ fontSize: 12 }}>
                    <Plus className="h-3.5 w-3.5" /> Novo documento
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Anexos */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" style={{ color: T.brand }} />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Anexos
                  {attachments.length > 0 && (
                    <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: T.chip, color: T.brand }}>
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
                className="h-8 text-xs font-semibold gap-1.5"
                style={{ color: T.brand }}
              >
                {isUploadingAttachment ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando…</>
                ) : (
                  <><Upload className="h-3.5 w-3.5" /> Adicionar</>
                )}
              </Button>
            </div>

            {isLoadingAttachments ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                    <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-3/4" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-1/4" />
                    </div>
                  </div>
                ))}
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
                        {att.url && isPreviewable(att) && (
                          <button
                            onClick={() => setPreviewAttachment(att)}
                            className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                        )}
                        {att.url && (
                          <button
                            onClick={() => window.open(att.url, '_blank')}
                            className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                            title="Baixar"
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenDocumentDialog}
              disabled={isSaving}
              className="gap-2"
            >
              <GraduationCap className="h-4 w-4" />
              Gerar Documento
            </Button>
            {appointment.service?.meeting_url && (appointment.service?.modality === 'online' || appointment.service?.modality === 'hybrid') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(appointment.service.meeting_url, '_blank', 'noopener,noreferrer')}
                className="gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                <Video className="h-4 w-4" />
                <span className="hidden sm:inline">Entrar na call</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
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
              disabled={isSaving || getPlainText(notes).length < 3}
              className="gap-2"
              style={{ background: T.brand, color: '#fff', borderRadius: 8 }}
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
        <DialogContent data-testid="consultation-document-dialog" className="sm:max-w-3xl">
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
                  <strong>Nota:</strong> O documento será gerado usando as anotações do atendimento e informações do agendamento.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-white">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(generatedDocument) }}
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
      {/* Dialog: Novo Documento do Paciente */}
      <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
        <DialogContent style={{ maxWidth: 480 }}>
          <DialogHeader>
            <DialogTitle>Novo Documento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 4 }}>Título *</label>
              <input
                type="text"
                value={newDoc.title}
                onChange={e => setNewDoc(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Plano Alimentar - Maio 2026"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 4 }}>Tipo</label>
              <select
                value={newDoc.document_type}
                onChange={e => setNewDoc(p => ({ ...p, document_type: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
              >
                <option value="plano_alimentar">Plano Alimentar</option>
                <option value="orientacao_nutricional">Orientação Nutricional</option>
                <option value="evolucao_paciente">Evolução do Paciente</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            {templates.length > 0 && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 4 }}>
                  Usar template como base <span style={{ fontWeight: 400, color: T.muted }}>(opcional)</span>
                </label>
                <select
                  onChange={e => handleNewDocTemplateChange(e.target.value)}
                  defaultValue=""
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
                >
                  <option value="">Sem template (documento em branco)</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDocDialog(false)} disabled={savingDoc}>Cancelar</Button>
            <Button onClick={handleCreateDoc} disabled={savingDoc || !newDoc.title.trim()} style={{ background: T.brand, color: '#fff' }} className="gap-2">
              {savingDoc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Criar documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Visualizar Anexo */}
      <Dialog open={!!previewAttachment} onOpenChange={open => { if (!open) setPreviewAttachment(null) }}>
        <DialogContent style={{ maxWidth: 900, width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 truncate">
              <Eye className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{previewAttachment?.filename}</span>
            </DialogTitle>
          </DialogHeader>

          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', borderRadius: 8, border: `1px solid ${T.border}` }}>
            {previewAttachment && (() => {
              const type = (previewAttachment.content_type || '').toLowerCase()
              const ext = getFileExt(previewAttachment.filename).toLowerCase()

              if (type.startsWith('image/')) {
                return (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300, background: T.light }}>
                    <img
                      src={previewAttachment.url}
                      alt={previewAttachment.filename}
                      style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 6 }}
                    />
                  </div>
                )
              }

              if (type === 'text/html' || ext === 'html') {
                return (
                  <div
                    style={{ padding: '16px 20px', height: '100%', minHeight: 300, overflowY: 'auto', background: T.white, fontSize: 14, lineHeight: 1.6, color: T.text }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewAttachment._html || '') }}
                  />
                )
              }

              // PDF — iframe
              return (
                <iframe
                  src={previewAttachment.url}
                  title={previewAttachment.filename}
                  style={{ width: '100%', height: '70vh', border: 'none' }}
                />
              )
            })()}
          </div>

          <DialogFooter style={{ marginTop: 12 }}>
            <Button variant="outline" onClick={() => setPreviewAttachment(null)}>Fechar</Button>
            {previewAttachment?.url && (
              <Button onClick={() => window.open(previewAttachment.url, '_blank')} style={{ background: T.brand, color: '#fff' }} className="gap-2">
                <Download className="h-3.5 w-3.5" /> Baixar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Documento do Paciente */}
      <Dialog open={!!editingDoc} onOpenChange={open => { if (!open) { setEditingDoc(null); setEditingDocContent('') } }}>
        <DialogContent style={{ maxWidth: 860, width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
          <DialogHeader>
            <DialogTitle>{editingDoc?.title}</DialogTitle>
          </DialogHeader>

          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <DocumentEditor
              value={editingDocContent}
              onChange={setEditingDocContent}
            />
          </div>

          <DialogFooter style={{ marginTop: 12 }}>
            <Button variant="outline" onClick={() => { setEditingDoc(null); setEditingDocContent('') }} disabled={savingEditDoc}>Cancelar</Button>
            <Button onClick={handleSaveEditDoc} disabled={savingEditDoc} style={{ background: T.brand, color: '#fff' }} className="gap-2">
              {savingEditDoc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}

