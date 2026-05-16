import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  QrCode,
  ChevronDown,
  MoreHorizontal,
  Code2,
  Clock,
  Scissors,
  User,
  CalendarDays,
  ClipboardList,
} from 'lucide-react'
import { apiService } from '../lib/api'
import { T, DISPLAY } from '@/lib/tokens'
import { toast } from 'sonner'

// ─── Constants ───────────────────────────────────────────────────────────────

const LINK_COLORS = [
  '#0069FF', '#00A2AD', '#8247F5', '#F08C00',
  '#C2255C', '#00A87E', '#E03131', '#1971C2',
]

const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 6) // 6h–22h

const DURATION_OPTIONS = [
  { value: 15,  label: '15 minutos' },
  { value: 30,  label: '30 minutos' },
  { value: 45,  label: '45 minutos' },
  { value: 60,  label: '1 hora' },
  { value: 90,  label: '1h 30min' },
  { value: 120, label: '2 horas' },
]

const INTERVAL_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
]

const DAYS_OPTIONS = [
  { value: 7,  label: '7 dias' },
  { value: 14, label: '14 dias' },
  { value: 21, label: '21 dias' },
  { value: 30, label: '30 dias' },
  { value: 45, label: '45 dias' },
  { value: 60, label: '60 dias' },
  { value: 90, label: '90 dias' },
]

const AUTOMATION_OPTIONS = [
  {
    key: 'reminder_24h',
    label: 'Lembrete 24 horas antes',
    description: '"Seu agendamento é amanhã." + link para gerenciar',
    icon: '📅',
  },
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

// ─── IntakeFormPanel ──────────────────────────────────────────────────────────

function IntakeFormPanel({ formData, setFormData }) {
  const intakeForm = formData.settings?.intake_form || []
  const [open, setOpen] = useState(intakeForm.length > 0)

  const setIntakeForm = (updater) =>
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        intake_form: typeof updater === 'function' ? updater(prev.settings?.intake_form || []) : updater,
      },
    }))

  const addQuestion = () =>
    setIntakeForm(prev => [...prev, { id: Date.now().toString(), question: '', type: 'text', required: false, options: [] }])

  const updateQuestion = (id, updates) =>
    setIntakeForm(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q))

  const removeQuestion = (id) =>
    setIntakeForm(prev => prev.filter(q => q.id !== id))

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: T.chip, cursor: 'pointer', border: 'none', fontFamily: 'inherit', textAlign: 'left' }}
      >
        <span>📋</span>
        <div className="flex-1">
          <p style={{ fontWeight: 600, fontSize: 14, color: T.brand, margin: 0 }}>Perguntas pré-agendamento</p>
          <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Colete informações do cliente antes de confirmar</p>
        </div>
        {intakeForm.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, background: T.brand, color: '#fff', padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>
            {intakeForm.length} pergunta{intakeForm.length !== 1 ? 's' : ''}
          </span>
        )}
        <ChevronDown size={16} style={{ color: T.muted, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }} />
      </button>

      {open && (
        <div style={{ background: T.white, padding: 16 }}>
          <div className="space-y-3">
            {intakeForm.map((q, idx) => (
              <div key={q.id} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, background: T.bg }}>
                <div className="flex items-start gap-2">
                  <span style={{ fontSize: 12, color: T.muted, fontWeight: 600, minWidth: 20, paddingTop: 8 }}>{idx + 1}.</span>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Texto da pergunta"
                      value={q.question}
                      onChange={e => updateQuestion(q.id, { question: e.target.value })}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <Select
                        value={q.type}
                        onValueChange={type => updateQuestion(q.id, { type, options: type === 'select' ? (q.options?.length ? q.options : ['']) : [] })}
                      >
                        <SelectTrigger style={{ height: 32, fontSize: 12, width: 150 }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto livre</SelectItem>
                          <SelectItem value="yes_no">Sim / Não</SelectItem>
                          <SelectItem value="select">Múltipla escolha</SelectItem>
                        </SelectContent>
                      </Select>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', color: T.muted }}>
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={e => updateQuestion(q.id, { required: e.target.checked })}
                          style={{ accentColor: T.brand }}
                        />
                        Obrigatório
                      </label>
                    </div>
                    {q.type === 'select' && (
                      <div className="space-y-1.5">
                        {(q.options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex gap-2">
                            <Input
                              value={opt}
                              onChange={e => {
                                const newOptions = [...q.options]
                                newOptions[optIdx] = e.target.value
                                updateQuestion(q.id, { options: newOptions })
                              }}
                              placeholder={`Opção ${optIdx + 1}`}
                              style={{ height: 30, fontSize: 12 }}
                            />
                            {q.options.length > 1 && (
                              <button type="button" onClick={() => updateQuestion(q.id, { options: q.options.filter((_, i) => i !== optIdx) })} style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontSize: 16 }}>×</button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => updateQuestion(q.id, { options: [...q.options, ''] })} style={{ fontSize: 12, color: T.brand, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>+ Adicionar opção</button>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => removeQuestion(q.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addQuestion}
            style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.brand, background: 'none', border: `1px dashed ${T.brand}55`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}
          >
            <Plus size={14} /> Adicionar pergunta
          </button>
        </div>
      )}
    </div>
  )
}

// ─── AutomacoesPanel ──────────────────────────────────────────────────────────

function AutomacoesPanel({ formData, setAutomation, setFormData }) {
  const automations = formData.settings?.automations || {}
  const anyEnabled = AUTOMATION_OPTIONS.some(o => automations[o.key])
  const [open, setOpen] = useState(anyEnabled)
  const activeCount = AUTOMATION_OPTIONS.filter(o => automations[o.key]).length

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: T.chip, cursor: 'pointer', border: 'none', fontFamily: 'inherit', textAlign: 'left' }}
      >
        <span>🤖</span>
        <div className="flex-1">
          <p style={{ fontWeight: 600, fontSize: 14, color: T.brand, margin: 0 }}>Automações WhatsApp</p>
          <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Mensagens automáticas para o cliente via WhatsApp</p>
        </div>
        {activeCount > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, background: T.brand, color: '#fff', padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>
            {activeCount} ativa{activeCount !== 1 ? 's' : ''}
          </span>
        )}
        <ChevronDown size={16} style={{ color: T.muted, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }} />
      </button>

      {open && (
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
                <p style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{option.icon} {option.label}</p>
                <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{option.description}</p>
              </div>
            </label>
          ))}

          {(automations.pix_reminder || automations.billing_notification || automations.overdue) && (
            <div style={{ padding: '12px 16px', background: '#FFFBEB' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#92400E', marginBottom: 6 }}>🔑 Chave PIX</label>
              <input
                type="text"
                placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                value={automations.pix_key || ''}
                onChange={e => setAutomation('pix_key', e.target.value)}
                className="w-full rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p style={{ fontSize: 12, color: '#B45309', marginTop: 4 }}>Incluída nas mensagens de cobrança, lembrete PIX e atraso</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── AnamnesePanel ────────────────────────────────────────────────────────────

function AnamnesePanel({ formData, setFormData, anamneseTemplates }) {
  const selectedId = formData.settings?.anamnese_template_id ?? null
  const hasTemplate = selectedId !== null
  const [open, setOpen] = useState(hasTemplate)

  const setTemplateId = (id) =>
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, anamnese_template_id: id },
    }))

  const selectedTemplate = anamneseTemplates.find(t => t.id === selectedId)

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: T.chip, cursor: 'pointer', border: 'none', fontFamily: 'inherit', textAlign: 'left' }}
      >
        <ClipboardList size={16} style={{ color: T.brand, flexShrink: 0 }} />
        <div className="flex-1">
          <p style={{ fontWeight: 600, fontSize: 14, color: T.brand, margin: 0 }}>Anamnese</p>
          <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Formulário enviado ao paciente após o agendamento</p>
        </div>
        {hasTemplate && (
          <span style={{ fontSize: 11, fontWeight: 600, background: T.brand, color: '#fff', padding: '3px 8px', borderRadius: 20, flexShrink: 0, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedTemplate?.name ?? `Template #${selectedId}`}
          </span>
        )}
        <ChevronDown size={16} style={{ color: T.muted, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }} />
      </button>

      {open && (
        <div style={{ background: T.white, padding: 16 }}>
          {anamneseTemplates.length === 0 ? (
            <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '8px 0' }}>
              Nenhum template de anamnese cadastrado.{' '}
              <a href="/anamnese" style={{ color: T.brand, textDecoration: 'underline' }}>Criar agora →</a>
            </p>
          ) : (
            <>
              <Label style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>Template de anamnese</Label>
              <Select
                value={selectedId !== null ? String(selectedId) : '__none__'}
                onValueChange={v => setTemplateId(v === '__none__' ? null : parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum (não solicitar anamnese)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum (não solicitar anamnese)</SelectItem>
                  {anamneseTemplates.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasTemplate && (
                <p style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>
                  O link para preencher a anamnese será enviado junto com a confirmação do agendamento.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── LinkForm (shared between Create and Edit dialogs) ────────────────────────

function LinkForm({ formData, setFormData, services, professionals, setAutomation, anamneseTemplates }) {
  const s = formData.settings

  const setSetting = (key, value) =>
    setFormData(prev => ({ ...prev, settings: { ...prev.settings, [key]: value } }))

  return (
    <div className="space-y-5">
      {/* Evento */}
      <section>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Evento</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="lf-name">Nome do Link *</Label>
            <Input
              id="lf-name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Consulta Inicial, Retorno, Avaliação Nutricional..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="lf-desc">Descrição <span style={{ fontWeight: 400, color: T.muted }}>(opcional)</span></Label>
            <Textarea
              id="lf-desc"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição interna para identificar este link"
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Duração padrão</Label>
            <Select
              value={s.default_duration_minutes?.toString() || '60'}
              onValueChange={v => setSetting('default_duration_minutes', parseInt(v))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value.toString()}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Quem pode agendar</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Serviço</Label>
            <Select
              value={formData.service_id?.toString() || '__none__'}
              onValueChange={v => setFormData(prev => ({ ...prev, service_id: v === '__none__' ? null : parseInt(v) }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="max-h-[220px]">
                <SelectItem value="__none__">Todos os serviços</SelectItem>
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Profissional</Label>
            <Select
              value={formData.account_user_id?.toString() || '__none__'}
              onValueChange={v => setFormData(prev => ({ ...prev, account_user_id: v === '__none__' ? null : parseInt(v) }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Todos os profissionais</SelectItem>
                {professionals.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Profissional ${p.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Disponibilidade */}
      <section style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Disponibilidade</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Início do atendimento</Label>
            <Select
              value={s.start_hour?.toString() || '9'}
              onValueChange={v => setSetting('start_hour', parseInt(v))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOUR_OPTIONS.map(h => (
                  <SelectItem key={h} value={h.toString()}>{String(h).padStart(2,'0')}:00</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fim do atendimento</Label>
            <Select
              value={s.end_hour?.toString() || '18'}
              onValueChange={v => setSetting('end_hour', parseInt(v))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOUR_OPTIONS.map(h => (
                  <SelectItem key={h} value={h.toString()}>{String(h).padStart(2,'0')}:00</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Intervalo entre horários</Label>
            <Select
              value={s.slot_interval_minutes?.toString() || '30'}
              onValueChange={v => setSetting('slot_interval_minutes', parseInt(v))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value.toString()}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Dias disponíveis no calendário</Label>
            <Select
              value={s.days_ahead?.toString() || '15'}
              onValueChange={v => setSetting('days_ahead', parseInt(v))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value.toString()}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Cancelamento */}
      <section style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Política de cancelamento</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label>Prazo mínimo para cancelar / reagendar</Label>
            <p style={{ fontSize: 11, color: T.muted, marginBottom: 6, marginTop: 2 }}>O cliente não poderá cancelar após esse prazo</p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="720"
                value={s.cancel_reschedule_hours ?? 24}
                onChange={e => setSetting('cancel_reschedule_hours', parseInt(e.target.value) || 24)}
                style={{ maxWidth: 100 }}
              />
              <span style={{ fontSize: 14, color: T.muted }}>horas antes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Perguntas pré-agendamento */}
      <IntakeFormPanel formData={formData} setFormData={setFormData} />

      {/* Anamnese */}
      <AnamnesePanel formData={formData} setFormData={setFormData} anamneseTemplates={anamneseTemplates} />

      {/* Automações */}
      <AutomacoesPanel formData={formData} setAutomation={setAutomation} setFormData={setFormData} />

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: T.chip, borderRadius: 10 }}>
        <Switch
          checked={formData.active}
          onCheckedChange={v => setFormData(prev => ({ ...prev, active: v }))}
        />
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>Link {formData.active ? 'ativo' : 'inativo'}</p>
          <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>
            {formData.active ? 'Clientes podem agendar usando este link' : 'Link desativado, nenhum novo agendamento'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── AppointmentLinks ─────────────────────────────────────────────────────────

export function AppointmentLinks() {
  const [links, setLinks] = useState([])
  const [services, setServices] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [anamneseTemplates, setAnamneseTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNewLinkOpen, setIsNewLinkOpen] = useState(false)
  const [isEditLinkOpen, setIsEditLinkOpen] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const [copiedLink, setCopiedLink] = useState(null)
  const [qrCodeLink, setQrCodeLink] = useState(null)
  const [embedLink, setEmbedLink] = useState(null)
  const [embedCopied, setEmbedCopied] = useState(false)

  const DEFAULT_AUTOMATIONS = {
    reminder_24h: false,
    reminder_1h: false,
    billing_notification: false,
    pix_reminder: false,
    overdue: false,
    payment_confirmation: false,
    pix_key: '',
  }

  const blankForm = () => ({
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
      cancel_reschedule_hours: 24,
      intake_form: [],
      automations: { ...DEFAULT_AUTOMATIONS },
      anamnese_template_id: null,
    },
  })

  const [formData, setFormData] = useState(blankForm())

  const setAutomation = (key, value) =>
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        automations: { ...(prev.settings.automations || DEFAULT_AUTOMATIONS), [key]: value },
      },
    }))

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [linksData, servicesData, professionalsData, templatesData] = await Promise.all([
        apiService.getAppointmentLinks(),
        apiService.getAppointmentServices(),
        apiService.getProfessionals(),
        apiService.getAnamneseTemplates().catch(() => []),
      ])
      setLinks(Array.isArray(linksData) ? linksData : (linksData?.links || linksData?.data || []))
      setServices(Array.isArray(servicesData) ? servicesData : (servicesData?.services || servicesData?.data || []))
      setProfessionals(Array.isArray(professionalsData) ? professionalsData : (professionalsData?.professionals || professionalsData?.data || []))
      const rawTemplates = Array.isArray(templatesData) ? templatesData : (templatesData?.templates || templatesData?.anamnese_templates || templatesData?.data || [])
      setAnamneseTemplates(rawTemplates.filter(t => t.active !== false))
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => { setFormData(blankForm()); setEditingLink(null) }

  const handleCreate = async () => {
    if (!formData.name?.trim()) { toast.error('Nome é obrigatório'); return }
    try {
      setIsSubmitting(true)
      await apiService.createAppointmentLink({
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        active: formData.active !== false,
        service_id: formData.service_id || null,
        account_user_id: formData.account_user_id || null,
        link_type: formData.link_type || 'normal',
        settings: formData.settings,
      })
      await loadData()
      toast.success('Link criado com sucesso!')
      setIsNewLinkOpen(false)
      resetForm()
    } catch (err) {
      toast.error(err.message || 'Erro ao criar link')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (link) => {
    setEditingLink(link)
    const settings = link.settings || {}
    setFormData({
      name: link.name || '',
      description: link.description || '',
      active: link.active !== false,
      service_id: link.service?.id || link.service_id || null,
      account_user_id: link.professional?.id || link.account_user_id || null,
      link_type: link.link_type || 'normal',
      settings: {
        start_hour: settings.start_hour || 9,
        end_hour: settings.end_hour || 18,
        slot_interval_minutes: settings.slot_interval_minutes || 30,
        default_duration_minutes: settings.default_duration_minutes || 60,
        days_ahead: settings.days_ahead || 15,
        cancel_reschedule_hours: settings.cancel_reschedule_hours || 24,
        intake_form: settings.intake_form || [],
        automations: { ...DEFAULT_AUTOMATIONS, ...(settings.automations || {}) },
        anamnese_template_id: settings.anamnese_template_id ?? null,
      },
    })
    setIsEditLinkOpen(true)
  }

  const handleUpdate = async () => {
    if (!formData.name?.trim()) { toast.error('Nome é obrigatório'); return }
    if (!editingLink) { toast.error('Link não encontrado para edição'); return }
    try {
      setIsSubmitting(true)
      await apiService.updateAppointmentLink(editingLink.id, {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        active: formData.active !== false,
        service_id: formData.service_id || null,
        account_user_id: formData.account_user_id || null,
        link_type: formData.link_type || 'normal',
        settings: formData.settings,
      })
      await loadData()
      toast.success('Link atualizado com sucesso!')
      setIsEditLinkOpen(false)
      resetForm()
    } catch (err) {
      toast.error(err.message || 'Erro ao atualizar link')
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
      toast.error(err.message || 'Erro ao excluir link')
    }
  }

  const handleCopyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(url)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch {}
  }

  // ─── Loading skeleton ───────────────────────────────────────────────────────

  if (loading && links.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-52 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
          <div className="h-9 w-28 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse h-48" />
          ))}
        </div>
      </div>
    )
  }

  // ─── Dialogs (shared) ───────────────────────────────────────────────────────

  const dialogScrollClass = "max-h-[85vh] overflow-y-auto"

  const createDialog = (
    <Dialog open={isNewLinkOpen} onOpenChange={open => { setIsNewLinkOpen(open); if (!open) resetForm() }}>
      <DialogTrigger asChild>
        <Button
          data-testid="new-link-btn"
          onClick={() => { resetForm(); setIsNewLinkOpen(true) }}
          style={{ background: T.brand, color: '#fff', border: 'none', borderRadius: 8 }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Link
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="appointment-link-dialog" className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Link de Agendamento</DialogTitle>
          <DialogDescription>Configure como os clientes vão agendar com você.</DialogDescription>
        </DialogHeader>
        <div className={dialogScrollClass}>
          <LinkForm formData={formData} setFormData={setFormData} services={services} professionals={professionals} setAutomation={setAutomation} anamneseTemplates={anamneseTemplates} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setIsNewLinkOpen(false); resetForm() }}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={isSubmitting} style={{ background: T.brand, color: '#fff' }}>
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando...</> : 'Criar Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const editDialog = (
    <Dialog open={isEditLinkOpen} onOpenChange={open => { setIsEditLinkOpen(open); if (!open) resetForm() }}>
      <DialogContent data-testid="edit-link-dialog" className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar link</DialogTitle>
          <DialogDescription>As alterações entram em vigor imediatamente.</DialogDescription>
        </DialogHeader>
        <div className={dialogScrollClass}>
          <LinkForm formData={formData} setFormData={setFormData} services={services} professionals={professionals} setAutomation={setAutomation} anamneseTemplates={anamneseTemplates} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setIsEditLinkOpen(false); resetForm() }}>Cancelar</Button>
          <Button onClick={handleUpdate} disabled={isSubmitting} style={{ background: T.brand, color: '#fff' }}>
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div data-testid="appointment-links-page" style={{ minHeight: '100vh', background: T.bg, ...DISPLAY }}>
      <div className="relative z-10 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: T.text }}>Links de Agendamento</h1>
            <p style={{ fontSize: 14, color: T.muted, marginTop: 2 }}>
              Links únicos que os clientes usam para agendar com você
            </p>
          </div>
          {createDialog}
        </div>

        {/* Empty state */}
        {links.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Link2 size={28} style={{ color: T.brand }} />
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 8 }}>Nenhum link criado ainda</p>
            <p style={{ fontSize: 14, color: T.muted, marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' }}>
              Crie seu primeiro link e comece a receber agendamentos online — como o Calendly, mas integrado ao seu negócio.
            </p>
            <Dialog open={isNewLinkOpen} onOpenChange={open => { setIsNewLinkOpen(open); if (!open) resetForm() }}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsNewLinkOpen(true) }} style={{ background: T.brand, color: '#fff', border: 'none' }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro link
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          /* Cards grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((link, idx) => {
              const color = LINK_COLORS[idx % LINK_COLORS.length]
              const duration = link.settings?.default_duration_minutes
              const durationLabel = DURATION_OPTIONS.find(o => o.value === duration)?.label || (duration ? `${duration} min` : null)

              return (
                <div
                  key={link.id}
                  style={{ borderRadius: 14, border: `1px solid ${T.border}`, background: T.white, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 150ms' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  {/* Color bar */}
                  <div style={{ height: 5, background: color }} />

                  <div style={{ padding: '16px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Name + status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 style={{ fontWeight: 700, fontSize: 16, color: T.text, lineHeight: '1.3', flex: 1 }}>{link.name}</h3>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, flexShrink: 0,
                        background: link.active ? '#ECFDF5' : '#F3F4F6',
                        color: link.active ? '#059669' : '#6B7280',
                      }}>
                        {link.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      {durationLabel && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.muted }}>
                          <Clock size={12} /> {durationLabel}
                        </span>
                      )}
                      {link.service && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.muted }}>
                          <Scissors size={12} /> {link.service.name}
                        </span>
                      )}
                      {link.professional && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.muted }}>
                          <User size={12} /> {link.professional.name}
                        </span>
                      )}
                      {link.settings?.days_ahead && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.muted }}>
                          <CalendarDays size={12} /> {link.settings.days_ahead} dias
                        </span>
                      )}
                    </div>

                    {/* URL */}
                    {link.public_url && (
                      <p style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 16 }}>
                        {link.public_url}
                      </p>
                    )}

                    <div style={{ flex: 1 }} />

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {/* Copy — primary action */}
                      {link.public_url && (
                        <button
                          onClick={() => handleCopyLink(link.public_url)}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${color}`,
                            background: copiedLink === link.public_url ? color : 'transparent',
                            color: copiedLink === link.public_url ? '#fff' : color,
                            fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 150ms',
                          }}
                        >
                          {copiedLink === link.public_url
                            ? <><CheckCircle2 size={14} /> Copiado!</>
                            : <><Copy size={14} /> Copiar link</>}
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => handleEdit(link)}
                        title="Editar"
                        style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', color: T.muted, display: 'flex', alignItems: 'center', transition: 'background 100ms' }}
                        onMouseEnter={e => e.currentTarget.style.background = T.bg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Edit size={15} />
                      </button>

                      {/* More */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', color: T.muted, display: 'flex', alignItems: 'center', transition: 'background 100ms' }}
                            onMouseEnter={e => e.currentTarget.style.background = T.bg}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <MoreHorizontal size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {link.public_url && (
                            <DropdownMenuItem onClick={() => window.open(link.public_url, '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" /> Abrir link
                            </DropdownMenuItem>
                          )}
                          {link.public_url && (
                            <DropdownMenuItem onClick={() => setQrCodeLink(link)}>
                              <QrCode className="h-4 w-4 mr-2" /> Ver QR Code
                            </DropdownMenuItem>
                          )}
                          {link.public_url && (
                            <DropdownMenuItem onClick={() => setEmbedLink(link)}>
                              <Code2 className="h-4 w-4 mr-2" /> Incorporar no site
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-red-600 focus:text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir "{link.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(link.id)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Edit dialog */}
        {editDialog}

        {/* Embed Dialog */}
        <Dialog open={!!embedLink} onOpenChange={open => { if (!open) { setEmbedLink(null); setEmbedCopied(false) } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Code2 className="h-5 w-5" /> Incorporar no site</DialogTitle>
              <DialogDescription>Cole este código HTML onde quiser exibir o calendário de agendamento.</DialogDescription>
            </DialogHeader>
            {embedLink?.public_url && (
              <div className="flex flex-col gap-4 py-2">
                <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed">
{`<iframe
  src="${embedLink.public_url}"
  width="100%"
  height="640"
  frameborder="0"
  style="border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.12);"
  title="Agendamento Online"
></iframe>`}
                </pre>
                <p style={{ fontSize: 12, color: T.muted }}>Compatível com WordPress, Webflow, Notion, Squarespace e qualquer site que aceite HTML.</p>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(`<iframe\n  src="${embedLink.public_url}"\n  width="100%"\n  height="640"\n  frameborder="0"\n  style="border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.12);"\n  title="Agendamento Online"\n></iframe>`)
                    setEmbedCopied(true)
                    setTimeout(() => setEmbedCopied(false), 2000)
                  }}
                  style={{ background: T.brand, color: '#fff' }}
                >
                  {embedCopied ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Copiado!</> : <><Copy className="h-4 w-4 mr-2" /> Copiar código</>}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={!!qrCodeLink} onOpenChange={open => { if (!open) setQrCodeLink(null) }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> QR Code</DialogTitle>
              <DialogDescription>{qrCodeLink?.name} — Escaneie para agendar</DialogDescription>
            </DialogHeader>
            {qrCodeLink?.public_url && (
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="p-3 bg-white rounded-xl border shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeLink.public_url)}&size=220x220&margin=10`}
                    alt="QR Code"
                    width={220}
                    height={220}
                    className="block"
                  />
                </div>
                <p className="text-xs text-gray-500 text-center break-all max-w-[260px]">{qrCodeLink.public_url}</p>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1 text-sm" onClick={() => handleCopyLink(qrCodeLink.public_url)}>
                    {copiedLink === qrCodeLink.public_url ? <><CheckCircle2 className="h-4 w-4 mr-1" /> Copiado!</> : <><Copy className="h-4 w-4 mr-1" /> Copiar link</>}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-sm"
                    onClick={() => {
                      const a = document.createElement('a')
                      a.href = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeLink.public_url)}&size=400x400&margin=10`
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
