import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FluidSection } from '@/components/design'
import { useIsMobile } from '@/hooks/use-mobile'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Link2,
  Plus,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  Scissors,
} from 'lucide-react'
import { apiService } from '../lib/api'

export function AppointmentLinks() {
  const isMobile = useIsMobile()
  const [links, setLinks] = useState([])
  const [services, setServices] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isNewLinkOpen, setIsNewLinkOpen] = useState(false)
  const [isEditLinkOpen, setIsEditLinkOpen] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const [copiedLink, setCopiedLink] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
    service_id: null,
    account_user_id: null,
    link_type: 'normal', // 'normal' ou 'premium'
    settings: {
      start_hour: 9,
      end_hour: 18,
      slot_interval_minutes: 30,
      default_duration_minutes: 60,
      days_ahead: 15 // Padrão para link normal
    }
  })
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [linksData, servicesData, professionalsData] = await Promise.all([
        apiService.getAppointmentLinks(),
        apiService.getAppointmentServices(),
        apiService.getProfessionals()
      ])
      
      // Garantir que os dados sejam arrays
      const linksArray = Array.isArray(linksData) ? linksData : (linksData?.links || linksData?.data || [])
      const servicesArray = Array.isArray(servicesData) 
        ? servicesData 
        : (servicesData?.services || servicesData?.data || [])
      const professionalsArray = Array.isArray(professionalsData) 
        ? professionalsData 
        : (professionalsData?.professionals || professionalsData?.data || [])
      
      setLinks(linksArray)
      setServices(servicesArray)
      setProfessionals(professionalsArray)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      active: true,
      service_id: null,
      account_user_id: null,
      link_type: 'normal',
      settings: {
        start_hour: 9,
        end_hour: 18,
        slot_interval_minutes: 30,
        default_duration_minutes: 60,
        days_ahead: 15
      }
    })
    setEditingLink(null)
  }
  
  const handleCreate = async () => {
    if (!formData.name || !formData.name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const linkData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        active: formData.active !== false,
        service_id: formData.service_id || null,
        account_user_id: formData.account_user_id || null,
        link_type: formData.link_type || 'normal',
        settings: {
          ...(formData.settings || {
            start_hour: 9,
            end_hour: 18,
            slot_interval_minutes: 30,
            default_duration_minutes: 60
          }),
          days_ahead: formData.settings?.days_ahead || (formData.link_type === 'premium' ? 30 : 15)
        }
      }
      
      await apiService.createAppointmentLink(linkData)
      await loadData()
      setIsNewLinkOpen(false)
      resetForm()
    } catch (err) {
      console.error('Error creating link:', err)
      const errorMessage = err.message || err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Erro ao criar link'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  const handleEdit = (link) => {
    setEditingLink(link)
    const settings = link.settings || {}
    const linkType = link.link_type || (settings.days_ahead >= 30 ? 'premium' : 'normal')
    
    setFormData({
      name: link.name || '',
      description: link.description || '',
      active: link.active !== false,
      service_id: link.service?.id || link.service_id || null,
      account_user_id: link.professional?.id || link.account_user_id || null,
      link_type: linkType,
      settings: {
        start_hour: settings.start_hour || 9,
        end_hour: settings.end_hour || 18,
        slot_interval_minutes: settings.slot_interval_minutes || 30,
        default_duration_minutes: settings.default_duration_minutes || 60,
        days_ahead: settings.days_ahead || (linkType === 'premium' ? 30 : 15)
      }
    })
    setIsEditLinkOpen(true)
  }
  
  const handleUpdate = async () => {
    if (!formData.name || !formData.name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    
    if (!editingLink) {
      setError('Link não encontrado para edição')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const linkData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        active: formData.active !== false,
        service_id: formData.service_id || null,
        account_user_id: formData.account_user_id || null,
        link_type: formData.link_type || 'normal',
        settings: {
          ...(formData.settings || {}),
          days_ahead: formData.settings?.days_ahead || (formData.link_type === 'premium' ? 30 : 15)
        }
      }
      
      await apiService.updateAppointmentLink(editingLink.id, linkData)
      await loadData()
      setIsEditLinkOpen(false)
      resetForm()
    } catch (err) {
      console.error('Error updating link:', err)
      const errorMessage = err.message || err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Erro ao atualizar link'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async (id) => {
    try {
      setLoading(true)
      setError(null)
      await apiService.deleteAppointmentLink(id)
      await loadData()
    } catch (err) {
      console.error('Error deleting link:', err)
      const errorMessage = err.message || err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Erro ao excluir link'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCopyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(url)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (err) {
      console.error('Error copying link:', err)
    }
  }
  
  const handleOpenLink = (url) => {
    window.open(url, '_blank')
  }
  
  if (loading && links.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
                Links de Agendamento
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Crie e gerencie links públicos para agendamento online
            </p>
          </div>
        <Dialog open={isNewLinkOpen} onOpenChange={(open) => {
          setIsNewLinkOpen(open)
          if (!open) {
            resetForm()
            setError(null)
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm()
                setIsNewLinkOpen(true)
              }}
              className="bg-gradient-to-r from-[#5B7A9E] to-[#6B8FA3] hover:from-[#4A5C7A] hover:to-[#5B7A9E] text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Link de Agendamento</DialogTitle>
              <DialogDescription>
                Crie um link personalizado (como Calendly) que você pode enviar para seus clientes. 
                Eles acessarão uma página onde poderão escolher serviço, profissional, data e horário.
              </DialogDescription>
            </DialogHeader>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Link *</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Um nome para identificar este link (apenas para você, não aparece para o cliente)
                </p>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Link para Corte de Cabelo"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Descrição interna para você lembrar o propósito deste link
                </p>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Link para enviar no Instagram"
                  rows={2}
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">O que o cliente verá?</h4>
                <p className="text-sm text-blue-800">
                  Quando o cliente acessar o link, ele verá uma página onde pode:
                </p>
                <ul className="text-sm text-blue-800 mt-2 list-disc list-inside space-y-1">
                  <li>Escolher um serviço (se você não limitar abaixo)</li>
                  <li>Escolher um profissional (se você não limitar abaixo)</li>
                  <li>Selecionar data e horário disponível</li>
                  <li>Preencher seus dados (nome, WhatsApp, email)</li>
                </ul>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Filtros (Opcional)</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Limite quais serviços e profissionais aparecerão para o cliente. 
                  Se deixar "Todos", o cliente poderá escolher qualquer opção.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="service">Limitar a um serviço específico?</Label>
                    <Select
                      value={formData.service_id?.toString() || '__none__'}
                      onValueChange={(value) => setFormData({ ...formData, service_id: value === '__none__' ? null : parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os serviços" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="__none__">Todos os serviços (cliente escolhe)</SelectItem>
                        {services && services.length > 0 ? (
                          services.map((service) => (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {service.name || `Serviço ${service.id}`}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-gray-500">Nenhum serviço disponível</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="professional">Limitar a um profissional específico?</Label>
                    <Select
                      value={formData.account_user_id?.toString() || '__none__'}
                      onValueChange={(value) => setFormData({ ...formData, account_user_id: value === '__none__' ? null : parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os profissionais" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Todos os profissionais (cliente escolhe)</SelectItem>
                        {professionals && professionals.length > 0 ? (
                          professionals.map((prof) => (
                            <SelectItem key={prof.id} value={prof.id.toString()}>
                              {prof.name || `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || `Profissional ${prof.id}`}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-gray-500">Nenhum profissional disponível</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Horários Disponíveis</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Configure quais horários aparecerão para o cliente escolher. 
                  Estes são os horários padrão - horários já ocupados não aparecerão automaticamente.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_hour">Horário de início do atendimento</Label>
                    <p className="text-xs text-gray-500 mb-1">Ex: 9 = 09:00</p>
                    <Input
                      id="start_hour"
                      type="number"
                      min="0"
                      max="23"
                      value={formData.settings.start_hour}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, start_hour: parseInt(e.target.value) || 9 }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="end_hour">Horário de término do atendimento</Label>
                    <p className="text-xs text-gray-500 mb-1">Ex: 18 = 18:00</p>
                    <Input
                      id="end_hour"
                      type="number"
                      min="0"
                      max="23"
                      value={formData.settings.end_hour}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, end_hour: parseInt(e.target.value) || 18 }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="interval">Intervalo entre horários</Label>
                    <p className="text-xs text-gray-500 mb-1">De quanto em quanto tempo aparecerão opções (15, 30, 45 ou 60 min)</p>
                    <Input
                      id="interval"
                      type="number"
                      min="15"
                      max="60"
                      step="15"
                      value={formData.settings.slot_interval_minutes}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, slot_interval_minutes: parseInt(e.target.value) || 30 }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Duração padrão do agendamento</Label>
                    <p className="text-xs text-gray-500 mb-1">Quanto tempo dura cada agendamento (em minutos)</p>
                    <Input
                      id="duration"
                      type="number"
                      min="15"
                      max="240"
                      step="15"
                      value={formData.settings.default_duration_minutes}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, default_duration_minutes: parseInt(e.target.value) || 60 }
                      })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Configuração de Calendário</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Configure quantos dias à frente os clientes poderão agendar. Links Premium permitem mais dias.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="link_type">Tipo de Link</Label>
                    <p className="text-xs text-gray-500 mb-1">Normal: até 15 dias | Premium: até 30 dias (configurável)</p>
                    <Select
                      value={formData.link_type || 'normal'}
                      onValueChange={(value) => {
                        const defaultDays = value === 'premium' ? 30 : 15
                        setFormData({
                          ...formData,
                          link_type: value,
                          settings: {
                            ...formData.settings,
                            days_ahead: formData.settings?.days_ahead || defaultDays
                          }
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal (15 dias)</SelectItem>
                        <SelectItem value="premium">Premium (30 dias configurável)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="days_ahead">Dias à frente para agendamento</Label>
                    <p className="text-xs text-gray-500 mb-1">
                      Quantos dias no futuro o calendário mostrará (máx: {formData.link_type === 'premium' ? '90' : '15'})
                    </p>
                    <Input
                      id="days_ahead"
                      type="number"
                      min="1"
                      max={formData.link_type === 'premium' ? 90 : 15}
                      value={formData.settings?.days_ahead || (formData.link_type === 'premium' ? 30 : 15)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || (formData.link_type === 'premium' ? 30 : 15)
                        const maxDays = formData.link_type === 'premium' ? 90 : 15
                        const daysAhead = Math.min(Math.max(1, value), maxDays)
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            days_ahead: daysAhead
                          }
                        })
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="active" className="cursor-pointer">
                  <span className="font-medium">Link ativo</span>
                  <span className="text-sm text-gray-600 ml-2">
                    (Se desativado, o link não funcionará para novos agendamentos)
                  </span>
                </Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsNewLinkOpen(false)
                resetForm()
                setError(null)
              }}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
                  'Criar Link'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {links.length === 0 ? (
        <FluidSection
          title="Nenhum link criado ainda"
          subtitle="Crie seu primeiro link de agendamento para começar a receber agendamentos online"
          gradient="from-gray-400 to-gray-500"
        >
          <div className="text-center py-8">
            <Link2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <Button 
              onClick={() => setIsNewLinkOpen(true)}
              className="bg-gradient-to-r from-[#5B7A9E] to-[#6B8FA3] hover:from-[#4A5C7A] hover:to-[#5B7A9E] text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Link
            </Button>
          </div>
        </FluidSection>
      ) : (
        <FluidSection
          title={`Links de Agendamento (${links.length})`}
          subtitle="Gerencie seus links públicos de agendamento"
          gradient="from-blue-500 to-indigo-500"
        >
          <>
            {/* Mobile: Cards Layout */}
            <div className="block md:hidden space-y-3">
              {links.map((link) => (
                <div 
                  key={link.id}
                  className="group/item relative"
                >
                  <div className="absolute -inset-0.5 rounded-2xl blur opacity-10 group-hover/item:opacity-20 transition duration-300 bg-gradient-to-r from-blue-500 to-indigo-500" />
                  <div className="relative bg-gradient-to-br from-white/90 to-white/50 dark:from-gray-800/90 dark:to-gray-800/50 backdrop-blur-xl rounded-2xl p-4 border border-white/20 dark:border-gray-700/30 shadow-xl hover:shadow-2xl transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-2">
                          {link.name}
                        </h3>
                        {link.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {link.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={link.active ? 'default' : 'secondary'} className="text-xs">
                            {link.active ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inativo
                              </>
                            )}
                          </Badge>
                          {link.service && (
                            <Badge variant="outline" className="text-xs">
                              <Scissors className="h-3 w-3 mr-1" />
                              {link.service.name}
                            </Badge>
                          )}
                          {link.professional && (
                            <Badge variant="outline" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              {link.professional.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {link.public_url && (
                      <div className="flex items-center gap-2 pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(link.public_url)}
                          className="text-xs flex-1"
                        >
                          {copiedLink === link.public_url ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copiar Link
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenLink(link.public_url)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(link)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Link?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o link "{link.name}"?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(link.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Link Público</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{link.name}</div>
                          {link.description && (
                            <div className="text-sm text-gray-500">{link.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={link.active ? 'default' : 'secondary'}>
                          {link.active ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inativo
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {link.service ? (
                          <div className="flex items-center">
                            <Scissors className="h-4 w-4 mr-2 text-gray-400" />
                            {link.service.name}
                          </div>
                        ) : (
                          <span className="text-gray-400">Todos</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {link.professional ? (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            {link.professional.name}
                          </div>
                        ) : (
                          <span className="text-gray-400">Todos</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {link.public_url ? (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(link.public_url)}
                              className="text-xs"
                            >
                              {copiedLink === link.public_url ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Copiado!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copiar
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenLink(link.public_url)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Gerando...</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(link)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Link?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o link "{link.name}"?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(link.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        </FluidSection>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={isEditLinkOpen} onOpenChange={(open) => {
        setIsEditLinkOpen(open)
        if (!open) {
          resetForm()
          setError(null)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Link de Agendamento</DialogTitle>
            <DialogDescription>
              Atualize as configurações do link. O link continuará funcionando com as novas configurações.
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome do Link *</Label>
              <p className="text-sm text-gray-500 mb-2">
                Um nome para identificar este link (apenas para você, não aparece para o cliente)
              </p>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Link para Corte de Cabelo"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Descrição (Opcional)</Label>
              <p className="text-sm text-gray-500 mb-2">
                Descrição interna para você lembrar o propósito deste link
              </p>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Link para enviar no Instagram"
                rows={2}
              />
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Filtros (Opcional)</h4>
              <p className="text-sm text-gray-600 mb-4">
                Limite quais serviços e profissionais aparecerão para o cliente. 
                Se deixar "Todos", o cliente poderá escolher qualquer opção.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-service">Limitar a um serviço específico?</Label>
                  <Select
                    value={formData.service_id?.toString() || '__none__'}
                    onValueChange={(value) => setFormData({ ...formData, service_id: value === '__none__' ? null : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os serviços" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="__none__">Todos os serviços (cliente escolhe)</SelectItem>
                      {services && services.length > 0 ? (
                        services.map((service) => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {service.name || `Serviço ${service.id}`}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-gray-500">Nenhum serviço disponível</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-professional">Limitar a um profissional específico?</Label>
                  <Select
                    value={formData.account_user_id?.toString() || '__none__'}
                    onValueChange={(value) => setFormData({ ...formData, account_user_id: value === '__none__' ? null : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os profissionais" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Todos os profissionais (cliente escolhe)</SelectItem>
                      {professionals && professionals.length > 0 ? (
                        professionals.map((prof) => (
                          <SelectItem key={prof.id} value={prof.id.toString()}>
                            {prof.name || `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || `Profissional ${prof.id}`}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-gray-500">Nenhum profissional disponível</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Horários Disponíveis</h4>
              <p className="text-sm text-gray-600 mb-4">
                Configure quais horários aparecerão para o cliente escolher. 
                Estes são os horários padrão - horários já ocupados não aparecerão automaticamente.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start_hour">Horário de início do atendimento</Label>
                  <p className="text-xs text-gray-500 mb-1">Ex: 9 = 09:00</p>
                  <Input
                    id="edit-start_hour"
                    type="number"
                    min="0"
                    max="23"
                    value={formData.settings.start_hour}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, start_hour: parseInt(e.target.value) || 9 }
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-end_hour">Horário de término do atendimento</Label>
                  <p className="text-xs text-gray-500 mb-1">Ex: 18 = 18:00</p>
                  <Input
                    id="edit-end_hour"
                    type="number"
                    min="0"
                    max="23"
                    value={formData.settings.end_hour}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, end_hour: parseInt(e.target.value) || 18 }
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-interval">Intervalo entre horários</Label>
                  <p className="text-xs text-gray-500 mb-1">De quanto em quanto tempo aparecerão opções (15, 30, 45 ou 60 min)</p>
                  <Input
                    id="edit-interval"
                    type="number"
                    min="15"
                    max="60"
                    step="15"
                    value={formData.settings.slot_interval_minutes}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, slot_interval_minutes: parseInt(e.target.value) || 30 }
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-duration">Duração padrão do agendamento</Label>
                  <p className="text-xs text-gray-500 mb-1">Quanto tempo dura cada agendamento (em minutos)</p>
                  <Input
                    id="edit-duration"
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    value={formData.settings.default_duration_minutes}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, default_duration_minutes: parseInt(e.target.value) || 60 }
                    })}
                  />
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Configuração de Calendário</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Configure quantos dias à frente os clientes poderão agendar. Links Premium permitem mais dias.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-link_type">Tipo de Link</Label>
                    <p className="text-xs text-gray-500 mb-1">Normal: até 15 dias | Premium: até 30 dias (configurável)</p>
                    <Select
                      value={formData.link_type || 'normal'}
                      onValueChange={(value) => {
                        const defaultDays = value === 'premium' ? 30 : 15
                        setFormData({
                          ...formData,
                          link_type: value,
                          settings: {
                            ...formData.settings,
                            days_ahead: formData.settings?.days_ahead || defaultDays
                          }
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal (15 dias)</SelectItem>
                        <SelectItem value="premium">Premium (30 dias configurável)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-days_ahead">Dias à frente para agendamento</Label>
                    <p className="text-xs text-gray-500 mb-1">
                      Quantos dias no futuro o calendário mostrará (máx: {formData.link_type === 'premium' ? '90' : '15'})
                    </p>
                    <Input
                      id="edit-days_ahead"
                      type="number"
                      min="1"
                      max={formData.link_type === 'premium' ? 90 : 15}
                      value={formData.settings?.days_ahead || (formData.link_type === 'premium' ? 30 : 15)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || (formData.link_type === 'premium' ? 30 : 15)
                        const maxDays = formData.link_type === 'premium' ? 90 : 15
                        const daysAhead = Math.min(Math.max(1, value), maxDays)
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            days_ahead: daysAhead
                          }
                        })
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="edit-active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit-active" className="cursor-pointer">
                <span className="font-medium">Link ativo</span>
                <span className="text-sm text-gray-600 ml-2">
                  (Se desativado, o link não funcionará para novos agendamentos)
                </span>
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditLinkOpen(false)
              resetForm()
              setError(null)
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Atualizando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}

