import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Check, ArrowRight, Instagram, Twitter, Mail } from 'lucide-react'
import FinanceDashboard from '@/components/design/FinanceDashboard'

/* ─── Tokens ─────────────────────────────────────────────────
   Aplicados como inline style onde dark mode não deve interferir.
   Tailwind usado apenas para layout e spacing.
──────────────────────────────────────────────────────────── */
const T = {
  bg:      '#F9F8F5',   // off-white quente
  white:   '#FFFFFF',
  dark:    '#0E0E0E',   // quase-preto, não slate-900
  brand:   '#4C60AA',
  text:    '#111111',
  muted:   '#6B6B6B',
  border:  '#E3E2DF',
  light:   '#EFEFEC',
}

/* ─── Tipografia: Space Grotesk do index.html ────────────── */
const DISPLAY = { fontFamily: "'Space Grotesk', system-ui, sans-serif" }

/* ─── Sub-componentes de produto ─────────────────────────── */

const AGENDA = [
  { time: '09:00', name: 'Rafael Mendes',  tag: 'Consultoria Jurídica', price: 'R$ 350', done: true  },
  { time: '11:00', name: 'Patrícia Lima',  tag: 'Treino Funcional',     price: 'R$ 90',  active: true },
  { time: '14:00', name: 'Bruno Alves',    tag: 'Aula de Espanhol',     price: 'R$ 110' },
  { time: '15:30', name: 'Camila Torres',  tag: 'Avaliação Física',     price: 'R$ 150' },
  { time: '17:00', name: 'Diego Souza',    tag: 'Contrato Imobiliário', price: 'R$ 480' },
]

function AppPreview() {
  return (
    <div style={{ background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.10)' }}>
      {/* browser chrome */}
      <div style={{ background: T.light, borderBottom: `1px solid ${T.border}`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#FC6058','#FEC02F','#2ACA44'].map(c => <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, display: 'block' }} />)}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 6, padding: '3px 16px', fontSize: 11, color: T.muted, width: 180, textAlign: 'center' }}>
            app.orbi.com.br
          </div>
        </div>
      </div>

      {/* app */}
      <div style={{ display: 'flex', height: 400 }}>
        {/* sidebar */}
        <div style={{ width: 52, background: '#0E1117', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16, gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', ...DISPLAY }}>O</div>
          <div style={{ width: 1, background: '#ffffff18', height: 1, width: '60%', marginTop: 4 }} />
          {[
            <path key="cal" d="M8 2v3M16 2v3M3 8h18M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" strokeWidth="1.5" strokeLinecap="round" />,
            <path key="dol" d="M12 2v20M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" strokeWidth="1.5" strokeLinecap="round" />,
            <path key="usr" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="1.5" strokeLinecap="round" />,
          ].map((path, i) => (
            <div key={i} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i === 0 ? '#ffffff14' : 'transparent' }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={i === 0 ? '#fff' : '#ffffff50'}>{path}</svg>
            </div>
          ))}
        </div>

        {/* main */}
        <div style={{ flex: 1, padding: 20, overflowY: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <p style={{ fontSize: 11, color: T.muted, marginBottom: 2, ...DISPLAY }}>Segunda-feira, 19 Dez</p>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0, ...DISPLAY }}>Agenda de hoje</h3>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1, ...DISPLAY }}>8</p>
                <p style={{ fontSize: 10, color: T.muted, margin: '2px 0 0' }}>atendimentos</p>
              </div>
              <div style={{ width: 1, background: T.border }} />
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#16a34a', margin: 0, lineHeight: 1, ...DISPLAY }}>R$ 1.180</p>
                <p style={{ fontSize: 10, color: T.muted, margin: '2px 0 0' }}>previsto</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {AGENDA.map(apt => (
              <div key={apt.name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 10,
                background: apt.active ? '#EEF2FA' : 'transparent',
                border: apt.active ? `1px solid #C7D4EE` : '1px solid transparent',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, width: 36, flexShrink: 0, color: apt.done ? '#BDBDBD' : apt.active ? T.brand : T.muted, ...DISPLAY }}>{apt.time}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: apt.done ? '#BDBDBD' : T.text, margin: 0, textDecoration: apt.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...DISPLAY }}>{apt.name}</p>
                  <p style={{ fontSize: 10, color: apt.done ? '#DCDCDC' : T.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apt.tag}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: apt.done ? '#BDBDBD' : '#374151', flexShrink: 0 }}>{apt.price}</span>
                <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: apt.done ? '#6ee7b7' : apt.active ? T.brand : T.border }} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.muted, marginBottom: 6 }}>
              <span>2 de 8 concluídos</span><span>25%</span>
            </div>
            <div style={{ height: 4, background: T.light, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: '25%', height: '100%', background: '#6ee7b7', borderRadius: 4 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingUI() {
  return (
    <div style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
      <div style={{ background: T.brand, padding: '20px 24px' }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '0 0 3px', ...DISPLAY }}>Studio Andrade</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, ...DISPLAY }}>Agendar atendimento</p>
      </div>
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Escolha o serviço</p>
        {[
          { name: 'Corte + Barba', price: 'R$ 55', min: '60min', active: true },
          { name: 'Corte Simples',  price: 'R$ 35', min: '30min' },
          { name: 'Barba',          price: 'R$ 25', min: '20min' },
        ].map(s => (
          <div key={s.name} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', borderRadius: 10, marginBottom: 6, cursor: 'pointer',
            border: `1px solid ${s.active ? T.brand : T.border}`,
            background: s.active ? '#EEF2FA' : T.white,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: s.active ? T.brand : T.text, ...DISPLAY }}>{s.name}</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: T.muted }}>{s.min}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.active ? T.brand : T.muted, ...DISPLAY }}>{s.price}</span>
            </div>
          </div>
        ))}
        <p style={{ fontSize: 11, fontWeight: 600, color: T.muted, margin: '18px 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Horários disponíveis</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {['09:00','09:30','10:00','11:00','14:00','14:30','15:00','16:00'].map((t, i) => (
            <div key={t} style={{
              textAlign: 'center', padding: '8px 4px', borderRadius: 8,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${i === 2 ? T.brand : T.border}`,
              background: i === 2 ? T.brand : T.white,
              color: i === 2 ? '#fff' : T.text,
              ...DISPLAY,
            }}>{t}</div>
          ))}
        </div>
        <button style={{ width: '100%', marginTop: 18, padding: '12px 0', background: T.brand, color: '#fff', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', ...DISPLAY }}>
          Confirmar agendamento
        </button>
      </div>
    </div>
  )
}

/* Week view for dark section */
const WEEK = [
  { day: 'Seg', n: [{ h: '09:00', l: 'Rafael M.' }, { h: '14:00', l: 'Ana L.' }] },
  { day: 'Ter', n: [{ h: '10:00', l: 'Patrícia' }] },
  { day: 'Qua', n: [{ h: '08:00', l: 'Bruno A.' }, { h: '11:00', l: 'Camila' }, { h: '15:30', l: 'Diego S.' }] },
  { day: 'Qui', n: [{ h: '09:30', l: 'Fernanda' }, { h: '13:00', l: 'Lucas R.' }] },
  { day: 'Sex', n: [{ h: '11:00', l: 'Marina' }] },
]

function WeekUI() {
  return (
    <div style={{ background: '#18181B', borderRadius: 14, overflow: 'hidden', border: '1px solid #2A2A2D' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 10, color: '#666', margin: 0, ...DISPLAY }}>Dezembro 2025</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, ...DISPLAY }}>Semana atual</p>
        </div>
        <div style={{ display: 'flex', gap: 2, background: '#111', borderRadius: 8, padding: 3 }}>
          {['Dia','Semana','Mês'].map((v, i) => (
            <button key={v} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: i === 1 ? '#2A2A2D' : 'transparent', color: i === 1 ? '#fff' : '#555', ...DISPLAY }}>{v}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: '#111', padding: 1 }}>
        {WEEK.map(col => (
          <div key={col.day} style={{ background: '#18181B' }}>
            <div style={{ padding: '10px 8px 6px', borderBottom: '1px solid #222' }}>
              <p style={{ fontSize: 10, color: '#555', textAlign: 'center', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', ...DISPLAY }}>{col.day}</p>
            </div>
            <div style={{ padding: 6, minHeight: 160, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {col.n.map(apt => (
                <div key={apt.h} style={{ background: T.brand + '25', border: `1px solid ${T.brand}55`, borderRadius: 7, padding: '6px 8px' }}>
                  <p style={{ fontSize: 9, color: '#7A95C0', fontWeight: 700, margin: '0 0 2px', ...DISPLAY }}>{apt.h}</p>
                  <p style={{ fontSize: 10, color: '#A8C0E0', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apt.l}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── AnimatedSection ────────────────────────────────────── */

function AnimatedSection({ children, className, delay = 0, style }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px 0px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.title = 'Orbi — Agenda e Financeiro para Profissionais'
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ ...DISPLAY }}>

      {/* ── Nav ──────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'background 0.2s, border-color 0.2s',
        background: scrolled ? 'rgba(249,248,245,0.92)' : 'transparent',
        borderBottom: `1px solid ${scrolled ? T.border : 'transparent'}`,
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-10" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>Orbi</span>
          <a href="#cta" style={{
            fontSize: 13, fontWeight: 600, color: T.white, background: T.text,
            padding: '8px 18px', borderRadius: 8, textDecoration: 'none',
            transition: 'background 0.15s',
          }}>
            Começar grátis
          </a>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          HERO — editorial, assimétrico
      ══════════════════════════════════════════════════ */}
      <section style={{ background: T.bg, minHeight: '100dvh', display: 'flex', alignItems: 'center', paddingTop: 60 }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-10 w-full" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-12 lg:gap-16 items-center">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <p style={{ fontSize: 12, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
                Para psicólogos e profissionais de saúde
              </p>

              <h1 style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 700,
                color: T.text,
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                marginBottom: '1.5rem',
              }}>
                Tudo que você precisa<br />
                para organizar seus<br />
                <em style={{ fontStyle: 'normal', color: T.brand }}>atendimentos.</em>
              </h1>

              <p style={{ fontSize: '1.05rem', color: T.muted, lineHeight: 1.7, maxWidth: '46ch', marginBottom: '2rem' }}>
                Agenda online, pagamentos, lembretes, documentos e presença no Descobrir —
                num único sistema feito para quem atende por hora marcada.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <a href="#cta" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', background: T.text, color: T.white,
                  borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  transition: 'background 0.15s',
                }}>
                  Criar conta grátis <ArrowRight size={14} />
                </a>
                <a href="#produto" style={{ fontSize: 13, color: T.muted, textDecoration: 'none', fontWeight: 500 }}>
                  Ver como funciona ↓
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
            >
              <AppPreview />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          NÚMEROS — densidade alta, sem cards, só tipografia
      ══════════════════════════════════════════════════ */}
      <section style={{ background: T.white, borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { n: '3h',        label: 'por semana economizadas',      sub: 'em gestão administrativa' },
              { n: '0 faltas',  label: 'com lembretes automáticos',    sub: 'via WhatsApp antes da sessão' },
              { n: '14 dias',   label: 'de teste sem compromisso',     sub: 'sem cartão de crédito' },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.08}>
              <div style={{
                padding: '2.5rem 2rem',
                borderRight: i < 2 ? `1px solid ${T.border}` : 'none',
              }}>
                <p style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.04em', margin: '0 0 6px', lineHeight: 1 }}>{item.n}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: '0 0 4px' }}>{item.label}</p>
                <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{item.sub}</p>
              </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURES — composições variadas
      ══════════════════════════════════════════════════ */}
      <div id="produto">

        {/* — Feature 1: Agendamento — 35/65, produto vai à borda */}
        <section style={{ background: T.bg, borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-6xl mx-auto px-6 sm:px-10" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-start">
              <AnimatedSection style={{ paddingTop: '1rem' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Agendamento</p>
                <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                  Um link.<br />O cliente agenda<br />sozinho.
                </h2>
                <p style={{ fontSize: '0.975rem', color: T.muted, lineHeight: 1.75, marginBottom: '1.5rem', maxWidth: '40ch' }}>
                  Compartilhe no Instagram, WhatsApp ou site. O paciente escolhe sessão e horário disponível — e recebe confirmação automática sem você precisar responder nada.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Disponível 24h por dia, 7 dias por semana',
                    'Lembrete por WhatsApp antes da consulta',
                    'Paciente cancela ou reagenda pelo próprio link',
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#444', lineHeight: 1.5 }}>
                      <Check size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 3 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </AnimatedSection>
              <AnimatedSection delay={0.1}><BookingUI /></AnimatedSection>
            </div>
          </div>
        </section>

        {/* — Feature 2: Agenda visual — fundo escuro, composição invertida */}
        <section style={{ background: T.dark, borderTop: `1px solid #1f1f1f` }}>
          <div className="max-w-6xl mx-auto px-6 sm:px-10" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-20 items-start">
              <AnimatedSection><WeekUI /></AnimatedSection>
              <AnimatedSection delay={0.1} style={{ paddingTop: '1rem' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Agenda</p>
                <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                  A semana<br />inteira de<br />um olhar.
                </h2>
                <p style={{ fontSize: '0.975rem', color: '#888', lineHeight: 1.75, marginBottom: '1.5rem', maxWidth: '38ch' }}>
                  Vista diária, semanal e mensal. Horários bloqueiam automaticamente no link público quando ocupados. Sua agenda, sem buracos.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Vista diária, semanal e mensal',
                    'Google Meet gerado automaticamente',
                    'Notas de atendimento por sessão',
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#777', lineHeight: 1.5 }}>
                      <Check size={14} color={T.brand} style={{ flexShrink: 0, marginTop: 3 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* — Feature 3: Financeiro — texto no topo, dashboard abaixo */}
        <section style={{ background: T.white, borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-6xl mx-auto px-6 sm:px-10" style={{ paddingTop: '5rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20" style={{ marginBottom: '3.5rem' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Financeiro</p>
                <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
                  Do agendamento ao<br />fechamento. Sem planilha.
                </h2>
              </div>
              <div style={{ paddingTop: '0.25rem' }}>
                <p style={{ fontSize: '0.975rem', color: T.muted, lineHeight: 1.75, maxWidth: '48ch' }}>
                  Cada sessão vira automaticamente uma entrada financeira. Honorários, pagamentos recebidos e inadimplências organizados em tempo real —
                  o fechamento do mês leva menos de dois minutos.
                </p>
              </div>
            </div>

            <AnimatedSection delay={0.05} style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <FinanceDashboard />
            </AnimatedSection>
          </div>
        </section>
      </div>

      {/* ══════════════════════════════════════════════════
          DEPOIMENTOS — pull quote editorial (sem cards iguais)
      ══════════════════════════════════════════════════ */}
      <section style={{ background: T.dark, borderTop: `1px solid #1f1f1f`, padding: '6rem 0' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-10">

          {/* Pull quote principal */}
          <AnimatedSection style={{ maxWidth: '52ch', marginBottom: '5rem' }}>
            <p style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.3,
              letterSpacing: '-0.025em',
              marginBottom: '1.5rem',
            }}>
              "Antes eu controlava honorários e comissões da minha sócia em planilha. Agora tudo é automático. Economizo 3 horas por semana só no fechamento do mês."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 1, background: '#333' }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#aaa', margin: 0 }}>Dra. Mariana Fonseca</p>
                <p style={{ fontSize: 12, color: '#555', margin: 0 }}>Advogada, Direito de Família</p>
              </div>
            </div>
          </AnimatedSection>

          {/* Duas citações menores */}
          <AnimatedSection delay={0.1} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', borderTop: '1px solid #1f1f1f', paddingTop: '3rem' }} className="grid-cols-1 sm:grid-cols-2">
            {[
              { text: 'O link de agendamento praticamente zerou as faltas sem aviso. O controle do que cada aluno me deve ficou muito mais simples.', name: 'Felipe Andrade', role: 'Professor de idiomas' },
              { text: 'Vejo minha agenda da semana, controlo o que cada aluno me deve e acompanho minhas metas financeiras no mesmo lugar.', name: 'Camila Rocha', role: 'Personal trainer' },
            ].map((t, i) => (
              <div key={i}>
                <p style={{ fontSize: '1rem', color: '#777', lineHeight: 1.7, marginBottom: '1rem', fontWeight: 400 }}>"{t.text}"</p>
                <p style={{ fontSize: 13, color: '#555', margin: 0 }}>— {t.name}, <em style={{ fontStyle: 'normal', color: '#444' }}>{t.role}</em></p>
              </div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          PRICING — sem card centralizado, assimétrico
      ══════════════════════════════════════════════════ */}
      <section style={{ background: T.white, borderTop: `1px solid ${T.border}`, padding: '6rem 0' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-16 items-start">

            <AnimatedSection>
            <div>
              <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.5rem' }}>
                Um plano.<br />Tudo incluído.
              </h2>
              <p style={{ fontSize: '0.975rem', color: T.muted, lineHeight: 1.75, maxWidth: '44ch', marginBottom: '2rem' }}>
                Sem tiers, sem funcionalidades escondidas no plano premium. R$ 19 por mês e você tem acesso a tudo desde o primeiro dia.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
                {[
                  'Agenda online ilimitada',
                  'Link de agendamento público',
                  'Lembretes por WhatsApp',
                  'Controle financeiro completo',
                  'Notas de atendimento por sessão',
                  'Google Meet automático',
                  'Documentos profissionais',
                  'Perfil no Descobrir',
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
            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: '2.5rem 2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: T.muted, fontWeight: 500 }}>R$</span>
                  <span style={{ fontSize: 52, fontWeight: 700, color: T.text, letterSpacing: '-0.04em', lineHeight: 1 }}>19</span>
                  <span style={{ fontSize: 14, color: T.muted, fontWeight: 500 }}>/mês</span>
                </div>
                <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>ou R$ 190/ano — 2 meses grátis</p>
              </div>
              <a href="#cta" style={{
                display: 'block', width: '100%', padding: '13px 0',
                background: T.text, color: T.white, borderRadius: 10,
                fontSize: 14, fontWeight: 600, textDecoration: 'none',
                textAlign: 'center', marginBottom: '1rem',
                transition: 'background 0.15s',
              }}>
                Começar 14 dias grátis
              </a>
              <p style={{ fontSize: 11, color: '#999', textAlign: 'center', margin: 0 }}>
                Sem cartão de crédito necessário
              </p>
            </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FAQ — limpo, sem decoração
      ══════════════════════════════════════════════════ */}
      <section style={{ background: T.bg, borderTop: `1px solid ${T.border}`, padding: '5rem 0' }}>
        <div className="max-w-2xl mx-auto px-6 sm:px-10">
          <AnimatedSection>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: T.text, letterSpacing: '-0.025em', marginBottom: '2.5rem' }}>
            Perguntas frequentes
          </h2>
          <Accordion type="single" collapsible>
            {[
              { q: 'Preciso de cartão de crédito para testar?', a: 'Não. Você usa tudo por 14 dias sem precisar cadastrar nenhum cartão. Só pedimos dados de pagamento se quiser continuar depois.' },
              { q: 'Funciona para qualquer profissional de saúde?', a: 'Sim. Psicólogos, psiquiatras, fisioterapeutas, nutricionistas, fonoaudiólogos, médicos — qualquer profissional que atende por hora marcada.' },
              { q: 'Posso ter mais de um profissional na mesma conta?', a: 'Sim. Cadastre sua equipe, configure comissões individualmente e acompanhe a agenda e financeiro de cada um separadamente.' },
              { q: 'O sistema funciona no celular?', a: 'Sim, é totalmente responsivo. Funciona em smartphones, tablets e computadores sem instalar nada.' },
              { q: 'Posso cancelar quando quiser?', a: 'Sim. Sem multa e sem fidelidade. Cancele pela própria plataforma a qualquer momento.' },
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

      {/* ══════════════════════════════════════════════════
          CTA — mínimo, direto
      ══════════════════════════════════════════════════ */}
      <section id="cta" style={{ background: T.brand, padding: '5rem 0' }}>
        <div className="max-w-2xl mx-auto px-6 sm:px-10 text-center">
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1rem' }}>
            Comece a organizar seus atendimentos hoje.
          </h2>
          <p style={{ fontSize: '0.975rem', color: 'rgba(255,255,255,0.65)', marginBottom: '2rem' }}>
            14 dias grátis. Sem cartão. Cancele quando quiser.
          </p>
          <form onSubmit={e => { e.preventDefault(); window.location.href = '/login' }}
            style={{ display: 'flex', gap: 8, maxWidth: 420, margin: '0 auto', flexWrap: 'wrap' }}>
            <input
              type="email"
              required
              placeholder="seu@email.com"
              style={{
                flex: 1, minWidth: 200, padding: '12px 16px',
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 10, fontSize: 14, color: '#fff',
                outline: 'none', ...DISPLAY,
              }}
            />
            <button type="submit" style={{
              padding: '12px 22px', background: '#fff', color: T.brand,
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap', ...DISPLAY,
              transition: 'background 0.15s',
            }}>
              Criar conta grátis
            </button>
          </form>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: '1rem' }}>
            Ao criar sua conta você concorda com os Termos de Uso e Política de Privacidade.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER — dois níveis, minimal
      ══════════════════════════════════════════════════ */}
      <footer style={{ background: T.white, borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-10" style={{ padding: '3rem 0 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', marginBottom: '3rem' }}>
            <div style={{ maxWidth: 280 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>Orbi</p>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: '0 0 1rem' }}>
                Gestão de agenda e financeiro para profissionais que atendem clientes.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                {[Instagram, Twitter, Mail].map((Icon, i) => (
                  <a key={i} href="#" style={{ color: '#bbb', transition: 'color 0.15s' }}>
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap' }}>
              {[
                { title: 'Produto', links: ['Agendamento', 'Financeiro', 'Comissões', 'Relatórios'] },
                { title: 'Empresa', links: ['Sobre', 'Preços', 'Termos', 'Privacidade'] },
              ].map(col => (
                <div key={col.title}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>{col.title}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {col.links.map(l => (
                      <li key={l}><a href="#" style={{ fontSize: 13, color: T.muted, textDecoration: 'none' }}>{l}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>© 2025 Orbi. Todos os direitos reservados.</p>
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
