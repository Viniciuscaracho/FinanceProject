import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Brain, AlertCircle, Loader2, Clock, Activity, TrendingUp, TrendingDown, Minus, Users, User } from 'lucide-react'
import { apiService } from '@/lib/api'
import { T } from '@/lib/tokens'
import { useAuth } from '@/contexts/AuthContext'
import { CoachingOnboarding, useCoachingOnboarding } from '@/components/coaching/CoachingOnboarding'
import { AthleteDashboard } from './AthleteDashboard'

const BRAND = '#4C60AA'
const ADMIN_VIEW_KEY = 'orbi_admin_view'

function AdminViewToggle({ viewMode, onSwitch, switching }) {
  const tabs = [
    { key: 'trainer', label: 'Treinador', icon: Users },
    { key: 'athlete', label: 'Atleta',    icon: User  },
  ]
  return (
    <div style={{
      display: 'inline-flex', borderRadius: 8,
      border: `1px solid ${T.border}`, overflow: 'hidden',
      background: T.bg,
    }}>
      {tabs.map(({ key, label, icon: Icon }) => {
        const active = viewMode === key
        return (
          <button
            key={key}
            onClick={() => !active && !switching && onSwitch(key)}
            disabled={switching}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', border: 'none', cursor: active || switching ? 'default' : 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: active ? 700 : 500,
              background: active ? BRAND : 'transparent',
              color: active ? '#fff' : T.muted,
              transition: 'all 140ms',
            }}
          >
            {switching && key !== viewMode
              ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              : <Icon size={12} />
            }
            {label}
          </button>
        )
      })}
    </div>
  )
}

const WA_LINK = 'https://wa.me/5511989324130'
const WA_NUMBER_DISPLAY = '(11) 98932-4130'

function WhatsAppBanner() {
  return (
    <a
      href={WA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: '#F0FDF4', border: '1px solid #BBF7D0',
        borderRadius: 12, textDecoration: 'none',
        transition: 'border-color 140ms',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#25D366'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#BBF7D0'}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: '#25D366',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg viewBox="0 0 24 24" width={18} height={18} fill="#fff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#15803D' }}>
          Registre via WhatsApp
        </p>
        <p style={{ margin: '1px 0 0', fontSize: 12, color: '#16A34A' }}>
          Envie um áudio para {WA_NUMBER_DISPLAY} — a IA estrutura e salva automaticamente.
        </p>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#15803D', flexShrink: 0 }}>
        Testar →
      </span>
    </a>
  )
}

/* ─── helpers ─────────────────────────────────────────────────────── */
function timeAgo(iso) {
  if (!iso) return null
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d === 0) return 'hoje'
  if (d === 1) return 'ontem'
  if (d < 7)  return `${d}d atrás`
  if (d < 30) return `${Math.floor(d / 7)}sem atrás`
  return `${Math.floor(d / 30)}m atrás`
}

function parseCarga(str) {
  if (!str) return null
  const frac = str.match(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+)/)
  if (frac) return parseFloat(frac[1]) / parseFloat(frac[2]) * 10
  const num = str.match(/(\d+(?:[.,]\d+)?)/)
  if (num) { const v = parseFloat(num[1]); return v <= 10 ? v : null }
  const l = str.toLowerCase()
  if (/baixa|leve/.test(l)) return 3
  if (/modera/.test(l))     return 5
  if (/alta|intensa/.test(l)) return 8
  if (/máxima|maxima/.test(l)) return 10
  return null
}

/* ─── MiniSparkline SVG ───────────────────────────────────────────── */
function MiniSparkline({ values, color = '#F59E0B', w = 72, h = 28 }) {
  const nums = values.map(v => parseCarga(v)).filter(v => v != null)
  if (nums.length < 2) return null
  const max = Math.max(...nums)
  const min = Math.min(...nums)
  const range = max - min || 1
  const pad = 3
  const pts = nums.map((v, i) => {
    const x = pad + (i / (nums.length - 1)) * (w - pad * 2)
    const y = pad + (1 - (v - min) / range) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
      {/* último ponto destacado */}
      {(() => {
        const last = pts.split(' ').pop().split(',')
        return <circle cx={last[0]} cy={last[1]} r={3} fill={color} />
      })()}
    </svg>
  )
}

/* ─── Trend arrow ────────────────────────────────────────────────── */
function TrendArrow({ values, type = 'carga' }) {
  const nums = (type === 'carga' ? values.map(v => parseCarga(v)) : values.map(v => {
    if (!v) return null
    const m = v.match(/(\d+(?:[.,]\d+)?)/)
    return m ? parseFloat(m[1]) : null
  })).filter(v => v != null)

  if (nums.length < 2) return null
  const last = nums[0]
  const prev = nums[1]
  const delta = last - prev
  if (Math.abs(delta) < 0.5) return <Minus size={12} style={{ color: T.muted }} />
  if (delta > 0) return <TrendingUp size={12} style={{ color: '#10B981' }} />
  return <TrendingDown size={12} style={{ color: '#EF4444' }} />
}

/* ─── Alert badge colors ─────────────────────────────────────────── */
const ALERT_COLOR = {
  sumiu:             '#EF4444',
  reclamou_de_dor:   '#EF4444',
  sem_feedback:      '#F59E0B',
  perdeu_frequencia: '#F59E0B',
  reavaliacao_proxima: '#3B82F6',
}
const ALERT_LABEL = {
  sumiu:             'Sumiu',
  reclamou_de_dor:   'Dor',
  sem_feedback:      'Sem registro',
  perdeu_frequencia: 'Perdeu freq.',
  reavaliacao_proxima: 'Reavaliação',
}

/* ─── Athlete card ───────────────────────────────────────────────── */
function AthleteCard({ contact, alert, navigate }) {
  const initial = contact.contact_name?.charAt(0)?.toUpperCase() || '?'
  const daysAgo = contact.last_event_at
    ? Math.floor((Date.now() - new Date(contact.last_event_at).getTime()) / 86400000)
    : null
  const alertColor = alert ? ALERT_COLOR[alert.alert_type] : null
  const borderColor = alertColor || T.border

  return (
    <div
      onClick={() => navigate(`/contacts/${contact.contact_id}`)}
      style={{
        background: T.white, border: `1.5px solid ${borderColor}`,
        borderRadius: 12, padding: '14px', cursor: 'pointer',
        transition: 'border-color 140ms, box-shadow 140ms',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = alertColor || '#4C60AA'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(76,96,170,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: alertColor ? alertColor + '18' : T.chip,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: alertColor || '#4C60AA',
        }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contact.contact_name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Clock size={10} style={{ color: T.muted }} />
            <span style={{ fontSize: 11, color: T.muted }}>{timeAgo(contact.last_event_at) || '—'}</span>
            <span style={{ fontSize: 11, color: T.muted }}>·</span>
            <span style={{ fontSize: 11, color: T.muted }}>{contact.events_count} reg.</span>
          </div>
        </div>
        {alert && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: alertColor,
            background: alertColor + '15', borderRadius: 20,
            padding: '2px 7px', flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            {ALERT_LABEL[alert.alert_type]}
          </span>
        )}
      </div>

      {/* Sparkline + trend */}
      {contact.recent_carga?.length >= 2 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>Carga</span>
            <MiniSparkline values={[...contact.recent_carga].reverse()} color="#F59E0B" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendArrow values={contact.recent_carga} type="carga" />
            {contact.last_carga && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B' }}>{contact.last_carga}</span>
            )}
          </div>
        </div>
      )}

      {/* Sono + trend */}
      {contact.last_sono && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>Sono</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#6366F1' }}>{contact.last_sono}</span>
          {contact.recent_sono?.length >= 2 && (
            <TrendArrow values={contact.recent_sono} type="sono" />
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Alert row ──────────────────────────────────────────────────── */
function AlertRow({ alert, navigate }) {
  const color = ALERT_COLOR[alert.alert_type] || T.muted
  const label = ALERT_LABEL[alert.alert_type] || alert.alert_type
  const sub = alert.days_since != null
    ? `há ${alert.days_since} dias`
    : alert.days_until != null ? `em ${alert.days_until} dias` : ''

  return (
    <div
      onClick={() => navigate(`/contacts/${alert.contact_id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', background: T.white,
        border: `1px solid ${color}30`, borderRadius: 10, cursor: 'pointer',
        transition: 'border-color 120ms',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = `${color}30`}
    >
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color, flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{alert.contact_name}</span>
        {sub && <span style={{ fontSize: 12, color: T.muted, marginLeft: 8 }}>{sub}</span>}
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700, color,
        background: color + '15', borderRadius: 20, padding: '2px 8px', flexShrink: 0,
      }}>
        {label}
      </span>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────── */
export function CoachingDashboard() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const { user }       = useAuth()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)

  const isAdmin           = !!(user?.admin || user?.account_owner || user?.account_admin)
  const hasAthleteSetup   = !!user?.account?.self_contact_id
  const [viewMode, setViewMode] = useState('trainer')

  // Quando o user carrega, aplica a view correta baseada em admin/localStorage
  useEffect(() => {
    if (!user) return
    const admin = !!(user.admin || user.account_owner || user.account_admin)
    console.log('[Orbi] user loaded — admin:', user.admin, 'account_owner:', user.account_owner, 'account_admin:', user.account_admin, 'resolved isAdmin:', admin, 'self_contact_id:', user.account?.self_contact_id)
    if (admin) {
      setViewMode(localStorage.getItem(ADMIN_VIEW_KEY) || 'trainer')
    } else if (user.account?.self_contact_id) {
      setViewMode('athlete')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const isAthlete = viewMode === 'athlete'

  const handleAdminSwitch = async (target) => {
    if (target === 'athlete' && !hasAthleteSetup) {
      setSwitching(true)
      try {
        await apiService.setupAthlete()
        localStorage.setItem(ADMIN_VIEW_KEY, 'athlete')
        window.location.reload()
      } catch {
        setSwitching(false)
      }
      return
    }
    localStorage.setItem(ADMIN_VIEW_KEY, target)
    setViewMode(target)
  }

  // Dev reset: limpa localStorage e reseta conta, força reload para rebuscar user
  useEffect(() => {
    if (!searchParams.has('reset_onboarding')) return
    localStorage.removeItem('coaching_onboard_v1')
    localStorage.removeItem(ADMIN_VIEW_KEY)
    if (import.meta.env.DEV) {
      apiService.request('/athlete/dev_reset', { method: 'POST' })
        .catch(() => {})
        .finally(() => { window.location.replace('/coaching') })
    } else {
      navigate('/coaching', { replace: true })
    }
  }, [])

  // Carrega dashboard do treinador (não executa se for atleta)
  useEffect(() => {
    if (isAthlete) return
    apiService.getCoachingDashboard()
      .then(res => setData(res))
      .catch(() => setData({ alerts: [], active_contacts: [], total_events: 0 }))
      .finally(() => setLoading(false))
  }, [isAthlete])

  const alerts      = data?.alerts || []
  const contacts    = data?.active_contacts || []
  const totalEvents = data?.total_events || 0

  const { show: showOnboarding, dismiss: dismissOnboarding } = useCoachingOnboarding(contacts, loading ? undefined : totalEvents)
  const urgent    = alerts.filter(a => ['sumiu', 'reclamou_de_dor'].includes(a.alert_type))
  const attention = alerts.filter(a => ['sem_feedback', 'perdeu_frequencia', 'reavaliacao_proxima'].includes(a.alert_type))

  const alertByContact = {}
  alerts.forEach(a => { alertByContact[a.contact_id] = a })

  if (isAthlete) return (
    <>
      {isAdmin && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '12px 16px 0' }}>
          <AdminViewToggle viewMode={viewMode} onSwitch={handleAdminSwitch} switching={switching} />
        </div>
      )}
      <AthleteDashboard />
    </>
  )

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#4C60AA' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {showOnboarding && (
        <CoachingOnboarding contacts={contacts} onDone={dismissOnboarding} />
      )}

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <Brain size={20} style={{ color: '#4C60AA' }} />
          <h1 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: 0 }}>Coaching</h1>
          {isAdmin && (
            <AdminViewToggle viewMode={viewMode} onSwitch={handleAdminSwitch} switching={switching} />
          )}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Atletas',  value: contacts.length },
            { label: 'Alertas',  value: alerts.length,  color: alerts.length > 0 ? '#EF4444' : undefined },
            { label: 'Registros', value: totalEvents },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: s.color || T.text, margin: 0, lineHeight: 1 }}>
                {s.value}
              </p>
              <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <WhatsAppBanner />

      {/* ── Alertas urgentes ────────────────────────────────────── */}
      {urgent.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <AlertCircle size={13} style={{ color: '#EF4444' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Ação urgente
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {urgent.map(a => <AlertRow key={`u-${a.contact_id}`} alert={a} navigate={navigate} />)}
          </div>
        </section>
      )}

      {/* ── Atenção necessária ──────────────────────────────────── */}
      {attention.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <AlertCircle size={13} style={{ color: '#F59E0B' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Atenção necessária
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {attention.map(a => <AlertRow key={`a-${a.contact_id}`} alert={a} navigate={navigate} />)}
          </div>
        </section>
      )}

      {/* ── Grid de atletas ─────────────────────────────────────── */}
      {contacts.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Activity size={13} style={{ color: '#4C60AA' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Atletas com coaching ativo
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 10,
          }}>
            {contacts.map(c => (
              <AthleteCard
                key={c.contact_id}
                contact={c}
                alert={alertByContact[c.contact_id]}
                navigate={navigate}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state ─────────────────────────────────────────── */}
      {!loading && contacts.length === 0 && alerts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Brain size={36} style={{ color: T.border, margin: '0 auto 16px', display: 'block' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8 }}>Nenhuma atividade ainda</p>
          <p style={{ fontSize: 13, color: T.muted, maxWidth: 320, margin: '0 auto 20px' }}>
            Abra o perfil de um atleta e registre a primeira nota de coaching.
          </p>
          <button
            onClick={() => navigate('/contacts')}
            style={{ fontSize: 13, fontWeight: 600, color: '#4C60AA', background: 'transparent', border: '1.5px solid #4C60AA', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}
          >
            Ver atletas
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
