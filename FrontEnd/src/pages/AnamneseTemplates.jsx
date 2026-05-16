import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileQuestion,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Sparkles,
  ClipboardList,
  UtensilsCrossed,
  HeartPulse,
  Brain,
  Activity,
  CalendarCheck,
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { toast } from 'sonner'
import { T, DISPLAY } from '@/lib/tokens'

const mkField = (label, type, required = false, options = []) => ({
  id: crypto.randomUUID(), label, type, required, options,
})

const PRE_TEMPLATES = [
  {
    key: 'nutricional',
    icon: ClipboardList,
    name: 'Anamnese Nutricional Geral',
    description: 'Primeira consulta: objetivos, peso, hábitos e histórico de dietas',
    fields: [
      mkField('Motivo da consulta / queixa principal', 'textarea', true),
      mkField('Peso atual (kg)', 'number', true),
      mkField('Altura (cm)', 'number', true),
      mkField('Objetivo principal', 'select', true, ['Emagrecimento', 'Ganho de massa muscular', 'Reeducação alimentar', 'Manutenção do peso', 'Saúde e qualidade de vida', 'Controle de doença']),
      mkField('Já fez acompanhamento nutricional antes?', 'checkbox'),
      mkField('Fez dieta por conta própria recentemente?', 'checkbox'),
      mkField('Pratica atividade física?', 'checkbox', true),
      mkField('Qual atividade e com que frequência semanal?', 'text'),
      mkField('Usa suplementos alimentares?', 'checkbox'),
      mkField('Quais suplementos?', 'text'),
      mkField('Tem intolerâncias ou alergias alimentares?', 'checkbox', true),
      mkField('Quais alimentos evita ou não tolera?', 'text'),
      mkField('Observações adicionais', 'textarea'),
    ],
  },
  {
    key: 'recordatorio',
    icon: UtensilsCrossed,
    name: 'Recordatório Alimentar 24h',
    description: 'Mapeamento detalhado do que o paciente come em um dia típico',
    fields: [
      mkField('Café da manhã (horário e o que comeu)', 'textarea', true),
      mkField('Lanche da manhã (horário e o que comeu)', 'text'),
      mkField('Almoço (horário e o que comeu)', 'textarea', true),
      mkField('Lanche da tarde (horário e o que comeu)', 'text'),
      mkField('Jantar (horário e o que comeu)', 'textarea', true),
      mkField('Ceia ou lanches noturnos', 'text'),
      mkField('Quantidade de água por dia (copos ou litros)', 'text', true),
      mkField('Consome bebidas açucaradas (suco, refrigerante)?', 'checkbox'),
      mkField('Consome bebidas alcoólicas?', 'checkbox'),
      mkField('Frequência do consumo de álcool', 'select', false, ['Raramente', '1× por semana', '2–3× por semana', 'Diariamente']),
      mkField('Come fora de casa com frequência?', 'checkbox'),
      mkField('Preferências alimentares e aversões', 'textarea'),
    ],
  },
  {
    key: 'clinico',
    icon: HeartPulse,
    name: 'Histórico Clínico & Saúde',
    description: 'Doenças, medicamentos, exames e fatores de risco relevantes para a dieta',
    fields: [
      mkField('Tem diagnóstico de alguma doença crônica?', 'checkbox', true),
      mkField('Qual(is) doença(s)?', 'text'),
      mkField('Faz uso de medicamento contínuo?', 'checkbox', true),
      mkField('Quais medicamentos e doses?', 'text'),
      mkField('Realizou exames laboratoriais recentemente?', 'checkbox'),
      mkField('Queixas digestivas', 'select', false, ['Nenhuma', 'Constipação', 'Diarreia', 'Gases / distensão', 'Refluxo / azia', 'Náuseas']),
      mkField('Histórico familiar de doenças crônicas (diabetes, hipertensão, obesidade)?', 'checkbox'),
      mkField('Quais doenças na família?', 'text'),
      mkField('Está grávida ou amamentando?', 'checkbox'),
      mkField('Quantas horas de sono por noite em média?', 'number'),
      mkField('Nível de estresse no dia a dia', 'select', false, ['Baixo', 'Moderado', 'Alto', 'Muito alto']),
    ],
  },
  {
    key: 'comportamento',
    icon: Brain,
    name: 'Comportamento Alimentar',
    description: 'Relação emocional com a comida, rotina e gatilhos de compulsão',
    fields: [
      mkField('Come por ansiedade, estresse ou emoções?', 'checkbox', true),
      mkField('Tem episódios de compulsão alimentar?', 'checkbox', true),
      mkField('Pula refeições com frequência?', 'checkbox'),
      mkField('Faz as refeições em frente à tela (TV, celular)?', 'checkbox'),
      mkField('Mastiga devagar e presta atenção ao comer?', 'checkbox'),
      mkField('Sente fome excessiva ou fora de hora?', 'checkbox'),
      mkField('Qual refeição é mais difícil de controlar?', 'select', false, ['Café da manhã', 'Almoço', 'Lanche da tarde', 'Jantar', 'Ceia / noturno']),
      mkField('Grau de motivação para mudança de hábitos', 'select', true, ['Alto — quero muito mudar', 'Médio — quero mas tenho dificuldade', 'Baixo — estou começando agora']),
      mkField('Principais barreiras para se alimentar melhor', 'textarea', true),
    ],
  },
  {
    key: 'rastreamento_metabolico',
    icon: Activity,
    name: 'Rastreamento Metabólico',
    description: 'Medidas corporais, composição e indicadores metabólicos para acompanhamento de evolução',
    fields: [
      mkField('Data da avaliação', 'date', true),
      mkField('Peso atual (kg)', 'number', true),
      mkField('Altura (cm)', 'number', true),
      mkField('Circunferência da cintura (cm)', 'number', true),
      mkField('Circunferência do quadril (cm)', 'number'),
      mkField('Circunferência abdominal (cm)', 'number'),
      mkField('% de gordura corporal', 'number'),
      mkField('Massa muscular (kg)', 'number'),
      mkField('Gordura visceral (nível)', 'number'),
      mkField('Pressão arterial', 'text'),
      mkField('Glicemia em jejum (mg/dL)', 'number'),
      mkField('Colesterol total (mg/dL)', 'number'),
      mkField('Triglicerídeos (mg/dL)', 'number'),
      mkField('Nível de energia / disposição', 'select', false, ['Ótimo', 'Bom', 'Regular', 'Ruim', 'Muito ruim']),
      mkField('Qualidade do sono', 'select', false, ['Ótimo', 'Bom', 'Regular', 'Ruim']),
      mkField('Frequência intestinal', 'select', false, ['Diariamente', '2-3× por semana', '1× por semana', 'Menos de 1× por semana']),
      mkField('Observações clínicas', 'textarea'),
    ],
  },
  {
    key: 'pre_consulta',
    icon: CalendarCheck,
    name: 'Pré-Consulta',
    description: 'Enviado ao paciente antes da consulta para otimizar o tempo e coletar dados essenciais',
    fields: [
      mkField('Qual o principal motivo da sua consulta hoje?', 'textarea', true),
      mkField('Desde quando apresenta essa queixa?', 'text', true),
      mkField('Você já fez tratamento para isso antes?', 'checkbox'),
      mkField('Qual tratamento e resultado?', 'text'),
      mkField('Seu peso mudou nos últimos 3 meses?', 'select', false, ['Sim, engordei', 'Sim, emagreci', 'Manteve-se', 'Não sei']),
      mkField('Quanto pesou na última vez que se pesou? (kg)', 'number'),
      mkField('Pratica atividade física atualmente?', 'checkbox', true),
      mkField('Está tomando algum medicamento?', 'checkbox', true),
      mkField('Quais medicamentos?', 'text'),
      mkField('Tem restrições alimentares ou alergias?', 'checkbox', true),
      mkField('Quais restrições ou alergias?', 'text'),
      mkField('Como está seu sono?', 'select', false, ['Bom', 'Regular', 'Ruim']),
      mkField('Nível de estresse atual', 'select', false, ['Baixo', 'Moderado', 'Alto', 'Muito alto']),
      mkField('O que você espera alcançar com o acompanhamento?', 'textarea', true),
    ],
  },
]

function PreTemplatesGallery({ onSelect }) {
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Sparkles size={15} style={{ color: T.brand }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#555' }}>Começar com um pré-modelo</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {PRE_TEMPLATES.map(pt => {
          const Icon = pt.icon
          return (
            <button
              key={pt.key}
              type="button"
              onClick={() => onSelect(pt)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: 8, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                border: `1.5px dashed ${T.border}`, background: '#fafafa',
                textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.brand; e.currentTarget.style.background = T.chip }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = '#fafafa' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} style={{ color: T.brand }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#222' }}>{pt.name}</p>
                <p style={{ fontSize: 11, color: '#888', margin: '3px 0 0', lineHeight: 1.4 }}>{pt.description}</p>
              </div>
              <span style={{ fontSize: 11, color: T.brand, fontWeight: 600 }}>{pt.fields.length} campos incluídos →</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const FIELD_TYPES = [
  { value: 'text',     label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'number',   label: 'Número' },
  { value: 'select',   label: 'Lista de opções' },
  { value: 'checkbox', label: 'Sim / Não' },
  { value: 'date',     label: 'Data' },
]

function newField() {
  return {
    id:       crypto.randomUUID(),
    label:    '',
    type:     'text',
    required: false,
    options:  [],
  }
}

function FieldEditor({ field, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [optionInput, setOptionInput] = useState('')

  const update = (key, value) => onChange({ ...field, [key]: value })

  const addOption = () => {
    const val = optionInput.trim()
    if (!val) return
    update('options', [...(field.options || []), val])
    setOptionInput('')
  }

  const removeOption = (i) => {
    update('options', field.options.filter((_, idx) => idx !== i))
  }

  return (
    <div style={{
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: '12px 14px',
      background: '#fff',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 2, flexShrink: 0 }}>
          <button type="button" onClick={onMoveUp} disabled={isFirst} style={{ background: 'none', border: 'none', cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.3 : 1, padding: 2 }}>
            <ChevronUp size={14} />
          </button>
          <GripVertical size={14} style={{ color: '#bbb', margin: '0 auto' }} />
          <button type="button" onClick={onMoveDown} disabled={isLast} style={{ background: 'none', border: 'none', cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.3 : 1, padding: 2 }}>
            <ChevronDown size={14} />
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <Label style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4, display: 'block' }}>Pergunta</Label>
              <input
                type="text"
                value={field.label}
                onChange={e => update('label', e.target.value)}
                placeholder="Ex: Qual sua queixa principal?"
                style={{
                  width: '100%', padding: '7px 10px', borderRadius: 7,
                  border: `1px solid ${T.border}`, fontSize: 13,
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ minWidth: 150 }}>
              <Label style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4, display: 'block' }}>Tipo</Label>
              <select
                value={field.type}
                onChange={e => update('type', e.target.value)}
                style={{
                  padding: '7px 10px', borderRadius: 7,
                  border: `1px solid ${T.border}`, fontSize: 13,
                  cursor: 'pointer', background: '#fff', fontFamily: 'inherit',
                  width: '100%',
                }}
              >
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', paddingBottom: 2 }}>
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={e => update('required', e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: T.brand }}
                />
                Obrigatório
              </label>
            </div>
          </div>

          {field.type === 'select' && (
            <div>
              <Label style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6, display: 'block' }}>Opções</Label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {(field.options || []).map((opt, i) => (
                  <span key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: T.chip, borderRadius: 20, padding: '3px 10px', fontSize: 12,
                  }}>
                    {opt}
                    <button type="button" onClick={() => removeOption(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                      <X size={10} style={{ color: '#666' }} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={optionInput}
                  onChange={e => setOptionInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  placeholder="Nova opção…"
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: 7,
                    border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit',
                  }}
                />
                <button type="button" onClick={addOption} style={{
                  padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  background: T.chip, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: 'inherit',
                  color: T.brand,
                }}>
                  + Add
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onRemove}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#D1D5DB', flexShrink: 0 }}
          title="Remover campo"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

function TemplateFormDialog({ template, onSave, onClose }) {
  const [name, setName] = useState(template?.name || '')
  const [description, setDescription] = useState(template?.description || '')
  const [fields, setFields] = useState(template?.fields?.length ? template.fields : [newField()])
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Nome do template é obrigatório'); return }
    if (fields.some(f => !f.label.trim())) { toast.error('Todos os campos precisam de uma pergunta'); return }

    setSaving(true)
    try {
      const data = { name: name.trim(), description: description.trim(), fields }
      let result
      if (template?.id) {
        result = await apiService.updateAnamneseTemplate(template.id, data)
      } else {
        result = await apiService.createAnamneseTemplate(data)
      }
      toast.success(template?.id ? 'Template atualizado!' : 'Template criado!')
      onSave(result.template)
    } catch (e) {
      toast.error(e?.message || 'Erro ao salvar template')
    } finally {
      setSaving(false)
    }
  }

  const addField = () => setFields(prev => [...prev, newField()])

  const updateField = (i, updated) => setFields(prev => prev.map((f, idx) => idx === i ? updated : f))

  const removeField = (i) => setFields(prev => prev.filter((_, idx) => idx !== i))

  const moveField = (i, dir) => {
    setFields(prev => {
      const arr = [...prev]
      const j = i + dir
      if (j < 0 || j >= arr.length) return arr
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return arr
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" style={{ color: T.brand }} />
            {template?.id ? 'Editar Template' : 'Novo Template de Anamnese'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="space-y-1">
            <Label>Nome do template</Label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Anamnese Nutricional"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: `1px solid ${T.border}`, fontSize: 14,
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />
          </div>

          <div className="space-y-1">
            <Label>Descrição <span style={{ color: '#aaa', fontWeight: 400 }}>(opcional)</span></Label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descrição breve deste formulário…"
              rows={2}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: `1px solid ${T.border}`, fontSize: 14, resize: 'vertical',
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Label>Campos ({fields.length})</Label>
              <Button type="button" size="sm" variant="outline" onClick={addField} className="gap-1.5" style={{ fontSize: 12 }}>
                <Plus className="h-3.5 w-3.5" /> Adicionar campo
              </Button>
            </div>

            {fields.map((field, i) => (
              <FieldEditor
                key={field.id}
                field={field}
                onChange={(updated) => updateField(i, updated)}
                onRemove={() => removeField(i)}
                onMoveUp={() => moveField(i, -1)}
                onMoveDown={() => moveField(i, 1)}
                isFirst={i === 0}
                isLast={i === fields.length - 1}
              />
            ))}

            {fields.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: '#aaa', fontSize: 13 }}>
                Nenhum campo. Clique em "Adicionar campo" para começar.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} style={{ background: T.brand, color: '#fff' }} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AnamneseTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [showPreGallery, setShowPreGallery] = useState(false)

  const handleSelectPreTemplate = (pt) => {
    setEditingTemplate({
      name: pt.name,
      description: pt.description,
      fields: pt.fields.map(f => ({ ...f, id: crypto.randomUUID() })),
    })
    setShowForm(true)
    setShowPreGallery(false)
  }

  useEffect(() => {
    apiService.getAnamneseTemplates()
      .then(res => {
        const list = res.templates || []
        setTemplates(list)
        if (list.length === 0) setShowPreGallery(true)
      })
      .catch(() => toast.error('Erro ao carregar templates'))
      .finally(() => setLoading(false))
  }, [])

  const handleSaved = (template) => {
    setTemplates(prev => {
      const exists = prev.find(t => t.id === template.id)
      return exists ? prev.map(t => t.id === template.id ? template : t) : [template, ...prev]
    })
    setShowForm(false)
    setEditingTemplate(null)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Arquivar este template? Ele não aparecerá mais na lista.')) return
    setDeleting(id)
    try {
      await apiService.deleteAnamneseTemplate(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
      toast.success('Template arquivado')
    } catch {
      toast.error('Erro ao arquivar template')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-3 max-w-4xl mx-auto pb-20">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1" style={DISPLAY}>Anamnese</h1>
          <p className="text-muted-foreground text-sm">Templates de questionários para uso nas consultas</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="outline"
            onClick={() => setShowPreGallery(v => !v)}
            className="gap-2"
            style={{ fontSize: 13 }}
          >
            <Sparkles className="h-4 w-4" style={{ color: T.brand }} />
            Pré-modelos
          </Button>
          <Button onClick={() => { setEditingTemplate(null); setShowForm(true) }} style={{ background: T.brand, color: '#fff' }} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Template
          </Button>
        </div>
      </div>

      {showPreGallery && (
        <Card>
          <CardContent style={{ padding: '20px 24px' }}>
            <PreTemplatesGallery onSelect={handleSelectPreTemplate} />
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="py-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: T.brand }} />
          </CardContent>
        </Card>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent style={{ padding: '32px 28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileQuestion className="h-7 w-7" style={{ color: T.brand }} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Nenhum template criado ainda</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Crie do zero ou use um pré-modelo pronto com o botão acima
                </p>
              </div>
              <Button onClick={() => { setEditingTemplate(null); setShowForm(true) }} style={{ background: T.brand, color: '#fff' }} className="gap-2">
                <Plus className="h-4 w-4" /> Criar do zero
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {templates.map(tpl => (
            <Card key={tpl.id}>
              <CardContent style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileQuestion className="h-5 w-5" style={{ color: T.brand }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{tpl.name}</p>
                  {tpl.description && <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>{tpl.description}</p>}
                  <p style={{ fontSize: 12, color: '#aaa', margin: '2px 0 0' }}>{tpl.fields?.length || 0} campo{tpl.fields?.length !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => { setEditingTemplate(tpl); setShowForm(true) }}
                    className="gap-1.5 h-8"
                    style={{ fontSize: 12 }}
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleDelete(tpl.id)}
                    disabled={deleting === tpl.id}
                    className="gap-1.5 h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    style={{ fontSize: 12 }}
                  >
                    {deleting === tpl.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Arquivar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <TemplateFormDialog
          template={editingTemplate}
          onSave={handleSaved}
          onClose={() => { setShowForm(false); setEditingTemplate(null) }}
        />
      )}
    </div>
  )
}
