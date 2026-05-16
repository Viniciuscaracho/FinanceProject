import { useState, useEffect, useCallback } from 'react'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check, Clock, Loader2, Save, Users } from 'lucide-react'
import { toast } from 'sonner'
import { apiService } from '../lib/api'
import { useIsMobile } from '@/hooks/use-mobile'
import { T, DISPLAY } from '@/lib/tokens'

function TimeInput({ value, onChange, disabled }) {
  return (
    <input
      type="time"
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: 106, height: 34, padding: '0 10px',
        border: `1px solid ${T.border}`, borderRadius: 8,
        fontSize: 13, color: T.text, background: T.white,
        fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      onFocus={e => { e.target.style.borderColor = T.brand; e.target.style.boxShadow = `0 0 0 3px ${T.chip}` }}
      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none' }}
    />
  )
}

/* ─── Data ─────────────────────────────────── */
const DAYS_OF_WEEK = [
  { value: 'monday',    label: 'Segunda-feira', short: 'Seg' },
  { value: 'tuesday',   label: 'Terça-feira',   short: 'Ter' },
  { value: 'wednesday', label: 'Quarta-feira',  short: 'Qua' },
  { value: 'thursday',  label: 'Quinta-feira',  short: 'Qui' },
  { value: 'friday',    label: 'Sexta-feira',   short: 'Sex' },
  { value: 'saturday',  label: 'Sábado',        short: 'Sáb' },
  { value: 'sunday',    label: 'Domingo',       short: 'Dom' },
]

const DEFAULT_HOURS = () => {
  const h = {}
  DAYS_OF_WEEK.forEach(({ value }, i) => {
    h[value] = { enabled: i < 5, start_time: '09:00', end_time: '18:00', has_break: i < 5, break_start: '12:00', break_end: '13:00' }
  })
  return h
}

const hourToTime = (h) => `${String(h ?? 9).padStart(2, '0')}:00`
const timeToHour = (t) => parseInt((t || '09:00').split(':')[0], 10)

function backendToFrontend(schedule) {
  const result = DEFAULT_HOURS()
  if (!schedule || typeof schedule !== 'object') return result
  Object.entries(schedule).forEach(([day, cfg]) => {
    if (!cfg) return
    result[day] = {
      enabled:     cfg.enabled ?? false,
      start_time:  cfg.start_time  || hourToTime(cfg.start_hour),
      end_time:    cfg.end_time    || hourToTime(cfg.end_hour),
      has_break:   cfg.has_break   ?? false,
      break_start: cfg.break_start || '12:00',
      break_end:   cfg.break_end   || '13:00',
    }
  })
  return result
}

function frontendToBackend(hours) {
  const result = {}
  Object.entries(hours).forEach(([day, cfg]) => {
    result[day] = {
      enabled:     cfg.enabled,
      start_hour:  timeToHour(cfg.start_time),
      end_hour:    timeToHour(cfg.end_time),
      has_break:   cfg.has_break,
      break_start: cfg.has_break ? cfg.break_start : null,
      break_end:   cfg.has_break ? cfg.break_end   : null,
    }
  })
  return result
}

/* ─── Componente ────────────────────────────── */
export function WorkingHours() {
  const isMobile = useIsMobile()
  const [professionals, setProfessionals]         = useState([])
  const [selectedProfessional, setSelectedProfessional] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [workingHours, setWorkingHours] = useState(DEFAULT_HOURS)

  const loadProfessionals = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiService.getProfessionals()
      const list = Array.isArray(data) ? data : []
      setProfessionals(list)
      if (list.length > 0) setSelectedProfessional(list[0])
    } catch {
      toast.error('Erro ao carregar profissionais')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProfessionals() }, [loadProfessionals])

  useEffect(() => {
    if (selectedProfessional) setWorkingHours(backendToFrontend(selectedProfessional.schedule))
  }, [selectedProfessional])

  const handleDayChange = (day, field, value) => {
    setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  const handleSave = async () => {
    if (!selectedProfessional) return
    try {
      setSaving(true)
      await apiService.updateProfessionalSchedule(selectedProfessional.id, frontendToBackend(workingHours))
      const updated = await apiService.getProfessionals()
      const list = Array.isArray(updated) ? updated : []
      setProfessionals(list)
      const refreshed = list.find(p => p.id === selectedProfessional.id)
      if (refreshed) setSelectedProfessional(refreshed)
      toast.success('Horários salvos com sucesso!')
    } catch (err) {
      toast.error('Erro ao salvar horários: ' + (err.message || 'tente novamente'))
    } finally {
      setSaving(false)
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: 28, height: 28, color: T.brand, animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>Carregando...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const usePills = professionals.length <= 6
  const enabledCount = Object.values(workingHours).filter(d => d.enabled).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...DISPLAY }}>

      {/* ── Cabeçalho ── */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.02em' }}>
            Horários de Trabalho
          </h1>
          <p style={{ fontSize: 13, color: T.muted, margin: '3px 0 0' }}>
            Configure os dias e horários de cada profissional
          </p>
        </div>
        {selectedProfessional && !isMobile && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 20px', background: T.brand, color: '#fff',
              border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: saving ? 0.7 : 1, flexShrink: 0,
            }}
          >
            {saving
              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <Save size={14} />}
            Salvar Horários
          </button>
        )}
      </div>

      {/* ── Seletor de profissional ── */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users className="h-4 w-4" style={{ color: T.brand }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>Profissional</p>
            <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Selecione para configurar os horários</p>
          </div>
        </div>

        <div style={{ padding: '14px 20px' }}>
          {professionals.length === 0 ? (
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Nenhum profissional cadastrado.</p>
          ) : usePills ? (
            /* Pills para até 6 profissionais */
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {professionals.map(prof => {
                const active = selectedProfessional?.id === prof.id
                return (
                  <button
                    key={prof.id}
                    onClick={() => setSelectedProfessional(prof)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 14px', borderRadius: 20, border: '1px solid',
                      borderColor: active ? T.brand : T.border,
                      background: active ? T.chip : T.white,
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 150ms',
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: active ? T.brand : T.border,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                      color: active ? '#fff' : T.muted,
                      flexShrink: 0,
                    }}>
                      {(prof.name?.[0] || '?').toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? T.brand : T.text }}>
                      {prof.name}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            /* Select para muitos profissionais */
            <Select
              value={selectedProfessional?.id?.toString() || ''}
              onValueChange={value => setSelectedProfessional(professionals.find(p => p.id.toString() === value))}
            >
              <SelectTrigger style={{ height: 36, fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map(prof => (
                  <SelectItem key={prof.id} value={prof.id.toString()}>{prof.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* ── Horários ── */}
      {selectedProfessional ? (
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>

          {/* Header do painel */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock className="h-4 w-4" style={{ color: T.brand }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>
                Horários de {selectedProfessional.name}
              </p>
              <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>
                {enabledCount} {enabledCount === 1 ? 'dia ativo' : 'dias ativos'} nesta semana
              </p>
            </div>
          </div>

          {/* ── Mobile: cartões por dia ── */}
          {isMobile ? (
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DAYS_OF_WEEK.map((day, idx) => {
                const d = workingHours[day.value]
                return (
                  <div
                    key={day.value}
                    style={{
                      border: `1px solid ${d.enabled ? T.brand + '40' : T.border}`,
                      borderRadius: 10, overflow: 'hidden',
                      opacity: d.enabled ? 1 : 0.6,
                      transition: 'opacity 150ms',
                    }}
                  >
                    {/* Linha do título */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: d.enabled ? T.chip : T.bg }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: d.enabled ? T.text : T.muted }}>
                          {day.label}
                        </span>
                        <span style={{
                          borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                          background: d.enabled ? T.green + '18' : T.border,
                          color: d.enabled ? T.green : T.muted,
                        }}>
                          {d.enabled ? (d.start_time + ' – ' + d.end_time) : 'Fechado'}
                        </span>
                      </div>
                      <Switch
                        checked={d.enabled}
                        onCheckedChange={v => handleDayChange(day.value, 'enabled', v)}
                      />
                    </div>

                    {/* Controles quando ativo */}
                    {d.enabled && (
                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px' }}>Entrada</p>
                            <input
                              type="time"
                              value={d.start_time}
                              onChange={e => handleDayChange(day.value, 'start_time', e.target.value)}
                              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px', fontSize: 13, color: T.text, fontFamily: 'inherit', outline: 'none' }}
                            />
                          </div>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px' }}>Saída</p>
                            <input
                              type="time"
                              value={d.end_time}
                              onChange={e => handleDayChange(day.value, 'end_time', e.target.value)}
                              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px', fontSize: 13, color: T.text, fontFamily: 'inherit', outline: 'none' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, color: T.muted }}>Intervalo / almoço</span>
                          <Switch
                            checked={d.has_break}
                            onCheckedChange={v => handleDayChange(day.value, 'has_break', v)}
                          />
                        </div>

                        {d.has_break && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px' }}>Início pausa</p>
                              <input
                                type="time"
                                value={d.break_start}
                                onChange={e => handleDayChange(day.value, 'break_start', e.target.value)}
                                style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px', fontSize: 13, color: T.text, fontFamily: 'inherit', outline: 'none' }}
                              />
                            </div>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px' }}>Fim pausa</p>
                              <input
                                type="time"
                                value={d.break_end}
                                onChange={e => handleDayChange(day.value, 'break_end', e.target.value)}
                                style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px', fontSize: 13, color: T.text, fontFamily: 'inherit', outline: 'none' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            /* ── Desktop: lista de dias ── */
            <div>
              {/* Cabeçalho da lista */}
              <div style={{ display: 'grid', gridTemplateColumns: '200px 260px 1fr', gap: 0, padding: '8px 20px', background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                {['Dia', 'Horário de trabalho', 'Intervalo'].map((h, i) => (
                  <p key={i} style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{h}</p>
                ))}
              </div>

              {DAYS_OF_WEEK.map((day, idx) => {
                const d = workingHours[day.value]
                const isLast = idx === DAYS_OF_WEEK.length - 1
                return (
                  <div
                    key={day.value}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '200px 260px 1fr',
                      gap: 0,
                      alignItems: 'center',
                      padding: '13px 20px',
                      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                      background: 'transparent',
                      transition: 'background 100ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Dia + checkbox */}
                    <button
                      onClick={() => handleDayChange(day.value, 'enabled', !d.enabled)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: 0, background: 'none', border: 'none',
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: `2px solid ${d.enabled ? T.brand : T.border}`,
                        background: d.enabled ? T.brand : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 150ms',
                      }}>
                        {d.enabled && <Check size={11} color="#fff" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: d.enabled ? 600 : 400, color: d.enabled ? T.text : T.muted, transition: 'color 150ms' }}>
                        {day.label}
                      </span>
                    </button>

                    {/* Horário */}
                    <div>
                      {d.enabled ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <TimeInput value={d.start_time} onChange={v => handleDayChange(day.value, 'start_time', v)} />
                          <span style={{ fontSize: 12, color: T.muted }}>até</span>
                          <TimeInput value={d.end_time} onChange={v => handleDayChange(day.value, 'end_time', v)} />
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: T.muted }}>Fechado</span>
                      )}
                    </div>

                    {/* Intervalo */}
                    <div>
                      {d.enabled ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Switch
                            checked={d.has_break}
                            onCheckedChange={v => handleDayChange(day.value, 'has_break', v)}
                          />
                          {d.has_break && (
                            <>
                              <TimeInput value={d.break_start} onChange={v => handleDayChange(day.value, 'break_start', v)} />
                              <span style={{ fontSize: 12, color: T.muted }}>→</span>
                              <TimeInput value={d.break_end} onChange={v => handleDayChange(day.value, 'break_end', v)} />
                            </>
                          )}
                          {!d.has_break && (
                            <span style={{ fontSize: 12, color: T.muted }}>Sem intervalo</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: T.muted }}>—</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : professionals.length === 0 ? (
        /* Estado vazio */
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <Clock style={{ width: 36, height: 36, margin: '0 auto 12px', color: T.border }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: '0 0 4px' }}>Nenhum profissional cadastrado</p>
          <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Cadastre profissionais primeiro para configurar horários</p>
        </div>
      ) : null}

      {/* Botão salvar — sticky mobile */}
      {selectedProfessional && isMobile && (
        <div className="mobile-sticky-footer">
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: T.brand, color: '#fff', border: 'none', borderRadius: 9,
              fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Salvando...</>
              : <><Save size={16} />Salvar Horários</>}
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
