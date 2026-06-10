import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Check, ArrowRight, Instagram, Twitter, Mail } from 'lucide-react'
import FinanceDashboard from '@/components/design/FinanceDashboard'

const T = {
  bg:     '#F9F8F5',
  white:  '#FFFFFF',
  dark:   '#0E0E0E',
  brand:  '#4C60AA',
  text:   '#111111',
  muted:  '#6B6B6B',
  border: '#E3E2DF',
  light:  '#EFEFEC',
}

const DISPLAY = { fontFamily: "'Space Grotesk', system-ui, sans-serif" }

/* ─── Data ───────────────────────────────────────────────── */

const AGENDA = [
  { time: '08:00', name: 'Júlia Ferreira',  tag: 'Consulta Inicial',  price: 'R$ 200', done: true  },
  { time: '09:30', name: 'Marcos Lima',     tag: 'Retorno',           price: 'R$ 130', active: true },
  { time: '11:00', name: 'Ana Rodrigues',   tag: 'Av. Corporal',      price: 'R$  90' },
  { time: '14:00', name: 'Pedro Alves',     tag: 'Consulta Inicial',  price: 'R$ 200' },
  { time: '16:30', name: 'Carla Mendes',    tag: 'Retorno',           price: 'R$ 130' },
]

const PATIENTS_DATA = [
  { initials: 'JF', name: 'Júlia Ferreira',  tag: 'Emagrecimento', week: 'Semana 4', status: 'Ativo' },
  { initials: 'ML', name: 'Marcos Lima',     tag: 'Esportivo',     week: 'Semana 1', status: 'Ativo', active: true },
  { initials: 'AR', name: 'Ana Rodrigues',   tag: 'Funcional',     week: 'Semana 2', status: 'Ativo' },
  { initials: 'PA', name: 'Pedro Alves',     tag: 'Emagrecimento', week: '—',        status: 'Novo'  },
]

const PLANS_DATA = [
  { initials: 'ML', name: 'Marcos Lima',    plan: 'Hipertrofia + Controle', kcal: '2.400 kcal', updated: 'hoje',   active: true },
  { initials: 'JF', name: 'Júlia Ferreira', plan: 'Emagrecimento fase 2',   kcal: '1.600 kcal', updated: 'ontem' },
  { initials: 'AR', name: 'Ana Rodrigues',  plan: 'Manutenção pós-dieta',   kcal: '1.900 kcal', updated: '3 dias' },
]

const SIDEBAR_PATHS = [
  <path key="cal"  d="M8 2v3M16 2v3M3 8h18M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" strokeWidth="1.5" strokeLinecap="round" />,
  <path key="usr"  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="1.5" strokeLinecap="round" />,
  <path key="meal" d="M3 2h18M3 7h18M3 12h9M3 17h9M16 17l2 2 4-4" strokeWidth="1.5" strokeLinecap="round" />,
]

/* ─── AppPreview (hero demo) ─────────────────────────────── */
function AppPreview() {
  const [tab, setTab] = useState(0)

  return (
    <div style={{ background: T.white, borderRadius: 20, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.10)' }}>
      <div style={{ background: T.light, borderBottom: `1px solid ${T.border}`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#FC6058','#FEC02F','#2ACA44'].map(c => <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, display: 'block' }} />)}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 6, padding: '3px 16px', fontSize: 11, color: T.muted, width: 200, textAlign: 'center' }}>
            app.orbinutri.com.br
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', height: 400 }}>
        <div style={{ width: 52, background: '#0E1117', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16, gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', ...DISPLAY }}>O</div>
          <div style={{ width: '60%', height: 1, background: '#ffffff18', marginTop: 4 }} />
          {SIDEBAR_PATHS.map((path, i) => (
            <div key={i}
              onClick={() => setTab(i)}
              title={['Agenda', 'Pacientes', 'Planos'][i]}
              style={{
                width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i === tab ? '#ffffff14' : 'transparent',
                cursor: 'pointer', transition: 'background 0.15s',
              }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={i === tab ? '#fff' : '#ffffff50'}>{path}</svg>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, padding: 20, overflowY: 'hidden' }}>
          {tab === 0 && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 11, color: T.muted, marginBottom: 2, ...DISPLAY }}>Terça-feira, 20 Mai</p>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0, ...DISPLAY }}>Agenda de hoje</h3>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1, ...DISPLAY }}>5</p>
                  <p style={{ fontSize: 10, color: T.muted, margin: '2px 0 0' }}>consultas</p>
                </div>
                <div style={{ width: 1, background: T.border }} />
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 17, fontWeight: 700, color: '#16a34a', margin: 0, lineHeight: 1, ...DISPLAY }}>R$ 750</p>
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
                    <p style={{ fontSize: 10, color: apt.done ? '#DCDCDC' : T.muted, margin: 0 }}>{apt.tag}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: apt.done ? '#BDBDBD' : '#374151', flexShrink: 0 }}>{apt.price}</span>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: apt.done ? '#6ee7b7' : apt.active ? T.brand : T.border }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.muted, marginBottom: 6 }}>
                <span>1 de 5 concluídas</span><span>20%</span>
              </div>
              <div style={{ height: 4, background: T.light, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '20%', height: '100%', background: '#6ee7b7', borderRadius: 4 }} />
              </div>
            </div>
          </>}

          {tab === 1 && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0, ...DISPLAY }}>Pacientes</h3>
              <span style={{ fontSize: 11, color: T.muted }}>4 ativos</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {PATIENTS_DATA.map(p => (
                <div key={p.name} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 10,
                  background: p.active ? '#EEF2FA' : 'transparent',
                  border: p.active ? `1px solid #C7D4EE` : `1px solid ${T.border}`,
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: p.active ? T.brand : '#EEF2FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: p.active ? '#fff' : T.brand, flexShrink: 0 }}>{p.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...DISPLAY }}>{p.name}</p>
                    <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>{p.tag} · {p.week}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: p.status === 'Novo' ? '#FFF7ED' : '#ECFDF5', color: p.status === 'Novo' ? '#EA580C' : '#059669', flexShrink: 0 }}>{p.status}</span>
                </div>
              ))}
            </div>
          </>}

          {tab === 2 && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0, ...DISPLAY }}>Planos ativos</h3>
              <span style={{ fontSize: 11, color: T.muted }}>3 pacientes</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {PLANS_DATA.map(p => (
                <div key={p.name} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 10,
                  background: p.active ? '#EEF2FA' : 'transparent',
                  border: p.active ? `1px solid #C7D4EE` : `1px solid ${T.border}`,
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: p.active ? T.brand : '#EEF2FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: p.active ? '#fff' : T.brand, flexShrink: 0 }}>{p.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...DISPLAY }}>{p.name}</p>
                    <p style={{ fontSize: 10, color: T.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.plan}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, margin: 0 }}>{p.kcal}</p>
                    <p style={{ fontSize: 9, color: T.muted, margin: 0 }}>Atualizado {p.updated}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#ECFDF5', borderRadius: 10, border: '1px solid #A7D4B6' }}>
              <p style={{ fontSize: 11, color: '#059669', margin: 0 }}>
                <span style={{ fontWeight: 600 }}>Marcos Lima</span> acessou o plano alimentar há 2 horas — sem precisar de PDF.
              </p>
            </div>
          </>}
        </div>
      </div>
    </div>
  )
}

/* ─── BookingUI (interativo) ─────────────────────────────── */
function BookingUI() {
  const [selectedType, setSelectedType] = useState(0)
  const [selectedTime, setSelectedTime] = useState(2)
  const [confirmed, setConfirmed] = useState(false)

  const types = [
    { name: 'Consulta Inicial',    price: 'R$ 200', min: '60min' },
    { name: 'Retorno',            price: 'R$ 130', min: '45min' },
    { name: 'Avaliação Corporal', price: 'R$  90', min: '30min' },
  ]
  const times = ['08:00','09:30','10:00','11:00','14:00','14:30','16:00','16:30']

  if (confirmed) {
    return (
      <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ background: T.brand, padding: '20px 24px' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '0 0 3px', ...DISPLAY }}>Dra. Camila Rocha · CRN 12345</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, ...DISPLAY }}>Confirmação de consulta</p>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ECFDF5', border: '2px solid #6EE7B7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 4px', ...DISPLAY }}>Consulta agendada!</p>
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Dra. Camila Rocha</p>
          </div>
          <div style={{ background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`, padding: '12px 20px', width: '100%' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: '0 0 4px', ...DISPLAY }}>{types[selectedType].name}</p>
            <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Terça, 20 Mai · {times[selectedTime]} · {types[selectedType].min}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ECFDF5', borderRadius: 8, padding: '8px 14px', width: '100%' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.81h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 10a16 16 0 0 0 5.91 5.91l.79-.79a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>
            <p style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, margin: 0 }}>Confirmação enviada por WhatsApp</p>
          </div>
          <button
            onClick={() => { setConfirmed(false); setSelectedTime(2) }}
            style={{ marginTop: 4, fontSize: 12, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Agendar outra consulta →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
      <div style={{ background: T.brand, padding: '20px 24px' }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '0 0 3px', ...DISPLAY }}>Dra. Camila Rocha · CRN 12345</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, ...DISPLAY }}>Agendar consulta</p>
      </div>
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo de consulta</p>
        {types.map((s, i) => (
          <div key={s.name}
            onClick={() => setSelectedType(i)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderRadius: 10, marginBottom: 6, cursor: 'pointer',
              border: `1px solid ${i === selectedType ? T.brand : T.border}`,
              background: i === selectedType ? '#EEF2FA' : T.white,
              transition: 'all 0.15s',
            }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: i === selectedType ? T.brand : T.text, ...DISPLAY }}>{s.name}</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: T.muted }}>{s.min}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: i === selectedType ? T.brand : T.muted, ...DISPLAY }}>{s.price}</span>
            </div>
          </div>
        ))}
        <p style={{ fontSize: 11, fontWeight: 600, color: T.muted, margin: '18px 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Horários disponíveis</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {times.map((t, i) => (
            <div key={t}
              onClick={() => setSelectedTime(i)}
              style={{
                textAlign: 'center', padding: '8px 4px', borderRadius: 8,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${i === selectedTime ? T.brand : T.border}`,
                background: i === selectedTime ? T.brand : T.white,
                color: i === selectedTime ? '#fff' : T.text,
                transition: 'all 0.15s',
                ...DISPLAY,
              }}>{t}</div>
          ))}
        </div>
        <button
          onClick={() => setConfirmed(true)}
          style={{ width: '100%', marginTop: 18, padding: '12px 0', background: T.brand, color: '#fff', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', ...DISPLAY }}>
          Confirmar consulta
        </button>
      </div>
    </div>
  )
}

/* ─── WeekUI (interativo) ────────────────────────────────── */
const WEEK = [
  { day: 'Seg', n: [{ h: '08:00', l: 'Júlia F.' }, { h: '14:00', l: 'Pedro A.' }] },
  { day: 'Ter', n: [{ h: '09:30', l: 'Marcos L.' }] },
  { day: 'Qua', n: [{ h: '08:00', l: 'Ana R.' }, { h: '11:00', l: 'Carla M.' }, { h: '15:00', l: 'Beatriz S.' }] },
  { day: 'Qui', n: [{ h: '09:00', l: 'Fernanda' }, { h: '14:00', l: 'Lucas R.' }] },
  { day: 'Sex', n: [{ h: '10:00', l: 'Marina T.' }] },
]

const DAY_SCHEDULE = [
  { time: '08:00', empty: true },
  { time: '09:30', name: 'Marcos Lima',   tag: 'Retorno · 45min',           active: true },
  { time: '11:00', name: 'Ana Rodrigues', tag: 'Av. Corporal · 30min' },
  { time: '12:00', empty: true },
  { time: '14:00', name: 'Pedro Alves',   tag: 'Consulta Inicial · 60min' },
  { time: '16:30', name: 'Carla Mendes',  tag: 'Retorno · 45min' },
]

function MesView() {
  const startDay = 4 // May 1, 2026 = Friday (Mon-indexed)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const cells = [...Array(startDay).fill(null), ...days]
  const hasApts = [1, 5, 6, 7, 8, 12, 13, 14, 15, 19, 20, 21, 22, 26, 27, 28, 29]
  const today = 20

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
        {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#444', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => (
          <div key={i} style={{ height: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: d === today ? T.brand : 'transparent' }}>
            {d && <>
              <span style={{ fontSize: 11, fontWeight: d === today ? 700 : 500, color: d === today ? '#fff' : '#666', lineHeight: 1 }}>{d}</span>
              {hasApts.includes(d) && d !== today && <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.brand + '99', marginTop: 2 }} />}
            </>}
          </div>
        ))}
      </div>
    </div>
  )
}

function WeekUI() {
  const [view, setView] = useState('semana')

  return (
    <div style={{ background: '#18181B', borderRadius: 20, overflow: 'hidden', border: '1px solid #2A2A2D' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2D', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div>
          <p style={{ fontSize: 10, color: '#666', margin: 0, ...DISPLAY }}>Maio 2026</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, ...DISPLAY }}>
            {view === 'dia' ? 'Terça-feira, 20 Mai' : view === 'mes' ? 'Maio 2026' : 'Semana atual'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 2, background: '#111', borderRadius: 8, padding: 3, flexShrink: 0 }}>
          {['Dia','Semana','Mês'].map(v => {
            const key = v === 'Dia' ? 'dia' : v === 'Semana' ? 'semana' : 'mes'
            return (
              <button key={v} onClick={() => setView(key)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: view === key ? '#2A2A2D' : 'transparent', color: view === key ? '#fff' : '#555', transition: 'all 0.15s', ...DISPLAY }}>{v}</button>
            )
          })}
        </div>
      </div>

      {view === 'semana' && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: '#111', padding: 1, minWidth: 380 }}>
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
      )}

      {view === 'dia' && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DAY_SCHEDULE.map((slot, i) => (
            slot.empty ? (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.35 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#555', width: 38, flexShrink: 0, ...DISPLAY }}>{slot.time}</span>
                <div style={{ flex: 1, height: 1, background: '#2A2A2D' }} />
              </div>
            ) : (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: slot.active ? '#7A95C0' : '#555', width: 38, flexShrink: 0, ...DISPLAY }}>{slot.time}</span>
                <div style={{ flex: 1, background: slot.active ? T.brand + '22' : '#222', border: `1px solid ${slot.active ? T.brand + '55' : '#2A2A2D'}`, borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: slot.active ? '#A8C0E0' : '#777', margin: '0 0 2px', ...DISPLAY }}>{slot.name}</p>
                  <p style={{ fontSize: 10, color: '#555', margin: 0 }}>{slot.tag}</p>
                </div>
                {slot.active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.brand, flexShrink: 0, boxShadow: `0 0 0 3px ${T.brand}33` }} />}
              </div>
            )
          ))}
        </div>
      )}

      {view === 'mes' && <MesView />}
    </div>
  )
}

/* ─── MealPlanUI (interativo) ────────────────────────────── */
const MEAL_DATA = [
  {
    macros: { prot: '128 g', carb: '185 g', fat: '48 g' },
    meals: [
      { label: 'Café da manhã', kcal: 340, items: ['Tapioca com queijo cottage (1 un.)', 'Café com leite desnatado (200 ml)'] },
      { label: 'Almoço',        kcal: 580, items: ['Arroz integral (3 col. sopa)', 'Feijão carioca (2 col.)', 'Frango grelhado (120 g)'] },
      { label: 'Lanche',        kcal: 160, items: ['Banana-prata (1 un.)', 'Castanha-do-Pará (2 un.)'] },
    ],
  },
  {
    macros: { prot: '142 g', carb: '198 g', fat: '52 g' },
    meals: [
      { label: 'Café da manhã', kcal: 380, items: ['Aveia com banana (1 xícara + 1 un.)', 'Iogurte grego sem açúcar (170 g)'] },
      { label: 'Almoço',        kcal: 620, items: ['Arroz integral (3 col. sopa)', 'Frango grelhado (150 g)', 'Brócolis refogado (100 g)'] },
      { label: 'Lanche',        kcal: 180, items: ['Maçã (1 unidade)', 'Amendoim sem sal (30 g)'] },
    ],
  },
  {
    macros: { prot: '150 g', carb: '210 g', fat: '44 g' },
    meals: [
      { label: 'Café da manhã', kcal: 310, items: ['Pão integral c/ pasta de amendoim (2 fatias)', 'Laranja (1 un.)'] },
      { label: 'Almoço',        kcal: 640, items: ['Macarrão integral (100 g)', 'Atum natural (120 g)', 'Salada verde à vontade'] },
      { label: 'Lanche',        kcal: 200, items: ['Whey protein (30 g) com água', 'Banana (1 un.)'] },
    ],
  },
  {
    macros: { prot: '138 g', carb: '192 g', fat: '50 g' },
    meals: [
      { label: 'Café da manhã', kcal: 360, items: ['Ovo mexido (2 un.) + pão integral (1 fatia)', 'Suco de laranja natural (150 ml)'] },
      { label: 'Almoço',        kcal: 590, items: ['Arroz integral (3 col.)', 'Carne magra grelhada (130 g)', 'Cenoura e abobrinha (100 g)'] },
      { label: 'Lanche',        kcal: 170, items: ['Iogurte grego (170 g)', 'Mel (1 col. chá)'] },
    ],
  },
  {
    macros: { prot: '145 g', carb: '175 g', fat: '58 g' },
    meals: [
      { label: 'Café da manhã', kcal: 420, items: ['Panqueca de aveia com banana (2 un.)', 'Café preto sem açúcar'] },
      { label: 'Almoço',        kcal: 560, items: ['Quinoa cozida (100 g)', 'Salmão grelhado (130 g)', 'Aspargos no vapor (80 g)'] },
      { label: 'Lanche',        kcal: 150, items: ['Mix de frutas vermelhas (150 g)', 'Castanhas variadas (20 g)'] },
    ],
  },
]

function MealPlanUI() {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
  const [activeDay, setActiveDay] = useState(1)
  const data = MEAL_DATA[activeDay]

  return (
    <div style={{ background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: T.muted, margin: '0 0 2px' }}>Marcos Lima</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0, ...DISPLAY }}>Plano Alimentar · Semana 3</p>
        </div>
        <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#059669' }}>Ao vivo</div>
      </div>
      <div style={{ display: 'flex', background: T.bg, borderBottom: `1px solid ${T.border}` }}>
        {days.map((d, i) => (
          <button key={d} onClick={() => setActiveDay(i)} style={{
            flex: 1, padding: '9px 4px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
            background: i === activeDay ? T.white : 'transparent',
            color: i === activeDay ? T.brand : T.muted,
            borderBottom: i === activeDay ? `2px solid ${T.brand}` : '2px solid transparent',
            transition: 'all 0.15s', ...DISPLAY,
          }}>{d}</button>
        ))}
      </div>
      <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.meals.map(meal => (
          <div key={meal.label} style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: T.bg, borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text, ...DISPLAY }}>{meal.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>{meal.kcal} kcal</span>
            </div>
            <div style={{ padding: '9px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {meal.items.map(item => (
                <p key={item} style={{ fontSize: 11, color: '#666', margin: 0, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#BDBDBD', flexShrink: 0, lineHeight: 1.5 }}>·</span>{item}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${T.border}` }}>
        {[
          { label: 'Proteína', val: data.macros.prot },
          { label: 'Carboidrato', val: data.macros.carb },
          { label: 'Gordura', val: data.macros.fat },
        ].map((m, i) => (
          <div key={m.label} style={{ padding: '12px 16px', borderRight: i < 2 ? `1px solid ${T.border}` : 'none' }}>
            <p style={{ fontSize: 10, color: T.muted, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0, ...DISPLAY }}>{m.val}</p>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${T.border}`, padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6EE7B7', flexShrink: 0 }} />
        <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Atualizado às 14h22 · paciente acessa pelo app, sem PDF</p>
      </div>
    </div>
  )
}

/* ─── ProntuarioUI ───────────────────────────────────────── */
function ProntuarioUI() {
  return (
    <div style={{ background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EEF2FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: T.brand, flexShrink: 0 }}>A</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0, ...DISPLAY }}>Ana Beatriz Santos</p>
          <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>28 anos · Nutricionista: Dra. Camila Rocha</p>
        </div>
        <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#059669' }}>Ativo</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: `1px solid ${T.border}` }}>
        {[
          { label: 'Peso',    value: '62,4 kg', delta: '-1,2 kg', positive: true  },
          { label: 'IMC',     value: '22,8',    delta: 'Normal',  positive: null  },
          { label: 'Gordura', value: '24,1%',   delta: '-0,8%',   positive: true  },
        ].map((m, i) => (
          <div key={m.label} style={{ padding: '14px 16px', borderRight: i < 2 ? `1px solid ${T.border}` : 'none' }}>
            <p style={{ fontSize: 10, color: T.muted, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: '0 0 2px', ...DISPLAY }}>{m.value}</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: m.positive === true ? '#16a34a' : m.positive === false ? '#dc2626' : T.muted, margin: 0 }}>{m.delta}</p>
          </div>
        ))}
      </div>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Última evolução</p>
          <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>17 mai 2026</p>
        </div>
        <div style={{ background: T.bg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${T.border}`, marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: '#444', lineHeight: 1.7, margin: 0 }}>
            Paciente relata boa adesão ao plano. Hidratação melhorou. Redução de 1,2 kg no período. Ajustar carboidratos no pré-treino para 30 g. Retorno em 21 dias.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[
            { date: '24 abr', text: 'Início da dieta de emagrecimento. Meta: -4 kg em 90 dias.' },
            { date: '03 abr', text: 'Avaliação inicial e anamnese alimentar completa realizada.' },
          ].map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 10, color: '#BDBDBD', flexShrink: 0, paddingTop: 2, width: 40 }}>{n.date}</span>
              <p style={{ fontSize: 11, color: '#999', margin: 0, lineHeight: 1.5 }}>{n.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── VitrineProfileUI ───────────────────────────────────── */
function VitrineProfileUI() {
  return (
    <div style={{ background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
      <div style={{ background: T.bg, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
        <p style={{ fontSize: 10, color: T.muted, margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Descobrir · São Paulo</p>
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 14px', fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke={T.muted} strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M12 12l2.5 2.5" strokeLinecap="round"/></svg>
          Nutricionistas em São Paulo...
        </div>
      </div>
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: '#EEF2FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: T.brand, flexShrink: 0 }}>C</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 1px', ...DISPLAY }}>Dra. Camila Rocha</p>
                <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Nutricionista · CRN 12345</p>
              </div>
              <div style={{ background: '#EEF2FA', borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 600, color: T.brand }}>Online</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '8px 0' }}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} viewBox="0 0 12 12" width="11" height="11"><path d="M6 1l1.35 2.74L10.5 4.2l-2.25 2.19.53 3.11L6 8l-2.78 1.5.53-3.11L1.5 4.2l3.15-.46L6 1z" fill="#FBBF24"/></svg>
              ))}
              <span style={{ fontSize: 11, color: T.muted, marginLeft: 3 }}>5,0 · 47 avaliações</span>
            </div>
            <p style={{ fontSize: 12, color: '#555', lineHeight: 1.6, margin: '0 0 10px' }}>
              Especialista em emagrecimento e nutrição esportiva. Atendimento online e presencial em SP.
            </p>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
              {['Emagrecimento', 'Esportiva', 'Online'].map(tag => (
                <span key={tag} style={{ fontSize: 11, padding: '3px 10px', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, color: '#555', fontWeight: 500 }}>{tag}</span>
              ))}
            </div>
            <button style={{ width: '100%', padding: '10px 0', background: T.brand, color: '#fff', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', ...DISPLAY }}>
              Agendar consulta
            </button>
          </div>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 20px', background: T.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>+84 nutricionistas disponíveis em SP</p>
        <a href="/descobrir" style={{ fontSize: 11, fontWeight: 600, color: T.brand, textDecoration: 'none' }}>Ver todos →</a>
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

/* ─── Main ───────────────────────────────────────────────── */
export function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ ...DISPLAY }}>
      <Helmet>
        <title>OrbiNutri — Gestão completa para nutricionistas</title>
        <meta name="description" content="Agenda online, gestão de pacientes e vitrine profissional para nutricionistas. Lembretes por WhatsApp, cobranças automáticas e controle financeiro." />
        <link rel="canonical" href="https://orbinutri.com.br/" />
        <meta property="og:url" content="https://orbinutri.com.br/" />
        <meta property="og:title" content="OrbiNutri — Gestão completa para nutricionistas" />
        <meta property="og:description" content="Agenda online, gestão de pacientes e vitrine profissional para nutricionistas. Lembretes por WhatsApp, cobranças automáticas e controle financeiro." />
        <meta property="og:image" content="https://orbinutri.com.br/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content="https://orbinutri.com.br/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': 'https://orbinutri.com.br/#organization',
              name: 'OrbiNutri',
              url: 'https://orbinutri.com.br',
              logo: {
                '@type': 'ImageObject',
                url: 'https://orbinutri.com.br/icon-512.png',
                width: 512,
                height: 512,
              },
              description: 'Plataforma de gestão para nutricionistas com agenda online, gestão de pacientes e vitrine profissional.',
              areaServed: 'BR',
              knowsAbout: ['Nutrição', 'Software de gestão para nutricionistas', 'Agendamento online'],
            },
            {
              '@type': 'SoftwareApplication',
              '@id': 'https://orbinutri.com.br/#app',
              name: 'OrbiNutri',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web, iOS, Android',
              inLanguage: 'pt-BR',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'BRL',
                description: 'Plano gratuito disponível',
              },
              featureList: 'Agenda online, gestão de pacientes, vitrine profissional, lembretes por WhatsApp, cobranças automáticas, controle financeiro',
              screenshot: 'https://orbinutri.com.br/og-image.png',
              url: 'https://orbinutri.com.br',
              publisher: { '@id': 'https://orbinutri.com.br/#organization' },
            },
          ],
        })}</script>
      </Helmet>

      {/* ── Nav ──────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'background 0.2s, border-color 0.2s',
        background: scrolled ? 'rgba(249,248,245,0.92)' : 'transparent',
        borderBottom: `1px solid ${scrolled ? T.border : 'transparent'}`,
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>OrbiNutri</span>
            <Link to="/descobrir" className="hidden sm:flex" style={{ alignItems: 'center', fontSize: 13, fontWeight: 500, color: T.muted, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = T.text}
              onMouseLeave={e => e.currentTarget.style.color = T.muted}>
              Descobrir nutricionistas
            </Link>
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
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-center">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <p style={{ fontSize: 12, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
                Para nutricionistas
              </p>

              <h1 style={{
                fontSize: 'clamp(2.75rem, 5.5vw, 4.5rem)',
                fontWeight: 700,
                color: T.text,
                lineHeight: 1.05,
                letterSpacing: '-0.035em',
                marginBottom: '1.5rem',
              }}>
                Pare de usar<br />
                3 ferramentas<br />
                <em style={{ fontStyle: 'normal', color: T.brand }}>para 1 trabalho.</em>
              </h1>

              <p style={{ fontSize: '1.1rem', color: T.muted, lineHeight: 1.75, maxWidth: '48ch', marginBottom: '2rem' }}>
                Plano alimentar ao vivo no app do paciente, agenda com Google Calendar integrado
                e financeiro sem planilha. Tudo conectado — sem exportar PDF, sem alternar entre Webdiet, Livance e planilha.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: '1rem' }}>
                <a href="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '13px 26px', background: T.text, color: T.white,
                  borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                }}>
                  Criar conta grátis <ArrowRight size={14} />
                </a>
                <a href="/descobrir" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 20px', background: T.white, color: T.text,
                  borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  border: `1px solid ${T.border}`,
                }}>
                  Ver nutricionistas
                </a>
              </div>
              <a href="#produto" style={{ fontSize: 13, color: T.muted, textDecoration: 'none', fontWeight: 500 }}>
                Ver como funciona ↓
              </a>
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

      {/* ── Números ──────────────────────────────────────── */}
      <section style={{ background: T.white, borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E3E2DF]">
            {[
              { n: '3h',       label: 'por semana economizadas',   sub: 'em gestão administrativa' },
              { n: '0 faltas', label: 'com lembretes automáticos', sub: 'via WhatsApp antes da consulta' },
              { n: '14 dias',  label: 'de teste sem compromisso',  sub: 'sem cartão de crédito' },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.08}>
                <div className="px-6 py-8 sm:px-8 sm:py-10">
                  <p style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.04em', margin: '0 0 6px', lineHeight: 1 }}>{item.n}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: '0 0 4px' }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{item.sub}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <div id="produto">

        {/* Feature 1: Agendamento */}
        <section style={{ background: T.bg, borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-7xl mx-auto px-6 sm:px-10" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-center">
              <AnimatedSection>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Agendamento</p>
                <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                  Um link.<br />O paciente agenda<br />sozinho.
                </h2>
                <p style={{ fontSize: '0.975rem', color: T.muted, lineHeight: 1.75, marginBottom: '1.5rem', maxWidth: '40ch' }}>
                  Compartilhe no Instagram, WhatsApp ou no seu site. O paciente escolhe o tipo de consulta e o horário disponível — e recebe confirmação automática sem você precisar responder nada.
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

        {/* Feature 2: Agenda + Google Calendar */}
        <section style={{ background: T.dark, borderTop: `1px solid #1f1f1f` }}>
          <div className="max-w-7xl mx-auto px-6 sm:px-10" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-20 items-center">
              <AnimatedSection><WeekUI /></AnimatedSection>
              <AnimatedSection delay={0.1}>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Agenda & Google Calendar</p>
                <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                  A semana<br />inteira de<br />um olhar.
                </h2>
                <p style={{ fontSize: '0.975rem', color: '#888', lineHeight: 1.75, marginBottom: '1.5rem', maxWidth: '38ch' }}>
                  Vista diária, semanal e mensal. Cada consulta confirmada sincroniza com seu Google Calendar — com o link do Meet já incluído e convite enviado ao paciente.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Vista diária, semanal e mensal',
                    'Sincroniza com Google Calendar — Meet incluído',
                    'Convite enviado ao paciente automaticamente',
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

        {/* Feature 3: Plano alimentar */}
        <section style={{ background: T.white, borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-7xl mx-auto px-6 sm:px-10" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-center">
              <AnimatedSection>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Plano alimentar</p>
                <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                  O plano que<br />atualiza sozinho.<br />
                  <em style={{ fontStyle: 'normal', color: T.brand }}>Sem PDF.</em>
                </h2>
                <p style={{ fontSize: '0.975rem', color: T.muted, lineHeight: 1.75, marginBottom: '1.5rem', maxWidth: '40ch' }}>
                  O paciente acessa o plano pelo celular — qualquer ajuste que você fizer aparece na hora, sem criar novo PDF, sem reenviar arquivo, sem mandar no WhatsApp.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Plano acessível pelo app em tempo real',
                    'Ajuste qualquer refeição — o paciente vê na hora',
                    'Macros e kcal calculados automaticamente',
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#444', lineHeight: 1.5 }}>
                      <Check size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 3 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </AnimatedSection>
              <AnimatedSection delay={0.1}><MealPlanUI /></AnimatedSection>
            </div>
          </div>
        </section>

        {/* Feature 4: Prontuários */}
        <section style={{ background: T.bg, borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-7xl mx-auto px-6 sm:px-10" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-center">
              <AnimatedSection>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Prontuários</p>
                <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                  O histórico<br />completo de<br />cada paciente.
                </h2>
                <p style={{ fontSize: '0.975rem', color: T.muted, lineHeight: 1.75, marginBottom: '1.5rem', maxWidth: '40ch' }}>
                  Evoluções clínicas, medidas antropométricas e documentos organizados por paciente. Tudo acessível em segundos — sem papel, sem foto no WhatsApp, sem procurar em pasta.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Evolução clínica com histórico datado por consulta',
                    'Peso, IMC e gordura rastreados ao longo do tempo',
                    'Documentos e laudos anexados ao prontuário',
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#444', lineHeight: 1.5 }}>
                      <Check size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 3 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </AnimatedSection>
              <AnimatedSection delay={0.1}><ProntuarioUI /></AnimatedSection>
            </div>
          </div>
        </section>

        {/* Feature 5: Financeiro */}
        <section style={{ background: T.white, borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-7xl mx-auto px-6 sm:px-10" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-center">
              <AnimatedSection>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Financeiro</p>
                <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                  Da consulta ao<br />fechamento.<br />
                  <em style={{ fontStyle: 'normal', color: T.brand }}>Sem planilha.</em>
                </h2>
                <p style={{ fontSize: '0.975rem', color: T.muted, lineHeight: 1.75, marginBottom: '1.5rem', maxWidth: '40ch' }}>
                  Cada consulta vira automaticamente uma entrada financeira. Honorários, pagamentos recebidos e inadimplências organizados em tempo real — o fechamento do mês leva menos de dois minutos.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Consulta confirmada vira receita automaticamente',
                    'Visão mensal de entradas, saídas e saldo',
                    'Fechamento do mês em menos de 2 minutos',
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#444', lineHeight: 1.5 }}>
                      <Check size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 3 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </AnimatedSection>
              <AnimatedSection delay={0.1} style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
                <FinanceDashboard />
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Feature 6: Vitrine */}
        <section style={{ background: T.bg, borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-7xl mx-auto px-6 sm:px-10" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-center">
              <AnimatedSection>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Vitrine pública</p>
                <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                  Seja encontrado<br />por quem busca<br />um nutricionista.
                </h2>
                <p style={{ fontSize: '0.975rem', color: T.muted, lineHeight: 1.75, marginBottom: '1.5rem', maxWidth: '40ch' }}>
                  Seu perfil aparece no Descobrir — o diretório do OrbiNutri onde pacientes buscam nutricionistas por especialidade e cidade. Uma presença online pronta, sem precisar de site.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Perfil com especialidade, localização e serviços',
                    'Botão de agendamento direto no perfil público',
                    'Avaliações de pacientes visíveis para novos contatos',
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#444', lineHeight: 1.5 }}>
                      <Check size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 3 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </AnimatedSection>
              <AnimatedSection delay={0.1}><VitrineProfileUI /></AnimatedSection>
            </div>
          </div>
        </section>
      </div>

      {/* ── Depoimentos ──────────────────────────────────── */}
      <section style={{ background: T.dark, borderTop: `1px solid #1f1f1f`, padding: '6rem 0' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <AnimatedSection style={{ maxWidth: '52ch', marginBottom: '5rem' }}>
            <p style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, color: '#fff', lineHeight: 1.3, letterSpacing: '-0.025em', marginBottom: '1.5rem' }}>
              "Antes eu mandava o plano por PDF e toda atualização virava um transtorno. Agora o paciente abre o app e já está lá. Economizo pelo menos 3 horas por semana."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 1, background: '#333' }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#aaa', margin: 0 }}>Dra. Renata Oliveira</p>
                <p style={{ fontSize: 12, color: '#555', margin: 0 }}>Nutricionista clínica, CRN 8903</p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1} className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '3rem', borderTop: '1px solid #1f1f1f', paddingTop: '3rem' }}>
            {[
              { text: 'O link de agendamento praticamente zerou as faltas sem aviso. Quando preciso ajustar o plano entre consultas, o paciente já vê no app na mesma hora.', name: 'Felipe Costa', role: 'Nutricionista esportivo' },
              { text: 'Finalmente parei de usar Livance + Webdiet + planilha separados. Tudo integrado num lugar só. O fechamento do mês que levava uma tarde agora leva 5 minutos.', name: 'Dra. Juliana Matos', role: 'Nutricionista funcional' },
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
                  Um plano.<br />Tudo incluído.
                </h2>
                <p style={{ fontSize: '0.975rem', color: T.muted, lineHeight: 1.75, maxWidth: '44ch', marginBottom: '2rem' }}>
                  Sem tiers, sem funcionalidades escondidas no plano premium. R$ 19 por mês e você tem acesso a tudo desde o primeiro dia.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '10px 24px' }}>
                  {[
                    'Agenda online ilimitada',
                    'Link de agendamento público',
                    'Plano alimentar ao vivo',
                    'Lembretes por WhatsApp',
                    'Prontuários e evoluções clínicas',
                    'Google Meet automático',
                    'Financeiro sem planilha',
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
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, padding: '2.5rem 2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, color: T.muted, fontWeight: 500 }}>R$</span>
                    <span style={{ fontSize: 52, fontWeight: 700, color: T.text, letterSpacing: '-0.04em', lineHeight: 1 }}>19</span>
                    <span style={{ fontSize: 14, color: T.muted, fontWeight: 500 }}>/mês</span>
                  </div>
                  <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>ou R$ 190/ano — 2 meses grátis</p>
                </div>
                <a href="/login?tab=register" style={{
                  display: 'block', width: '100%', padding: '13px 0',
                  background: T.text, color: T.white, borderRadius: 10,
                  fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  textAlign: 'center', marginBottom: '1rem',
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

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section style={{ background: T.bg, borderTop: `1px solid ${T.border}`, padding: '5rem 0' }}>
        <div className="max-w-3xl mx-auto px-6 sm:px-10">
          <AnimatedSection>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: T.text, letterSpacing: '-0.025em', marginBottom: '2.5rem' }}>
              Perguntas frequentes
            </h2>
            <Accordion type="single" collapsible>
              {[
                { q: 'Preciso de cartão de crédito para testar?', a: 'Não. Você usa tudo por 14 dias sem precisar cadastrar nenhum cartão. Só pedimos dados de pagamento se quiser continuar depois.' },
                { q: 'O plano alimentar funciona como substituto do Webdiet?', a: 'Para o essencial, sim. Você monta o plano por alimentos com kcal e macros calculados automaticamente. O paciente acessa pelo celular sem PDF. Funcionalidades avançadas como diário alimentar por foto ficam para versões futuras.' },
                { q: 'Como funciona a integração com o Google Calendar?', a: 'Você conecta sua conta Google nas configurações. A partir daí cada consulta confirmada aparece automaticamente na sua agenda com o link do Google Meet incluído e convite enviado ao paciente.' },
                { q: 'Posso ter mais de um nutricionista na mesma conta?', a: 'Sim. Cadastre sua equipe, configure a agenda de cada um individualmente e acompanhe os atendimentos separadamente.' },
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

      {/* ── CTA ──────────────────────────────────────────── */}
      <section id="cta" style={{ background: T.dark, padding: '6rem 0' }}>
        <div className="max-w-2xl mx-auto px-6 sm:px-10 text-center">
          <p style={{ fontSize: 11, fontWeight: 700, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1.25rem' }}>
            Comece hoje
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            14 dias grátis.<br />Sem compromisso.
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            {['Sem cartão de crédito', 'Cancele quando quiser', 'Tudo incluído'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                <Check size={13} color={T.brand} />
                {item}
              </div>
            ))}
          </div>
          <a href="/login" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '15px 40px', background: '#fff', color: T.dark,
            borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            ...DISPLAY,
          }}>
            Criar conta com Google
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
              <p style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>OrbiNutri</p>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: '0 0 1rem' }}>
                Gestão completa para nutricionistas — agenda, plano alimentar e financeiro em um só lugar.
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
                  { label: 'Agendamento', href: '#' },
                  { label: 'Plano Alimentar', href: '#' },
                  { label: 'Prontuários', href: '#' },
                  { label: 'Financeiro', href: '#' },
                ]},
                { title: 'Empresa', links: [
                  { label: 'Sobre', href: '#' },
                  { label: 'Preços', href: '#' },
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
            <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>© 2026 OrbiNutri. Todos os direitos reservados.</p>
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
