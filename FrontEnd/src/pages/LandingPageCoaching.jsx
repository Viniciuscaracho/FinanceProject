import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import {
  Mic, Brain, AlertCircle, Sparkles, Dumbbell, Moon,
  Check, Loader2, X, ArrowRight,
} from 'lucide-react'

/* ─── Paleta ────────────────────────────────────────────────── */
const T = {
  bg:     '#F7F8FC',
  white:  '#FFFFFF',
  dark:   '#0E1020',
  brand:  '#4C60AA',
  text:   '#111111',
  muted:  '#6B6B6B',
  border: '#E4E5EE',
  light:  '#EEEFF6',
}
const FONT = { fontFamily: "'Space Grotesk', system-ui, sans-serif" }

/* ─── Google SVG ─────────────────────────────────────────────── */
const GOOGLE_SVG = (
  <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M17.64 9.2a10.3 10.3 0 0 0-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

/* ─── Dados de demo ──────────────────────────────────────────── */
const ALERTS = [
  { name: 'Bruno Alves',    label: 'Sumiu',        sub: 'há 9 dias',            color: '#EF4444' },
  { name: 'Rafael Souza',   label: 'Dor',          sub: 'joelho · 2 registros', color: '#EF4444' },
  { name: 'Carla Mendes',   label: 'Sem registro', sub: 'há 6 dias',            color: '#F59E0B' },
  { name: 'Marcos Lima',    label: 'Reavaliação',  sub: 'em 3 dias',            color: '#3B82F6' },
]

const ATHLETES = [
  { initials: 'ML', name: 'Marcos Lima',    ago: 'hoje',     regs: 12, nums: [6,7,7,8,8,9,9], color: '#10B981' },
  { initials: 'JF', name: 'Júlia Ferreira', ago: 'ontem',    regs: 8,  nums: [5,5,6,6,7,7,7], color: '#6366F1' },
  { initials: 'AR', name: 'Ana Rodrigues',  ago: '2d atrás', regs: 5,  nums: [4,5,4,5,5,6,6], color: '#F59E0B' },
]

/* ─── Sparkline ──────────────────────────────────────────────── */
function Spark({ nums, color, w = 52, h = 20 }) {
  const max = Math.max(...nums), min = Math.min(...nums), range = max - min || 1, p = 2
  const pts = nums.map((v, i) => {
    const x = p + (i / (nums.length - 1)) * (w - p * 2)
    const y = p + (1 - (v - min) / range) * (h - p * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const [lx, ly] = pts.split(' ').pop().split(',')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible', flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={2.5} fill={color} />
    </svg>
  )
}

/* ─── Modal de sign-up ───────────────────────────────────────── */
function AuthModal({ onClose, onLogin, isLoading }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', esc)
    }
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(14,16,32,0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
      >
        <motion.div
          key="card"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: T.white,
            borderRadius: 28,
            padding: '44px 40px 36px',
            maxWidth: 380,
            width: '100%',
            boxShadow: '0 32px 96px rgba(14,16,32,0.28)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 32, height: 32, borderRadius: '50%',
              border: 'none', background: T.light, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} color={T.muted} />
          </button>

          {/* Ícone animado */}
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{
              width: 72, height: 72, borderRadius: 22,
              background: 'linear-gradient(135deg, #4C60AA 0%, #6B7FCC 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 24,
              boxShadow: '0 10px 32px rgba(76,96,170,0.38)',
            }}
          >
            <Mic size={32} color="#fff" />
          </motion.div>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: '0 0 10px', lineHeight: 1.2, ...FONT }}>
            Bora criar sua conta!
          </h2>
          <p style={{ fontSize: 14.5, color: T.muted, lineHeight: 1.65, margin: '0 0 30px', maxWidth: '28ch' }}>
            Mande seu primeiro áudio em segundos.{' '}
            <strong style={{ color: T.text }}>14 dias grátis</strong>, sem cartão de crédito.
          </p>

          <button
            onClick={onLogin}
            disabled={isLoading}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              height: 52, borderRadius: 14,
              border: '1.5px solid #E5E7EB',
              background: '#fff',
              color: '#374151',
              fontSize: 15, fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.65 : 1,
              transition: 'all 0.15s',
              marginBottom: 16,
            }}
            onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)' } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none' }}
          >
            {isLoading
              ? <Loader2 size={20} style={{ animation: 'lp-spin 1s linear infinite', color: '#9CA3AF' }} />
              : <>{GOOGLE_SVG} Continuar com Google</>
            }
          </button>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 18 }}>
            {['Sem cartão', 'Cancele quando quiser', 'Seu atleta não precisa instalar nada'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#6B7280' }}>
                <Check size={11} color="#16a34a" />
                {item}
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, lineHeight: 1.55 }}>
            Ao entrar, você concorda com os{' '}
            <a href="/termos-de-uso" style={{ color: '#6B7280', textDecoration: 'underline' }}>Termos</a>
            {' '}e{' '}
            <a href="/politica-de-privacidade" style={{ color: '#6B7280', textDecoration: 'underline' }}>Privacidade</a>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── App de demo (parece o sistema real) ────────────────────── */
function DemoApp({ onMicClick }) {
  return (
    <div style={{
      background: T.bg,
      borderRadius: 22,
      border: `1px solid ${T.border}`,
      overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(14,16,32,0.14)',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 580,
    }}>
      {/* Header do app */}
      <div style={{
        background: T.white, padding: '14px 18px',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={16} color={T.brand} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0, ...FONT }}>Coaching</p>
          <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>9 atletas · 4 alertas hoje</p>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '2px 8px' }}>4 alertas</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, background: T.light, borderRadius: 6, padding: '2px 8px' }}>68 reg.</span>
        </div>
      </div>

      {/* Alertas */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <AlertCircle size={11} color="#EF4444" />
          <span style={{ fontSize: 9.5, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Precisam de você
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {ALERTS.map(a => (
            <div key={a.name} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px',
              border: `1px solid ${a.color}22`,
              borderRadius: 8, background: T.white,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text, flex: 1 }}>{a.name}</span>
              <span style={{ fontSize: 10, color: T.muted }}>{a.sub}</span>
              <span style={{
                fontSize: 9.5, fontWeight: 700, color: a.color,
                background: a.color + '14', borderRadius: 20, padding: '2px 8px', flexShrink: 0,
              }}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Atletas */}
      <div style={{ padding: '12px 16px', flex: 1, overflowY: 'auto' }}>
        <p style={{ fontSize: 9.5, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>
          Atletas ativos
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ATHLETES.map(at => (
            <div key={at.name} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px',
              background: T.white, border: `1px solid ${T.border}`, borderRadius: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: at.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: at.color, flexShrink: 0,
              }}>{at.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{at.name}</p>
                <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>{at.ago} · {at.regs} registros</p>
              </div>
              <Spark nums={at.nums} color={at.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Barra de entrada — o botão de áudio é o CTA */}
      <div style={{
        padding: '12px 14px',
        borderTop: `1px solid ${T.border}`,
        background: T.white,
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          flex: 1,
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 24,
          padding: '10px 16px',
          fontSize: 12.5,
          color: T.muted,
          userSelect: 'none',
        }}>
          "Marcos treinou bem hoje, dormiu 7h..."
        </div>

        {/* Botão de áudio pulsando */}
        <button
          onClick={onMicClick}
          aria-label="Mandar áudio"
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4C60AA 0%, #6B80D4 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
            boxShadow: '0 4px 18px rgba(76,96,170,0.5)',
          }}
        >
          <Mic size={20} color="#fff" />
          <span className="lp-ring lp-ring-1" />
          <span className="lp-ring lp-ring-2" />
        </button>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────── */
export function LandingPageCoaching() {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { loginWithGoogle } = useAuth()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const handleMicClick = () => setShowModal(true)
  const handleLogin = async () => {
    setIsLoading(true)
    await loginWithGoogle()
    setIsLoading(false)
  }

  return (
    <div style={{ ...FONT, background: T.bg, minHeight: '100dvh' }}>
      <Helmet>
        <title>Orbi Coach — o histórico dos seus atletas, em um áudio</title>
        <meta name="description" content="Fale sobre o treino, a dieta, o sono. A IA estrutura tudo por atleta. Resumo pronto antes de cada sessão. 14 dias grátis, sem cartão." />
        <link rel="canonical" href="https://orbinutri.com.br/" />
      </Helmet>

      {/* ── Estilos globais da landing ── */}
      <style>{`
        @keyframes lp-pulse { 0% { transform: scale(1); opacity: 0.55 } 100% { transform: scale(2.5); opacity: 0 } }
        @keyframes lp-spin  { to { transform: rotate(360deg) } }
        .lp-ring {
          position: absolute; inset: 0; border-radius: 50%;
          border: 2px solid rgba(76,96,170,0.55);
          pointer-events: none;
        }
        .lp-ring-1 { animation: lp-pulse 2s ease-out infinite; }
        .lp-ring-2 { animation: lp-pulse 2s ease-out 0.9s infinite; }

        /* Hero grid: 2 colunas no desktop, 1 no mobile */
        .lp-hero { display: grid; grid-template-columns: 1fr 1.45fr; gap: 64px; align-items: center; }
        @media (max-width: 820px) {
          .lp-hero { grid-template-columns: 1fr; gap: 40px; }
          .lp-hero .lp-copy { order: 2; }
          .lp-hero .lp-demo { order: 1; }
        }

        /* Ocultar copy secundário em mobile muito pequeno */
        @media (max-width: 420px) {
          .lp-features { display: none; }
        }
      `}</style>

      {/* ── Nav ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'background 0.2s, border-color 0.2s',
        background: scrolled ? 'rgba(247,248,252,0.94)' : 'transparent',
        borderBottom: `1px solid ${scrolled ? T.border : 'transparent'}`,
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={20} color={T.brand} />
            <span style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>Orbi Coach</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <a href="/login" style={{ fontSize: 13, fontWeight: 600, color: T.muted, textDecoration: 'none', padding: '8px 14px' }}>
              Entrar
            </a>
            <button
              onClick={handleMicClick}
              style={{
                fontSize: 13, fontWeight: 600, color: T.white,
                background: T.text,
                padding: '8px 18px', borderRadius: 8,
                border: 'none', cursor: 'pointer',
              }}
            >
              Começar grátis
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ paddingTop: 60 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px 80px' }}>
          <div className="lp-hero">

            {/* Copy */}
            <motion.div
              className="lp-copy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <p style={{ fontSize: 11.5, fontWeight: 700, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 18 }}>
                Para treinadores pessoais
              </p>

              <h1 style={{
                fontSize: 'clamp(2.1rem, 3.8vw, 3.2rem)',
                fontWeight: 700, color: T.text,
                lineHeight: 1.1, letterSpacing: '-0.035em',
                marginBottom: 20, textWrap: 'balance',
              }}>
                O histórico dos<br />seus atletas,<br />
                <em style={{ fontStyle: 'normal', color: T.brand }}>em um áudio.</em>
              </h1>

              <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.75, marginBottom: 32, maxWidth: '40ch' }}>
                Fale sobre o treino, o sono, a dieta. A IA estrutura tudo — carga,
                queixas, próximas ações — organizado por atleta, sem planilha.
              </p>

              <div className="lp-features" style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 36 }}>
                {[
                  { icon: Mic,          text: 'Áudio de segundos → registro estruturado pela IA' },
                  { icon: Sparkles,     text: 'Resumo automático antes de cada atendimento' },
                  { icon: AlertCircle,  text: 'Alerta quando atleta some ou relata dor' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: T.light,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 1,
                    }}>
                      <Icon size={12} color={T.brand} />
                    </div>
                    <span style={{ fontSize: 13.5, color: '#333', lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>

              {/* CTA principal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={handleMicClick}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px 28px',
                    background: 'linear-gradient(135deg, #4C60AA 0%, #6B80D4 100%)',
                    color: '#fff',
                    borderRadius: 12, fontSize: 15, fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(76,96,170,0.42)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    alignSelf: 'flex-start',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(76,96,170,0.5)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(76,96,170,0.42)' }}
                >
                  <Mic size={16} />
                  Testar agora — é grátis
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  {['14 dias grátis', 'Sem cartão de crédito', 'Cancele quando quiser'].map(t => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.muted }}>
                      <Check size={11} color="#16a34a" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Demo app */}
            <motion.div
              className="lp-demo"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <DemoApp onMicClick={handleMicClick} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Como funciona (3 passos rápidos) ── */}
      <section style={{ background: T.white, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', marginBottom: 12 }}>
            Como funciona
          </p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, color: T.text, textAlign: 'center', letterSpacing: '-0.03em', marginBottom: 48 }}>
            Três passos. Um áudio.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              {
                icon: Mic, step: '01',
                title: 'Você fala',
                text: 'Depois do treino ou check-in, manda um áudio de segundos para o número da plataforma. Do jeito que você já faz com qualquer contato.',
              },
              {
                icon: Brain, step: '02',
                title: 'A IA organiza',
                text: 'Sono, carga, nutrição e próximas ações são extraídos e salvos no histórico do atleta. Sem digitar, sem planilha.',
              },
              {
                icon: Sparkles, step: '03',
                title: 'Você evolui',
                text: 'Resumo pronto antes de cada sessão. Alertas automáticos quando algo foge do padrão. Você nunca mais vai perder contexto.',
              },
            ].map((s) => (
              <div key={s.step} style={{
                background: T.bg, border: `1px solid ${T.border}`,
                borderRadius: 16, padding: '24px 22px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: T.light,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <s.icon size={18} color={T.brand} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.border, letterSpacing: '0.05em' }}>{s.step}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 8px', ...FONT }}>{s.title}</h3>
                <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.7, margin: 0 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section style={{ background: T.dark, padding: '72px 0' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
            Seu próximo áudio<br />vira memória do atleta.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 36 }}>
            Comece hoje. Em 2 minutos seu histórico já está sendo construído.
          </p>
          <button
            onClick={handleMicClick}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 40px',
              background: '#fff', color: T.dark,
              borderRadius: 14, fontSize: 16, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none' }}
          >
            Criar conta grátis <ArrowRight size={16} />
          </button>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>
            Ao criar sua conta você concorda com os{' '}
            <a href="/termos-de-uso" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'underline' }}>Termos</a>
            {' '}e{' '}
            <a href="/politica-de-privacidade" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'underline' }}>Privacidade</a>.
          </p>
        </div>
      </section>

      {/* ── Footer mínimo ── */}
      <footer style={{ background: T.white, borderTop: `1px solid ${T.border}`, padding: '24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Brain size={16} color={T.brand} />
            <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Orbi Coach</span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['Entrar', '/login'], ['Termos', '/termos-de-uso'], ['Privacidade', '/politica-de-privacidade']].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: 12, color: T.muted, textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>© 2026 Orbi</p>
        </div>
      </footer>

      {/* ── Modal de sign-up ── */}
      {showModal && (
        <AuthModal
          onClose={() => setShowModal(false)}
          onLogin={handleLogin}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}

export default LandingPageCoaching
