import { useState, useEffect } from 'react'
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
  XCircle,
  Eye,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { apiService } from '../lib/api'
import { toast } from 'sonner'

export function Admin() {
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboard()
    loadAccounts()
  }, [currentPage, searchQuery])

  const loadDashboard = async () => {
    try {
      const response = await apiService.getAdminDashboard()
      setDashboard(response.summary)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
      toast.error('Não foi possível carregar o dashboard')
    }
  }

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        per_page: 20,
        ...(searchQuery && { search: searchQuery })
      }
      const response = await apiService.getAdminAccounts(params)
      setAccounts(response.accounts || [])
      setTotalPages(response.pagination?.total_pages || 1)
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
      toast.error(error.message || 'Não foi possível carregar as contas')
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async (accountId) => {
    if (!confirm('Tem certeza que deseja suspender esta conta?')) return

    try {
      await apiService.suspendAdminAccount(accountId)
      toast.success('Conta suspensa com sucesso')
      loadAccounts()
      loadDashboard()
    } catch (error) {
      toast.error(error.message || 'Não foi possível suspender a conta')
    }
  }

  const handleActivate = async (accountId) => {
    try {
      await apiService.activateAdminAccount(accountId)
      toast.success('Conta ativada com sucesso')
      loadAccounts()
      loadDashboard()
    } catch (error) {
      toast.error(error.message || 'Não foi possível ativar a conta')
    }
  }

  const getStatusBadge = (account) => {
    if (account.suspended) {
      return <Badge variant="destructive" className="bg-red-500">Suspensa</Badge>
    }
    if (account.subscription_status === 'active') {
      return <Badge className="bg-green-500">Ativa</Badge>
    }
    if (account.subscription_status === 'trialing') {
      return <Badge className="bg-blue-500">Trial</Badge>
    }
    return <Badge variant="outline">{account.subscription_status || 'Incompleta'}</Badge>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            Painel Administrativo
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gerenciamento completo do sistema Orbi
          </p>
        </div>
        <Button
          onClick={loadDashboard}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Dashboard Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span className="text-xs">Total Contas</span>
            </div>
            <p className="text-2xl font-bold mt-2">{dashboard.total_accounts || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs">Assinaturas Ativas</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-green-600">
              {dashboard.active_subscriptions || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Ban className="h-4 w-4 text-red-500" />
              <span className="text-xs">Suspensas</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-red-600">
              {dashboard.suspended_accounts || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-xs">Gratuitas</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-blue-600">
              {dashboard.free_accounts || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Empresas</span>
            </div>
            <p className="text-2xl font-bold mt-2">{dashboard.business_accounts || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span className="text-xs">Pessoais</span>
            </div>
            <p className="text-2xl font-bold mt-2">{dashboard.personal_accounts || 0}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por email, nome ou ID da conta..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Conta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assinatura
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Criada em
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Nenhuma conta encontrada
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {account.name || 'Sem nome'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {account.email}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          ID: {account.prefix_id || account.id}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {account.account_type === 'business' ? 'Empresa' : 'Pessoal'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(account)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {account.subscription_status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(account.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/accounts/${account.id}`)}
                          className="h-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {account.suspended ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleActivate(account.id)}
                            className="h-8 text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuspend(account.id)}
                            className="h-8 text-red-600 hover:text-red-700"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

