import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Users,
  Search,
  Shield,
  Ban,
  CheckCircle,
  Eye,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Calendar,
  Loader2,
  Clock,
  AlertTriangle,
  CreditCard,
  UserCheck,
  Filter,
  ChevronDown,
  Webhook,
  Play,
  XCircle,
  SkipForward,
  Zap,
  Wrench,
  MailCheck,
  Megaphone,
  Plus,
  Trash2,
  Edit3,
  Gift,
  Copy,
  Tag
} from 'lucide-react'
import { apiService } from '../lib/api'
import { toast } from 'sonner'

const TABS = ['overview', 'tokens', 'accounts', 'subscriptions', 'users', 'webhooks', 'announcements', 'referrals']

const TAB_LABELS = {
  overview: 'Visão Geral',
  tokens: 'Tokens / IA',
  accounts: 'Contas',
  subscriptions: 'Assinaturas',
  users: 'Usuários',
  webhooks: 'Webhooks',
  announcements: 'Comunicados',
  referrals: 'Indicações'
}

const STATUS_COLORS = {
  active: 'bg-green-500',
  trialing: 'bg-blue-500',
  past_due: 'bg-yellow-500',
  canceled: 'bg-red-500',
  incomplete: 'bg-gray-400',
  incomplete_expired: 'bg-red-400',
  unpaid: 'bg-orange-500'
}

function StatCard({ icon: Icon, label, value, color = 'text-gray-900 dark:text-gray-100', iconColor = 'text-gray-400' }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-2xl font-bold mt-2 ${color}`}>{value ?? 0}</p>
    </div>
  )
}

function AccountBadge({ account }) {
  if (account.suspended) return <Badge className="bg-red-500 text-white">Suspensa</Badge>
  if (account.trial_expired) return <Badge className="bg-orange-500 text-white">Trial Expirado</Badge>
  if (account.trial) return <Badge className="bg-blue-500 text-white">Trial ({account.trial_period_in_days}d)</Badge>
  if (account.free) return <Badge className="bg-purple-500 text-white">Gratuita</Badge>
  const color = STATUS_COLORS[account.subscription_status] || 'bg-gray-400'
  return <Badge className={`${color} text-white`}>{account.subscription_status || 'Incompleta'}</Badge>
}

function SubscriptionBadge({ status }) {
  const color = STATUS_COLORS[status] || 'bg-gray-400'
  return <Badge className={`${color} text-white`}>{status}</Badge>
}

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────────

function OverviewTab({ dashboard, onRefresh }) {
  const navigate = useNavigate()
  const [syncingStripe, setSyncingStripe] = useState(false)
  const [fixingSubscriptions, setFixingSubscriptions] = useState(false)

  const handleSyncStripe = async () => {
    setSyncingStripe(true)
    try {
      await apiService.syncStripe()
      toast.success('Job de sync com Stripe enfileirado. Pode levar alguns minutos.')
    } catch (e) {
      toast.error(e.message || 'Erro ao enfileirar sync')
    } finally {
      setSyncingStripe(false)
    }
  }

  const handleFixSubscriptions = async () => {
    setFixingSubscriptions(true)
    try {
      await apiService.fixSubscriptions()
      toast.success('Job de correção de assinaturas enfileirado.')
    } catch (e) {
      toast.error(e.message || 'Erro ao enfileirar correção')
    } finally {
      setFixingSubscriptions(false)
    }
  }

  if (!dashboard) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  )

  const s = dashboard.summary

  return (
    <div className="space-y-6">
      {/* Ações rápidas de produção */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-1">
          <Zap className="h-3.5 w-3.5" />
          Ações de Produção
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handleSyncStripe} disabled={syncingStripe}
            className="text-xs border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40">
            {syncingStripe ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            Sync Stripe
          </Button>
          <Button size="sm" variant="outline" onClick={handleFixSubscriptions} disabled={fixingSubscriptions}
            className="text-xs border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40">
            {fixingSubscriptions ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Wrench className="h-3.5 w-3.5 mr-1.5" />}
            Corrigir Assinaturas Canceladas
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/admin?tab=webhooks')}
            className="text-xs border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40">
            <Webhook className="h-3.5 w-3.5 mr-1.5" />
            Ver Webhooks Falhos
          </Button>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard icon={Users}       label="Total Contas"       value={s.total_accounts} />
        <StatCard icon={UserCheck}   label="Total Usuários"     value={s.total_users} />
        <StatCard icon={CheckCircle} label="Assinaturas Ativas" value={s.active_subscriptions} color="text-green-600" iconColor="text-green-500" />
        <StatCard icon={Clock}       label="Em Trial"           value={s.trial_accounts}        color="text-blue-600"   iconColor="text-blue-500" />
        <StatCard icon={AlertTriangle} label="Trial Expirado"   value={s.trial_expired_accounts} color="text-orange-600" iconColor="text-orange-500" />
        <StatCard icon={Ban}         label="Suspensas"          value={s.suspended_accounts}    color="text-red-600"    iconColor="text-red-500" />
        <StatCard icon={DollarSign}  label="Gratuitas"          value={s.free_accounts}         color="text-purple-600" iconColor="text-purple-500" />
        <StatCard icon={CreditCard}  label="Inadimplentes"      value={s.past_due_subscriptions} color="text-yellow-600" iconColor="text-yellow-500" />
        <StatCard icon={TrendingUp}  label="Empresas"           value={s.business_accounts} />
        <StatCard icon={Users}       label="Pessoais"           value={s.personal_accounts} />
      </div>

      {/* Assinaturas por status */}
      {dashboard.subscriptions_by_status && Object.keys(dashboard.subscriptions_by_status).length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Assinaturas por Status</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(dashboard.subscriptions_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <SubscriptionBadge status={status} />
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contas recentes */}
      {dashboard.recent_accounts?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contas Recentes</h3>
            <Button variant="ghost" size="sm" onClick={() => {}}>Ver todas</Button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {dashboard.recent_accounts.map((acc) => (
              <div key={acc.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div>
                  <p className="text-sm font-medium">{acc.name}</p>
                  <p className="text-xs text-gray-500">{acc.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <AccountBadge account={acc} />
                  <span className="text-xs text-gray-400">{new Date(acc.created_at).toLocaleDateString('pt-BR')}</span>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/accounts/${acc.id}`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ACCOUNTS TAB ────────────────────────────────────────────────────────────

function AccountsTab() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [summary, setSummary] = useState(null)
  const [filters, setFilters] = useState({
    subscription_status: '',
    account_type: '',
    suspended: '',
    free: '',
    trial: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        per_page: 25,
        ...(searchQuery && { search: searchQuery }),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
      }
      const response = await apiService.getAdminAccounts(params)
      setAccounts(response.accounts || [])
      setTotalPages(response.pagination?.total_pages || 1)
      setTotalCount(response.pagination?.total_count || 0)
      setSummary(response.summary)
    } catch (error) {
      toast.error(error.message || 'Não foi possível carregar as contas')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, filters])

  useEffect(() => { load() }, [load])

  const handleSuspend = async (accountId) => {
    if (!confirm('Suspender esta conta?')) return
    try {
      await apiService.suspendAdminAccount(accountId)
      toast.success('Conta suspensa')
      load()
    } catch (e) { toast.error(e.message) }
  }

  const handleActivate = async (accountId) => {
    try {
      await apiService.activateAdminAccount(accountId)
      toast.success('Conta ativada')
      load()
    } catch (e) { toast.error(e.message) }
  }

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Summary Pills */}
      {summary && (
        <div className="flex flex-wrap gap-2 text-sm">
          <button onClick={() => setFilters({ subscription_status: '', account_type: '', suspended: '', free: '', trial: '' })}
            className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200">
            Total: {summary.total_accounts}
          </button>
          <button onClick={() => setFilter('subscription_status', 'active')}
            className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200">
            Ativas: {summary.active_subscriptions}
          </button>
          <button onClick={() => setFilter('trial', 'true')}
            className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200">
            Trial: {summary.trial_accounts}
          </button>
          <button onClick={() => setFilter('suspended', 'true')}
            className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200">
            Suspensas: {summary.suspended_accounts}
          </button>
          <button onClick={() => setFilter('free', 'true')}
            className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200">
            Gratuitas: {summary.free_accounts}
          </button>
        </div>
      )}

      {/* Search + Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por email, nome ou ID..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)} className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            Filtros
            <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <select value={filters.subscription_status} onChange={(e) => setFilter('subscription_status', e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700">
              <option value="">Todos os status</option>
              <option value="active">Ativa</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Inadimplente</option>
              <option value="canceled">Cancelada</option>
              <option value="incomplete">Incompleta</option>
            </select>
            <select value={filters.account_type} onChange={(e) => setFilter('account_type', e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700">
              <option value="">Todos os tipos</option>
              <option value="business">Empresa</option>
              <option value="personal">Pessoal</option>
            </select>
            <select value={filters.suspended} onChange={(e) => setFilter('suspended', e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700">
              <option value="">Suspensão</option>
              <option value="true">Suspensas</option>
              <option value="false">Ativas</option>
            </select>
            <select value={filters.free} onChange={(e) => setFilter('free', e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700">
              <option value="">Gratuidade</option>
              <option value="true">Somente gratuitas</option>
              <option value="false">Somente pagas</option>
            </select>
            <select value={filters.trial} onChange={(e) => setFilter('trial', e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700">
              <option value="">Trial</option>
              <option value="true">Em trial</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {totalCount > 0 && (
          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
            {totalCount} conta{totalCount !== 1 ? 's' : ''} encontrada{totalCount !== 1 ? 's' : ''}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['Conta', 'Tipo', 'Status / Trial', 'Assinatura', 'Criada em', 'Ações'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Nenhuma conta encontrada</td></tr>
              ) : accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{account.name || 'Sem nome'}</p>
                    <p className="text-xs text-gray-500">{account.email}</p>
                    <p className="text-xs text-gray-400">#{account.prefix_id || account.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {account.account_type === 'business' ? 'Empresa' : 'Pessoal'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <AccountBadge account={account} />
                    {account.trial && account.trial_ends_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        Fim: {new Date(account.trial_ends_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{account.subscription_status || 'N/A'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(account.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/admin/accounts/${account.id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {account.suspended ? (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600" onClick={() => handleActivate(account.id)}>
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600" onClick={() => handleSuspend(account.id)}>
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">Página {currentPage} de {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próxima</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SUBSCRIPTIONS TAB ───────────────────────────────────────────────────────

function SubscriptionsTab() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [summary, setSummary] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        per_page: 25,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter })
      }
      const response = await apiService.getAdminSubscriptions(params)
      setSubscriptions(response.subscriptions || [])
      setTotalPages(response.pagination?.total_pages || 1)
      setTotalCount(response.pagination?.total_count || 0)
      setSummary(response.summary)
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar assinaturas')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, statusFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      {summary && (
        <div className="flex flex-wrap gap-2 text-sm">
          <button onClick={() => setStatusFilter('')}
            className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            Total: {summary.total_subscriptions}
          </button>
          <button onClick={() => setStatusFilter('active')}
            className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            Ativas: {summary.active}
          </button>
          <button onClick={() => setStatusFilter('trialing')}
            className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            Trialing: {summary.trialing}
          </button>
          <button onClick={() => setStatusFilter('past_due')}
            className="px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            Inadimplentes: {summary.past_due}
          </button>
          <button onClick={() => setStatusFilter('canceled')}
            className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            Canceladas: {summary.canceled}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por email, nome ou ID da conta..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            className="pl-10"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700">
          <option value="">Todos os status</option>
          <option value="active">Ativa</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Inadimplente</option>
          <option value="canceled">Cancelada</option>
          <option value="incomplete">Incompleta</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {totalCount > 0 && (
          <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700">
            {totalCount} assinatura{totalCount !== 1 ? 's' : ''}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['Conta', 'Plano', 'Status', 'Período', 'Cancel. no Fim', 'Criada em', 'Ações'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></td></tr>
              ) : subscriptions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Nenhuma assinatura encontrada</td></tr>
              ) : subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{sub.account?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{sub.account?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{sub.plan?.nickname || sub.name || 'N/A'}</td>
                  <td className="px-4 py-3"><SubscriptionBadge status={sub.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('pt-BR') : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    {sub.cancel_at_period_end
                      ? <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">Sim</Badge>
                      : <span className="text-xs text-gray-400">Não</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(sub.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    {sub.account?.id && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/admin/accounts/${sub.account.id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">Página {currentPage} de {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próxima</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── USERS TAB ───────────────────────────────────────────────────────────────

function UsersTab() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [summary, setSummary] = useState(null)
  const [unconfirmedOnly, setUnconfirmedOnly] = useState(false)
  const [resendingId, setResendingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        per_page: 25,
        ...(searchQuery && { search: searchQuery }),
        ...(unconfirmedOnly && { unconfirmed: 'true' })
      }
      const response = await apiService.getAdminUsers(params)
      setUsers(response.users || [])
      setTotalPages(response.pagination?.total_pages || 1)
      setTotalCount(response.pagination?.total_count || 0)
      setSummary(response.summary)
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, unconfirmedOnly])

  useEffect(() => { load() }, [load])

  const handleResendConfirmation = async (userId, email) => {
    setResendingId(userId)
    try {
      const resp = await apiService.resendAdminConfirmation(userId)
      toast.success(resp.message || `Email reenviado para ${email}`)
    } catch (e) {
      toast.error(e.message || 'Erro ao reenviar email')
    } finally {
      setResendingId(null)
    }
  }

  const formatLastSeen = (date) => {
    if (!date) return '—'
    const d = new Date(date)
    const now = new Date()
    const diff = (now - d) / 1000 / 60 // minutes
    if (diff < 60) return `${Math.floor(diff)}m atrás`
    if (diff < 60 * 24) return `${Math.floor(diff / 60)}h atrás`
    if (diff < 60 * 24 * 30) return `${Math.floor(diff / 60 / 24)}d atrás`
    return d.toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-4">
      {summary && (
        <div className="flex flex-wrap gap-2 text-sm">
          <button onClick={() => { setUnconfirmedOnly(false); setCurrentPage(1) }}
            className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            Total: {summary.total_users}
          </button>
          <button onClick={() => { setUnconfirmedOnly(false); setCurrentPage(1) }}
            className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700">
            Confirmados: {summary.confirmed_users}
          </button>
          <button onClick={() => { setUnconfirmedOnly(true); setCurrentPage(1) }}
            className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700">
            Não confirmados: {summary.unconfirmed_users}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por email ou nome..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {totalCount > 0 && (
          <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700">
            {totalCount} usuário{totalCount !== 1 ? 's' : ''}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['Usuário', 'Email confirmado', 'Último acesso', 'Logins', 'Conta', 'Cadastro', 'Ações'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Nenhum usuário encontrado</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{user.name || '—'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400">ID: {user.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    {user.confirmed
                      ? <Badge className="bg-green-500 text-white text-xs">Confirmado</Badge>
                      : (
                        <div className="space-y-1">
                          <Badge className="bg-orange-500 text-white text-xs">Pendente</Badge>
                          {user.confirmation_sent_at && (
                            <p className="text-xs text-gray-400">
                              Enviado: {new Date(user.confirmation_sent_at).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      )
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {formatLastSeen(user.last_sign_in_at)}
                    {user.current_sign_in_at && (
                      <p className="text-xs text-gray-400">Online: {formatLastSeen(user.current_sign_in_at)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 text-center">{user.sign_in_count ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <p>{user.account?.name || '—'}</p>
                    {user.account && (
                      <Badge variant="outline" className="text-xs mt-0.5">
                        {user.account.subscription_status || 'N/A'}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {user.account?.id && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/admin/accounts/${user.account.id}`)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!user.confirmed && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600"
                          onClick={() => handleResendConfirmation(user.id, user.email)}
                          disabled={resendingId === user.id}
                          title="Reenviar email de confirmação">
                          {resendingId === user.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <MailCheck className="h-3.5 w-3.5" />
                          }
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">Página {currentPage} de {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próxima</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── WEBHOOKS TAB ────────────────────────────────────────────────────────────

const WEBHOOK_STATUS_COLORS = {
  processed: 'bg-green-500',
  failed: 'bg-red-500',
  skipped: 'bg-gray-400',
  pending: 'bg-yellow-500'
}

const WEBHOOK_STATUS_ICONS = {
  processed: CheckCircle,
  failed: XCircle,
  skipped: SkipForward,
  pending: Clock
}

function WebhooksTab() {
  const [loading, setLoading] = useState(true)
  const [webhooks, setWebhooks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [summary, setSummary] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [retryingId, setRetryingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        per_page: 25,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter })
      }
      const response = await apiService.getAdminWebhookLogs(params)
      setWebhooks(response.webhooks || [])
      setTotalPages(response.pagination?.total_pages || 1)
      setTotalCount(response.pagination?.total_count || 0)
      setSummary(response.summary)
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar webhooks')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, statusFilter])

  useEffect(() => { load() }, [load])

  const handleRetry = async (webhookId) => {
    setRetryingId(webhookId)
    try {
      await apiService.retryAdminWebhook(webhookId)
      toast.success('Webhook enfileirado para reprocessamento')
      load()
    } catch (e) {
      toast.error(e.message || 'Erro ao reprocessar webhook')
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Alerta se há falhas */}
      {summary?.failed > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">
            <strong>{summary.failed}</strong> webhook{summary.failed !== 1 ? 's' : ''} falharam e precisam de atenção.
            Use o botão de retry para reprocessar.
          </p>
        </div>
      )}

      {/* Summary pills */}
      {summary && (
        <div className="flex flex-wrap gap-2 text-sm">
          <button onClick={() => { setStatusFilter(''); setCurrentPage(1) }}
            className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            Total: {summary.total}
          </button>
          <button onClick={() => { setStatusFilter('processed'); setCurrentPage(1) }}
            className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700">
            Processados: {summary.processed}
          </button>
          <button onClick={() => { setStatusFilter('failed'); setCurrentPage(1) }}
            className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 font-medium">
            Falhos: {summary.failed}
          </button>
          <button onClick={() => { setStatusFilter('pending'); setCurrentPage(1) }}
            className="px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700">
            Pendentes: {summary.pending}
          </button>
          <button onClick={() => { setStatusFilter('skipped'); setCurrentPage(1) }}
            className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
            Ignorados: {summary.skipped}
          </button>
        </div>
      )}

      {/* Search + Filter */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por tipo de evento (ex: customer.subscription.updated)..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            className="pl-10"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700">
          <option value="">Todos</option>
          <option value="failed">Falhos</option>
          <option value="pending">Pendentes</option>
          <option value="processed">Processados</option>
          <option value="skipped">Ignorados</option>
        </select>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {totalCount > 0 && (
          <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700">
            {totalCount} webhook{totalCount !== 1 ? 's' : ''}
          </div>
        )}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            <div className="px-4 py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></div>
          ) : webhooks.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">Nenhum webhook encontrado</div>
          ) : webhooks.map((webhook) => {
            const StatusIcon = WEBHOOK_STATUS_ICONS[webhook.status] || Clock
            const isExpanded = expandedId === webhook.id
            const hasFailed = webhook.status === 'failed'
            const canRetry = webhook.status === 'failed' || webhook.status === 'pending'

            return (
              <div key={webhook.id} className={`${hasFailed ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusIcon className={`h-4 w-4 flex-shrink-0 ${
                      webhook.status === 'processed' ? 'text-green-500' :
                      webhook.status === 'failed' ? 'text-red-500' :
                      webhook.status === 'pending' ? 'text-yellow-500' : 'text-gray-400'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-mono font-medium truncate">{webhook.event_type}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <span>ID: {webhook.id}</span>
                        {webhook.customer_id && <span>· Customer: {webhook.customer_id}</span>}
                        <span>· {new Date(webhook.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`${WEBHOOK_STATUS_COLORS[webhook.status] || 'bg-gray-400'} text-white text-xs`}>
                      {webhook.status}
                    </Badge>
                    {hasFailed && webhook.details?.message_log && (
                      <button onClick={() => setExpandedId(isExpanded ? null : webhook.id)}
                        className="text-xs text-red-600 hover:underline">
                        {isExpanded ? 'Fechar' : 'Ver erro'}
                      </button>
                    )}
                    {canRetry && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600"
                        onClick={() => handleRetry(webhook.id)}
                        disabled={retryingId === webhook.id}>
                        {retryingId === webhook.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Play className="h-3.5 w-3.5" />
                        }
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
                {isExpanded && webhook.details && (
                  <div className="px-4 pb-3">
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded p-3 text-xs font-mono">
                      <p className="font-semibold text-red-700 dark:text-red-400 mb-1">Erro:</p>
                      <p className="text-red-800 dark:text-red-300 whitespace-pre-wrap">{webhook.details.message_log}</p>
                      {webhook.details.trace?.length > 0 && (
                        <>
                          <p className="font-semibold text-red-700 dark:text-red-400 mt-2 mb-1">Stack trace:</p>
                          <p className="text-red-700 dark:text-red-400 whitespace-pre-wrap opacity-70">
                            {webhook.details.trace.slice(0, 5).join('\n')}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">Página {currentPage} de {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próxima</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ANNOUNCEMENTS TAB ───────────────────────────────────────────────────────

const KIND_LABELS = {
  new: { label: 'Novo', color: 'bg-blue-500' },
  fix: { label: 'Correção', color: 'bg-orange-500' },
  improvement: { label: 'Melhoria', color: 'bg-green-500' },
  update: { label: 'Atualização', color: 'bg-purple-500' },
  warning: { label: 'Aviso', color: 'bg-yellow-500' },
  alert: { label: 'Alerta', color: 'bg-red-500' }
}

function AnnouncementForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    abstract: initial?.abstract || '',
    kind: initial?.kind || 'new',
    published_at: initial?.published_at ? initial.published_at.slice(0, 16) : new Date().toISOString().slice(0, 16),
    show_banner: initial?.show_banner ?? false,
    send_notification: initial?.send_notification ?? false,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Título obrigatório'); return }
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Título *</label>
        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título do comunicado" className="mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Resumo</label>
        <Input value={form.abstract} onChange={e => setForm(f => ({ ...f, abstract: e.target.value }))} placeholder="Resumo curto (opcional)" className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Tipo</label>
          <select value={form.kind} onChange={e => setForm(f => ({ ...f, kind: e.target.value }))}
            className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-700">
            {Object.entries(KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Data publicação</label>
          <input type="datetime-local" value={form.published_at} onChange={e => setForm(f => ({ ...f, published_at: e.target.value }))}
            className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-700" />
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.show_banner} onChange={e => setForm(f => ({ ...f, show_banner: e.target.checked }))} />
          Exibir banner no dashboard
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.send_notification} onChange={e => setForm(f => ({ ...f, send_notification: e.target.checked }))} />
          Enviar notificação
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}

function AnnouncementsTab() {
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiService.getAdminAnnouncements()
      setAnnouncements(res.announcements || [])
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar comunicados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (data) => {
    try {
      await apiService.createAdminAnnouncement(data)
      toast.success('Comunicado criado')
      setShowForm(false)
      load()
    } catch (e) {
      toast.error(e.message || 'Erro ao criar comunicado')
    }
  }

  const handleUpdate = async (id, data) => {
    try {
      await apiService.updateAdminAnnouncement(id, data)
      toast.success('Comunicado atualizado')
      setEditingId(null)
      load()
    } catch (e) {
      toast.error(e.message || 'Erro ao atualizar comunicado')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir este comunicado?')) return
    try {
      await apiService.deleteAdminAnnouncement(id)
      toast.success('Comunicado excluído')
      load()
    } catch (e) {
      toast.error(e.message || 'Erro ao excluir')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Comunicados aparecem para todos os usuários no dashboard.</p>
        <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null) }} className="flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          Novo Comunicado
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-sm font-semibold mb-3 text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
            <Megaphone className="h-4 w-4" /> Novo Comunicado
          </p>
          <AnnouncementForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></div>
        ) : announcements.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-sm">Nenhum comunicado criado</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {announcements.map(a => {
              const kindMeta = KIND_LABELS[a.kind] || { label: a.kind, color: 'bg-gray-400' }
              return (
                <div key={a.id}>
                  {editingId === a.id ? (
                    <div className="p-4">
                      <AnnouncementForm
                        initial={a}
                        onSave={(data) => handleUpdate(a.id, data)}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  ) : (
                    <div className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge className={`${kindMeta.color} text-white text-xs`}>{kindMeta.label}</Badge>
                          {a.show_banner && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Banner</Badge>}
                          {a.send_notification && <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Notificação</Badge>}
                        </div>
                        <p className="text-sm font-medium">{a.title}</p>
                        {a.abstract && <p className="text-xs text-gray-500 mt-0.5 truncate">{a.abstract}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          Publicado: {new Date(a.published_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingId(a.id)}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600" onClick={() => handleDelete(a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── REFERRAL CODES TAB ──────────────────────────────────────────────────────

const BENEFIT_TYPE_LABELS = { commission: 'Comissão', discount: 'Desconto' }
const ACCOUNT_TYPE_LABELS = { both: 'Ambos', business: 'Empresa', personal: 'Pessoal' }

function ReferralCodeForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    benefit: initial?.benefit ?? 0,
    benefit_type: initial?.benefit_type || 'commission',
    trial_days: initial?.trial_days ?? 30,
    account_type: initial?.account_type || 'both',
    create_free_personal_account: initial?.create_free_personal_account ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return }
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Nome *</label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do código" className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Tipo de benefício</label>
          <select value={form.benefit_type} onChange={e => setForm(f => ({ ...f, benefit_type: e.target.value }))}
            className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-700">
            {Object.entries(BENEFIT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Benefício (%)</label>
          <Input type="number" min={0} max={100} value={form.benefit} onChange={e => setForm(f => ({ ...f, benefit: parseInt(e.target.value) || 0 }))} className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Dias de trial</label>
          <Input type="number" min={0} max={30} value={form.trial_days} onChange={e => setForm(f => ({ ...f, trial_days: parseInt(e.target.value) || 0 }))} className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Tipo de conta</label>
          <select value={form.account_type} onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}
            className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-700">
            {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Descrição</label>
          <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição (opcional)" className="mt-1" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.create_free_personal_account} onChange={e => setForm(f => ({ ...f, create_free_personal_account: e.target.checked }))} />
        Criar conta pessoal gratuita para o indicador
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}

function ReferralCodesTab() {
  const [loading, setLoading] = useState(true)
  const [codes, setCodes] = useState([])
  const [summary, setSummary] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiService.getAdminReferralCodes()
      setCodes(res.referral_codes || [])
      setSummary(res.summary)
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar códigos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (data) => {
    try {
      await apiService.createAdminReferralCode(data)
      toast.success('Código criado')
      setShowForm(false)
      load()
    } catch (e) {
      toast.error(e.message || 'Erro ao criar código')
    }
  }

  const handleUpdate = async (id, data) => {
    try {
      await apiService.updateAdminReferralCode(id, data)
      toast.success('Código atualizado')
      setEditingId(null)
      load()
    } catch (e) {
      toast.error(e.message || 'Erro ao atualizar')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir este código de indicação?')) return
    try {
      await apiService.deleteAdminReferralCode(id)
      toast.success('Código excluído')
      load()
    } catch (e) {
      toast.error(e.message || 'Erro ao excluir')
    }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => toast.success(`Código ${code} copiado!`))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {summary && (
          <div className="flex gap-3 text-sm">
            <span className="text-gray-500">Total: <strong className="text-gray-900 dark:text-gray-100">{summary.total}</strong></span>
            <span className="text-gray-500">Indicações: <strong className="text-blue-600">{summary.total_referees}</strong></span>
          </div>
        )}
        <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null) }} className="flex items-center gap-1.5 ml-auto">
          <Plus className="h-4 w-4" />
          Novo Código
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-sm font-semibold mb-3 text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
            <Gift className="h-4 w-4" /> Novo Código de Indicação
          </p>
          <ReferralCodeForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></div>
        ) : codes.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-sm">Nenhum código criado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {['Nome / Código', 'Benefício', 'Trial', 'Conta', 'Indicações', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {codes.map(rc => (
                  <tr key={rc.id}>
                    {editingId === rc.id ? (
                      <td colSpan={6} className="p-4">
                        <ReferralCodeForm
                          initial={rc}
                          onSave={(data) => handleUpdate(rc.id, data)}
                          onCancel={() => setEditingId(null)}
                        />
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{rc.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">{rc.code}</code>
                            <button onClick={() => copyCode(rc.code)} className="text-gray-400 hover:text-gray-600">
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          {rc.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{rc.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant="outline" className={`text-xs ${rc.benefit_type === 'discount' ? 'text-green-600 border-green-300' : 'text-blue-600 border-blue-300'}`}>
                            <Tag className="h-3 w-3 mr-1" />
                            {rc.benefit}% {BENEFIT_TYPE_LABELS[rc.benefit_type] || rc.benefit_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {rc.trial_days > 0 ? `${rc.trial_days} dias` : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {ACCOUNT_TYPE_LABELS[rc.account_type] || rc.account_type}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{rc.referees_count}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingId(rc.id)}>
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600" onClick={() => handleDelete(rc.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

// ─── TOKENS / IA TAB ─────────────────────────────────────────────────────────
function TokensTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiService.getAdminTokenUsage(days)
      setData(res)
    } catch (e) {
      toast.error(e?.message || 'Erro ao carregar consumo de tokens')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { load() }, [load])

  const fmtInt = (n) => (n ?? 0).toLocaleString('pt-BR')
  const fmtUsd = (n) => `US$ ${(n ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const totals = data?.totals || { input_tokens: 0, output_tokens: 0, calls: 0, estimated_cost_usd: 0 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-gray-500">
          Consumo de tokens da IA de coaching (Anthropic) — custo estimado a partir dos tokens de cada chamada.
        </p>
        <div className="flex gap-2 items-center">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
          <Button size="sm" variant="outline" onClick={load}>Atualizar</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 py-8 text-center">Carregando…</p>
      ) : (
        <>
          {/* Cards de totais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Custo estimado', value: fmtUsd(totals.estimated_cost_usd) },
              { label: 'Chamadas', value: fmtInt(totals.calls) },
              { label: 'Tokens de entrada', value: fmtInt(totals.input_tokens) },
              { label: 'Tokens de saída', value: fmtInt(totals.output_tokens) },
            ].map((c) => (
              <div key={c.label} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                <p className="text-xl font-semibold">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Por serviço */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Por serviço de IA</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                  <tr>
                    <th className="text-left px-3 py-2">Serviço</th>
                    <th className="text-right px-3 py-2">Chamadas</th>
                    <th className="text-right px-3 py-2">Entrada</th>
                    <th className="text-right px-3 py-2">Saída</th>
                    <th className="text-right px-3 py-2">Custo est.</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.by_service || []).map((r) => (
                    <tr key={r.service} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2">{r.service}</td>
                      <td className="px-3 py-2 text-right">{fmtInt(r.calls)}</td>
                      <td className="px-3 py-2 text-right">{fmtInt(r.input_tokens)}</td>
                      <td className="px-3 py-2 text-right">{fmtInt(r.output_tokens)}</td>
                      <td className="px-3 py-2 text-right">{fmtUsd(r.estimated_cost_usd)}</td>
                    </tr>
                  ))}
                  {(!data?.by_service || data.by_service.length === 0) && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">Sem consumo no período</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Por conta */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Por conta</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                  <tr>
                    <th className="text-left px-3 py-2">Conta</th>
                    <th className="text-right px-3 py-2">Chamadas</th>
                    <th className="text-right px-3 py-2">Tokens</th>
                    <th className="text-right px-3 py-2">Custo est.</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.by_account || []).map((r) => (
                    <tr key={r.account_id ?? 'none'} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2">{r.account_name}</td>
                      <td className="px-3 py-2 text-right">{fmtInt(r.calls)}</td>
                      <td className="px-3 py-2 text-right">{fmtInt(r.input_tokens + r.output_tokens)}</td>
                      <td className="px-3 py-2 text-right">{fmtUsd(r.estimated_cost_usd)}</td>
                    </tr>
                  ))}
                  {(!data?.by_account || data.by_account.length === 0) && (
                    <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">Sem consumo no período</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function Admin() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboard, setDashboard] = useState(null)
  const [loadingDashboard, setLoadingDashboard] = useState(true)

  const loadDashboard = async () => {
    try {
      setLoadingDashboard(true)
      const response = await apiService.getAdminDashboard()
      setDashboard(response)
    } catch {
      toast.error('Não foi possível carregar o dashboard')
    } finally {
      setLoadingDashboard(false)
    }
  }

  useEffect(() => { loadDashboard() }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Painel Administrativo
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Controle completo do sistema</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDashboard} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loadingDashboard ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && <OverviewTab dashboard={dashboard} onRefresh={loadDashboard} />}
      {activeTab === 'tokens' && <TokensTab />}
      {activeTab === 'accounts' && <AccountsTab />}
      {activeTab === 'subscriptions' && <SubscriptionsTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'webhooks' && <WebhooksTab />}
      {activeTab === 'announcements' && <AnnouncementsTab />}
      {activeTab === 'referrals' && <ReferralCodesTab />}
    </div>
  )
}
