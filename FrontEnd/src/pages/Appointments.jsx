import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard, FluidSection } from '@/components/design'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Phone,
  Plus,
  Edit,
  Trash2,
  Download,
  CalendarDays
} from 'lucide-react'
import { apiService } from '../lib/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { TrendingUp, Percent, BarChart3, FileText } from 'lucide-react'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  canceled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800'
}

const STATUS_LABELS = {
  pending: 'Aguardando Pagamento',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  canceled: 'Cancelado',
  no_show: 'Não Compareceu'
}

const PAYMENT_STATUS_COLORS = {
  pending: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
}

const PAYMENT_STATUS_LABELS = {
  pending: 'Pendente',
  paid: 'Pago',
  failed: 'Falhou',
  refunded: 'Reembolsado'
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']

export function Appointments() {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState('list')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [professionals, setProfessionals] = useState([])
  const [services, setServices] = useState([])
  const [selectedProfessional, setSelectedProfessional] = useState('all')
  
  // Relatórios states
  const [summary, setSummary] = useState(null)
  const [byProfessional, setByProfessional] = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [reportsError, setReportsError] = useState(null)
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd')
  )
  const [selectedProfessionalReport, setSelectedProfessionalReport] = useState('all')
  const [dateError, setDateError] = useState(null)
  const [exporting, setExporting] = useState(false)
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    account_user_id: '',
    service_id: '',
    contact_id: '',
    start_date: undefined,
    start_time: '', // Formato HH:mm
    end_date: undefined,
    end_time: '', // Formato HH:mm
    whatsapp_number: '',
    price_cents: '',
    price_currency: 'BRL',
    status: 'pending',
    payment_status: 'pending'
  })

  useEffect(() => {
    loadProfessionals()
    loadServices()
  }, [])

  useEffect(() => {
    loadAppointments()
  }, [statusFilter, paymentStatusFilter, selectedProfessional])

  useEffect(() => {
    if (activeTab === 'reports') {
      // Validar datas antes de carregar
      let hasError = false
      let errorMessage = null

      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        if (start > end) {
          hasError = true
          errorMessage = 'A data inicial não pode ser maior que a data final'
        } else {
          const diffTime = Math.abs(end - start)
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          if (diffDays > 365) {
            hasError = true
            errorMessage = 'O período selecionado não pode ser maior que 1 ano'
          }
        }
      }
      
      setDateError(errorMessage)
      
      if (!hasError && startDate && endDate) {
        loadReports()
      }
    }
  }, [activeTab, startDate, endDate, selectedProfessionalReport])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters = {}
      if (statusFilter !== 'all') {
        filters.status = statusFilter
      }
      if (paymentStatusFilter !== 'all') {
        filters.payment_status = paymentStatusFilter
      }
      if (selectedProfessional !== 'all') {
        filters.account_user_id = selectedProfessional
      }

      const response = await apiService.getAppointments(filters)
      const appointmentsList = Array.isArray(response) ? response : response.appointments || []
      setAppointments(appointmentsList)
    } catch (err) {
      console.error('Error loading appointments:', err)
      setError('Erro ao carregar agendamentos: ' + (err.message || 'Erro desconhecido'))
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const loadProfessionals = async () => {
    try {
      const response = await apiService.getAppointmentProfessionals()
      setProfessionals(Array.isArray(response) ? response : [])
    } catch (err) {
      console.error('Error loading professionals:', err)
    }
  }

  const loadServices = async () => {
    try {
      const response = await apiService.getAppointmentServices()
      // Garantir que a resposta seja um array, mesmo se vier em formato diferente
      const servicesArray = Array.isArray(response) 
        ? response 
        : (response?.services || response?.data || [])
      setServices(servicesArray)
      console.log('✅ Services loaded:', servicesArray.length, 'services')
    } catch (err) {
      console.error('❌ Error loading services:', err)
      setServices([])
    }
  }

  const loadReports = async () => {
    if (dateError) {
      return
    }

    try {
      setReportsLoading(true)
      setReportsError(null)

      const professionalId = selectedProfessionalReport !== 'all' ? selectedProfessionalReport : null

      const [summaryResponse, byProfessionalResponse] = await Promise.all([
        apiService.getAppointmentReportsSummary(startDate, endDate),
        apiService.getAppointmentReportsByProfessional(startDate, endDate, professionalId)
      ])

      setSummary(summaryResponse?.summary || null)
      setByProfessional(byProfessionalResponse?.report || [])
    } catch (err) {
      console.error('Error loading reports:', err)
      const errorMessage = err?.response?.data?.error || err?.message || 'Erro ao carregar relatórios. Verifique sua conexão e tente novamente.'
      setReportsError(errorMessage)
      setSummary(null)
      setByProfessional([])
    } finally {
      setReportsLoading(false)
    }
  }

  const exportReportsToCSV = () => {
    try {
      setExporting(true)
      
      const csvRows = []
      
      csvRows.push([
        'Profissional',
        'Data',
        'Serviço',
        'Cliente',
        'Valor (R$)',
        'Comissão (R$)',
        'Receita Líquida (R$)'
      ].join(','))

      byProfessional.forEach((prof) => {
        if (prof.appointments && prof.appointments.length > 0) {
          prof.appointments.forEach((apt) => {
            const revenue = (apt.price?.cents || 0) / 100
            const commission = (apt.commission?.cents || 0) / 100
            const netRevenue = revenue - commission
            
            csvRows.push([
              `"${prof.professional.name}"`,
              formatDate(apt.date),
              `"${apt.service || 'N/A'}"`,
              `"${apt.client || 'N/A'}"`,
              revenue.toFixed(2).replace('.', ','),
              commission.toFixed(2).replace('.', ','),
              netRevenue.toFixed(2).replace('.', ',')
            ].join(','))
          })
        }
      })

      if (summary) {
        csvRows.push('')
        csvRows.push('RESUMO GERAL')
        csvRows.push(['Métrica', 'Valor'].join(','))
        csvRows.push(['Total de Agendamentos', summary.total_appointments || 0].join(','))
        csvRows.push(['Confirmados', summary.confirmed || 0].join(','))
        csvRows.push(['Receita Total (R$)', (summary.total_revenue?.cents || 0) / 100].join(','))
        csvRows.push(['Comissões Totais (R$)', (summary.total_commissions?.cents || 0) / 100].join(','))
        csvRows.push(['Receita Líquida (R$)', (summary.net_revenue?.cents || 0) / 100].join(','))
      }

      const csvContent = csvRows.join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const fileName = `relatorio_agendamentos_${startDate}_${endDate}.csv`
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting CSV:', err)
      setReportsError('Erro ao exportar relatório. Tente novamente.')
    } finally {
      setExporting(false)
    }
  }

  const formatCurrency = (cents, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(cents / 100)
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  }

  // Funções para formatar data/hora no padrão brasileiro
  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const parseBrazilianDateTime = (value) => {
    if (!value) return null
    
    // Se já estiver no formato ISO (datetime-local ou ISO string)
    if (value.includes('T') || value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return value.includes('T') ? value : `${value}T00:00`
    }
    
    // Remover espaços extras e normalizar
    const cleaned = value.trim()
    
    // Formato esperado: dd/mm/yyyy HH:mm ou dd/mm/yyyy HHmm ou dd/mm/yyyy
    const dateTimeMatch = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})(\s+(\d{2}):?(\d{2})?)?$/)
    if (dateTimeMatch) {
      const [, day, month, year, , hours, minutes] = dateTimeMatch
      // Validação básica
      const monthNum = parseInt(month)
      const dayNum = parseInt(day)
      const yearNum = parseInt(year)
      
      if (monthNum > 12 || monthNum < 1 || dayNum > 31 || dayNum < 1 || yearNum < 1900 || yearNum > 2100) {
        return null
      }
      
      // Validar hora se fornecida
      const hoursValue = hours || '00'
      const minutesValue = minutes || '00'
      const hoursNum = parseInt(hoursValue)
      const minutesNum = parseInt(minutesValue)
      
      if (hoursNum > 23 || minutesNum > 59 || hoursNum < 0 || minutesNum < 0) {
        return null
      }
      
      // Converter para formato ISO
      return `${year}-${month}-${day}T${hoursValue.padStart(2, '0')}:${minutesValue.padStart(2, '0')}`
    }
    
    return null
  }

  const applyDateTimeMask = (value) => {
    if (!value) return ''
    
    // Se já estiver no formato brasileiro completo, retornar como está
    if (value.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)) {
      return value
    }
    
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length === 0) {
      return ''
    } else if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    } else if (numbers.length <= 8) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)} ${numbers.slice(8)}`
    } else if (numbers.length <= 12) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)} ${numbers.slice(8, 10)}:${numbers.slice(10)}`
    } else {
      // Limitar a 16 caracteres (dd/mm/yyyy HH:mm)
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)} ${numbers.slice(8, 10)}:${numbers.slice(10, 12)}`
    }
  }

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch = 
      !searchTerm ||
      apt.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.client?.whatsapp_number?.includes(searchTerm) ||
      apt.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.professional?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      setLoading(true)
      await apiService.updateAppointment(appointmentId, { status: newStatus })
      await loadAppointments()
    } catch (err) {
      console.error('Error updating appointment:', err)
      alert('Erro ao atualizar status do agendamento: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentStatusChange = async (appointmentId, newPaymentStatus) => {
    try {
      setLoading(true)
      await apiService.updateAppointment(appointmentId, { payment_status: newPaymentStatus })
      await loadAppointments()
    } catch (err) {
      console.error('Error updating payment status:', err)
      alert('Erro ao atualizar status de pagamento: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setFormData({
      account_user_id: '',
      service_id: '',
      contact_id: '',
      start_date: undefined,
      start_time: '',
      end_date: undefined,
      end_time: '',
      whatsapp_number: '',
      price_cents: '',
      price_currency: 'BRL',
      status: 'pending',
      payment_status: 'pending'
    })
    setIsCreateDialogOpen(true)
  }

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment)
    
    // Normalizar status
    let statusValue = appointment.status
    if (typeof statusValue === 'number') {
      const statusKeys = Object.keys(STATUS_LABELS)
      statusValue = statusKeys[statusValue] || 'pending'
    } else if (typeof statusValue === 'string') {
      statusValue = statusValue
    } else {
      statusValue = 'pending'
    }

    // Normalizar payment_status
    let paymentStatusValue = appointment.payment_status
    if (typeof paymentStatusValue === 'number') {
      const paymentStatusKeys = Object.keys(PAYMENT_STATUS_LABELS)
      paymentStatusValue = paymentStatusKeys[paymentStatusValue] || 'pending'
    } else if (typeof paymentStatusValue === 'string') {
      paymentStatusValue = paymentStatusValue
    } else {
      paymentStatusValue = 'pending'
    }

    // Formatar preço
    const priceCents = appointment.price?.cents || appointment.price_cents || 0
    const priceValue = priceCents > 0 ? (priceCents / 100).toString() : ''

    // Separar data e hora
    let startDate = undefined
    let startTime = ''
    let endDate = undefined
    let endTime = ''
    
    if (appointment.start_time) {
      const startDateObj = new Date(appointment.start_time)
      startDate = startDateObj
      startTime = format(startDateObj, 'HH:mm')
    }
    
    if (appointment.end_time) {
      const endDateObj = new Date(appointment.end_time)
      endDate = endDateObj
      endTime = format(endDateObj, 'HH:mm')
    }

    setFormData({
      account_user_id: appointment.professional?.id?.toString() || appointment.account_user_id?.toString() || '',
      service_id: appointment.service?.id?.toString() || appointment.service_id?.toString() || '',
      contact_id: appointment.client?.id?.toString() || appointment.contact_id?.toString() || '',
      start_date: startDate,
      start_time: startTime,
      end_date: endDate,
      end_time: endTime,
      whatsapp_number: appointment.client?.whatsapp_number || appointment.whatsapp_number || '',
      price_cents: priceValue,
      price_currency: appointment.price?.currency || appointment.price_currency || 'BRL',
      status: statusValue,
      payment_status: paymentStatusValue
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = (appointment) => {
    setSelectedAppointment(appointment)
    setIsDeleteDialogOpen(true)
  }

  const findOrCreateContact = async (whatsappNumber) => {
    try {
      // Normalizar número (remover caracteres não numéricos)
      const normalizedNumber = whatsappNumber.replace(/\D/g, '')
      if (!normalizedNumber) return null
      
      // Buscar contato existente pelo número (buscar em várias páginas se necessário)
      let page = 1
      let foundContact = null
      
      while (page <= 5 && !foundContact) { // Limitar a 5 páginas para não sobrecarregar
        const contactsResponse = await apiService.getContacts(page, 100)
        const contacts = contactsResponse.contacts || []
        
        foundContact = contacts.find(c => {
          const contactNumber = (c.cell_phone_number || c.phone_number || '').replace(/\D/g, '')
          return contactNumber === normalizedNumber
        })
        
        if (foundContact) break
        
        // Se não há mais páginas, parar
        if (!contactsResponse.meta || page >= contactsResponse.meta.total_pages) break
        page++
      }

      return foundContact?.id || null
      // O backend criará automaticamente se não encontrarmos
    } catch (err) {
      console.error('Error finding contact:', err)
      // Se falhar, retornar null e deixar o backend criar
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Buscar contato existente pelo WhatsApp (opcional, o backend também cria automaticamente)
      let contactId = formData.contact_id
      if (!contactId && formData.whatsapp_number) {
        contactId = await findOrCreateContact(formData.whatsapp_number)
      }

      const submitData = {
        ...formData
      }

      // Converter preço para centavos
      if (submitData.price_cents) {
        submitData.price_cents = Math.round(parseFloat(submitData.price_cents) * 100)
      }

      // Combinar data e hora para criar datetime ISO
      if (submitData.start_date) {
        const date = new Date(submitData.start_date)
        const [hours = '00', minutes = '00'] = (submitData.start_time || '00:00').split(':')
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        submitData.start_time = date.toISOString()
      } else if (!submitData.start_time) {
        alert('Por favor, selecione a data de início')
        setIsSubmitting(false)
        return
      }
      
      if (submitData.end_date) {
        const date = new Date(submitData.end_date)
        const [hours = '00', minutes = '00'] = (submitData.end_time || '00:00').split(':')
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        submitData.end_time = date.toISOString()
      } else if (!submitData.end_time) {
        alert('Por favor, selecione a data de fim')
        setIsSubmitting(false)
        return
      }

      // Remover campos auxiliares do submit
      delete submitData.start_date
      delete submitData.end_date

      // Adicionar contact_id se encontrado
      if (contactId) {
        submitData.contact_id = contactId
      }

      // Remover campos vazios ou inválidos
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null || submitData[key] === undefined) {
          delete submitData[key]
        }
      })

      if (isEditDialogOpen && selectedAppointment) {
        await apiService.updateAppointment(selectedAppointment.id, submitData)
      } else {
        await apiService.createAppointment(submitData)
      }

      setIsCreateDialogOpen(false)
      setIsEditDialogOpen(false)
      setSelectedAppointment(null)
      await loadAppointments()
    } catch (err) {
      console.error('Error saving appointment:', err)
      const errorMessage = err.message || 'Erro desconhecido'
      alert('Erro ao salvar agendamento: ' + errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedAppointment) return
    
    setIsSubmitting(true)
    try {
      await apiService.deleteAppointment(selectedAppointment.id)
      setIsDeleteDialogOpen(false)
      setSelectedAppointment(null)
      await loadAppointments()
    } catch (err) {
      console.error('Error deleting appointment:', err)
      alert('Erro ao deletar agendamento: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = () => {
    try {
      if (filteredAppointments.length === 0) {
        alert('Não há agendamentos para exportar')
        return
      }

      // Criar CSV dos agendamentos filtrados
      const headers = ['Cliente', 'Serviço', 'Profissional', 'Data/Hora', 'Valor', 'Status', 'Pagamento']
      
      const rows = filteredAppointments.map(apt => {
        // Normalizar status
        let statusKey = apt.status
        if (typeof statusKey === 'number') {
          const statusKeys = Object.keys(STATUS_LABELS)
          statusKey = statusKeys[statusKey] || 'pending'
        }
        
        // Normalizar payment_status
        let paymentStatusKey = apt.payment_status
        if (typeof paymentStatusKey === 'number') {
          const paymentStatusKeys = Object.keys(PAYMENT_STATUS_LABELS)
          paymentStatusKey = paymentStatusKeys[paymentStatusKey] || 'pending'
        }

        return [
          apt.client?.name || apt.client?.whatsapp_number || apt.whatsapp_number || 'N/A',
          apt.service?.name || 'N/A',
          apt.professional?.name || 'N/A',
          formatDateTime(apt.start_time),
          formatCurrency(apt.price?.cents || apt.price_cents || 0, apt.price?.currency || apt.price_currency || 'BRL'),
          STATUS_LABELS[statusKey] || statusKey || 'N/A',
          PAYMENT_STATUS_LABELS[paymentStatusKey] || paymentStatusKey || 'N/A'
        ]
      })

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
          // Escapar aspas e quebras de linha no CSV
          const cellStr = String(cell || '').replace(/"/g, '""')
          return `"${cellStr}"`
        }).join(','))
      ].join('\n')

      // Adicionar BOM para Excel reconhecer UTF-8
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `agendamentos_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting appointments:', err)
      alert('Erro ao exportar agendamentos: ' + (err.message || 'Erro desconhecido'))
    }
  }

  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
          <p className="text-text-secondary">Carregando agendamentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="relative z-10 space-y-6 w-full max-w-full min-w-0 overflow-x-hidden p-4 md:p-6">
        {/* Header - Bold Typography */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 responsive-text-xl text-text-primary">
              Agendamentos
            </h1>
            <p className="text-lg text-text-secondary">
              Gerencie todos os agendamentos do sistema
            </p>
          </div>
        <div className="flex gap-2">
          <div className="flex gap-3">
            <Button 
              onClick={handleExport} 
              variant="outline" 
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button 
              onClick={loadAppointments} 
              variant="outline" 
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleCreate}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Agendamento
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Agendamento</DialogTitle>
                <DialogDescription>
                  Preencha os dados para criar um novo agendamento
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="professional">Profissional *</Label>
                      <Select
                        value={formData.account_user_id}
                        onValueChange={(value) => setFormData({ ...formData, account_user_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o profissional" />
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
                    <div className="space-y-2">
                      <Label htmlFor="service">Serviço *</Label>
                      <Select
                        value={formData.service_id}
                        onValueChange={(value) => {
                          const service = services.find(s => s.id.toString() === value)
                          setFormData({
                            ...formData,
                            service_id: value,
                            price_cents: service?.selling_price_cents ? (service.selling_price_cents / 100).toString() : formData.price_cents
                          })
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {service.name} - {formatCurrency(service.selling_price_cents || 0)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Data de Início *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.start_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.start_date ? (
                              format(formData.start_date, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.start_date}
                            onSelect={(date) => setFormData({ ...formData, start_date: date })}
                            locale={ptBR}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Horário de Início *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="end_date">Data de Fim *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.end_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.end_date ? (
                              format(formData.end_date, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.end_date}
                            onSelect={(date) => setFormData({ ...formData, end_date: date })}
                            locale={ptBR}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">Horário de Fim *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number">WhatsApp do Cliente *</Label>
                    <Input
                      id="whatsapp_number"
                      type="tel"
                      placeholder="11987654321"
                      value={formData.whatsapp_number}
                      onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price_cents">Valor (R$) *</Label>
                      <Input
                        id="price_cents"
                        type="number"
                        step="0.01"
                        placeholder="30.00"
                        value={formData.price_cents}
                        onChange={(e) => setFormData({ ...formData, price_cents: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Lista Tab */}
        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
      <FluidSection
        title="Filtros"
        subtitle="Busque e filtre agendamentos"
        gradient="from-cyan-500 to-blue-500"
      >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por cliente, serviço ou profissional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status do Agendamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Aguardando Pagamento</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
                <SelectItem value="no_show">Não Compareceu</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status do Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Pagamentos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger>
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Profissionais</SelectItem>
                {professionals.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id.toString()}>
                    {prof.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
      </FluidSection>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Total"
          value={appointments.length.toString()}
          icon={CalendarIcon}
          gradient="from-blue-400 to-cyan-500"
        />

        <StatCard
          title="Confirmados"
          value={appointments.filter(a => a.status === 'confirmed' || a.status === 1).length.toString()}
          icon={CheckCircle}
          gradient="from-green-400 to-emerald-500"
        />

        <StatCard
          title="Aguardando Pagamento"
          value={appointments.filter(a => a.status === 'pending' || a.status === 0).length.toString()}
          icon={AlertCircle}
          gradient="from-yellow-400 to-orange-500"
        />
          <StatCard
            title="Receita Total"
            value={formatCurrency(
              appointments
                .filter(a => a.payment_status === 'paid' || a.payment_status === 1)
                .reduce((sum, a) => sum + (a.price?.cents || 0), 0)
            )}
            icon={DollarSign}
            gradient="from-[#6B8FA3] to-[#5B7A9E]"
          />
      </div>

      {/* Appointments Table */}
      <FluidSection
        title={`Lista de Agendamentos (${filteredAppointments.length})`}
        subtitle="Gerencie seus agendamentos"
        gradient="from-[#5B7A9E] to-[#6B8FA3]"
      >
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <>
              {/* Mobile: Cards Layout */}
              <div className="block md:hidden space-y-3">
                {filteredAppointments.map((appointment) => {
                  const status = typeof appointment.status === 'number' 
                    ? Object.keys(STATUS_LABELS)[appointment.status] 
                    : appointment.status
                  const paymentStatus = typeof appointment.payment_status === 'number'
                    ? Object.keys(PAYMENT_STATUS_LABELS)[appointment.payment_status]
                    : appointment.payment_status

                  return (
                    <Card 
                      key={appointment.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleEdit(appointment)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-gray-900 whitespace-pre-line break-words">
                              {appointment.client?.name || appointment.client?.whatsapp_number || 'N/A'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {appointment.service?.name || 'N/A'}
                              </Badge>
                              <Badge className={cn("text-xs", STATUS_COLORS[status] || 'bg-gray-100 text-gray-800')}>
                                {STATUS_LABELS[status] || status}
                              </Badge>
                              <Badge className={cn("text-xs", PAYMENT_STATUS_COLORS[paymentStatus] || 'bg-gray-100 text-gray-800')}>
                                {PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus}
                              </Badge>
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <p className="text-lg font-bold text-[#5B7A9E]">
                              {formatCurrency(
                                appointment.price?.cents || 0,
                                appointment.price?.currency || 'BRL'
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-3 border-t">
                          <div>
                            <span className="font-medium">Profissional:</span>{' '}
                            {appointment.professional?.name || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Data:</span>{' '}
                            {formatDate(appointment.start_time)}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Horário:</span>{' '}
                            {format(new Date(appointment.start_time), 'HH:mm', { locale: ptBR })} - {format(new Date(appointment.end_time), 'HH:mm', { locale: ptBR })}
                          </div>
                          {appointment.client?.whatsapp_number && (
                            <div className="col-span-2">
                              <span className="font-medium">Telefone:</span>{' '}
                              {appointment.client.whatsapp_number}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                          {appointment.payment_link_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(appointment.payment_link_url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(appointment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog open={isDeleteDialogOpen && selectedAppointment?.id === appointment.id} onOpenChange={(open) => {
                            if (!open) {
                              setIsDeleteDialogOpen(false)
                              setSelectedAppointment(null)
                            }
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(appointment)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleConfirmDelete}
                                  className="bg-red-500 hover:bg-red-600"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Excluindo...
                                    </>
                                  ) : (
                                    'Excluir'
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => {
                    const status = typeof appointment.status === 'number' 
                      ? Object.keys(STATUS_LABELS)[appointment.status] 
                      : appointment.status
                    const paymentStatus = typeof appointment.payment_status === 'number'
                      ? Object.keys(PAYMENT_STATUS_LABELS)[appointment.payment_status]
                      : appointment.payment_status

                    return (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-medium">
                                {appointment.client?.name || appointment.client?.whatsapp_number || 'N/A'}
                              </p>
                              {appointment.client?.whatsapp_number && (
                                <p className="text-xs text-gray-500 flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {appointment.client.whatsapp_number}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Scissors className="w-4 h-4 text-gray-400" />
                            <span>{appointment.service?.name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span>{appointment.professional?.name || 'N/A'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm">{formatDate(appointment.start_time)}</p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(appointment.start_time), 'HH:mm', { locale: ptBR })} - {format(new Date(appointment.end_time), 'HH:mm', { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {formatCurrency(
                              appointment.price?.cents || 0,
                              appointment.price?.currency || 'BRL'
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={status}
                            onValueChange={(value) => handleStatusChange(appointment.id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={paymentStatus}
                            onValueChange={(value) => handlePaymentStatusChange(appointment.id, value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {appointment.payment_link_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(appointment.payment_link_url, '_blank')}
                                title="Link de Pagamento"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(appointment)}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog open={isDeleteDialogOpen && selectedAppointment?.id === appointment.id} onOpenChange={(open) => {
                              if (!open) {
                                setIsDeleteDialogOpen(false)
                                setSelectedAppointment(null)
                              }
                            }}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(appointment)}
                                  title="Deletar"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleConfirmDelete}
                                    className="bg-red-500 hover:bg-red-600"
                                    disabled={isSubmitting}
                                  >
                                    {isSubmitting ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Excluindo...
                                      </>
                                    ) : (
                                      'Excluir'
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              </div>
            </>
          )}
      </FluidSection>
        </TabsContent>

        {/* Relatórios Tab */}
        <TabsContent value="reports" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Data Inicial
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      setDateError(null)
                    }}
                    max={endDate}
                  />
                  {dateError && startDate && endDate && new Date(startDate) > new Date(endDate) && (
                    <p className="text-xs text-red-600 mt-1">{dateError}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Data Final
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      setDateError(null)
                    }}
                    min={startDate}
                  />
                  {dateError && startDate && endDate && new Date(startDate) <= new Date(endDate) && (
                    <p className="text-xs text-red-600 mt-1">{dateError}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Profissional
                  </label>
                  <Select value={selectedProfessionalReport} onValueChange={setSelectedProfessionalReport}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os Profissionais" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Profissionais</SelectItem>
                      {professionals.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id.toString()}>
                          {prof.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <Button 
                  onClick={loadReports} 
                  variant="outline" 
                  size="sm"
                  disabled={reportsLoading || !!dateError}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${reportsLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportReportsToCSV}
                  disabled={exporting || !summary || byProfessional.length === 0 || !!dateError}
                >
                  <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
                  {exporting ? 'Exportando...' : 'Exportar'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {(reportsError || dateError) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{reportsError || dateError}</p>
                </div>
              </div>
            </div>
          )}

          {reportsLoading && !summary && !reportsError && !dateError ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
                <p className="text-gray-600">Carregando relatórios...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <StatCard
                    title="Total de Agendamentos"
                    value={summary.total_appointments || 0}
                    icon={CalendarIcon}
                    gradient="from-blue-400 to-cyan-500"
                  />
                  <StatCard
                    title="Confirmados"
                    value={summary.confirmed || 0}
                    icon={TrendingUp}
                    gradient="from-green-400 to-emerald-500"
                  />
                  <StatCard
                    title="Receita Total"
                    value={formatCurrency(summary.total_revenue?.cents || 0, summary.total_revenue?.currency || 'BRL')}
                    icon={DollarSign}
                    gradient="from-[#6B8FA3] to-[#5B7A9E]"
                  />
                  <StatCard
                    title="Comissões Totais"
                    value={formatCurrency(summary.total_commissions?.cents || 0, summary.total_commissions?.currency || 'BRL')}
                    icon={Percent}
                    gradient="from-orange-400 to-amber-500"
                  />
                </div>
              )}

              {/* Net Revenue Card */}
              {summary && (
                <FluidSection
                  title="Receita Líquida"
                  subtitle="Receita Total - Comissões"
                  gradient="from-green-500 to-emerald-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-black text-gray-900 dark:text-white">
                        {formatCurrency(summary.net_revenue?.cents || 0, summary.net_revenue?.currency || 'BRL')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Margem</p>
                      <p className="text-2xl font-black text-green-700 dark:text-green-400">
                        {(summary.total_revenue?.cents || 0) > 0
                          ? (((summary.net_revenue?.cents || 0) / (summary.total_revenue?.cents || 1)) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </FluidSection>
              )}

              {/* Charts */}
              {byProfessional.length > 0 && !reportsLoading && (
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
                  <FluidSection
                    title="Receita por Profissional"
                    subtitle="Análise de receita e comissões"
                    gradient="from-blue-500 to-indigo-500"
                    icon={BarChart3}
                  >
                    <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                      <BarChart data={byProfessional.map((prof) => ({
                        name: prof.professional?.name || 'N/A',
                        receita: (prof.total_revenue?.cents || 0) / 100,
                        comissao: (prof.total_commission?.cents || 0) / 100,
                        lucro: ((prof.total_revenue?.cents || 0) - (prof.total_commission?.cents || 0)) / 100
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                          angle={isMobile ? -45 : 0}
                          textAnchor={isMobile ? 'end' : 'middle'}
                          height={isMobile ? 80 : 30}
                        />
                        <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <Tooltip formatter={(value) => formatCurrency(value * 100)} />
                        {!isMobile && <Legend />}
                        <Bar dataKey="receita" fill="#10b981" name="Receita" />
                        <Bar dataKey="comissao" fill="#f59e0b" name="Comissão" />
                        <Bar dataKey="lucro" fill="#3b82f6" name="Lucro Líquido" />
                      </BarChart>
                    </ResponsiveContainer>
                    {isMobile && (
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-xs">Receita</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                          <span className="text-xs">Comissão</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span className="text-xs">Lucro</span>
                        </div>
                      </div>
                    )}
                  </FluidSection>

                  <Card>
                    <CardHeader>
                      <CardTitle className={isMobile ? "text-base" : ""}>Distribuição de Receita</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                        <PieChart>
                          <Pie
                            data={byProfessional.map((prof) => ({
                              name: prof.professional?.name || 'N/A',
                              value: (prof.total_revenue?.cents || 0) / 100
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={isMobile ? false : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={isMobile ? 60 : 80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {byProfessional.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value * 100)} />
                          {isMobile && <Legend />}
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Detailed Report by Professional */}
              <Card>
                <CardHeader>
                  <CardTitle>Relatório Detalhado por Profissional</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-green-500 mr-2" />
                      <p className="text-gray-600">Carregando detalhes...</p>
                    </div>
                  ) : byProfessional.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-base font-medium mb-2">Nenhum dado disponível</p>
                      <p className="text-sm">Não há agendamentos para o período selecionado</p>
                      {startDate && endDate && (
                        <p className="text-xs text-gray-400 mt-2">
                          Período: {formatDate(startDate)} até {formatDate(endDate)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {byProfessional.map((prof) => (
                        <Card key={prof.professional.id} className="border-l-4 border-l-blue-500">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">{prof.professional?.name || 'N/A'}</CardTitle>
                                <p className="text-sm text-gray-600 mt-1">
                                  {prof.total_services || 0} agendamento(s) no período
                                </p>
                              </div>
                              <Badge variant="outline" className="text-lg">
                                {prof.total_services || 0} serviços
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-4'} gap-4 mb-4`}>
                              <div>
                                <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Receita Bruta</p>
                                <p className={`font-bold text-green-600 ${isMobile ? 'text-base' : 'text-xl'}`}>
                                  {formatCurrency(prof.total_revenue?.cents || 0, prof.total_revenue?.currency || 'BRL')}
                                </p>
                              </div>
                              <div>
                                <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Comissão</p>
                                <p className={`font-bold text-orange-600 ${isMobile ? 'text-base' : 'text-xl'}`}>
                                  {formatCurrency(prof.total_commission?.cents || 0, prof.total_commission?.currency || 'BRL')}
                                </p>
                                {!isMobile && (
                                  <p className="text-xs text-gray-500">
                                    {(prof.total_revenue?.cents || 0) > 0
                                      ? (((prof.total_commission?.cents || 0) / (prof.total_revenue?.cents || 1)) * 100).toFixed(1)
                                      : 0}% da receita
                                  </p>
                                )}
                              </div>
                              <div>
                                <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Repasse Pendente</p>
                                <p className={`font-bold text-blue-600 ${isMobile ? 'text-base' : 'text-xl'}`}>
                                  {formatCurrency(prof.pending_payout?.cents || 0, prof.pending_payout?.currency || 'BRL')}
                                </p>
                              </div>
                              <div>
                                <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Receita Líquida</p>
                                <p className={`font-bold text-[#5B7A9E] ${isMobile ? 'text-base' : 'text-xl'}`}>
                                  {formatCurrency(
                                    (prof.total_revenue?.cents || 0) - (prof.total_commission?.cents || 0),
                                    prof.total_revenue?.currency || 'BRL'
                                  )}
                                </p>
                              </div>
                            </div>

                            {prof.appointments && prof.appointments.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Serviços Realizados:</p>
                                
                                <div className="block md:hidden space-y-3">
                                  {prof.appointments.map((apt) => (
                                    <Card key={apt.id} className="hover:shadow-md transition-shadow">
                                      <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-base text-gray-900 whitespace-pre-line break-words">
                                              {apt.service || 'N/A'}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                              {apt.client && (
                                                <Badge variant="outline" className="text-xs">
                                                  {apt.client}
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                          <div className="ml-4 text-right">
                                            <p className="text-lg font-bold text-[#5B7A9E]">
                                              {formatCurrency(apt.price?.cents || 0, apt.price?.currency || 'BRL')}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-3 border-t">
                                          <div>
                                            <span className="font-medium">Data:</span>{' '}
                                            {formatDate(apt.date)}
                                          </div>
                                          {(apt.commission?.cents || 0) > 0 && (
                                            <div>
                                              <span className="font-medium">Comissão:</span>{' '}
                                              {formatCurrency(apt.commission.cents, apt.commission.currency || 'BRL')}
                                            </div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>

                                <div className="hidden md:block overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Serviço</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Comissão</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {prof.appointments.map((apt) => (
                                        <TableRow key={apt.id}>
                                          <TableCell>{formatDate(apt.date)}</TableCell>
                                          <TableCell>{apt.service}</TableCell>
                                          <TableCell>{apt.client || 'N/A'}</TableCell>
                                          <TableCell>
                                            {formatCurrency(apt.price?.cents || 0, apt.price?.currency || 'BRL')}
                                          </TableCell>
                                          <TableCell>
                                            {formatCurrency(
                                              apt.commission?.cents || 0,
                                              apt.commission?.currency || 'BRL'
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
            <DialogDescription>
              Atualize os dados do agendamento
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_professional">Profissional *</Label>
                  <Select
                    value={formData.account_user_id}
                    onValueChange={(value) => setFormData({ ...formData, account_user_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o profissional" />
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
                <div className="space-y-2">
                  <Label htmlFor="edit_service">Serviço *</Label>
                  <Select
                    value={formData.service_id}
                    onValueChange={(value) => {
                      const service = services.find(s => s.id.toString() === value)
                      setFormData({
                        ...formData,
                        service_id: value,
                        price_cents: service?.selling_price_cents ? (service.selling_price_cents / 100).toString() : formData.price_cents
                      })
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name} - {formatCurrency(service.selling_price_cents || 0)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_start_date">Data de Início *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.start_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? (
                          format(formData.start_date, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => setFormData({ ...formData, start_date: date })}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_start_time">Horário de Início *</Label>
                  <Input
                    id="edit_start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_end_date">Data de Fim *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.end_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.end_date ? (
                          format(formData.end_date, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.end_date}
                        onSelect={(date) => setFormData({ ...formData, end_date: date })}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_end_time">Horário de Fim *</Label>
                  <Input
                    id="edit_end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_whatsapp_number">WhatsApp do Cliente *</Label>
                <Input
                  id="edit_whatsapp_number"
                  type="tel"
                  placeholder="11987654321"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_price_cents">Valor (R$) *</Label>
                  <Input
                    id="edit_price_cents"
                    type="number"
                    step="0.01"
                    placeholder="30.00"
                    value={formData.price_cents}
                    onChange={(e) => setFormData({ ...formData, price_cents: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_payment_status">Status Pagamento</Label>
                  <Select
                    value={formData.payment_status}
                    onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
