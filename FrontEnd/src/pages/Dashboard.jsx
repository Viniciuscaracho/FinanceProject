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
  const [overdueCommitments, setOverdueCommitments] = useState([])
  const [todayCommitments, setTodayCommitments] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scrollY, setScrollY] = useState(0)
  
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
    }
  }

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
    <div className="relative min-h-screen bg-surface">
      <div className="relative z-10 w-full max-w-full min-w-0 px-6 py-6 md:px-12 md:py-8 space-y-6 md:space-y-8">
        {/* Header - Bold Typography */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2 text-text-primary">
              Dashboard
            </h1>
            <p className="text-sm text-text-secondary">
              Visão geral das suas finanças em tempo real
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => {
                console.log('Seletor de período - em desenvolvimento')
              }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {selectedPeriod}
            </Button>
            <Button 
              size="sm"
              onClick={loadDashboardData}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Main Stats - Asymmetric Cards with Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            trend={8}
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
          />
        </div>

        {/* Charts Section - Fluid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monthly Chart - Larger, Prominent */}
          <FluidSection
            className="lg:col-span-2"
            title="Receitas vs Despesas"
            subtitle="Evolução mensal"
            icon={BarChart3}
          >
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: isMobile ? 10 : 12, fill: 'currentColor' }}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? 'end' : 'middle'}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12, fill: 'currentColor' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="receitas" fill="url(#receitasGradient)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="despesas" fill="url(#despesasGradient)" radius={[8, 8, 0, 0]} />
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
          </FluidSection>

          {/* Category Distribution - Compact */}
          <FluidSection
            title="Categorias"
            subtitle="Distribuição"
            icon={PieChartIcon}
          >
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 70 : 100}
                    fill="#8884d8"
                    dataKey="value"
                    label={isMobile ? false : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
          </FluidSection>
        </div>

        {/* Today's Commitments */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Compromissos para hoje
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {todayCommitments.length} compromisso(s) para hoje
            </p>
          </div>
          <div className="space-y-3">
            {todayCommitments.length > 0 ? (
              todayCommitments.map((commitment, index) => (
                <div 
                  key={commitment.id}
                  className="group/item flex items-center justify-between p-4 rounded-[var(--radius-lg)] bg-surface-elevated border border-border shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-140 cursor-pointer"
                  onClick={() => navigate('/transactions')}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0 bg-accent">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary truncate">
                        {commitment.description || commitment.name || 'Sem descrição'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm text-text-secondary">
                          {formatDate(commitment.due_date)}
                        </p>
                        {commitment.category && (
                          <>
                            <span className="text-gray-400">•</span>
                            <p className="text-sm text-text-secondary">
                              {commitment.category.name}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <p className={`text-lg font-semibold ${
                      commitment.transaction_type_cd === 0 
                        ? 'text-accent' 
                        : 'text-danger'
                    }`}>
                      {commitment.transaction_type_cd === 0 ? '+' : '-'}
                      {formatCurrency(commitment.amount_cents / 100)}
                    </p>
                    <Button
                      variant={commitment.paid ? "default" : "secondary"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTogglePaidStatus(commitment)
                      }}
                      disabled={updateTransaction.isPending}
                      className={cn(
                        "flex items-center gap-2 whitespace-nowrap font-semibold shadow-md transition-all hover:scale-105",
                        commitment.paid 
                          ? "bg-green-500 hover:bg-green-600 text-white border-0 hover:shadow-lg" 
                          : "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-2 border-yellow-400 hover:border-yellow-500 dark:bg-yellow-900/20 dark:text-yellow-400 hover:shadow-lg"
                      )}
                    >
                      {updateTransaction.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : commitment.paid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Pago
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4" />
                          Pendente
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 rounded-[var(--radius-lg)] bg-surface-elevated border border-border">
                <p className="text-text-secondary">Nenhum compromisso previsto para hoje</p>
              </div>
            )}
          </div>
        </div>

        {/* Overdue Commitments */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Compromissos atrasados
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {overdueCommitments.length} compromisso(s) em atraso
            </p>
          </div>
          <div className="space-y-3">
            {overdueCommitments.length > 0 ? (
              overdueCommitments.map((commitment, index) => (
                <div 
                  key={commitment.id}
                  className="group/item flex items-center justify-between p-4 rounded-[var(--radius-lg)] bg-surface-elevated border border-danger/30 hover:border-danger/50 transition-all duration-140 hover:shadow-[var(--shadow-md)] cursor-pointer"
                  onClick={() => navigate('/transactions')}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0 bg-danger">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-danger">
                          {formatDate(commitment.due_date)}
                        </p>
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white truncate mt-1">
                        {commitment.description || commitment.name || 'Sem descrição'}
                      </p>
                      {commitment.category && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {commitment.category.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <p className={`text-lg font-semibold ${
                      commitment.transaction_type_cd === 0 
                        ? 'text-accent' 
                        : 'text-danger'
                    }`}>
                      {commitment.transaction_type_cd === 0 ? '+' : '-'}
                      {formatCurrency(commitment.amount_cents / 100)}
                    </p>
                    <Button
                      variant={commitment.paid ? "default" : "secondary"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTogglePaidStatus(commitment)
                      }}
                      disabled={updateTransaction.isPending}
                      className={cn(
                        "flex items-center gap-2 whitespace-nowrap font-semibold shadow-md transition-all hover:scale-105",
                        commitment.paid 
                          ? "bg-green-500 hover:bg-green-600 text-white border-0 hover:shadow-lg" 
                          : "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-2 border-yellow-400 hover:border-yellow-500 dark:bg-yellow-900/20 dark:text-yellow-400 hover:shadow-lg"
                      )}
                    >
                      {updateTransaction.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : commitment.paid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Pago
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4" />
                          Pendente
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 rounded-[var(--radius-lg)] bg-surface-elevated border border-border">
                <p className="text-text-secondary">Nenhum compromisso em atraso</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions - Modern List */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Transações Recentes</h2>
              <p className="text-sm text-text-secondary mt-1">Últimas movimentações</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="group/btn"
              onClick={() => navigate('/transactions')}
            >
              Ver todas
              <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>
          <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction, index) => (
                  <div 
                    key={transaction.id} 
                    className="group/item flex items-center justify-between p-4 rounded-[var(--radius-lg)] bg-surface-elevated border border-border shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-140 cursor-pointer"
                    onClick={() => navigate('/transactions')}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0 ${
                        transaction.transaction_type_cd === 0 
                          ? 'bg-accent' 
                          : 'bg-danger'
                      }`}>
                        {transaction.transaction_type_cd === 0 ? (
                          <ArrowUpRight className="w-5 h-5 text-white" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text-primary truncate">
                          {transaction.description || transaction.name || 'Sem descrição'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-sm text-text-secondary">
                            {transaction.category?.name || 'Sem categoria'}
                          </p>
                          <span className="text-gray-400">•</span>
                          <p className="text-sm text-text-secondary">
                            {formatDate(transaction.due_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      <p className={`text-lg font-semibold ${
                        transaction.transaction_type_cd === 0 
                          ? 'text-accent' 
                          : 'text-danger'
                      }`}>
                        {transaction.transaction_type_cd === 0 ? '+' : '-'}
                        {formatCurrency(transaction.amount_cents / 100)}
                      </p>
                      <Button
                        variant={transaction.paid ? "default" : "secondary"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTogglePaidStatus(transaction)
                        }}
                        disabled={updateTransaction.isPending}
                        className="flex items-center gap-2 whitespace-nowrap"
                      >
                        {updateTransaction.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : transaction.paid ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Pago
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4" />
                            Pendente
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-[var(--radius-lg)] bg-surface-elevated flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-text-secondary" />
                  </div>
                  <p className="text-text-secondary">Nenhuma transação recente</p>
                </div>
              )}
          </div>
        </div>

        {/* Quick Actions - Diagonal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </div>
  )
}
