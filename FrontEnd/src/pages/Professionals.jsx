import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Users,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  Mail,
  Phone,
  User,
  Clock,
  Percent,
  AlertCircle,
  Lock,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiService } from '../lib/api'
import { useIsMobile } from '@/hooks/use-mobile'
import { T, DISPLAY } from '@/lib/tokens'

const DEFAULT_SCHEDULE = {
  monday: { enabled: true, start_hour: 9, end_hour: 18 },
  tuesday: { enabled: true, start_hour: 9, end_hour: 18 },
  wednesday: { enabled: true, start_hour: 9, end_hour: 18 },
  thursday: { enabled: true, start_hour: 9, end_hour: 18 },
  friday: { enabled: true, start_hour: 9, end_hour: 18 },
  saturday: { enabled: false, start_hour: 9, end_hour: 18 },
  sunday: { enabled: false, start_hour: 9, end_hour: 18 },
}

const DAY_NAMES = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

const DAY_NAMES_SHORT = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'custom',
  phone_number: '',
  commission_percentage: 50,
  schedule: DEFAULT_SCHEDULE,
}

export function Professionals() {
  const isMobile = useIsMobile()
  const [professionals, setProfessionals] = useState([])

  // — estado da página (lista) —
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [mobilePage, setMobilePage] = useState(1)

  // — estado do dialog de criar/editar —
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProfessional, setEditingProfessional] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [showScheduleConfig, setShowScheduleConfig] = useState(false)

  // — estado do dialog de horários —
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [scheduleProfessional, setScheduleProfessional] = useState(null)
  const [scheduleData, setScheduleData] = useState({})
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false)
  const [scheduleError, setScheduleError] = useState(null)

  // — estado de exclusão —
  const [deleteLoadingId, setDeleteLoadingId] = useState(null)

  const [formData, setFormData] = useState(EMPTY_FORM)

  useEffect(() => {
    loadProfessionals()
  }, [])

  useEffect(() => {
    setMobilePage(1)
  }, [searchTerm])

  const loadProfessionals = async () => {
    try {
      setPageLoading(true)
      setPageError(null)
      const response = await apiService.getProfessionals()
      setProfessionals(Array.isArray(response) ? response : [])
    } catch (err) {
      setPageError('Erro ao carregar profissionais')
    } finally {
      setPageLoading(false)
    }
  }

  const handleOpenDialog = (professional = null) => {
    setFormError(null)
    if (professional) {
      setEditingProfessional(professional)
      const existingSchedule = professional.schedule || {}
      const mergedSchedule = {}
      Object.keys(DEFAULT_SCHEDULE).forEach((day) => {
        mergedSchedule[day] = existingSchedule[day] || DEFAULT_SCHEDULE[day]
      })
      setFormData({
        first_name: professional.first_name || '',
        last_name: professional.last_name || '',
        email: professional.email || '',
        password: '',
        role: professional.role || 'custom',
        phone_number: professional.phone_number || '',
        commission_percentage: professional.commission_percentage ?? 50,
        schedule: mergedSchedule,
      })
      setShowScheduleConfig(false)
    } else {
      setEditingProfessional(null)
      setFormData(EMPTY_FORM)
      setShowScheduleConfig(false)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProfessional(null)
    setFormError(null)
    setShowScheduleConfig(false)
    setFormData(EMPTY_FORM)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.first_name || formData.first_name.trim().length < 3) {
      setFormError('Nome deve ter pelo menos 3 caracteres')
      return
    }
    if (formData.last_name && formData.last_name.trim().length > 0 && formData.last_name.trim().length < 3) {
      setFormError('Sobrenome deve ter pelo menos 3 caracteres ou ficar em branco')
      return
    }
    if (!formData.email || !formData.email.includes('@')) {
      setFormError('Email inválido')
      return
    }

    try {
      setIsSubmitting(true)
      const cleanedData = {
        ...formData,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim() || '',
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        schedule: formData.schedule,
      }

      if (editingProfessional) {
        await apiService.updateProfessional(editingProfessional.id, cleanedData)
        toast.success(`Profissional "${cleanedData.first_name}" atualizado`)
      } else {
        await apiService.createProfessional(cleanedData)
        toast.success(`Profissional "${cleanedData.first_name}" criado`)
      }

      handleCloseDialog()
      loadProfessionals()
    } catch (err) {
      setFormError(err.message || err.data?.errors?.join(', ') || 'Erro ao salvar profissional')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (professional) => {
    if (!confirm(`Excluir "${professional.first_name}"?`)) return

    try {
      setDeleteLoadingId(professional.id)
      await apiService.deleteProfessional(professional.id)
      setProfessionals((prev) => prev.filter((p) => p.id !== professional.id))
      toast.success(`Profissional "${professional.first_name}" excluído`)
    } catch (err) {
      toast.error(err.message || 'Erro ao excluir profissional')
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const handleOpenScheduleDialog = (professional) => {
    setScheduleProfessional(professional)
    setScheduleError(null)
    const existingSchedule = professional.schedule || {}
    const mergedSchedule = {}
    Object.keys(DEFAULT_SCHEDULE).forEach((day) => {
      mergedSchedule[day] = existingSchedule[day] || DEFAULT_SCHEDULE[day]
    })
    setScheduleData(mergedSchedule)
    setIsScheduleDialogOpen(true)
  }

  const handleCloseScheduleDialog = () => {
    setIsScheduleDialogOpen(false)
    setScheduleProfessional(null)
    setScheduleData({})
    setScheduleError(null)
  }

  const handleScheduleChange = (day, field, value) => {
    setScheduleData((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: field === 'enabled' ? value : parseInt(value) || 0,
      },
    }))
  }

  const handleSaveSchedule = async () => {
    try {
      setScheduleSubmitting(true)
      setScheduleError(null)
      await apiService.updateProfessionalSchedule(scheduleProfessional.id, scheduleData)
      toast.success(`Horários de "${scheduleProfessional.name}" atualizados`)
      handleCloseScheduleDialog()
      loadProfessionals()
    } catch (err) {
      setScheduleError(err.message || 'Erro ao salvar horários')
    } finally {
      setScheduleSubmitting(false)
    }
  }

  const filteredProfessionals = professionals.filter((prof) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      prof.name?.toLowerCase().includes(searchLower) ||
      prof.email?.toLowerCase().includes(searchLower) ||
      prof.phone_number?.includes(searchTerm)
    )
  })

  const MOBILE_PAGE_SIZE = 10
  const mobileTotalPages = Math.ceil(filteredProfessionals.length / MOBILE_PAGE_SIZE)
  const mobilePageSafe = Math.min(mobilePage, mobileTotalPages || 1)
  const mobileSlice = filteredProfessionals.slice((mobilePageSafe - 1) * MOBILE_PAGE_SIZE, mobilePageSafe * MOBILE_PAGE_SIZE)

  if (pageLoading && professionals.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: 28, height: 28, color: T.brand, animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: T.muted, fontSize: 14 }}>Carregando profissionais...</p>
        </div>
      </div>
    )
  }

  if (pageError && professionals.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <AlertCircle style={{ width: 36, height: 36, color: T.red }} />
          <p style={{ color: T.text, fontWeight: 600, fontSize: 14, margin: 0 }}>{pageError}</p>
          <Button variant="outline" size="sm" onClick={loadProfessionals}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="professionals-page" style={{ display: 'flex', flexDirection: 'column', gap: 12, ...DISPLAY }}>
        {/* Header compacto */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg sm:text-xl font-bold" style={{ color: T.text, ...DISPLAY }}>
            Profissionais
          </h1>
          <Button
            data-testid="new-professional-btn"
            onClick={() => handleOpenDialog()}
            size="sm"
            style={{ background: T.brand, color: '#fff', border: 'none', borderRadius: 8 }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Profissional
          </Button>
        </div>

        {/* Search inline */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: T.muted }} />
          <Input
            placeholder="Buscar profissionais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Professionals Table */}
        <div>
          {filteredProfessionals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: T.white, border: `1px solid ${T.border}`, borderRadius: 12 }}>
              <Users style={{ width: 40, height: 40, margin: '0 auto 12px', color: T.border }} />
              <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>Nenhum profissional encontrado</p>
            </div>
          ) : (
            <>
              {/* Mobile: Cards Layout */}
              <div className="block md:hidden space-y-3">
                {mobileSlice.map((professional) => (
                  <div
                    key={professional.id}
                    className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
                    style={{ background: T.white, border: `1px solid ${T.border}` }}
                    onClick={() => handleOpenDialog(professional)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.bg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = T.white)}
                  >
                    {/* Card body */}
                    <div className="p-4">
                      <div className="flex items-center space-x-3">
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: T.chip,
                          color: T.brand,
                          fontWeight: 700,
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {(professional.name?.[0] || professional.first_name?.[0] || '?').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate" style={{ color: T.text }}>
                            {professional.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span style={{
                              borderRadius: 20,
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 600,
                              background: T.chip,
                              color: T.brand,
                            }}>
                              {professional.role === 'admin' ? 'Administrador' : 'Profissional'}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.green }}>
                              {professional.commission_percentage ?? 50}% comissão
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 mt-3" style={{ fontSize: 12, color: T.muted }}>
                        {professional.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{professional.email}</span>
                          </div>
                        )}
                        {professional.phone_number && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{professional.phone_number}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action row */}
                    <div
                      className="flex"
                      style={{ borderTop: `1px solid ${T.border}` }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                        style={{ fontSize: 12, fontWeight: 500, color: T.muted }}
                        onClick={() => handleOpenScheduleDialog(professional)}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Horários
                      </button>
                      <div style={{ width: 1, background: T.border }} />
                      <button
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                        style={{ fontSize: 12, fontWeight: 500, color: T.muted }}
                        onClick={() => handleOpenDialog(professional)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <div style={{ width: 1, background: T.border }} />
                      <button
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-colors"
                        style={{ fontSize: 12, fontWeight: 500, color: T.red }}
                        disabled={deleteLoadingId === professional.id}
                        onClick={() => handleDelete(professional)}
                      >
                        {deleteLoadingId === professional.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile pagination */}
              {mobileTotalPages > 1 && (
                <div className="flex md:hidden items-center justify-between pt-2 pb-1">
                  <button
                    disabled={mobilePageSafe <= 1}
                    onClick={() => setMobilePage(p => Math.max(1, p - 1))}
                    className="text-xs font-medium px-3 py-1.5 rounded-full border border-border disabled:opacity-40"
                    style={{ color: T.muted }}
                  >
                    ← Anterior
                  </button>
                  <span className="text-xs" style={{ color: T.muted }}>
                    {mobilePageSafe} / {mobileTotalPages}
                  </span>
                  <button
                    disabled={mobilePageSafe >= mobileTotalPages}
                    onClick={() => setMobilePage(p => Math.min(mobileTotalPages, p + 1))}
                    className="text-xs font-medium px-3 py-1.5 rounded-full border border-border disabled:opacity-40"
                    style={{ color: T.muted }}
                  >
                    Próxima →
                  </button>
                </div>
              )}

              {/* Desktop: Table Layout */}
              <div className="hidden md:block" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <Table>
                  <TableHeader>
                    <TableRow style={{ background: T.bg }}>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfessionals.map((professional) => (
                      <TableRow
                        key={professional.id}
                        data-clickable="true"
                        onClick={() => handleOpenDialog(professional)}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: T.chip,
                              color: T.brand,
                              fontWeight: 700,
                              fontSize: 13,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {(professional.name?.[0] || professional.first_name?.[0] || '?').toUpperCase()}
                            </div>
                            <span className="font-medium" style={{ color: T.text }}>{professional.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2" style={{ fontSize: 12, color: T.muted }}>
                            <Mail className="w-4 h-4" />
                            <span>{professional.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {professional.phone_number ? (
                            <div className="flex items-center space-x-2" style={{ fontSize: 12, color: T.muted }}>
                              <Phone className="w-4 h-4" />
                              <span>{professional.phone_number}</span>
                            </div>
                          ) : (
                            <span style={{ color: T.muted }}>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span style={{
                            borderRadius: 20,
                            padding: '3px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            background: T.chip,
                            color: T.brand,
                          }}>
                            {professional.role === 'admin' ? 'Administrador' : 'Profissional'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span style={{
                            borderRadius: 20, padding: '3px 9px', fontSize: 12, fontWeight: 700,
                            background: T.green + '18', color: T.green,
                          }}>
                            {professional.commission_percentage ?? 50}%
                          </span>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20"
                              onClick={() => handleOpenScheduleDialog(professional)}
                              title="Configurar horários"
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
                              onClick={() => handleOpenDialog(professional)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                              disabled={deleteLoadingId === professional.id}
                              onClick={() => handleDelete(professional)}
                            >
                              {deleteLoadingId === professional.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        {/* Dialog criar/editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent data-testid="professional-dialog" className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User className="h-5 w-5" style={{ color: T.brand }} />
                  </div>
                  <div>
                    <DialogTitle style={{ margin: 0 }}>
                      {editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
                    </DialogTitle>
                    <DialogDescription style={{ margin: 0 }}>
                      {editingProfessional ? 'Atualize as informações do profissional' : 'Preencha os dados do membro da equipe'}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Identificação */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name">Nome</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name">Sobrenome (opcional)</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone_number">Telefone</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {/* Acesso */}
              <div style={{ paddingTop: 20, borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Lock className="h-4 w-4" style={{ color: T.brand }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>Acesso</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">
                    {editingProfessional ? 'Nova Senha (opcional)' : 'Senha (opcional)'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingProfessional ? 'Deixe em branco para não alterar' : 'Deixe em branco para gerar automaticamente'}
                  />
                </div>
              </div>

              {/* Configuração */}
              <div style={{ paddingTop: 20, borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Settings className="h-4 w-4" style={{ color: T.brand }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>Configuração</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Função</Label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { value: 'custom', label: 'Profissional' },
                      { value: 'admin', label: 'Administrador' },
                    ].map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setFormData({ ...formData, role: opt.value })}
                        style={{
                          padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                          cursor: 'pointer', border: '1px solid', fontFamily: 'inherit',
                          borderColor: formData.role === opt.value ? T.brand : T.border,
                          background: formData.role === opt.value ? T.chip : T.white,
                          color: formData.role === opt.value ? T.brand : T.text,
                          transition: 'all 150ms',
                        }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="commission_percentage">Comissão (%)</Label>
                    <div className="relative">
                      <Input
                        id="commission_percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formData.commission_percentage}
                        onChange={(e) => setFormData({ ...formData, commission_percentage: parseFloat(e.target.value) || 0 })}
                        className="pr-8"
                      />
                      <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.muted }} />
                    </div>
                    <p style={{ fontSize: 12, color: T.muted }}>Aplicada a todos os serviços</p>
                </div>

                {!editingProfessional && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Horários de Trabalho</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowScheduleConfig(!showScheduleConfig)}
                      >
                        {showScheduleConfig ? 'Ocultar' : 'Configurar'}
                      </Button>
                    </div>

                    {showScheduleConfig && (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {Object.keys(DEFAULT_SCHEDULE).map((day) => {
                          const dayData = formData.schedule[day] || { enabled: false, start_hour: 9, end_hour: 18 }
                          return (
                            <div key={day} className="border rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">{DAY_NAMES_SHORT[day]}</Label>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={dayData.enabled || false}
                                    onChange={(e) => {
                                      setFormData({
                                        ...formData,
                                        schedule: {
                                          ...formData.schedule,
                                          [day]: { ...dayData, enabled: e.target.checked },
                                        },
                                      })
                                    }}
                                    className="w-4 h-4 rounded"
                                  />
                                  <span style={{ fontSize: 12, color: T.muted }}>Trabalha</span>
                                </div>
                              </div>

                              {dayData.enabled && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label htmlFor={`${day}-start`} className="text-xs">Início</Label>
                                    <Select
                                      value={dayData.start_hour?.toString() || '9'}
                                      onValueChange={(value) => {
                                        setFormData({
                                          ...formData,
                                          schedule: {
                                            ...formData.schedule,
                                            [day]: { ...dayData, start_hour: parseInt(value) },
                                          },
                                        })
                                      }}
                                    >
                                      <SelectTrigger id={`${day}-start`} className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 24 }, (_, i) => (
                                          <SelectItem key={i} value={i.toString()}>
                                            {i.toString().padStart(2, '0')}:00
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor={`${day}-end`} className="text-xs">Fim</Label>
                                    <Select
                                      value={dayData.end_hour?.toString() || '18'}
                                      onValueChange={(value) => {
                                        setFormData({
                                          ...formData,
                                          schedule: {
                                            ...formData.schedule,
                                            [day]: { ...dayData, end_hour: parseInt(value) },
                                          },
                                        })
                                      }}
                                    >
                                      <SelectTrigger id={`${day}-end`} className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 24 }, (_, i) => (
                                          <SelectItem key={i} value={i.toString()}>
                                            {i.toString().padStart(2, '0')}:00
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: T.red + '12', border: `1px solid ${T.red}40`, color: T.red }}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} style={{ background: T.brand, color: '#fff', border: 'none', borderRadius: 8 }}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingProfessional ? 'Atualizar' : 'Criar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Schedule Configuration Dialog */}
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogContent data-testid="professional-schedule-dialog" className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock className="h-5 w-5" style={{ color: T.brand }} />
                </div>
                <div>
                  <DialogTitle style={{ margin: 0 }}>
                    Horários de {scheduleProfessional?.name}
                  </DialogTitle>
                  <DialogDescription style={{ margin: 0 }}>
                    Configure os dias e horários de trabalho da semana
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3">
              {Object.keys(DEFAULT_SCHEDULE).map((day) => {
                const dayData = scheduleData[day] || { enabled: false, start_hour: 9, end_hour: 18 }
                return (
                  <div key={day} className="rounded-lg p-4 space-y-3" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold" style={{ color: T.text }}>{DAY_NAMES[day]}</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`${day}-enabled`}
                          checked={dayData.enabled || false}
                          onCheckedChange={(checked) => handleScheduleChange(day, 'enabled', checked)}
                        />
                        <Label htmlFor={`${day}-enabled`} className="text-sm font-medium cursor-pointer" style={{ color: T.muted }}>
                          Trabalha neste dia
                        </Label>
                      </div>
                    </div>

                    {dayData.enabled && (
                      <div className="grid grid-cols-2 gap-3 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
                        <div className="space-y-2">
                          <Label htmlFor={`${day}-start`} className="text-sm font-medium" style={{ color: T.muted }}>Horário de Início</Label>
                          <Select
                            value={dayData.start_hour?.toString() || '9'}
                            onValueChange={(value) => handleScheduleChange(day, 'start_hour', value)}
                          >
                            <SelectTrigger id={`${day}-start`} className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i.toString().padStart(2, '0')}:00
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`${day}-end`} className="text-sm font-medium" style={{ color: T.muted }}>Horário de Término</Label>
                          <Select
                            value={dayData.end_hour?.toString() || '18'}
                            onValueChange={(value) => handleScheduleChange(day, 'end_hour', value)}
                          >
                            <SelectTrigger id={`${day}-end`} className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i.toString().padStart(2, '0')}:00
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {scheduleError && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: T.red + '12', border: `1px solid ${T.red}40`, color: T.red }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                {scheduleError}
              </div>
            )}

            <DialogFooter className="mt-6 pt-4 border-t border-border">
              <Button type="button" variant="secondary" onClick={handleCloseScheduleDialog}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSaveSchedule}
                disabled={scheduleSubmitting}
                style={{ background: T.brand, color: '#fff', border: 'none', borderRadius: 8 }}
              >
                {scheduleSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Horários'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
