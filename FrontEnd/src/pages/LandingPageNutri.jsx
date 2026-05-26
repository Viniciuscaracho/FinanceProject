import { useState, useEffect } from 'react'
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
  bg:     '#F7FAF8',
  white:  '#FFFFFF',
  dark:   '#0D1710',
  brand:  '#1B6E3A',
  text:   '#111111',
  muted:  '#6B6B6B',
  border: '#DDE8E1',
  light:  '#EBF3EE',
}

const DISPLAY = { fontFamily: "'Space Grotesk', system-ui, sans-serif" }

/* ─── AppPreview ──────────────────────────────────────────── */
const AGENDA = [
  { time: '08:00', name: 'Julia Ferreira',  tag: 'Consulta Inicial',    price: 'R$ 200', done: true  },
  { time: '09:30', name: 'Marcos Lima',     tag: 'Retorno',             price: 'R$ 130', active: true },
  { time: '11:00', name: 'Ana Rodrigues',   tag: 'Avaliação Corporal',  price: 'R$  90' },
  { time: '14:00', name: 'Pedro Alves',     tag: 'Consulta Inicial',    price: 'R$ 200' },
  { time: '16:30', name: 'Carla Mendes',    tag: 'Retorno',             price: 'R$ 130' },
]

const PATIENTS_DATA = [
  { initials: 'JF', name: 'Julia Ferreira',  tag: 'Emagrecimento', week: 'Semana 4', status: 'Ativo' },
  { initials: 'ML', name: 'Marcos Lima',     tag: 'Esportivo',     week: 'Semana 1', status: 'Ativo', active: true },
  { initials: 'AR', name: 'Ana Rodrigues',   tag: 'Funcional',     week: 'Semana 2', status: 'Ativo' },
  { initials: 'PA', name: 'Pedro Alves',     tag: 'Emagrecimento', week: '—',        status: 'Novo'  },
]

const PLANS_DATA = [
  { initials: 'ML', name: 'Marcos Lima',    plan: 'Hipertrofia + Controle', kcal: '2.400 kcal', updated: 'hoje',   active: true },
  { initials: 'JF', name: 'Julia Ferreira', plan: 'Emagrecimento fase 2',   kcal: '1.600 kcal', updated: 'ontem' },
  { initials: 'AR', name: 'Ana Rodrigues',  plan: 'Manutenção pós-dieta',   kcal: '1.900 kcal', updated: '3 dias' },
]

const SIDEBAR_PATHS = [
  <path key="cal"  d="M8 2v3M16 2v3M3 8h18M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" strokeWidth="1.5" strokeLinecap="round" />,
  <path key="usr"  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="1.5" strokeLinecap="round" />,
  <path key="meal" d="M3 2h18M3 7h18M3 12h9M3 17h9M16 17l2 2 4-4" strokeWidth="1.5" strokeLinecap="round" />,
]

function AppPreview() {
  const [tab, setTab] = useState(0)

  return (
    <div style={{ background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.10)' }}>
      {/* browser chrome */}
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
        {/* sidebar */}
        <div style={{ width: 52, background: '#0D1710', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16, gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', ...DISPLAY }}>N</div>
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

        {/* content */}
        <div style={{ flex: 1, padding: 20, overflowY: 'hidden' }}>

          {/* ── Agenda ── */}
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
                  background: apt.active ? '#EBF5EE' : 'transparent',
                  border: apt.active ? `1px solid #A7D4B6` : '1px solid transparent',
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

          {/* ── Pacientes ── */}
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
                  background: p.active ? '#EBF5EE' : 'transparent',
                  border: p.active ? `1px solid #A7D4B6` : `1px solid ${T.border}`,
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: p.active ? T.brand : '#E5F0EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: p.active ? '#fff' : T.brand, flexShrink: 0 }}>{p.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...DISPLAY }}>{p.name}</p>
                    <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>{p.tag} · {p.week}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: p.status === 'Novo' ? '#FFF7ED' : '#ECFDF5', color: p.status === 'Novo' ? '#EA580C' : '#059669', flexShrink: 0 }}>{p.status}</span>
                </div>
              ))}
            </div>
          </>}

          {/* ── Planos ── */}
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
                  background: p.active ? '#EBF5EE' : 'transparent',
                  border: p.active ? `1px solid #A7D4B6` : `1px solid ${T.border}`,
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: p.active ? T.brand : '#E5F0EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: p.active ? '#fff' : T.brand, flexShrink: 0 }}>{p.initials}</div>
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

/* ─── BookingUI ───────────────────────────────────────────── */
function BookingUI() {
  return (
    <div style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
      <div style={{ background: T.brand, padding: '20px 24px' }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '0 0 3px', ...DISPLAY }}>Dra. Camila Rocha · CRN 12345</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, ...DISPLAY }}>Agendar consulta</p>
      </div>
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo de consulta</p>
        {[
          { name: 'Consulta Inicial',    price: 'R$ 200', min: '60min', active: true },
          { name: 'Retorno',             price: 'R$ 130', min: '45min' },
          { name: 'Avaliação Corporal',  price: 'R$  90', min: '30min' },
        ].map(s => (
          <div key={s.name} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', borderRadius: 10, marginBottom: 6, cursor: 'pointer',
            border: `1px solid ${s.active ? T.brand : T.border}`,
            background: s.active ? '#EBF5EE' : T.white,
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
          {['08:00','09:30','10:00','11:00','14:00','14:30','16:00','16:30'].map((t, i) => (
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
          Confirmar consulta
        </button>
      </div>
    </div>
  )
}

/* ─── WeekUI ──────────────────────────────────────────────── */
const WEEK = [
  { day: 'Seg', n: [{ h: '08:00', l: 'Julia F.' }, { h: '14:00', l: 'Pedro A.' }] },
  { day: 'Ter', n: [{ h: '09:30', l: 'Marcos L.' }] },
  { day: 'Qua', n: [{ h: '08:00', l: 'Ana R.' }, { h: '11:00', l: 'Carla M.' }, { h: '15:00', l: 'Beatriz S.' }] },
  { day: 'Qui', n: [{ h: '09:00', l: 'Fernanda' }, { h: '14:00', l: 'Lucas R.' }] },
  { day: 'Sex', n: [{ h: '10:00', l: 'Marina T.' }] },
]

function WeekUI() {
  return (
    <div style={{ background: '#0D1710', borderRadius: 14, overflow: 'hidden', border: '1px solid #1A2E1F' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1A2E1F', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div>
          <p style={{ fontSize: 10, color: '#4A6B52', margin: 0, ...DISPLAY }}>Maio 2026</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, ...DISPLAY }}>Semana atual</p>
        </div>
        <div style={{ display: 'flex', gap: 2, background: '#111', borderRadius: 8, padding: 3, flexShrink: 0 }}>
          {['Dia','Semana','Mês'].map((v, i) => (
            <button key={v} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: i === 1 ? '#1A2E1F' : 'transparent', color: i === 1 ? '#fff' : '#555', ...DISPLAY }}>{v}</button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: '#111', padding: 1, minWidth: 380 }}>
        {WEEK.map(col => (
          <div key={col.day} style={{ background: '#0D1710' }}>
            <div style={{ padding: '10px 8px 6px', borderBottom: '1px solid #1A2E1F' }}>
              <p style={{ fontSize: 10, color: '#3D5E46', textAlign: 'center', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', ...DISPLAY }}>{col.day}</p>
            </div>
            <div style={{ padding: 6, minHeight: 160, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {col.n.map(apt => (
                <div key={apt.h} style={{ background: T.brand + '28', border: `1px solid ${T.brand}55`, borderRadius: 7, padding: '6px 8px' }}>
                  <p style={{ fontSize: 9, color: '#7ABF92', fontWeight: 700, margin: '0 0 2px', ...DISPLAY }}>{apt.h}</p>
                  <p style={{ fontSize: 10, color: '#A8D4B4', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apt.l}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}

/* ─── MealPlanUI ──────────────────────────────────────────── */
function MealPlanUI() {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
  const meals = [
    {
      label: 'Café da manhã', kcal: 380,
      items: ['Aveia com banana (1 xícara + 1 un.)', 'Iogurte grego sem açúcar (170 g)'],
    },
    {
      label: 'Almoço', kcal: 620,
      items: ['Arroz integral (3 col. sopa)', 'Frango grelhado (150 g)', 'Brócolis refogado (100 g)'],
    },
    {
      label: 'Lanche', kcal: 180,
      items: ['Maçã (1 unidade)', 'Amendoim sem sal (30 g)'],
    },
  ]
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
          <button key={d} style={{
            flex: 1, padding: '9px 4px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
            background: i === 1 ? T.white : 'transparent',
            color: i === 1 ? T.brand : T.muted,
            borderBottom: i === 1 ? `2px solid ${T.brand}` : '2px solid transparent',
            ...DISPLAY,
          }}>{d}</button>
        ))}
      </div>
      <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {meals.map(meal => (
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
          { label: 'Proteína', val: '142 g' },
          { label: 'Carboidrato', val: '198 g' },
          { label: 'Gordura', val: '52 g' },
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

/* ─── ProntuarioUI ────────────────────────────────────────── */
function ProntuarioUI() {
  return (
    <div style={{ background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EBF5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: T.brand, flexShrink: 0 }}>A</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0, ...DISPLAY }}>Ana Beatriz Santos</p>
          <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>28 anos · Última consulta: 3 dias atrás</p>
        </div>
        <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#059669' }}>Ativo</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: `1px solid ${T.border}` }}>
        {[
          { label: 'Peso', value: '62,4 kg', delta: '-1,2 kg', positive: true },
          { label: 'IMC', value: '22,8', delta: 'Normal', positive: null },
          { label: 'Gordura', value: '24,1%', delta: '-0,8%', positive: true },
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
            { date: '03 abr', text: 'Avaliação inicial. Anamnese completa realizada.' },
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

/* ─── VitrineUI ───────────────────────────────────────────── */
function VitrineUI() {
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
          <div style={{ width: 52, height: 52, borderRadius: 12, background: '#EBF5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: T.brand, flexShrink: 0 }}>C</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 1px', ...DISPLAY }}>Dra. Camila Rocha</p>
                <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Nutricionista · CRN 12345</p>
              </div>
              <div style={{ background: '#EBF5EE', borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 600, color: T.brand }}>Online</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '8px 0' }}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} viewBox="0 0 12 12" width="11" height="11"><path d="M6 1l1.35 2.74L10.5 4.2l-2.25 2.19.53 3.11L6 8l-2.78 1.5.53-3.11L1.5 4.2l3.15-.46L6 1z" fill="#FBBF24"/></svg>
              ))}
              <span style={{ fontSize: 11, color: T.muted, marginLeft: 3 }}>5,0 · 52 avaliações</span>
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

/* ─── AnimatedSection ─────────────────────────────────────── */
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

/* ─── Main ────────────────────────────────────────────────── */
export function LandingPageNutri() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.title = 'OrbiNutri — Gestão completa para nutricionistas'
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ ...DISPLAY }}>

      {/* ── Nav ─────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'background 0.2s, border-color 0.2s',
        background: scrolled ? 'rgba(247,250,248,0.93)' : 'transparent',
        borderBottom: `1px solid ${scrolled ? T.border : 'transparent'}`,
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-10" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, background: T.brand, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 11 }}>N</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>OrbiNutri</span>
            </div>
            <a href="/descobrir" className="hidden sm:block" style={{ fontSize: 13, fontWeight: 500, color: T.muted, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = T.text}
              onMouseLeave={e => e.target.style.color = T.muted}>
              Descobrir nutricionistas
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="/login" className="hidden sm:block" style={{
              fontSize: 13, fontWeight: 600, color: T.text,
              padding: '8px 16px', borderRadius: 8, textDecoration: 'none',
              border: `1px solid ${T.border}`, background: T.white,
            }}>
              Entrar
            </a>
            <a href="/login?tab=register" style={{
              fontSize: 13, fontWeight: 600, color: T.white, background: T.brand,
              padding: '8px 18px', borderRadius: 8, textDecoration: 'none',
            }}>
              Começar grátis
            </a>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          HERO
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
                Para nutricionistas
              </p>

              <h1 style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 700,
                color: T.text,
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                marginBottom: '1.5rem',
              }}>
                Webdiet. Livance.<br />
                Planilha.<br />
                <em style={{ fontStyle: 'normal', color: T.brand }}>Chega de três.</em>
              </h1>

              <p style={{ fontSize: '1.05rem', color: T.muted, lineHeight: 1.7, maxWidth: '46ch', marginBottom: '2rem' }}>
                Plano alimentar ao vivo no app do paciente, agenda com Google Calendar integrado
                e financeiro sem planilha. Tudo em um lugar — sem exportar PDF, sem alternar abas.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: '1rem' }}>
                <a href="/login?tab=register" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', background: T.brand, color: T.white,
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

      {/* ══════════════════════════════════════════════════
          NÚMEROS
      ══════════════════════════════════════════════════ */}
      <section style={{ background: T.white, borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#DDE8E1]">
            {[
              { n: '3h',        label: 'por semana economizadas',   sub: 'em administração e organização' },
              { n: '0 faltas',  label: 'com lembretes automáticos', sub: 'via WhatsApp antes da consulta' },
              { n: '14 dias',   label: 'de teste sem compromisso',  sub: 'sem cartão de crédito' },
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

      {/* ══════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════ */}
      <div id="produto">

        {/* — Feature 1: Agendamento — */}
        <section style={{ background: T.bg, borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-6xl mx-auto px-6 sm:px-10" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-start">
              <AnimatedSection style={{ paddingTop: '1rem' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Agendamento</p>
                <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                  Um link.<br />O paciente agenda<br />sozinho.
                </h2>
                <p style={{ fontSize: '0.975rem', color: T.muted, lineHeight: 1.75, marginBottom: '1.5rem', maxWidth: '40ch' }}>
                  Compartilhe no Instagram, WhatsApp ou no seu site. O paciente escolhe o tipo de consulta e o horário — e recebe confirmação automática. Sem você precisar responder mensagem.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Disponível 24h, 7 dias por semana',
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

        {/* — Feature 2: Agenda + Google Calendar — fundo escuro */}
        <section style={{ background: T.dark, borderTop: `1px solid #1A2E1F` }}>
          <div className="max-w-6xl mx-auto px-6 sm:px-10" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-20 items-start">
              <AnimatedSection><WeekUI /></AnimatedSection>
              <AnimatedSection delay={0.1} style={{ paddingTop: '1rem' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Agenda & Google Calendar</p>
                <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                  A semana<br />inteira de<br />um olhar.
                </h2>
                <p style={{ fontSize: '0.975rem', color: '#888', lineHeight: 1.75, marginBottom: '1.5rem', maxWidth: '38ch' }}>
                  Vista diária, semanal e mensal. Cada consulta confirmada sincroniza com o Google Calendar — com o link do Meet já incluso e convite enviado ao paciente.
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

        {/* — Feature 3: Plano alimentar — */}
        <section style={{ background: T.white, borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-6xl mx-auto px-6 sm:px-10" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-start">
              <AnimatedSection style={{ paddingTop: '1rem' }}>
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
                    'Plano acessível pelo app do paciente em tempo real',
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

        {/* — Feature 4: Prontuários — */}
        <section style={{ background: T.bg, borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-6xl mx-auto px-6 sm:px-10" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-start">
              <AnimatedSection style={{ paddingTop: '1rem' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Prontuários</p>
                <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                  O histórico<br />completo de<br />cada paciente.
                </h2>
                <p style={{ fontSize: '0.975rem', color: T.muted, lineHeight: 1.75, marginBottom: '1.5rem', maxWidth: '40ch' }}>
                  Evoluções clínicas, medidas e documentos organizados por paciente. Tudo acessível em segundos — sem papel, sem foto no WhatsApp, sem procurar em pasta.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Evolução clínica com histórico datado por consulta',
                    'Indicadores e medidas rastreados ao longo do tempo',
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

        {/* — Feature 5: Financeiro — */}
        <section style={{ background: T.white, borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-6xl mx-auto px-6 sm:px-10" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20" style={{ marginBottom: '3.5rem' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Financeiro</p>
                <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
                  Da consulta ao<br />fechamento. Sem planilha.
                </h2>
              </div>
              <div style={{ paddingTop: '0.25rem' }}>
                <p style={{ fontSize: '0.975rem', color: T.muted, lineHeight: 1.75, maxWidth: '48ch' }}>
                  Cada consulta vira automaticamente uma entrada financeira. Honorários, pagamentos recebidos e inadimplências organizados em tempo real —
                  o fechamento do mês leva menos de dois minutos.
                </p>
              </div>
            </div>
            <AnimatedSection delay={0.05} style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <FinanceDashboard />
            </AnimatedSection>
          </div>
        </section>

        {/* — Feature 6: Vitrine — */}
        <section style={{ background: T.bg, borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-6xl mx-auto px-6 sm:px-10" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-start">
              <AnimatedSection style={{ paddingTop: '1rem' }}>
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
              <AnimatedSection delay={0.1}><VitrineUI /></AnimatedSection>
            </div>
          </div>
        </section>
      </div>

      {/* ══════════════════════════════════════════════════
          DEPOIMENTOS
      ══════════════════════════════════════════════════ */}
      <section style={{ background: T.dark, borderTop: `1px solid #1A2E1F`, padding: '6rem 0' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-10">

          <AnimatedSection style={{ maxWidth: '52ch', marginBottom: '5rem' }}>
            <p style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.3,
              letterSpacing: '-0.025em',
              marginBottom: '1.5rem',
            }}>
              "Antes eu mandava o plano por PDF e toda atualização virava um transtorno. Agora o paciente abre o app e já está lá. Economizo pelo menos 3 horas por semana."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 1, background: '#1A3A22' }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#aaa', margin: 0 }}>Dra. Renata Oliveira</p>
                <p style={{ fontSize: 12, color: '#555', margin: 0 }}>Nutricionista clínica, CRN 8903</p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1} className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '3rem', borderTop: '1px solid #1A2E1F', paddingTop: '3rem' }}>
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

      {/* ══════════════════════════════════════════════════
          PRICING
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
                  Sem tiers, sem funcionalidades escondidas no premium. R$ 19 por mês e você tem acesso a tudo desde o primeiro dia.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '10px 24px' }}>
                  {[
                    'Agenda online ilimitada',
                    'Link de agendamento público',
                    'Plano alimentar ao vivo',
                    'Lembretes por WhatsApp',
                    'Prontuários e evoluções',
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
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: '2.5rem 2rem' }}>
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
                  background: T.brand, color: T.white, borderRadius: 10,
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

      {/* ══════════════════════════════════════════════════
          FAQ
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
                { q: 'O plano alimentar funciona como substituto do Webdiet?', a: 'Para o essencial, sim. Você monta o plano por alimentos com kcal e macros calculados automaticamente. O paciente acessa pelo celular sem PDF. Funcionalidades como diário alimentar por foto ficam para uma versão futura.' },
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

      {/* ══════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════ */}
      <section id="cta" style={{ background: T.brand, padding: '5rem 0' }}>
        <div className="max-w-2xl mx-auto px-6 sm:px-10 text-center">
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1rem' }}>
            Comece a organizar suas consultas hoje.
          </h2>
          <p style={{ fontSize: '0.975rem', color: 'rgba(255,255,255,0.65)', marginBottom: '2rem' }}>
            14 dias grátis. Sem cartão. Cancele quando quiser.
          </p>
          <form onSubmit={e => { e.preventDefault(); window.location.href = '/login?tab=register' }}
            style={{ display: 'flex', gap: 8, maxWidth: 420, margin: '0 auto', flexWrap: 'wrap' }}>
            <input
              type="email"
              required
              placeholder="seu@email.com"
              style={{
                flex: 1, minWidth: 0, padding: '12px 16px',
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 10, fontSize: 14, color: '#fff',
                outline: 'none', ...DISPLAY,
              }}
            />
            <button type="submit" style={{
              padding: '12px 22px', background: '#fff', color: T.brand,
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap', ...DISPLAY,
            }}>
              Criar conta grátis
            </button>
          </form>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: '1rem' }}>
            Ao criar sua conta você concorda com os{' '}
            <a href="/termos-de-uso" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'underline' }}>Termos de Uso</a>
            {' '}e{' '}
            <a href="/politica-de-privacidade" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'underline' }}>Política de Privacidade</a>.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════ */}
      <footer style={{ background: T.white, borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-10" style={{ paddingTop: '3rem', paddingBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', marginBottom: '3rem' }}>
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 20, height: 20, background: T.brand, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 10 }}>N</span>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>OrbiNutri</p>
              </div>
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
