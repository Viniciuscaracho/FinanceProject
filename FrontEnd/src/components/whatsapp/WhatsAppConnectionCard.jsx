import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Loader2, CheckCircle2, Unlink, RefreshCw,
  SmartphoneNfc, Phone, AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { apiService } from '@/lib/api'
import { T } from '@/lib/tokens'
import { useIsMobile } from '@/hooks/use-mobile'

// view: 'loading' | 'not_configured' | 'idle' | 'qr' | 'pairing' | 'connected'

const QR_COUNTDOWN = 55 // segundos antes de auto-atualizar

/* ── Ícone WhatsApp ─────────────────────────────────────────────────────────── */
function WhatsAppIcon({ size = 18 }) {
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

/* ── Tela: sem Evolution API configurada ────────────────────────────────────── */
function ViewNotConfigured() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#FEF9C3', border: '1px solid #FDE68A' }}>
      <AlertCircle size={15} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
      <p style={{ fontSize: 13, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
        Evolution API não configurada para esta conta. Entre em contato com o suporte da plataforma.
      </p>
    </div>
  )
}

/* ── Tela: idle (configurado, sem conexão ativa) ────────────────────────────── */
function ViewIdle({ onQr, onPairing, isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
        Conecte seu WhatsApp para que o sistema envie confirmações de agendamento, lembretes e avisos de cobrança automaticamente pelo seu número.
      </p>
      {isMobile && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '10px 12px', borderRadius: 8,
          background: '#FEF9C3', border: '1px solid #FDE68A',
          fontSize: 12, color: '#92400E',
        }}>
          <AlertCircle size={14} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
          <span>No celular, use <strong>Conectar por número</strong> — não é possível escanear o QR Code da própria tela.</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {/* Mobile: número primeiro; Desktop: QR primeiro */}
        {isMobile ? (
          <>
            <Button size="sm" onClick={onPairing} style={{ background: '#25D366', color: '#fff', gap: 6 }}>
              <Phone size={14} />
              Conectar por número
            </Button>
            <Button size="sm" variant="outline" onClick={onQr} style={{ gap: 6 }}>
              <SmartphoneNfc size={14} />
              QR Code (outro celular)
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={onQr} style={{ background: '#25D366', color: '#fff', gap: 6 }}>
              <SmartphoneNfc size={14} />
              Conectar via QR Code
            </Button>
            <Button size="sm" variant="outline" onClick={onPairing} style={{ gap: 6 }}>
              <Phone size={14} />
              Conectar por número
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Tela: QR Code ──────────────────────────────────────────────────────────── */
function ViewQr({ base64, loading, onRefresh, onSwitchToPairing }) {
  const [countdown, setCountdown] = useState(QR_COUNTDOWN)

  // Reinicia countdown quando chega novo QR
  useEffect(() => {
    if (!base64) return
    setCountdown(QR_COUNTDOWN)
    const t = setInterval(() => {
      setCountdown(s => {
        if (s <= 1) { clearInterval(t); onRefresh(); return QR_COUNTDOWN }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [base64]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', margin: 0, maxWidth: 320 }}>
        Abra o WhatsApp → <b>Dispositivos vinculados</b> → <b>Vincular dispositivo</b> e escaneie o código abaixo.
      </p>

      {/* QR frame */}
      <div style={{
        position: 'relative', padding: 10, borderRadius: 14, background: '#fff',
        border: `2px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        {loading || !base64 ? (
          <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: T.muted }} />
          </div>
        ) : (
          <img src={base64} alt="QR Code WhatsApp" style={{ width: 220, height: 220, display: 'block' }} />
        )}

        {/* Countdown badge */}
        {!loading && base64 && (
          <div style={{
            position: 'absolute', bottom: 12, right: 12,
            minWidth: 30, height: 30, borderRadius: 15,
            background: countdown <= 10 ? '#FEE2E2' : T.chip,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
            color: countdown <= 10 ? '#DC2626' : T.muted,
            padding: '0 6px',
          }}>
            {countdown}s
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
        <button
          onClick={onRefresh}
          style={{ color: T.brand, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <RefreshCw size={12} /> Novo QR
        </button>
        <span style={{ color: T.border }}>|</span>
        <button
          onClick={onSwitchToPairing}
          style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Phone size={12} /> Usar número
        </button>
      </div>
    </div>
  )
}

/* ── Tela: Pairing Code ─────────────────────────────────────────────────────── */
function ViewPairing({ onSwitchToQr }) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState(null)

  const handleRequest = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) { toast.error('Digite um número válido com DDD'); return }
    setLoading(true)
    try {
      const res = await apiService.requestWhatsappPairingCode(digits)
      if (res?.code) {
        setCode(res.code)
      } else {
        toast.error(res?.error || 'Erro ao solicitar código')
      }
    } catch {
      toast.error('Erro ao solicitar código de pareamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
        Digite seu número WhatsApp. Você receberá um código de 8 dígitos para inserir em{' '}
        <b>WhatsApp → Configurações → Dispositivos → Vincular com número</b>.
      </p>

      {!code ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: 13, color: T.muted, pointerEvents: 'none', userSelect: 'none',
            }}>+55</span>
            <input
              type="tel"
              placeholder="(11) 99999-0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRequest()}
              style={{
                width: '100%', padding: '9px 10px 9px 42px',
                borderRadius: 8, border: `1px solid ${T.border}`,
                fontSize: 14, color: T.text, background: T.white,
                boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>
          <Button
            size="sm"
            onClick={handleRequest}
            disabled={loading}
            style={{ background: T.brand, color: '#fff', flexShrink: 0 }}
          >
            {loading
              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : 'Enviar'}
          </Button>
        </div>
      ) : (
        /* Mostra o código de 8 dígitos */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Digite este código no WhatsApp:</p>
          <div style={{
            fontSize: 30, fontWeight: 800, letterSpacing: 8, color: T.text,
            padding: '14px 28px', borderRadius: 12,
            background: T.chip, border: `2px solid ${T.border}`,
            fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace',
          }}>
            {code}
          </div>
          <button
            onClick={() => setCode(null)}
            style={{ fontSize: 12, color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Tentar outro número
          </button>
        </div>
      )}

      <button
        onClick={onSwitchToQr}
        style={{ fontSize: 12, color: T.brand, background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <SmartphoneNfc size={13} /> Usar QR Code
      </button>
    </div>
  )
}

/* ── Tela: Conectado ────────────────────────────────────────────────────────── */
function ViewConnected({ phone, onDisconnect, disconnecting }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CheckCircle2 size={18} style={{ color: '#10B981' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}>Conectado</span>
        {phone && (
          <span style={{ fontSize: 13, color: T.muted }}>+{phone}</span>
        )}
      </div>
      <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
        Seus envios automáticos de WhatsApp estão ativos. Confirmações de agendamento, lembretes e cobranças serão enviados pelo seu número.
      </p>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDisconnect}
        disabled={disconnecting}
        style={{ alignSelf: 'flex-start', color: '#EF4444', gap: 6 }}
      >
        {disconnecting
          ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
          : <Unlink size={13} />}
        Desconectar WhatsApp
      </Button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   Card principal
══════════════════════════════════════════════════════════════════════════════ */
export function WhatsAppConnectionCard() {
  const isMobile = useIsMobile()
  const [view, setView]         = useState('loading')
  const [phone, setPhone]       = useState(null)
  const [qrBase64, setQrBase64] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const pollRef = useRef(null)

  /* Verifica status (usa silent=true para polls sem mostrar spinner) */
  const checkStatus = useCallback(async (silent = false) => {
    if (!silent) setView('loading')
    try {
      const res = await apiService.getWhatsappConnectionStatus()
      if (res?.connected) {
        setPhone(res.phone ?? null)
        setView('connected')
      } else if (res?.configured === false) {
        setView('not_configured')
      } else {
        if (!silent) setView('idle')
      }
      // No mobile, pula direto para pairing quando idle (não é possível escanear QR do próprio celular)
      // Isso é feito na renderização, não aqui, para não sobrescrever estados válidos
    } catch {
      if (!silent) setView('idle')
    }
  }, [])

  useEffect(() => {
    checkStatus()
    return () => clearInterval(pollRef.current)
  }, [checkStatus])

  /* Poll 3s quando QR está visível (detecta scan do usuário) */
  useEffect(() => {
    clearInterval(pollRef.current)
    if (view === 'qr' || view === 'pairing') {
      pollRef.current = setInterval(() => checkStatus(true), 3000)
    }
    return () => clearInterval(pollRef.current)
  }, [view, checkStatus])

  /* Carrega (ou atualiza) o QR code */
  const loadQr = useCallback(async () => {
    setQrLoading(true)
    setView('qr')
    try {
      const res = await apiService.getWhatsappQrCode()
      if (res?.already_connected) {
        setPhone(res.phone)
        setView('connected')
      } else if (res?.base64) {
        setQrBase64(res.base64)
      } else {
        toast.error(res?.error || 'Erro ao gerar QR code')
        setView('idle')
      }
    } catch {
      toast.error('Erro ao buscar QR code')
      setView('idle')
    } finally {
      setQrLoading(false)
    }
  }, [])

  const handleDisconnect = async () => {
    if (!window.confirm('Desconectar o WhatsApp? Os envios automáticos serão pausados.')) return
    setDisconnecting(true)
    try {
      await apiService.disconnectWhatsapp()
      setPhone(null)
      setQrBase64(null)
      setView('idle')
      toast.success('WhatsApp desconectado')
    } catch {
      toast.error('Erro ao desconectar')
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: '#DCFCE7',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <WhatsAppIcon />
          </div>
          <div>
            <CardTitle>WhatsApp</CardTitle>
            <CardDescription style={{ margin: 0 }}>
              Conecte seu número para envios automáticos de confirmação e lembrete
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {view === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.muted }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Verificando conexão…
          </div>
        )}

        {view === 'not_configured' && <ViewNotConfigured />}

        {view === 'idle' && (
          <ViewIdle
            onQr={loadQr}
            onPairing={() => setView('pairing')}
            isMobile={isMobile}
          />
        )}

        {view === 'qr' && (
          <ViewQr
            base64={qrBase64}
            loading={qrLoading}
            onRefresh={loadQr}
            onSwitchToPairing={() => setView('pairing')}
          />
        )}

        {view === 'pairing' && (
          <ViewPairing
            onSwitchToQr={loadQr}
          />
        )}

        {view === 'connected' && (
          <ViewConnected
            phone={phone}
            onDisconnect={handleDisconnect}
            disconnecting={disconnecting}
          />
        )}
      </CardContent>
    </Card>
  )
}
