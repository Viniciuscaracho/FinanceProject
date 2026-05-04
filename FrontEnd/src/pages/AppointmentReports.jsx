import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Loader2,
  Download,
  RefreshCw,
  FileText,
  Percent,
  BarChart3
} from 'lucide-react'
import { apiService } from '../lib/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useIsMobile } from '@/hooks/use-mobile'
import { StatCard, FluidSection } from '@/components/design'

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']

export function AppointmentReports() {
  const isMobile = useIsMobile()
  const [summary, setSummary] = useState(null)
  const [byProfessional, setByProfessional] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Date filters
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd')
  )
  const [selectedProfessional, setSelectedProfessional] = useState('all')
  const [dateError, setDateError] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadProfessionals()
  }, [])

  useEffect(() => {
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
        // Validar se a diferença não é muito grande (opcional: máximo 1 ano)
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
  }, [startDate, endDate, selectedProfessional])

  const loadProfessionals = async () => {
    try {
      const response = await apiService.getAppointmentProfessionals()
      setProfessionals(Array.isArray(response) ? response : [])
    } catch (err) {
      console.error('Error loading professionals:', err)
    }
  }

  const loadReports = async () => {
    // Validar datas antes de fazer a requisição
    if (dateError) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const professionalId = selectedProfessional !== 'all' ? selectedProfessional : null

      const [summaryResponse, byProfessionalResponse] = await Promise.all([
        apiService.getAppointmentReportsSummary(startDate, endDate),
        apiService.getAppointmentReportsByProfessional(startDate, endDate, professionalId)
      ])

      setSummary(summaryResponse?.summary || null)
      setByProfessional(byProfessionalResponse?.report || [])
    } catch (err) {
      console.error('Error loading reports:', err)
      const errorMessage = err?.response?.data?.error || err?.message || 'Erro ao carregar relatórios. Verifique sua conexão e tente novamente.'
      setError(errorMessage)
      setSummary(null)
      setByProfessional([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(cents / 100)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return format(date, 'dd/MM/yyyy', { locale: ptBR })
    } catch (err) {
      return '-'
    }
  }

  const exportToCSV = () => {
    try {
      setExporting(true)
      
      // Preparar dados para exportação
      const csvRows = []
      
      // Cabeçalho
      csvRows.push([
        'Profissional',
        'Data',
        'Serviço',
        'Cliente',
        'Valor (R$)',
        'Comissão (R$)',
        'Receita Líquida (R$)'
      ].join(','))

      // Dados
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

      // Adicionar resumo
      if (summary) {
        csvRows.push('')
        csvRows.push('RESUMO GERAL')
        csvRows.push([
          'Métrica',
          'Valor'
        ].join(','))
        csvRows.push([
          'Total de Agendamentos',
          summary.total_appointments || 0
        ].join(','))
        csvRows.push([
          'Confirmados',
          summary.confirmed || 0
        ].join(','))
        csvRows.push([
          'Receita Total (R$)',
          (summary.total_revenue?.cents || 0) / 100
        ].join(','))
        csvRows.push([
          'Comissões Totais (R$)',
          (summary.total_commissions?.cents || 0) / 100
        ].join(','))
        csvRows.push([
          'Receita Líquida (R$)',
          (summary.net_revenue?.cents || 0) / 100
        ].join(','))
      }

      // Criar arquivo
      const csvContent = csvRows.join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Nome do arquivo com data
      const fileName = `relatorio_agendamentos_${startDate}_${endDate}.csv`
      link.download = fileName
      link.click()
      
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting CSV:', err)
      setError('Erro ao exportar relatório. Tente novamente.')
    } finally {
      setExporting(false)
    }
  }

  // Prepare chart data
  const professionalChartData = byProfessional.map((prof) => ({
    name: prof.professional?.name || 'N/A',
    receita: (prof.total_revenue?.cents || 0) / 100,
    comissao: (prof.total_commission?.cents || 0) / 100,
    lucro: ((prof.total_revenue?.cents || 0) - (prof.total_commission?.cents || 0)) / 100
  }))

  const revenueDistributionData = byProfessional.map((prof) => ({
    name: prof.professional?.name || 'N/A',
    value: (prof.total_revenue?.cents || 0) / 100
  }))

  const commissionDistributionData = byProfessional.map((prof) => ({
    name: prof.professional?.name || 'N/A',
    value: (prof.total_commission?.cents || 0) / 100
  }))

  if (loading && !summary && !error && !dateError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="relative z-10 space-y-6 md:space-y-8 p-4 md:p-6 w-full max-w-[calc(100vw-2rem)] sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto">
        {/* Header - Bold Typography */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
              <span className="bg-gradient-to-r from-[#5B7A9E] via-[#6B8FA3] to-[#7A9D96] bg-clip-text text-transparent">
                Relatórios de Agendamentos
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Análise de serviços, comissões e repasses
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={loadReports} 
              variant="outline" 
              size="sm"
              disabled={loading || !!dateError}
              className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportToCSV}
            disabled={exporting || !summary || byProfessional.length === 0 || !!dateError}
          >
            <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
            {exporting ? 'Exportando...' : 'Exportar'}
          </Button>
        </div>
      </div>

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
              <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
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
        </CardContent>
      </Card>

      {(error || dateError) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error || dateError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards - Modern Style */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            title="Total de Agendamentos"
            value={summary.total_appointments || 0}
            icon={Calendar}
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

      {/* Net Revenue Card - Modern Style */}
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

      {/* Charts - Modern Style */}
      {byProfessional.length > 0 && !loading && (
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
          {/* Revenue by Professional */}
          <FluidSection
            title="Receita por Profissional"
            subtitle="Análise de receita e comissões"
            gradient="from-blue-500 to-indigo-500"
            icon={BarChart3}
          >
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                <BarChart data={professionalChartData}>
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

          {/* Revenue Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className={isMobile ? "text-base" : ""}>Distribuição de Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                <PieChart>
                  <Pie
                    data={revenueDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={isMobile ? false : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={isMobile ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueDistributionData.map((entry, index) => (
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
          {loading ? (
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

                    {/* Services List */}
                    {prof.appointments && prof.appointments.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Serviços Realizados:</p>
                        
                        {/* Mobile: Cards Layout */}
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

                        {/* Desktop: Table Layout */}
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
                                  <TableCell>
                                    {apt.client || 'N/A'}
                                  </TableCell>
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
      </div>
    </div>
  )
}

