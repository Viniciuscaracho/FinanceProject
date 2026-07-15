import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSameDay, parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useAppointments } from '@/hooks/useAppointments'
import { normalizeStatus } from '@/utils/appointmentUtils'
import { useIsMobile, useBreakpoint } from '@/hooks/use-mobile'
import { useAuth } from '@/contexts/AuthContext'
import {
  AlertCircle, Brain, Users, Activity, Clock, Calendar,
  CheckCircle, Loader2, SmartphoneNfc, RefreshCw, Globe, ArrowRight, ChevronRight,
  X, Zap, CheckCircle2, Plus, User,
} from 'lucide-react'
import { apiService } from '../lib/api'
import { T, DISPLAY } from '@/lib/tokens'

/* ─── Sub-componentes base ───────────────────────── */
function Panel({ children, style }) {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, ...style }}>
      {children}
    </div>
  )
}

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

/* ─── Vitrine Banner ─────────────────────────────── */
function VitrineBanner() {
  const navigate = useNavigate()
  const [acct, setAcct] = useState(null)

  useEffect(() => {
    apiService.getAccountSettings()
      .then(r => setAcct(r.account))
      .catch(() => {})
  }, [])

  if (!acct) return null

  const co   = acct.company || {}
  const addr = (co.addresses || [])[0] || {}

  const fields = [
    acct.profession_category,
    acct.directory_description,
    co.logo_url,
    co.cover_url,
    addr.city,
    co.phone_number,
    acct.instagram_url,
    (acct.specialties || []).length > 0,
  ]
  const done  = fields.filter(Boolean).length
  const total = fields.length
  const pct   = Math.round((done / total) * 100)

  if (acct.directory_visible && pct >= 80) return null

  const inactive = !acct.directory_visible

  return (
    <div
      onClick={() => navigate('/vitrine')}
      style={{
        borderRadius: 12, cursor: 'pointer', overflow: 'hidden',
        background: inactive
          ? 'linear-gradient(135deg, #3a43a0 0%, #5b52d9 100%)'
          : T.white,
        border: inactive ? 'none' : `1.5px solid ${T.brand}40`,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'opacity 140ms',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: inactive ? 'rgba(255,255,255,0.18)' : T.chip,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Globe size={18} style={{ color: inactive ? '#fff' : T.brand }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: inactive ? '#fff' : T.text }}>
          {inactive ? 'Apareça para novos pacientes' : 'Complete seu perfil público'}
        </p>
        {inactive ? (
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            Ative sua vitrine e seja encontrada no Descobrir
          </p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 4, background: T.border, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: T.brand, borderRadius: 4, transition: 'width 500ms ease' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.brand, flexShrink: 0 }}>{pct}%</span>
          </div>
        )}
      </div>

      <ArrowRight size={16} style={{ color: inactive ? 'rgba(255,255,255,0.7)' : T.muted, flexShrink: 0 }} />
    </div>
  )
}

/* ─── Setup Checklist ────────────────────────────── */
const CHECKLIST_KEY = 'setup_checklist_done'

function SetupChecklist({ allApts }) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(
    () => !localStorage.getItem(CHECKLIST_KEY)
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

      <div style={{ height: 4, background: T.border, borderRadius: 4, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: pct === 100 ? T.green : '#4C60AA',
          borderRadius: 4,
          transition: 'width 600ms ease',
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((step, i) => (
          <div
            key={i}
            onClick={!step.done && step.action ? step.action : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 8px', borderRadius: 8,
              cursor: !step.done && step.action ? 'pointer' : 'default',
              background: step.done ? T.bg : 'transparent',
              transition: 'background 100ms',
            }}
            onMouseEnter={e => { if (!step.done && step.action) e.currentTarget.style.background = T.bg }}
            onMouseLeave={e => { if (!step.done && step.action) e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              background: step.done ? T.green + '20' : T.border,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {step.done
                ? <CheckCircle2 size={12} style={{ color: T.green }} />
                : <span style={{ fontSize: 10, fontWeight: 700, color: T.muted }}>{i + 1}</span>
              }
            </div>
            <p style={{
              fontSize: 13, margin: 0,
              color: step.done ? T.muted : T.text,
              fontWeight: step.done ? 400 : 600,
              textDecoration: step.done ? 'line-through' : 'none',
              flex: 1,
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

/* ─── Alert Item (coaching) ──────────────────────── */
function AlertItem({ name, text, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
        border: `1px solid ${T.border}`, transition: 'border-color 120ms',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
    >
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{name?.charAt(0)?.toUpperCase() || '?'}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: T.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color, background: color + '15', borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
        {text}
      </span>
      <ChevronRight size={13} style={{ color: T.border, flexShrink: 0 }} />
    </div>
  )
}

/* ─── Coaching Panel ─────────────────────────────── */
function CoachingPanel({ alerts, urgent, attention, activeContacts, loading }) {
  const navigate = useNavigate()
  const alertBadgeColor = urgent.length > 0 ? '#EF4444' : '#F59E0B'

  if (loading) return (
    <Panel>
      <SectionHeader label="Atletas que precisam de atenção" />
      <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 44, borderRadius: 8, background: T.border, animation: 'skpulse 1.4s ease-in-out infinite', animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </Panel>
  )

  const hasData = alerts.length > 0 || activeContacts.length > 0

  return (
    <Panel>
      <SectionHeader
        label="Atletas que precisam de atenção"
        badge={alerts.length}
        badgeColor={alertBadgeColor}
        action="Ver tudo"
        onAction={() => navigate('/coaching')}
      />
      <div style={{ padding: '0 20px 16px' }}>
        {!hasData ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '4px 0 4px' }}>
            <p style={{ fontSize: 13, color: T.muted, margin: 0, flex: 1 }}>
              Sem atividade de coaching ainda. Envie uma nota pelo WhatsApp: <strong>"Nome: texto"</strong>
            </p>
            <button
              onClick={() => navigate('/contacts')}
              style={{ fontSize: 12, fontWeight: 600, color: T.brand, background: T.chip, border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
            >
              Ver atletas →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {urgent.map(a => (
              <AlertItem
                key={`u-${a.contact_id}`}
                name={a.contact_name}
                text={a.alert_type === 'sumiu' ? `sumiu há ${a.days_since}d` : 'relatou dor'}
                color="#EF4444"
                onClick={() => navigate(`/contacts/${a.contact_id}`)}
              />
            ))}
            {attention.map(a => (
              <AlertItem
                key={`a-${a.contact_id}`}
                name={a.contact_name}
                text={
                  a.alert_type === 'sem_feedback'
                    ? (a.days_since != null ? `sem registro há ${a.days_since}d` : 'sem registro')
                    : a.alert_type === 'perdeu_frequencia'
                    ? `sem consulta há ${a.days_since}d`
                    : (a.days_until != null ? `reavaliação em ${a.days_until}d` : 'reavaliação hoje')
                }
                color="#F59E0B"
                onClick={() => navigate(`/contacts/${a.contact_id}`)}
              />
            ))}
            {alerts.length === 0 && activeContacts.slice(0, 4).map(c => (
              <AlertItem
                key={`c-${c.contact_id}`}
                name={c.contact_name}
                text={`${c.events_count} registro${c.events_count !== 1 ? 's' : ''}`}
                color={T.brand}
                onClick={() => navigate(`/contacts/${c.contact_id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </Panel>
  )
}

/* ─── WhatsApp Dashboard Card ────────────────────── */
const WA_DASH_DISMISS = 'wa_dash_v1'
const WA_QR_COUNTDOWN = 55

function WaIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.1 21.9l4.833-1.317A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Z"
        fill="#25D366" />
      <path d="M8.5 7.5c.2-.5.5-.5.7-.5h.6c.2 0 .5.1.7.6l.9 2.3c.1.3.1.6-.1.8l-.5.5c-.1.1-.1.3 0 .4 1 1.7 2.3 3 4 4 .1.1.3.1.4 0l.5-.5c.2-.2.5-.2.8-.1l2.3.9c.5.2.6.5.6.7v.6c0 .2 0 .5-.5.7-1.5.6-5.5.8-8-3.8S7 8 8.5 7.5Z"
        fill="white" />
    </svg>
  )
}

function WhatsAppDashboardCard({ isMobile }) {
  const [mode, setMode]               = useState('checking')
  const [qrBase64, setQrBase64]       = useState(null)
  const [qrLoading, setQrLoading]     = useState(false)
  const [countdown, setCountdown]     = useState(WA_QR_COUNTDOWN)
  const [waPhone, setWaPhone]         = useState(null)
  const [phoneInput, setPhoneInput]   = useState('')
  const [pairingCode, setPairingCode] = useState(null)
  const [pairingLoading, setPairingLoading] = useState(false)
  const [dismissed, setDismissed]     = useState(() => localStorage.getItem(WA_DASH_DISMISS) === '1')
  const pollRef      = useRef(null)
  const countdownRef = useRef(null)

  const checkStatus = useCallback(async (silent = false) => {
    try {
      const res = await apiService.getWhatsappConnectionStatus()
      if (res?.connected) { setWaPhone(res.phone ?? null); setMode('connected') }
      else if (res?.configured === false) setMode('hidden')
      else if (!silent) setMode('cta')
    } catch {
      if (!silent) setMode('cta')
    }
  }, [])

  useEffect(() => {
    if (dismissed) return
    checkStatus()
    return () => { clearInterval(pollRef.current); clearInterval(countdownRef.current) }
  }, [dismissed, checkStatus])

  useEffect(() => {
    clearInterval(pollRef.current)
    if (mode === 'qr' || mode === 'pairing') {
      pollRef.current = setInterval(() => checkStatus(true), 3000)
    }
    return () => clearInterval(pollRef.current)
  }, [mode, checkStatus])

  useEffect(() => {
    clearInterval(countdownRef.current)
    if (mode !== 'qr' || !qrBase64 || qrLoading) return
    setCountdown(WA_QR_COUNTDOWN)
    countdownRef.current = setInterval(() => {
      setCountdown(s => {
        if (s <= 1) { clearInterval(countdownRef.current); loadQr(); return WA_QR_COUNTDOWN }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(countdownRef.current)
  }, [mode, qrBase64, qrLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadQr = async () => {
    setQrLoading(true)
    setMode('qr')
    try {
      const res = await apiService.getWhatsappQrCode()
      if (res?.already_connected) { setWaPhone(res.phone); setMode('connected') }
      else if (res?.base64) setQrBase64(res.base64)
      else setMode('cta')
    } catch { setMode('cta') }
    finally { setQrLoading(false) }
  }

  const requestPairingCode = async () => {
    const digits = phoneInput.replace(/\D/g, '')
    if (digits.length < 10) return
    setPairingLoading(true)
    try {
      const res = await apiService.requestWhatsappPairingCode(digits)
      if (res?.code) setPairingCode(res.code)
    } catch { /* ignore */ }
    finally { setPairingLoading(false) }
  }

  const dismiss = () => {
    localStorage.setItem(WA_DASH_DISMISS, '1')
    setDismissed(true)
    setMode('hidden')
  }

  if (dismissed || mode === 'hidden' || mode === 'checking') return null

  if (mode === 'connected') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 16px',
      }}>
        <CheckCircle size={15} style={{ color: '#22C55E', flexShrink: 0 }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: '#15803D', margin: 0 }}>
          WhatsApp conectado{waPhone ? ` · +${waPhone}` : ''} — envios automáticos ativos
        </p>
      </div>
    )
  }

  if (mode === 'pairing') {
    return (
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: `1px solid ${T.border}`,
          background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <WaIcon size={18} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#14532D', margin: 0 }}>Conectar por número</p>
              <p style={{ fontSize: 11, color: '#166534', margin: 0 }}>Você receberá um código de 8 dígitos no WhatsApp</p>
            </div>
          </div>
          <button onClick={() => setMode('cta')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86EFAC', padding: 4, flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!pairingCode ? (
            <>
              <p style={{ fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.5 }}>
                Digite seu número. No WhatsApp vá em <strong>Configurações → Dispositivos vinculados → Usar número</strong> e insira o código.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 13, color: T.muted, pointerEvents: 'none',
                  }}>+55</span>
                  <input
                    type="tel"
                    placeholder="(11) 99999-0000"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && requestPairingCode()}
                    autoFocus
                    style={{
                      width: '100%', padding: '9px 10px 9px 42px',
                      borderRadius: 8, border: `1px solid ${T.border}`,
                      fontSize: 14, color: T.text, background: T.white,
                      boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>
                <button
                  onClick={requestPairingCode}
                  disabled={pairingLoading || phoneInput.replace(/\D/g, '').length < 10}
                  style={{
                    padding: '9px 16px', borderRadius: 8, background: '#25D366', border: 'none',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'inherit', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                    opacity: phoneInput.replace(/\D/g, '').length < 10 ? 0.5 : 1,
                  }}
                >
                  {pairingLoading
                    ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    : 'Enviar'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Digite este código no WhatsApp:</p>
              <div style={{
                fontSize: 28, fontWeight: 800, letterSpacing: 6, color: T.text,
                padding: '12px 24px', borderRadius: 10,
                background: '#F0FDF4', border: '2px solid #BBF7D0',
                fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace',
              }}>
                {pairingCode}
              </div>
              <p style={{ fontSize: 12, color: T.muted, margin: 0, textAlign: 'center' }}>
                Aguardando conexão… o código expira em alguns minutos.
              </p>
              <button onClick={() => { setPairingCode(null); setPhoneInput('') }}
                style={{ fontSize: 12, color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
                Tentar outro número
              </button>
            </div>
          )}

          {!isMobile && (
            <button
              onClick={loadQr}
              style={{ fontSize: 12, color: T.brand, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', padding: 0, alignSelf: 'flex-start' }}
            >
              <SmartphoneNfc size={12} /> Usar QR Code
            </button>
          )}
        </div>
      </div>
    )
  }

  if (mode === 'qr') {
    return (
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: `1px solid ${T.border}`,
          background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <WaIcon size={18} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#14532D', margin: 0 }}>Conectar WhatsApp</p>
              <p style={{ fontSize: 11, color: '#166534', margin: 0 }}>
                Abra o WhatsApp → Dispositivos vinculados → Vincular dispositivo
              </p>
            </div>
          </div>
          <button onClick={() => setMode('cta')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86EFAC', padding: 4, flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 20, padding: '20px 24px' }}>
          <div style={{
            position: 'relative', padding: 8, borderRadius: 12, background: T.white,
            border: `2px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', flexShrink: 0,
          }}>
            {qrLoading || !qrBase64 ? (
              <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={26} style={{ animation: 'spin 1s linear infinite', color: T.muted }} />
              </div>
            ) : (
              <img src={qrBase64} alt="QR Code WhatsApp" style={{ width: 180, height: 180, display: 'block', borderRadius: 6 }} />
            )}
            {!qrLoading && qrBase64 && (
              <div style={{
                position: 'absolute', bottom: 10, right: 10, minWidth: 28, height: 28, borderRadius: 14,
                background: countdown <= 10 ? '#FEE2E2' : T.chip,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, padding: '0 5px',
                color: countdown <= 10 ? '#DC2626' : T.muted,
              }}>
                {countdown}s
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: '0 0 10px' }}>Como conectar:</p>
            {[
              'Abra o WhatsApp no celular',
              'Toque em ⋮ → Dispositivos vinculados',
              'Toque em "Vincular dispositivo"',
              'Aponte a câmera para o QR ao lado',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#DCFCE7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D' }}>{i + 1}</span>
                </div>
                <p style={{ fontSize: 13, color: T.text, margin: 0, lineHeight: 1.5 }}>{step}</p>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              <button onClick={loadQr}
                style={{ fontSize: 12, color: T.brand, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', padding: 0 }}>
                <RefreshCw size={11} /> Novo QR
              </button>
              <button onClick={() => { setMode('pairing'); setPairingCode(null) }}
                style={{ fontSize: 12, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', padding: 0 }}>
                Usar número
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
      border: '1px solid #BBF7D0', borderRadius: 10,
      padding: isMobile ? '12px 14px' : '10px 16px',
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 6px rgba(37,211,102,0.2)' }}>
        <WaIcon size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#14532D', margin: 0 }}>Conecte o WhatsApp</p>
        <p style={{ fontSize: 12, color: '#166534', margin: 0 }}>
          {isMobile
            ? 'Insira seu número e receba um código de conexão'
            : 'Confirmações, lembretes e cobranças automáticos'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {isMobile ? (
          <button
            onClick={() => setMode('pairing')}
            style={{
              padding: '8px 14px', borderRadius: 8, background: '#25D366', border: 'none',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
            }}
          >
            Conectar por número
          </button>
        ) : (
          <>
            <button
              onClick={loadQr}
              style={{
                padding: '8px 14px', borderRadius: 8, background: '#25D366', border: 'none',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
              }}
            >
              <SmartphoneNfc size={14} /> QR Code
            </button>
            <button
              onClick={() => setMode('pairing')}
              style={{
                padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.7)',
                border: '1px solid #BBF7D0', color: '#166534',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Número
            </button>
          </>
        )}
      </div>
      <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86EFAC', padding: 2, flexShrink: 0 }}>
        <X size={14} />
      </button>
    </div>
  )
}

/* ─── Smart Summary Banner ───────────────────────── */
function SmartSummaryBanner({ alerts, activeContacts, loading }) {
  if (loading || (alerts.length === 0 && activeContacts.length === 0)) return null

  const urgent    = alerts.filter(a => ['sumiu', 'reclamou_de_dor'].includes(a.alert_type))
  const sumiu     = alerts.filter(a => a.alert_type === 'sumiu')
  const dor       = alerts.filter(a => a.alert_type === 'reclamou_de_dor')
  const semFeed   = alerts.filter(a => a.alert_type === 'sem_feedback')
  const freq      = alerts.filter(a => a.alert_type === 'perdeu_frequencia')
  const reav      = alerts.filter(a => a.alert_type === 'reavaliacao_proxima')

  const reasons = []
  if (sumiu.length > 0)   reasons.push('sem resposta')
  if (semFeed.length > 0) reasons.push('baixa aderência')
  if (freq.length > 0)    reasons.push('frequência irregular')
  if (dor.length > 0)     reasons.push('relatos de dor')
  if (reav.length > 0)    reasons.push('reavaliações pendentes')

  const isUrgent = urgent.length > 0
  const total    = alerts.length

  const text = total > 0
    ? `Hoje há ${total} atleta${total !== 1 ? 's' : ''} que ${total !== 1 ? 'exigem' : 'exige'} atenção${urgent.length > 0 ? ` — ${urgent.length} urgente${urgent.length !== 1 ? 's' : ''}` : ''}. ${reasons.length > 0 ? `Principais motivos: ${reasons.slice(0, 3).join(', ')}.` : ''}`
    : `${activeContacts.length} atleta${activeContacts.length !== 1 ? 's' : ''} ativo${activeContacts.length !== 1 ? 's' : ''} — tudo em dia.`

  return (
    <div style={{
      background: isUrgent ? '#FFF7ED' : '#F0FDF4',
      border: `1px solid ${isUrgent ? '#FED7AA' : '#BBF7D0'}`,
      borderRadius: 10,
      padding: '12px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: isUrgent ? '#FED7AA' : '#BBF7D0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Brain size={16} style={{ color: isUrgent ? '#C2410C' : '#15803D' }} />
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: isUrgent ? '#9A3412' : '#14532D', margin: '0 0 2px' }}>
          Resumo de hoje
        </p>
        <p style={{ fontSize: 13, color: isUrgent ? '#C2410C' : '#166534', margin: 0, lineHeight: 1.5 }}>
          {text}
        </p>
      </div>
    </div>
  )
}

/* ─── Activity Feed ──────────────────────────────── */
const SOURCE_LABELS = {
  whisper:          { label: 'Áudio',      color: '#8B5CF6' },
  whatsapp_manual:  { label: 'WhatsApp',   color: '#25D366' },
  import:           { label: 'Importado',  color: '#0EA5E9' },
  session_note:     { label: 'Sessão',     color: '#F59E0B' },
  manual:           { label: 'Registro',   color: T.brand   },
}

function ActivityFeedPanel() {
  const navigate = useNavigate()
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiService.getRecentActivity(24)
      .then(res => setEvents(res?.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Panel>
      <SectionHeader
        label="O que mudou nas últimas 24h"
        badge={events.length || undefined}
        badgeColor={T.brand}
        action="Ver coaching"
        onAction={() => navigate('/coaching')}
      />
      <div style={{ padding: '0 20px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 48, borderRadius: 8, background: T.border, animation: 'skpulse 1.4s ease-in-out infinite', animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <Empty text="Nenhum registro nas últimas 24 horas." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {events.map((ev, i) => {
              const src    = SOURCE_LABELS[ev.source] || SOURCE_LABELS.manual
              const isLast = i === events.length - 1
              const time   = format(parseISO(ev.created_at), 'HH:mm')
              return (
                <div
                  key={ev.id}
                  onClick={() => navigate(`/contacts/${ev.contact_id}`)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '9px 0',
                    borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                    cursor: 'pointer', borderRadius: 6, transition: 'background 100ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, width: 38, flexShrink: 0, paddingTop: 2 }}>{time}</span>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: src.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: src.color }}>{ev.contact_name?.charAt(0)?.toUpperCase() || '?'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.contact_name}
                      </p>
                      <span style={{ fontSize: 10, fontWeight: 600, color: src.color, background: src.color + '15', borderRadius: 20, padding: '1px 6px', flexShrink: 0 }}>
                        {src.label}
                      </span>
                    </div>
                    {ev.summary && (
                      <p style={{ fontSize: 12, color: T.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.summary}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Panel>
  )
}

/* ─── Day Queue ──────────────────────────────────── */
function DayQueue({ appointments, loading }) {
  const navigate = useNavigate()

  const pending = useMemo(() =>
    appointments.filter(a => normalizeStatus(a.status) === 'pending'),
    [appointments]
  )

  if (!loading && pending.length === 0) return null

  return (
    <Panel>
      <SectionHeader
        label="Para confirmar hoje"
        badge={pending.length}
        badgeColor={T.amber}
        action="Ver agenda"
        onAction={() => navigate('/appointments')}
      />
      <div style={{ padding: '0 20px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2].map(i => (
              <div key={i} style={{ height: 36, borderRadius: 8, background: T.border, animation: 'skpulse 1.4s ease-in-out infinite', animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {pending.map((apt, i) => {
              const client = apt?.client?.name || apt?.contact?.name || 'Paciente'
              const time   = format(parseISO(apt.start_time), 'HH:mm')
              const svc    = apt?.service?.name || ''
              const isLast = i === pending.length - 1
              return (
                <div
                  key={apt.id}
                  onClick={() => navigate('/appointments')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 0',
                    borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                    cursor: 'pointer', transition: 'background 100ms', borderRadius: 6,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, width: 38, flexShrink: 0 }}>{time}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client}</p>
                    {svc && <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{svc}</p>}
                  </div>
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
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Panel>
  )
}

/* ─── Consultancy Indicators ─────────────────────── */
function ConsultancyIndicators({ totalAthletes, pendingCheckins, adherence, reavaliacoes, loading }) {
  const kpis = [
    {
      label: 'Atletas ativos',
      value: totalAthletes,
      color: T.brand,
      Icon: Users,
    },
    {
      label: 'Check-ins pendentes',
      value: pendingCheckins,
      color: pendingCheckins > 0 ? T.amber : T.green,
      Icon: Clock,
    },
    {
      label: 'Aderência',
      value: adherence !== null ? `${adherence}%` : '—',
      color: adherence === null ? T.muted : adherence >= 70 ? T.green : T.amber,
      Icon: Activity,
    },
    {
      label: 'Reavaliações na semana',
      value: reavaliacoes,
      color: reavaliacoes > 0 ? T.brand : T.muted,
      Icon: Calendar,
    },
  ]

  return (
    <Panel>
      <SectionHeader label="Indicadores" />
      <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {kpis.map(({ label, value, color, Icon }, i) => (
          <div key={i} style={{ background: T.bg, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Icon size={12} style={{ color, flexShrink: 0 }} />
              {loading ? (
                <div style={{ height: 20, width: 48, borderRadius: 4, background: T.border, animation: 'skpulse 1.4s ease-in-out infinite' }} />
              ) : (
                <p style={{ fontSize: 18, fontWeight: 700, color, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {value}
                </p>
              )}
            </div>
            <p style={{ fontSize: 11, color: T.muted, margin: 0, lineHeight: 1.3 }}>{label}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

/* ─── Insights Card ──────────────────────────────── */
function InsightsCard({ alerts, activeContacts }) {
  const insights = useMemo(() => {
    const result = []

    const sumiu      = alerts.filter(a => a.alert_type === 'sumiu')
    const dor        = alerts.filter(a => a.alert_type === 'reclamou_de_dor')
    const reavalNear = alerts.filter(a => a.alert_type === 'reavaliacao_proxima' && (a.days_until ?? 99) <= 3)
    const semFreq    = alerts.filter(a => a.alert_type === 'perdeu_frequencia')

    if (sumiu.length > 0)
      result.push({ text: `${sumiu.length} atleta${sumiu.length !== 1 ? 's' : ''} sem resposta — considere entrar em contato.`, color: '#EF4444' })
    if (dor.length > 0)
      result.push({ text: `${dor.length} relato${dor.length !== 1 ? 's' : ''} de dor recente. Verifique os programas de treino.`, color: '#F59E0B' })
    if (reavalNear.length > 0)
      result.push({ text: `${reavalNear.length} reavaliação${reavalNear.length !== 1 ? 'ões' : ''} nos próximos 3 dias. Prepare os protocolos.`, color: T.brand })
    if (semFreq.length > 0)
      result.push({ text: `${semFreq.length} atleta${semFreq.length !== 1 ? 's' : ''} com frequência irregular este mês.`, color: '#F59E0B' })
    if (result.length === 0 && activeContacts.length > 0)
      result.push({ text: 'Todos os atletas estão em dia. Continue o bom trabalho!', color: T.green })

    return result
  }, [alerts, activeContacts])

  if (insights.length === 0) return null

  return (
    <Panel>
      <SectionHeader label="Insights" />
      <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {insights.map((ins, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0, marginTop: 1,
              background: ins.color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={12} style={{ color: ins.color }} />
            </div>
            <p style={{ fontSize: 13, color: T.text, margin: 0, lineHeight: 1.5, paddingTop: 4 }}>{ins.text}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

/* ─── Dashboard ──────────────────────────────────── */
export function Dashboard() {
  const isMobile   = useIsMobile()
  const breakpoint = useBreakpoint()
  const isNarrow   = isMobile || ['sm', 'md', 'lg'].includes(breakpoint)
  const navigate   = useNavigate()
  const { user }  = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'você'

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })
    .replace(/^\w/, c => c.toUpperCase())

  const [coachingData,    setCoachingData]    = useState(null)
  const [coachingLoading, setCoachingLoading] = useState(true)

  const { appointments: allApts, loading: aptsLoading } = useAppointments()

  const todayApts = useMemo(() =>
    allApts
      .filter(a => a.start_time && isSameDay(parseISO(a.start_time), new Date()))
      .sort((a, b) => parseISO(a.start_time) - parseISO(b.start_time)),
    [allApts]
  )

  useEffect(() => {
    apiService.getCoachingDashboard()
      .then(res => setCoachingData(res))
      .catch(() => setCoachingData({ alerts: [], active_contacts: [], total_events: 0 }))
      .finally(() => setCoachingLoading(false))
  }, [])

  const alerts         = coachingData?.alerts || []
  const activeContacts = coachingData?.active_contacts || []
  const urgent         = alerts.filter(a => ['sumiu', 'reclamou_de_dor'].includes(a.alert_type))
  const attention      = alerts.filter(a => ['sem_feedback', 'perdeu_frequencia', 'reavaliacao_proxima'].includes(a.alert_type))
  const pendingCheckins = alerts.filter(a => a.alert_type === 'sem_feedback').length
  const reavaliacoes    = alerts.filter(a => a.alert_type === 'reavaliacao_proxima').length
  const adherence       = activeContacts.length > 0
    ? Math.round((activeContacts.length - pendingCheckins) / activeContacts.length * 100)
    : null

  return (
    <div data-testid="dashboard" style={{ display: 'flex', flexDirection: 'column', gap: 10, ...DISPLAY }}>

      {/* ══ 1. HERO ════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #1E2440 0%, #2C3560 60%, #1a2038 100%)',
        borderRadius: 12,
        padding: isNarrow ? '14px 16px' : '18px 24px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
        boxShadow: '0 4px 20px rgba(30,36,64,0.18)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: -10, top: -10, width: 100, height: 100, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ fontSize: isNarrow ? 16 : 18, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            {greeting}, {firstName}.
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {todayLabel}
          </p>
        </div>

        <div style={{ display: 'flex', gap: isMobile ? 20 : 28, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
          <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
            <p style={{ fontSize: isNarrow ? 16 : 18, fontWeight: 700, color: T.amber, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {todayApts.length > 0 ? todayApts.length : '—'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Hoje</p>
          </div>
          <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
            {coachingLoading
              ? <Sk w={40} h={18} r={4} />
              : <p style={{ fontSize: isNarrow ? 16 : 18, fontWeight: 700, color: alerts.length > 0 ? '#F87171' : '#86EFAC', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {alerts.length > 0 ? alerts.length : activeContacts.length}
                </p>
            }
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, marginTop: coachingLoading ? 4 : 0 }}>
              {alerts.length > 0 ? 'Alertas' : 'Atletas OK'}
            </p>
          </div>
        </div>
      </div>

      {/* ══ 2. RESUMO INTELIGENTE ══════════════════════ */}
      <SmartSummaryBanner alerts={alerts} activeContacts={activeContacts} loading={coachingLoading} />

      {/* ══ 3. AÇÕES RÁPIDAS ═══════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { icon: Calendar, label: 'Nova consulta', path: '/appointments' },
          { icon: User,     label: 'Novo atleta',   path: '/contacts' },
          { icon: Brain,    label: 'Coaching',       path: '/coaching' },
        ].map((a, i) => {
          const Icon = a.icon
          return (
            <button
              key={i}
              onClick={() => navigate(a.path)}
              style={{
                background: T.white, border: `1px solid ${T.border}`, borderRadius: 10,
                padding: '12px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                gap: 10, textAlign: 'left', fontFamily: 'inherit', transition: 'border-color 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.brand}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <div style={{ width: 30, height: 30, borderRadius: 8, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} style={{ color: T.brand }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.label}</p>
            </button>
          )
        })}
      </div>

      <VitrineBanner />
      <SetupChecklist allApts={allApts} />
      <WhatsAppDashboardCard isMobile={isMobile} />

      {/* ══ 4. GRID PRINCIPAL ══════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '65fr 35fr', gap: 10, alignItems: 'start', minWidth: 0 }}>

        {/* ─ Esquerda 65% ───────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <CoachingPanel
            alerts={alerts}
            urgent={urgent}
            attention={attention}
            activeContacts={activeContacts}
            loading={coachingLoading}
          />
          <ActivityFeedPanel />
          <DayQueue appointments={todayApts} loading={aptsLoading} />
        </div>

        {/* ─ Direita 35% ────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <ConsultancyIndicators
            totalAthletes={activeContacts.length}
            pendingCheckins={pendingCheckins}
            adherence={adherence}
            reavaliacoes={reavaliacoes}
            loading={coachingLoading}
          />
          <InsightsCard alerts={alerts} activeContacts={activeContacts} />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes skpulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
      `}</style>
    </div>
  )
}
