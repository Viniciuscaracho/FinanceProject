import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard, FluidSection, ActionCard } from '@/components/design'
import { useIsMobile } from '@/hooks/use-mobile'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Loader2,
  Plus,
  User,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowRight,
  CheckCircle2,
  Circle
} from 'lucide-react'
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
  Cell
} from 'recharts'
import { apiService } from '../lib/api'
import { useUpdateTransaction } from '@/hooks/useTransactions'
import { cn } from '@/lib/utils'

const monthlyData = [
  { name: 'Jan', receitas: 4000, despesas: 2400 },
  { name: 'Fev', receitas: 3000, despesas: 1398 },
  { name: 'Mar', receitas: 2000, despesas: 9800 },
  { name: 'Abr', receitas: 2780, despesas: 3908 },
  { name: 'Mai', receitas: 1890, despesas: 4800 },
  { name: 'Jun', receitas: 2390, despesas: 3800 },
  { name: 'Jul', receitas: 3000, despesas: 2473 },
]

const categoryData = [
  { name: 'Despesas Variáveis', value: 2473.47, color: '#ef4444' },
  { name: 'Despesas Fixas', value: 0, color: '#f97316' },
  { name: 'Impostos', value: 0, color: '#eab308' },
]

export function Dashboard() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [selectedPeriod, setSelectedPeriod] = useState('Julho/2025')
  const [animatedValues, setAnimatedValues] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    resultado: 0
  })
  const [dashboardData, setDashboardData] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [recentPage, setRecentPage] = useState(1)
  const [overdueCommitments, setOverdueCommitments] = useState([])
  const [todayCommitments, setTodayCommitments] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scrollY, setScrollY] = useState(0)
  const [overduePage, setOverduePage] = useState(1)
  const [loadingTransactionId, setLoadingTransactionId] = useState(null)
  const RECENT_PAGE_SIZE = 5
  const OVERDUE_PAGE_SIZE = 5

  const updateTransaction = useUpdateTransaction()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Load dashboard data
  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    setRecentPage(1)
  }, [recentTransactions])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load dashboard data
      const [dashboardResponse, recentResponse, statsResponse, overdueResponse, todayResponse] = await Promise.all([
        apiService.getDashboardData(),
        apiService.getRecentTransactions(),
        apiService.getDashboardStatistics(),
        apiService.getOverdueCommitments(),
        apiService.getTodayCommitments()
      ])

      setDashboardData(dashboardResponse)
      setRecentTransactions(recentResponse.transactions || [])
      setOverdueCommitments(overdueResponse.commitments || [])
      setTodayCommitments(todayResponse.commitments || [])
      setStatistics(statsResponse)

      // Animate values
      setTimeout(() => {
        setAnimatedValues({
          receitas: dashboardResponse.receitas || 0,
          despesas: dashboardResponse.despesas || 0,
          saldo: dashboardResponse.saldo || 0,
          resultado: dashboardResponse.resultado || 0
        })
      }, 500)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePaidStatus = async (transaction) => {
    try {
      setLoadingTransactionId(transaction.id)
      const newPaidStatus = !transaction.paid

      await updateTransaction.mutateAsync({
        id: transaction.id,
        data: {
          name: transaction.name || transaction.description,
          description: transaction.description || transaction.name,
          amount_cents: transaction.amount_cents,
          amount_currency: transaction.amount_currency || 'BRL',
          transaction_type_cd: transaction.transaction_type_cd,
          due_date: transaction.due_date,
          category_id: transaction.category_id,
          cost_center_id: transaction.cost_center_id,
          contact_id: transaction.contact_id,
          bank_account_id: transaction.bank_account_id,
          payment_method_cd: transaction.payment_method_cd || 0,
          payment_type_cd: transaction.payment_type_cd || 0,
          paid: newPaidStatus,
          paid_at: newPaidStatus ? new Date().toISOString().split('T')[0] : null
        }
      })
      
      // Atualizar lista local
      setRecentTransactions(prev => 
        prev.map(t => 
          t.id === transaction.id 
            ? { ...t, paid: newPaidStatus, paid_at: newPaidStatus ? new Date().toISOString() : null }
            : t
        )
      )
      
      // Atualizar compromissos também
      setOverdueCommitments(prev => 
        prev.filter(t => t.id !== transaction.id)
      )
      setTodayCommitments(prev => 
        prev.filter(t => t.id !== transaction.id)
      )
      
      // Recarregar dados do dashboard para atualizar os valores
      await loadDashboardData()
    } catch (error) {
      console.error('Error toggling paid status:', error)
      alert('Erro ao alterar status da transação')
    } finally {
      setLoadingTransactionId(null)
    }
  }

  const recentTotalPages = Math.max(1, Math.ceil(recentTransactions.length / RECENT_PAGE_SIZE))
  const paginatedRecentTransactions = recentTransactions.slice(
    (recentPage - 1) * RECENT_PAGE_SIZE,
    recentPage * RECENT_PAGE_SIZE
  )

  const overdueTotalPages = Math.max(1, Math.ceil(overdueCommitments.length / OVERDUE_PAGE_SIZE))
  const paginatedOverdueCommitments = overdueCommitments.slice(
    (overduePage - 1) * OVERDUE_PAGE_SIZE,
    overduePage * OVERDUE_PAGE_SIZE
  )

  const formatCurrency = (value) => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    }
    const numValue = typeof value === 'string' && value.includes('R$') 
      ? parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) 
      : parseFloat(value || 0) / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#5B7A9E]" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full min-w-0 space-y-3">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold text-gray-700 dark:text-gray-200">
              Dashboard
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Visão geral das suas finanças em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="default"
              size="sm"
              onClick={() => {}}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{selectedPeriod}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={loadDashboardData}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Stats grid — archieve home pattern: lg:grid-cols-3 xl:grid-cols-4 */}
        <div className="flex flex-col space-y-3 lg:grid lg:grid-cols-3 lg:gap-3 lg:space-y-0 xl:grid-cols-4">
          <StatCard
            title="Receitas"
            value={formatCurrency(animatedValues.receitas)}
            icon={TrendingUp}
            subtitle="vs mês anterior"
            trend={12}
          />
          <StatCard
            title="Despesas"
            value={formatCurrency(animatedValues.despesas)}
            icon={TrendingDown}
            subtitle="vs mês anterior"
            trend={-8}
          />
          <StatCard
            title="Saldo"
            value={formatCurrency(animatedValues.saldo)}
            icon={DollarSign}
            subtitle="Saldo atual"
          />
          <StatCard
            title="Resultado"
            value={formatCurrency(animatedValues.resultado)}
            icon={Zap}
            subtitle="Resultado do período"
            className="lg:col-span-3 xl:col-span-1"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Monthly Chart - Larger, Prominent */}
          <FluidSection
            className="lg:col-span-2"
            title="Receitas vs Despesas"
            subtitle="Evolução mensal"
            icon={BarChart3}
          >
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 260}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: isMobile ? -20 : 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.97)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '10px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="receitas" name="Receitas" fill="url(#receitasGradient)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="despesas" name="Despesas" fill="url(#despesasGradient)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <defs>
                  <linearGradient id="receitasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="despesasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 justify-center mt-1 pb-1">
              <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" />Receitas</span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="inline-block w-3 h-3 rounded-sm bg-red-500" />Despesas</span>
            </div>
          </FluidSection>

          {/* Category Distribution - Compact */}
          <FluidSection
            title="Categorias"
            subtitle="Distribuição"
            icon={PieChartIcon}
          >
            <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 40 : 55}
                  outerRadius={isMobile ? 70 : 90}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={3}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.97)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '10px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 px-1 pb-1">
              {categoryData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 truncate">
                    <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    {entry.name}
                  </span>
                  <span className="font-medium text-gray-700 dark:text-gray-300 ml-2 flex-shrink-0">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </FluidSection>
        </div>

        {/* Today's Commitments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h5 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-amber-500" />
              Compromissos para hoje
            </h5>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">{todayCommitments.length} item(s)</span>
              <Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
                onClick={() => navigate('/transactions', { state: { filter: 'today' } })}>
                Ver <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </div>
          </div>
          <div className="p-3">
            <div className="space-y-1.5">
            {todayCommitments.length > 0 ? (
              todayCommitments.map((commitment) => (
                <div
                  key={commitment.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/10 hover:border-amber-200 dark:hover:border-amber-800/40 transition-colors cursor-pointer group"
                  onClick={() => navigate('/transactions', { state: { search: commitment.description || commitment.name } })}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className={cn(
                      "w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
                      commitment.transaction_type_cd === 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'
                    )}>
                      {commitment.transaction_type_cd === 0 ? (
                        <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                        {commitment.description || commitment.name || 'Sem descrição'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {commitment.category?.name || 'Sem categoria'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className={cn(
                      "text-xs font-semibold tabular-nums",
                      commitment.transaction_type_cd === 0 ? 'text-emerald-600' : 'text-rose-600'
                    )}>
                      {commitment.transaction_type_cd === 0 ? '+' : '-'}
                      {formatCurrency(commitment.amount_cents / 100)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleTogglePaidStatus(commitment) }}
                      disabled={loadingTransactionId !== null}
                      className={cn(
                        "h-6 w-6 p-0 rounded-full flex-shrink-0",
                        commitment.paid
                          ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      )}
                      title={commitment.paid ? 'Marcar como não pago' : 'Marcar como pago'}
                    >
                      {loadingTransactionId === commitment.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : commitment.paid ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-5 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                <Clock className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-400 dark:text-gray-500">Nenhum compromisso para hoje</p>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Overdue Commitments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-rose-200 dark:border-rose-800/50 shadow-sm">
          <div className="px-3 py-2 border-b border-rose-200 dark:border-rose-800/50 flex items-center justify-between bg-rose-50/50 dark:bg-rose-900/10 rounded-t-lg">
            <h5 className="font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              Compromissos atrasados
              {overdueCommitments.length > 0 && (
                <span className="bg-rose-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {overdueCommitments.length}
                </span>
              )}
            </h5>
            <Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100/50"
              onClick={() => navigate('/transactions', { state: { filter: 'overdue' } })}>
              Ver <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          </div>
          <div className="p-3">
            <div className="space-y-1.5">
            {paginatedOverdueCommitments.length > 0 ? (
              paginatedOverdueCommitments.map((commitment) => (
                <div
                  key={commitment.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-rose-50/60 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/40 hover:bg-rose-100/60 dark:hover:bg-rose-900/20 transition-colors cursor-pointer"
                  onClick={() => navigate('/transactions', { state: { search: commitment.description || commitment.name } })}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 bg-rose-100 dark:bg-rose-900/30">
                      <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                        {commitment.description || commitment.name || 'Sem descrição'}
                      </p>
                      <p className="text-xs text-rose-500 dark:text-rose-400 truncate">
                        Venceu em {formatDate(commitment.due_date)}
                        {commitment.category && ` · ${commitment.category.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className={cn(
                      "text-xs font-semibold tabular-nums",
                      commitment.transaction_type_cd === 0 ? 'text-emerald-600' : 'text-rose-600'
                    )}>
                      {commitment.transaction_type_cd === 0 ? '+' : '-'}
                      {formatCurrency(commitment.amount_cents / 100)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleTogglePaidStatus(commitment) }}
                      disabled={loadingTransactionId !== null}
                      className={cn(
                        "h-6 w-6 p-0 rounded-full flex-shrink-0",
                        commitment.paid
                          ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                          : "text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                      )}
                      title={commitment.paid ? 'Marcar como não pago' : 'Marcar como pago'}
                    >
                      {loadingTransactionId === commitment.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : commitment.paid ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-5 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400 dark:text-gray-500">Nenhum compromisso em atraso</p>
              </div>
            )}
            {overdueCommitments.length > 0 && overdueTotalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {(overduePage - 1) * OVERDUE_PAGE_SIZE + 1}–{Math.min(overduePage * OVERDUE_PAGE_SIZE, overdueCommitments.length)} de {overdueCommitments.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs"
                    onClick={() => setOverduePage(p => p - 1)} disabled={overduePage === 1}>
                    ‹
                  </Button>
                  <span className="text-xs text-gray-400 px-1">{overduePage}/{overdueTotalPages}</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs"
                    onClick={() => setOverduePage(p => p + 1)} disabled={overduePage === overdueTotalPages}>
                    ›
                  </Button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h5 className="font-semibold text-gray-700 dark:text-gray-200 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Transações Recentes
            </h5>
            <Button variant="ghost" size="sm" className="group/btn text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
              onClick={() => navigate('/transactions', { state: { filter: 'overdue' } })}>
              Ver pendentes <ChevronRight className="w-3 h-3 ml-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </Button>
          </div>
          <div className="p-3">
            <div className="space-y-1.5">
              {paginatedRecentTransactions.length > 0 ? (
                paginatedRecentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => navigate('/transactions', { state: { search: transaction.description || transaction.name } })}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className={cn(
                        "w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
                        transaction.transaction_type_cd === 0
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : 'bg-rose-100 dark:bg-rose-900/30'
                      )}>
                        {transaction.transaction_type_cd === 0 ? (
                          <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                          {transaction.description || transaction.name || 'Sem descrição'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {transaction.category?.name || 'Sem categoria'} · {formatDate(transaction.due_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className={cn(
                        "text-xs font-semibold tabular-nums",
                        transaction.transaction_type_cd === 0 ? 'text-emerald-600' : 'text-rose-600'
                      )}>
                        {transaction.transaction_type_cd === 0 ? '+' : '-'}
                        {formatCurrency(transaction.amount_cents / 100)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleTogglePaidStatus(transaction) }}
                        disabled={loadingTransactionId !== null}
                        className={cn(
                          "h-6 w-6 p-0 rounded-full flex-shrink-0",
                          transaction.paid
                            ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        )}
                        title={transaction.paid ? 'Marcar como não pago' : 'Marcar como pago'}
                      >
                        {loadingTransactionId === transaction.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : transaction.paid ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Circle className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <FileText className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">Nenhuma transação recente</p>
                </div>
              )}
              {recentTransactions.length > 0 && recentTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {(recentPage - 1) * RECENT_PAGE_SIZE + 1}–{Math.min(recentPage * RECENT_PAGE_SIZE, recentTransactions.length)} de {recentTransactions.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs"
                      onClick={() => setRecentPage(p => p - 1)} disabled={recentPage === 1}>
                      ‹
                    </Button>
                    <span className="text-xs text-gray-400 px-1">{recentPage}/{recentTotalPages}</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs"
                      onClick={() => setRecentPage(p => p + 1)} disabled={recentPage === recentTotalPages}>
                      ›
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Diagonal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <ActionCard
            title="Nova Transação"
            description="Adicionar receita ou despesa"
            icon={Plus}
            onClick={() => navigate('/transactions')}
          />
          <ActionCard
            title="Novo Contato"
            description="Adicionar pessoa ou empresa"
            icon={User}
            onClick={() => navigate('/contacts')}
          />
          <ActionCard
            title="Relatórios"
            description="Visualizar relatórios detalhados"
            icon={FileText}
            onClick={() => navigate('/reports')}
          />
        </div>
    </div>
  )
}
