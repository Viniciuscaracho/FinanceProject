import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Loader2, ExternalLink, Download } from 'lucide-react'
import { toast } from 'sonner'
import { apiService } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { T } from '@/lib/tokens'

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

const BLANK_FORM = { title: '', template_category: 'outro', description: '' }

export default function MealPlanTemplates() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(BLANK_FORM)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]       = useState(null)
  const [importing, setImporting]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiService.getMealPlanTemplates()
      setTemplates(res.templates || [])
    } catch { toast.error('Erro ao carregar modelos') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleImportSystem = async () => {
    setImporting(true)
    try {
      const res = await apiService.importSystemMealPlanTemplates()
      setTemplates(res.templates || [])
      if (res.imported > 0) {
        toast.success(`${res.imported} modelo${res.imported > 1 ? 's' : ''} importado${res.imported > 1 ? 's' : ''}!`)
      } else {
        toast.info('Todos os modelos padrão já estão importados.')
      }
    } catch { toast.error('Erro ao importar modelos') }
    finally { setImporting(false) }
  }

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error('Informe um título'); return }
    setSaving(true)
    try {
      const res = await apiService.createMealPlanTemplate({
        title:             form.title.trim(),
        template_category: form.template_category,
        description:       form.description.trim() || undefined,
      })
      setShowForm(false)
      setForm(BLANK_FORM)
      navigate(`/meal-plan-templates/${res.template.id}`)
    } catch { toast.error('Erro ao criar modelo') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Remover o modelo "${title}"?`)) return
    setDeleting(id)
    try {
      await apiService.deleteMealPlanTemplate(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
      toast.success('Modelo removido')
    } catch { toast.error('Erro ao remover modelo') }
    finally { setDeleting(null) }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '12px 12px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button type="button" onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 6, minWidth: 32, minHeight: 32 }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>Modelos de Plano Alimentar</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: T.muted }}>Crie modelos reutilizáveis para facilitar a montagem de planos</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleImportSystem} disabled={importing}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: T.muted, fontFamily: 'inherit' }}>
            {importing ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Padrões
          </button>
          <Button onClick={() => { setShowForm(true); setForm(BLANK_FORM) }} style={{ gap: 6, fontSize: 13 }}>
            <Plus size={14} /> Novo modelo
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ border: `1px solid ${T.brand}40`, borderRadius: 12, padding: 16, marginBottom: 16, background: T.white }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 14 }}>Novo modelo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 4 }}>Título *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="ex: Low Carb — Emagrecimento"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 4 }}>Categoria</label>
              <select value={form.template_category} onChange={e => setForm(p => ({ ...p, template_category: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: T.white, color: T.text }}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 4 }}>Descrição (opcional)</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="ex: Plano focado em emagrecimento com ~1600 kcal"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <Button variant="outline" onClick={() => setShowForm(false)} style={{ flex: 1, fontSize: 13 }}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving} style={{ flex: 2, fontSize: 13, gap: 6 }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Criar e montar modelo
            </Button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <Loader2 size={24} className="animate-spin" style={{ color: T.brand }} />
        </div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: T.muted }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🥗</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: '0 0 4px' }}>Nenhum modelo criado ainda</p>
          <p style={{ fontSize: 12, margin: 0 }}>Crie modelos para usar como base ao montar planos alimentares para seus pacientes</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
            <button type="button" onClick={handleImportSystem} disabled={importing}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: T.text, fontFamily: 'inherit' }}>
              {importing ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Importar modelos padrão
            </button>
            <Button onClick={() => setShowForm(true)} style={{ gap: 6, fontSize: 13 }}>
              <Plus size={14} /> Criar do zero
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {templates.map(tpl => {
            const color = CATEGORY_COLORS[tpl.template_category] || '#9CA3AF'
            const label = CATEGORY_LABELS[tpl.template_category] || 'Outro'
            return (
              <div key={tpl.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, background: T.white }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{tpl.title}</span>
                    <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${color}20`, color }}>
                      {label}
                    </span>
                  </div>
                  {tpl.description && (
                    <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>{tpl.description}</div>
                  )}
                  <div style={{ fontSize: 11, color: T.muted }}>
                    {tpl.total_days} {tpl.total_days === 1 ? 'dia' : 'dias'} · atualizado {new Date(tpl.updated_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                  <button type="button" onClick={() => navigate(`/meal-plan-templates/${tpl.id}`)}
                    style={{ background: T.chip, border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: T.brand }}>
                    <ExternalLink size={12} /> Editar
                  </button>
                  <button type="button" onClick={() => handleDelete(tpl.id, tpl.title)} disabled={deleting === tpl.id}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '4px' }}>
                    {deleting === tpl.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
