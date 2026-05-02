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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import {
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  Loader2,
  RefreshCw,
  Receipt
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useReports, useReport } from '../hooks/useReports'
import { format } from 'date-fns'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

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
    })
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
      // Priorizar relatórios essenciais
      const essentialReports = ['dre', 'extract', 'income_expense']
      const firstEssential = reports.find(r => essentialReports.includes(r.id))
      setSelectedReport(firstEssential?.id || reports[0].id)
    }
  }, [reports, selectedReport])

  // Reset pagination when changing reports
  useEffect(() => {
    if (selectedReport === 'extract') {
      setExtractPage(1)
    }
  }, [selectedReport, startDate, endDate, selectedBankAccount])

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
  
  // Melhorar mensagem de erro
  const getErrorMessage = (error) => {
    if (!error) return null
    
    // Se for erro de rede
    if (error.message?.includes('fetch') || error.message?.includes('Network')) {
      return 'Erro de conexão. Verifique se o servidor está rodando.'
    }
    
    // Se for erro 401 (não autorizado)
    if (error.status === 401) {
      return 'Sessão expirada. Por favor, faça login novamente.'
    }
    
    // Se for erro 404
    if (error.status === 404) {
      return 'Relatório não encontrado.'
    }
    
    // Se for erro 500
    if (error.status === 500) {
      // Mensagem mais específica do servidor se disponível
      if (error.data?.message) {
        return error.data.message
      }
      if (error.data?.error) {
        return error.data.error
      }
      return 'Erro interno do servidor. O relatório pode estar temporariamente indisponível. Tente novamente em alguns instantes.'
    }
    
    // Mensagem personalizada do servidor
    if (error.message) {
      return error.message
    }
    
    // Erro genérico
    return 'Erro ao carregar dados do relatório. Tente novamente.'
  }
  
  const error = getErrorMessage(reportError)
  
  // Update extract pagination info
  const extractHasMore = selectedReport === 'extract' && reportData?.pagination?.has_more || false

  const renderDre = () => {
    if (!reportData) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
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
      <div className="space-y-6">
        <Card className="rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle>Demonstração de Resultados do Exercício (DRE)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 mt-6">
            <div className="space-y-4">
              {dreItems.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex justify-between items-center p-6 rounded-xl border",
                    item.type === 'revenue' && "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/50",
                    item.type === 'expense' && "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50",
                    item.type === 'result' && "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50",
                    item.type === 'final' && "bg-[#E8F0F5] dark:bg-gray-800 border-2 border-[#5B7A9E] dark:border-gray-700 font-bold"
                  )}
                >
                  <span className={cn(
                    "text-base",
                    item.type === 'final' && 'text-lg'
                  )}>{item.label}</span>
                  <span className={cn(
                    "font-semibold text-base",
                    item.type === 'final' && 'text-lg'
                  )}>
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


  const renderExtract = () => {
    if (!reportData || !reportData.items) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p>Nenhum dado disponível para este relatório</p>
        </div>
      )
    }

    const { items, totals } = reportData

    return (
      <div className="space-y-6">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Extrato Bancário</CardTitle>
          </CardHeader>
          <CardContent className="mt-6">
            <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-6`}>
                <div>
                  <p className={`text-gray-600 dark:text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Saldo Anterior</p>
                  <p className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>
                    {formatCurrency(totals?.previous_balance || 0)}
                  </p>
                </div>
                <div>
                  <p className={`text-gray-600 dark:text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Total Receitas</p>
                  <p className={`font-bold text-green-600 dark:text-green-400 ${isMobile ? 'text-base' : 'text-lg'}`}>
                    {formatCurrency(totals?.total_revenues || 0)}
                  </p>
                </div>
                <div>
                  <p className={`text-gray-600 dark:text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Total Despesas</p>
                  <p className={`font-bold text-red-600 dark:text-red-400 ${isMobile ? 'text-base' : 'text-lg'}`}>
                    {formatCurrency(Math.abs(totals?.total_expenses || 0))}
                  </p>
                </div>
                <div>
                  <p className={`text-gray-600 dark:text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Saldo Final</p>
                  <p className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>
                    {formatCurrency(totals?.final_balance || 0)}
                  </p>
                </div>
              </div>
            </div>

            <>
              {/* Mobile: Cards Layout */}
              <div className="block md:hidden space-y-4">
                {items && items.length > 0 ? (
                  items.map((item, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow rounded-xl">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-gray-900 dark:text-white whitespace-pre-line break-words">
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
                              item.value >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            )}>
                              {item.value >= 0 ? '+' : ''}{formatCurrency(item.value || 0)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                      <p className="text-gray-500 dark:text-gray-400">Nenhuma transação encontrada no período selecionado</p>
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
                          <TableCell className={item.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
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
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
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
                <div className="text-sm text-gray-600 dark:text-gray-400">
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

  const renderIncomeExpense = () => {
    if (!reportData) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p>Nenhum dado disponível para este relatório</p>
        </div>
      )
    }

    const { income, expenses, net, savings_rate } = reportData

    return (
      <div className="space-y-6">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/50">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Total de Receitas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(income || 0)}
                </p>
              </div>
              <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/50">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Total de Despesas</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(expenses || 0)}
                </p>
              </div>
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Saldo Líquido</p>
                <p className={`text-2xl font-bold ${(net || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(net || 0)}
                </p>
              </div>
              <div className="p-6 bg-[#E8F0F5] dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Taxa de Poupança</p>
                <p className="text-2xl font-bold text-[#5B7A9E] dark:text-gray-300">
                  {savings_rate?.toFixed(2) || '0.00'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600 dark:text-gray-400">Carregando relatório...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-800 dark:text-red-200 mb-1">Erro ao carregar relatório</p>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">{error}</p>
              {reportError?.status && (
                <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                  Código: {reportError.status}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchReport()}
                className="mt-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        </div>
      )
    }

    if (selectedReport && !reportData && !loading) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p>Nenhum dado disponível para este relatório no período selecionado</p>
          <p className="text-sm mt-2">Tente selecionar outro período ou relatório</p>
        </div>
      )
    }

    if (!selectedReport) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p>Selecione um relatório para visualizar</p>
        </div>
      )
    }

    switch (selectedReport) {
      case 'dre':
        return renderDre()
      case 'extract':
        return renderExtract()
      case 'income_expense':
        return renderIncomeExpense()
      default:
        return (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>Relatório não implementado ainda</p>
          </div>
        )
    }
  }

  // Filtrar apenas relatórios essenciais para MVP
  const essentialReports = reports.filter(r => 
    ['dre', 'extract', 'income_expense'].includes(r.id)
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="space-y-10 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Relatórios Financeiros
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Análise financeira da barbearia
            </p>
          </div>
          <Button 
            onClick={() => refetchReport()} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Filters */}
        <Card className="rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle>Filtros de Período</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  Data Inicial
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  Data Final
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              {selectedReport === 'extract' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
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
          </CardContent>
        </Card>

        {/* Reports Selection */}
        <Card className="rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle>Selecione um Relatório</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {essentialReports.map((report) => {
                const isSelected = selectedReport === report.id
                const getIcon = () => {
                  const iconClass = `w-6 h-6 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`
                  switch (report.id) {
                    case 'dre': return <Receipt className={iconClass} />
                    case 'extract': return <FileText className={iconClass} />
                    case 'income_expense': return <TrendingUp className={iconClass} />
                    default: return <FileText className={iconClass} />
                  }
                }
                return (
                  <Card
                    key={report.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      isSelected && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    )}
                    onClick={() => setSelectedReport(report.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className="mb-1">
                          {getIcon()}
                        </div>
                        <p className={cn(
                          "text-sm font-semibold",
                          isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                        )}>
                          {report.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{report.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {selectedReport && (
          <Card className="rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle>
                {essentialReports.find(r => r.id === selectedReport)?.name || 'Relatório'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 mt-6">
              {renderReportContent()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
