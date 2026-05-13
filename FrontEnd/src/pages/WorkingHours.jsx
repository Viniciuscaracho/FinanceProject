import { useState, useEffect, useCallback } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Clock,
  Loader2,
  Save,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiService } from '../lib/api'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { FluidSection } from '@/components/design'
import { T, DISPLAY } from '@/lib/tokens'

const DAYS_OF_WEEK = [
  { value: 'monday',    label: 'Segunda-feira' },
  { value: 'tuesday',   label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday',  label: 'Quinta-feira' },
  { value: 'friday',    label: 'Sexta-feira' },
  { value: 'saturday',  label: 'Sábado' },
  { value: 'sunday',    label: 'Domingo' },
]

const DEFAULT_HOURS = () => {
  const h = {}
  DAYS_OF_WEEK.forEach(({ value }, i) => {
    h[value] = {
      enabled: i < 5,
      start_time: '09:00',
      end_time: '18:00',
      has_break: i < 5,
      break_start: '12:00',
      break_end: '13:00',
    }
  })
  return h
}

// Backend stores { start_hour: 9, end_hour: 18 } → frontend needs '09:00' / '18:00'
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

export function WorkingHours() {
  const isMobile = useIsMobile()
  const [professionals, setProfessionals] = useState([])
  const [selectedProfessional, setSelectedProfessional] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    if (selectedProfessional) {
      setWorkingHours(backendToFrontend(selectedProfessional.schedule))
    }
  }, [selectedProfessional])

  const handleDayChange = (day, field, value) => {
    setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  const handleSave = async () => {
    if (!selectedProfessional) return
    try {
      setSaving(true)
      const payload = frontendToBackend(workingHours)
      await apiService.updateProfessionalSchedule(selectedProfessional.id, payload)
      // Refresh professional data so schedule is up-to-date
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: T.brand }} />
          <p style={{ color: T.muted }}>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, ...DISPLAY }}>
      <div className="relative z-10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-0.5" style={{ color: T.text }}>
              Horários de Trabalho
            </h1>
            <p style={{ fontSize: 14, color: T.muted }}>
              Configure os horários de cada profissional
            </p>
          </div>
          {selectedProfessional && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="hidden sm:flex"
              style={{ background: T.brand, color: '#fff', border: 'none', borderRadius: 8 }}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Salvar Horários</>
              )}
            </Button>
          )}
        </div>

        {/* Professional Selector */}
        <FluidSection
          title="Selecione o Profissional"
          subtitle="Escolha o profissional para configurar os horários"
          gradient="from-blue-500 to-cyan-500"
        >
          <Select
            value={selectedProfessional?.id?.toString() || ''}
            onValueChange={(value) => {
              const prof = professionals.find(p => p.id.toString() === value)
              setSelectedProfessional(prof)
            }}
          >
            <SelectTrigger className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20">
              <SelectValue placeholder="Selecione um profissional" />
            </SelectTrigger>
            <SelectContent>
              {professionals.map((prof) => (
                <SelectItem key={prof.id} value={prof.id.toString()}>
                  {prof.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FluidSection>

        {/* Working Hours */}
        {selectedProfessional && (
          <FluidSection
            title={`Horários de ${selectedProfessional.name}`}
            subtitle="Configure os horários para cada dia da semana"
            gradient="from-[#5B7A9E] to-[#6B8FA3]"
            icon={Clock}
          >
            <>
              {/* Mobile Cards */}
              <div className="block md:hidden space-y-2">
                {DAYS_OF_WEEK.map((day) => {
                  const d = workingHours[day.value]
                  return (
                    <Card
                      key={day.value}
                      style={{
                        transition: 'all 200ms',
                        borderColor: d.enabled ? T.green + '60' : T.border,
                        opacity: d.enabled ? 1 : 0.65
                      }}
                    >
                      <CardContent className="p-4">
                        {/* Cabeçalho do dia */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                              <h3 style={{ fontWeight: 600, fontSize: 16, color: d.enabled ? T.text : T.muted }}>
                                {day.label}
                              </h3>
                              <span style={{ borderRadius: 20, padding: '2px 7px', fontSize: 11, fontWeight: 600, background: d.enabled ? T.green + '18' : T.muted + '18', color: d.enabled ? T.green : T.muted }}>
                                {d.enabled ? 'Aberto' : 'Fechado'}
                              </span>
                            </div>
                            {d.enabled && (
                              <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                                {d.start_time} – {d.end_time}
                                {d.has_break && ` · Intervalo ${d.break_start}–${d.break_end}`}
                              </p>
                            )}
                          </div>
                          <Switch
                            checked={d.enabled}
                            onCheckedChange={(checked) => handleDayChange(day.value, 'enabled', checked)}
                          />
                        </div>

                        {d.enabled && (
                          <div className="mt-4 space-y-3 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
                            {/* Horários de trabalho */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-gray-500 mb-1 block">Entrada</Label>
                                <Input
                                  type="time"
                                  value={d.start_time}
                                  onChange={(e) => handleDayChange(day.value, 'start_time', e.target.value)}
                                  className="h-10 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1 block">Saída</Label>
                                <Input
                                  type="time"
                                  value={d.end_time}
                                  onChange={(e) => handleDayChange(day.value, 'end_time', e.target.value)}
                                  className="h-10 text-sm"
                                />
                              </div>
                            </div>

                            {/* Toggle intervalo */}
                            <div className="flex items-center justify-between py-1">
                              <Label style={{ fontSize: 13, color: T.muted, cursor: 'pointer' }}>
                                Intervalo / almoço
                              </Label>
                              <Switch
                                checked={d.has_break}
                                onCheckedChange={(checked) => handleDayChange(day.value, 'has_break', checked)}
                              />
                            </div>

                            {d.has_break && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs text-gray-500 mb-1 block">Início pausa</Label>
                                  <Input
                                    type="time"
                                    value={d.break_start}
                                    onChange={(e) => handleDayChange(day.value, 'break_start', e.target.value)}
                                    className="h-10 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-500 mb-1 block">Fim pausa</Label>
                                  <Input
                                    type="time"
                                    value={d.break_end}
                                    onChange={(e) => handleDayChange(day.value, 'break_end', e.target.value)}
                                    className="h-10 text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dia da Semana</TableHead>
                      <TableHead>Ativo</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Fim</TableHead>
                      <TableHead>Intervalo</TableHead>
                      <TableHead>Início Intervalo</TableHead>
                      <TableHead>Fim Intervalo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DAYS_OF_WEEK.map((day) => {
                      const d = workingHours[day.value]
                      return (
                        <TableRow key={day.value} style={{ transition: 'background 100ms' }}
                          onMouseEnter={e => e.currentTarget.style.background = T.bg}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <TableCell className="font-medium">{day.label}</TableCell>
                          <TableCell>
                            <input type="checkbox" checked={d.enabled}
                              onChange={(e) => handleDayChange(day.value, 'enabled', e.target.checked)}
                              className="w-4 h-4 text-green-600 rounded" />
                          </TableCell>
                          <TableCell>
                            {d.enabled
                              ? <Input type="time" value={d.start_time} className="w-32"
                                  onChange={(e) => handleDayChange(day.value, 'start_time', e.target.value)} />
                              : <span className="text-gray-400">-</span>}
                          </TableCell>
                          <TableCell>
                            {d.enabled
                              ? <Input type="time" value={d.end_time} className="w-32"
                                  onChange={(e) => handleDayChange(day.value, 'end_time', e.target.value)} />
                              : <span className="text-gray-400">-</span>}
                          </TableCell>
                          <TableCell>
                            {d.enabled
                              ? <input type="checkbox" checked={d.has_break}
                                  onChange={(e) => handleDayChange(day.value, 'has_break', e.target.checked)}
                                  className="w-4 h-4 text-green-600 rounded" />
                              : <span className="text-gray-400">-</span>}
                          </TableCell>
                          <TableCell>
                            {d.enabled && d.has_break
                              ? <Input type="time" value={d.break_start} className="w-32"
                                  onChange={(e) => handleDayChange(day.value, 'break_start', e.target.value)} />
                              : <span className="text-gray-400">-</span>}
                          </TableCell>
                          <TableCell>
                            {d.enabled && d.has_break
                              ? <Input type="time" value={d.break_end} className="w-32"
                                  onChange={(e) => handleDayChange(day.value, 'break_end', e.target.value)} />
                              : <span className="text-gray-400">-</span>}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          </FluidSection>
        )}

        {!selectedProfessional && professionals.length === 0 && (
          <FluidSection
            title="Nenhum profissional cadastrado"
            subtitle="Cadastre profissionais primeiro para configurar horários"
            gradient="from-gray-400 to-gray-500"
          >
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            </div>
          </FluidSection>
        )}
      </div>

      {/* Botão salvar sticky — apenas mobile */}
      {selectedProfessional && (
        <div className="block sm:hidden mobile-sticky-footer">
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ background: T.brand, color: '#fff', border: 'none', borderRadius: 8, width: '100%', height: 48, fontSize: 16, fontWeight: 600 }}
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Salvando...</>
            ) : (
              <><Save className="w-5 h-5 mr-2" />Salvar Horários</>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
