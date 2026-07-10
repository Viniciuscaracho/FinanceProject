import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, FileText, Target, ClipboardList, Calendar, TrendingUp, Copy, ExternalLink, Plus, Trash2, Loader2, Save, ChevronDown, ChevronUp, Link2, UtensilsCrossed, Paperclip, Upload, Download, Eye, AlertCircle, CheckCircle2, MessageCircle, History, Brain, Search, Mic, MicOff, Moon, Dumbbell, StickyNote, ArrowRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { apiService } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { T } from '@/lib/tokens'
import { DocumentEditor } from '@/components/DocumentEditor'

const DOCUMENT_TYPE_LABELS = {
  prescricao_dietetica:    'Prescrição Dietética',
  plano_alimentar:         'Plano Alimentar',
  diagnostico_nutricional: 'Diagnóstico Nutricional',
  evolucao_nutricional:    'Evolução Nutricional',
  orientacao_alimentar:    'Orientação Alimentar',
  laudo_nutricional:       'Laudo Nutricional',
  atestado_consulta:       'Atestado de Consulta',
  recordatorio_24h:        'Recordatório 24h',
  orientacao_nutricional:  'Orientação Nutricional',
  outro:                   'Outro',
}

const GOAL_STATUS_COLORS = { active: '#10B981', completed: '#4C60AA', abandoned: '#9CA3AF' }
const GOAL_STATUS_LABELS = { active: 'Ativa', completed: 'Concluída', abandoned: 'Abandonada' }
const APT_STATUS_LABELS  = { scheduled: 'Agendado', completed: 'Concluído', cancelled: 'Cancelado', no_show: 'Faltou' }
const APT_STATUS_COLORS  = { scheduled: '#3B82F6', completed: '#10B981', cancelled: '#EF4444', no_show: '#F59E0B' }
const CONTACT_TYPE_LABELS = { customer: 'Cliente', employee: 'Colaborador', supplier: 'Fornecedor', partner: 'Sócio', associate: 'Associado' }

// ── helpers para anexos ────────────────────────────────────────────────────────

function getFileExt(filename = '') {
  return filename.split('.').pop()?.toUpperCase().slice(0, 4) || 'FILE'
}
function getExtColor(ext = '') {
  const map = { PDF: '#EF4444', PNG: '#8B5CF6', JPG: '#8B5CF6', JPEG: '#8B5CF6', DOC: '#3B82F6', DOCX: '#3B82F6' }
  return map[ext] || '#6B7280'
}
function isPreviewable(att) {
  const type = (att.content_type || '').toLowerCase()
  return type.startsWith('image/') || type === 'application/pdf'
}
function formatBytes(bytes) {
  if (!bytes) return ''
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

// ── AppointmentNoteCard ────────────────────────────────────────────────────────

function AppointmentNoteCard({ apt }) {
  const [open, setOpen]           = useState(false)
  const [loaded, setLoaded]       = useState(false)
  const [notes, setNotes]         = useState('')
  const [currentNote, setCurrentNote] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [unsaved, setUnsaved]     = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [attachments, setAttachments]     = useState([])
  const [uploading, setUploading]         = useState(false)
  const [previewUrl, setPreviewUrl]       = useState(null)
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    if (loaded) return
    setLoading(true)
    try {
      const [notesRes, attRes] = await Promise.all([
        apiService.getAppointmentNotes(apt.id).catch(() => null),
        apiService.getAppointmentAttachments(apt.id).catch(() => null),
      ])
      const note = notesRes?.notes?.[0] ?? null
      setCurrentNote(note)
      setNotes(note?.notes ?? '')
      setLastSaved(note?.updated_at ?? null)
      setAttachments(attRes?.attachments ?? [])
      setLoaded(true)
    } finally { setLoading(false) }
  }, [apt.id, loaded])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next) load()
  }

  const handleSave = async () => {
    const plain = notes.replace(/<[^>]*>/g, '').trim()
    if (plain.length < 1) { toast.error('Anotação vazia'); return }
    setSaving(true)
    try {
      if (currentNote) {
        await apiService.updateAppointmentNote(apt.id, currentNote.id, { notes })
      } else {
        const res = await apiService.createAppointmentNote(apt.id, { notes })
        if (res.note) setCurrentNote(res.note)
      }
      setUnsaved(false)
      setLastSaved(new Date().toISOString())
      toast.success('Anotação salva!')
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(false) }
  }

  const handleUpload = async (e) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      const res = await apiService.uploadAppointmentAttachments(apt.id, files)
      setAttachments(res.attachments || [])
      toast.success('Anexo adicionado!')
    } catch { toast.error('Erro ao enviar arquivo') }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const handleDeleteAttachment = async (attId) => {
    if (!window.confirm('Remover este anexo?')) return
    try {
      await apiService.deleteAppointmentAttachment(apt.id, attId)
      setAttachments(prev => prev.filter(a => a.id !== attId))
      toast.success('Anexo removido')
    } catch { toast.error('Erro ao remover') }
  }

  const statusColor = APT_STATUS_COLORS[apt.status] || '#9CA3AF'
  const statusLabel = APT_STATUS_LABELS[apt.status] || apt.status
  const dateStr = apt.start_time
    ? new Date(apt.start_time).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : '—'

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Cabeçalho */}
      <button type="button" onClick={handleToggle}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: open ? T.chip : 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{apt.service?.name || 'Consulta'}</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
            {dateStr}
            {apt.professional?.name ? ` · ${apt.professional.name}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {currentNote && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: '#10B98120', color: '#10B981' }}>
              ✓ Anotação
            </span>
          )}
          {attachments.length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: T.chip, color: T.brand }}>
              {attachments.length} anexo{attachments.length > 1 ? 's' : ''}
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: statusColor + '20', color: statusColor }}>
            {statusLabel}
          </span>
          {open ? <ChevronUp size={14} style={{ color: T.muted }} /> : <ChevronDown size={14} style={{ color: T.muted }} />}
        </div>
      </button>

      {/* Corpo expansível */}
      {open && (
        <div style={{ borderTop: `1px solid ${T.border}`, background: T.white }}>
          {loading ? (
            <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={20} className="animate-spin" style={{ color: T.brand }} />
            </div>
          ) : (
            <>
              {/* Editor de notas */}
              <div style={{ padding: '0 0 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 6px', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={13} style={{ color: T.brand }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Anotações</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {saving && <span style={{ fontSize: 11, color: T.muted, display: 'flex', alignItems: 'center', gap: 4 }}><Loader2 size={11} className="animate-spin" /> Salvando…</span>}
                    {!saving && unsaved && <span style={{ fontSize: 11, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} /> Não salvo</span>}
                    {!saving && !unsaved && lastSaved && <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={11} /> Salvo</span>}
                    <Button size="sm" onClick={handleSave} disabled={saving || !unsaved}
                      style={{ fontSize: 11, height: 28, gap: 4, opacity: !unsaved ? 0.5 : 1 }}>
                      <Save size={11} /> Salvar
                    </Button>
                  </div>
                </div>
                <div style={{ minHeight: 120 }}>
                  <DocumentEditor
                    key={apt.id}
                    content={notes}
                    onChange={(val) => { setNotes(val); setUnsaved(true) }}
                    placeholder="Evolução, orientações, observações clínicas…"
                    className="border-0 rounded-none shadow-none"
                  />
                </div>
              </div>

              {/* Anexos */}
              <div style={{ borderTop: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Paperclip size={13} style={{ color: T.brand }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
                      Anexos {attachments.length > 0 && `(${attachments.length})`}
                    </span>
                  </div>
                  <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
                  <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}
                    style={{ fontSize: 11, height: 28, gap: 4, color: T.brand }}>
                    {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                    {uploading ? 'Enviando…' : 'Adicionar'}
                  </Button>
                </div>

                {attachments.length === 0 ? (
                  <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', padding: '12px 16px 16px' }}>Nenhum arquivo anexado</p>
                ) : (
                  <div style={{ borderTop: `1px solid ${T.border}` }}>
                    {attachments.map(att => {
                      const ext = getFileExt(att.filename)
                      return (
                        <div key={att.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: `1px solid #F9FAFB` }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: getExtColor(ext) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: getExtColor(ext) }}>{ext}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.filename}</div>
                            <div style={{ fontSize: 10, color: T.muted }}>{formatBytes(att.byte_size)}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                            {att.url && isPreviewable(att) && (
                              <button type="button" onClick={() => setPreviewUrl(att.url)} title="Visualizar"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 6, borderRadius: 6 }}>
                                <Eye size={14} />
                              </button>
                            )}
                            {att.url && (
                              <button type="button" onClick={() => window.open(att.url, '_blank')} title="Baixar"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 6, borderRadius: 6 }}>
                                <Download size={14} />
                              </button>
                            )}
                            <button type="button" onClick={() => handleDeleteAttachment(att.id)} title="Remover"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 6, borderRadius: 6 }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Preview de arquivo */}
      {previewUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setPreviewUrl(null)}>
          <div className="dm-modal-box" style={{ background: T.white, borderRadius: 12, overflow: 'hidden', maxWidth: 800, width: '100%', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 8, borderBottom: `1px solid ${T.border}` }}>
              <button type="button" onClick={() => setPreviewUrl(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4 }}>✕</button>
            </div>
            <iframe src={previewUrl} style={{ width: '100%', height: '80vh', border: 'none' }} title="preview" />
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ icon: Icon, title, count, children, defaultOpen = true, collapsible = true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div
        onClick={() => collapsible && setOpen(p => !p)}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={collapsible ? (e => (e.key === 'Enter' || e.key === ' ') && setOpen(p => !p)) : undefined}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: collapsible ? 'pointer' : 'default' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={16} style={{ color: T.brand }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{title}</span>
          {count != null && count > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: T.chip, color: T.brand }}>{count}</span>
          )}
        </div>
        {collapsible && (open ? <ChevronUp size={16} style={{ color: '#9CA3AF' }} /> : <ChevronDown size={16} style={{ color: '#9CA3AF' }} />)}
      </div>
      {(collapsible ? open : true) && <div style={{ padding: '0 18px 18px' }}>{children}</div>}
    </div>
  )
}

function GoalCard({ goal, contactId, onUpdate, onDelete }) {

  const [showProgress, setShowProgress] = useState(false)
  const [showHistory, setShowHistory]   = useState(false)
  const [value, setValue]   = useState('')
  const [note,  setNote]    = useState('')
  const [date,  setDate]    = useState('')
  const [saving, setSaving] = useState(false)

  const color  = GOAL_STATUS_COLORS[goal.status] || '#9CA3AF'
  const isActive = goal.status === 'active'
  const pct = (goal.current_value != null && goal.target_value != null && goal.target_value > 0)
    ? Math.min(100, Math.round((parseFloat(goal.current_value) / parseFloat(goal.target_value)) * 100))
    : null
  const history = goal.progress_history || []
  const chartData = history.length >= 2
    ? history.map(e => ({ date: e.date ? e.date.slice(5) : '', value: e.value }))
    : null

  const handleProgress = async () => {
    if (!value) return
    setSaving(true)
    try {
      const res = await apiService.addPatientGoalProgress(contactId, goal.id, parseFloat(value), note || null, date || null)
      onUpdate(res.goal)
      setShowProgress(false); setValue(''); setNote(''); setDate('')
      toast.success('Progresso registrado!')
    } catch { toast.error('Erro ao registrar progresso') }
    finally { setSaving(false) }
  }

  const handleStatus = async (status) => {
    try {
      const res = await apiService.updatePatientGoal(contactId, goal.id, { status })
      onUpdate(res.goal)
      toast.success(status === 'completed' ? 'Meta concluída!' : 'Meta reativada')
    } catch { toast.error('Erro ao atualizar status') }
  }

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{goal.title}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 20, background: color + '20', color }}>{GOAL_STATUS_LABELS[goal.status] || goal.status}</span>
          </div>
          {(goal.current_value != null || goal.target_value != null) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, fontSize: 12, color: T.muted }}>
              <TrendingUp size={11} style={{ color: T.brand }} />
              <span>
                {goal.current_value != null ? `Atual: ${goal.current_value}` : ''}
                {goal.current_value != null && goal.target_value != null ? ' → ' : ''}
                {goal.target_value != null ? `Meta: ${goal.target_value}` : ''}
                {goal.unit ? ` ${goal.unit}` : ''}
              </span>
              {pct != null && <span style={{ fontWeight: 700, color: T.brand }}>{pct}%</span>}
            </div>
          )}
          {pct != null && (
            <div style={{ marginTop: 6, height: 5, borderRadius: 99, background: T.border, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s' }} />
            </div>
          )}
          {goal.deadline && (
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Prazo: {new Date(goal.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
          )}
        </div>
        <button type="button" onClick={() => onDelete(goal.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 4, flexShrink: 0 }}>
          <Trash2 size={13} />
        </button>
      </div>

      {chartData && (
        <div style={{ marginTop: 10, height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E7EB', padding: '4px 8px' }}
                formatter={(val) => [`${val}${goal.unit ? ` ${goal.unit}` : ''}`, '']}
                labelStyle={{ color: '#9CA3AF', fontSize: 10 }}
              />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {isActive && (
          <button type="button" onClick={() => { setShowProgress(p => !p); setValue(''); setNote(''); setDate('') }}
            style={{ fontSize: 11, fontWeight: 600, color: T.brand, background: T.chip, border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Registrar
          </button>
        )}
        {history.length > 0 && (
          <button type="button" onClick={() => setShowHistory(p => !p)}
            style={{ fontSize: 11, fontWeight: 600, color: T.muted, background: T.light, border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {showHistory ? '▲' : '▼'} Histórico ({history.length})
          </button>
        )}
        {isActive && (
          <button type="button" onClick={() => handleStatus('completed')}
            style={{ fontSize: 11, fontWeight: 600, color: T.brand, background: T.chip, border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ✓ Concluir
          </button>
        )}
        {!isActive && (
          <button type="button" onClick={() => handleStatus('active')}
            style={{ fontSize: 11, fontWeight: 600, color: '#10B981', background: '#10B98120', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ↺ Reativar
          </button>
        )}
      </div>

      {showProgress && (
        <div style={{ marginTop: 10, padding: '10px 12px', background: T.light, borderRadius: 8, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
            <input type="number" step="any" value={value} onChange={e => setValue(e.target.value)}
              placeholder={`Valor${goal.unit ? ` (${goal.unit})` : ''}`}
              style={{ padding: '6px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit' }} />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit' }} />
          </div>
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="Observação (opcional)"
            style={{ width: '100%', padding: '6px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 6 }} />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <Button size="sm" variant="ghost" onClick={() => setShowProgress(false)} style={{ fontSize: 11 }}>Cancelar</Button>
            <Button size="sm" onClick={handleProgress} disabled={!value || saving} style={{ background: T.brand, color: '#fff', fontSize: 11 }}>
              {saving ? <Loader2 size={12} className="animate-spin" /> : 'OK'}
            </Button>
          </div>
        </div>
      )}

      {showHistory && history.length > 0 && (
        <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          {[...history].reverse().map((entry, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.text, padding: '3px 0', borderBottom: i < history.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <div>
                <span style={{ fontWeight: 700 }}>{entry.value}{goal.unit ? ` ${goal.unit}` : ''}</span>
                {entry.note && <span style={{ color: T.muted, marginLeft: 6 }}>{entry.note}</span>}
              </div>
              <span style={{ color: T.muted, fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
                {entry.date ? new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const BLANK_GOAL = { title: '', unit: '', target_value: '', current_value: '', deadline: '', notes: '' }

export function PatientProfile() {
  const { id } = useParams()
  const navigate = useNavigate()


  const [loading, setLoading] = useState(true)
  const [contact, setContact]         = useState(null)
  const [goals, setGoals]             = useState([])
  const [docs, setDocs]               = useState([])
  const [anamneses, setAnamneses]     = useState([])
  const [mealPlans, setMealPlans]     = useState([])
  const [patientNotes, setPatientNotes] = useState([])
  const [expandedAnamneseId, setExpandedAnamneseId] = useState(null)

  // Template picker
  const [showTemplatePicker, setShowTemplatePicker]   = useState(false)
  const [pickerTemplates, setPickerTemplates]         = useState([])
  const [pickerLoading, setPickerLoading]             = useState(false)
  const [selectedTemplate, setSelectedTemplate]       = useState(null)
  const [pickerTitle, setPickerTitle]                 = useState('')
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false)

  // Metas
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [newGoal, setNewGoal]         = useState(BLANK_GOAL)
  const [savingGoal, setSavingGoal]   = useState(false)

  // Anamnese — criação
  const [anamneseTemplates, setAnamneseTemplates] = useState([])
  const [showCreateAnamnese, setShowCreateAnamnese] = useState(false)
  const [createTemplateId, setCreateTemplateId]   = useState('')
  const [createAnswers, setCreateAnswers]         = useState({})
  const [savingAnamnese, setSavingAnamnese]       = useState(false)

  // Notas clínicas (evoluções)
  const [showNewNote, setShowNewNote]   = useState(false)
  const [noteContent, setNoteContent]   = useState('')
  const [savingNote, setSavingNote]     = useState(false)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingContent, setEditingContent] = useState('')
  const [savingEditNote, setSavingEditNote] = useState(false)

  // Documentos — criação
  const [docTemplates, setDocTemplates]   = useState([])
  const [showNewDocDialog, setShowNewDocDialog] = useState(false)
  const [newDoc, setNewDoc]               = useState({ title: '', document_type: 'plano_alimentar', content: '' })
  const [savingDoc, setSavingDoc]         = useState(false)

  // Coaching
  const [timelineEvents, setTimelineEvents]     = useState([])
  const [coachingInput, setCoachingInput]       = useState('')
  const [savingCoaching, setSavingCoaching]     = useState(false)
  const [coachingSearch, setCoachingSearch]     = useState('')
  const [feedbackDraft, setFeedbackDraft]       = useState(null)
  const [loadingDraft, setLoadingDraft]         = useState(false)
  const [isRecording, setIsRecording]           = useState(false)
  const [isTranscribing, setIsTranscribing]     = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef   = useRef([])
  const [coachingProfile, setCoachingProfile]   = useState(null)
  const [editingProfile, setEditingProfile]     = useState(false)
  const [profileForm, setProfileForm]           = useState({ goal: '', limitations: '', next_reassessment_at: '' })
  const [savingProfile, setSavingProfile]       = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [contactRes, goalsRes, docsRes, anamneseRes, plansRes, templatesRes, notesRes, docTplsRes, timelineRes, profileRes] = await Promise.all([
        apiService.getContact(id),
        apiService.getPatientGoals(id).catch(() => ({ goals: [] })),
        apiService.getPatientDocuments(id).catch(() => ({ documents: [] })),
        apiService.getContactAnamneseResponses(id).catch(() => ({ responses: [] })),
        apiService.getMealPlans(id).catch(() => ({ meal_plans: [] })),
        apiService.getAnamneseTemplates().catch(() => ({ templates: [] })),
        apiService.getPatientNotes(id).catch(() => ({ notes: [] })),
        apiService.getProfessionalDocumentTemplates(1, 50).catch(() => ({ templates: [] })),
        apiService.getTimelineEvents(id).catch(() => ({ events: [] })),
        apiService.getCoachingProfile(id).catch(() => ({ profile: null })),
      ])
      setContact(contactRes.contact || contactRes)
      setGoals(goalsRes.goals || [])
      setDocs(docsRes.documents || [])
      setAnamneses(anamneseRes.responses || [])
      setMealPlans(plansRes.meal_plans || [])
      setAnamneseTemplates(templatesRes.templates || [])
      setPatientNotes(notesRes.notes || [])
      setDocTemplates(docTplsRes.templates || [])
      setTimelineEvents(timelineRes.events || [])
      const p = profileRes.profile || null
      setCoachingProfile(p)
      setProfileForm({ goal: p?.goal || '', limitations: p?.limitations || '', next_reassessment_at: p?.next_reassessment_at?.slice(0,10) || '' })
    } catch (e) {
      toast.error('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }, [id])

  const handleSaveAnamnese = async () => {
    setSavingAnamnese(true)
    try {
      const res = await apiService.createContactAnamneseResponse(id, {
        anamnese_template_id: createTemplateId || null,
        responses: createAnswers,
      })
      setAnamneses(prev => [res.response, ...prev])
      setShowCreateAnamnese(false)
      setCreateTemplateId('')
      setCreateAnswers({})
      toast.success('Anamnese salva!')
    } catch (e) {
      toast.error(e?.message || 'Erro ao salvar anamnese')
    } finally {
      setSavingAnamnese(false)
    }
  }

  const handleSaveNote = async () => {
    const plain = noteContent.replace(/<[^>]*>/g, '').trim()
    if (!plain) return
    setSavingNote(true)
    try {
      const res = await apiService.createPatientNote(id, noteContent)
      setPatientNotes(prev => [res.note, ...prev])
      setNoteContent('')
      setShowNewNote(false)
      toast.success('Anotação salva!')
    } catch { toast.error('Erro ao salvar anotação') }
    finally { setSavingNote(false) }
  }

  const handleUpdateNote = async (noteId) => {
    const plain = editingContent.replace(/<[^>]*>/g, '').trim()
    if (!plain) return
    setSavingEditNote(true)
    try {
      const res = await apiService.updatePatientNote(id, noteId, editingContent)
      setPatientNotes(prev => prev.map(n => n.id === noteId ? res.note : n))
      setEditingNoteId(null)
      setEditingContent('')
      toast.success('Anotação atualizada!')
    } catch { toast.error('Erro ao atualizar') }
    finally { setSavingEditNote(false) }
  }

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Remover esta anotação?')) return
    try {
      await apiService.deletePatientNote(id, noteId)
      setPatientNotes(prev => prev.filter(n => n.id !== noteId))
      toast.success('Anotação removida')
    } catch { toast.error('Erro ao remover') }
  }

  useEffect(() => { load() }, [load])

  const handleSaveGoal = async () => {
    if (!newGoal.title.trim()) return
    setSavingGoal(true)
    try {
      const res = await apiService.createPatientGoal(id, newGoal)
      setGoals(prev => [res.goal, ...prev])
      setNewGoal(BLANK_GOAL)
      setShowNewGoal(false)
      toast.success('Meta adicionada!')
    } catch { toast.error('Erro ao salvar meta') }
    finally { setSavingGoal(false) }
  }

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Remover esta meta?')) return
    try {
      await apiService.deletePatientGoal(id, goalId)
      setGoals(prev => prev.filter(g => g.id !== goalId))
      toast.success('Meta removida')
    } catch { toast.error('Erro ao remover meta') }
  }

  const handleToggleDocShared = async (doc) => {
    try {
      const res = await apiService.togglePatientDocumentShared(id, doc.id)
      setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, shared: res.document?.shared ?? !d.shared } : d))
    } catch { toast.error('Erro ao alterar compartilhamento') }
  }

  const handleCopyDocLink = (doc) => {
    const url = `${import.meta.env.VITE_PUBLIC_URL || window.location.origin}/d/${doc.public_token}`
    navigator.clipboard.writeText(url).then(() => toast.success('Link copiado!'))
  }

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Remover este documento?')) return
    try {
      await apiService.deletePatientDocument(id, docId)
      setDocs(prev => prev.filter(d => d.id !== docId))
      toast.success('Documento removido')
    } catch { toast.error('Erro ao remover documento') }
  }

  const handleNewDocTemplateChange = (templateId) => {
    const tpl = docTemplates.find(t => String(t.id) === templateId)
    setNewDoc(prev => ({ ...prev, content: tpl?.content || '' }))
  }

  const handleCreateDoc = async () => {
    if (!newDoc.title.trim()) return
    setSavingDoc(true)
    try {
      const res = await apiService.createPatientDocument(id, newDoc)
      setDocs(prev => [res.document, ...prev])
      setShowNewDocDialog(false)
      setNewDoc({ title: '', document_type: 'plano_alimentar', content: '' })
      toast.success('Documento criado!')
    } catch (e) {
      toast.error(e?.message || 'Erro ao criar documento')
    } finally {
      setSavingDoc(false)
    }
  }

  // Coaching handlers
  const handleSaveCoachingProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await apiService.updateCoachingProfile(id, profileForm)
      setCoachingProfile(res.profile)
      setEditingProfile(false)
      toast.success('Perfil de coaching salvo')
    } catch {
      toast.error('Erro ao salvar perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleCreateTimelineEvent = async () => {
    if (!coachingInput.trim()) return
    setSavingCoaching(true)
    try {
      const res = await apiService.createTimelineEvent(id, coachingInput.trim())
      setTimelineEvents(prev => [res.event, ...prev])
      setCoachingInput('')
      toast.success('Registro salvo e estruturado pela IA')
    } catch {
      toast.error('Erro ao salvar registro')
    } finally {
      setSavingCoaching(false)
    }
  }

  const handleFeedbackDraft = async () => {
    setLoadingDraft(true)
    setFeedbackDraft(null)
    try {
      const res = await apiService.createFeedbackDraft(id)
      setFeedbackDraft(res.draft)
    } catch {
      toast.error('Erro ao gerar rascunho')
    } finally {
      setLoadingDraft(false)
    }
  }

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setIsRecording(false)

        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        if (blob.size === 0) return

        setIsTranscribing(true)
        try {
          const res = await apiService.uploadAudioNote(id, blob)
          setTimelineEvents(prev => [res.event, ...prev])
          toast.success('Áudio transcrito e salvo')
        } catch {
          toast.error('Erro ao transcrever áudio')
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch {
      toast.error('Acesso ao microfone negado')
    }
  }

  const filteredEvents = coachingSearch.trim()
    ? timelineEvents.filter(e =>
        (e.raw_input || '').toLowerCase().includes(coachingSearch.toLowerCase()) ||
        (e.observacao || '').toLowerCase().includes(coachingSearch.toLowerCase())
      )
    : timelineEvents

  const handleOpenTemplatePicker = async () => {
    setShowTemplatePicker(true)
    setSelectedTemplate(null)
    setPickerTitle('')
    setPickerLoading(true)
    try {
      const res = await apiService.getMealPlanTemplates()
      setPickerTemplates(res.templates || [])
    } catch { toast.error('Erro ao carregar modelos') }
    finally { setPickerLoading(false) }
  }

  const handleCreateMealPlan = async () => {
    setCreatingFromTemplate(true)
    try {
      let res
      if (selectedTemplate) {
        const title = pickerTitle.trim() || selectedTemplate.title
        res = await apiService.createMealPlanFromTemplate(id, selectedTemplate.id, title)
      } else {
        const title = pickerTitle.trim() || 'Novo Plano Alimentar'
        res = await apiService.createMealPlan(id, { title })
      }
      setShowTemplatePicker(false)
      navigate(`/contacts/${id}/meal-plans/${res.meal_plan.id}`)
    } catch { toast.error('Erro ao criar plano alimentar') }
    finally { setCreatingFromTemplate(false) }
  }

  const handleDeleteMealPlan = async (planId) => {
    if (!window.confirm('Remover este plano alimentar?')) return
    try {
      await apiService.deleteMealPlan(id, planId)
      setMealPlans(prev => prev.filter(p => p.id !== planId))
      toast.success('Plano removido')
    } catch { toast.error('Erro ao remover plano') }
  }

  const handleCopyMealPlanLink = (plan) => {
    const url = `${import.meta.env.VITE_PUBLIC_URL || window.location.origin}/plano/${plan.public_token}`
    navigator.clipboard.writeText(url).then(() => toast.success('Link copiado!'))
  }

  const contactName = contact?.name || contact?.first_name || '...'
  const contactType = contact?.contact_type || 'customer'

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: T.brand }} />
      </div>
    )
  }

  if (!contact) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: T.muted }}>Paciente não encontrado.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/contacts')} style={{ marginTop: 16 }}>Voltar</Button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
      {/* Back */}
      <button type="button" onClick={() => navigate('/contacts')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 13, fontFamily: 'inherit', marginBottom: 20 }}>
        <ArrowLeft size={15} /> Pacientes
      </button>

      {/* Patient header */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: T.chip, color: T.brand, fontWeight: 800, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {(contactName[0] || '?').toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 20, color: T.text, margin: 0 }}>{contactName}</h1>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: T.chip, color: T.brand, display: 'inline-block', marginTop: 4 }}>
                {CONTACT_TYPE_LABELS[contactType] || 'Contato'}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/contacts')} style={{ fontSize: 12 }}>
            Editar
          </Button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16, fontSize: 13, color: T.muted }}>
          {(contact.email) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={13} /> {contact.email}
            </div>
          )}
          {(contact.phone || contact.phone_number) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={13} /> {contact.phone || contact.phone_number}
            </div>
          )}
          {patientNotes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={13} /> {patientNotes.length} evolução{patientNotes.length !== 1 ? 'ões' : ''}
            </div>
          )}
        </div>

        {(contact.notes || contact.description) && (
          <p style={{ marginTop: 12, fontSize: 13, color: T.muted, lineHeight: 1.5, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
            {contact.notes || contact.description}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 1 ── METAS */}
        <Section icon={Target} title="Metas" count={goals.filter(g => g.status === 'active').length}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {goals.length === 0 && !showNewGoal && (
              <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '16px 0' }}>Nenhuma meta cadastrada</p>
            )}
            {goals.map(goal => (
              <GoalCard key={goal.id} goal={goal} contactId={id}
                onUpdate={updated => setGoals(prev => prev.map(g => g.id === updated.id ? updated : g))}
                onDelete={handleDeleteGoal} />
            ))}
            {showNewGoal ? (
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px', background: T.light }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 3 }}>Título *</label>
                    <input type="text" value={newGoal.title} onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))}
                      placeholder="Ex: Emagrecer 5kg"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 3 }}>Valor atual</label>
                    <input type="number" step="any" value={newGoal.current_value} onChange={e => setNewGoal(p => ({ ...p, current_value: e.target.value }))}
                      placeholder="72" style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 3 }}>Meta</label>
                    <input type="number" step="any" value={newGoal.target_value} onChange={e => setNewGoal(p => ({ ...p, target_value: e.target.value }))}
                      placeholder="65" style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 3 }}>Unidade</label>
                    <input type="text" value={newGoal.unit} onChange={e => setNewGoal(p => ({ ...p, unit: e.target.value }))}
                      placeholder="kg, mg/dL…" style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 3 }}>Prazo</label>
                    <input type="date" value={newGoal.deadline} onChange={e => setNewGoal(p => ({ ...p, deadline: e.target.value }))}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewGoal(false)} disabled={savingGoal} style={{ fontSize: 12 }}>Cancelar</Button>
                  <Button size="sm" onClick={handleSaveGoal} disabled={savingGoal || !newGoal.title.trim()} style={{ background: T.brand, color: '#fff', fontSize: 12 }}>
                    {savingGoal ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setShowNewGoal(true)} style={{ fontSize: 12, gap: 6 }}>
                <Plus size={13} /> Nova meta
              </Button>
            )}
          </div>
        </Section>

        {/* 2 ── PLANO ALIMENTAR */}
        <Section icon={UtensilsCrossed} title="Planos Alimentares" count={mealPlans.length} collapsible={false}>
          {mealPlans.length === 0 ? (
            <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '16px 0' }}>Nenhum plano alimentar criado</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {mealPlans.map(plan => (
                <div key={plan.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.title}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2, display: 'flex', gap: 6 }}>
                      <span style={{ padding: '1px 6px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: plan.status === 'active' ? '#10B98120' : T.light, color: plan.status === 'active' ? '#10B981' : T.muted }}>
                        {plan.status === 'active' ? 'Ativo' : plan.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                      </span>
                      <span>{plan.total_days} {plan.total_days === 1 ? 'dia' : 'dias'} · atualizado {new Date(plan.updated_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                    {plan.status === 'active' && (
                      <button type="button" onClick={() => handleCopyMealPlanLink(plan)} title="Copiar link do paciente"
                        style={{ background: T.chip, border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: T.brand }}>
                        <Copy size={12} /> Link
                      </button>
                    )}
                    <button type="button" onClick={() => navigate(`/contacts/${id}/meal-plans/${plan.id}`)} title="Editar plano"
                      style={{ background: T.chip, border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: T.brand }}>
                      <ExternalLink size={12} /> Abrir
                    </button>
                    <button type="button" onClick={() => handleDeleteMealPlan(plan.id)} title="Remover"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '4px' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button size="sm" variant="outline" onClick={handleOpenTemplatePicker} style={{ fontSize: 12, gap: 6 }}>
            <Plus size={13} /> Novo plano alimentar
          </Button>

          {/* Modal de seleção de modelo */}
          {showTemplatePicker && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
              onClick={e => { if (e.target === e.currentTarget) setShowTemplatePicker(false) }}>
              <div style={{ background: T.white, borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Novo Plano Alimentar</h3>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Escolha um modelo ou comece do zero</p>
                    </div>
                    <button type="button" onClick={() => setShowTemplatePicker(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4 }}>✕</button>
                  </div>
                </div>

                {/* Lista de templates */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
                  {pickerLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                      <Loader2 size={20} className="animate-spin" style={{ color: T.brand }} />
                    </div>
                  ) : (
                    <>
                      {/* Plano em branco */}
                      <button type="button" onClick={() => setSelectedTemplate(null)}
                        style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 10, border: `2px solid ${selectedTemplate === null ? T.brand : T.border}`, background: selectedTemplate === null ? T.chip : T.white, cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>📄</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>Plano em branco</div>
                            <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>Comece do zero e monte o plano do jeito que quiser</div>
                          </div>
                          {selectedTemplate === null && <span style={{ marginLeft: 'auto', color: T.brand, fontWeight: 700, fontSize: 12 }}>✓</span>}
                        </div>
                      </button>

                      {pickerTemplates.length > 0 && (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, margin: '12px 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Modelos disponíveis</div>
                          {pickerTemplates.map(tpl => {
                            const catColors = { low_carb: '#F59E0B', hipertrofia: '#4C60AA', mediterraneo: '#10B981', vegetariano: '#22C55E', emagrecimento: '#EF4444', outro: '#9CA3AF' }
                            const catLabels = { low_carb: 'Low Carb', hipertrofia: 'Hipertrofia', mediterraneo: 'Mediterrâneo', vegetariano: 'Vegetariano', emagrecimento: 'Emagrecimento', outro: 'Outro' }
                            const color = catColors[tpl.template_category] || '#9CA3AF'
                            const label = catLabels[tpl.template_category] || 'Outro'
                            const isSelected = selectedTemplate?.id === tpl.id
                            return (
                              <button key={tpl.id} type="button" onClick={() => setSelectedTemplate(tpl)}
                                style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 10, border: `2px solid ${isSelected ? T.brand : T.border}`, background: isSelected ? T.chip : T.white, cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ fontSize: 20 }}>🥗</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                      <span style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{tpl.title}</span>
                                      <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${color}20`, color }}>{label}</span>
                                    </div>
                                    {tpl.description && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{tpl.description}</div>}
                                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{tpl.total_days} {tpl.total_days === 1 ? 'dia' : 'dias'}</div>
                                  </div>
                                  {isSelected && <span style={{ color: T.brand, fontWeight: 700, fontSize: 12 }}>✓</span>}
                                </div>
                              </button>
                            )
                          })}
                        </>
                      )}

                      {pickerTemplates.length === 0 && !pickerLoading && (
                        <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', padding: '8px 0' }}>Nenhum modelo personalizado criado ainda</p>
                      )}
                    </>
                  )}
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 20px 20px', borderTop: `1px solid ${T.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 4 }}>
                      Nome do plano
                    </label>
                    <input
                      value={pickerTitle}
                      onChange={e => setPickerTitle(e.target.value)}
                      placeholder={selectedTemplate ? selectedTemplate.title : 'Novo Plano Alimentar'}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="outline" onClick={() => setShowTemplatePicker(false)} style={{ flex: 1, fontSize: 13 }}>Cancelar</Button>
                    <Button onClick={handleCreateMealPlan} disabled={creatingFromTemplate} style={{ flex: 2, fontSize: 13, gap: 6 }}>
                      {creatingFromTemplate ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      {selectedTemplate ? 'Usar modelo' : 'Criar plano em branco'}
                    </Button>
                  </div>
                  <button type="button" onClick={() => { setShowTemplatePicker(false); navigate('/meal-plan-templates') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.brand, fontSize: 12, fontWeight: 600, padding: 0, textAlign: 'center', fontFamily: 'inherit' }}>
                    Gerenciar meus modelos →
                  </button>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* 3 ── ANAMNESE */}
        <Section icon={ClipboardList} title="Anamnese" count={anamneses.length}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Formulário de criação */}
            {showCreateAnamnese ? (
              <div style={{ border: `1px solid ${T.brand}30`, borderRadius: 12, padding: 16, background: T.white }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>Nova anamnese</span>
                  <button type="button" onClick={() => { setShowCreateAnamnese(false); setCreateTemplateId(''); setCreateAnswers({}) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 2 }}>✕</button>
                </div>

                {/* Seletor de template */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 5 }}>Template</label>
                  <select value={createTemplateId} onChange={e => { setCreateTemplateId(e.target.value); setCreateAnswers({}) }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}>
                    <option value="">Sem template (livre)</option>
                    {anamneseTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                {/* Campos do template selecionado */}
                {createTemplateId && (() => {
                  const tpl = anamneseTemplates.find(t => String(t.id) === createTemplateId)
                  if (!tpl?.fields?.length) return null
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                      {tpl.fields.map(field => (
                        <div key={field.id}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: T.text, display: 'block', marginBottom: 4 }}>
                            {field.label}
                            {field.required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea rows={3} value={createAnswers[field.id] || ''}
                              onChange={e => setCreateAnswers(p => ({ ...p, [field.id]: e.target.value }))}
                              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                          ) : field.type === 'select' ? (
                            <select value={createAnswers[field.id] || ''}
                              onChange={e => setCreateAnswers(p => ({ ...p, [field.id]: e.target.value }))}
                              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}>
                              <option value="">Selecione…</option>
                              {(field.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                            </select>
                          ) : field.type === 'checkbox' ? (
                            <div style={{ display: 'flex', gap: 16 }}>
                              {['Sim', 'Não'].map(opt => (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                                  <input type="radio" name={`field_${field.id}`} value={opt}
                                    checked={createAnswers[field.id] === opt}
                                    onChange={() => setCreateAnswers(p => ({ ...p, [field.id]: opt }))}
                                    style={{ accentColor: T.brand }} />
                                  {opt}
                                </label>
                              ))}
                            </div>
                          ) : (
                            <input type={field.type || 'text'} value={createAnswers[field.id] || ''}
                              onChange={e => setCreateAnswers(p => ({ ...p, [field.id]: e.target.value }))}
                              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* Campo livre quando sem template */}
                {!createTemplateId && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.text, display: 'block', marginBottom: 4 }}>Observações</label>
                    <textarea rows={4} value={createAnswers['__free__'] || ''}
                      onChange={e => setCreateAnswers({ '__free__': e.target.value })}
                      placeholder="Histórico, queixas, observações importantes…"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button size="sm" variant="ghost" onClick={() => { setShowCreateAnamnese(false); setCreateTemplateId(''); setCreateAnswers({}) }} style={{ fontSize: 12 }}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSaveAnamnese} disabled={savingAnamnese}
                    style={{ background: T.brand, color: '#fff', fontSize: 12, gap: 5 }}>
                    {savingAnamnese ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Salvar anamnese
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setShowCreateAnamnese(true)} style={{ fontSize: 12, gap: 6 }}>
                <Plus size={13} /> Nova anamnese
              </Button>
            )}

            {/* Histórico */}
            {anamneses.length === 0 ? (
              <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '8px 0' }}>Nenhuma anamnese registrada</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {anamneses.map(resp => {
                  const isExpanded = expandedAnamneseId === resp.id
                  const template = resp.anamnese_template
                  const answers = resp.responses || resp.answers || {}
                  const fields = template?.fields || []
                  return (
                    <div key={resp.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                      <button type="button" onClick={() => setExpandedAnamneseId(isExpanded ? null : resp.id)}
                        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: isExpanded ? T.chip : 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{template?.name || 'Anamnese livre'}</span>
                          {resp.appointment_start_time && (
                            <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>
                              {new Date(resp.appointment_start_time).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp size={14} style={{ color: '#9CA3AF' }} /> : <ChevronDown size={14} style={{ color: '#9CA3AF' }} />}
                      </button>
                      {isExpanded && (
                        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${T.border}` }}>
                          {fields.length > 0 ? fields.map(field => {
                            const val = answers[field.id] || answers[String(field.id)]
                            if (!val) return null
                            return (
                              <div key={field.id} style={{ padding: '6px 0', borderBottom: `1px solid #F9FAFB`, fontSize: 13 }}>
                                <span style={{ fontWeight: 600, color: T.muted, fontSize: 11 }}>{field.label}</span>
                                <p style={{ margin: '2px 0 0', color: T.text }}>{Array.isArray(val) ? val.join(', ') : String(val)}</p>
                              </div>
                            )
                          }) : answers['__free__'] ? (
                            <p style={{ fontSize: 13, color: T.text, marginTop: 8, lineHeight: 1.5 }}>{answers['__free__']}</p>
                          ) : (
                            <p style={{ fontSize: 13, color: T.muted, marginTop: 8 }}>Sem respostas registradas.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Section>

        {/* 4 ── EVOLUÇÕES CLÍNICAS */}
        <Section icon={FileText} title="Evoluções Clínicas" count={patientNotes.length} collapsible={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Editor de nova nota */}
            {showNewNote ? (
              <div style={{ border: `1px solid ${T.brand}30`, borderRadius: 12, overflow: 'hidden', background: T.white }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 6px', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Nova evolução</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button size="sm" variant="ghost" onClick={() => { setShowNewNote(false); setNoteContent('') }} style={{ fontSize: 11, height: 28 }}>Cancelar</Button>
                    <Button size="sm" onClick={handleSaveNote} disabled={savingNote}
                      style={{ fontSize: 11, height: 28, gap: 4 }}>
                      {savingNote ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Salvar
                    </Button>
                  </div>
                </div>
                <DocumentEditor
                  content={noteContent}
                  onChange={setNoteContent}
                  placeholder="Evolução clínica, orientações, observações do atendimento…"
                  className="border-0 rounded-none shadow-none"
                />
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setShowNewNote(true)} style={{ fontSize: 12, gap: 6 }}>
                <Plus size={13} /> Nova evolução
              </Button>
            )}

            {/* Lista de evoluções */}
            {patientNotes.length === 0 && !showNewNote && (
              <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '8px 0' }}>
                Nenhuma evolução registrada
              </p>
            )}
            {patientNotes.map(note => (
              <div key={note.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: '#FAFAFA', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 11, color: T.muted }}>
                    {new Date(note.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    {note.updated_at !== note.created_at && ' · editado'}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" onClick={() => { setEditingNoteId(note.id); setEditingContent(note.content) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.brand, fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 5, fontFamily: 'inherit' }}>
                      Editar
                    </button>
                    <button type="button" onClick={() => handleDeleteNote(note.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 4 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {editingNoteId === note.id ? (
                  <div>
                    <DocumentEditor
                      key={`edit-${note.id}`}
                      content={editingContent}
                      onChange={setEditingContent}
                      className="border-0 rounded-none shadow-none"
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '8px 14px', borderTop: `1px solid ${T.border}` }}>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingNoteId(null); setEditingContent('') }} style={{ fontSize: 11, height: 28 }}>Cancelar</Button>
                      <Button size="sm" onClick={() => handleUpdateNote(note.id)} disabled={savingEditNote}
                        style={{ fontSize: 11, height: 28, gap: 4 }}>
                        {savingEditNote ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none" style={{ padding: '12px 14px', fontSize: 13, color: T.text, lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: note.content }} />
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* COACHING */}
        <Section icon={Brain} title="Coaching" count={timelineEvents.length} defaultOpen={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Perfil de coaching */}
            {editingProfile ? (
              <div style={{ border: `1px solid ${T.brand}30`, borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 4 }}>Objetivo</label>
                  <textarea value={profileForm.goal} onChange={e => setProfileForm(p => ({ ...p, goal: e.target.value }))}
                    rows={2} placeholder="Ex: hipertrofia, emagrecimento, melhora de desempenho..."
                    style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 4 }}>Limitações</label>
                  <textarea value={profileForm.limitations} onChange={e => setProfileForm(p => ({ ...p, limitations: e.target.value }))}
                    rows={2} placeholder="Ex: dor no joelho, hérnia de disco..."
                    style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 4 }}>Próxima reavaliação</label>
                  <input type="date" value={profileForm.next_reassessment_at} onChange={e => setProfileForm(p => ({ ...p, next_reassessment_at: e.target.value }))}
                    style={{ padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button size="sm" variant="ghost" onClick={() => setEditingProfile(false)} style={{ fontSize: 11, height: 28 }}>Cancelar</Button>
                  <Button size="sm" onClick={handleSaveCoachingProfile} disabled={savingProfile} style={{ fontSize: 11, height: 28, gap: 4 }}>
                    {savingProfile ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 12, color: T.muted, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {coachingProfile?.goal && <span><strong style={{ color: T.text }}>Objetivo:</strong> {coachingProfile.goal}</span>}
                  {coachingProfile?.limitations && <span><strong style={{ color: T.text }}>Limitações:</strong> {coachingProfile.limitations}</span>}
                  {coachingProfile?.next_reassessment_at && <span><strong style={{ color: T.text }}>Reavaliação:</strong> {new Date(coachingProfile.next_reassessment_at).toLocaleDateString('pt-BR')}</span>}
                  {!coachingProfile?.goal && !coachingProfile?.limitations && (
                    <span style={{ fontStyle: 'italic' }}>Nenhum perfil preenchido</span>
                  )}
                </div>
                <button type="button" onClick={() => setEditingProfile(true)}
                  style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: T.brand, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Editar perfil
                </button>
              </div>
            )}

            {/* Registro rápido */}
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px 6px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text, flex: 1 }}>Registro rápido</span>
                <button type="button" onClick={toggleRecording} disabled={isTranscribing}
                  className={isRecording ? 'animate-pulse' : ''}
                  title={isRecording ? 'Parar gravação' : isTranscribing ? 'Transcrevendo…' : 'Gravar por voz'}
                  style={{ background: isRecording ? '#EF4444' : T.chip, border: 'none', borderRadius: 6, padding: '4px 8px', cursor: isTranscribing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: isRecording ? '#fff' : T.brand, fontSize: 11, fontWeight: 600, opacity: isTranscribing ? 0.6 : 1 }}>
                  {isTranscribing ? <Loader2 size={13} className="animate-spin" /> : isRecording ? <MicOff size={13} /> : <Mic size={13} />}
                  {isTranscribing ? 'Transcrevendo…' : isRecording ? 'Parar' : 'Voz'}
                </button>
              </div>
              <textarea
                value={coachingInput}
                onChange={e => setCoachingInput(e.target.value)}
                placeholder="Cole a transcrição ou descreva o atendimento... A IA vai estruturar sono, carga, observação e próxima ação."
                rows={4}
                style={{ width: '100%', padding: '10px 14px', border: 'none', outline: 'none', resize: 'vertical', fontFamily: 'inherit', fontSize: 13, color: T.text, background: T.white, boxSizing: 'border-box' }}
              />
              <div style={{ padding: '8px 14px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="sm" onClick={handleCreateTimelineEvent} disabled={savingCoaching || !coachingInput.trim()} style={{ fontSize: 11, gap: 6 }}>
                  {savingCoaching ? <Loader2 size={11} className="animate-spin" /> : <Brain size={11} />}
                  {savingCoaching ? 'Processando IA...' : 'Registrar'}
                </Button>
              </div>
            </div>

            {/* Rascunho de feedback */}
            {timelineEvents.length > 0 && (
              <div>
                <Button size="sm" variant="outline" onClick={handleFeedbackDraft} disabled={loadingDraft} style={{ fontSize: 12, gap: 6 }}>
                  {loadingDraft ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
                  Gerar rascunho de feedback
                </Button>
                {feedbackDraft && (
                  <div style={{ marginTop: 8, padding: '12px 14px', background: T.chip, borderRadius: 8, fontSize: 13, color: T.text, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {feedbackDraft}
                  </div>
                )}
              </div>
            )}

            {/* Tendências — strip dos últimos 5 registros */}
            {timelineEvents.length >= 2 && (
              <CoachingTrends events={timelineEvents.slice(0, 5)} />
            )}

            {/* Busca na timeline */}
            {timelineEvents.length > 0 && (
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
                <input
                  value={coachingSearch}
                  onChange={e => setCoachingSearch(e.target.value)}
                  placeholder="Buscar na timeline..."
                  style={{ width: '100%', padding: '7px 12px 7px 30px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none', color: T.text, boxSizing: 'border-box' }}
                />
              </div>
            )}

            {/* Timeline */}
            {timelineEvents.length === 0 ? (
              <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '8px 0' }}>
                Nenhum registro de coaching ainda
              </p>
            ) : (
              <div style={{ position: 'relative' }}>
                {/* linha vertical */}
                <div style={{ position: 'absolute', left: 15, top: 8, bottom: 8, width: 2, background: T.border, borderRadius: 2 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredEvents.map(ev => (
                    <TimelineCard key={ev.id} ev={ev} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* 5 ── DOCUMENTOS */}
        <Section icon={FileText} title="Documentos" count={docs.length} defaultOpen={false}>
          <button type="button" onClick={() => { setNewDoc({ title: '', document_type: 'plano_alimentar', content: '' }); setShowNewDocDialog(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.brand, background: 'none', border: `1px dashed ${T.border}`, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center', marginBottom: 10 }}>
            <Plus size={13} /> Novo documento
          </button>

          {docs.length === 0 ? (
            <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '8px 0' }}>Nenhum documento criado</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {docs.map(doc => (
                <div key={doc.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                      {DOCUMENT_TYPE_LABELS?.[doc.document_type] || doc.document_type}
                      {' · '}{new Date(doc.updated_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                    <button type="button" onClick={() => handleToggleDocShared(doc)}
                      style={{ background: doc.shared ? '#ECFDF5' : '#F3F4F6', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: doc.shared ? '#10B981' : '#9CA3AF' }}>
                      <Link2 size={12} /> {doc.shared ? 'Ativo' : 'Link'}
                    </button>
                    {doc.shared && (
                      <button type="button" onClick={() => handleCopyDocLink(doc)}
                        style={{ background: T.chip, border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: T.brand }}>
                        <Copy size={12} /> Copiar
                      </button>
                    )}
                    <a href={`/d/${doc.public_token}`} target="_blank" rel="noreferrer"
                      style={{ background: T.chip, border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: T.brand, textDecoration: 'none' }}>
                      <ExternalLink size={12} />
                    </a>
                    <button type="button" onClick={() => handleDeleteDoc(doc.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '4px' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Modal — Novo Documento */}
        {showNewDocDialog && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => { if (e.target === e.currentTarget) setShowNewDocDialog(false) }}>
            <div className="dm-modal-box" style={{ background: T.white, borderRadius: 14, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 16px' }}>Novo Documento</h3>

              <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 4 }}>Título *</label>
              <input value={newDoc.title} onChange={e => setNewDoc(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Prescrição Dietética — Junho 2026" autoFocus
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />

              <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 4 }}>Tipo</label>
              <select value={newDoc.document_type} onChange={e => setNewDoc(p => ({ ...p, document_type: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12 }}>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              {docTemplates.length > 0 && (
                <>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 4 }}>
                    Usar modelo como base <span style={{ fontWeight: 400, color: T.muted }}>(opcional)</span>
                  </label>
                  <select onChange={e => handleNewDocTemplateChange(e.target.value)} defaultValue=""
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 16 }}>
                    <option value="">Sem modelo (documento em branco)</option>
                    {docTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: docTemplates.length === 0 ? 4 : 0 }}>
                <button type="button" onClick={() => setShowNewDocDialog(false)} disabled={savingDoc}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, color: T.muted }}>
                  Cancelar
                </button>
                <Button onClick={handleCreateDoc} disabled={savingDoc || !newDoc.title.trim()} style={{ flex: 2, gap: 6 }}>
                  {savingDoc ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Criar documento
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Helpers de cor para sono/carga ──────────────────────────────────────────

const PAIN_WORDS = ['dor', 'lesão', 'lesao', 'machuc', 'inflamação', 'inflamacao', 'torção', 'torcao', 'bursite', 'distensão', 'distensao', 'tendinite']
const BAD_SLEEP  = ['mal', 'ruim', 'pouco', 'insônia', 'insonia', 'agitado', 'acordou', '3h', '4h', '5h']
const GOOD_SLEEP = ['bem', 'bom', 'boa', 'ótimo', 'otimo', '8h', '9h', '7h', 'tranquilo']

function hasPain(text)   { const t = (text || '').toLowerCase(); return PAIN_WORDS.some(w => t.includes(w)) }
function sleepQuality(text) {
  const t = (text || '').toLowerCase()
  if (BAD_SLEEP.some(w => t.includes(w)))  return 'bad'
  if (GOOD_SLEEP.some(w => t.includes(w))) return 'good'
  return 'neutral'
}

// ─── TimelineCard ─────────────────────────────────────────────────────────────

function TimelineCard({ ev }) {
  const pain     = hasPain(ev.observacao) || hasPain(ev.raw_input)
  const sleepQ   = sleepQuality(ev.sono)
  const dotColor = pain ? '#EF4444' : sleepQ === 'bad' ? '#F59E0B' : T.brand

  return (
    <div style={{ display: 'flex', gap: 12, paddingLeft: 8 }}>
      {/* dot */}
      <div style={{ flexShrink: 0, width: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, border: `2px solid ${T.white}`, outline: `1.5px solid ${dotColor}`, zIndex: 1 }} />
      </div>

      {/* card */}
      <div style={{ flex: 1, border: `1px solid ${pain ? '#EF444440' : T.border}`, borderRadius: 10, overflow: 'hidden', background: pain ? '#FFF5F5' : T.white }}>
        {/* header */}
        <div style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${pain ? '#EF444430' : T.border}` }}>
          <span style={{ fontSize: 11, color: T.muted }}>
            {new Date(ev.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {pain && <span style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', background: '#FEE2E2', borderRadius: 20, padding: '1px 7px' }}>dor</span>}
            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: T.chip, color: T.brand }}>
              {ev.source === 'whatsapp' ? 'WhatsApp' : ev.source === 'whisper' ? '🎤 Áudio' : 'Manual'}
            </span>
          </div>
        </div>

        {/* chips + fields */}
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {/* chips inline: sono + carga */}
          {(ev.sono || ev.carga) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {ev.sono && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '2px 9px',
                  background: sleepQ === 'bad' ? '#FEF3C7' : sleepQ === 'good' ? '#D1FAE5' : T.chip,
                  color:      sleepQ === 'bad' ? '#92400E' : sleepQ === 'good' ? '#065F46' : T.muted,
                }}>
                  <Moon size={10} /> {ev.sono}
                </span>
              )}
              {ev.carga && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '2px 9px', background: '#EDE9FE', color: '#5B21B6' }}>
                  <Dumbbell size={10} /> {ev.carga}
                </span>
              )}
            </div>
          )}

          {ev.observacao && (
            <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start', fontSize: 12, color: T.text }}>
              <StickyNote size={11} style={{ color: T.muted, marginTop: 1, flexShrink: 0 }} />
              <span style={{ lineHeight: 1.4 }}>{ev.observacao}</span>
            </div>
          )}

          {ev.proxima_acao && (
            <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start', fontSize: 12, color: T.brand }}>
              <ArrowRight size={11} style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ lineHeight: 1.4 }}>{ev.proxima_acao}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CoachingTrends ───────────────────────────────────────────────────────────

function CoachingTrends({ events }) {
  const sonoItems  = events.filter(e => e.sono).slice(0, 4).reverse()
  const cargaItems = events.filter(e => e.carga).slice(0, 4).reverse()

  if (!sonoItems.length && !cargaItems.length) return null

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tendências recentes</span>

      {sonoItems.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Moon size={12} style={{ color: T.muted, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: T.muted, width: 32, flexShrink: 0 }}>Sono</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {sonoItems.map((e, i) => {
              const q = sleepQuality(e.sono)
              return (
                <span key={i} title={e.sono} style={{
                  fontSize: 10, fontWeight: 600, borderRadius: 20, padding: '1px 7px',
                  background: q === 'bad' ? '#FEF3C7' : q === 'good' ? '#D1FAE5' : T.chip,
                  color:      q === 'bad' ? '#92400E' : q === 'good' ? '#065F46' : T.muted,
                  maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {e.sono}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {cargaItems.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Dumbbell size={12} style={{ color: T.muted, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: T.muted, width: 32, flexShrink: 0 }}>Carga</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {cargaItems.map((e, i) => (
              <span key={i} title={e.carga} style={{
                fontSize: 10, fontWeight: 600, borderRadius: 20, padding: '1px 7px',
                background: '#EDE9FE', color: '#5B21B6',
                maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {e.carga}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
