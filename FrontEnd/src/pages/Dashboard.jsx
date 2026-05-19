import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  isSameDay, isSameMonth, parseISO, format,
  startOfWeek, eachDayOfInterval, endOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useAppointments } from '@/hooks/useAppointments'
import { normalizeStatus } from '@/utils/appointmentUtils'
import { useIsMobile, useBreakpoint } from '@/hooks/use-mobile'
import { useAuth } from '@/contexts/AuthContext'
import {
  AlertCircle, Loader2, Plus, User, FileText,
  CheckCircle2, Calendar, TrendingUp, TrendingDown,
  X, Check,
} from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { apiService } from '../lib/api'
import { useUpdateTransaction } from '@/hooks/useTransactions'
import { T, DISPLAY } from '@/lib/tokens'

/* ─── Tokens ─────────────────────────────────────── */
const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

const STATUS = {
  pending:   { color: T.amber,   label: 'Pendente'   },
  confirmed: { color: T.brand,   label: 'Confirmado' },
  completed: { color: T.green,   label: 'Concluído'  },
  canceled:  { color: '#D1D5DB', label: 'Cancelado'  },
  no_show:   { color: '#D1D5DB', label: 'Não veio'   },
}

/* ─── Sub-componentes ────────────────────────────── */
function Panel({ children, style }) {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, ...style }}>
      {children}
    </div>
  )
}

// Bloco pulsante para skeleton — tamanho fixo evita layout shift
function Sk({ w = 80, h = 14, r = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'rgba(255,255,255,0.12)',
      animation: 'skpulse 1.4s ease-in-out infinite',
      flexShrink: 0,
    }} />
  )
}

function SectionHeader({ label, badge, badgeColor, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 20px 12px' }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, margin: 0 }}>
        {label}
      </p>
      {badge != null && badge > 0 && (
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: badgeColor ?? T.red,
          background: (badgeColor ?? T.red) + '18',
          borderRadius: 20, padding: '2px 7px',
        }}>
          {badge}
        </span>
      )}
      {action && (
        <button onClick={onAction} style={{
          marginLeft: 'auto', fontSize: 12, color: T.brand,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: 600, padding: 0,
        }}>
          {action} →
        </button>
      )}
    </div>
  )
}

function Empty({ text }) {
  return (
    <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '24px 20px', margin: 0 }}>
      {text}
    </p>
  )
}

/* ─── Setup Checklist ────────────────────────────── */
const CHECKLIST_KEY = 'setup_checklist_done'
const ONBOARDING_KEY = 'onboarding_v1_done'

function SetupChecklist({ allApts }) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) === '1' && !localStorage.getItem(CHECKLIST_KEY)
  )
  const [hasRealContact, setHasRealContact] = useState(false)

  const hasRealApt = useMemo(
    () => allApts.some(a => !a.is_demo),
    [allApts]
  )

  const checkContacts = useCallback(async () => {
    try {
      const res = await apiService.getContacts(1, 20)
      const list = res?.contacts || []
      setHasRealContact(list.some(c => !c.is_demo))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!visible) return
    checkContacts()
    const onCleared = () => checkContacts()
    window.addEventListener('demo-cleared', onCleared)
    return () => window.removeEventListener('demo-cleared', onCleared)
  }, [visible, checkContacts])

  useEffect(() => {
    if (hasRealContact && hasRealApt && visible) {
      const t = setTimeout(() => {
        localStorage.setItem(CHECKLIST_KEY, '1')
        setVisible(false)
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [hasRealContact, hasRealApt, visible])

  if (!visible) return null

  const steps = [
    { label: 'Criou sua conta',               done: true },
    { label: 'Cadastrou um serviço',           done: true },
    { label: 'Configurou seu horário',         done: true },
    { label: 'Gerou seu link de agendamento',  done: true },
    { label: 'Adicione um cliente real',       done: hasRealContact, action: () => navigate('/contacts') },
    { label: 'Crie seu primeiro agendamento',  done: hasRealApt,     action: () => navigate('/appointments') },
  ]

  const done  = steps.filter(s => s.done).length
  const total = steps.length
  const pct   = Math.round((done / total) * 100)

  const dismiss = () => {
    localStorage.setItem(CHECKLIST_KEY, '1')
    setVisible(false)
  }

  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: '16px 20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>Primeiros passos</p>
          <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>{done} de {total} concluídos</p>
        </div>
        <button
          onClick={dismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4, display: 'flex' }}
          title="Fechar"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: T.border, borderRadius: 4, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: pct === 100 ? T.green : '#4C60AA',
          borderRadius: 4,
          transition: 'width 600ms ease',
        }} />
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((step, i) => (
          <div
            key={i}
            onClick={!step.done && step.action ? step.action : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: !step.done && step.action ? 'pointer' : 'default',
              opacity: step.done ? 0.6 : 1,
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: step.done ? T.green : T.chip,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: step.done ? 'none' : `1px solid ${T.border}`,
            }}>
              {step.done
                ? <Check size={10} strokeWidth={3} style={{ color: '#fff' }} />
                : <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.border }} />
              }
            </div>
            <p style={{
              fontSize: 13, margin: 0,
              color: step.done ? T.muted : T.text,
              fontWeight: step.done ? 400 : 500,
              textDecoration: step.done ? 'line-through' : 'none',
            }}>
              {step.label}
            </p>
            {!step.done && step.action && (
              <p style={{ fontSize: 11, color: '#4C60AA', margin: '0 0 0 auto', fontWeight: 600 }}>Fazer →</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Dashboard ──────────────────────────────────── */
export function Dashboard() {
  const isMobile   = useIsMobile()
  const breakpoint = useBreakpoint()
  const isNarrow   = isMobile || ['sm', 'md', 'lg'].includes(breakpoint) // <1280px (inclui zoom intermediário)
  const navigate   = useNavigate()
  const { user }  = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'você'

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  // Capitaliza apenas a primeira letra — evita "18 De Maio" com textTransform:capitalize
  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })
    .replace(/^\w/, c => c.toUpperCase())

  const [dashData,     setDashData]     = useState(null)
  const [statsData,    setStatsData]    = useState(null)
  const [recentTxs,    setRecentTxs]    = useState([])
  const [overdue,      setOverdue]      = useState([])
  const [todayCommits, setTodayCommits] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [loadingTxId,  setLoadingTxId]  = useState(null)
  const [recentPage,   setRecentPage]   = useState(1)
  const PER_PAGE = 5

  const updateTx = useUpdateTransaction()
  const { appointments: allApts, loading: aptsLoading } = useAppointments()

  const todayApts = useMemo(() =>
    allApts
      .filter(a => a.start_time && isSameDay(parseISO(a.start_time), new Date()))
      .sort((a, b) => parseISO(a.start_time) - parseISO(b.start_time)),
    [allApts]
  )

  // Ticket médio: receitas deste mês / sessões concluídas
  const monthCompleted = useMemo(() =>
    allApts.filter(a => {
      try { return isSameMonth(parseISO(a.start_time), new Date()) && normalizeStatus(a.status) === 'completed' }
      catch { return false }
    }).length,
    [allApts]
  )

  const load = async () => {
    try {
      setLoading(true); setError(null)
      const [dash, stats, recent, od, td] = await Promise.all([
        apiService.getDashboardData(),
        apiService.getDashboardStatistics().catch(() => null),
        apiService.getRecentTransactions(),
        apiService.getOverdueCommitments(),
        apiService.getTodayCommitments(),
      ])
      setDashData(dash)
      setStatsData(stats)
      setRecentTxs(recent.transactions || [])
      setOverdue(od.commitments || [])
      setTodayCommits(td.commitments || [])
    } catch { setError(true) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setRecentPage(1) }, [recentTxs])

  const handleTogglePaid = async (tx) => {
    try {
      setLoadingTxId(tx.id)
      const paid = !tx.paid
      await updateTx.mutateAsync({
        id: tx.id,
        data: {
          name: tx.name || tx.description,
          description: tx.description || tx.name,
          amount_cents: tx.amount_cents,
          amount_currency: tx.amount_currency || 'BRL',
          transaction_type_cd: tx.transaction_type_cd,
          due_date: tx.due_date,
          category_id: tx.category_id,
          cost_center_id: tx.cost_center_id,
          contact_id: tx.contact_id,
          bank_account_id: tx.bank_account_id,
          payment_method_cd: tx.payment_method_cd || 0,
          payment_type_cd: tx.payment_type_cd || 0,
          paid,
          paid_at: paid ? new Date().toISOString().split('T')[0] : null,
        },
      })
      setRecentTxs(p => p.map(t => t.id === tx.id ? { ...t, paid, paid_at: paid ? new Date().toISOString() : null } : t))
      setOverdue(p => p.filter(t => t.id !== tx.id))
      setTodayCommits(p => p.filter(t => t.id !== tx.id))
      await load()
    } catch { alert('Erro ao alterar status') }
    finally { setLoadingTxId(null) }
  }

  const weekData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    const days  = eachDayOfInterval({ start, end: endOfWeek(new Date(), { weekStartsOn: 1 }) })
    return days.map(d => ({
      dia:   format(d, 'EEE', { locale: ptBR }),
      valor: Math.random() * 800 + 200,
    }))
  }, [])

  const totalPages = Math.max(1, Math.ceil(recentTxs.length / PER_PAGE))
  const paginated  = recentTxs.slice((recentPage - 1) * PER_PAGE, recentPage * PER_PAGE)

  const receitas       = dashData?.receitas ?? 0
  const despesas       = dashData?.despesas ?? 0
  const saldo          = dashData?.saldo ?? 0
  const monthlyGrowth  = statsData?.monthly_growth ?? null
  const ticketMedio    = monthCompleted > 0 ? receitas / monthCompleted : null
  const pendente       = overdue.reduce((s, c) => s + (c.amount_cents ?? 0) / 100, 0)

  const growthPositive = monthlyGrowth !== null && monthlyGrowth >= 0
  const GrowthIcon     = growthPositive ? TrendingUp : TrendingDown
  const growthColor    = growthPositive ? T.green : T.red

  // Não usar early-return de loading — troca total do DOM causa CLS alto.
  // O layout é renderizado imediatamente; seções individuais mostram skeletons.

  return (
    <div data-testid="dashboard" style={{ display: 'flex', flexDirection: 'column', gap: 10, ...DISPLAY }}>

      {/* ══ 1. HERO — compacto ════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #1E2440 0%, #2C3560 60%, #1a2038 100%)',
        borderRadius: 12,
        padding: isNarrow ? '14px 16px' : '18px 24px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
        boxShadow: '0 4px 20px rgba(30,36,64,0.18)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* subtle decorative ring */}
        <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: -10, top: -10, width: 100, height: 100, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

        {/* Saudação — dados síncronos, renderiza imediatamente */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ fontSize: isNarrow ? 16 : 18, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            {greeting}, {firstName}.
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {todayLabel}
          </p>
        </div>

        {/* Métricas — sempre 3 slots fixos para evitar layout shift */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: isNarrow ? 16 : 28 }}>
          {/* Hoje — de React Query (não bloqueia hero) */}
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: isNarrow ? 16 : 18, fontWeight: 700, color: T.amber, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {todayApts.length > 0 ? String(todayApts.length) : '—'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Hoje</p>
          </div>

          {/* Recebido — slot de tamanho fixo: skeleton ou valor */}
          <div style={{ textAlign: 'right', minWidth: 80 }}>
            {loading
              ? <Sk w={80} h={18} r={4} />
              : <p style={{ fontSize: isNarrow ? 16 : 18, fontWeight: 700, color: T.green, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{fmtBRL(receitas)}</p>
            }
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, marginTop: loading ? 4 : 0 }}>Recebido</p>
          </div>

          {/* Pendente — sempre presente; invisível quando zero para não remover espaço */}
          <div style={{ textAlign: 'right', minWidth: 72, visibility: (!loading && pendente === 0) ? 'hidden' : 'visible' }}>
            {loading
              ? <Sk w={72} h={18} r={4} />
              : <p style={{ fontSize: isNarrow ? 16 : 18, fontWeight: 700, color: '#F87171', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{fmtBRL(pendente)}</p>
            }
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, marginTop: loading ? 4 : 0 }}>Pendente</p>
          </div>
        </div>
      </div>

      {/* ══ 2. AÇÕES RÁPIDAS — antes do grid ══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { icon: Calendar, label: isNarrow ? 'Consulta' : 'Nova consulta',  path: '/appointments' },
          { icon: Plus,     label: isNarrow ? 'Transação' : 'Nova transação', path: '/transactions' },
          { icon: User,     label: isNarrow ? 'Paciente' : 'Novo paciente',   path: '/contacts' },
          { icon: FileText, label: 'Relatórios',                               path: '/reports' },
        ].map((a, i) => {
          const Icon = a.icon
          return (
            <button
              key={i}
              onClick={() => navigate(a.path)}
              style={{
                background: T.white, border: `1px solid ${T.border}`, borderRadius: 10,
                padding: isNarrow ? '10px 6px' : '12px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: isNarrow ? 'center' : 'flex-start',
                flexDirection: isNarrow ? 'column' : 'row',
                gap: isNarrow ? 6 : 10, textAlign: isNarrow ? 'center' : 'left',
                fontFamily: 'inherit', transition: 'border-color 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.brand}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <div style={{ width: 30, height: 30, borderRadius: 8, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} style={{ color: T.brand }} />
              </div>
              <p style={{ fontSize: isNarrow ? 11 : 13, fontWeight: 600, color: T.text, margin: 0, whiteSpace: isNarrow ? 'normal' : 'nowrap' }}>{a.label}</p>
            </button>
          )
        })}
      </div>

      <SetupChecklist allApts={allApts} />

      {/* Erro inline — não bloqueia layout, aparece como banner */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: T.red + '10', border: `1px solid ${T.red}30`,
          borderRadius: 10, padding: '10px 16px',
        }}>
          <AlertCircle size={15} style={{ color: T.red, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: T.red, margin: 0 }}>
            Erro ao carregar dados.{' '}
            <button onClick={load} style={{ color: T.red, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline' }}>
              Tentar novamente
            </button>
          </p>
        </div>
      )}

      {/* ══ 4. GRID ═══════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '3fr 2fr', gap: 10, alignItems: 'start' }}>

        {/* ─ Col esquerda ───────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Agenda do dia */}
          <Panel>
            <SectionHeader
              label={`Agenda de hoje · ${format(new Date(), 'd MMM', { locale: ptBR })}`}
              action="Ver agenda"
              onAction={() => navigate('/appointments')}
            />
            <div style={{ padding: '0 20px 16px' }}>
              {(loading || aptsLoading) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 14, borderRadius: 4, background: T.border, animation: 'skpulse 1.4s ease-in-out infinite', animationDelay: `${i * 80}ms` }} />
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: T.border, flexShrink: 0, animation: 'skpulse 1.4s ease-in-out infinite', animationDelay: `${i * 80}ms` }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ width: '60%', height: 13, borderRadius: 4, background: T.border, marginBottom: 4, animation: 'skpulse 1.4s ease-in-out infinite', animationDelay: `${i * 80}ms` }} />
                        <div style={{ width: '40%', height: 11, borderRadius: 4, background: T.border, animation: 'skpulse 1.4s ease-in-out infinite', animationDelay: `${i * 80 + 60}ms` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : todayApts.length === 0 ? (
                <div style={{ padding: '12px 0 8px' }}>
                  <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Nenhum atendimento agendado para hoje.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {todayApts.slice(0, 8).map((apt, i) => {
                    const st      = normalizeStatus(apt.status)
                    const meta    = STATUS[st] ?? STATUS.pending
                    const time    = format(parseISO(apt.start_time), 'HH:mm')
                    const client  = apt?.client?.name || apt?.contact?.name || 'Paciente'
                    const initial = client.charAt(0).toUpperCase()
                    const svc     = apt?.service?.name || ''
                    const isLast  = i === Math.min(todayApts.length, 8) - 1
                    const isPending = st === 'pending'
                    return (
                      <div
                        key={apt.id}
                        onClick={() => navigate('/appointments')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 0',
                          borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                          cursor: 'pointer',
                          borderLeft: `3px solid ${meta.color}`,
                          paddingLeft: 10,
                          marginLeft: -10,
                          borderRadius: 0,
                          transition: 'background 100ms',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = T.bg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.muted, width: 38, flexShrink: 0, letterSpacing: '0.01em' }}>
                          {time}
                        </span>
                        {/* Iniciais do paciente */}
                        <div style={{
                          width: 28, height: 28, borderRadius: 7, background: meta.color + '20',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{initial}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {client}
                          </p>
                          {svc && <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{svc}</p>}
                        </div>
                        {isPending ? (
                          <button
                            onClick={e => { e.stopPropagation(); navigate('/appointments') }}
                            style={{
                              fontSize: 11, fontWeight: 600, color: T.brand,
                              background: T.chip, border: `1px solid #DDE3F5`, borderRadius: 6,
                              padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                            }}
                          >
                            Confirmar
                          </button>
                        ) : (
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: meta.color,
                            background: meta.color + '18', borderRadius: 20,
                            padding: '3px 8px', flexShrink: 0,
                          }}>
                            {meta.label}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {todayApts.length > 8 && (
                    <p style={{ fontSize: 12, color: T.brand, margin: '10px 0 0', cursor: 'pointer' }}
                       onClick={() => navigate('/appointments')}>
                      +{todayApts.length - 8} mais atendimentos →
                    </p>
                  )}
                </div>
              )}
            </div>
          </Panel>

          {/* Transações recentes */}
          <Panel>
            <SectionHeader
              label="Transações recentes"
              action="Ver pendentes"
              onAction={() => navigate('/transactions', { state: { filter: 'overdue' } })}
            />
            <div style={{ padding: '0 20px 16px' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: i < 5 ? `1px solid ${T.border}` : 'none' }}>
                      <div style={{ width: 3, height: 28, borderRadius: 2, background: T.border, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ width: `${50 + (i * 11 % 35)}%`, height: 13, borderRadius: 4, background: T.border, marginBottom: 4, animation: 'skpulse 1.4s ease-in-out infinite', animationDelay: `${i * 60}ms` }} />
                        <div style={{ width: '35%', height: 11, borderRadius: 4, background: T.border, animation: 'skpulse 1.4s ease-in-out infinite', animationDelay: `${i * 60 + 50}ms` }} />
                      </div>
                      <div style={{ width: 72, height: 14, borderRadius: 4, background: T.border, animation: 'skpulse 1.4s ease-in-out infinite', animationDelay: `${i * 60}ms` }} />
                    </div>
                  ))}
                </div>
              ) : paginated.length === 0 ? <Empty text="Nenhuma transação recente" /> : (
                <>
                  {paginated.map((tx, i) => {
                    const isRec  = tx.transaction_type_cd === 0
                    const isLast = i === paginated.length - 1
                    return (
                      <div
                        key={tx.id}
                        onClick={() => navigate('/transactions', { state: { search: tx.description || tx.name } })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '9px 0',
                          borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                          cursor: 'pointer', borderRadius: 6, transition: 'background 100ms',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = T.bg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Indicador receita/despesa */}
                        <div style={{
                          width: 3, height: 28, borderRadius: 2, flexShrink: 0,
                          background: isRec ? T.green : '#E5E7EB',
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.description || tx.name || 'Sem descrição'}
                          </p>
                          <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>
                            {tx.category?.name || 'Sem categoria'} · {fmtDate(tx.due_date)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: isRec ? T.green : T.text }}>
                            {isRec ? '+' : '−'}{fmtBRL(tx.amount_cents / 100)}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); handleTogglePaid(tx) }}
                            disabled={loadingTxId !== null}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                            title={tx.paid ? 'Marcar como não pago' : 'Registrar pagamento'}
                          >
                            {loadingTxId === tx.id
                              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: T.brand }} />
                              : <CheckCircle2 size={14} style={{ color: tx.paid ? T.green : T.border }} />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, marginTop: 2, borderTop: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 12, color: T.muted }}>
                        {(recentPage - 1) * PER_PAGE + 1}–{Math.min(recentPage * PER_PAGE, recentTxs.length)} de {recentTxs.length}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setRecentPage(p => p - 1)} disabled={recentPage === 1}
                          style={{ fontSize: 14, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', opacity: recentPage === 1 ? 0.3 : 1 }}>‹</button>
                        <button onClick={() => setRecentPage(p => p + 1)} disabled={recentPage === totalPages}
                          style={{ fontSize: 14, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', opacity: recentPage === totalPages ? 0.3 : 1 }}>›</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Panel>
        </div>

        {/* ─ Col direita ────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Fluxo do mês */}
          <Panel>
            <div style={{ padding: '16px 16px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, margin: '0 0 10px' }}>
                Fluxo do mês
              </p>

              {/* Receitas + variação — altura fixa para evitar CLS */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                {loading
                  ? <div style={{ width: 130, height: 28, borderRadius: 6, background: T.border, animation: 'skpulse 1.4s ease-in-out infinite' }} />
                  : <p style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>{fmtBRL(receitas)}</p>
                }
                {/* Badge de crescimento — visibilidade condicional, espaço sempre reservado */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: (!loading && monthlyGrowth !== null) ? growthColor + '15' : 'transparent',
                  borderRadius: 20, padding: '3px 8px',
                  visibility: (!loading && monthlyGrowth !== null) ? 'visible' : 'hidden',
                  minWidth: 52,
                }}>
                  <GrowthIcon size={11} style={{ color: growthColor }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: growthColor }}>
                    {monthlyGrowth !== null ? `${Math.abs(monthlyGrowth).toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: T.muted, margin: '0 0 12px', minHeight: 18 }}>
                {loading ? '' : monthlyGrowth !== null
                  ? `${growthPositive ? 'acima' : 'abaixo'} do mês anterior`
                  : `${fmtBRL(despesas)} em despesas`}
              </p>

              {/* Métricas secundárias */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                <div style={{ background: T.bg, borderRadius: 7, padding: '8px 10px' }}>
                  <p style={{ fontSize: 11, color: T.muted, margin: '0 0 2px' }}>Ticket médio</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>
                    {ticketMedio !== null ? fmtBRL(ticketMedio) : '—'}
                  </p>
                </div>
                <div style={{ background: T.bg, borderRadius: 7, padding: '8px 10px' }}>
                  <p style={{ fontSize: 11, color: T.muted, margin: '0 0 2px' }}>Sessões concluídas</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>
                    {monthCompleted > 0 ? monthCompleted : '—'}
                  </p>
                </div>
              </div>

              {/* Sparkline */}
              <div>
                <p style={{ fontSize: 10, color: T.muted, margin: '0 0 4px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Semana atual
                </p>
                <div style={{ height: 48, margin: '0 -4px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weekData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={T.brand} stopOpacity={0.18} />
                          <stop offset="100%" stopColor={T.brand} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="dia" tick={{ fontSize: 9, fill: T.muted }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, ...DISPLAY }}
                        formatter={v => [fmtBRL(v), 'Recebido']}
                      />
                      <Area type="monotone" dataKey="valor" stroke={T.brand} strokeWidth={1.5} fill="url(#areaGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Saldo */}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.muted }}>Saldo líquido</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: saldo >= 0 ? T.green : T.red }}>
                  {fmtBRL(saldo)}
                </span>
              </div>
            </div>
          </Panel>

          {/* Cobranças pendentes */}
          <Panel>
            <SectionHeader
              label="Cobranças pendentes"
              badge={overdue.length}
              badgeColor={T.red}
              action={overdue.length > 3 ? 'Ver todas' : undefined}
              onAction={() => navigate('/transactions', { state: { filter: 'overdue' } })}
            />
            <div style={{ padding: '0 20px 16px' }}>
              {overdue.length === 0 ? (
                <p style={{ fontSize: 13, color: T.green, margin: 0, fontWeight: 600 }}>
                  Nenhuma cobrança em aberto 🎉
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {overdue.slice(0, 4).map((c, i) => {
                    const isLast = i === Math.min(overdue.length, 4) - 1
                    return (
                      <div
                        key={c.id}
                        onClick={() => navigate('/transactions', { state: { search: c.description || c.name } })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 0',
                          borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                          cursor: 'pointer', borderRadius: 6, transition: 'background 100ms',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = T.bg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 3, height: 24, borderRadius: 2, background: T.red, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.description || c.name || 'Sem descrição'}
                          </p>
                          <p style={{ fontSize: 12, color: T.red, margin: 0 }}>
                            Venceu {fmtDate(c.due_date)} · {fmtBRL(c.amount_cents / 100)}
                          </p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); handleTogglePaid(c) }}
                          disabled={loadingTxId !== null}
                          style={{
                            fontSize: 11, fontWeight: 600, color: T.brand,
                            background: T.chip, border: '1px solid #DDE3F5', borderRadius: 6,
                            padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          {loadingTxId === c.id
                            ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                            : 'Registrar'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Panel>


          {/* Compromissos do dia — sempre renderizado para evitar layout shift */}
          <Panel>
            <SectionHeader
              label={loading
                ? 'Compromissos hoje'
                : `${todayCommits.length} compromisso${todayCommits.length !== 1 ? 's' : ''} hoje`}
              action={!loading && todayCommits.length > 0 ? 'Ver' : undefined}
              onAction={() => navigate('/transactions', { state: { filter: 'today' } })}
            />
            <div style={{ padding: '0 20px 16px' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1, 2].map(i => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 2 ? `1px solid ${T.border}` : 'none' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ width: `${55 + i * 20}%`, height: 13, borderRadius: 4, background: T.border, animation: 'skpulse 1.4s ease-in-out infinite', animationDelay: `${i * 80}ms` }} />
                      </div>
                      <div style={{ width: 60, height: 13, borderRadius: 4, background: T.border, animation: 'skpulse 1.4s ease-in-out infinite', animationDelay: `${i * 80}ms` }} />
                    </div>
                  ))}
                </div>
              ) : todayCommits.length === 0 ? (
                <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Sem compromissos para hoje.</p>
              ) : (
                todayCommits.slice(0, 3).map((c, i) => {
                  const isRec  = c.transaction_type_cd === 0
                  const isLast = i === Math.min(todayCommits.length, 3) - 1
                  return (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                        padding: '10px 0',
                        borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                      }}
                    >
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.description || c.name || 'Sem descrição'}
                      </p>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isRec ? T.green : T.text, flexShrink: 0 }}>
                        {isRec ? '+' : '−'}{fmtBRL(c.amount_cents / 100)}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </Panel>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes skpulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
      `}</style>
    </div>
  )
}
