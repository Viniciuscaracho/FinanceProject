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
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', height: 6, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
        <div style={{ width: `${pPct}%`, background: '#4C60AA', minWidth: pPct > 0 ? 4 : 0 }} />
        <div style={{ width: `${cPct}%`, background: '#10B981', minWidth: cPct > 0 ? 4 : 0 }} />
        <div style={{ width: `${fPct}%`, background: '#F59E0B', minWidth: fPct > 0 ? 4 : 0 }} />
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 7 }}>
        <span style={{ fontSize: 12, color: '#4C60AA', fontWeight: 600 }}>Prot. {protein.toFixed(1)}g</span>
        <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>Carb. {carbs.toFixed(1)}g</span>
        <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>Gord. {fat.toFixed(1)}g</span>
      </div>
    </div>
  )
}

function MealCard({ meal }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', background: '#FAFAFA', border: 'none',
          padding: '14px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', textAlign: 'left',
          fontFamily: 'inherit', minHeight: 52,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1F2937' }}>{meal.name}</div>
          {meal.time_suggestion && (
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{meal.time_suggestion}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 12 }}>
          {meal.total_kcal > 0 && (
            <span style={{
              fontSize: 13, fontWeight: 700, color: '#F59E0B',
              background: '#FFFBEB', borderRadius: 20, padding: '2px 8px',
            }}>
              {meal.total_kcal.toFixed(0)} kcal
            </span>
          )}
          {open
            ? <ChevronUp size={18} style={{ color: '#9CA3AF' }} />
            : <ChevronDown size={18} style={{ color: '#9CA3AF' }} />
          }
        </div>
      </button>

      {open && (
        <div style={{ padding: '4px 16px 16px' }}>
          {meal.foods.map((food, i) => (
            <div
              key={i}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '12px 0',
                borderBottom: i < meal.foods.length - 1 ? '1px solid #F3F4F6' : 'none',
              }}
            >
              <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                <div style={{ fontSize: 14, color: '#1F2937', fontWeight: 500 }}>{food.food_name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>
                  {food.kcal.toFixed(0)} kcal · P {food.protein.toFixed(1)}g · C {food.carbs.toFixed(1)}g · G {food.fat.toFixed(1)}g
                </div>
              </div>
              <span style={{
                fontSize: 14, fontWeight: 700, color: '#374151',
                background: '#F9FAFB', borderRadius: 8,
                padding: '4px 10px', flexShrink: 0, whiteSpace: 'nowrap',
              }}>
                {food.quantity}g
              </span>
            </div>
          ))}

          {meal.notes && (
            <p style={{ margin: '10px 0 4px', fontSize: 13, color: '#6B7280', fontStyle: 'italic', lineHeight: 1.5 }}>
              {meal.notes}
            </p>
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
    <div style={{ marginBottom: 24 }}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', background: 'none', border: 'none',
          padding: '12px 0', cursor: 'pointer',
          display: 'flex', alignItems: 'center', textAlign: 'left',
          fontFamily: 'inherit', borderBottom: '2px solid #E5E7EB', marginBottom: 12,
          minHeight: 44,
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#1F2937' }}>{day.label}</span>
          {totalKcal > 0 && (
            <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>
              {totalKcal.toFixed(0)} kcal
            </span>
          )}
        </div>
        {open
          ? <ChevronUp size={18} style={{ color: '#9CA3AF' }} />
          : <ChevronDown size={18} style={{ color: '#9CA3AF' }} />
        }
      </button>
      {open && day.meals.map((meal, i) => <MealCard key={i} meal={meal} />)}
    </div>
  )
}

export default function PublicMealPlan() {
  const { token } = useParams()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

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

  const numDays = meal_plan.days.length || 1
  const allMeals = meal_plan.days.flatMap(d => d.meals)
  const totalKcal    = allMeals.reduce((s, m) => s + m.total_kcal, 0)
  const totalProtein = allMeals.reduce((s, m) => s + m.total_protein, 0)
  const totalCarbs   = allMeals.reduce((s, m) => s + m.total_carbs, 0)
  const totalFat     = allMeals.reduce((s, m) => s + m.total_fat, 0)
  const avgKcal    = totalKcal    / numDays
  const avgProtein = totalProtein / numDays
  const avgCarbs   = totalCarbs   / numDays
  const avgFat     = totalFat     / numDays
  const hasTotals  = totalKcal > 0

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '18px 20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UtensilsCrossed size={20} style={{ color: '#4C60AA' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#1F2937', lineHeight: 1.2 }}>{meal_plan.title}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                {patient?.name}{professional?.name ? ` · ${professional.name}` : ''}
              </div>
            </div>
          </div>

          {meal_plan.description && (
            <p style={{ marginTop: 12, fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>{meal_plan.description}</p>
          )}

          {/* Resumo de macros do plano */}
          {hasTotals && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B', background: '#FFFBEB', borderRadius: 20, padding: '4px 12px' }}>
                {avgKcal.toFixed(0)} kcal/dia
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4C60AA', background: '#EEF2FF', borderRadius: 20, padding: '4px 12px' }}>
                Prot. {avgProtein.toFixed(0)}g
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#10B981', background: '#ECFDF5', borderRadius: 20, padding: '4px 12px' }}>
                Carb. {avgCarbs.toFixed(0)}g
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#D97706', background: '#FEF3C7', borderRadius: 20, padding: '4px 12px' }}>
                Gord. {avgFat.toFixed(0)}g
              </span>
            </div>
          )}

          <div style={{ marginTop: 10, fontSize: 12, color: '#9CA3AF' }}>
            Atualizado em {new Date(meal_plan.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 60px' }}>
        {meal_plan.days.map((day, i) => <DaySection key={i} day={day} />)}

        {meal_plan.notes && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px', marginTop: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1F2937', marginBottom: 8 }}>Observações</div>
            <p style={{ fontSize: 14, color: '#6B7280', whiteSpace: 'pre-line', lineHeight: 1.6, margin: 0 }}>{meal_plan.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
