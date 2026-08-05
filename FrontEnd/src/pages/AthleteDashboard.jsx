import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, UtensilsCrossed, Loader2, Plus, Clock, Brain, ChevronRight, FileText } from 'lucide-react'
import { apiService } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { T } from '@/lib/tokens'

const BRAND = '#4C60AA'

/* ── Helpers ─────────────────────────────────────────────────────────── */
function timeAgo(iso) {
  if (!iso) return null
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d === 0) return 'hoje'
  if (d === 1) return 'ontem'
  if (d < 7)  return `${d}d atrás`
  if (d < 30) return `${Math.floor(d / 7)}sem atrás`
  return `${Math.floor(d / 30)}m atrás`
}

/* ── Tab bar ─────────────────────────────────────────────────────────── */
function TabBar({ active, onChange }) {
  const tabs = [
    { key: 'performance', label: 'Desempenho', icon: Activity },
    { key: 'nutrition',   label: 'Plano Alimentar', icon: UtensilsCrossed },
  ]
  return (
    <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginBottom: 24 }}>
      {tabs.map(({ key, label, icon: Icon }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 16px',
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 14, fontWeight: isActive ? 700 : 500,
              color: isActive ? BRAND : T.muted,
              borderBottom: `2px solid ${isActive ? BRAND : 'transparent'}`,
              marginBottom: -1, transition: 'all 150ms',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        )
      })}
    </div>
  )
}

/* ── Timeline event row ──────────────────────────────────────────────── */
function EventRow({ event }) {
  const fields = [
    { key: 'sono',         label: 'Sono',       color: '#6366F1' },
    { key: 'carga',        label: 'Carga',      color: '#F59E0B' },
    { key: 'observacao',   label: 'Obs',        color: BRAND },
    { key: 'proxima_acao', label: 'Próx. ação', color: '#10B981' },
  ].filter(f => event[f.key])

  return (
    <div style={{
      background: T.white, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Clock size={12} style={{ color: T.muted }} />
        <span style={{ fontSize: 12, color: T.muted }}>{timeAgo(event.created_at) || '—'}</span>
        {event.source && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: BRAND,
            background: BRAND + '12', borderRadius: 20, padding: '1px 7px',
          }}>
            {event.source === 'whatsapp' ? 'WhatsApp' : event.source === 'audio' ? 'Áudio' : 'Manual'}
          </span>
        )}
      </div>
      {event.raw_input && (
        <p style={{ margin: 0, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.5 }}>
          "{event.raw_input}"
        </p>
      )}
      {fields.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {fields.map(f => (
            <span key={f.key} style={{
              fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
              background: f.color + '10', color: f.color,
              borderRadius: 20, padding: '3px 9px', fontWeight: 600,
            }}>
              <span style={{ opacity: 0.7, fontSize: 10 }}>{f.label}:</span>
              {event[f.key]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Meal plan card ──────────────────────────────────────────────────── */
function MealPlanCard({ plan, contactId, navigate }) {
  const statusColor = plan.status === 'active' ? '#10B981' : plan.status === 'draft' ? '#F59E0B' : T.muted
  const statusLabel = plan.status === 'active' ? 'Ativo' : plan.status === 'draft' ? 'Rascunho' : 'Arquivado'

  return (
    <div
      onClick={() => navigate(`/contacts/${contactId}/meal-plans/${plan.id}`)}
      style={{
        background: T.white, border: `1.5px solid ${T.border}`,
        borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'border-color 140ms, box-shadow 140ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.boxShadow = '0 2px 12px rgba(76,96,170,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: '#FFF7ED',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <UtensilsCrossed size={18} style={{ color: '#F59E0B' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {plan.title || 'Plano alimentar'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: statusColor,
            background: statusColor + '15', borderRadius: 20, padding: '1px 7px',
          }}>
            {statusLabel}
          </span>
          {plan.target_kcal && (
            <span style={{ fontSize: 11, color: T.muted }}>{plan.target_kcal} kcal/dia</span>
          )}
        </div>
      </div>
      <ChevronRight size={16} style={{ color: T.muted, flexShrink: 0 }} />
    </div>
  )
}

/* ── Performance tab ─────────────────────────────────────────────────── */
function PerformanceTab({ contactId }) {
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText]       = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!contactId) return
    apiService.getTimelineEvents(contactId)
      .then(res => setEvents(res?.events || res || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [contactId])

  const handleSend = async () => {
    if (!text.trim() || !contactId) return
    setSending(true)
    try {
      const res = await apiService.createTimelineEvent(contactId, text.trim())
      if (res?.event) setEvents(prev => [res.event, ...prev])
      setText('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Quick input */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Como foi hoje? Treino, sono, disposição, alimentação… A IA organiza tudo."
          rows={3}
          style={{
            width: '100%', border: 'none', outline: 'none', resize: 'none',
            fontSize: 13, fontFamily: 'inherit', color: T.text,
            background: 'transparent', boxSizing: 'border-box', lineHeight: 1.6,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', border: 'none', borderRadius: 8,
              background: !text.trim() || sending ? T.border : BRAND,
              color: '#fff', cursor: !text.trim() || sending ? 'default' : 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              transition: 'background 150ms',
            }}
          >
            {sending
              ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Processando…</>
              : <><Brain size={13} /> Registrar</>
            }
          </button>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: BRAND }} />
        </div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: T.muted }}>
          <FileText size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.text }}>Nenhum registro ainda</p>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>Escreva sobre seu treino acima para começar.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.map((e, i) => <EventRow key={e.id || i} event={e} />)}
        </div>
      )}
    </div>
  )
}

/* ── Nutrition tab ───────────────────────────────────────────────────── */
function NutritionTab({ contactId, navigate }) {
  const [plans, setPlans]     = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!contactId) return
    apiService.getMealPlans(contactId)
      .then(res => setPlans(res?.meal_plans || res || []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false))
  }, [contactId])

  const handleCreate = async () => {
    if (!contactId) return
    setCreating(true)
    try {
      const res = await apiService.createMealPlan(contactId, { title: 'Meu plano alimentar', status: 'draft' })
      if (res?.meal_plan?.id) {
        navigate(`/contacts/${contactId}/meal-plans/${res.meal_plan.id}`)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleCreate}
          disabled={creating}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', border: 'none', borderRadius: 8,
            background: BRAND, color: '#fff',
            cursor: creating ? 'default' : 'pointer',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
          }}
        >
          {creating
            ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : <Plus size={13} />
          }
          Novo plano
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: BRAND }} />
        </div>
      ) : plans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <UtensilsCrossed size={32} style={{ margin: '0 auto 12px', display: 'block', color: T.border }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.text }}>Nenhum plano criado</p>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: T.muted }}>
            Crie seu primeiro plano e monte o cardápio batendo seus macros.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plans.map(p => (
            <MealPlanCard key={p.id} plan={p} contactId={contactId} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────────────────── */
export function AthleteDashboard() {
  const navigate        = useNavigate()
  const { user }        = useAuth()
  const contactId       = user?.account?.self_contact_id || null
  const [tab, setTab]   = useState('performance')

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Activity size={20} style={{ color: BRAND }} />
        <h1 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: 0 }}>Meu painel</h1>
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === 'performance' && <PerformanceTab contactId={contactId} />}
      {tab === 'nutrition'   && <NutritionTab contactId={contactId} navigate={navigate} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
