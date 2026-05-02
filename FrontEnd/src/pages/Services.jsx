import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DollarSign
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useIsMobile } from '@/hooks/use-mobile'
import { FluidSection } from '@/components/design'

export function Services() {
  const isMobile = useIsMobile()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: '',
    cost_price_cents: '',
    selling_price_cents: '',
    currency: 'BRL'
  })

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getServices()
      setServices(Array.isArray(response) ? response : [])
    } catch (err) {
      console.error('Error loading services:', err)
      setError('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (service = null) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name || '',
        description: service.description || '',
        unit: service.unit || '',
        cost_price_cents: service.cost_price?.cents ? (service.cost_price.cents / 100).toFixed(2) : '',
        selling_price_cents: service.selling_price?.cents ? (service.selling_price.cents / 100).toFixed(2) : '',
        currency: service.selling_price?.currency || 'BRL'
      })
    } else {
      setEditingService(null)
      setFormData({
        name: '',
        description: '',
        unit: '',
        cost_price_cents: '',
        selling_price_cents: '',
        currency: 'BRL'
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingService(null)
    setFormData({
      name: '',
      description: '',
      unit: '',
      cost_price_cents: '',
      selling_price_cents: '',
      currency: 'BRL'
    })
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)

      const serviceData = {
        ...formData,
        cost_price_cents: formData.cost_price_cents ? Math.round(parseFloat(formData.cost_price_cents) * 100) : 0,
        selling_price_cents: formData.selling_price_cents ? Math.round(parseFloat(formData.selling_price_cents) * 100) : 0
      }

      if (editingService) {
        await apiService.updateService(editingService.id, serviceData)
      } else {
        await apiService.createService(serviceData)
      }

      handleCloseDialog()
      loadServices()
    } catch (err) {
      console.error('Error saving service:', err)
      setError(err.message || 'Erro ao salvar serviço')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestDelete = (service) => {
    setFeedback(null)
    setServiceToDelete(service)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return

    try {
      setDeleteLoadingId(serviceToDelete.id)
      setError(null)
      setFeedback(null)
      await apiService.deleteService(serviceToDelete.id)
      setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id))
      setFeedback({ type: 'success', message: `Serviço "${serviceToDelete.name}" excluído com sucesso.` })
      setIsDeleteDialogOpen(false)
      setServiceToDelete(null)
    } catch (err) {
      console.error('Error deleting service:', err)
      setFeedback({ type: 'error', message: err.message || 'Erro ao excluir serviço' })
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

  if (loading && services.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
          <p className="text-gray-600">Carregando serviços...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="relative z-10 space-y-6 md:space-y-8 p-4 md:p-6">
        {/* Header - Bold Typography */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-2 responsive-text-xl">
              <span className="bg-gradient-to-r from-[#5B7A9E] via-[#6B8FA3] to-[#7A9D96] bg-clip-text text-transparent">
                Serviços
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Gerencie os serviços que você oferece
            </p>
          </div>
          <Button 
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-[#5B7A9E] to-[#6B8FA3] hover:from-[#4A5C7A] hover:to-[#5B7A9E] text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Serviço
          </Button>
        </div>

        {/* Search - Modern Style */}
        <FluidSection
          title="Buscar Serviços"
          subtitle="Encontre serviços por nome ou descrição"
          gradient="from-green-500 to-emerald-500"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
            />
          </div>
        </FluidSection>

      {/* Feedback Messages */}
      {(error || feedback) && (
        <div
          className={
            feedback?.type === 'success'
              ? 'p-4 bg-green-50 border border-green-200 rounded-lg text-green-800'
              : 'p-4 bg-red-50 border border-red-200 rounded-lg text-red-800'
          }
        >
          {feedback?.message || error}
        </div>
      )}

      {/* Services List - Modern Style */}
      <FluidSection
        title="Lista de Serviços"
        subtitle={`${filteredServices.length} serviço${filteredServices.length !== 1 ? 's' : ''} encontrado${filteredServices.length !== 1 ? 's' : ''}`}
        gradient="from-[#D4A574] to-[#C89B6C]"
      >
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Scissors className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum serviço encontrado</p>
          </div>
        ) : (
          <>
            {/* Mobile: Cards Layout */}
            <div className="block md:hidden space-y-3">
              {filteredServices.map((service) => (
                <div 
                  key={service.id}
                  className="group/item relative"
                >
                  <div className="absolute -inset-0.5 rounded-2xl blur opacity-10 group-hover/item:opacity-20 transition duration-300 bg-gradient-to-r from-[#D4A574] to-[#C89B6C]" />
                  <div 
                    className="relative bg-gradient-to-br from-white/90 to-white/50 dark:from-gray-800/90 dark:to-gray-800/50 backdrop-blur-xl rounded-2xl p-4 border border-white/20 dark:border-gray-700/30 shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer"
                    onClick={() => handleOpenDialog(service)}
                  >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 whitespace-pre-line break-words">
                            {service.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant={service.enabled ? 'default' : 'secondary'} className="text-xs">
                              {service.enabled ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {service.unit && (
                              <Badge variant="outline" className="text-xs">
                                {service.unit}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(service.selling_price?.cents / 100 || 0)}
                          </p>
                        </div>
                      </div>
                      
                      {service.description && (
                        <div className="text-sm text-gray-600 mb-3 pt-3 border-t">
                          <p className="whitespace-pre-line break-words">{service.description}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-3 border-t">
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

                      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
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
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-500" />
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
                      <TableHead>Preço de Custo</TableHead>
                      <TableHead>Preço de Venda</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Scissors className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{service.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {service.description || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatCurrency(service.cost_price?.cents / 100 || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="font-semibold text-green-600">
                              {formatCurrency(service.selling_price?.cents / 100 || 0)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={service.enabled ? 'default' : 'secondary'}>
                            {service.enabled ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(service)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deleteLoadingId === service.id}
                              onClick={() => handleRequestDelete(service)}
                            >
                              {deleteLoadingId === service.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                              ) : (
                                <Trash2 className="w-4 h-4 text-red-500" />
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
        <DialogContent className="sm:max-w-[600px]">
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
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Serviço *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Corte de Cabelo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada do serviço"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
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
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Ex: unidade, hora, sessão"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir serviço</DialogTitle>
            <DialogDescription>
              Essa ação remove o serviço da listagem. Confirme para continuar.
            </DialogDescription>
          </DialogHeader>

          {serviceToDelete && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-orange-50 text-orange-800 border border-orange-200">
                <p className="font-semibold">{serviceToDelete.name}</p>
                {serviceToDelete.description && (
                  <p className="text-sm mt-1 text-orange-700 line-clamp-3">
                    {serviceToDelete.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Preço de venda</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
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

