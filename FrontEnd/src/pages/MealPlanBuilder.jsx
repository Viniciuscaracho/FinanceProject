import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Loader2, Copy, Check, ChevronDown, ChevronUp, Search, X, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'
import { apiService } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { T } from '@/lib/tokens'

const MEAL_DEFAULTS = ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar', 'Ceia']
const STATUS_LABELS = { draft: 'Rascunho', active: 'Ativo', archived: 'Arquivado' }
const STATUS_COLORS = { draft: '#9CA3AF', active: '#10B981', archived: '#6B7280' }

function MacroBadge({ label, value, unit = 'g', color }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: 48, padding: '2px 8px', borderRadius: 8, background: '#F9FAFB', border: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 9, fontWeight: 600, color: color || T.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{value}{unit}</span>
    </span>
  )
}

function FoodSearch({ onSelect, onClose }) {
  const [query, setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await apiService.searchFoods(query)
        setResults(res.foods || [])
      } catch {
        setResults([])
        toast.error('Erro ao buscar alimentos. Tente novamente.')
      }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Search size={16} style={{ color: T.muted, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar alimento (ex: arroz, frango, banana...)"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: T.text }}
          />
          {loading && <Loader2 size={14} className="animate-spin" style={{ color: T.muted }} />}
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 2 }}><X size={16} /></button>
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {query.length < 2 && (
            <p style={{ padding: '20px 16px', fontSize: 13, color: T.muted, textAlign: 'center' }}>Digite ao menos 2 letras para buscar</p>
          )}
          {query.length >= 2 && results.length === 0 && !loading && (
            <p style={{ padding: '20px 16px', fontSize: 13, color: T.muted, textAlign: 'center' }}>Nenhum alimento encontrado para "{query}"</p>
          )}
          {results.map(food => (
            <button key={food.id} type="button" onClick={() => onSelect(food)}
              style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{food.name}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                  {food.kcal_per_100g} kcal · P: {food.protein_per_100g}g · C: {food.carbs_per_100g}g · G: {food.fat_per_100g}g
                  <span style={{ marginLeft: 6, padding: '0 5px', borderRadius: 4, background: '#F3F4F6', fontSize: 10 }}>{food.source === 'taco' ? 'TACO' : 'Custom'}</span>
                </div>
              </div>
              <Plus size={14} style={{ color: T.brand, flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function FoodItem({ item, contactId, planId, dayId, mealId, onRemove, onUpdate }) {
  const [editing, setEditing]   = useState(false)
  const [qty, setQty]           = useState(String(item.quantity))
  const [saving, setSaving]     = useState(false)

  const handleSave = async () => {
    if (!qty || isNaN(qty) || Number(qty) <= 0) return
    setSaving(true)
    try {
      const res = await apiService.updateMealFood(contactId, planId, dayId, mealId, item.id, { quantity: Number(qty) })
      onUpdate(res.meal_food)
      setEditing(false)
    } catch { toast.error('Erro ao atualizar quantidade') }
    finally { setSaving(false) }
  }

  const macroFactor = Number(qty) / 100

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid #F3F4F6` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{item.food_name}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>
          {item.kcal.toFixed(0)} kcal · P: {item.protein.toFixed(1)}g · C: {item.carbs.toFixed(1)}g · G: {item.fat.toFixed(1)}g
        </div>
      </div>
      {editing ? (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input type="number" value={qty} onChange={e => setQty(e.target.value)} min="1"
            style={{ width: 64, padding: '3px 6px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: 'inherit', textAlign: 'center' }}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            autoFocus
          />
          <span style={{ fontSize: 11, color: T.muted }}>g</span>
          {saving ? <Loader2 size={12} className="animate-spin" /> : (
            <button type="button" onClick={handleSave} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10B981' }}><Check size={14} /></button>
          )}
          <button type="button" onClick={() => { setQty(String(item.quantity)); setEditing(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={14} /></button>
        </div>
      ) : (
        <button type="button" onClick={() => setEditing(true)}
          style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: '#F3F4F6', border: 'none', cursor: 'pointer', color: T.text, fontFamily: 'inherit', fontWeight: 600 }}>
          {item.quantity}g
        </button>
      )}
      <button type="button" onClick={() => onRemove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2, flexShrink: 0 }}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function MealCard({ meal, day, plan, contactId, onUpdate, onRemove }) {
  const [open, setOpen]               = useState(true)
  const [showFoodSearch, setShowFoodSearch] = useState(false)
  const [addingMeal, setAddingMeal]   = useState(false)

  const handleAddFood = async (food) => {
    setShowFoodSearch(false)
    try {
      const res = await apiService.addFoodToMeal(contactId, plan.id, day.id, meal.id, {
        food_id: food.id, quantity: 100, unit: 'g'
      })
      onUpdate({ ...meal, foods: [...meal.foods, res.meal_food] })
    } catch { toast.error('Erro ao adicionar alimento') }
  }

  const handleRemoveFood = async (foodItemId) => {
    try {
      await apiService.removeMealFood(contactId, plan.id, day.id, meal.id, foodItemId)
      onUpdate({ ...meal, foods: meal.foods.filter(f => f.id !== foodItemId) })
    } catch { toast.error('Erro ao remover alimento') }
  }

  const handleUpdateFood = (updated) => {
    onUpdate({ ...meal, foods: meal.foods.map(f => f.id === updated.id ? updated : f) })
  }

  const totalKcal    = meal.foods.reduce((s, f) => s + f.kcal, 0)
  const totalProtein = meal.foods.reduce((s, f) => s + f.protein, 0)
  const totalCarbs   = meal.foods.reduce((s, f) => s + f.carbs, 0)
  const totalFat     = meal.foods.reduce((s, f) => s + f.fat, 0)

  return (
    <>
      {showFoodSearch && <FoodSearch onSelect={handleAddFood} onClose={() => setShowFoodSearch(false)} />}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: '#FAFAFA', cursor: 'pointer' }}
          onClick={() => setOpen(p => !p)}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{meal.name}</div>
            {meal.time_suggestion && <div style={{ fontSize: 11, color: T.muted }}>{meal.time_suggestion}</div>}
          </div>
          {totalKcal > 0 && (
            <div style={{ display: 'flex', gap: 4, marginRight: 8 }}>
              <MacroBadge label="kcal" value={totalKcal.toFixed(0)} unit="" color="#F59E0B" />
              <MacroBadge label="prot" value={totalProtein.toFixed(1)} color="#4C60AA" />
              <MacroBadge label="carb" value={totalCarbs.toFixed(1)} color="#10B981" />
              <MacroBadge label="gord" value={totalFat.toFixed(1)} color="#EF4444" />
            </div>
          )}
          <button type="button" onClick={(e) => { e.stopPropagation(); if (window.confirm(`Remover refeição "${meal.name}"?`)) onRemove(meal.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 4, marginRight: 4 }}>
            <Trash2 size={13} />
          </button>
          {open ? <ChevronUp size={14} style={{ color: T.muted }} /> : <ChevronDown size={14} style={{ color: T.muted }} />}
        </div>
        {open && (
          <div style={{ padding: '0 12px 10px' }}>
            {meal.foods.length === 0 && (
              <p style={{ fontSize: 12, color: T.muted, padding: '8px 0' }}>Nenhum alimento adicionado</p>
            )}
            {meal.foods.map(item => (
              <FoodItem key={item.id} item={item}
                contactId={contactId} planId={plan.id} dayId={day.id} mealId={meal.id}
                onRemove={handleRemoveFood} onUpdate={handleUpdateFood} />
            ))}
            <button type="button" onClick={() => setShowFoodSearch(true)}
              style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px dashed ${T.border}`, borderRadius: 7, padding: '5px 10px', cursor: 'pointer', color: T.brand, fontSize: 12, fontFamily: 'inherit' }}>
              <Plus size={13} /> Adicionar alimento
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function DayCard({ day, plan, contactId, onUpdate, onRemoveDay }) {
  const [open, setOpen]        = useState(true)
  const [addingMeal, setAddingMeal] = useState(false)
  const [mealName, setMealName]    = useState('')

  const handleAddMeal = async (name) => {
    if (!name.trim()) return
    setAddingMeal(true)
    try {
      const res = await apiService.addMeal(contactId, plan.id, day.id, name.trim())
      onUpdate({ ...day, meals: [...day.meals, { ...res.meal, foods: [] }] })
      setMealName('')
    } catch { toast.error('Erro ao adicionar refeição') }
    finally { setAddingMeal(false) }
  }

  const handleRemoveMeal = async (mealId) => {
    try {
      await apiService.removeMeal(contactId, plan.id, day.id, mealId)
      onUpdate({ ...day, meals: day.meals.filter(m => m.id !== mealId) })
    } catch { toast.error('Erro ao remover refeição') }
  }

  const handleUpdateMeal = (updated) => {
    onUpdate({ ...day, meals: day.meals.map(m => m.id === updated.id ? updated : m) })
  }

  const dayKcal = day.meals.reduce((s, m) => s + m.foods.reduce((s2, f) => s2 + f.kcal, 0), 0)

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', background: T.chip, cursor: 'pointer' }}
        onClick={() => setOpen(p => !p)}>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{day.label}</span>
          {dayKcal > 0 && <span style={{ marginLeft: 8, fontSize: 12, color: T.muted }}>{dayKcal.toFixed(0)} kcal total</span>}
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); if (window.confirm(`Remover ${day.label}?`)) onRemoveDay(day.id) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 4, marginRight: 6 }}>
          <Trash2 size={14} />
        </button>
        {open ? <ChevronUp size={15} style={{ color: T.muted }} /> : <ChevronDown size={15} style={{ color: T.muted }} />}
      </div>
      {open && (
        <div style={{ padding: '12px 14px' }}>
          {day.meals.map(meal => (
            <MealCard key={meal.id} meal={meal} day={day} plan={plan} contactId={contactId}
              onUpdate={handleUpdateMeal} onRemove={handleRemoveMeal} />
          ))}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {MEAL_DEFAULTS.filter(n => !day.meals.find(m => m.name === n)).slice(0, 4).map(name => (
              <button key={name} type="button" onClick={() => handleAddMeal(name)} disabled={addingMeal}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: T.chip, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.brand, fontFamily: 'inherit' }}>
                + {name}
              </button>
            ))}
            {mealName !== null && (
              <button type="button" onClick={() => setMealName('')}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'none', border: `1px dashed ${T.border}`, cursor: 'pointer', color: T.muted, fontFamily: 'inherit' }}>
                + Outra refeição
              </button>
            )}
          </div>
          {mealName !== undefined && mealName.length > 0 || false ? null : null}
        </div>
      )}
    </div>
  )
}

export default function MealPlanBuilder() {
  const { contactId, planId } = useParams()
  const navigate = useNavigate()
  const [plan, setPlan]         = useState(null)
  const [contact, setContact]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [title, setTitle]       = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [addingDay, setAddingDay]       = useState(false)
  const [activating, setActivating]     = useState(false)
  const [copied, setCopied]             = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [planRes, contactRes] = await Promise.all([
        apiService.getMealPlan(contactId, planId),
        apiService.getContact(contactId),
      ])
      setPlan(planRes.meal_plan)
      setTitle(planRes.meal_plan.title)
      setContact(contactRes.contact || contactRes)
    } catch {
      toast.error('Erro ao carregar plano alimentar')
    } finally {
      setLoading(false)
    }
  }, [contactId, planId])

  useEffect(() => { load() }, [load])

  const handleSaveTitle = async () => {
    if (!title.trim() || title === plan.title) { setEditingTitle(false); return }
    setSaving(true)
    try {
      const res = await apiService.updateMealPlan(contactId, planId, { title: title.trim() })
      setPlan(p => ({ ...p, title: res.meal_plan.title }))
      setEditingTitle(false)
    } catch { toast.error('Erro ao salvar título') }
    finally { setSaving(false) }
  }

  const handleAddDay = async () => {
    setAddingDay(true)
    try {
      const res = await apiService.addMealPlanDay(contactId, planId)
      setPlan(p => ({ ...p, days: [...p.days, { ...res.day, meals: [] }] }))
    } catch { toast.error('Erro ao adicionar dia') }
    finally { setAddingDay(false) }
  }

  const handleRemoveDay = async (dayId) => {
    try {
      await apiService.removeMealPlanDay(contactId, planId, dayId)
      setPlan(p => ({ ...p, days: p.days.filter(d => d.id !== dayId) }))
    } catch { toast.error('Erro ao remover dia') }
  }

  const handleUpdateDay = (updated) => {
    setPlan(p => ({ ...p, days: p.days.map(d => d.id === updated.id ? updated : d) }))
  }

  const handleActivate = async () => {
    setActivating(true)
    try {
      await apiService.activateMealPlan(contactId, planId)
      setPlan(p => ({ ...p, status: 'active' }))
      toast.success('Plano ativado! O link já está disponível para o paciente.')
    } catch { toast.error('Erro ao ativar plano') }
    finally { setActivating(false) }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/plano/${plan.public_token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: T.brand }} />
      </div>
    )
  }

  if (!plan) return null

  const totalKcal = plan.days?.reduce((s, d) =>
    s + d.meals.reduce((s2, m) => s2 + m.foods.reduce((s3, f) => s3 + f.kcal, 0), 0), 0) || 0

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 16px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button type="button" onClick={() => navigate(`/contacts/${contactId}`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: T.muted, padding: 4 }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>
            {contact?.name || 'Paciente'} · Plano Alimentar
          </div>
          {editingTitle ? (
            <input value={title} onChange={e => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') { setTitle(plan.title); setEditingTitle(false) } }}
              autoFocus
              style={{ fontSize: 20, fontWeight: 700, color: T.text, border: 'none', borderBottom: `2px solid ${T.brand}`, outline: 'none', background: 'transparent', fontFamily: 'inherit', width: '100%' }}
            />
          ) : (
            <h1 onClick={() => setEditingTitle(true)} style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0, cursor: 'text' }}>{plan.title}</h1>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: plan.status === 'active' ? '#ECFDF5' : '#F3F4F6', color: STATUS_COLORS[plan.status] }}>
            {STATUS_LABELS[plan.status]}
          </span>
          {plan.status === 'active' ? (
            <Button size="sm" onClick={handleCopyLink} style={{ fontSize: 12, gap: 5, background: T.chip, color: T.brand, border: `1px solid ${T.border}` }}>
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copiado!' : 'Link paciente'}
            </Button>
          ) : (
            <Button size="sm" onClick={handleActivate} disabled={activating} style={{ fontSize: 12, gap: 5, background: T.brand, color: '#fff' }}>
              {activating ? <Loader2 size={12} className="animate-spin" /> : <UtensilsCrossed size={12} />}
              Ativar plano
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {totalKcal > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {plan.days?.map(day => {
            const kcal = day.meals.reduce((s, m) => s + m.foods.reduce((s2, f) => s2 + f.kcal, 0), 0)
            if (kcal === 0) return null
            return (
              <div key={day.id} style={{ padding: '4px 10px', borderRadius: 8, background: T.chip, border: `1px solid ${T.border}`, fontSize: 11 }}>
                <span style={{ fontWeight: 600, color: T.text }}>{day.label}</span>
                <span style={{ color: T.muted, marginLeft: 4 }}>{kcal.toFixed(0)} kcal</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Days */}
      {plan.days?.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: T.muted }}>
          <UtensilsCrossed size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>Nenhum dia adicionado ainda</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Adicione dias da semana para montar o plano</p>
        </div>
      )}

      {plan.days?.map(day => (
        <DayCard key={day.id} day={day} plan={plan} contactId={contactId}
          onUpdate={handleUpdateDay} onRemoveDay={handleRemoveDay} />
      ))}

      <Button variant="outline" onClick={handleAddDay} disabled={addingDay}
        style={{ width: '100%', gap: 6, fontSize: 13, marginTop: 8, borderStyle: 'dashed' }}>
        {addingDay ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Adicionar dia
      </Button>
    </div>
  )
}
