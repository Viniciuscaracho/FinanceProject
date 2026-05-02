import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  DollarSign,
  Users,
  Calendar,
  Loader2,
  RefreshCw,
  TrendingUp,
  FileText,
  Percent
} from 'lucide-react'
import { apiService } from '../lib/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
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
import { BarChart3 } from 'lucide-react'

export function Commissions() {
  const isMobile = useIsMobile()
  
  // Date filters
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd')
  )

  // Professional filter
  const [selectedProfessional, setSelectedProfessional] = useState('all')
  const [professionals, setProfessionals] = useState([])

  // Data
  const [commissionsData, setCommissionsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load professionals
  useEffect(() => {
    const loadProfessionals = async () => {
      try {
        const response = await apiService.getProfessionals()
        setProfessionals(response.professionals || [])
      } catch (err) {
        console.error('Error loading professionals:', err)
      }
    }
    loadProfessionals()
  }, [])

  // Load commissions
  const loadCommissions = async () => {
    setLoading(true)
    setError(null)
    try {
      const professionalId = selectedProfessional !== 'all' ? selectedProfessional : null
      const response = await apiService.getCommissions(startDate, endDate, professionalId)
      setCommissionsData(response)
    } catch (err) {
      console.error('Error loading commissions:', err)
      setError(err.message || 'Erro ao carregar comissões')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCommissions()
  }, [startDate, endDate, selectedProfessional])

  const formatCurrency = (cents, currency = 'BRL') => {
    if (typeof cents === 'object' && cents.cents !== undefined) {
      const value = cents.cents || 0
      if (isNaN(value) || !isFinite(value)) return 'R$ 0,00'
      return cents.formatted || new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: cents.currency || 'BRL'
      }).format(value / 100)
    }
    const value = cents || 0
    if (isNaN(value) || !isFinite(value)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value / 100)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  // Prepare chart data
  const chartData = commissionsData?.commissions?.map(prof => ({
    name: prof.professional.name,
    value: prof.total_commission.cents / 100
  })) || []

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Comissões
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Gerencie e visualize as comissões dos profissionais
          </p>
        </div>
        <Button
          onClick={loadCommissions}
          disabled={loading}
          variant="outline"
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
          )}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Data Inicial
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Data Final
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Profissional
              </label>
              <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os profissionais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os profissionais</SelectItem>
                  {professionals.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id.toString()}>
                      {prof.name || prof.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="rounded-xl border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {commissionsData?.summary && (
        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        )}>
          <Card className="rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total de Comissões
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(commissionsData.summary.total_commissions)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Profissionais
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {commissionsData.summary.total_professionals}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Agendamentos
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {commissionsData.summary.total_appointments}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Período
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                    {format(new Date(commissionsData.summary.period.start_date), 'dd/MM/yyyy')} - {format(new Date(commissionsData.summary.period.end_date), 'dd/MM/yyyy')}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {commissionsData?.commissions && commissionsData.commissions.length > 0 && (
        <div className={cn(
          "grid gap-6",
          isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}>
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Comissões por Profissional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value * 100)}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                  />
                  <Bar dataKey="value" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Distribuição de Comissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value * 100)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Commissions List */}
      {loading ? (
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          </CardContent>
        </Card>
      ) : commissionsData?.commissions && commissionsData.commissions.length > 0 ? (
        <div className="space-y-6">
          {commissionsData.commissions.map((profCommission) => (
            <Card key={profCommission.professional.id} className="rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {profCommission.professional.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {profCommission.professional.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total de Comissões
                    </p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(profCommission.total_commission)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  // Mobile: Cards Layout
                  <div className="space-y-4">
                    {profCommission.commissions.map((commission) => (
                      <Card key={commission.id} className="bg-gray-50 dark:bg-gray-800">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {commission.service}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {commission.client}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600 dark:text-green-400">
                                  {formatCurrency(commission.commission_amount)}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <Badge variant="outline" className="text-xs">
                                {formatDate(commission.date)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {commission.commission_type === 'percentage' ? 'Percentual' : 'Fixo'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {commission.commission_type === 'percentage' 
                                  ? `${commission.commission_value}%`
                                  : formatCurrency(commission.commission_value * 100)}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Valor do agendamento: {formatCurrency(commission.appointment_price)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  // Desktop: Table Layout
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor Agendamento</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor Comissão</TableHead>
                        <TableHead>Comissão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profCommission.commissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell className="font-medium">
                            {commission.service}
                          </TableCell>
                          <TableCell>{commission.client}</TableCell>
                          <TableCell>{formatDate(commission.date)}</TableCell>
                          <TableCell>
                            {formatCurrency(commission.appointment_price)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {commission.commission_type === 'percentage' ? 'Percentual' : 'Fixo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {commission.commission_type === 'percentage' 
                              ? `${commission.commission_value}%`
                              : formatCurrency(commission.commission_value * 100)}
                          </TableCell>
                          <TableCell className="font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(commission.commission_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>Nenhuma comissão encontrada para o período selecionado</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

