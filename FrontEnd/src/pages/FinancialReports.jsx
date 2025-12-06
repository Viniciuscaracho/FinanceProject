import { useState, useEffect, useCallback } from 'react'
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import {
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Loader2,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Receipt
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useReports, useReport } from '../hooks/useReports'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { StatCard, FluidSection } from '@/components/design'

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']

export function FinancialReports() {
  const isMobile = useIsMobile()
  
  // Date filters
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd')
  )

  // Additional filters for extract
  const [selectedBankAccount, setSelectedBankAccount] = useState('all')
  const [bankAccounts, setBankAccounts] = useState([])
  
  // Pagination for extract
  const [extractPage, setExtractPage] = useState(1)
  const [extractPerPage] = useState(100)

  // React Query hooks
  const { data: reports = [], isLoading: reportsLoading } = useReports()
  const [selectedReport, setSelectedReport] = useState(null)

  // Report params
  const reportParams = {
    start_date: startDate,
    end_date: endDate,
    ...(selectedReport === 'extract' && {
      bank_account_ids: selectedBankAccount !== 'all' ? [selectedBankAccount] : [],
      page: extractPage,
      per_page: extractPerPage
    }),
    ...(selectedReport === 'per_category' || selectedReport === 'per_description' || selectedReport === 'per_period' ? {
      transaction_type: 'expense'
    } : {})
  }

  const { 
    data: reportData, 
    isLoading: reportLoading, 
    error: reportError,
    refetch: refetchReport
  } = useReport(selectedReport, reportParams, {
    enabled: !!selectedReport && !!startDate && !!endDate
  })

  // Set initial selected report when reports load
  useEffect(() => {
    if (reports.length > 0 && !selectedReport) {
      setSelectedReport(reports[0].id)
    }
  }, [reports, selectedReport])

  // Reset pagination when changing reports
  useEffect(() => {
    if (selectedReport === 'extract') {
      setExtractPage(1)
    }
  }, [selectedReport, startDate, endDate, selectedBankAccount])

  // Debug: Log report data changes
  useEffect(() => {
    console.log('📊 Report Data Changed:', {
      selectedReport,
      reportData,
      reportLoading,
      reportError,
      reportParams,
      hasData: !!reportData,
      dataKeys: reportData ? Object.keys(reportData) : []
    })
  }, [selectedReport, reportData, reportLoading, reportError, reportParams])

  // Load bank accounts
  useEffect(() => {
    const loadBankAccounts = async () => {
      try {
        const response = await apiService.getBankAccounts()
        setBankAccounts(response.bank_accounts || [])
      } catch (err) {
        console.error('Error loading bank accounts:', err)
      }
    }
    loadBankAccounts()
  }, [])

  const loading = reportsLoading || reportLoading
  const error = reportError ? `Erro ao carregar dados do relatório: ${reportError.message || 'Erro desconhecido'}` : null
  
  // Update extract pagination info
  const extractHasMore = selectedReport === 'extract' && reportData?.pagination?.has_more || false

  const formatCurrency = (cents, currency = 'BRL') => {
    // Tratar NaN e valores inválidos
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

  const renderDre = () => {
    if (!reportData) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado disponível para este relatório</p>
        </div>
      )
    }

    const {
      gross_income,
      taxes,
      variable_expense,
      fixed_expense,
      payroll,
      gross_profit,
      operating_profit,
      result
    } = reportData

    const dreItems = [
      { label: 'Receita Bruta', value: gross_income, type: 'revenue' },
      { label: '(-) Impostos', value: taxes, type: 'expense' },
      { label: '= Lucro Bruto', value: gross_profit, type: 'result' },
      { label: '(-) Despesas Variáveis', value: variable_expense, type: 'expense' },
      { label: '= Lucro Operacional', value: operating_profit, type: 'result' },
      { label: '(-) Despesas Fixas', value: fixed_expense, type: 'expense' },
      { label: '(-) Folha de Pagamento', value: payroll, type: 'expense' },
      { label: '= Resultado Líquido', value: result, type: 'final' }
    ]

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Demonstração de Resultados do Exercício (DRE)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dreItems.map((item, index) => (
                <div
                  key={index}
                  className={`
                    flex justify-between items-center p-3 rounded-lg
                    ${item.type === 'revenue' ? 'bg-green-50' : ''}
                    ${item.type === 'expense' ? 'bg-red-50' : ''}
                    ${item.type === 'result' ? 'bg-blue-50' : ''}
                    ${item.type === 'final' ? 'bg-[#E8F0F5] font-bold' : ''}
                  `}
                >
                  <span className={item.type === 'final' ? 'text-lg' : ''}>{item.label}</span>
                  <span className={`font-semibold ${item.type === 'final' ? 'text-lg' : ''}`}>
                    {formatCurrency(item.value?.cents || 0, item.value?.currency || 'BRL')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderExtract = () => {
    if (!reportData || !reportData.items) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado disponível para este relatório</p>
        </div>
      )
    }

    const { items, totals } = reportData

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Extrato Bancário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-4`}>
                <div>
                  <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Saldo Anterior</p>
                  <p className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>
                    {formatCurrency(totals?.previous_balance || 0)}
                  </p>
                </div>
                <div>
                  <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Total Receitas</p>
                  <p className={`font-bold text-green-600 ${isMobile ? 'text-base' : 'text-lg'}`}>
                    {formatCurrency(totals?.total_revenues || 0)}
                  </p>
                </div>
                <div>
                  <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Total Despesas</p>
                  <p className={`font-bold text-red-600 ${isMobile ? 'text-base' : 'text-lg'}`}>
                    {formatCurrency(Math.abs(totals?.total_expenses || 0))}
                  </p>
                </div>
                <div>
                  <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Saldo Final</p>
                  <p className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>
                    {formatCurrency(totals?.final_balance || 0)}
                  </p>
                </div>
              </div>
            </div>

            <>
              {/* Mobile: Cards Layout */}
              <div className="block md:hidden space-y-3">
                {items && items.length > 0 ? (
                  items.map((item, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-gray-900 whitespace-pre-line break-words">
                              {item.description || 'Sem descrição'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {item.category && (
                                <Badge variant="outline" className="text-xs">
                                  {item.category}
                                </Badge>
                              )}
                              <Badge variant={item.paid ? 'default' : 'secondary'} className="text-xs">
                                {item.paid ? 'Pago' : 'Pendente'}
                              </Badge>
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <p className={cn(
                              "text-lg font-bold",
                              item.value >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {item.value >= 0 ? '+' : ''}{formatCurrency(item.value || 0)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-3 border-t">
                          <div>
                            <span className="font-medium">Data:</span>{' '}
                            {item.date}
                          </div>
                          <div>
                            <span className="font-medium">Saldo:</span>{' '}
                            {formatCurrency(item.balance || 0)}
                          </div>
                          {item.contact && (
                            <div className="col-span-2">
                              <span className="font-medium">Contato:</span>{' '}
                              {item.contact}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-500">Nenhuma transação encontrada no período selecionado</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Desktop: Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items && items.length > 0 ? (
                      items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.date}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.category || '-'}</TableCell>
                          <TableCell>{item.contact || '-'}</TableCell>
                          <TableCell className={item.value >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(item.value || 0)}
                          </TableCell>
                          <TableCell>{formatCurrency(item.balance || 0)}</TableCell>
                          <TableCell>
                            <Badge variant={item.paid ? 'default' : 'secondary'}>
                              {item.paid ? 'Pago' : 'Pendente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Nenhuma transação encontrada no período selecionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
            
            {/* Pagination for Extract */}
            {reportData?.pagination && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Página {reportData.pagination.page} de {Math.ceil((reportData.pagination.total_items || 0) / reportData.pagination.per_page)}
                  {' '}({reportData.pagination.total_items || 0} itens)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExtractPage(p => Math.max(1, p - 1))}
                    disabled={extractPage === 1 || loading}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExtractPage(p => p + 1)}
                    disabled={!extractHasMore || loading}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderFinancialHistory = () => {
    if (!reportData || !reportData.chart_data) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado disponível para o período selecionado</p>
        </div>
      )
    }

    const { chart_data, totals } = reportData

    // Preparar dados para o gráfico - com verificação robusta
    let chartData = []
    try {
      if (Array.isArray(chart_data) && chart_data.length > 0) {
        const firstData = chart_data[0]?.data
        const secondData = chart_data[1]?.data
        
        if (firstData && typeof firstData === 'object') {
          chartData = Object.keys(firstData).map(key => ({
            period: key,
            receitas: firstData[key] || 0,
            despesas: secondData?.[key] || 0
          }))
        }
      } else if (chart_data && typeof chart_data === 'object' && !Array.isArray(chart_data)) {
        // Se chart_data for um objeto direto
        const firstData = chart_data.revenue || chart_data.receitas || {}
        const secondData = chart_data.expense || chart_data.despesas || {}
        
        const allKeys = new Set([...Object.keys(firstData), ...Object.keys(secondData)])
        chartData = Array.from(allKeys).map(key => ({
          period: key,
          receitas: firstData[key] || 0,
          despesas: secondData[key] || 0
        }))
      }
    } catch (error) {
      console.error('Error processing chart_data:', error)
      chartData = []
    }

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Histórico Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Receitas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals?.revenue || totals?.revenue?.cents || 0)}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totals?.expense || totals?.expense?.cents || 0)}
                </p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? 'end' : 'middle'}
                  height={isMobile ? 80 : 30}
                />
                <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                <Tooltip 
                  formatter={(value) => {
                    // Os valores já vêm em reais (divididos por 100), então precisamos converter para centavos
                    return formatCurrency(value * 100)
                  }} 
                />
                {!isMobile && <Legend />}
                <Line type="monotone" dataKey="receitas" stroke="#10b981" name="Receitas" />
                <Line type="monotone" dataKey="despesas" stroke="#ef4444" name="Despesas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderPerCategory = () => {
    if (!reportData || !reportData.items) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado disponível para este relatório</p>
        </div>
      )
    }

    const { chart_data, items, total } = reportData

    // Verificar se items é um objeto ou array e converter adequadamente
    let itemsObj = items
    if (Array.isArray(items)) {
      // Se items for um array, converter para objeto
      itemsObj = items.reduce((acc, item) => {
        const key = item.name || item.category || item.id || 'Sem nome'
        const value = item.value || item.total_amount || item.amount || 0
        acc[key] = value
        return acc
      }, {})
    } else if (!items || typeof items !== 'object') {
      itemsObj = {}
    }

    // Preparar dados para gráfico de pizza
    const pieData = Object.entries(itemsObj).slice(0, 6).map(([name, value]) => ({
      name: name || 'Sem nome',
      value: typeof value === 'number' ? value : (value?.cents || value?.value || 0)
    }))

    // Preparar dados para gráfico de barras
    const barData = Object.entries(itemsObj).slice(0, 10).map(([name, value]) => ({
      name: (name || 'Sem nome').length > 20 ? (name || 'Sem nome').substring(0, 20) + '...' : (name || 'Sem nome'),
      value: typeof value === 'number' ? value : (value?.cents || value?.value || 0)
    }))

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">
                {total && (total.cents !== undefined || typeof total === 'number') 
                  ? formatCurrency(total) 
                  : 'R$ 0,00'}
              </p>
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={isMobile ? false : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={isMobile ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value * 100)} />
                  {isMobile && <Legend />}
                </PieChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={isMobile ? -90 : -45} 
                    textAnchor="end" 
                    height={isMobile ? 120 : 100}
                    tick={{ fontSize: isMobile ? 8 : 12 }}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(value * 100)} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Percentual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(itemsObj).slice(0, 10).map(([name, value]) => {
                    const valueInCents = typeof value === 'number' ? value * 100 : (value?.cents || 0)
                    const totalInCents = total?.cents || (typeof total === 'number' ? total * 100 : 0)
                    const percentage = totalInCents > 0 ? ((valueInCents / totalInCents) * 100).toFixed(2) : 0
                    return (
                      <TableRow key={name}>
                        <TableCell>{name || 'Sem categoria'}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(valueInCents)}
                        </TableCell>
                        <TableCell>
                          {percentage}%
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderPerDescription = () => {
    if (!reportData || !reportData.items) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado disponível para este relatório</p>
        </div>
      )
    }

    const { items, total } = reportData

    // Verificar se items é um objeto ou array e converter adequadamente
    let itemsObj = items
    if (Array.isArray(items)) {
      itemsObj = items.reduce((acc, item) => {
        const key = item.description || item.name || item.id || 'Sem descrição'
        const value = item.value || item.total_amount || item.amount || 0
        acc[key] = value
        return acc
      }, {})
    } else if (!items || typeof items !== 'object') {
      itemsObj = {}
    }

    const barData = Object.entries(itemsObj).slice(0, 10).map(([name, value]) => ({
      name: (name || 'Sem descrição').length > 30 ? (name || 'Sem descrição').substring(0, 30) + '...' : (name || 'Sem descrição'),
      value: typeof value === 'number' ? value : (value?.cents || value?.value || 0)
    }))

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">
                {total && (total.cents !== undefined || typeof total === 'number') 
                  ? formatCurrency(total) 
                  : 'R$ 0,00'}
              </p>
            </div>

            <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={isMobile ? -90 : -45} 
                  textAnchor="end" 
                  height={isMobile ? 140 : 120}
                  tick={{ fontSize: isMobile ? 8 : 12 }}
                />
                <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value * 100)} />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(itemsObj).slice(0, 20).map(([name, value]) => {
                    const valueInCents = typeof value === 'number' ? value * 100 : (value?.cents || 0)
                    return (
                      <TableRow key={name}>
                        <TableCell>{name || 'Sem descrição'}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(valueInCents)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderPerPeriod = () => {
    if (!reportData || !reportData.items) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado disponível para este relatório</p>
        </div>
      )
    }

    const { items, total, same_month } = reportData

    // Verificar se items é um objeto ou array e converter adequadamente
    let itemsObj = items
    if (Array.isArray(items)) {
      itemsObj = items.reduce((acc, item) => {
        const key = item.period || item.name || item.id || 'Sem período'
        const value = item.value || item.total_amount || item.amount || 0
        acc[key] = value
        return acc
      }, {})
    } else if (!items || typeof items !== 'object') {
      itemsObj = {}
    }

    const chartData = Object.entries(itemsObj).map(([period, value]) => ({
      period: period || 'Sem período',
      valor: typeof value === 'number' ? value : (value?.cents || value?.value || 0)
    }))

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">
                {total && (total.cents !== undefined || typeof total === 'number') 
                  ? formatCurrency(total) 
                  : 'R$ 0,00'}
              </p>
            </div>

            <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  angle={isMobile ? (same_month ? -45 : -90) : (same_month ? 0 : -45)} 
                  textAnchor={isMobile ? 'end' : (same_month ? 'middle' : 'end')} 
                  height={isMobile ? 100 : (same_month ? 60 : 100)}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value * 100)} />
                <Bar dataKey="valor" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(itemsObj).map(([period, value]) => {
                    const valueInCents = typeof value === 'number' ? value * 100 : (value?.cents || 0)
                    return (
                      <TableRow key={period}>
                        <TableCell>{period || 'Sem período'}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(valueInCents)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderIncomeExpense = () => {
    if (!reportData) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado disponível para este relatório</p>
        </div>
      )
    }

    const { income, expenses, net, savings_rate } = reportData

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Total de Receitas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(income || 0)}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Total de Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(expenses || 0)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Saldo Líquido</p>
                <p className={`text-2xl font-bold ${(net || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(net || 0)}
                </p>
              </div>
              <div className="p-4 bg-[#E8F0F5] rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Taxa de Poupança</p>
                <p className="text-2xl font-bold text-[#5B7A9E]">
                  {savings_rate?.toFixed(2) || '0.00'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderCategoryAnalysis = () => {
    if (!reportData || !reportData.categories) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado disponível para este relatório</p>
        </div>
      )
    }

    const { categories } = reportData

    // Garantir que categories é um array
    const categoriesArray = Array.isArray(categories) ? categories : []

    const chartData = categoriesArray.slice(0, 10).map(cat => {
      const name = cat?.name || 'Sem categoria'
      const value = cat?.total_amount || cat?.amount || (cat?.total_amount?.cents || 0)
      return {
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        value: typeof value === 'number' ? value : (value?.cents || 0),
        count: cat?.transaction_count || cat?.count || 0
      }
    })

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Análise por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={isMobile ? -90 : -45} 
                  textAnchor="end" 
                  height={isMobile ? 120 : 100}
                  tick={{ fontSize: isMobile ? 8 : 12 }}
                />
                <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriesArray.map((cat, index) => {
                    const catId = cat?.id || cat?.category_id || index
                    const catName = cat?.name || 'Sem categoria'
                    const totalAmount = cat?.total_amount || cat?.amount || 0
                    const amountInCents = typeof totalAmount === 'number' 
                      ? (totalAmount < 1000 ? totalAmount * 100 : totalAmount) // Se for menor que 1000, assume que está em reais
                      : (totalAmount?.cents || 0)
                    const count = cat?.transaction_count || cat?.count || 0
                    
                    return (
                      <TableRow key={catId}>
                        <TableCell>{catName}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(amountInCents)}
                        </TableCell>
                        <TableCell>{count}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderMonthlySummary = () => {
    if (!reportData) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado disponível para este relatório</p>
        </div>
      )
    }

    const { month, total_transactions, income, expenses, balance } = reportData

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Resumo Mensal - {month}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Total de Transações</p>
                <p className="text-2xl font-bold">{total_transactions || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Receitas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(income || 0)}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(expenses || 0)}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Saldo</p>
                <p className={`text-2xl font-bold ${(balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(balance || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderCashFlow = () => {
    if (!reportData || !reportData.cash_flow) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado disponível para este relatório</p>
        </div>
      )
    }

    const { cash_flow } = reportData

    // Garantir que cash_flow é um array
    const cashFlowArray = Array.isArray(cash_flow) ? cash_flow : []

    const chartData = cashFlowArray.map(item => {
      const income = item?.income || item?.income_cents || 0
      const expenses = item?.expenses || item?.expenses_cents || 0
      const balance = item?.balance || item?.balance_cents || 0
      
      return {
        month: item?.month || 'Sem mês',
        receitas: typeof income === 'number' ? (income < 1000 ? income * 100 : income) : (income?.cents || 0),
        despesas: typeof expenses === 'number' ? (expenses < 1000 ? expenses * 100 : expenses) : (expenses?.cents || 0),
        saldo: typeof balance === 'number' ? (balance < 1000 ? balance * 100 : balance) : (balance?.cents || 0)
      }
    })

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={isMobile ? -45 : -45} 
                  textAnchor="end" 
                  height={isMobile ? 100 : 80}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                {!isMobile && <Legend />}
                <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead>Receitas</TableHead>
                    <TableHead>Despesas</TableHead>
                    <TableHead>Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashFlowArray.map((item, index) => {
                    const income = item?.income || item?.income_cents || 0
                    const expenses = item?.expenses || item?.expenses_cents || 0
                    const balance = item?.balance || item?.balance_cents || 0
                    
                    const incomeInCents = typeof income === 'number' 
                      ? (income < 1000 ? income * 100 : income) 
                      : (income?.cents || 0)
                    const expensesInCents = typeof expenses === 'number' 
                      ? (expenses < 1000 ? expenses * 100 : expenses) 
                      : (expenses?.cents || 0)
                    const balanceInCents = typeof balance === 'number' 
                      ? (balance < 1000 ? balance * 100 : balance) 
                      : (balance?.cents || 0)
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>{item?.month || 'Sem mês'}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          {formatCurrency(incomeInCents)}
                        </TableCell>
                        <TableCell className="text-red-600 font-semibold">
                          {formatCurrency(expensesInCents)}
                        </TableCell>
                        <TableCell className={`font-semibold ${balanceInCents >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(balanceInCents)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderAppointmentsIntegrated = () => {
    if (!reportData) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado disponível para o período selecionado</p>
        </div>
      )
    }

    const { summary, chart_data, period_data } = reportData

    // Preparar dados para o gráfico - com verificação robusta
    let chartData = []
    try {
      if (chart_data && typeof chart_data === 'object') {
        const expected = chart_data.expected || {}
        const paid = chart_data.paid || {}
        const unpaid = chart_data.unpaid || {}
        const canceled = chart_data.canceled || {}
        
        // Obter todas as chaves de todos os objetos
        const allPeriods = new Set([
          ...Object.keys(expected),
          ...Object.keys(paid),
          ...Object.keys(unpaid),
          ...Object.keys(canceled)
        ])
        
        chartData = Array.from(allPeriods).map(period => ({
          periodo: period,
          esperado: expected[period] || 0,
          pago: paid[period] || 0,
          nao_pago: unpaid[period] || 0,
          cancelado: canceled[period] || 0
        }))
      }
    } catch (error) {
      console.error('Error processing appointments chart_data:', error)
      chartData = []
    }

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Relatório de Agendamentos Integrado</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Resumo */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Agendamentos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summary?.total_appointments || 0}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Agendamentos Pagos</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary?.paid_appointments || 0}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Agendamentos Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {summary?.unpaid_appointments || 0}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Agendamentos Cancelados</p>
                <p className="text-2xl font-bold text-red-600">
                  {summary?.canceled_appointments || 0}
                </p>
              </div>
            </div>

            {/* Receitas */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#E8F0F5] rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Receita Esperada</p>
                <p className="text-xl font-bold text-[#5B7A9E]">
                  {formatCurrency(summary?.total_expected_revenue)}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Receita Realizada</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(summary?.total_realized_revenue)}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Receita Pendente</p>
                <p className="text-xl font-bold text-yellow-600">
                  {formatCurrency(summary?.pending_revenue)}
                </p>
              </div>
            </div>

            {/* Taxa de Conversão */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Taxa de Conversão</p>
                  <p className="text-2xl font-bold">
                    {summary?.conversion_rate?.toFixed(2) || '0.00'}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Receita Líquida</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary?.net_revenue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Gráfico */}
            {chartData.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Evolução por Período</h3>
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="periodo" 
                      angle={isMobile ? -45 : -45} 
                      textAnchor="end" 
                      height={isMobile ? 100 : 80}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                    />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value * 100)} />
                    {!isMobile && <Legend />}
                    <Bar dataKey="esperado" stackId="a" fill="#3b82f6" name="Esperado" />
                    <Bar dataKey="pago" stackId="a" fill="#10b981" name="Pago" />
                    <Bar dataKey="nao_pago" stackId="a" fill="#f59e0b" name="Não Pago" />
                    <Bar dataKey="cancelado" stackId="a" fill="#ef4444" name="Cancelado" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderFinancialWithAppointments = () => {
    if (!reportData) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado disponível para o período selecionado</p>
        </div>
      )
    }

    const { revenues, expenses, net_balance, metrics } = reportData

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Relatório Financeiro Completo</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Receitas */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Receitas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">De Agendamentos (Pago)</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(revenues?.from_appointments?.paid)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pendente: {formatCurrency(revenues?.from_appointments?.unpaid)}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">De Outras Fontes</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(revenues?.from_other_sources)}
                  </p>
                </div>
                <div className="p-4 bg-[#E8F0F5] rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total de Receitas</p>
                  <p className="text-2xl font-bold text-[#5B7A9E]">
                    {formatCurrency(revenues?.total)}
                  </p>
                </div>
              </div>
            </div>

            {/* Despesas */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Despesas</h3>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total de Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(expenses)}
                </p>
              </div>
            </div>

            {/* Saldo e Métricas */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Saldo Líquido</p>
                <p className={`text-2xl font-bold ${(net_balance?.cents || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(net_balance)}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">% Receitas de Agendamentos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {metrics?.appointment_revenue_percentage?.toFixed(2) || '0.00'}%
                </p>
              </div>
              <div className="p-4 bg-[#E8F0F5] rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Margem de Lucro</p>
                <p className="text-2xl font-bold text-[#5B7A9E]">
                  {metrics?.profit_margin?.toFixed(2) || '0.00'}%
                </p>
              </div>
            </div>

            {/* Gráfico de Comparação */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Comparativo</h3>
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <BarChart data={[{
                  name: 'Receitas',
                  receitas: (() => {
                    const revTotal = revenues?.total
                    if (typeof revTotal === 'number') {
                      return revTotal < 1000 ? revTotal : revTotal / 100
                    }
                    return (revTotal?.cents || 0) / 100
                  })(),
                  despesas: (() => {
                    const exp = expenses
                    if (typeof exp === 'number') {
                      return exp < 1000 ? exp : exp / 100
                    }
                    return (exp?.cents || 0) / 100
                  })(),
                  saldo: (() => {
                    const net = net_balance
                    if (typeof net === 'number') {
                      return net < 1000 ? net : net / 100
                    }
                    return (net?.cents || 0) / 100
                  })()
                }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(value * 100)} />
                  {!isMobile && <Legend />}
                  <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                  <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderReportContent = () => {
    // Log para debug
    console.log('🎨 Rendering report content:', {
      selectedReport,
      loading,
      error,
      hasReportData: !!reportData,
      reportData,
      reportDataKeys: reportData ? Object.keys(reportData) : []
    })

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
            <p className="text-gray-600">Carregando relatório...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p className="font-semibold">Erro ao carregar relatório:</p>
          <p>{error}</p>
        </div>
      )
    }

    // Verificar se há um relatório selecionado mas sem dados ainda
    if (selectedReport && !reportData && !loading) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado disponível para este relatório no período selecionado</p>
          <p className="text-sm mt-2">Tente selecionar outro período ou relatório</p>
        </div>
      )
    }

    // Se não houver relatório selecionado
    if (!selectedReport) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Selecione um relatório para visualizar</p>
        </div>
      )
    }

    switch (selectedReport) {
      case 'dre':
        return renderDre()
      case 'extract':
        return renderExtract()
      case 'financial_history':
        return renderFinancialHistory()
      case 'per_category':
        return renderPerCategory()
      case 'per_description':
        return renderPerDescription()
      case 'per_period':
        return renderPerPeriod()
      case 'income_expense':
        return renderIncomeExpense()
      case 'category_analysis':
        return renderCategoryAnalysis()
      case 'monthly_summary':
        return renderMonthlySummary()
      case 'cash_flow':
        return renderCashFlow()
      case 'appointments_integrated':
        return renderAppointmentsIntegrated()
      case 'financial_with_appointments':
        return renderFinancialWithAppointments()
      default:
        return (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Relatório não implementado ainda</p>
          </div>
        )
    }
  }

  // Agrupar relatórios por categoria
  const reportsByCategory = reports.reduce((acc, report) => {
    const category = report.category || 'geral'
    if (!acc[category]) acc[category] = []
    acc[category].push(report)
    return acc
  }, {})

  // Função para testar todos os relatórios
  const testAllReports = useCallback(async () => {
    const testResults = []
    const testParams = {
      start_date: startDate,
      end_date: endDate
    }

    console.log('🧪 Iniciando testes de todos os relatórios...')
    console.log('📅 Período:', testParams)

    for (const report of reports) {
      try {
        console.log(`\n🔍 Testando: ${report.name} (${report.id})`)
        const startTime = performance.now()
        
        let response
        switch (report.id) {
          case 'dre':
            response = await apiService.getDreReport(testParams.start_date, testParams.end_date, testParams)
            break
          case 'extract':
            response = await apiService.getExtractReport(testParams.start_date, testParams.end_date, {
              bank_account_ids: [],
              page: 1,
              per_page: 100
            })
            break
          case 'financial_history':
            response = await apiService.getFinancialHistoryReport(testParams.start_date, testParams.end_date, testParams)
            break
          case 'per_category':
            response = await apiService.getPerCategoryReport('expense', testParams.start_date, testParams.end_date, testParams)
            break
          case 'per_description':
            response = await apiService.getPerDescriptionReport('expense', testParams.start_date, testParams.end_date, testParams)
            break
          case 'per_period':
            response = await apiService.getPerPeriodReport('expense', testParams.start_date, testParams.end_date, testParams)
            break
          case 'appointments_integrated':
            response = await apiService.getAppointmentsIntegratedReport(testParams.start_date, testParams.end_date)
            break
          case 'financial_with_appointments':
            response = await apiService.getFinancialWithAppointmentsReport(testParams.start_date, testParams.end_date)
            break
          default:
            response = await apiService.getReport(report.id, testParams)
        }

        const endTime = performance.now()
        const duration = ((endTime - startTime) / 1000).toFixed(2)

        // Validar resposta
        const hasData = response?.report?.data || response?.data || response
        const isValid = hasData !== null && hasData !== undefined

        const result = {
          id: report.id,
          name: report.name,
          status: isValid ? '✅ SUCESSO' : '⚠️ SEM DADOS',
          duration: `${duration}s`,
          hasData: isValid,
          error: null
        }

        if (isValid) {
          console.log(`✅ ${report.name}: OK (${duration}s)`)
          if (hasData && typeof hasData === 'object') {
            console.log('   Dados recebidos:', Object.keys(hasData))
          }
        } else {
          console.warn(`⚠️ ${report.name}: Sem dados (${duration}s)`)
        }

        testResults.push(result)
      } catch (error) {
        const result = {
          id: report.id,
          name: report.name,
          status: '❌ ERRO',
          duration: 'N/A',
          hasData: false,
          error: error.message || 'Erro desconhecido'
        }
        console.error(`❌ ${report.name}:`, error.message)
        testResults.push(result)
      }
    }

    // Resumo final
    console.log('\n📊 RESUMO DOS TESTES:')
    console.log('='.repeat(60))
    const success = testResults.filter(r => r.status === '✅ SUCESSO').length
    const noData = testResults.filter(r => r.status === '⚠️ SEM DADOS').length
    const errors = testResults.filter(r => r.status === '❌ ERRO').length

    console.log(`✅ Sucesso: ${success}`)
    console.log(`⚠️ Sem dados: ${noData}`)
    console.log(`❌ Erros: ${errors}`)
    console.log('='.repeat(60))

    testResults.forEach(result => {
      console.log(`${result.status} ${result.name} (${result.duration})`)
      if (result.error) {
        console.log(`   Erro: ${result.error}`)
      }
    })

    // Expor resultados globalmente para inspeção
    window.reportTestResults = testResults

    return testResults
  }, [startDate, endDate, reports])

  // Expor função globalmente para uso no console
  useEffect(() => {
    window.testAllReports = testAllReports
    return () => {
      delete window.testAllReports
    }
  }, [testAllReports])

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="relative z-10 space-y-6 md:space-y-8 p-4 md:p-6 w-full max-w-[calc(100vw-2rem)] sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto">
        {/* Header - Bold Typography */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-2 responsive-text-xl">
              <span className="bg-gradient-to-r from-[#5B7A9E] via-[#6B8FA3] to-[#7A9D96] bg-clip-text text-transparent">
                Relatórios Financeiros
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Análise contábil completa da barbearia
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => refetchReport()} 
              variant="outline" 
              size="sm"
              className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button 
              onClick={testAllReports}
              variant="outline" 
              size="sm"
              className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
              title="Testar todos os relatórios"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Testar Todos
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filters - Modern Style */}
        <FluidSection
          title="Filtros de Período"
          subtitle="Selecione o período para análise"
          gradient="from-[#5B7A9E] to-[#6B8FA3]"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Data Inicial
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Data Final
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {selectedReport === 'extract' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Conta Bancária
                </label>
                <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as contas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as contas</SelectItem>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </FluidSection>

        {/* Reports Selection - Modern Style */}
        <FluidSection
          title="Selecione um Relatório"
          subtitle="Escolha o tipo de relatório para visualizar"
          gradient="from-blue-500 to-cyan-500"
        >
        <div className="space-y-4">
          {/* Report Selection */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {reports.map((report) => {
                const isSelected = selectedReport === report.id
                const getIcon = () => {
                  const iconClass = `w-8 h-8 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`
                  switch (report.id) {
                    case 'dre': return <Receipt className={iconClass} />
                    case 'extract': return <FileText className={iconClass} />
                    case 'financial_history': return <LineChartIcon className={iconClass} />
                    case 'per_category': return <PieChartIcon className={iconClass} />
                    case 'per_description': return <BarChart3 className={iconClass} />
                    case 'per_period': return <Calendar className={iconClass} />
                    case 'income_expense': return <TrendingUp className={iconClass} />
                    case 'category_analysis': return <PieChartIcon className={iconClass} />
                    case 'monthly_summary': return <Calendar className={iconClass} />
                    case 'cash_flow': return <TrendingDown className={iconClass} />
                    case 'appointments_integrated': return <Calendar className={iconClass} />
                    case 'financial_with_appointments': return <DollarSign className={iconClass} />
                    default: return <FileText className={iconClass} />
                  }
                }
                return (
                <Card
                  key={report.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-2">
                      {getIcon()}
                      <p className={`text-sm font-medium ${isSelected ? 'text-blue-700' : ''}`}>{report.name}</p>
                      <p className="text-xs text-gray-500">{report.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )
              })}
            </div>

          {/* Report Content */}
          {selectedReport && (
            <div className="mt-6">
              <FluidSection
                title={reports.find(r => r.id === selectedReport)?.name || 'Relatório'}
                subtitle={reports.find(r => r.id === selectedReport)?.description || ''}
                gradient="from-[#5B7A9E] to-[#6B8FA3]"
              >
                {renderReportContent()}
              </FluidSection>
            </div>
          )}
        </div>
        </FluidSection>
      </div>
    </div>
  )
}

