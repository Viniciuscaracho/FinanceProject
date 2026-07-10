import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, AlertCircle, Loader2, Clock, ChevronRight, Activity, Zap, Dumbbell, HeartPulse } from 'lucide-react'
import { apiService } from '@/lib/api'
import { T } from '@/lib/tokens'

function timeAgo(isoString) {
  if (!isoString) return null
  const diff = Date.now() - new Date(isoString).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 7) return `há ${days} dias`
  if (days < 30) return `há ${Math.floor(days / 7)} sem.`
  return `há ${Math.floor(days / 30)} meses`
}

export function CoachingDashboard() {
  const navigate = useNavigate()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiService.getCoachingDashboard()
      .then(res => setData(res))
      .catch(() => setData({ alerts: [], active_contacts: [], total_events: 0 }))
      .finally(() => setLoading(false))
  }, [])

  const alerts          = data?.alerts || []
  const activeContacts  = data?.active_contacts || []
  const totalEvents     = data?.total_events || 0
  const sumiu           = alerts.filter(a => a.alert_type === 'sumiu')
  const semFeedback     = alerts.filter(a => a.alert_type === 'sem_feedback')
  const dor             = alerts.filter(a => a.alert_type === 'reclamou_de_dor')
  const frequencia      = alerts.filter(a => a.alert_type === 'perdeu_frequencia')
  const reavaliacoes    = alerts.filter(a => a.alert_type === 'reavaliacao_proxima')
  const hasAnything     = alerts.length > 0 || activeContacts.length > 0

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Loader2 size={24} className="animate-spin" style={{ color: T.brand }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Brain size={22} style={{ color: T.brand }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Coaching</h1>
        {totalEvents > 0 && (
          <span style={{ fontSize: 12, color: T.muted, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, padding: '2px 10px', marginLeft: 'auto' }}>
            {totalEvents} registro{totalEvents !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {!hasAnything ? (
        /* Empty state */
        <div style={{ textAlign: 'center', padding: '48px 24px', color: T.muted }}>
          <Brain size={36} style={{ color: T.border, marginBottom: 16, margin: '0 auto 16px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8 }}>Nenhuma atividade de coaching ainda</p>
          <p style={{ fontSize: 13, color: T.muted, maxWidth: 360, margin: '0 auto 24px' }}>
            Abra o perfil de um atleta, vá na seção <strong>Coaching</strong> e registre a primeira nota.
            A IA vai estruturar automaticamente.
          </p>
          <button
            onClick={() => navigate('/contacts')}
            style={{ fontSize: 13, fontWeight: 600, color: T.brand, background: 'transparent', border: `1.5px solid ${T.brand}`, borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}
          >
            Ver atletas
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Alertas críticos — sumiu + dor */}
          {(sumiu.length > 0 || dor.length > 0) && (
            <div>
              <SectionTitle icon={AlertCircle} color="#EF4444" label="Ação urgente" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sumiu.map(a => (
                  <ContactRow
                    key={`su-${a.contact_id}`}
                    name={a.contact_name}
                    badge={{ color: '#EF4444', text: `sumiu há ${a.days_since}d` }}
                    onClick={() => navigate(`/contacts/${a.contact_id}`)}
                  />
                ))}
                {dor.map(a => (
                  <ContactRow
                    key={`dor-${a.contact_id}`}
                    name={a.contact_name}
                    badge={{ color: '#EF4444', text: a.days_since != null ? `dor há ${a.days_since}d` : 'relatou dor' }}
                    onClick={() => navigate(`/contacts/${a.contact_id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Alertas de atenção — sem feedback + frequência + reavaliação */}
          {(semFeedback.length > 0 || frequencia.length > 0 || reavaliacoes.length > 0) && (
            <div>
              <SectionTitle icon={AlertCircle} color="#F59E0B" label="Atenção necessária" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {semFeedback.map(a => (
                  <ContactRow
                    key={`sf-${a.contact_id}`}
                    name={a.contact_name}
                    badge={{ color: '#F59E0B', text: a.days_since != null ? `sem registro há ${a.days_since}d` : 'nunca registrado' }}
                    onClick={() => navigate(`/contacts/${a.contact_id}`)}
                  />
                ))}
                {frequencia.map(a => (
                  <ContactRow
                    key={`fr-${a.contact_id}`}
                    name={a.contact_name}
                    badge={{ color: '#F59E0B', text: `sem consulta há ${a.days_since}d` }}
                    onClick={() => navigate(`/contacts/${a.contact_id}`)}
                  />
                ))}
                {reavaliacoes.map(a => (
                  <ContactRow
                    key={`re-${a.contact_id}`}
                    name={a.contact_name}
                    badge={{ color: '#3B82F6', text: a.days_until != null ? `reavaliação em ${a.days_until}d` : 'reavaliação hoje' }}
                    onClick={() => navigate(`/contacts/${a.contact_id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Atividade recente */}
          {activeContacts.length > 0 && (
            <div>
              <SectionTitle icon={Activity} color={T.brand} label="Atletas com coaching ativo" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeContacts.map(c => (
                  <ContactRow
                    key={c.contact_id}
                    name={c.contact_name}
                    badge={{ color: T.muted, text: `${c.events_count} registro${c.events_count !== 1 ? 's' : ''}` }}
                    meta={timeAgo(c.last_event_at)}
                    onClick={() => navigate(`/contacts/${c.contact_id}`)}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function SectionTitle({ icon: Icon, color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      <Icon size={13} style={{ color }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  )
}

function ContactRow({ name, badge, meta, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: T.white, border: `1px solid ${T.border}`,
        borderRadius: 12, cursor: 'pointer', transition: 'border-color 0.15s'
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = T.brand}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: T.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: T.brand, flexShrink: 0
        }}>
          {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {badge && (
          <span style={{ fontSize: 11, color: badge.color, background: `${badge.color}18`, borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
            {badge.text}
          </span>
        )}
        {meta && (
          <span style={{ fontSize: 11, color: T.muted, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={10} />
            {meta}
          </span>
        )}
        <ChevronRight size={14} style={{ color: T.border }} />
      </div>
    </div>
  )
}
