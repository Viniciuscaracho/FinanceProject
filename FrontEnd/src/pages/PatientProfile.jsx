import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, FileText, Target, ClipboardList, Calendar, TrendingUp, Copy, ExternalLink, Plus, Trash2, Loader2, Save, ChevronDown, ChevronUp, Link2, UtensilsCrossed } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { apiService } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { T } from '@/lib/tokens'

const DOCUMENT_TYPE_LABELS = {
  plano_alimentar: 'Plano Alimentar',
  orientacao_nutricional: 'Orientação Nutricional',
  evolucao_paciente: 'Evolução',
  orientacao_terapeutica: 'Orientação Terapêutica',
  anotacao_sessao: 'Anotação de Sessão',
  outro: 'Outro',
}

const GOAL_STATUS_COLORS = { active: '#10B981', completed: '#4C60AA', abandoned: '#9CA3AF' }
const GOAL_STATUS_LABELS = { active: 'Ativa', completed: 'Concluída', abandoned: 'Abandonada' }
const APT_STATUS_LABELS  = { scheduled: 'Agendado', completed: 'Concluído', cancelled: 'Cancelado', no_show: 'Faltou' }
const APT_STATUS_COLORS  = { scheduled: '#3B82F6', completed: '#10B981', cancelled: '#EF4444', no_show: '#F59E0B' }
const CONTACT_TYPE_LABELS = { customer: 'Cliente', employee: 'Colaborador', supplier: 'Fornecedor', partner: 'Sócio', associate: 'Associado' }

function Section({ icon: Icon, title, count, children, defaultOpen = true, collapsible = true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div
        onClick={() => collapsible && setOpen(p => !p)}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={collapsible ? (e => (e.key === 'Enter' || e.key === ' ') && setOpen(p => !p)) : undefined}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: collapsible ? 'pointer' : 'default' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={16} style={{ color: T.brand }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{title}</span>
          {count != null && count > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: T.chip, color: T.brand }}>{count}</span>
          )}
        </div>
        {collapsible && (open ? <ChevronUp size={16} style={{ color: '#9CA3AF' }} /> : <ChevronDown size={16} style={{ color: '#9CA3AF' }} />)}
      </div>
      {(collapsible ? open : true) && <div style={{ padding: '0 18px 18px' }}>{children}</div>}
    </div>
  )
}

function GoalCard({ goal, contactId, onUpdate, onDelete }) {

  const [showProgress, setShowProgress] = useState(false)
  const [showHistory, setShowHistory]   = useState(false)
  const [value, setValue]   = useState('')
  const [note,  setNote]    = useState('')
  const [date,  setDate]    = useState('')
  const [saving, setSaving] = useState(false)

  const color  = GOAL_STATUS_COLORS[goal.status] || '#9CA3AF'
  const isActive = goal.status === 'active'
  const pct = (goal.current_value != null && goal.target_value != null && goal.target_value > 0)
    ? Math.min(100, Math.round((parseFloat(goal.current_value) / parseFloat(goal.target_value)) * 100))
    : null
  const history = goal.progress_history || []
  const chartData = history.length >= 2
    ? history.map(e => ({ date: e.date ? e.date.slice(5) : '', value: e.value }))
    : null

  const handleProgress = async () => {
    if (!value) return
    setSaving(true)
    try {
      const res = await apiService.addPatientGoalProgress(contactId, goal.id, parseFloat(value), note || null, date || null)
      onUpdate(res.goal)
      setShowProgress(false); setValue(''); setNote(''); setDate('')
      toast.success('Progresso registrado!')
    } catch { toast.error('Erro ao registrar progresso') }
    finally { setSaving(false) }
  }

  const handleStatus = async (status) => {
    try {
      const res = await apiService.updatePatientGoal(contactId, goal.id, { status })
      onUpdate(res.goal)
      toast.success(status === 'completed' ? 'Meta concluída!' : 'Meta reativada')
    } catch { toast.error('Erro ao atualizar status') }
  }

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{goal.title}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 20, background: color + '20', color }}>{GOAL_STATUS_LABELS[goal.status] || goal.status}</span>
          </div>
          {(goal.current_value != null || goal.target_value != null) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, fontSize: 12, color: T.muted }}>
              <TrendingUp size={11} style={{ color: T.brand }} />
              <span>
                {goal.current_value != null ? `Atual: ${goal.current_value}` : ''}
                {goal.current_value != null && goal.target_value != null ? ' → ' : ''}
                {goal.target_value != null ? `Meta: ${goal.target_value}` : ''}
                {goal.unit ? ` ${goal.unit}` : ''}
              </span>
              {pct != null && <span style={{ fontWeight: 700, color: T.brand }}>{pct}%</span>}
            </div>
          )}
          {pct != null && (
            <div style={{ marginTop: 6, height: 5, borderRadius: 99, background: T.border, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s' }} />
            </div>
          )}
          {goal.deadline && (
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Prazo: {new Date(goal.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
          )}
        </div>
        <button type="button" onClick={() => onDelete(goal.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 4, flexShrink: 0 }}>
          <Trash2 size={13} />
        </button>
      </div>

      {chartData && (
        <div style={{ marginTop: 10, height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E7EB', padding: '4px 8px' }}
                formatter={(val) => [`${val}${goal.unit ? ` ${goal.unit}` : ''}`, '']}
                labelStyle={{ color: '#9CA3AF', fontSize: 10 }}
              />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {isActive && (
          <button type="button" onClick={() => { setShowProgress(p => !p); setValue(''); setNote(''); setDate('') }}
            style={{ fontSize: 11, fontWeight: 600, color: T.brand, background: T.chip, border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Registrar
          </button>
        )}
        {history.length > 0 && (
          <button type="button" onClick={() => setShowHistory(p => !p)}
            style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', background: '#F3F4F6', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {showHistory ? '▲' : '▼'} Histórico ({history.length})
          </button>
        )}
        {isActive && (
          <button type="button" onClick={() => handleStatus('completed')}
            style={{ fontSize: 11, fontWeight: 600, color: '#4C60AA', background: '#EEF2FF', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ✓ Concluir
          </button>
        )}
        {!isActive && (
          <button type="button" onClick={() => handleStatus('active')}
            style={{ fontSize: 11, fontWeight: 600, color: '#10B981', background: '#ECFDF5', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ↺ Reativar
          </button>
        )}
      </div>

      {showProgress && (
        <div style={{ marginTop: 10, padding: '10px 12px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
            <input type="number" step="any" value={value} onChange={e => setValue(e.target.value)}
              placeholder={`Valor${goal.unit ? ` (${goal.unit})` : ''}`}
              style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit' }} />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit' }} />
          </div>
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="Observação (opcional)"
            style={{ width: '100%', padding: '6px 10px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 6 }} />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <Button size="sm" variant="ghost" onClick={() => setShowProgress(false)} style={{ fontSize: 11 }}>Cancelar</Button>
            <Button size="sm" onClick={handleProgress} disabled={!value || saving} style={{ background: T.brand, color: '#fff', fontSize: 11 }}>
              {saving ? <Loader2 size={12} className="animate-spin" /> : 'OK'}
            </Button>
          </div>
        </div>
      )}

      {showHistory && history.length > 0 && (
        <div style={{ marginTop: 8, borderTop: '1px solid #F3F4F6', paddingTop: 8 }}>
          {[...history].reverse().map((entry, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', padding: '3px 0', borderBottom: i < history.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              <div>
                <span style={{ fontWeight: 700 }}>{entry.value}{goal.unit ? ` ${goal.unit}` : ''}</span>
                {entry.note && <span style={{ color: '#9CA3AF', marginLeft: 6 }}>{entry.note}</span>}
              </div>
              <span style={{ color: '#9CA3AF', fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
                {entry.date ? new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const BLANK_GOAL = { title: '', unit: '', target_value: '', current_value: '', deadline: '', notes: '' }

export function PatientProfile() {
  const { id } = useParams()
  const navigate = useNavigate()


  const [loading, setLoading] = useState(true)
  const [contact, setContact]     = useState(null)
  const [goals, setGoals]         = useState([])
  const [docs, setDocs]           = useState([])
  const [anamneses, setAnamneses] = useState([])
  const [appointments, setAppointments] = useState([])
  const [mealPlans, setMealPlans] = useState([])
  const [expandedAnamneseId, setExpandedAnamneseId] = useState(null)

  const [showNewGoal, setShowNewGoal]   = useState(false)
  const [newGoal, setNewGoal]           = useState(BLANK_GOAL)
  const [savingGoal, setSavingGoal]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [contactRes, goalsRes, docsRes, anamneseRes, aptsRes, plansRes] = await Promise.all([
        apiService.getContact(id),
        apiService.getPatientGoals(id).catch(() => ({ goals: [] })),
        apiService.getPatientDocuments(id).catch(() => ({ documents: [] })),
        apiService.getAnamneseHistory(id).catch(() => ({ responses: [] })),
        apiService.getAppointments({ contact_id: id, per_page: 10 }).catch(() => []),
        apiService.getMealPlans(id).catch(() => ({ meal_plans: [] })),
      ])
      setContact(contactRes.contact || contactRes)
      setGoals(goalsRes.goals || [])
      setDocs(docsRes.documents || [])
      setAnamneses(anamneseRes.responses || [])
      setAppointments(Array.isArray(aptsRes) ? aptsRes : (aptsRes.appointments || []))
      setMealPlans(plansRes.meal_plans || [])
    } catch (e) {
      toast.error('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleSaveGoal = async () => {
    if (!newGoal.title.trim()) return
    setSavingGoal(true)
    try {
      const res = await apiService.createPatientGoal(id, newGoal)
      setGoals(prev => [res.goal, ...prev])
      setNewGoal(BLANK_GOAL)
      setShowNewGoal(false)
      toast.success('Meta adicionada!')
    } catch { toast.error('Erro ao salvar meta') }
    finally { setSavingGoal(false) }
  }

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Remover esta meta?')) return
    try {
      await apiService.deletePatientGoal(id, goalId)
      setGoals(prev => prev.filter(g => g.id !== goalId))
      toast.success('Meta removida')
    } catch { toast.error('Erro ao remover meta') }
  }

  const handleToggleDocShared = async (doc) => {
    try {
      const res = await apiService.togglePatientDocumentShared(id, doc.id)
      setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, shared: res.document?.shared ?? !d.shared } : d))
    } catch { toast.error('Erro ao alterar compartilhamento') }
  }

  const handleCopyDocLink = (doc) => {
    const url = `${window.location.origin}/d/${doc.public_token}`
    navigator.clipboard.writeText(url).then(() => toast.success('Link copiado!'))
  }

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Remover este documento?')) return
    try {
      await apiService.deletePatientDocument(id, docId)
      setDocs(prev => prev.filter(d => d.id !== docId))
      toast.success('Documento removido')
    } catch { toast.error('Erro ao remover documento') }
  }

  const handleCreateMealPlan = async () => {
    try {
      const res = await apiService.createMealPlan(id, { title: 'Novo Plano Alimentar' })
      navigate(`/contacts/${id}/meal-plans/${res.meal_plan.id}`)
    } catch { toast.error('Erro ao criar plano alimentar') }
  }

  const handleDeleteMealPlan = async (planId) => {
    if (!window.confirm('Remover este plano alimentar?')) return
    try {
      await apiService.deleteMealPlan(id, planId)
      setMealPlans(prev => prev.filter(p => p.id !== planId))
      toast.success('Plano removido')
    } catch { toast.error('Erro ao remover plano') }
  }

  const handleCopyMealPlanLink = (plan) => {
    const url = `${window.location.origin}/plano/${plan.public_token}`
    navigator.clipboard.writeText(url).then(() => toast.success('Link copiado!'))
  }

  const contactName = contact?.name || contact?.first_name || '...'
  const contactType = contact?.contact_type || 'customer'

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: T.brand }} />
      </div>
    )
  }

  if (!contact) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: T.muted }}>Paciente não encontrado.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/contacts')} style={{ marginTop: 16 }}>Voltar</Button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
      {/* Back */}
      <button type="button" onClick={() => navigate('/contacts')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 13, fontFamily: 'inherit', marginBottom: 20 }}>
        <ArrowLeft size={15} /> Pacientes
      </button>

      {/* Patient header */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: T.chip, color: T.brand, fontWeight: 800, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {(contactName[0] || '?').toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 20, color: T.text, margin: 0 }}>{contactName}</h1>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: T.chip, color: T.brand, display: 'inline-block', marginTop: 4 }}>
                {CONTACT_TYPE_LABELS[contactType] || 'Contato'}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/contacts')} style={{ fontSize: 12 }}>
            Editar
          </Button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16, fontSize: 13, color: T.muted }}>
          {(contact.email) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={13} /> {contact.email}
            </div>
          )}
          {(contact.phone || contact.phone_number) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={13} /> {contact.phone || contact.phone_number}
            </div>
          )}
          {appointments.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={13} /> {appointments.length} consulta{appointments.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {(contact.notes || contact.description) && (
          <p style={{ marginTop: 12, fontSize: 13, color: T.muted, lineHeight: 1.5, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
            {contact.notes || contact.description}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Meal Plans */}
        <Section icon={UtensilsCrossed} title="Planos Alimentares" count={mealPlans.length} collapsible={false}>
          {mealPlans.length === 0 ? (
            <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '16px 0' }}>Nenhum plano alimentar criado</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {mealPlans.map(plan => (
                <div key={plan.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.title}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2, display: 'flex', gap: 6 }}>
                      <span style={{ padding: '1px 6px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: plan.status === 'active' ? '#ECFDF5' : '#F3F4F6', color: plan.status === 'active' ? '#10B981' : '#9CA3AF' }}>
                        {plan.status === 'active' ? 'Ativo' : plan.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                      </span>
                      <span>{plan.total_days} {plan.total_days === 1 ? 'dia' : 'dias'} · atualizado {new Date(plan.updated_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                    {plan.status === 'active' && (
                      <button type="button" onClick={() => handleCopyMealPlanLink(plan)} title="Copiar link do paciente"
                        style={{ background: T.chip, border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: T.brand }}>
                        <Copy size={12} /> Link
                      </button>
                    )}
                    <button type="button" onClick={() => navigate(`/contacts/${id}/meal-plans/${plan.id}`)} title="Editar plano"
                      style={{ background: T.chip, border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: T.brand }}>
                      <ExternalLink size={12} /> Abrir
                    </button>
                    <button type="button" onClick={() => handleDeleteMealPlan(plan.id)} title="Remover"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '4px' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button size="sm" variant="outline" onClick={handleCreateMealPlan} style={{ fontSize: 12, gap: 6 }}>
            <Plus size={13} /> Novo plano alimentar
          </Button>
        </Section>

        {/* Goals */}
        <Section icon={Target} title="Metas" count={goals.filter(g => g.status === 'active').length}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {goals.length === 0 && !showNewGoal && (
              <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '16px 0' }}>Nenhuma meta cadastrada</p>
            )}
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                contactId={id}
                onUpdate={updated => setGoals(prev => prev.map(g => g.id === updated.id ? updated : g))}
                onDelete={handleDeleteGoal}
              />
            ))}

            {showNewGoal ? (
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px', background: '#F9FAFB' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 3 }}>Título *</label>
                    <input type="text" value={newGoal.title} onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))}
                      placeholder="Ex: Emagrecer 5kg"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 3 }}>Valor atual</label>
                    <input type="number" step="any" value={newGoal.current_value} onChange={e => setNewGoal(p => ({ ...p, current_value: e.target.value }))}
                      placeholder="72" style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 3 }}>Meta</label>
                    <input type="number" step="any" value={newGoal.target_value} onChange={e => setNewGoal(p => ({ ...p, target_value: e.target.value }))}
                      placeholder="65" style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 3 }}>Unidade</label>
                    <input type="text" value={newGoal.unit} onChange={e => setNewGoal(p => ({ ...p, unit: e.target.value }))}
                      placeholder="kg, mg/dL…" style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 3 }}>Prazo</label>
                    <input type="date" value={newGoal.deadline} onChange={e => setNewGoal(p => ({ ...p, deadline: e.target.value }))}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewGoal(false)} disabled={savingGoal} style={{ fontSize: 12 }}>Cancelar</Button>
                  <Button size="sm" onClick={handleSaveGoal} disabled={savingGoal || !newGoal.title.trim()} style={{ background: T.brand, color: '#fff', fontSize: 12 }}>
                    {savingGoal ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setShowNewGoal(true)} style={{ fontSize: 12, gap: 6 }}>
                <Plus size={13} /> Nova meta
              </Button>
            )}
          </div>
        </Section>

        {/* Documents */}
        <Section icon={FileText} title="Documentos" count={docs.length}>
          {docs.length === 0 ? (
            <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '16px 0' }}>Nenhum documento criado</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {docs.map(doc => (
                <div key={doc.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                      {DOCUMENT_TYPE_LABELS?.[doc.document_type] || doc.document_type}
                      {' · '}
                      {new Date(doc.updated_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                    <button type="button"
                      onClick={() => handleToggleDocShared(doc)}
                      title={doc.shared ? 'Remover compartilhamento' : 'Compartilhar'}
                      style={{ background: doc.shared ? '#ECFDF5' : '#F3F4F6', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: doc.shared ? '#10B981' : '#9CA3AF' }}>
                      <Link2 size={12} /> {doc.shared ? 'Ativo' : 'Link'}
                    </button>
                    {doc.shared && (
                      <button type="button" onClick={() => handleCopyDocLink(doc)} title="Copiar link"
                        style={{ background: T.chip, border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: T.brand }}>
                        <Copy size={12} /> Copiar
                      </button>
                    )}
                    <a href={`/d/${doc.public_token}`} target="_blank" rel="noreferrer" title="Ver documento"
                      style={{ background: T.chip, border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: T.brand, textDecoration: 'none' }}>
                      <ExternalLink size={12} />
                    </a>
                    <button type="button" onClick={() => handleDeleteDoc(doc.id)} title="Remover"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '4px' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Anamnese history */}
        <Section icon={ClipboardList} title="Histórico de Anamneses" count={anamneses.length} defaultOpen={false}>
          {anamneses.length === 0 ? (
            <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '16px 0' }}>Nenhuma anamnese registrada</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {anamneses.map(resp => {
                const isExpanded = expandedAnamneseId === resp.id
                const template = resp.anamnese_template
                const answers = resp.answers || {}
                const fields = template?.fields || []
                return (
                  <div key={resp.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    <button type="button" onClick={() => setExpandedAnamneseId(isExpanded ? null : resp.id)}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{template?.name || 'Anamnese'}</span>
                        {resp.appointment_start_time && (
                          <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>
                            {new Date(resp.appointment_start_time).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp size={14} style={{ color: '#9CA3AF' }} /> : <ChevronDown size={14} style={{ color: '#9CA3AF' }} />}
                    </button>
                    {isExpanded && (
                      <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${T.border}` }}>
                        {fields.length > 0 ? fields.map(field => {
                          const val = answers[field.id] || answers[String(field.id)]
                          if (!val) return null
                          return (
                            <div key={field.id} style={{ padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                              <span style={{ fontWeight: 600, color: T.muted, fontSize: 12 }}>{field.label}</span>
                              <p style={{ margin: '2px 0 0', color: T.text }}>{Array.isArray(val) ? val.join(', ') : String(val)}</p>
                            </div>
                          )
                        }) : (
                          <p style={{ fontSize: 13, color: T.muted, marginTop: 8 }}>Sem respostas registradas.</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* Recent appointments */}
        <Section icon={Calendar} title="Consultas" count={appointments.length} defaultOpen={false}>
          {appointments.length === 0 ? (
            <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '16px 0' }}>Nenhuma consulta encontrada</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {appointments.map(apt => {
                const statusColor = APT_STATUS_COLORS[apt.status] || '#9CA3AF'
                const statusLabel = APT_STATUS_LABELS[apt.status] || apt.status
                return (
                  <div key={apt.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{apt.service?.name || 'Consulta'}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                        {apt.start_time ? new Date(apt.start_time).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        {apt.professional?.name ? ` · ${apt.professional.name}` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: statusColor + '20', color: statusColor, flexShrink: 0 }}>
                      {statusLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

      </div>
    </div>
  )
}
