import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  Mail,
  Phone,
  User,
  Clock
} from 'lucide-react'
import { apiService } from '../lib/api'
import { FluidSection } from '@/components/design'
import { useIsMobile } from '@/hooks/use-mobile'

export function Professionals() {
  const isMobile = useIsMobile()
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProfessional, setEditingProfessional] = useState(null)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [scheduleProfessional, setScheduleProfessional] = useState(null)
  const [scheduleData, setScheduleData] = useState({})
  const [showScheduleConfig, setShowScheduleConfig] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'custom',
    phone_number: '',
    schedule: {
      monday: { enabled: true, start_hour: 9, end_hour: 18 },
      tuesday: { enabled: true, start_hour: 9, end_hour: 18 },
      wednesday: { enabled: true, start_hour: 9, end_hour: 18 },
      thursday: { enabled: true, start_hour: 9, end_hour: 18 },
      friday: { enabled: true, start_hour: 9, end_hour: 18 },
      saturday: { enabled: false, start_hour: 9, end_hour: 18 },
      sunday: { enabled: false, start_hour: 9, end_hour: 18 }
    }
  })

  useEffect(() => {
    loadProfessionals()
  }, [])

  const loadProfessionals = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getProfessionals()
      setProfessionals(Array.isArray(response) ? response : [])
    } catch (err) {
      console.error('Error loading professionals:', err)
      setError('Erro ao carregar profissionais')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (professional = null) => {
    const defaultSchedule = {
      monday: { enabled: true, start_hour: 9, end_hour: 18 },
      tuesday: { enabled: true, start_hour: 9, end_hour: 18 },
      wednesday: { enabled: true, start_hour: 9, end_hour: 18 },
      thursday: { enabled: true, start_hour: 9, end_hour: 18 },
      friday: { enabled: true, start_hour: 9, end_hour: 18 },
      saturday: { enabled: false, start_hour: 9, end_hour: 18 },
      sunday: { enabled: false, start_hour: 9, end_hour: 18 }
    }
    
    if (professional) {
      setEditingProfessional(professional)
      const existingSchedule = professional.schedule || {}
      const mergedSchedule = {}
      Object.keys(defaultSchedule).forEach(day => {
        mergedSchedule[day] = existingSchedule[day] || defaultSchedule[day]
      })
      
      setFormData({
        first_name: professional.first_name || '',
        last_name: professional.last_name || '',
        email: professional.email || '',
        password: '',
        role: professional.role || 'custom',
        phone_number: professional.phone_number || '',
        schedule: mergedSchedule
      })
      setShowScheduleConfig(false)
    } else {
      setEditingProfessional(null)
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'custom',
        phone_number: '',
        schedule: defaultSchedule
      })
      setShowScheduleConfig(false)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProfessional(null)
    setShowScheduleConfig(false)
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'custom',
      phone_number: '',
      schedule: {
        monday: { enabled: true, start_hour: 9, end_hour: 18 },
        tuesday: { enabled: true, start_hour: 9, end_hour: 18 },
        wednesday: { enabled: true, start_hour: 9, end_hour: 18 },
        thursday: { enabled: true, start_hour: 9, end_hour: 18 },
        friday: { enabled: true, start_hour: 9, end_hour: 18 },
        saturday: { enabled: false, start_hour: 9, end_hour: 18 },
        sunday: { enabled: false, start_hour: 9, end_hour: 18 }
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Frontend validation
    if (!formData.first_name || formData.first_name.trim().length < 3) {
      setError('Nome deve ter pelo menos 3 caracteres')
      return
    }
    
    // Validar last_name apenas se fornecido
    if (formData.last_name && formData.last_name.trim().length > 0 && formData.last_name.trim().length < 3) {
      setError('Sobrenome deve ter pelo menos 3 caracteres ou ficar em branco')
      return
    }
    
    if (!formData.email || !formData.email.includes('@')) {
      setError('Email inválido')
      return
    }
    
    try {
      setLoading(true)
      setError(null)

      // Trim whitespace from form data
      const cleanedData = {
        ...formData,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim() || '',
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        schedule: formData.schedule
      }

      if (editingProfessional) {
        await apiService.updateProfessional(editingProfessional.id, cleanedData)
      } else {
        await apiService.createProfessional(cleanedData)
      }

      handleCloseDialog()
      loadProfessionals()
    } catch (err) {
      console.error('Error saving professional:', err)
      // Extract error message from the error object
      const errorMessage = err.message || err.data?.errors?.join(', ') || 'Erro ao salvar profissional'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este profissional?')) {
      return
    }

    try {
      setLoading(true)
      await apiService.deleteProfessional(id)
      loadProfessionals()
    } catch (err) {
      console.error('Error deleting professional:', err)
      setError('Erro ao excluir profissional')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenScheduleDialog = (professional) => {
    setScheduleProfessional(professional)
    // Inicializar com horários existentes ou padrão
    const defaultSchedule = {
      monday: { enabled: true, start_hour: 9, end_hour: 18 },
      tuesday: { enabled: true, start_hour: 9, end_hour: 18 },
      wednesday: { enabled: true, start_hour: 9, end_hour: 18 },
      thursday: { enabled: true, start_hour: 9, end_hour: 18 },
      friday: { enabled: true, start_hour: 9, end_hour: 18 },
      saturday: { enabled: false, start_hour: 9, end_hour: 18 },
      sunday: { enabled: false, start_hour: 9, end_hour: 18 }
    }
    
    const existingSchedule = professional.schedule || {}
    const mergedSchedule = {}
    
    Object.keys(defaultSchedule).forEach(day => {
      mergedSchedule[day] = existingSchedule[day] || defaultSchedule[day]
    })
    
    setScheduleData(mergedSchedule)
    setIsScheduleDialogOpen(true)
  }

  const handleCloseScheduleDialog = () => {
    setIsScheduleDialogOpen(false)
    setScheduleProfessional(null)
    setScheduleData({})
  }

  const handleScheduleChange = (day, field, value) => {
    setScheduleData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: field === 'enabled' ? value : parseInt(value) || 0
      }
    }))
  }

  const handleSaveSchedule = async () => {
    try {
      setLoading(true)
      setError(null)
      await apiService.updateProfessionalSchedule(scheduleProfessional.id, scheduleData)
      handleCloseScheduleDialog()
      loadProfessionals()
    } catch (err) {
      console.error('Error saving schedule:', err)
      setError(err.message || 'Erro ao salvar horários')
    } finally {
      setLoading(false)
    }
  }

  const filteredProfessionals = professionals.filter((prof) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      prof.name?.toLowerCase().includes(searchLower) ||
      prof.email?.toLowerCase().includes(searchLower) ||
      prof.phone_number?.includes(searchTerm)
    )
  })

  if (loading && professionals.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
          <p className="text-gray-600">Carregando profissionais...</p>
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
                Profissionais
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Gerencie os profissionais que trabalham no salão
            </p>
          </div>
          <Button 
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-[#5B7A9E] to-[#6B8FA3] hover:from-[#4A5C7A] hover:to-[#5B7A9E] text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Profissional
          </Button>
        </div>

        {/* Search - Modern Style */}
        <FluidSection
          title="Buscar Profissionais"
          subtitle="Encontre profissionais por nome, email ou telefone"
          gradient="from-blue-500 to-cyan-500"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
            />
          </div>
        </FluidSection>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Professionals Table - Modern Style */}
      <FluidSection
        title="Lista de Profissionais"
        subtitle={`${filteredProfessionals.length} profissional${filteredProfessionals.length !== 1 ? 'is' : ''} encontrado${filteredProfessionals.length !== 1 ? 's' : ''}`}
        gradient="from-[#5B7A9E] to-[#6B8FA3]"
      >
        {filteredProfessionals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum profissional encontrado</p>
          </div>
        ) : (
          <>
            {/* Mobile: Cards Layout */}
            <div className="block md:hidden space-y-3">
              {filteredProfessionals.map((professional) => (
                <div 
                  key={professional.id}
                  className="group/item relative"
                >
                  <div className="absolute -inset-0.5 rounded-2xl blur opacity-10 group-hover/item:opacity-20 transition duration-300 bg-gradient-to-r from-[#5B7A9E] to-[#6B8FA3]" />
                  <div className="relative bg-gradient-to-br from-white/90 to-white/50 dark:from-gray-800/90 dark:to-gray-800/50 backdrop-blur-xl rounded-2xl p-4 border border-white/20 dark:border-gray-700/30 shadow-xl hover:shadow-2xl transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5B7A9E] to-[#6B8FA3] flex items-center justify-center flex-shrink-0 shadow-lg">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-gray-900 dark:text-white truncate">
                            {professional.name}
                          </h3>
                          <Badge variant={professional.role === 'admin' ? 'default' : 'secondary'} className="mt-1 text-xs">
                            {professional.role === 'admin' ? 'Administrador' : 'Profissional'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenScheduleDialog(professional)}
                          title="Configurar horários"
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(professional)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(professional.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 pt-3 border-t">
                      {professional.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{professional.email}</span>
                        </div>
                      )}
                      {professional.phone_number && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{professional.phone_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessionals.map((professional) => (
                    <TableRow key={professional.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{professional.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{professional.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {professional.phone_number ? (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{professional.phone_number}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={professional.role === 'admin' ? 'default' : 'secondary'}>
                          {professional.role === 'admin' ? 'Administrador' : 'Profissional'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenScheduleDialog(professional)}
                            title="Configurar horários"
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(professional)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(professional.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </FluidSection>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
              </DialogTitle>
              <DialogDescription>
                {editingProfessional
                  ? 'Atualize as informações do profissional'
                  : 'Preencha os dados para cadastrar um novo profissional'}
              </DialogDescription>
            </DialogHeader>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-[var(--radius-sm)] text-red-800 text-sm">
                {error}
              </div>
            )}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nome</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Sobrenome (opcional)</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Telefone</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              {!editingProfessional && (
                <div className="space-y-2">
                  <Label htmlFor="password">Senha (opcional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Deixe em branco para gerar automaticamente"
                  />
                </div>
              )}
              {editingProfessional && (
                <div className="space-y-2">
                  <Label htmlFor="password">Nova Senha (opcional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Deixe em branco para não alterar"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Profissional</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {!editingProfessional && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Horários de Trabalho</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowScheduleConfig(!showScheduleConfig)}
                    >
                      {showScheduleConfig ? 'Ocultar' : 'Configurar'}
                    </Button>
                  </div>
                  
                  {showScheduleConfig && (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                        const dayNames = {
                          monday: 'Segunda',
                          tuesday: 'Terça',
                          wednesday: 'Quarta',
                          thursday: 'Quinta',
                          friday: 'Sexta',
                          saturday: 'Sábado',
                          sunday: 'Domingo'
                        }
                        
                        const dayData = formData.schedule[day] || { enabled: false, start_hour: 9, end_hour: 18 }
                        
                        return (
                          <div key={day} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">{dayNames[day]}</Label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={dayData.enabled || false}
                                  onChange={(e) => {
                                    setFormData({
                                      ...formData,
                                      schedule: {
                                        ...formData.schedule,
                                        [day]: {
                                          ...dayData,
                                          enabled: e.target.checked
                                        }
                                      }
                                    })
                                  }}
                                  className="w-4 h-4 rounded"
                                />
                                <span className="text-xs text-gray-600">Trabalha</span>
                              </div>
                            </div>
                            
                            {dayData.enabled && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label htmlFor={`${day}-start`} className="text-xs">Início</Label>
                                  <Select
                                    value={dayData.start_hour?.toString() || '9'}
                                    onValueChange={(value) => {
                                      setFormData({
                                        ...formData,
                                        schedule: {
                                          ...formData.schedule,
                                          [day]: {
                                            ...dayData,
                                            start_hour: parseInt(value)
                                          }
                                        }
                                      })
                                    }}
                                  >
                                    <SelectTrigger id={`${day}-start`} className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 24 }, (_, i) => (
                                        <SelectItem key={i} value={i.toString()}>
                                          {i.toString().padStart(2, '0')}:00
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="space-y-1">
                                  <Label htmlFor={`${day}-end`} className="text-xs">Fim</Label>
                                  <Select
                                    value={dayData.end_hour?.toString() || '18'}
                                    onValueChange={(value) => {
                                      setFormData({
                                        ...formData,
                                        schedule: {
                                          ...formData.schedule,
                                          [day]: {
                                            ...dayData,
                                            end_hour: parseInt(value)
                                          }
                                        }
                                      })
                                    }}
                                  >
                                    <SelectTrigger id={`${day}-end`} className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 24 }, (_, i) => (
                                        <SelectItem key={i} value={i.toString()}>
                                          {i.toString().padStart(2, '0')}:00
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingProfessional ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Configuration Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Configurar Horários - {scheduleProfessional?.name}
            </DialogTitle>
            <DialogDescription>
              Configure os horários de trabalho para cada dia da semana
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
              const dayNames = {
                monday: 'Segunda-feira',
                tuesday: 'Terça-feira',
                wednesday: 'Quarta-feira',
                thursday: 'Quinta-feira',
                friday: 'Sexta-feira',
                saturday: 'Sábado',
                sunday: 'Domingo'
              }
              
              const dayData = scheduleData[day] || { enabled: false, start_hour: 9, end_hour: 18 }
              
              return (
                <div key={day} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-900 dark:text-white">{dayNames[day]}</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={dayData.enabled || false}
                        onChange={(e) => handleScheduleChange(day, 'enabled', e.target.checked)}
                        className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Trabalha neste dia</span>
                    </div>
                  </div>
                  
                  {dayData.enabled && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <Label htmlFor={`${day}-start`} className="text-sm font-medium text-gray-700 dark:text-gray-300">Horário de Início</Label>
                        <Select
                          value={dayData.start_hour?.toString() || '9'}
                          onValueChange={(value) => handleScheduleChange(day, 'start_hour', value)}
                        >
                          <SelectTrigger id={`${day}-start`} className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`${day}-end`} className="text-sm font-medium text-gray-700 dark:text-gray-300">Horário de Término</Label>
                        <Select
                          value={dayData.end_hour?.toString() || '18'}
                          onValueChange={(value) => handleScheduleChange(day, 'end_hour', value)}
                        >
                          <SelectTrigger id={`${day}-end`} className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          <DialogFooter className="mt-6 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={handleCloseScheduleDialog}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveSchedule} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Horários'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}

