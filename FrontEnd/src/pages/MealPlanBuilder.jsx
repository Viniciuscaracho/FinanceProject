import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Loader2, Copy, Check,
  ChevronDown, ChevronUp, Search, X, UtensilsCrossed,
  Save, Settings2, BookmarkPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiService } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { T } from '@/lib/tokens'
import { MealNutrientPanel, DayNutrientStrip, computeDayTotals } from '@/components/nutrition/NutrientPanel'

const MEAL_DEFAULTS = ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar', 'Ceia']
const STATUS_LABELS = { draft: 'Rascunho', active: 'Ativo', archived: 'Arquivado' }
const STATUS_COLORS = { draft: '#9CA3AF', active: '#10B981', archived: '#6B7280' }
const TEMPLATE_CATEGORIES = [
  { value: 'low_carb',     label: 'Low Carb'      },
  { value: 'hipertrofia',  label: 'Hipertrofia'   },
  { value: 'mediterraneo', label: 'Mediterrâneo'  },
  { value: 'vegetariano',  label: 'Vegetariano'   },
  { value: 'emagrecimento',label: 'Emagrecimento' },
  { value: 'outro',        label: 'Outro'         },
]
const SOURCE_TABS   = [
  { key: null,              label: 'Todos'         },
  { key: 'taco',            label: 'TACO'          },
  { key: 'open_food_facts', label: 'Fabricantes'   },
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

  useEffect(() => {
    if (source !== 'custom') setShowCustomForm(false)
  }, [source])

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
        {/* Tabs */}
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

        {/* Campo de busca */}
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

        {/* Formulário inline — apenas na aba Meus alimentos */}
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
                  <Button onClick={handleSaveCustomFood} disabled={savingCustom}
                    style={{ flex: 2, gap: 5, fontSize: 12 }}>
                    {savingCustom ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Criar e adicionar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resultados */}
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

function FoodItem({ item, contactId, planId, dayId, mealId, onRemove, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [qty, setQty]         = useState(String(item.quantity))
  const [saving, setSaving]   = useState(false)

  const handleSave = async () => {
    if (!qty || isNaN(qty) || Number(qty) <= 0) return
    setSaving(true)
    try {
      const res = await apiService.updateMealFood(contactId, planId, dayId, mealId, item.id, { quantity: Number(qty) })
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

function MealCard({ meal, day, plan, contactId, onUpdate, onRemove }) {
  const [open, setOpen]           = useState(true)
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
      const res = await apiService.addFoodToMeal(contactId, plan.id, day.id, meal.id, { food_id: foodId, quantity: 100, unit: 'g' })
      onUpdate({ ...meal, foods: [...meal.foods, res.meal_food] })
    } catch { toast.error('Erro ao adicionar alimento') }
  }

  const handleRemoveFood = async (id) => {
    try {
      await apiService.removeMealFood(contactId, plan.id, day.id, meal.id, id)
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
        {/* Cabeçalho da refeição */}
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
                contactId={contactId} planId={plan.id} dayId={day.id} mealId={meal.id}
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

function DayCard({ day, plan, contactId, onUpdate, onRemoveDay, onOpenTargets }) {
  const [open, setOpen]             = useState(true)
  const [addingMeal, setAddingMeal] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customName, setCustomName] = useState('')

  const handleAddMeal = async (name) => {
    if (!name.trim()) return
    setAddingMeal(true)
    try {
      const res = await apiService.addMeal(contactId, plan.id, day.id, name.trim())
      onUpdate({ ...day, meals: [...day.meals, { ...res.meal, foods: [] }] })
    } catch { toast.error('Erro ao adicionar refeição') }
    finally { setAddingMeal(false) }
  }

  const handleRemoveMeal = async (mealId) => {
    try {
      await apiService.removeMeal(contactId, plan.id, day.id, mealId)
      onUpdate({ ...day, meals: day.meals.filter(m => m.id !== mealId) })
    } catch { toast.error('Erro ao remover refeição') }
  }

  const handleUpdateMeal = (updated) => onUpdate({ ...day, meals: day.meals.map(m => m.id === updated.id ? updated : m) })

  const totals  = computeDayTotals(day)
  const hasFood = day.meals.some(m => m.foods.length > 0)

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
      {/* Cabeçalho do dia */}
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

      {/* ── PAINEL DE NUTRIENTES — sempre visível quando há alimentos ── */}
      {hasFood && (
        <DayNutrientStrip
          totals={totals}
          targets={plan}
          onOpenTargets={onOpenTargets}
        />
      )}

      {/* Refeições */}
      {open && (
        <div style={{ padding: '12px 14px' }}>
          {day.meals.map(meal => (
            <MealCard key={meal.id} meal={meal} day={day} plan={plan} contactId={contactId}
              onUpdate={handleUpdateMeal} onRemove={handleRemoveMeal} />
          ))}

          {/* Botões de adição rápida */}
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

function TargetsModal({ plan, contactId, planId, onSave, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const [values, setValues] = useState({
    target_kcal:      plan.target_kcal      || 0,
    target_protein_g: plan.target_protein_g || 0,
    target_carbs_g:   plan.target_carbs_g   || 0,
    target_fat_g:     plan.target_fat_g     || 0,
    target_fiber_g:   plan.target_fiber_g   || 0,
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
      const res = await apiService.updateMealPlan(contactId, planId, numericValues)
      onSave(res.meal_plan); onClose()
      toast.success('Metas salvas!')
    } catch { toast.error('Erro ao salvar metas') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="dm-modal-box" style={{ background: T.white, borderRadius: 16, width: '100%', maxWidth: 460, padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: T.text }}>Metas diárias — Prescrito</h3>
        <p style={{ margin: '0 0 18px', fontSize: 12, color: T.muted }}>Define os valores de referência para o painel de análise nutricional.</p>

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

// ── MealPlanBuilder ───────────────────────────────────────────────────────────

export default function MealPlanBuilder() {
  const { contactId, planId } = useParams()
  const navigate = useNavigate()
  const [plan, setPlan]       = useState(null)
  const [contact, setContact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle]     = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [saving, setSaving]             = useState(false)
  const [addingDay, setAddingDay]       = useState(false)
  const [activating, setActivating]     = useState(false)
  const [copied, setCopied]             = useState(false)
  const [showTargets, setShowTargets]   = useState(false)
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false)
  const [templateForm, setTemplateForm] = useState({ title: '', template_category: 'outro' })
  const [savingTemplate, setSavingTemplate] = useState(false)

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
    } catch { toast.error('Erro ao carregar plano alimentar') }
    finally { setLoading(false) }
  }, [contactId, planId])

  useEffect(() => { load() }, [load])

  const handleSaveTitle = async () => {
    if (!title.trim() || title === plan.title) { setEditingTitle(false); return }
    setSaving(true)
    try {
      const res = await apiService.updateMealPlan(contactId, planId, { title: title.trim() })
      setPlan(p => ({ ...p, title: res.meal_plan.title })); setEditingTitle(false)
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

  const handleUpdateDay = (updated) => setPlan(p => ({ ...p, days: p.days.map(d => d.id === updated.id ? updated : d) }))

  const handleActivate = async () => {
    setActivating(true)
    try {
      const res = await apiService.activateMealPlan(contactId, planId)
      setPlan(p => ({ ...p, status: 'active' }))
      if (res?.whatsapp_sent) {
        toast.success('Plano ativado! Link enviado por WhatsApp ao paciente.')
      } else {
        toast.success('Plano ativado! Link disponível para o paciente.')
      }
    } catch { toast.error('Erro ao ativar plano') }
    finally { setActivating(false) }
  }

  const handleOpenSaveAsTemplate = () => {
    setTemplateForm({ title: plan.title, template_category: 'outro' })
    setShowSaveAsTemplate(true)
  }

  const handleSaveAsTemplate = async () => {
    if (!templateForm.title.trim()) { toast.error('Informe um título'); return }
    setSavingTemplate(true)
    try {
      await apiService.savePlanAsTemplate(planId, {
        title:             templateForm.title.trim(),
        template_category: templateForm.template_category,
      })
      setShowSaveAsTemplate(false)
      toast.success('Plano salvo como modelo!')
    } catch { toast.error('Erro ao salvar como modelo') }
    finally { setSavingTemplate(false) }
  }

  const handleCopyLink = () => {
    const url = `${import.meta.env.VITE_PUBLIC_URL || window.location.origin}/plano/${plan.public_token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true); toast.success('Link copiado!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Loader2 size={28} className="animate-spin" style={{ color: T.brand }} />
    </div>
  )

  if (!plan) return null

  const hasTargets = plan.target_kcal > 0 || plan.target_protein_g > 0

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 12px 80px' }}>
      {showTargets && (
        <TargetsModal plan={plan} contactId={contactId} planId={planId}
          onSave={updated => setPlan(p => ({ ...p, ...updated }))}
          onClose={() => setShowTargets(false)} />
      )}

      {showSaveAsTemplate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowSaveAsTemplate(false) }}>
          <div className="dm-modal-box" style={{ background: T.white, borderRadius: 16, width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: T.text }}>Salvar como modelo</h3>
            <p style={{ margin: '0 0 18px', fontSize: 12, color: T.muted }}>Este plano será copiado como modelo reutilizável para novos pacientes.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 4 }}>Nome do modelo *</label>
                <input value={templateForm.title} onChange={e => setTemplateForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="ex: Low Carb — Emagrecimento"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 4 }}>Categoria</label>
                <select value={templateForm.template_category} onChange={e => setTemplateForm(p => ({ ...p, template_category: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: T.white, color: T.text }}>
                  {TEMPLATE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button type="button" onClick={() => setShowSaveAsTemplate(false)}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: T.muted }}>
                Cancelar
              </button>
              <Button onClick={handleSaveAsTemplate} disabled={savingTemplate}
                style={{ flex: 2, gap: 6, fontSize: 13, borderRadius: 10 }}>
                {savingTemplate ? <Loader2 size={13} className="animate-spin" /> : <BookmarkPlus size={13} />}
                Salvar modelo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
        <button type="button" onClick={() => navigate(`/contacts/${contactId}`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 6, marginTop: 2, minWidth: 32, minHeight: 32 }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>
            {contact?.name || 'Paciente'} · Plano Alimentar
          </div>
          {editingTitle ? (
            <input value={title} onChange={e => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') { setTitle(plan.title); setEditingTitle(false) } }}
              autoFocus
              style={{ fontSize: 18, fontWeight: 700, color: T.text, border: 'none', borderBottom: `2px solid ${T.brand}`, outline: 'none', background: 'transparent', fontFamily: 'inherit', width: '100%' }} />
          ) : (
            <h1 onClick={() => setEditingTitle(true)}
              style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: 0, cursor: 'text', lineHeight: 1.3 }}>
              {plan.title}
            </h1>
          )}
        </div>
      </div>

      {/* ── Barra de ações ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Metas — CTA principal */}
        <button type="button" onClick={() => setShowTargets(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${hasTargets ? T.brand : T.border}`, background: hasTargets ? T.chip : 'none', cursor: 'pointer', color: hasTargets ? T.brand : T.muted, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, minHeight: 40, flex: '1 1 auto' }}>
          <Settings2 size={14} />
          {hasTargets ? `Metas: ${Math.round(plan.target_kcal)} kcal · ${Math.round(plan.target_protein_g)}g P · ${Math.round(plan.target_carbs_g)}g C` : 'Definir metas do plano'}
        </button>

        {/* Salvar como modelo */}
        <button type="button" onClick={handleOpenSaveAsTemplate}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'none', cursor: 'pointer', color: T.muted, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, minHeight: 40, flexShrink: 0, whiteSpace: 'nowrap' }}>
          <BookmarkPlus size={14} /> Salvar como modelo
        </button>

        {/* Status + ação */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: plan.status === 'active' ? '#ECFDF5' : '#F3F4F6', color: STATUS_COLORS[plan.status] }}>
            {STATUS_LABELS[plan.status]}
          </span>
          {plan.status === 'active' ? (
            <Button size="sm" onClick={handleCopyLink} style={{ fontSize: 12, gap: 5, background: T.chip, color: T.brand, border: `1px solid ${T.border}`, minHeight: 36 }}>
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copiado!' : 'Link'}
            </Button>
          ) : (
            <Button size="sm" onClick={handleActivate} disabled={activating} style={{ fontSize: 12, gap: 5, minHeight: 36 }}>
              {activating ? <Loader2 size={12} className="animate-spin" /> : <UtensilsCrossed size={12} />}
              Ativar
            </Button>
          )}
        </div>
      </div>

      {/* ── Dias ── */}
      {plan.days?.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: T.muted }}>
          <UtensilsCrossed size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>Nenhum dia adicionado ainda</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Adicione dias da semana para montar o plano</p>
        </div>
      )}

      {plan.days?.map(day => (
        <DayCard key={day.id} day={day} plan={plan} contactId={contactId}
          onUpdate={handleUpdateDay} onRemoveDay={handleRemoveDay}
          onOpenTargets={() => setShowTargets(true)} />
      ))}

      <Button variant="outline" onClick={handleAddDay} disabled={addingDay}
        style={{ width: '100%', gap: 6, fontSize: 13, marginTop: 8, borderStyle: 'dashed', minHeight: 44 }}>
        {addingDay ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Adicionar dia
      </Button>
    </div>
  )
}
