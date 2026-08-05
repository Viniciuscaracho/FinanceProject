import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Loader2, Check,
  ChevronDown, ChevronUp, Search, X, UtensilsCrossed,
  Save, Settings2,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiService } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { T } from '@/lib/tokens'
import { MealNutrientPanel, DayNutrientStrip, computeDayTotals } from '@/components/nutrition/NutrientPanel'

const MEAL_DEFAULTS = ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar', 'Ceia']

const CATEGORY_LABELS = {
  low_carb:          'Low Carb',
  hipertrofia:       'Hipertrofia',
  mediterraneo:      'Mediterrâneo',
  vegetariano:       'Vegetariano',
  emagrecimento:     'Emagrecimento',
  corrida:           'Corrida',
  crossfit:          'CrossFit',
  esportes_coletivos:'Esportes Coletivos',
  natacao:           'Natação',
  artes_marciais:    'Artes Marciais',
  outro:             'Outro',
}

const CATEGORY_COLORS = {
  low_carb:          '#F59E0B',
  hipertrofia:       '#4C60AA',
  mediterraneo:      '#10B981',
  vegetariano:       '#22C55E',
  emagrecimento:     '#EF4444',
  corrida:           '#F97316',
  crossfit:          '#8B5CF6',
  esportes_coletivos:'#06B6D4',
  natacao:           '#0EA5E9',
  artes_marciais:    '#DC2626',
  outro:             '#9CA3AF',
}

const SOURCE_TABS = [
  { key: null,              label: 'Todos'          },
  { key: 'taco',            label: 'TACO'           },
  { key: 'open_food_facts', label: 'Fabricantes'    },
  { key: 'custom',          label: 'Meus alimentos' },
]

// ── MacroBadge ────────────────────────────────────────────────────────────────

function MacroBadge({ label, value, unit = 'g', color }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: 44, padding: '2px 6px', borderRadius: 7, background: T.light, border: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 9, fontWeight: 600, color: color || T.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{value}{unit}</span>
    </span>
  )
}

// ── FoodSearch ────────────────────────────────────────────────────────────────

const CUSTOM_FOOD_EMPTY = { name: '', brand: '', kcal_per_100g: '', protein_per_100g: '', carbs_per_100g: '', fat_per_100g: '', fiber_per_100g: '' }

function FoodSearch({ onSelect, onClose }) {
  const [query,          setQuery]          = useState('')
  const [source,         setSource]         = useState(null)
  const [results,        setResults]        = useState([])
  const [loading,        setLoading]        = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customFood,     setCustomFood]     = useState(CUSTOM_FOOD_EMPTY)
  const [savingCustom,   setSavingCustom]   = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { if (source !== 'custom') setShowCustomForm(false) }, [source])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await apiService.searchFoods(query, source)
        setResults(res.foods || [])
      } catch { setResults([]); toast.error('Erro ao buscar alimentos.') }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, source])

  const handleSaveCustomFood = async () => {
    if (!customFood.name.trim()) { toast.error('Nome é obrigatório'); return }
    setSavingCustom(true)
    try {
      const res = await apiService.createCustomFood({
        name:             customFood.name.trim(),
        brand:            customFood.brand.trim() || undefined,
        kcal_per_100g:    Number(customFood.kcal_per_100g)    || 0,
        protein_per_100g: Number(customFood.protein_per_100g) || 0,
        carbs_per_100g:   Number(customFood.carbs_per_100g)   || 0,
        fat_per_100g:     Number(customFood.fat_per_100g)     || 0,
        fiber_per_100g:   Number(customFood.fiber_per_100g)   || 0,
      })
      toast.success('Alimento criado!')
      onSelect(res.food)
    } catch { toast.error('Erro ao criar alimento') }
    finally { setSavingCustom(false) }
  }

  const setField = (key) => (e) => setCustomFood(p => ({ ...p, [key]: e.target.value }))
  const sourceLabel = s => ({ taco: 'TACO', open_food_facts: 'Fabricante', custom: 'Meu' }[s] || 'TACO')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="dm-modal-box" style={{ background: T.white, borderRadius: 14, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, padding: '0 10px', flexShrink: 0 }}>
          {SOURCE_TABS.map(tab => (
            <button key={String(tab.key)} type="button"
              onClick={() => { setSource(tab.key); setResults([]); inputRef.current?.focus() }}
              style={{ padding: '10px 10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                color: source === tab.key ? T.brand : T.muted,
                borderBottom: source === tab.key ? `2px solid ${T.brand}` : '2px solid transparent', marginBottom: -1 }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <Search size={15} style={{ color: T.muted, flexShrink: 0 }} />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder={
              source === 'open_food_facts' ? 'Buscar por marca ou produto (ex: Integral Médica, whey...)' :
              source === 'taco'            ? 'Buscar alimento TACO (ex: arroz, frango, banana...)' :
              source === 'custom'          ? 'Buscar nos seus alimentos...' :
                                            'Buscar em todos (TACO, marcas, meus alimentos...)'
            }
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: T.text }} />
          {loading && <Loader2 size={14} className="animate-spin" style={{ color: T.muted }} />}
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 2 }}><X size={16} /></button>
        </div>
        {source === 'custom' && (
          <div style={{ flexShrink: 0 }}>
            {!showCustomForm ? (
              <button type="button" onClick={() => setShowCustomForm(true)}
                style={{ width: '100%', padding: '8px 14px', border: 'none', borderTop: `1px solid ${T.border}`, background: T.light, cursor: 'pointer', fontSize: 12, color: T.brand, fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
                <Plus size={13} /> Criar novo alimento
              </button>
            ) : (
              <div style={{ borderTop: `1px solid ${T.border}`, padding: '12px 14px', background: T.light }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>Novo alimento (por 100g)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <input value={customFood.name} onChange={setField('name')} placeholder="Nome *"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <input value={customFood.brand} onChange={setField('brand')} placeholder="Marca (opcional)"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  {[
                    { key: 'kcal_per_100g',    label: 'Kcal',   color: '#F59E0B' },
                    { key: 'protein_per_100g',  label: 'Prot g', color: '#4C60AA' },
                    { key: 'carbs_per_100g',    label: 'Carb g', color: '#10B981' },
                    { key: 'fat_per_100g',      label: 'Gord g', color: '#EF4444' },
                    { key: 'fiber_per_100g',    label: 'Fibr g', color: '#6B7280' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: T.muted, marginBottom: 3 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.color, display: 'inline-block' }} />
                        {f.label}
                      </label>
                      <input type="number" min="0" step="0.1" value={customFood[f.key]} onChange={setField(f.key)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button type="button" onClick={() => { setShowCustomForm(false); setCustomFood(CUSTOM_FOOD_EMPTY) }}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: T.muted }}>
                    Cancelar
                  </button>
                  <Button onClick={handleSaveCustomFood} disabled={savingCustom} style={{ flex: 2, gap: 5, fontSize: 12 }}>
                    {savingCustom ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Criar e adicionar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {query.length < 2 && (
            <p style={{ padding: '20px 14px', fontSize: 13, color: T.muted, textAlign: 'center' }}>Digite ao menos 2 letras para buscar</p>
          )}
          {query.length >= 2 && !loading && results.length === 0 && (
            <p style={{ padding: '20px 14px', fontSize: 13, color: T.muted, textAlign: 'center' }}>Nenhum alimento encontrado para "{query}"</p>
          )}
          {results.map((food, idx) => (
            <button key={food.id || food.external_id || idx} type="button"
              onClick={() => onSelect(food.id ? food : { ...food, _needsSave: true })}
              style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 52 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{food.name}</div>
                {food.brand && <div style={{ fontSize: 11, color: T.muted }}>{food.brand}</div>}
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                  {food.kcal_per_100g} kcal · P {food.protein_per_100g}g · C {food.carbs_per_100g}g · G {food.fat_per_100g}g
                  <span style={{ marginLeft: 5, padding: '0 5px', borderRadius: 4, background: T.light, fontSize: 10 }}>{sourceLabel(food.source)}</span>
                </div>
              </div>
              <Plus size={14} style={{ color: T.brand, flexShrink: 0, marginLeft: 8 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── FoodItem ──────────────────────────────────────────────────────────────────

function FoodItem({ item, templateId, dayId, mealId, onRemove, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [qty, setQty]         = useState(String(item.quantity))
  const [saving, setSaving]   = useState(false)

  const handleSave = async () => {
    if (!qty || isNaN(qty) || Number(qty) <= 0) return
    setSaving(true)
    try {
      const res = await apiService.updateTemplateMealFood(templateId, dayId, mealId, item.id, { quantity: Number(qty) })
      onUpdate(res.meal_food); setEditing(false)
    } catch { toast.error('Erro ao atualizar quantidade') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.text, lineHeight: 1.3 }}>{item.food_name}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>
          {item.kcal.toFixed(0)} kcal · P {item.protein.toFixed(1)}g · C {item.carbs.toFixed(1)}g · G {item.fat.toFixed(1)}g
          {item.fiber > 0 && <span style={{ color: '#6B7280' }}> · F {item.fiber.toFixed(1)}g</span>}
        </div>
      </div>
      {editing ? (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          <input type="number" value={qty} onChange={e => setQty(e.target.value)} min="1" autoFocus
            style={{ width: 60, padding: '4px 6px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: 'inherit', textAlign: 'center' }}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }} />
          <span style={{ fontSize: 11, color: T.muted }}>g</span>
          {saving ? <Loader2 size={12} className="animate-spin" /> : (
            <button type="button" onClick={handleSave} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10B981', padding: 4, minWidth: 28, minHeight: 28 }}><Check size={14} /></button>
          )}
          <button type="button" onClick={() => { setQty(String(item.quantity)); setEditing(false) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4, minWidth: 28, minHeight: 28 }}><X size={14} /></button>
        </div>
      ) : (
        <button type="button" onClick={() => setEditing(true)}
          style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: T.light, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.text, fontFamily: 'inherit', fontWeight: 600, minHeight: 32, flexShrink: 0 }}>
          {item.quantity}g
        </button>
      )}
      <button type="button" onClick={() => onRemove(item.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.border, padding: 6, flexShrink: 0, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ── MealCard ──────────────────────────────────────────────────────────────────

function MealCard({ meal, day, template, onUpdate, onRemove }) {
  const [open, setOpen]                 = useState(true)
  const [showFoodSearch, setShowFoodSearch] = useState(false)

  const handleAddFood = async (food) => {
    setShowFoodSearch(false)
    let foodId = food.id
    if (!foodId) {
      try {
        const saved = await apiService.createCustomFood({
          name: food.name, brand: food.brand,
          kcal_per_100g: food.kcal_per_100g, protein_per_100g: food.protein_per_100g,
          carbs_per_100g: food.carbs_per_100g, fat_per_100g: food.fat_per_100g,
          fiber_per_100g: food.fiber_per_100g, external_id: food.external_id,
        })
        foodId = saved.food.id
      } catch { toast.error('Erro ao salvar alimento'); return }
    }
    try {
      const res = await apiService.addFoodToTemplateMeal(template.id, day.id, meal.id, { food_id: foodId, quantity: 100, unit: 'g' })
      onUpdate({ ...meal, foods: [...meal.foods, res.meal_food] })
    } catch { toast.error('Erro ao adicionar alimento') }
  }

  const handleRemoveFood = async (id) => {
    try {
      await apiService.removeTemplateMealFood(template.id, day.id, meal.id, id)
      onUpdate({ ...meal, foods: meal.foods.filter(f => f.id !== id) })
    } catch { toast.error('Erro ao remover alimento') }
  }

  const handleUpdateFood = (updated) => onUpdate({ ...meal, foods: meal.foods.map(f => f.id === updated.id ? updated : f) })

  const totalKcal    = meal.foods.reduce((s, f) => s + f.kcal, 0)
  const totalProtein = meal.foods.reduce((s, f) => s + f.protein, 0)
  const totalCarbs   = meal.foods.reduce((s, f) => s + f.carbs, 0)
  const totalFat     = meal.foods.reduce((s, f) => s + f.fat, 0)

  return (
    <>
      {showFoodSearch && <FoodSearch onSelect={handleAddFood} onClose={() => setShowFoodSearch(false)} />}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: T.light, cursor: 'pointer' }}
          onClick={() => setOpen(p => !p)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{meal.name}</div>
            {meal.time_suggestion && <div style={{ fontSize: 11, color: T.muted }}>{meal.time_suggestion}</div>}
          </div>
          {totalKcal > 0 && (
            <div style={{ display: 'flex', gap: 3, marginRight: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <MacroBadge label="kcal" value={totalKcal.toFixed(0)} unit="" color="#F59E0B" />
              <MacroBadge label="prot" value={totalProtein.toFixed(1)} color="#4C60AA" />
              <MacroBadge label="carb" value={totalCarbs.toFixed(1)} color="#10B981" />
              <MacroBadge label="gord" value={totalFat.toFixed(1)} color="#EF4444" />
            </div>
          )}
          <button type="button" onClick={e => { e.stopPropagation(); if (window.confirm(`Remover "${meal.name}"?`)) onRemove(meal.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.border, padding: 6, marginRight: 2, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                templateId={template.id} dayId={day.id} mealId={meal.id}
                onRemove={handleRemoveFood} onUpdate={handleUpdateFood} />
            ))}
            <button type="button" onClick={() => setShowFoodSearch(true)}
              style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px dashed ${T.border}`, borderRadius: 7, padding: '7px 12px', cursor: 'pointer', color: T.brand, fontSize: 12, fontFamily: 'inherit', minHeight: 36, width: '100%', justifyContent: 'center' }}>
              <Plus size={13} /> Adicionar alimento
            </button>
            <MealNutrientPanel meal={meal} />
          </div>
        )}
      </div>
    </>
  )
}

// ── DayCard ───────────────────────────────────────────────────────────────────

function DayCard({ day, template, onUpdate, onRemoveDay }) {
  const [open, setOpen]             = useState(true)
  const [addingMeal, setAddingMeal] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customName, setCustomName] = useState('')

  const handleAddMeal = async (name) => {
    if (!name.trim()) return
    setAddingMeal(true)
    try {
      const res = await apiService.addMealToTemplate(template.id, day.id, name.trim())
      onUpdate({ ...day, meals: [...day.meals, { ...res.meal, foods: [] }] })
    } catch { toast.error('Erro ao adicionar refeição') }
    finally { setAddingMeal(false) }
  }

  const handleRemoveMeal = async (mealId) => {
    try {
      await apiService.removeMealFromTemplate(template.id, day.id, mealId)
      onUpdate({ ...day, meals: day.meals.filter(m => m.id !== mealId) })
    } catch { toast.error('Erro ao remover refeição') }
  }

  const handleUpdateMeal = (updated) => onUpdate({ ...day, meals: day.meals.map(m => m.id === updated.id ? updated : m) })

  const totals  = computeDayTotals(day)
  const hasFood = day.meals.some(m => m.foods.length > 0)

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', background: T.chip }}>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setOpen(p => !p)}>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{day.label}</span>
        </div>
        <button type="button" onClick={() => { if (window.confirm(`Remover ${day.label}?`)) onRemoveDay(day.id) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.border, padding: 6, marginRight: 4, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trash2 size={14} />
        </button>
        <div style={{ cursor: 'pointer' }} onClick={() => setOpen(p => !p)}>
          {open ? <ChevronUp size={15} style={{ color: T.muted }} /> : <ChevronDown size={15} style={{ color: T.muted }} />}
        </div>
      </div>
      {hasFood && (
        <DayNutrientStrip totals={totals} targets={template} onOpenTargets={() => {}} />
      )}
      {open && (
        <div style={{ padding: '12px 14px' }}>
          {day.meals.map(meal => (
            <MealCard key={meal.id} meal={meal} day={day} template={template}
              onUpdate={handleUpdateMeal} onRemove={handleRemoveMeal} />
          ))}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4, alignItems: 'center' }}>
            {MEAL_DEFAULTS.filter(n => !day.meals.find(m => m.name === n)).map(name => (
              <button key={name} type="button" onClick={() => handleAddMeal(name)} disabled={addingMeal}
                style={{ fontSize: 11, padding: '6px 12px', borderRadius: 20, background: T.chip, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.brand, fontFamily: 'inherit', minHeight: 34 }}>
                + {name}
              </button>
            ))}
            {customOpen ? (
              <form onSubmit={e => { e.preventDefault(); if (customName.trim()) { handleAddMeal(customName.trim()); setCustomName(''); setCustomOpen(false) } }}
                style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input autoFocus value={customName} onChange={e => setCustomName(e.target.value)}
                  onBlur={() => { if (!customName.trim()) setCustomOpen(false) }}
                  onKeyDown={e => { if (e.key === 'Escape') { setCustomOpen(false); setCustomName('') } }}
                  placeholder="Nome da refeição..."
                  style={{ fontSize: 11, padding: '6px 10px', borderRadius: 20, border: `1px solid ${T.brand}`, outline: 'none', fontFamily: 'inherit', minHeight: 34, width: 160 }} />
                <button type="submit" disabled={!customName.trim() || addingMeal}
                  style={{ fontSize: 11, padding: '6px 12px', borderRadius: 20, background: T.brand, border: 'none', cursor: 'pointer', color: '#fff', fontFamily: 'inherit', minHeight: 34 }}>
                  Adicionar
                </button>
              </form>
            ) : (
              <button type="button" onClick={() => setCustomOpen(true)}
                style={{ fontSize: 11, padding: '6px 12px', borderRadius: 20, background: T.chip, border: `1px dashed ${T.border}`, cursor: 'pointer', color: T.muted, fontFamily: 'inherit', minHeight: 34 }}>
                + Personalizada
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── TargetsModal ──────────────────────────────────────────────────────────────

function TargetsModal({ template, templateId, onSave, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const [values, setValues] = useState({
    target_kcal:      template.target_kcal      || 0,
    target_protein_g: template.target_protein_g || 0,
    target_carbs_g:   template.target_carbs_g   || 0,
    target_fat_g:     template.target_fat_g     || 0,
    target_fiber_g:   template.target_fiber_g   || 0,
  })
  const [saving, setSaving] = useState(false)

  const fields = [
    { key: 'target_kcal',      label: 'Calorias (Kcal)', color: '#F59E0B', placeholder: 'ex: 2000' },
    { key: 'target_protein_g', label: 'Proteínas (g)',    color: '#4C60AA', placeholder: 'ex: 150' },
    { key: 'target_carbs_g',   label: 'Carboidratos (g)', color: '#10B981', placeholder: 'ex: 220' },
    { key: 'target_fat_g',     label: 'Lipídios (g)',     color: '#EF4444', placeholder: 'ex: 65'  },
    { key: 'target_fiber_g',   label: 'Fibras (g)',       color: '#6B7280', placeholder: 'ex: 25'  },
  ]

  const handleSave = async () => {
    setSaving(true)
    try {
      const numericValues = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === '' ? 0 : Number(v) || 0])
      )
      const res = await apiService.updateMealPlanTemplate(templateId, numericValues)
      onSave(res.template); onClose()
      toast.success('Metas salvas!')
    } catch { toast.error('Erro ao salvar metas') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="dm-modal-box" style={{ background: T.white, borderRadius: 16, width: '100%', maxWidth: 460, padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: T.text }}>Metas do modelo</h3>
        <p style={{ margin: '0 0 18px', fontSize: 12, color: T.muted }}>Referência nutricional para o painel de análise.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {fields.map((f, i) => (
            <div key={f.key} style={{ gridColumn: i === 0 ? '1 / -1' : undefined }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, display: 'inline-block' }} />
                {f.label}
              </label>
              <input type="number" min="0" value={values[f.key]} placeholder={f.placeholder}
                onChange={e => setValues(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', minHeight: 44 }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button type="button" onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, color: T.muted, minHeight: 48 }}>
            Cancelar
          </button>
          <Button onClick={handleSave} disabled={saving}
            style={{ flex: 2, gap: 6, fontSize: 14, minHeight: 48, borderRadius: 10 }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar metas
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── MealPlanTemplateBuilder ───────────────────────────────────────────────────

export default function MealPlanTemplateBuilder() {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const [template, setTemplate]       = useState(null)
  const [loading, setLoading]         = useState(true)
  const [title, setTitle]             = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [addingDay, setAddingDay]     = useState(false)
  const [showTargets, setShowTargets] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiService.getMealPlanTemplate(templateId)
      setTemplate(res.template)
      setTitle(res.template.title)
    } catch { toast.error('Erro ao carregar modelo') }
    finally { setLoading(false) }
  }, [templateId])

  useEffect(() => { load() }, [load])

  const handleSaveTitle = async () => {
    if (!title.trim() || title === template.title) { setEditingTitle(false); return }
    setSaving(true)
    try {
      const res = await apiService.updateMealPlanTemplate(templateId, { title: title.trim() })
      setTemplate(p => ({ ...p, title: res.template.title })); setEditingTitle(false)
    } catch { toast.error('Erro ao salvar título') }
    finally { setSaving(false) }
  }

  const handleAddDay = async () => {
    setAddingDay(true)
    try {
      const res = await apiService.addMealPlanTemplateDay(templateId)
      setTemplate(p => ({ ...p, days: [...p.days, { ...res.day, meals: [] }] }))
    } catch { toast.error('Erro ao adicionar dia') }
    finally { setAddingDay(false) }
  }

  const handleRemoveDay = async (dayId) => {
    try {
      await apiService.removeMealPlanTemplateDay(templateId, dayId)
      setTemplate(p => ({ ...p, days: p.days.filter(d => d.id !== dayId) }))
    } catch { toast.error('Erro ao remover dia') }
  }

  const handleUpdateDay = (updated) => setTemplate(p => ({ ...p, days: p.days.map(d => d.id === updated.id ? updated : d) }))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Loader2 size={28} className="animate-spin" style={{ color: T.brand }} />
    </div>
  )

  if (!template) return null

  const hasTargets = template.target_kcal > 0 || template.target_protein_g > 0
  const catColor = CATEGORY_COLORS[template.template_category] || '#9CA3AF'
  const catLabel = CATEGORY_LABELS[template.template_category] || 'Outro'

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 12px 80px' }}>
      {showTargets && (
        <TargetsModal template={template} templateId={templateId}
          onSave={updated => setTemplate(p => ({ ...p, ...updated }))}
          onClose={() => setShowTargets(false)} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
        <button type="button" onClick={() => navigate('/meal-plan-templates')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 6, marginTop: 2, minWidth: 32, minHeight: 32 }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            Modelo alimentar ·
            <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${catColor}20`, color: catColor }}>{catLabel}</span>
          </div>
          {editingTitle ? (
            <input value={title} onChange={e => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') { setTitle(template.title); setEditingTitle(false) } }}
              autoFocus
              style={{ fontSize: 18, fontWeight: 700, color: T.text, border: 'none', borderBottom: `2px solid ${T.brand}`, outline: 'none', background: 'transparent', fontFamily: 'inherit', width: '100%' }} />
          ) : (
            <h1 onClick={() => setEditingTitle(true)}
              style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: 0, cursor: 'text', lineHeight: 1.3 }}>
              {template.title}
            </h1>
          )}
        </div>
      </div>

      {/* Barra de ações */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setShowTargets(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${hasTargets ? T.brand : T.border}`, background: hasTargets ? T.chip : 'none', cursor: 'pointer', color: hasTargets ? T.brand : T.muted, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, minHeight: 40, flex: '1 1 auto' }}>
          <Settings2 size={14} />
          {hasTargets ? `Metas: ${Math.round(template.target_kcal)} kcal · ${Math.round(template.target_protein_g)}g P · ${Math.round(template.target_carbs_g)}g C` : 'Definir metas do modelo'}
        </button>
        {saving && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '9px 14px', fontSize: 12, color: T.muted }}>
            <Loader2 size={12} className="animate-spin" /> Salvando...
          </div>
        )}
      </div>

      {/* Dias */}
      {template.days?.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: T.muted }}>
          <UtensilsCrossed size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>Nenhum dia adicionado ainda</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Adicione dias para montar a estrutura do modelo</p>
        </div>
      )}

      {template.days?.map(day => (
        <DayCard key={day.id} day={day} template={template}
          onUpdate={handleUpdateDay} onRemoveDay={handleRemoveDay} />
      ))}

      <Button variant="outline" onClick={handleAddDay} disabled={addingDay}
        style={{ width: '100%', gap: 6, fontSize: 13, marginTop: 8, borderStyle: 'dashed', minHeight: 44 }}>
        {addingDay ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Adicionar dia
      </Button>
    </div>
  )
}
