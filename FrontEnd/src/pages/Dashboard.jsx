import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
  X, Check, SmartphoneNfc, RefreshCw, CheckCircle,
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
  pending:   { color: T.amber,   label: 'Pendente',   short: 'Pend.' },
  confirmed: { color: T.brand,   label: 'Confirmado', short: 'Conf.' },
  completed: { color: T.green,   label: 'Concluído',  short: 'OK'    },
  canceled:  { color: '#D1D5DB', label: 'Cancelado',  short: 'Canc.' },
  no_show:   { color: '#D1D5DB', label: 'Não veio',   short: 'Falta' },
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
  // checking | hidden | cta | qr | pairing | connected
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

  // Poll quando QR ou pairing estão ativos
  useEffect(() => {
    clearInterval(pollRef.current)
    if (mode === 'qr' || mode === 'pairing') {
      pollRef.current = setInterval(() => checkStatus(true), 3000)
    }
    return () => clearInterval(pollRef.current)
  }, [mode, checkStatus])

  // Countdown do QR
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

  // ── Conectado ──
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

  // ── Pairing: conectar por número (padrão no mobile) ──
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

          {/* Alternativa: QR (apenas no desktop) */}
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

  // ── QR expandido (desktop) ──
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
            position: 'relative', padding: 8, borderRadius: 12, background: '#fff',
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

  // ── CTA: banner horizontal ──
  // Mobile → botão primário = número (não pode escanear o próprio celular)
  // Desktop → botão primário = QR
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
      border: '1px solid #BBF7D0', borderRadius: 10,
      padding: isMobile ? '12px 14px' : '10px 16px',
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 6px rgba(37,211,102,0.2)' }}>
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
          // Mobile: número como primário, QR como link secundário
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
          // Desktop: QR como primário, número como link
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

        {/* Métricas — no mobile ficam em linha abaixo do greeting, alinhadas à esquerda */}
        <div style={{
          display: 'flex',
          gap: isMobile ? 20 : 28,
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'flex-start' : 'flex-end',
        }}>
          {/* Hoje */}
          <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
            <p style={{ fontSize: isNarrow ? 16 : 18, fontWeight: 700, color: T.amber, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {todayApts.length > 0 ? String(todayApts.length) : '—'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Hoje</p>
          </div>

          {/* Recebido */}
          <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
            {loading
              ? <Sk w={80} h={18} r={4} />
              : <p style={{ fontSize: isNarrow ? 16 : 18, fontWeight: 700, color: T.green, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{fmtBRL(receitas)}</p>
            }
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, marginTop: loading ? 4 : 0 }}>Recebido</p>
          </div>

          {/* Pendente */}
          <div style={{ textAlign: isMobile ? 'left' : 'right', visibility: (!loading && pendente === 0) ? 'hidden' : 'visible' }}>
            {loading
              ? <Sk w={72} h={18} r={4} />
              : <p style={{ fontSize: isNarrow ? 16 : 18, fontWeight: 700, color: '#F87171', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{fmtBRL(pendente)}</p>
            }
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, marginTop: loading ? 4 : 0 }}>Pendente</p>
          </div>
        </div>
      </div>

      {/* ══ 2. AÇÕES RÁPIDAS — antes do grid ══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { icon: Calendar, label: 'Nova consulta',  path: '/appointments' },
          { icon: Plus,     label: 'Nova transação', path: '/transactions' },
          { icon: User,     label: 'Novo paciente',  path: '/contacts' },
          { icon: FileText, label: 'Relatórios',     path: '/reports' },
        ].map((a, i) => {
          const Icon = a.icon
          return (
            <button
              key={i}
              onClick={() => navigate(a.path)}
              style={{
                background: T.white, border: `1px solid ${T.border}`, borderRadius: 10,
                padding: isMobile ? '12px 14px' : '12px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                flexDirection: 'row',
                gap: 10, textAlign: 'left',
                fontFamily: 'inherit', transition: 'border-color 150ms',
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

      <SetupChecklist allApts={allApts} />

      <WhatsAppDashboardCard isMobile={isMobile} />

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
      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '3fr 2fr', gap: 10, alignItems: 'start', minWidth: 0 }}>

        {/* ─ Col esquerda ───────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>

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
                              padding: isMobile ? '4px 8px' : '4px 10px',
                              cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                            }}
                          >
                            {isMobile ? 'OK' : 'Confirmar'}
                          </button>
                        ) : (
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: meta.color,
                            background: meta.color + '18', borderRadius: 20,
                            padding: isMobile ? '3px 6px' : '3px 8px', flexShrink: 0,
                          }}>
                            {isMobile ? meta.short : meta.label}
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
                          display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 12,
                          padding: '9px 0',
                          borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                          cursor: 'pointer', borderRadius: 6, transition: 'background 100ms',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = T.bg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Indicador receita/despesa */}
                        <div style={{
                          width: 3, borderRadius: 2, flexShrink: 0, alignSelf: 'stretch',
                          background: isRec ? T.green : '#E5E7EB',
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.description || tx.name || 'Sem descrição'}
                          </p>
                          <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>
                            {tx.category?.name || 'Sem categoria'} · {fmtDate(tx.due_date)}
                          </p>
                          {isMobile && (
                            <p style={{ fontSize: 13, fontWeight: 700, color: isRec ? T.green : T.text, margin: '2px 0 0' }}>
                              {isRec ? '+' : '−'}{fmtBRL(tx.amount_cents / 100)}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          {!isMobile && (
                            <span style={{ fontSize: 13, fontWeight: 700, color: isRec ? T.green : T.text }}>
                              {isRec ? '+' : '−'}{fmtBRL(tx.amount_cents / 100)}
                            </span>
                          )}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>

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
                          display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 10,
                          padding: '8px 0',
                          borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                          cursor: 'pointer', borderRadius: 6, transition: 'background 100ms',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = T.bg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 3, borderRadius: 2, background: T.red, flexShrink: 0, alignSelf: 'stretch' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.description || c.name || 'Sem descrição'}
                          </p>
                          <p style={{ fontSize: 12, color: T.red, margin: 0 }}>
                            Venceu {fmtDate(c.due_date)} · {fmtBRL(c.amount_cents / 100)}
                          </p>
                          {isMobile && (
                            <button
                              onClick={e => { e.stopPropagation(); handleTogglePaid(c) }}
                              disabled={loadingTxId !== null}
                              style={{
                                fontSize: 11, fontWeight: 600, color: T.brand,
                                background: T.chip, border: '1px solid #DDE3F5', borderRadius: 6,
                                padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit',
                                display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6,
                              }}
                            >
                              {loadingTxId === c.id
                                ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                                : 'Registrar pagamento'}
                            </button>
                          )}
                        </div>
                        {!isMobile && (
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
                        )}
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
