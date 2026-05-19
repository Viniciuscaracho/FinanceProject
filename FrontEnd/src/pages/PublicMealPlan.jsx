import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, UtensilsCrossed, ChevronDown, ChevronUp } from 'lucide-react'
import { apiService } from '@/lib/api'

function MacroBar({ protein, carbs, fat }) {
  const total = protein + carbs + fat
  if (total === 0) return null
  const pPct = ((protein / total) * 100).toFixed(0)
  const cPct = ((carbs / total) * 100).toFixed(0)
  const fPct = ((fat / total) * 100).toFixed(0)
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', height: 4, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
        <div style={{ width: `${pPct}%`, background: '#4C60AA' }} />
        <div style={{ width: `${cPct}%`, background: '#10B981' }} />
        <div style={{ width: `${fPct}%`, background: '#F59E0B' }} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <span style={{ fontSize: 10, color: '#4C60AA', fontWeight: 600 }}>P {protein.toFixed(1)}g</span>
        <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>C {carbs.toFixed(1)}g</span>
        <span style={{ fontSize: 10, color: '#F59E0B', fontWeight: 600 }}>G {fat.toFixed(1)}g</span>
      </div>
    </div>
  )
}

function MealCard({ meal }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
      <button type="button" onClick={() => setOpen(p => !p)}
        style={{ width: '100%', background: '#FAFAFA', border: 'none', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', textAlign: 'left', fontFamily: 'inherit' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1F2937' }}>{meal.name}</div>
          {meal.time_suggestion && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{meal.time_suggestion}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {meal.total_kcal > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>{meal.total_kcal.toFixed(0)} kcal</span>
          )}
          {open ? <ChevronUp size={14} style={{ color: '#9CA3AF' }} /> : <ChevronDown size={14} style={{ color: '#9CA3AF' }} />}
        </div>
      </button>
      {open && (
        <div style={{ padding: '8px 14px 12px' }}>
          {meal.foods.map((food, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < meal.foods.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, color: '#1F2937', fontWeight: 500 }}>{food.food_name}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                  {food.kcal.toFixed(0)} kcal · P: {food.protein.toFixed(1)}g · C: {food.carbs.toFixed(1)}g · G: {food.fat.toFixed(1)}g
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', marginLeft: 12, flexShrink: 0 }}>
                {food.quantity}g
              </span>
            </div>
          ))}
          {meal.notes && (
            <p style={{ marginTop: 8, fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>{meal.notes}</p>
          )}
          <MacroBar protein={meal.total_protein} carbs={meal.total_carbs} fat={meal.total_fat} />
        </div>
      )}
    </div>
  )
}

function DaySection({ day }) {
  const [open, setOpen] = useState(true)
  const totalKcal = day.meals.reduce((s, m) => s + m.total_kcal, 0)

  return (
    <div style={{ marginBottom: 20 }}>
      <button type="button" onClick={() => setOpen(p => !p)}
        style={{ width: '100%', background: 'none', border: 'none', padding: '8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', textAlign: 'left', fontFamily: 'inherit', borderBottom: '2px solid #E5E7EB', marginBottom: 10 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#1F2937' }}>{day.label}</span>
          {totalKcal > 0 && <span style={{ fontSize: 12, color: '#9CA3AF' }}>{totalKcal.toFixed(0)} kcal</span>}
        </div>
        {open ? <ChevronUp size={14} style={{ color: '#9CA3AF' }} /> : <ChevronDown size={14} style={{ color: '#9CA3AF' }} />}
      </button>
      {open && day.meals.map((meal, i) => <MealCard key={i} meal={meal} />)}
    </div>
  )
}

export default function PublicMealPlan() {
  const { token } = useParams()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    apiService.getPublicMealPlan(token)
      .then(raw => {
        const parseMeal = m => ({
          ...m,
          total_kcal:    Number(m.total_kcal),
          total_protein: Number(m.total_protein),
          total_carbs:   Number(m.total_carbs),
          total_fat:     Number(m.total_fat),
          foods: (m.foods || []).map(f => ({
            ...f,
            kcal:     Number(f.kcal),
            protein:  Number(f.protein),
            carbs:    Number(f.carbs),
            fat:      Number(f.fat),
            quantity: Number(f.quantity),
          })),
        })
        setData({
          ...raw,
          meal_plan: {
            ...raw.meal_plan,
            days: (raw.meal_plan.days || []).map(d => ({
              ...d,
              meals: (d.meals || []).map(parseMeal),
            })),
          },
        })
      })
      .catch(e => setError(e.message || 'Plano não encontrado'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F9FAFB' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: '#4C60AA' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F9FAFB', padding: 24 }}>
        <UtensilsCrossed size={40} style={{ color: '#D1D5DB', marginBottom: 16 }} />
        <p style={{ fontSize: 16, color: '#6B7280', textAlign: 'center' }}>{error}</p>
      </div>
    )
  }

  const { meal_plan, professional, patient } = data

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '16px 20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UtensilsCrossed size={18} style={{ color: '#4C60AA' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#1F2937' }}>{meal_plan.title}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                {patient?.name} · {professional?.name}
              </div>
            </div>
          </div>
          {meal_plan.description && (
            <p style={{ marginTop: 10, fontSize: 13, color: '#6B7280' }}>{meal_plan.description}</p>
          )}
          <div style={{ marginTop: 6, fontSize: 11, color: '#9CA3AF' }}>
            Atualizado em {new Date(meal_plan.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 60px' }}>
        {meal_plan.days.map((day, i) => <DaySection key={i} day={day} />)}

        {meal_plan.notes && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px', marginTop: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1F2937', marginBottom: 6 }}>Observações</div>
            <p style={{ fontSize: 13, color: '#6B7280', whiteSpace: 'pre-line' }}>{meal_plan.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
