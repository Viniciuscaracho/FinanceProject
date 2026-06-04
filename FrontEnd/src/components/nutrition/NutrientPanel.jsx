import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ChevronDown, ChevronUp, FlaskConical, Target, Settings2, TrendingUp } from 'lucide-react'
import { T } from '@/lib/tokens'

// ── DRI adulto (média M+F) ────────────────────────────────────────────────────
const DRI = {
  fiber_g:         { label: 'Fibras',       unit: 'g',   ref: 25,   group: 'macro'   },
  calcium_mg:      { label: 'Cálcio',       unit: 'mg',  ref: 1000, group: 'mineral' },
  iron_mg:         { label: 'Ferro',        unit: 'mg',  ref: 14,   group: 'mineral' },
  sodium_mg:       { label: 'Sódio',        unit: 'mg',  ref: 2000, group: 'mineral', isLimit: true },
  potassium_mg:    { label: 'Potássio',     unit: 'mg',  ref: 3500, group: 'mineral' },
  magnesium_mg:    { label: 'Magnésio',     unit: 'mg',  ref: 350,  group: 'mineral' },
  zinc_mg:         { label: 'Zinco',        unit: 'mg',  ref: 9,    group: 'mineral' },
  vitamin_a_mcg:   { label: 'Vitamina A',   unit: 'mcg', ref: 800,  group: 'vitamin' },
  vitamin_c_mg:    { label: 'Vitamina C',   unit: 'mg',  ref: 85,   group: 'vitamin' },
  vitamin_d_mcg:   { label: 'Vitamina D',   unit: 'mcg', ref: 15,   group: 'vitamin' },
  vitamin_b12_mcg: { label: 'Vitamina B12', unit: 'mcg', ref: 2.4,  group: 'vitamin' },
}

const MACRO_COLORS = { protein: '#4C60AA', carbs: '#10B981', fat: '#F59E0B' }

const DENSITY_RANGES = [
  { max: 0.6,      label: 'Muito baixa', color: '#10B981' },
  { max: 1.5,      label: 'Baixa',       color: '#34D399' },
  { max: 3.9,      label: 'Média',       color: '#F59E0B' },
  { max: 6.0,      label: 'Alta',        color: '#EF4444' },
  { max: Infinity, label: 'Muito alta',  color: '#B91C1C' },
]

function densityInfo(v) {
  return DENSITY_RANGES.find(r => v <= r.max) || DENSITY_RANGES.at(-1)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sumVitamins(foods) {
  const out = {}
  for (const key of Object.keys(DRI)) {
    if (key === 'fiber_g') continue
    out[key] = foods.reduce((s, f) => s + ((f.vitamins || {})[key] || 0), 0)
  }
  return out
}

export function computeDayTotals(day) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, weight: 0, vitamins: {} }
  for (const k of Object.keys(DRI)) { if (k !== 'fiber_g') t.vitamins[k] = 0 }
  for (const meal of day.meals || []) {
    for (const f of meal.foods || []) {
      t.kcal    += f.kcal    || 0
      t.protein += f.protein || 0
      t.carbs   += f.carbs   || 0
      t.fat     += f.fat     || 0
      t.fiber   += f.fiber   || 0
      t.weight  += f.quantity || 0
      for (const k of Object.keys(t.vitamins)) t.vitamins[k] += ((f.vitamins || {})[k] || 0)
    }
  }
  return t
}

// ── DensityGauge ──────────────────────────────────────────────────────────────

function DensityGauge({ density }) {
  const pct  = Math.min(100, (density / 9) * 100)
  const info = densityInfo(density)
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Densidade calórica
      </div>
      <div style={{ position: 'relative', height: 10, borderRadius: 5, background: 'linear-gradient(to right, #10B981, #34D399, #F59E0B, #EF4444, #B91C1C)', marginBottom: 5 }}>
        <div className="dm-gauge-dot" style={{ position: 'absolute', top: -4, left: `${pct}%`, transform: 'translateX(-50%)', width: 18, height: 18, borderRadius: '50%', background: T.white, border: `3px solid ${info.color}`, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{density.toFixed(2)}</div>
      <div style={{ fontSize: 10, color: info.color, fontWeight: 600 }}>{info.label} (Kcal/g)</div>
    </div>
  )
}

// ── MacroDonut ────────────────────────────────────────────────────────────────

function MacroDonut({ protein, carbs, fat, totalKcal }) {
  if (totalKcal === 0) return null
  const data = [
    { name: 'Proteínas',    value: protein * 4, color: MACRO_COLORS.protein },
    { name: 'Carboidratos', value: carbs * 4,   color: MACRO_COLORS.carbs   },
    { name: 'Lipídios',     value: fat * 9,      color: MACRO_COLORS.fat     },
  ].filter(d => d.value > 0)

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
        Distribuição % VET
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ResponsiveContainer width={80} height={80}>
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={18} outerRadius={36} strokeWidth={1}>
              {data.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip formatter={(v) => [`${((v / totalKcal) * 100).toFixed(1)}%`]} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ flex: 1, fontSize: 11 }}>
          {data.map(d => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
              <span style={{ color: T.muted, flex: 1, fontSize: 10 }}>{d.name}</span>
              <span style={{ fontWeight: 700, color: T.text, fontSize: 11 }}>{((d.value / totalKcal) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── MicroBar ──────────────────────────────────────────────────────────────────

function MicroBar({ label, value, unit, ref: refVal, isLimit, showRef }) {
  const pct = refVal ? Math.min(100, (value / refVal) * 100) : 0
  const display = value < 0.1 ? value.toFixed(3) : value < 10 ? value.toFixed(1) : Math.round(value)
  let barColor = '#10B981'
  if (isLimit) {
    barColor = pct < 60 ? '#10B981' : pct < 90 ? '#F59E0B' : '#EF4444'
  } else {
    barColor = pct < 30 ? '#EF4444' : pct < 60 ? '#F59E0B' : '#10B981'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr 72px', alignItems: 'center', gap: 8, marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      <div style={{ height: 5, borderRadius: 3, background: T.light, overflow: 'hidden' }}>
        {pct > 0 && <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 3 }} />}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.text, textAlign: 'right', whiteSpace: 'nowrap' }}>
        {display}{unit}
        {showRef && refVal > 0 && <span style={{ fontWeight: 400, color: T.muted }}> /{refVal < 10 ? refVal : Math.round(refVal)}</span>}
      </span>
    </div>
  )
}

// ── MicronutrientSection ──────────────────────────────────────────────────────

function MicronutrientSection({ fiber, vitamins, showRef }) {
  const [open, setOpen] = useState(false)
  const hasData = fiber > 0 || Object.values(vitamins).some(v => v > 0)
  if (!hasData) return null

  const minerals    = ['calcium_mg', 'iron_mg', 'sodium_mg', 'potassium_mg', 'magnesium_mg', 'zinc_mg']
  const vitaminKeys = ['vitamin_a_mcg', 'vitamin_c_mg', 'vitamin_d_mcg', 'vitamin_b12_mcg']

  return (
    <div style={{ marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
      <button type="button" onClick={() => setOpen(p => !p)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '0 0 6px' }}>
        <FlaskConical size={12} style={{ color: T.brand }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: T.brand, textTransform: 'uppercase', letterSpacing: 0.5, flex: 1, textAlign: 'left' }}>
          Micronutrientes
        </span>
        {open ? <ChevronUp size={12} style={{ color: T.muted }} /> : <ChevronDown size={12} style={{ color: T.muted }} />}
      </button>

      {open && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>Fibras</div>
          <MicroBar label="Fibras" value={fiber} unit="g" ref={DRI.fiber_g.ref} showRef={showRef} />

          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5, margin: '10px 0 5px' }}>Minerais</div>
          {minerals.map(k => (
            <MicroBar key={k} label={DRI[k].label} value={vitamins[k] || 0} unit={DRI[k].unit} ref={DRI[k].ref} isLimit={DRI[k].isLimit} showRef={showRef} />
          ))}

          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5, margin: '10px 0 5px' }}>Vitaminas</div>
          {vitaminKeys.map(k => (
            <MicroBar key={k} label={DRI[k].label} value={vitamins[k] || 0} unit={DRI[k].unit} ref={DRI[k].ref} showRef={showRef} />
          ))}

          {showRef && (
            <p style={{ fontSize: 10, color: T.muted, marginTop: 8, fontStyle: 'italic' }}>
              Referências DRI: adulto (média M+F). Sódio indica limite diário recomendado (OMS).
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── DiffCell ──────────────────────────────────────────────────────────────────

function DiffCell({ value, prescrito }) {
  if (!prescrito || prescrito === 0)
    return <td style={{ padding: '5px 8px', textAlign: 'right', color: T.muted, fontSize: 12 }}>—</td>
  const diff  = value - prescrito
  const color = Math.abs(diff) < prescrito * 0.05 ? '#10B981' : diff < 0 ? '#EF4444' : '#F59E0B'
  return (
    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color, fontSize: 12 }}>
      {diff > 0 ? '+' : ''}{diff.toFixed(1)}
    </td>
  )
}

// ── MealNutrientPanel — análise colapsável dentro de cada refeição ─────────────

export function MealNutrientPanel({ meal }) {
  const [open, setOpen] = useState(false)

  const kcal    = meal.foods.reduce((s, f) => s + (f.kcal    || 0), 0)
  const protein = meal.foods.reduce((s, f) => s + (f.protein || 0), 0)
  const carbs   = meal.foods.reduce((s, f) => s + (f.carbs   || 0), 0)
  const fat     = meal.foods.reduce((s, f) => s + (f.fat     || 0), 0)
  const fiber   = meal.foods.reduce((s, f) => s + (f.fiber   || 0), 0)
  const weight  = meal.foods.reduce((s, f) => s + (f.quantity || 0), 0)
  const density = weight > 0 ? kcal / weight : 0
  const vitamins = sumVitamins(meal.foods)

  if (kcal === 0) return null

  return (
    <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 8 }}>
      <button type="button" onClick={() => setOpen(p => !p)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', background: 'none', border: 'none', cursor: 'pointer', color: T.brand, fontFamily: 'inherit', fontSize: 11, fontWeight: 600 }}>
        <span>Análise de nutrientes desta refeição</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div style={{ paddingBottom: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Macronutrientes</div>
              {[
                { label: 'Proteínas',    value: protein, color: MACRO_COLORS.protein },
                { label: 'Lipídios',     value: fat,     color: MACRO_COLORS.fat     },
                { label: 'Carboidratos', value: carbs,   color: MACRO_COLORS.carbs   },
                { label: 'Calorias',     value: kcal,    color: '#F59E0B', unit: 'Kcal' },
                { label: 'Fibras',       value: fiber,   color: '#6B7280' },
                { label: 'Peso total',   value: weight,  color: '#9CA3AF' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: T.muted }}>{m.label}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>
                    {m.value < 10 ? m.value.toFixed(1) : Math.round(m.value)}{m.unit || 'g'}
                  </span>
                </div>
              ))}
            </div>
            <DensityGauge density={density} />
            <MacroDonut protein={protein} carbs={carbs} fat={fat} totalKcal={kcal} />
          </div>
          <MicronutrientSection fiber={fiber} vitamins={vitamins} showRef={false} />
        </div>
      )}
    </div>
  )
}

// ── DayNutrientStrip — SEMPRE VISÍVEL topo do dia ────────────────────────────

export function DayNutrientStrip({ totals, targets, onOpenTargets }) {
  const [showDetail, setShowDetail] = useState(false)
  const hasTargets = targets && (targets.target_kcal > 0 || targets.target_protein_g > 0)
  const kcalPct    = hasTargets && targets.target_kcal > 0
    ? Math.min(100, (totals.kcal / targets.target_kcal) * 100) : null
  const density    = totals.weight > 0 ? totals.kcal / totals.weight : 0
  const dInfo      = densityInfo(density)

  const macros = [
    { key: 'Kcal',  val: totals.kcal,    target: targets?.target_kcal,      color: '#F59E0B', unit: '' },
    { key: 'Prot',  val: totals.protein, target: targets?.target_protein_g, color: MACRO_COLORS.protein, unit: 'g' },
    { key: 'Carb',  val: totals.carbs,   target: targets?.target_carbs_g,   color: MACRO_COLORS.carbs,   unit: 'g' },
    { key: 'Gord',  val: totals.fat,     target: targets?.target_fat_g,     color: MACRO_COLORS.fat,     unit: 'g' },
    { key: 'Fibra', val: totals.fiber,   target: targets?.target_fiber_g,   color: '#6B7280',            unit: 'g' },
  ]

  return (
    <div style={{ background: 'var(--surface-elevated)', borderBottom: `1px solid ${T.border}` }}>
      {/* Barra de kcal principal */}
      {kcalPct !== null ? (
        <div style={{ padding: '10px 14px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
              {Math.round(totals.kcal)} <span style={{ fontSize: 11, fontWeight: 400, color: T.muted }}>/ {targets.target_kcal} Kcal</span>
            </span>
            <span style={{ fontSize: 11, color: kcalPct >= 95 && kcalPct <= 105 ? '#10B981' : T.muted }}>
              {kcalPct.toFixed(0)}%
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: T.light, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ width: `${kcalPct}%`, height: '100%', background: kcalPct > 105 ? '#EF4444' : '#F59E0B', borderRadius: 3, transition: 'width 0.4s' }} />
          </div>
        </div>
      ) : (
        <div style={{ padding: '10px 14px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
            {Math.round(totals.kcal)} <span style={{ fontSize: 11, fontWeight: 400, color: T.muted }}>Kcal</span>
          </span>
          <span style={{ fontSize: 10, color: dInfo.color, fontWeight: 600 }}>{dInfo.label}</span>
        </div>
      )}

      {/* Grid de macros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, padding: '0 14px 10px' }}>
        {macros.map(m => {
          const pct = m.target > 0 ? Math.min(100, (m.val / m.target) * 100) : null
          return (
            <div key={m.key} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 }}>{m.key}</div>
              {pct !== null && (
                <div style={{ height: 3, borderRadius: 2, background: T.light, overflow: 'hidden', marginBottom: 3 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: m.color, borderRadius: 2 }} />
                </div>
              )}
              <div style={{ fontSize: 11, fontWeight: 700, color: m.val > 0 ? T.text : T.muted }}>
                {m.val < 10 ? m.val.toFixed(1) : Math.round(m.val)}{m.unit}
              </div>
              {m.target > 0 && (
                <div style={{ fontSize: 9, color: T.muted }}>/{Math.round(m.target)}</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Rodapé: sem metas CTA ou análise completa toggle */}
      <div style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${T.border}`, padding: '6px 14px' }}>
        {!hasTargets ? (
          <button type="button" onClick={onOpenTargets}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: `1px dashed ${T.brand}`, borderRadius: 7, padding: '6px 0', cursor: 'pointer', color: T.brand, fontFamily: 'inherit', fontSize: 11, fontWeight: 600, minHeight: 36 }}>
            <Target size={13} /> Definir metas do plano (Prescrito)
          </button>
        ) : (
          <button type="button" onClick={() => setShowDetail(p => !p)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: 'inherit', fontSize: 11, minHeight: 36 }}>
            <TrendingUp size={12} />
            {showDetail ? 'Fechar análise completa' : 'Ver análise completa'}
            {showDetail ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        )}
      </div>

      {/* Análise completa (expandível) */}
      {showDetail && hasTargets && (
        <DayNutrientDetail totals={totals} targets={targets} />
      )}
    </div>
  )
}

// ── DayNutrientDetail — análise expandida (tabela + charts + micro) ───────────

function DayNutrientDetail({ totals, targets }) {
  const density    = totals.weight > 0 ? totals.kcal / totals.weight : 0
  const hasTargets = targets && (targets.target_kcal > 0 || targets.target_protein_g > 0)

  const rows = [
    { label: 'Proteínas totais',    teórico: totals.protein, prescrito: targets?.target_protein_g, unit: 'g',    color: MACRO_COLORS.protein },
    { label: 'Lipídios totais',     teórico: totals.fat,     prescrito: targets?.target_fat_g,     unit: 'g',    color: MACRO_COLORS.fat     },
    { label: 'Carboidratos totais', teórico: totals.carbs,   prescrito: targets?.target_carbs_g,   unit: 'g',    color: MACRO_COLORS.carbs   },
    { label: 'Fibras',              teórico: totals.fiber,   prescrito: targets?.target_fiber_g,   unit: 'g',    color: '#6B7280' },
    { label: 'Calorias totais',     teórico: totals.kcal,    prescrito: targets?.target_kcal,      unit: 'Kcal', color: '#F59E0B' },
    { label: 'Densidade calórica',  teórico: density,        prescrito: null,                      unit: 'Kcal/g', color: '#9CA3AF' },
  ]

  return (
    <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${T.border}` }}>
      {/* Tabela */}
      <div style={{ overflowX: 'auto', margin: '12px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              <th style={{ padding: '5px 0', textAlign: 'left', fontWeight: 700, color: T.muted, fontSize: 11 }}>Parâmetro</th>
              {hasTargets && <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: T.muted, fontSize: 11 }}>Prescrito</th>}
              <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: T.muted, fontSize: 11 }}>Teórico</th>
              {hasTargets && <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: T.muted, fontSize: 11 }}>Diferença</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '5px 0', color: T.text, fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, flexShrink: 0, display: 'inline-block' }} />
                    {row.label}
                  </div>
                </td>
                {hasTargets && (
                  <td style={{ padding: '5px 8px', textAlign: 'right', color: T.muted }}>
                    {row.prescrito > 0 ? `${row.prescrito.toFixed(1)}${row.unit}` : '—'}
                  </td>
                )}
                <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: T.text }}>
                  {row.teórico < 10 ? row.teórico.toFixed(2) : row.teórico.toFixed(1)}{row.unit}
                </td>
                {hasTargets && <DiffCell value={row.teórico} prescrito={row.prescrito} />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts responsivos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 8 }}>
        <MacroDonut protein={totals.protein} carbs={totals.carbs} fat={totals.fat} totalKcal={totals.kcal} />
        <DensityGauge density={density} />
      </div>

      {/* Micronutrientes */}
      <MicronutrientSection fiber={totals.fiber} vitamins={totals.vitamins} showRef={true} />
    </div>
  )
}

// ── DayNutrientPanel — wrapper mantido para compatibilidade ───────────────────
// (usado quando não há DayNutrientStrip inline)
export function DayNutrientPanel({ day, targets }) {
  const totals = computeDayTotals(day)
  if (totals.kcal === 0) return null
  return <DayNutrientStrip totals={totals} targets={targets} onOpenTargets={() => {}} />
}
