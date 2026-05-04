import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="relative z-10 space-y-6 md:space-y-8 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
              <span className="bg-gradient-to-r from-[#5B7A9E] via-[#6B8FA3] to-[#7A9D96] bg-clip-text text-transparent">
                Horários de Trabalho
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Configure os horários de disponibilidade de cada profissional
            </p>
          </div>
          {selectedProfessional && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-[#5B7A9E] to-[#6B8FA3] hover:from-[#4A5C7A] hover:to-[#5B7A9E] text-white border-0"
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
              <div className="block md:hidden space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const d = workingHours[day.value]
                  return (
                    <Card
                      key={day.value}
                      className={cn(
                        'hover:shadow-md transition-shadow',
                        d.enabled ? 'border-green-200' : 'border-gray-200 opacity-60'
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{day.label}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant={d.enabled ? 'default' : 'secondary'} className="text-xs">
                                {d.enabled ? 'Ativo' : 'Inativo'}
                              </Badge>
                              {d.enabled && d.has_break && (
                                <Badge variant="outline" className="text-xs">Com Intervalo</Badge>
                              )}
                            </div>
                          </div>
                          <label className="ml-4 flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={d.enabled}
                              onChange={(e) => handleDayChange(day.value, 'enabled', e.target.checked)}
                              className="w-5 h-5 text-green-600 rounded"
                            />
                          </label>
                        </div>

                        {d.enabled ? (
                          <>
                            <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t mb-3">
                              <div>
                                <Label className="text-xs text-gray-600 mb-1 block">Início</Label>
                                <Input type="time" value={d.start_time}
                                  onChange={(e) => handleDayChange(day.value, 'start_time', e.target.value)} />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600 mb-1 block">Fim</Label>
                                <Input type="time" value={d.end_time}
                                  onChange={(e) => handleDayChange(day.value, 'end_time', e.target.value)} />
                              </div>
                            </div>
                            <div className="pt-3 border-t">
                              <div className="flex items-center justify-between mb-3">
                                <Label className="text-sm font-medium text-gray-700">Tem intervalo?</Label>
                                <input type="checkbox" checked={d.has_break}
                                  onChange={(e) => handleDayChange(day.value, 'has_break', e.target.checked)}
                                  className="w-4 h-4 text-green-600 rounded" />
                              </div>
                              {d.has_break && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs text-gray-600 mb-1 block">Início Intervalo</Label>
                                    <Input type="time" value={d.break_start}
                                      onChange={(e) => handleDayChange(day.value, 'break_start', e.target.value)} />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-600 mb-1 block">Fim Intervalo</Label>
                                    <Input type="time" value={d.break_end}
                                      onChange={(e) => handleDayChange(day.value, 'break_end', e.target.value)} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4 text-gray-400 text-sm">Dia desativado</div>
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
                        <TableRow key={day.value}>
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
    </div>
  )
}
