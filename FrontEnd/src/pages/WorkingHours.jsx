import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  User
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { FluidSection } from '@/components/design'

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
]

export function WorkingHours() {
  const isMobile = useIsMobile()
  const [professionals, setProfessionals] = useState([])
  const [selectedProfessional, setSelectedProfessional] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
  // Horários de trabalho por dia da semana
  const [workingHours, setWorkingHours] = useState(() => {
    const hours = {}
    DAYS_OF_WEEK.forEach(day => {
      hours[day.value] = {
        enabled: false,
        start_time: '09:00',
        end_time: '18:00',
        break_start: '12:00',
        break_end: '13:00',
        has_break: false
      }
    })
    return hours
  })

  useEffect(() => {
    loadProfessionals()
  }, [])

  useEffect(() => {
    if (selectedProfessional) {
      loadWorkingHours(selectedProfessional.id)
    }
  }, [selectedProfessional])

  const loadProfessionals = async () => {
    try {
      setLoading(true)
      const response = await apiService.getProfessionals()
      setProfessionals(Array.isArray(response) ? response : [])
      if (response.length > 0 && !selectedProfessional) {
        setSelectedProfessional(response[0])
      }
    } catch (err) {
      console.error('Error loading professionals:', err)
      setError('Erro ao carregar profissionais')
    } finally {
      setLoading(false)
    }
  }

  const loadWorkingHours = async (professionalId) => {
    try {
      // Por enquanto, vamos usar localStorage para armazenar horários
      // Em produção, isso deveria vir de uma API
      const stored = localStorage.getItem(`working_hours_${professionalId}`)
      if (stored) {
        setWorkingHours(JSON.parse(stored))
      } else {
        // Horários padrão: Segunda a Sexta, 9h às 18h
        const defaultHours = { ...workingHours }
        DAYS_OF_WEEK.slice(0, 5).forEach(day => {
          defaultHours[day.value] = {
            enabled: true,
            start_time: '09:00',
            end_time: '18:00',
            break_start: '12:00',
            break_end: '13:00',
            has_break: true
          }
        })
        setWorkingHours(defaultHours)
      }
    } catch (err) {
      console.error('Error loading working hours:', err)
    }
  }

  const handleDayChange = (day, field, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    if (!selectedProfessional) return

    try {
      setSaving(true)
      setError(null)

      // Salvar no localStorage (em produção, salvar via API)
      localStorage.setItem(
        `working_hours_${selectedProfessional.id}`,
        JSON.stringify(workingHours)
      )

      // Aqui você pode adicionar uma chamada à API quando o backend estiver pronto
      // await apiService.updateProfessionalWorkingHours(selectedProfessional.id, workingHours)

      alert('Horários salvos com sucesso!')
    } catch (err) {
      console.error('Error saving working hours:', err)
      setError('Erro ao salvar horários')
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
        {/* Header - Bold Typography */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-2 responsive-text-xl">
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
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Horários
                </>
              )}
            </Button>
          )}
        </div>

        {/* Professional Selector - Modern Style */}
        <FluidSection
          title="Selecione o Profissional"
          subtitle="Escolha o profissional para configurar os horários"
          gradient="from-blue-500 to-cyan-500"
        >
          <div className="space-y-2">
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
          </div>
        </FluidSection>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Working Hours Table - Modern Style */}
      {selectedProfessional && (
        <FluidSection
          title={`Horários de ${selectedProfessional.name}`}
          subtitle="Configure os horários de trabalho para cada dia da semana"
          gradient="from-[#5B7A9E] to-[#6B8FA3]"
          icon={Clock}
        >
            <>
              {/* Mobile: Cards Layout */}
              <div className="block md:hidden space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const dayHours = workingHours[day.value]
                  return (
                    <Card 
                      key={day.value}
                      className={cn(
                        "hover:shadow-md transition-shadow",
                        dayHours.enabled ? "border-green-200" : "border-gray-200 opacity-60"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">
                              {day.label}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge 
                                variant={dayHours.enabled ? 'default' : 'secondary'} 
                                className="text-xs"
                              >
                                {dayHours.enabled ? 'Ativo' : 'Inativo'}
                              </Badge>
                              {dayHours.enabled && dayHours.has_break && (
                                <Badge variant="outline" className="text-xs">
                                  Com Intervalo
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={dayHours.enabled}
                                onChange={(e) =>
                                  handleDayChange(day.value, 'enabled', e.target.checked)
                                }
                                className="w-5 h-5 text-green-600 rounded"
                              />
                            </label>
                          </div>
                        </div>
                        
                        {dayHours.enabled ? (
                          <>
                            <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t mb-3">
                              <div>
                                <Label className="text-xs text-gray-600 mb-1 block">Início</Label>
                                <Input
                                  type="time"
                                  value={dayHours.start_time}
                                  onChange={(e) =>
                                    handleDayChange(day.value, 'start_time', e.target.value)
                                  }
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600 mb-1 block">Fim</Label>
                                <Input
                                  type="time"
                                  value={dayHours.end_time}
                                  onChange={(e) =>
                                    handleDayChange(day.value, 'end_time', e.target.value)
                                  }
                                  className="w-full"
                                />
                              </div>
                            </div>

                            <div className="pt-3 border-t">
                              <div className="flex items-center justify-between mb-3">
                                <Label className="text-sm font-medium text-gray-700">
                                  Tem intervalo?
                                </Label>
                                <input
                                  type="checkbox"
                                  checked={dayHours.has_break}
                                  onChange={(e) =>
                                    handleDayChange(day.value, 'has_break', e.target.checked)
                                  }
                                  className="w-4 h-4 text-green-600 rounded"
                                />
                              </div>
                              
                              {dayHours.has_break && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs text-gray-600 mb-1 block">Início Intervalo</Label>
                                    <Input
                                      type="time"
                                      value={dayHours.break_start}
                                      onChange={(e) =>
                                        handleDayChange(day.value, 'break_start', e.target.value)
                                      }
                                      className="w-full"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-600 mb-1 block">Fim Intervalo</Label>
                                    <Input
                                      type="time"
                                      value={dayHours.break_end}
                                      onChange={(e) =>
                                        handleDayChange(day.value, 'break_end', e.target.value)
                                      }
                                      className="w-full"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4 text-gray-400 text-sm">
                            Dia desativado
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Desktop: Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dia da Semana</TableHead>
                      <TableHead>Ativo</TableHead>
                      <TableHead>Horário Início</TableHead>
                      <TableHead>Horário Fim</TableHead>
                      <TableHead>Intervalo</TableHead>
                      <TableHead>Início Intervalo</TableHead>
                      <TableHead>Fim Intervalo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DAYS_OF_WEEK.map((day) => {
                      const dayHours = workingHours[day.value]
                      return (
                        <TableRow key={day.value}>
                          <TableCell className="font-medium">
                            {day.label}
                          </TableCell>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={dayHours.enabled}
                              onChange={(e) =>
                                handleDayChange(day.value, 'enabled', e.target.checked)
                              }
                              className="w-4 h-4 text-green-600 rounded"
                            />
                          </TableCell>
                          <TableCell>
                            {dayHours.enabled ? (
                              <Input
                                type="time"
                                value={dayHours.start_time}
                                onChange={(e) =>
                                  handleDayChange(day.value, 'start_time', e.target.value)
                                }
                                className="w-32"
                              />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {dayHours.enabled ? (
                              <Input
                                type="time"
                                value={dayHours.end_time}
                                onChange={(e) =>
                                  handleDayChange(day.value, 'end_time', e.target.value)
                                }
                                className="w-32"
                              />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {dayHours.enabled ? (
                              <input
                                type="checkbox"
                                checked={dayHours.has_break}
                                onChange={(e) =>
                                  handleDayChange(day.value, 'has_break', e.target.checked)
                                }
                                className="w-4 h-4 text-green-600 rounded"
                              />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {dayHours.enabled && dayHours.has_break ? (
                              <Input
                                type="time"
                                value={dayHours.break_start}
                                onChange={(e) =>
                                  handleDayChange(day.value, 'break_start', e.target.value)
                                }
                                className="w-32"
                              />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {dayHours.enabled && dayHours.has_break ? (
                              <Input
                                type="time"
                                value={dayHours.break_end}
                                onChange={(e) =>
                                  handleDayChange(day.value, 'break_end', e.target.value)
                                }
                                className="w-32"
                              />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
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

