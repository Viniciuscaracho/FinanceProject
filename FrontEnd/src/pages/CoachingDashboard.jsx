import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, AlertCircle, Calendar, Loader2 } from 'lucide-react'
import { apiService } from '@/lib/api'
import { T } from '@/lib/tokens'

export function CoachingDashboard() {
  const navigate = useNavigate()
  const [alerts, setAlerts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiService.getCoachingAlerts()
      .then(res => setAlerts(res.alerts || []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }, [])

  const semFeedback    = alerts.filter(a => a.alert_type === 'sem_feedback')
  const reavaliacoes   = alerts.filter(a => a.alert_type === 'reavaliacao_proxima')

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Brain size={22} style={{ color: T.brand }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Coaching</h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 size={24} className="animate-spin" style={{ color: T.brand }} />
        </div>
      ) : alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: T.muted }}>
          <Brain size={32} style={{ color: T.border, marginBottom: 12 }} />
          <p style={{ fontSize: 14 }}>Nenhum alerta no momento. Continue registrando evoluções!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {semFeedback.length > 0 && (
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
                Sem feedback recente
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {semFeedback.map(a => (
                  <div key={a.contact_id}
                    onClick={() => navigate(`/contacts/${a.contact_id}`)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AlertCircle size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{a.contact_name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: T.muted }}>
                      {a.days_since != null ? `há ${a.days_since} dias` : 'nunca registrado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reavaliacoes.length > 0 && (
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
                Reavaliações próximas
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reavaliacoes.map(a => (
                  <div key={a.contact_id}
                    onClick={() => navigate(`/contacts/${a.contact_id}`)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Calendar size={16} style={{ color: '#3B82F6', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{a.contact_name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: T.muted }}>
                      {a.days_until != null ? `em ${a.days_until} dias` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
