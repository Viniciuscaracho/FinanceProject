import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Shield,
  Ban,
  CheckCircle,
  Loader2,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  LogIn
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

export function AdminAccountDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { impersonate } = useAuth()
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [impersonating, setImpersonating] = useState(false)

  useEffect(() => {
    loadAccountDetails()
    loadSubscriptions()
  }, [id])

  const loadAccountDetails = async () => {
    try {
      setLoading(true)
      const response = await apiService.getAdminAccountDetails(id)
      setAccount(response.account)
    } catch (error) {
      console.error('Erro ao carregar detalhes da conta:', error)
      toast.error(error.message || 'Não foi possível carregar os detalhes da conta')
      navigate('/admin')
    } finally {
      setLoading(false)
    }
  }

  const loadSubscriptions = async () => {
    try {
      const response = await apiService.getAdminAccountSubscriptions(id)
      setSubscriptions(response.subscriptions || [])
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error)
    }
  }

  const handleSuspend = async () => {
    if (!confirm('Tem certeza que deseja suspender esta conta?')) return

    try {
      await apiService.suspendAdminAccount(id)
      toast.success('Conta suspensa com sucesso')
      loadAccountDetails()
    } catch (error) {
      toast.error(error.message || 'Não foi possível suspender a conta')
    }
  }

  const handleActivate = async () => {
    try {
      await apiService.activateAdminAccount(id)
      toast.success('Conta ativada com sucesso')
      loadAccountDetails()
    } catch (error) {
      toast.error(error.message || 'Não foi possível ativar a conta')
    }
  }

  const handleImpersonate = async () => {
    if (!confirm('Deseja entrar como este usuário para atendimento de suporte?')) return

    try {
      setImpersonating(true)
      const result = await impersonate(id)
      if (result.success) {
        toast.success('Entrou no modo de suporte')
        // Redirecionar para o dashboard do cliente
        navigate('/')
      } else {
        toast.error(result.error || 'Erro ao entrar como usuário')
      }
    } catch (error) {
      toast.error(error.message || 'Erro ao entrar como usuário')
    } finally {
      setImpersonating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!account) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800 dark:text-red-200">Conta não encontrada</p>
        </div>
        <Button onClick={() => navigate('/admin')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    )
  }

  const getStatusBadge = () => {
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              Detalhes da Conta
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {account.name || 'Sem nome'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleImpersonate}
            disabled={impersonating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {impersonating ? 'Entrando...' : 'Entrar como Usuário'}
          </Button>
          {account.suspended ? (
            <Button
              onClick={handleActivate}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Ativar Conta
            </Button>
          ) : (
            <Button
              onClick={handleSuspend}
              variant="destructive"
            >
              <Ban className="h-4 w-4 mr-2" />
              Suspender Conta
            </Button>
          )}
        </div>
      </div>

      {/* Account Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Informações da Conta
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
              <p className="font-medium">{account.name || 'Sem nome'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="font-medium">{account.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">ID</p>
              <p className="font-medium">{account.prefix_id || account.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tipo</p>
              <Badge variant="outline" className="mt-1">
                {account.account_type === 'business' ? 'Empresa' : 'Pessoal'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Criada em</p>
              <p className="font-medium">
                {new Date(account.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Assinatura
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <p className="font-medium">{account.subscription_status || 'N/A'}</p>
            </div>
            {account.subscription_plan && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Plano</p>
                <p className="font-medium">{account.subscription_plan}</p>
              </div>
            )}
            {account.subscription_current_period_end && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Próxima cobrança</p>
                <p className="font-medium">
                  {new Date(account.subscription_current_period_end).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscriptions */}
      {subscriptions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Assinaturas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Plano
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Criada em
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Próxima cobrança
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{subscription.plan_name || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          subscription.status === 'active'
                            ? 'bg-green-500'
                            : subscription.status === 'canceled'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                        }
                      >
                        {subscription.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(subscription.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {subscription.current_period_end
                        ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR')
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

