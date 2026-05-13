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
  QrCode,
} from 'lucide-react'
import { apiService } from '../lib/api'
import { T, DISPLAY } from '@/lib/tokens'
import { toast } from 'sonner'

const AUTOMATION_OPTIONS = [
  {
    key: 'reminder_1h',
    label: 'Lembrete 1 hora antes',
    description: '"Seu encontro começa em 1 hora." + link da reunião',
    icon: '⏰',
  },
  {
    key: 'billing_notification',
    label: 'Cobrança pendente',
    description: 'Enviada logo após a confirmação quando o pagamento está pendente',
    icon: '📋',
  },
  {
    key: 'pix_reminder',
    label: 'Lembrete PIX',
    description: 'Lembrete de pagamento via PIX 24h antes do agendamento',
    icon: '💳',
    requiresPix: true,
  },
  {
    key: 'overdue',
    label: 'Atraso no pagamento',
    description: 'Enviada após o atendimento quando o pagamento ainda está pendente',
    icon: '⚠️',
  },
  {
    key: 'payment_confirmation',
    label: 'Confirmação de pagamento',
    description: 'Enviada imediatamente após o pagamento ser confirmado',
    icon: '✅',
  },
]

function AutomacoesPanel({ formData, setAutomation, setFormData }) {
  const automations = formData.settings?.automations || {}
  const anyEnabled = AUTOMATION_OPTIONS.some(o => automations[o.key])
  const needsPix = AUTOMATION_OPTIONS.some(o => o.requiresPix && automations[o.key])

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: T.chip }}>
        <span className="text-base">🤖</span>
        <div className="flex-1">
          <p style={{ fontWeight: 600, fontSize: 14, color: T.brand }}>Automações WhatsApp</p>
          <p style={{ fontSize: 12, color: T.muted }}>
            Mensagens enviadas automaticamente para o cliente via WhatsApp
          </p>
        </div>
        {anyEnabled && (
          <span style={{ fontSize: 11, fontWeight: 600, background: T.brand, color: '#fff', padding: '3px 8px', borderRadius: 20 }}>
            {AUTOMATION_OPTIONS.filter(o => automations[o.key]).length} ativa{AUTOMATION_OPTIONS.filter(o => automations[o.key]).length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div style={{ background: T.white }}>
        {AUTOMATION_OPTIONS.map(option => (
          <label
            key={option.key}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: `1px solid ${T.border}`, transition: 'background 100ms' }}
            onMouseEnter={e => e.currentTarget.style.background = T.bg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <input
              type="checkbox"
              checked={automations[option.key] === true}
              onChange={e => setAutomation(option.key, e.target.checked)}
              style={{ marginTop: 2, accentColor: T.brand, flexShrink: 0 }}
            />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 14, fontWeight: 500, color: T.text }}>
                {option.icon} {option.label}
              </p>
              <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{option.description}</p>
            </div>
          </label>
        ))}

        {(automations.pix_reminder || automations.billing_notification || automations.overdue) && (
          <div style={{ padding: '12px 16px', background: '#FFFBEB' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#92400E', marginBottom: 6 }}>
              🔑 Chave PIX
            </label>
            <input
              type="text"
              placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              value={automations.pix_key || ''}
              onChange={e => setAutomation('pix_key', e.target.value)}
              className="w-full rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p style={{ fontSize: 12, color: '#B45309', marginTop: 4 }}>
              Incluída nas mensagens de cobrança pendente, lembrete PIX e atraso
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function AppointmentLinks() {
  const isMobile = useIsMobile()
  const [links, setLinks] = useState([])
  const [services, setServices] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNewLinkOpen, setIsNewLinkOpen] = useState(false)
  const [isEditLinkOpen, setIsEditLinkOpen] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const [copiedLink, setCopiedLink] = useState(null)
  const [qrCodeLink, setQrCodeLink] = useState(null)
  
  const DEFAULT_AUTOMATIONS = {
    reminder_1h: false,
    billing_notification: false,
    pix_reminder: false,
    overdue: false,
    payment_confirmation: false,
    pix_key: ''
  }

  const [formData, setFormData] = useState({
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
      days_ahead: 15,
      automations: { ...DEFAULT_AUTOMATIONS }
    }
  })

  const setAutomation = (key, value) =>
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        automations: { ...(prev.settings.automations || DEFAULT_AUTOMATIONS), [key]: value }
      }
    }))
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      setLoading(true)
      
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
      toast.error(err.message || 'Erro ao carregar dados')
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
        days_ahead: 15,
        automations: { ...DEFAULT_AUTOMATIONS }
      }
    })
    setEditingLink(null)
  }
  
  const handleCreate = async () => {
    if (!formData.name || !formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      setIsSubmitting(true)
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
      toast.success('Link criado com sucesso!')
      setIsNewLinkOpen(false)
      resetForm()
    } catch (err) {
      const errorMessage = err.message || err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Erro ao criar link'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
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
        days_ahead: settings.days_ahead || (linkType === 'premium' ? 30 : 15),
        cancel_reschedule_hours: settings.cancel_reschedule_hours || 24,
        automations: { ...DEFAULT_AUTOMATIONS, ...(settings.automations || {}) }
      }
    })
    setIsEditLinkOpen(true)
  }
  
  const handleUpdate = async () => {
    if (!formData.name || !formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (!editingLink) {
      toast.error('Link não encontrado para edição')
      return
    }

    try {
      setIsSubmitting(true)
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
      toast.success('Link atualizado com sucesso!')
      setIsEditLinkOpen(false)
      resetForm()
    } catch (err) {
      const errorMessage = err.message || err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Erro ao atualizar link'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDelete = async (id) => {
    try {
      await apiService.deleteAppointmentLink(id)
      await loadData()
      toast.success('Link excluído')
    } catch (err) {
      const errorMessage = err.message || err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Erro ao excluir link'
      toast.error(errorMessage)
    }
  }
  
  const handleCopyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(url)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (err) {
    }
  }
  
  const handleOpenLink = (url) => {
    window.open(url, '_blank')
  }
  
  if (loading && links.length === 0) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
        {[1,2,3].map(i => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }
  
  return (
    <div data-testid="appointment-links-page" style={{ minHeight: '100vh', background: T.bg, ...DISPLAY }}>
      <div className="relative z-10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1" style={{ color: T.text }}>
              Links de Agendamento
            </h1>
            <p style={{ fontSize: 14, color: T.muted }}>
              Crie e gerencie links públicos para agendamento online
            </p>
          </div>
        <Dialog open={isNewLinkOpen} onOpenChange={(open) => {
          setIsNewLinkOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button
              data-testid="new-link-btn"
              onClick={() => {
                resetForm()
                setIsNewLinkOpen(true)
              }}
              style={{ background: T.brand, color: '#fff', border: 'none', borderRadius: 8 }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Link
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="appointment-link-dialog" className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Link de Agendamento</DialogTitle>
              <DialogDescription>
                Crie um link personalizado (como Calendly) que você pode enviar para seus clientes. 
                Eles acessarão uma página onde poderão escolher serviço, profissional, data e horário.
              </DialogDescription>
            </DialogHeader>
            
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
              
              <div style={{ background: T.chip, border: `1px solid ${T.brand}22`, borderRadius: 8, padding: 16 }}>
                <h4 style={{ fontWeight: 600, color: T.brand, marginBottom: 8 }}>O que o cliente verá?</h4>
                <p style={{ fontSize: 14, color: T.text }}>
                  Quando o cliente acessar o link, ele verá uma página onde pode:
                </p>
                <ul style={{ fontSize: 14, color: T.text, marginTop: 8 }} className="list-disc list-inside space-y-1">
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
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Cancelamento e Reagendamento</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Defina até quantas horas antes do agendamento o cliente pode cancelar ou reagendar pelo link de gerenciamento enviado por WhatsApp e e-mail.
                </p>
                <div>
                  <Label htmlFor="cancel_reschedule_hours">Prazo para cancelar/reagendar (horas antes)</Label>
                  <p className="text-xs text-gray-500 mb-1">Ex: 24 = o cliente pode cancelar até 24h antes do horário</p>
                  <Input
                    id="cancel_reschedule_hours"
                    type="number"
                    min="1"
                    max="720"
                    value={formData.settings?.cancel_reschedule_hours ?? 24}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, cancel_reschedule_hours: parseInt(e.target.value) || 24 }
                    })}
                    className="max-w-[160px]"
                  />
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

            {/* Automações */}
            <AutomacoesPanel formData={formData} setAutomation={setAutomation} setFormData={setFormData} />

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsNewLinkOpen(false)
                resetForm()
              }}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? (
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
              style={{ background: T.brand, color: '#fff', border: 'none', borderRadius: 8 }}
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
                  style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, transition: 'background 100ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = T.white}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>
                          {link.name}
                        </h3>
                        {link.description && (
                          <p style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>
                            {link.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <span style={{ borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600, background: link.active ? T.green + '18' : T.muted + '18', color: link.active ? T.green : T.muted, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {link.active ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                            {link.active ? 'Ativo' : 'Inativo'}
                          </span>
                          {link.service && (
                            <span style={{ borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600, background: T.chip, color: T.brand, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Scissors size={10} />
                              {link.service.name}
                            </span>
                          )}
                          {link.professional && (
                            <span style={{ borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600, background: T.light, color: T.muted, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <User size={10} />
                              {link.professional.name}
                            </span>
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
                          style={{ color: T.brand }}
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
                      {link.public_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQrCodeLink(link)}
                          title="Ver QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      )}
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
                    <TableRow key={link.id} style={{ transition: 'background 100ms' }}
                      onMouseEnter={e => e.currentTarget.style.background = T.bg}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{link.name}</div>
                          {link.description && (
                            <div style={{ fontSize: 12, color: T.muted }}>{link.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span style={{ borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600, background: link.active ? T.green + '18' : T.muted + '18', color: link.active ? T.green : T.muted, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {link.active ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          {link.active ? 'Ativo' : 'Inativo'}
                        </span>
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
                              style={{ color: T.brand }}
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
                          {link.public_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setQrCodeLink(link)}
                              title="Ver QR Code"
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          )}
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
        if (!open) resetForm()
      }}>
        <DialogContent data-testid="edit-link-dialog" className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Link de Agendamento</DialogTitle>
            <DialogDescription>
              Atualize as configurações do link. O link continuará funcionando com as novas configurações.
            </DialogDescription>
          </DialogHeader>
          
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
            
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Cancelamento e Reagendamento</h4>
              <p className="text-sm text-gray-600 mb-4">
                Defina até quantas horas antes do agendamento o cliente pode cancelar ou reagendar pelo link de gerenciamento.
              </p>
              <div>
                <Label htmlFor="edit-cancel-hours">Prazo para cancelar/reagendar (horas antes)</Label>
                <p className="text-xs text-gray-500 mb-1">Ex: 24 = o cliente pode cancelar até 24h antes do horário</p>
                <Input
                  id="edit-cancel-hours"
                  type="number"
                  min="1"
                  max="720"
                  value={formData.settings?.cancel_reschedule_hours ?? 24}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, cancel_reschedule_hours: parseInt(e.target.value) || 24 }
                  })}
                  className="max-w-[160px]"
                />
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

          {/* Automações */}
          <AutomacoesPanel formData={formData} setAutomation={setAutomation} setFormData={setFormData} />

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditLinkOpen(false)
              resetForm()
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? (
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

      {/* QR Code Dialog */}
      <Dialog open={!!qrCodeLink} onOpenChange={(open) => { if (!open) setQrCodeLink(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code do Link
            </DialogTitle>
            <DialogDescription>
              {qrCodeLink?.name} — Escaneie para agendar
            </DialogDescription>
          </DialogHeader>
          {qrCodeLink?.public_url && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="p-3 bg-white rounded-xl border shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeLink.public_url)}&size=220x220&margin=10`}
                  alt="QR Code do link de agendamento"
                  width={220}
                  height={220}
                  className="block"
                />
              </div>
              <p className="text-xs text-gray-500 text-center break-all max-w-[260px]">
                {qrCodeLink.public_url}
              </p>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1 text-sm"
                  onClick={() => handleCopyLink(qrCodeLink.public_url)}
                >
                  {copiedLink === qrCodeLink.public_url ? (
                    <><CheckCircle2 className="h-4 w-4 mr-1" /> Copiado!</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-1" /> Copiar Link</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-sm"
                  onClick={() => {
                    const imgUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeLink.public_url)}&size=400x400&margin=10`
                    const a = document.createElement('a')
                    a.href = imgUrl
                    a.download = `qrcode-${qrCodeLink.name.replace(/\s+/g, '-')}.png`
                    a.target = '_blank'
                    a.click()
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-1" /> Baixar QR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}

