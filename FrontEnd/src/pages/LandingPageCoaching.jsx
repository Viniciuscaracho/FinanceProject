import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Check, ArrowRight, Instagram, Twitter, Mail, Mic, Brain,
  Moon, Dumbbell, MessageSquare, ArrowUpRight, AlertCircle, Sparkles, Plus,
} from 'lucide-react'

/* ─── Paleta de marca (Orbi Coach — indigo) ──────────────── */
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

const DISPLAY = { fontFamily: "'Space Grotesk', system-ui, sans-serif" }

/* ─── Dados de demo ──────────────────────────────────────── */

// Transcrição bruta do áudio do treinador (o que ele fala depois do treino)
const RAW_NOTE =
  'Marcos treinou pesado hoje, subiu a carga no agachamento pra 100 quilos. ' +
  'Dormiu mal essa semana, umas 5 horas por noite, tá reclamando de cansaço. ' +
  'Reclamou de um leve incômodo no joelho direito. Semana que vem baixa o volume e marca reavaliação.'

// Como a IA estrutura a nota
const STRUCTURED = [
  { icon: Moon,          label: 'Sono',          value: '~5h / noite — abaixo do ideal', color: '#6366F1' },
  { icon: Dumbbell,      label: 'Carga',         value: 'Agachamento 100 kg (subiu)',    color: '#F59E0B' },
  { icon: MessageSquare, label: 'Observação',    value: 'Incômodo leve no joelho direito', color: '#EF4444' },
  { icon: ArrowUpRight,  label: 'Próxima ação',  value: 'Reduzir volume + marcar reavaliação', color: '#10B981' },
]

/* ─── Hero: registro por voz → IA estrutura ──────────────── */
function VoiceToStructureUI() {
  // 0 = idle, 1 = gravando, 2 = transcrevendo, 3 = estruturando, 4 = pronto
  const [stage, setStage] = useState(0)
  const timers = useRef([])

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => () => clearTimers(), [])

  const run = () => {
    clearTimers()
    setStage(1)
    timers.current.push(setTimeout(() => setStage(2), 1400))
    timers.current.push(setTimeout(() => setStage(3), 3000))
    timers.current.push(setTimeout(() => setStage(4), 4400))
  }

  return (
    <div style={{ background: T.white, borderRadius: 20, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 24px 64px rgba(14,16,32,0.12)' }}>
      {/* Barra WhatsApp-like */}
      <div style={{ background: T.brand, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={16} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, ...DISPLAY }}>Orbi Coach</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', margin: 0 }}>número único da plataforma · só você fala</p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '3px 9px' }}>online</span>
      </div>

      <div style={{ background: T.bg, padding: '18px 16px', minHeight: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Bolha de áudio enviada pelo treinador */}
        <div style={{ alignSelf: 'flex-end', maxWidth: '86%', background: '#DCEBFF', border: '1px solid #C7D4EE', borderRadius: '14px 14px 4px 14px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mic size={14} color="#fff" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            {[10, 18, 8, 22, 14, 26, 12, 20, 9, 16, 24, 11, 19, 7].map((h, i) => (
              <span key={i} style={{ width: 2.5, height: h, borderRadius: 2, background: stage >= 1 ? T.brand : '#9DB0DA', display: 'block' }} />
            ))}
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.brand, ...DISPLAY }}>0:14</span>
        </div>

        {/* Transcrição */}
        {stage >= 2 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ alignSelf: 'flex-end', maxWidth: '92%', background: T.white, border: `1px solid ${T.border}`, borderRadius: '14px 14px 4px 14px', padding: '11px 13px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Transcrição</p>
            <p style={{ fontSize: 12.5, color: '#333', lineHeight: 1.6, margin: 0 }}>{RAW_NOTE}</p>
          </motion.div>
        )}

        {/* IA estruturando / resultado */}
        {stage === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 14px' }}>
            <Sparkles size={14} color={T.brand} />
            <span style={{ fontSize: 12.5, color: T.muted, ...DISPLAY }}>IA estruturando o registro…</span>
            <span className="oc-dots" style={{ fontSize: 12.5, color: T.brand, fontWeight: 700 }}>•••</span>
          </motion.div>
        )}

        {stage === 4 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ alignSelf: 'flex-start', width: '100%', background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 6px 20px rgba(14,16,32,0.06)' }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: T.brand }}>M</div>
              <p style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: 0, flex: 1, ...DISPLAY }}>Marcos Lima · timeline</p>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#10B981', background: '#ECFDF5', border: '1px solid #A7D4B6', borderRadius: 6, padding: '2px 8px' }}>salvo</span>
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STRUCTURED.map(({ icon: Icon, label, value, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={13} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                    <p style={{ fontSize: 12.5, color: T.text, margin: 0, lineHeight: 1.4 }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div style={{ flex: 1 }} />

        {/* Botão de ação */}
        <button
          onClick={run}
          style={{
            alignSelf: 'stretch', padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: stage === 1 ? '#EF4444' : T.brand, color: '#fff', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s', ...DISPLAY,
          }}>
          {stage === 0 && <><Mic size={15} /> Mandar um áudio de 14s</>}
          {stage === 1 && <><span className="oc-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'block' }} /> Gravando…</>}
          {stage === 2 && <>Transcrevendo…</>}
          {stage === 3 && <>Estruturando…</>}
          {stage === 4 && <><ArrowRight size={15} /> Ver de novo</>}
        </button>
      </div>

      <style>{`
        @keyframes oc-pulse-kf { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }
        .oc-pulse { animation: oc-pulse-kf 1s ease-in-out infinite }
        @keyframes oc-dots-kf { 0%,100% { opacity: 0.3 } 50% { opacity: 1 } }
        .oc-dots { animation: oc-dots-kf 1s ease-in-out infinite }
      `}</style>
    </div>
  )
}

/* ─── Resumo pré-atendimento ─────────────────────────────── */
function PreVisitSummaryUI() {
  const [ready, setReady] = useState(false)

  const summary = [
    'Subiu carga no agachamento (80 → 100 kg) nas últimas 3 semanas.',
    'Sono caiu para ~5h/noite — relatou cansaço em 2 dos últimos registros.',
    'Incômodo leve no joelho direito apareceu na sessão passada.',
    'Última reavaliação há 11 semanas — sugerido remarcar.',
  ]

  return (
    <div style={{ background: T.white, borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 12px 40px rgba(14,16,32,0.08)' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: T.brand, flexShrink: 0 }}>M</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0, ...DISPLAY }}>Marcos Lima</p>
          <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Atendimento hoje · 09:30 · Hipertrofia</p>
        </div>
      </div>

      <div style={{ padding: '18px 20px' }}>
        {!ready ? (
          <div style={{ textAlign: 'center', padding: '18px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: T.light, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Sparkles size={22} color={T.brand} />
            </div>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, maxWidth: 260, margin: '0 auto 16px' }}>
              12 registros nas últimas 6 semanas. A IA lê tudo e resume o que importa antes de você entrar na sessão.
            </p>
            <button onClick={() => setReady(true)}
              style={{ padding: '10px 22px', background: T.brand, color: '#fff', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, ...DISPLAY }}>
              <Brain size={15} /> Preparar atendimento
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Sparkles size={14} color={T.brand} />
              <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Resumo pré-atendimento</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {summary.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.09, duration: 0.35 }}
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.brand, flexShrink: 0, marginTop: 7 }} />
                  <p style={{ fontSize: 13, color: '#333', lineHeight: 1.6, margin: 0 }}>{s}</p>
                </motion.div>
              ))}
            </div>
            <button onClick={() => setReady(false)}
              style={{ marginTop: 16, fontSize: 12, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Gerar de novo →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

/* ─── Sparkline mínima ───────────────────────────────────── */
function Spark({ nums, color, w = 64, h = 24 }) {
  const max = Math.max(...nums), min = Math.min(...nums), range = max - min || 1, pad = 3
  const pts = nums.map((v, i) => {
    const x = pad + (i / (nums.length - 1)) * (w - pad * 2)
    const y = pad + (1 - (v - min) / range) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const last = pts.split(' ').pop().split(',')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={3} fill={color} />
    </svg>
  )
}

/* ─── Dashboard de alertas ───────────────────────────────── */
const ALERTS = [
  { name: 'Bruno Alves',    label: 'Sumiu',       sub: 'há 9 dias', color: '#EF4444', urgent: true },
  { name: 'Rafael Souza',   label: 'Dor',         sub: 'joelho · 2 registros', color: '#EF4444', urgent: true },
  { name: 'Carla Mendes',   label: 'Sem registro', sub: 'há 6 dias', color: '#F59E0B' },
  { name: 'Marcos Lima',    label: 'Reavaliação', sub: 'em 3 dias', color: '#3B82F6' },
]
const ATHLETES = [
  { initials: 'ML', name: 'Marcos Lima',   ago: 'hoje',   regs: 12, carga: [6, 7, 7, 8, 8, 9], sono: '5h', color: '#F59E0B' },
  { initials: 'JF', name: 'Júlia Ferreira', ago: 'ontem',  regs: 8,  carga: [5, 6, 6, 7, 7, 7], sono: '7h', color: '#10B981' },
  { initials: 'AR', name: 'Ana Rodrigues',  ago: '2d atrás', regs: 5, carga: [4, 5, 4, 5, 6, 6], sono: '6h', color: '#6366F1' },
]

function AlertsUI() {
  return (
    <div style={{ background: T.white, borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 12px 40px rgba(14,16,32,0.08)' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Brain size={17} color={T.brand} />
        <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0, flex: 1, ...DISPLAY }}>Coaching</p>
        {[['Atletas', '9'], ['Alertas', '4'], ['Registros', '68']].map(([l, v], i) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: i === 1 ? '#EF4444' : T.text, margin: 0, lineHeight: 1, ...DISPLAY }}>{v}</p>
            <p style={{ fontSize: 9, color: T.muted, margin: 0 }}>{l}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <AlertCircle size={12} color="#EF4444" />
          <span style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Precisam de você</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {ALERTS.map(a => (
            <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: `1px solid ${a.color}30`, borderRadius: 9, background: T.white }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text, flex: 1 }}>{a.name}</span>
              <span style={{ fontSize: 11, color: T.muted }}>{a.sub}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: a.color, background: a.color + '15', borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>{a.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {ATHLETES.map(at => (
            <div key={at.name} style={{ border: `1px solid ${T.border}`, borderRadius: 11, padding: 11, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: T.brand, flexShrink: 0 }}>{at.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{at.name}</p>
                  <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>{at.ago} · {at.regs} reg.</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, color: T.muted, fontWeight: 600 }}>Carga</span>
                <Spark nums={at.carga} color="#F59E0B" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, color: T.muted, fontWeight: 600 }}>Sono</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#6366F1' }}>{at.sono}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── AnimatedSection ────────────────────────────────────── */
function AnimatedSection({ children, className, delay = 0, style }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px 0px' }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Como funciona (3 passos) ───────────────────────────── */
const STEPS = [
  { icon: Mic,   title: 'Você fala', text: 'Depois do treino, manda um áudio de segundos pro número único da Orbi. Só você fala — o atleta nunca recebe nada.' },
  { icon: Brain, title: 'A IA estrutura', text: 'Sono, carga, observação e próxima ação são extraídos e salvos na timeline do atleta certo. Sem digitar, sem planilha.' },
  { icon: Sparkles, title: 'Você chega pronto', text: 'Resumo pré-atendimento na hora da sessão e alertas de quem sumiu ou precisa de atenção — sem garimpar conversa.' },
]

/* ─── Main ───────────────────────────────────────────────── */
export function LandingPageCoaching() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ ...DISPLAY }}>
      <Helmet>
        <title>Orbi Coach — o registro de voz que vira memória do atleta</title>
        <meta name="description" content="Treinadores: mande um áudio depois do treino e a IA estrutura sono, carga e observações na timeline de cada atleta. Resumo pré-atendimento pronto e alertas de quem precisa de você." />
        <link rel="canonical" href="https://orbi.com.br/coaching" />
        <meta property="og:title" content="Orbi Coach — o registro de voz que vira memória do atleta" />
        <meta property="og:description" content="Mande um áudio depois do treino. A IA estrutura e resume o histórico de cada atleta. Chegue em toda sessão sabendo o que importa." />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* ── Nav ──────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'background 0.2s, border-color 0.2s',
        background: scrolled ? 'rgba(247,248,252,0.92)' : 'transparent',
        borderBottom: `1px solid ${scrolled ? T.border : 'transparent'}`,
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={20} color={T.brand} />
            <span style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>Orbi Coach</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="/login" className="hidden sm:block" style={{
              fontSize: 13, fontWeight: 600, color: T.text,
              padding: '8px 16px', borderRadius: 8, textDecoration: 'none',
              border: `1px solid ${T.border}`, background: T.white,
            }}>
              Entrar
            </a>
            <a href="/login" style={{
              fontSize: 13, fontWeight: 600, color: T.white, background: T.text,
              padding: '8px 18px', borderRadius: 8, textDecoration: 'none',
            }}>
              Começar grátis
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{ background: T.bg, minHeight: '100dvh', display: 'flex', alignItems: 'center', paddingTop: 60 }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 w-full" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: '52rem', margin: '0 auto', textAlign: 'center' }}
          >
            <p style={{ fontSize: 12, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
              Para treinadores e personal trainers
            </p>

            <h1 style={{
              fontSize: 'clamp(2.75rem, 5.5vw, 4.5rem)',
              fontWeight: 700,
              color: T.text,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              marginBottom: '1.5rem',
              textWrap: 'balance',
            }}>
              Fale sobre o treino.<br />
              A IA <em style={{ fontStyle: 'normal', color: T.brand }}>vira memória.</em>
            </h1>

            <p style={{ fontSize: '1.1rem', color: T.muted, lineHeight: 1.75, maxWidth: '52ch', margin: '0 auto 2rem' }}>
              Depois de cada treino você manda um áudio de segundos. A IA estrutura
              sono, carga e observações na timeline de cada atleta — e te entrega o
              resumo pronto antes da próxima sessão. Sem planilha, sem garimpar conversa.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: '1rem' }}>
              <a href="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 26px', background: T.text, color: T.white,
                borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
              }}>
                Começar grátis <ArrowRight size={14} />
              </a>
              <a href="#como-funciona" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 20px', background: T.white, color: T.text,
                borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                border: `1px solid ${T.border}`,
              }}>
                Como funciona
              </a>
            </div>
            <p style={{ fontSize: 12, color: '#999', marginTop: '1rem' }}>
              14 dias grátis · sem cartão · cancele quando quiser
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: 460, margin: '3.5rem auto 0' }}
          >
            <VoiceToStructureUI />
          </motion.div>
        </div>
      </section>

      {/* ── Números ──────────────────────────────────────── */}
      <section style={{ background: T.white, borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E5EE]">
            {[
              { n: '14s',      label: 'para registrar um treino',   sub: 'no tempo de um áudio' },
              { n: '0',        label: 'planilha para manter',        sub: 'a IA organiza por atleta' },
              { n: 'Resumo',   label: 'pronto antes da sessão',      sub: 'o histórico que importa, sem garimpar' },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.08}>
                <div className="px-6 py-8 sm:px-8 sm:py-10" style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.04em', margin: '0 0 6px', lineHeight: 1 }}>{item.n}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: '0 0 4px' }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{item.sub}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ────────────────────────────────── */}
      <section id="como-funciona" style={{ background: T.bg, borderTop: `1px solid ${T.border}`, padding: '6rem 0' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <AnimatedSection style={{ maxWidth: '44ch', margin: '0 auto 3.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Como funciona</p>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              Três passos. Um áudio.
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '2rem' }}>
            {STEPS.map((s, i) => (
              <AnimatedSection key={s.title} delay={i * 0.1}>
                <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '1.75rem', height: '100%', textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: T.light, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <s.icon size={20} color={T.brand} />
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.brand, margin: '0 0 6px' }}>Passo {i + 1}</p>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: '0 0 8px', ...DISPLAY }}>{s.title}</h3>
                  <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.7, margin: 0 }}>{s.text}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}

      {/* Feature 1: Registro por voz */}
      <section style={{ background: T.white, borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
          <AnimatedSection style={{ maxWidth: '46ch', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Registro por voz</p>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem', textWrap: 'balance' }}>
              Do jeito que você já pensa.<br />
              <em style={{ fontStyle: 'normal', color: T.brand }}>Falando.</em>
            </h2>
            <p style={{ fontSize: '0.975rem', color: T.muted, lineHeight: 1.75, margin: '0 auto 1.5rem', maxWidth: '44ch' }}>
              Você fala como se estivesse contando pra alguém. A IA separa o que é
              sono, o que é carga, o que é observação clínica e qual a próxima ação —
              e guarda tudo na timeline do atleta certo.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto', display: 'inline-flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
              {[
                'Um áudio no número único da plataforma — só você fala',
                'Sono, carga, observação e próxima ação estruturados',
                'Salvo na timeline do atleta, sem digitar nada',
              ].map(item => (
                <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#444', lineHeight: 1.5 }}>
                  <Check size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 3 }} />
                  {item}
                </li>
              ))}
            </ul>
          </AnimatedSection>
          <AnimatedSection delay={0.1} style={{ maxWidth: 460, margin: '3rem auto 0' }}><VoiceToStructureUI /></AnimatedSection>
        </div>
      </section>

      {/* Feature 2: Resumo pré-atendimento (dark) */}
      <section style={{ background: T.dark, borderTop: '1px solid #1a1c2e' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
          <AnimatedSection style={{ maxWidth: '44ch', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#8B9AD4', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Resumo pré-atendimento</p>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem', textWrap: 'balance' }}>
              Chegue na sessão sabendo o que importa.
            </h2>
            <p style={{ fontSize: '0.975rem', color: '#9295b0', lineHeight: 1.75, margin: '0 auto 1.5rem', maxWidth: '42ch' }}>
              A funcionalidade que vende sozinha. Antes de cada atendimento, a IA lê
              as últimas semanas e resume a evolução do atleta — carga, sono, queixas
              e o que ficou pendente. Sem abrir conversa nenhuma.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto', display: 'inline-flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
              {[
                'Histórico recente resumido em segundos',
                'Tendências de carga e sono já agregadas',
                'Queixas e próximas ações destacadas',
              ].map(item => (
                <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#8286a3', lineHeight: 1.5 }}>
                  <Check size={14} color="#8B9AD4" style={{ flexShrink: 0, marginTop: 3 }} />
                  {item}
                </li>
              ))}
            </ul>
          </AnimatedSection>
          <AnimatedSection delay={0.1} style={{ maxWidth: 460, margin: '3rem auto 0' }}><PreVisitSummaryUI /></AnimatedSection>
        </div>
      </section>

      {/* Feature 3: Alertas automáticos */}
      <section style={{ background: T.white, borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
          <AnimatedSection style={{ maxWidth: '46ch', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Alertas automáticos</p>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem', textWrap: 'balance' }}>
              Quem sumiu aparece antes de você perceber.
            </h2>
            <p style={{ fontSize: '0.975rem', color: T.muted, lineHeight: 1.75, margin: '0 auto 1.5rem', maxWidth: '44ch' }}>
              Regras simples e confiáveis — sem caixa-preta. O painel destaca quem
              ficou sem registro, quem reclamou de dor, quem perdeu frequência e as
              reavaliações que estão chegando.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto', display: 'inline-flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
              {[
                'Atleta sem registro há X dias',
                'Queixa de dor sinalizada no painel',
                'Reavaliação próxima antes de virar atraso',
              ].map(item => (
                <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#444', lineHeight: 1.5 }}>
                  <Check size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 3 }} />
                  {item}
                </li>
              ))}
            </ul>
          </AnimatedSection>
          <AnimatedSection delay={0.1} style={{ maxWidth: 560, margin: '3rem auto 0' }}><AlertsUI /></AnimatedSection>
        </div>
      </section>

      {/* ── Depoimento ───────────────────────────────────── */}
      <section style={{ background: T.dark, borderTop: '1px solid #1a1c2e', padding: '6rem 0' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <AnimatedSection style={{ maxWidth: '56ch', margin: '0 auto 5rem', textAlign: 'center' }}>
            <p style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, color: '#fff', lineHeight: 1.3, letterSpacing: '-0.025em', marginBottom: '1.5rem', textWrap: 'balance' }}>
              "Eu já falava sobre os treinos no áudio pra mim mesmo. Agora esse áudio
              vira histórico organizado — e chego na sessão sem ter que lembrar de tudo de cabeça."
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 1, background: '#33364d' }} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#aaa', margin: 0 }}>Diego Martins</p>
                <p style={{ fontSize: 12, color: '#555', margin: 0 }}>Personal trainer · 24 atletas</p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1} className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '3rem', borderTop: '1px solid #1a1c2e', paddingTop: '3rem' }}>
            {[
              { text: 'O resumo antes do atendimento mudou o jogo. Chego sabendo exatamente onde parei com cada aluno, sem folhear caderno nem rolar conversa.', name: 'Larissa Prado', role: 'Treinadora de corrida' },
              { text: 'O alerta de quem sumiu me fez recuperar aluno que eu nem tinha percebido que tinha esfriado. Reativei três em uma semana.', name: 'Thiago Nunes', role: 'Personal trainer' },
            ].map((t, i) => (
              <div key={i}>
                <p style={{ fontSize: '1rem', color: '#777', lineHeight: 1.7, marginBottom: '1rem', fontWeight: 400 }}>"{t.text}"</p>
                <p style={{ fontSize: 13, color: '#555', margin: 0 }}>— {t.name}, <em style={{ fontStyle: 'normal', color: '#444' }}>{t.role}</em></p>
              </div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────── */}
      <section style={{ background: T.white, borderTop: `1px solid ${T.border}`, padding: '6rem 0' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-16 items-center">
            <AnimatedSection>
              <div>
                <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.5rem' }}>
                  Um preço.<br />Créditos que renovam.
                </h2>
                <p style={{ fontSize: '0.975rem', color: T.muted, lineHeight: 1.75, maxWidth: '46ch', marginBottom: '2rem' }}>
                  R$ 40 por mês com 200 áudios inclusos, que renovam todo ciclo. Precisou de
                  mais? Recarrega +100 áudios por R$ 15, quando quiser — sem tiers e sem fidelidade.
                  Resumos e alertas não consomem créditos.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '10px 24px' }}>
                  {[
                    'Registro por voz estruturado por IA',
                    'Timeline por atleta com busca',
                    'Resumo pré-atendimento',
                    'Alertas automáticos',
                    'Atletas ilimitados',
                    'Número único da plataforma',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#333' }}>
                      <Check size={13} color="#16a34a" style={{ flexShrink: 0 }} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, padding: '2.5rem 2rem' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Plano do piloto</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: T.muted, fontWeight: 500 }}>R$</span>
                  <span style={{ fontSize: 52, fontWeight: 700, color: T.text, letterSpacing: '-0.04em', lineHeight: 1 }}>40</span>
                  <span style={{ fontSize: 14, color: T.muted, fontWeight: 500 }}>/mês</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <Mic size={13} color={T.brand} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>200 áudios inclusos</p>
                </div>
                <p style={{ fontSize: 12, color: T.muted, margin: '0 0 1.5rem' }}>renovam todo mês · cancele quando quiser</p>
                <a href="/login" style={{
                  display: 'block', width: '100%', padding: '13px 0',
                  background: T.text, color: T.white, borderRadius: 10,
                  fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  textAlign: 'center', marginBottom: '0.75rem',
                }}>
                  Começar 14 dias grátis
                </a>
                <p style={{ fontSize: 11, color: '#999', textAlign: 'center', margin: '0 0 1.5rem' }}>
                  Sem cartão de crédito necessário
                </p>
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: T.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Plus size={17} color={T.brand} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>Recarga +100 áudios</p>
                    <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>avulsa, sem mexer na assinatura</p>
                  </div>
                  <span style={{ fontSize: 17, fontWeight: 700, color: T.text, flexShrink: 0 }}>R$ 15</span>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section style={{ background: T.bg, borderTop: `1px solid ${T.border}`, padding: '5rem 0' }}>
        <div className="max-w-3xl mx-auto px-6 sm:px-10">
          <AnimatedSection>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: T.text, letterSpacing: '-0.025em', marginBottom: '2.5rem', textAlign: 'center' }}>
              Perguntas frequentes
            </h2>
            <Accordion type="single" collapsible>
              {[
                { q: 'O atleta precisa instalar ou responder alguma coisa?', a: 'Não. O fluxo é unidirecional: só você fala com o número da plataforma. O atleta nunca recebe mensagem e não precisa de app nenhum.' },
                { q: 'De qual número eu mando o áudio?', a: 'Você usa o número único da Orbi (não o seu). Isso elimina a barreira de conectar seu WhatsApp pessoal e o risco de banimento por conexão não oficial.' },
                { q: 'Como a IA sabe de qual atleta é o registro?', a: 'Você menciona o nome no áudio e a IA roteia para o atleta certo. Quando não identifica com certeza, o registro vira uma pendência no painel para você confirmar com um toque.' },
                { q: 'A IA decide sozinha o que é alerta?', a: 'Não. Os alertas são regras determinísticas — sem registro há X dias, reavaliação próxima, queixa de dor. A IA é usada só para estruturar o áudio e escrever os resumos.' },
                { q: 'Como funcionam os créditos de áudio?', a: 'Cada áudio que você envia e a IA transcreve e estrutura consome 1 crédito. O plano inclui 200 créditos por mês, que renovam a cada ciclo. Precisou de mais? Recarrega +100 por R$ 15, sem mexer na assinatura. Resumos pré-atendimento e alertas não consomem créditos.' },
                { q: 'Posso cancelar quando quiser?', a: 'Sim. É um piloto sem fidelidade — cancele a qualquer momento, sem multa.' },
              ].map((item, i) => (
                <AccordionItem key={i} value={`q${i}`} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <AccordionTrigger style={{ fontSize: 14, fontWeight: 600, color: T.text, padding: '1.1rem 0', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, paddingBottom: '1.1rem' }}>
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section style={{ background: T.dark, padding: '6rem 0' }}>
        <div className="max-w-2xl mx-auto px-6 sm:px-10 text-center">
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8B9AD4', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1.25rem' }}>
            Comece hoje
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            Seu próximo áudio<br />vira memória do atleta.
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            {['Sem cartão de crédito', 'Cancele quando quiser', 'O atleta não precisa de nada'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                <Check size={13} color="#8B9AD4" />
                {item}
              </div>
            ))}
          </div>
          <a href="/login" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '15px 40px', background: '#fff', color: T.dark,
            borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)', ...DISPLAY,
          }}>
            Criar conta grátis
          </a>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: '1.5rem' }}>
            Ao criar sua conta você concorda com os{' '}
            <a href="/termos-de-uso" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'underline' }}>Termos de Uso</a>
            {' '}e{' '}
            <a href="/politica-de-privacidade" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'underline' }}>Política de Privacidade</a>.
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{ background: T.white, borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10" style={{ paddingTop: '3rem', paddingBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', marginBottom: '3rem' }}>
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Brain size={18} color={T.brand} />
                <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>Orbi Coach</p>
              </div>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: '0 0 1rem' }}>
                O registro de voz que vira memória do atleta — para treinadores que
                querem chegar em cada sessão sabendo o que importa.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                {[Instagram, Twitter, Mail].map((Icon, i) => (
                  <a key={i} href="#" style={{ color: '#bbb' }}>
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap' }}>
              {[
                { title: 'Produto', links: [
                  { label: 'Registro por voz', href: '#como-funciona' },
                  { label: 'Resumo pré-atendimento', href: '#como-funciona' },
                  { label: 'Alertas', href: '#como-funciona' },
                ]},
                { title: 'Empresa', links: [
                  { label: 'Entrar', href: '/login' },
                  { label: 'Termos', href: '/termos-de-uso' },
                  { label: 'Privacidade', href: '/politica-de-privacidade' },
                ]},
              ].map(col => (
                <div key={col.title}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>{col.title}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {col.links.map(l => (
                      <li key={l.label}><a href={l.href} style={{ fontSize: 13, color: T.muted, textDecoration: 'none' }}>{l.label}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>© 2026 Orbi. Todos os direitos reservados.</p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {['Segurança', 'Status'].map(l => (
                <a key={l} href="#" style={{ fontSize: 12, color: '#bbb', textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPageCoaching
