import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Scissors,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  DollarSign,
  AlertCircle,
  Video,
  MapPin,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiService } from '../lib/api'
import { useIsMobile } from '@/hooks/use-mobile'
import { FluidSection } from '@/components/design'
import { T, DISPLAY } from '@/lib/tokens'

export function Services() {
  const isMobile = useIsMobile()
  const [services, setServices] = useState([])

  // — estado da página (lista) —
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // — estado do dialog de criar/editar —
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  // — estado do dialog de exclusão —
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: '',
    cost_price_cents: '',
    selling_price_cents: '',
    currency: 'BRL',
    modality: 'presencial',
    meeting_url: '',
  })

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setPageLoading(true)
      setPageError(null)
      const response = await apiService.getServices()
      setServices(Array.isArray(response) ? response : [])
    } catch (err) {
      setPageError('Erro ao carregar serviços')
    } finally {
      setPageLoading(false)
    }
  }

  const handleOpenDialog = (service = null) => {
    setFormError(null)
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name || '',
        description: service.description || '',
        unit: service.unit || '',
        cost_price_cents: service.cost_price?.cents ? (service.cost_price.cents / 100).toFixed(2) : '',
        selling_price_cents: service.selling_price?.cents ? (service.selling_price.cents / 100).toFixed(2) : '',
        currency: service.selling_price?.currency || 'BRL',
        modality: service.modality || 'presencial',
        meeting_url: service.meeting_url || '',
      })
    } else {
      setEditingService(null)
      setFormData({ name: '', description: '', unit: '', cost_price_cents: '', selling_price_cents: '', currency: 'BRL', modality: 'presencial', meeting_url: '' })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingService(null)
    setFormError(null)
    setFormData({ name: '', description: '', unit: '', cost_price_cents: '', selling_price_cents: '', currency: 'BRL', modality: 'presencial', meeting_url: '' })
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    try {
      setIsSubmitting(true)

      const serviceData = {
        ...formData,
        cost_price_cents: formData.cost_price_cents ? Math.round(parseFloat(formData.cost_price_cents) * 100) : 0,
        selling_price_cents: formData.selling_price_cents ? Math.round(parseFloat(formData.selling_price_cents) * 100) : 0,
        meeting_url: formData.modality === 'presencial' ? '' : formData.meeting_url,
      }

      if (editingService) {
        await apiService.updateService(editingService.id, serviceData)
        toast.success(`Serviço "${formData.name}" atualizado`)
      } else {
        await apiService.createService(serviceData)
        toast.success(`Serviço "${formData.name}" criado`)
      }

      handleCloseDialog()
      loadServices()
    } catch (err) {
      setFormError(err.message || 'Erro ao salvar serviço')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestDelete = (service) => {
    setServiceToDelete(service)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return

    try {
      setDeleteLoadingId(serviceToDelete.id)
      await apiService.deleteService(serviceToDelete.id)
      setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id))
      toast.success(`Serviço "${serviceToDelete.name}" excluído`)
      setIsDeleteDialogOpen(false)
      setServiceToDelete(null)
    } catch (err) {
      toast.error(err.message || 'Erro ao excluir serviço')
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setServiceToDelete(null)
  }

  const filteredServices = services.filter((service) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      service.name?.toLowerCase().includes(searchLower) ||
      service.description?.toLowerCase().includes(searchLower)
    )
  })

  if (pageLoading && services.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: T.brand }} />
          <p style={{ color: T.muted }}>Carregando serviços...</p>
        </div>
      </div>
    )
  }

  if (pageError && services.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <AlertCircle className="h-10 w-10 mx-auto text-red-400" />
          <p className="font-medium text-gray-700 dark:text-gray-300">{pageError}</p>
          <Button variant="outline" size="sm" onClick={loadServices}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="services-page" className="relative min-h-screen" style={{ background: T.bg }}>
      <div className="relative z-10 space-y-3">
        {/* Header compacto */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg sm:text-xl font-bold" style={{ color: T.text, ...DISPLAY }}>
            Serviços
          </h1>
          <Button
            data-testid="new-service-btn"
            onClick={() => handleOpenDialog()}
            size="sm"
            style={{ background: T.brand, color: '#fff', border: 'none', borderRadius: 8 }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Serviço
          </Button>
        </div>

        {/* Search inline */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: T.muted }} />
          <Input
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

      {/* Services List - Modern Style */}
      <FluidSection
        title="Lista de Serviços"
        subtitle={`${filteredServices.length} serviço${filteredServices.length !== 1 ? 's' : ''} encontrado${filteredServices.length !== 1 ? 's' : ''}`}
        gradient="from-[#D4A574] to-[#C89B6C]"
      >
        {filteredServices.length === 0 ? (
          <div className="text-center py-12" style={{ color: T.muted }}>
            <Scissors className="w-12 h-12 mx-auto mb-4" style={{ color: T.border }} />
            <p>Nenhum serviço encontrado</p>
          </div>
        ) : (
          <>
            {/* Mobile: Cards Layout */}
            <div className="block md:hidden space-y-3">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
                  style={{ background: T.white, border: `1px solid ${T.border}` }}
                  onClick={() => handleOpenDialog(service)}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = T.white}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base whitespace-pre-line break-words" style={{ color: T.text }}>
                          {service.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span style={{
                            borderRadius: 20,
                            padding: '3px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            background: service.enabled ? T.green + '18' : T.border,
                            color: service.enabled ? T.green : T.muted,
                          }}>
                            {service.enabled ? 'Ativo' : 'Inativo'}
                          </span>
                          {service.unit && (
                            <span style={{
                              borderRadius: 20,
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 600,
                              background: T.chip,
                              color: T.brand,
                            }}>
                              {service.unit}
                            </span>
                          )}
                          {service.modality && service.modality !== 'presencial' && (
                            <span style={{
                              borderRadius: 20,
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 600,
                              background: service.modality === 'online' ? '#3B82F618' : '#8B5CF618',
                              color: service.modality === 'online' ? '#3B82F6' : '#8B5CF6',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                            }}>
                              {service.modality === 'online' ? <Video className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                              {service.modality === 'online' ? 'Online' : 'Híbrido'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-lg font-bold" style={{ color: T.green }}>
                          {formatCurrency(service.selling_price?.cents / 100 || 0)}
                        </p>
                      </div>
                    </div>

                    {service.description && (
                      <div className="mb-3 pt-3" style={{ borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.muted }}>
                        <p className="whitespace-pre-line break-words">{service.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-3" style={{ borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.muted }}>
                      {service.cost_price?.cents > 0 && (
                        <div>
                          <span className="font-medium">Custo:</span>{' '}
                          {formatCurrency(service.cost_price.cents / 100)}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Venda:</span>{' '}
                        {formatCurrency(service.selling_price?.cents / 100 || 0)}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${T.border}` }} onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(service)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deleteLoadingId === service.id}
                        onClick={() => handleRequestDelete(service)}
                      >
                        {deleteLoadingId === service.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" style={{ color: T.red }} />
                        ) : (
                          <Trash2 className="w-4 h-4" style={{ color: T.red }} />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

              {/* Desktop: Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Preço de Custo</TableHead>
                      <TableHead>Preço de Venda</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow
                        key={service.id}
                        data-clickable="true"
                        onClick={() => handleOpenDialog(service)}
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
                              {(service.name?.[0] || 'S').toUpperCase()}
                            </div>
                            <span className="font-medium" style={{ color: T.text }}>{service.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span style={{ fontSize: 12, color: T.muted }}>
                            {service.description || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {!service.modality || service.modality === 'presencial' ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.muted }}>
                              <MapPin className="w-3.5 h-3.5" /> Presencial
                            </span>
                          ) : service.modality === 'online' ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#3B82F6' }}>
                              <Video className="w-3.5 h-3.5" /> Online
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#8B5CF6' }}>
                              <Layers className="w-3.5 h-3.5" /> Híbrido
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span style={{ fontSize: 12, color: T.text }}>
                            {formatCurrency(service.cost_price?.cents / 100 || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" style={{ color: T.green }} />
                            <span className="font-semibold" style={{ color: T.green }}>
                              {formatCurrency(service.selling_price?.cents / 100 || 0)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span style={{
                            borderRadius: 20,
                            padding: '3px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            background: service.enabled ? T.green + '18' : T.border,
                            color: service.enabled ? T.green : T.muted,
                          }}>
                            {service.enabled ? 'Ativo' : 'Inativo'}
                          </span>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
                              onClick={() => handleOpenDialog(service)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                              disabled={deleteLoadingId === service.id}
                              onClick={() => handleRequestDelete(service)}
                            >
                              {deleteLoadingId === service.id ? (
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
      </FluidSection>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="service-dialog" className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </DialogTitle>
              <DialogDescription>
                {editingService
                  ? 'Atualize as informações do serviço'
                  : 'Preencha os dados para cadastrar um novo serviço'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome do Serviço *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Corte de Cabelo"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada do serviço"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4 pt-5 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Modalidade</p>
              <div className="space-y-1.5">
                <Label htmlFor="modality">Tipo de atendimento</Label>
                <Select
                  value={formData.modality}
                  onValueChange={(val) => setFormData({ ...formData, modality: val, meeting_url: val === 'presencial' ? '' : formData.meeting_url })}
                >
                  <SelectTrigger id="modality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">
                      <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Presencial</span>
                    </SelectItem>
                    <SelectItem value="online">
                      <span className="flex items-center gap-2"><Video className="w-4 h-4" /> Online</span>
                    </SelectItem>
                    <SelectItem value="hybrid">
                      <span className="flex items-center gap-2"><Layers className="w-4 h-4" /> Híbrido (presencial + online)</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(formData.modality === 'online' || formData.modality === 'hybrid') && (
                <div className="space-y-1.5">
                  <Label htmlFor="meeting_url">Link da videochamada</Label>
                  <Input
                    id="meeting_url"
                    type="url"
                    value={formData.meeting_url}
                    onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                    placeholder="https://meet.google.com/xxx ou https://zoom.us/j/xxx"
                  />
                  <p className="text-[11px]" style={{ color: T.muted }}>
                    Google Meet, Zoom, Teams — qualquer link de videochamada
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-5 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Precificação</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cost_price_cents">Preço de Custo (R$)</Label>
                  <Input
                    id="cost_price_cents"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_price_cents}
                    onChange={(e) => setFormData({ ...formData, cost_price_cents: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="selling_price_cents">Preço de Venda (R$) *</Label>
                  <Input
                    id="selling_price_cents"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.selling_price_cents}
                    onChange={(e) => setFormData({ ...formData, selling_price_cents: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit">Unidade</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Ex: unidade, hora, sessão"
                />
              </div>
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
                  editingService ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open)
          if (!open) {
            setServiceToDelete(null)
          }
        }}
      >
        <DialogContent data-testid="delete-service-dialog">
          <DialogHeader>
            <DialogTitle>Excluir serviço</DialogTitle>
            <DialogDescription>
              Essa ação remove o serviço da listagem. Confirme para continuar.
            </DialogDescription>
          </DialogHeader>

          {serviceToDelete && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg" style={{ background: T.amber + '18', border: `1px solid ${T.amber}40`, color: T.amber }}>
                <p className="font-semibold">{serviceToDelete.name}</p>
                {serviceToDelete.description && (
                  <p className="mt-1 line-clamp-3" style={{ fontSize: 12 }}>
                    {serviceToDelete.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm" style={{ color: T.muted }}>
                <span>Preço de venda</span>
                <span className="font-semibold" style={{ color: T.text }}>
                  {formatCurrency(serviceToDelete.selling_price?.cents / 100 || 0)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete} disabled={deleteLoadingId !== null}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={!serviceToDelete || deleteLoadingId === serviceToDelete?.id}
            >
              {deleteLoadingId === serviceToDelete?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Confirmar exclusão'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
