import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Shield,
  Ban,
  CheckCircle,
  Loader2,
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
  LogIn,
  Clock,
  Edit2,
  Save,
  X,
  CreditCard,
  RefreshCw,
  AlertTriangle,
  FileText,
  ChevronDown
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

const STATUS_COLORS = {
  active: 'bg-green-500',
  trialing: 'bg-blue-500',
  past_due: 'bg-yellow-500',
  canceled: 'bg-red-500',
  incomplete: 'bg-gray-400',
  incomplete_expired: 'bg-red-400',
  unpaid: 'bg-orange-500'
}

function AccountStatusBadge({ account }) {
  if (!account) return null
  if (account.suspended) return <Badge className="bg-red-500 text-white">Suspensa</Badge>
  if (account.trial_expired) return <Badge className="bg-orange-500 text-white">Trial Expirado</Badge>
  if (account.trial) return <Badge className="bg-blue-500 text-white">Em Trial ({account.trial_period_in_days}d restantes)</Badge>
  if (account.free) return <Badge className="bg-purple-500 text-white">Gratuita</Badge>
  const color = STATUS_COLORS[account.subscription_status] || 'bg-gray-400'
  return <Badge className={`${color} text-white`}>{account.subscription_status || 'Incompleta'}</Badge>
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value ?? '—'}</p>
    </div>
  )
}

// ─── TRIAL MANAGEMENT ────────────────────────────────────────────────────────

function TrialSection({ account, onRefresh }) {
  const [days, setDays] = useState(7)
  const [extending, setExtending] = useState(false)

  const handleExtend = async () => {
    if (Number(days) < 1) return toast.error('Informe um número de dias válido')
    try {
      setExtending(true)
      const response = await apiService.extendAdminTrial(account.id, Number(days))
      toast.success(response.message || 'Trial estendido')
      onRefresh()
    } catch (e) {
      toast.error(e.message || 'Erro ao estender trial')
    } finally {
      setExtending(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-blue-500" />
        Período de Trial
      </h2>
      <div className="space-y-3">
        <InfoRow label="Em trial" value={account.trial ? 'Sim' : 'Não'} />
        <InfoRow
          label="Fim do trial"
          value={account.trial_ends_at ? new Date(account.trial_ends_at).toLocaleDateString('pt-BR') : '—'}
        />
        {account.trial && (
          <InfoRow
            label="Dias restantes"
            value={account.trial_period_in_days > 0 ? `${account.trial_period_in_days} dias` : 'Expirado'}
          />
        )}
        {account.trial_expired && (
          <div className="flex items-center gap-2 text-orange-600 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            Trial expirado
          </div>
        )}

        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
          <p className="text-xs text-gray-500 mb-2">Estender trial</p>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              {[7, 14, 30].map(d => (
                <button key={d} onClick={() => setDays(d)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    days === d
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400'
                  }`}>
                  +{d}d
                </button>
              ))}
            </div>
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min={1}
              max={365}
              className="w-20 h-7 text-xs"
            />
            <Button size="sm" onClick={handleExtend} disabled={extending} className="h-7 text-xs">
              {extending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Estender
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── EDIT MODAL ──────────────────────────────────────────────────────────────

function EditAccountModal({ account, onClose, onSaved }) {
  const [form, setForm] = useState({
    suspended: account.suspended || false,
    free: account.free || false,
    trial: account.trial || false,
    trial_ends_at: account.trial_ends_at ? account.trial_ends_at.split('T')[0] : '',
    max_active_users: account.max_active_users || 1,
    subscription_status: account.subscription_status || 'incomplete'
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      await apiService.updateAdminAccount(account.id, {
        ...form,
        max_active_users: Number(form.max_active_users) || 1,
      })
      toast.success('Conta atualizada')
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e.message || 'Erro ao atualizar conta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold">Editar Conta</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.suspended} onChange={(e) => setForm(f => ({ ...f, suspended: e.target.checked }))} />
              Suspensa
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.free} onChange={(e) => setForm(f => ({ ...f, free: e.target.checked }))} />
              Gratuita
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.trial} onChange={(e) => setForm(f => ({ ...f, trial: e.target.checked }))} />
              Em Trial
            </label>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Fim do Trial</label>
            <Input type="date" value={form.trial_ends_at} onChange={(e) => setForm(f => ({ ...f, trial_ends_at: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Máx. usuários ativos</label>
            <Input type="number" min={1} value={form.max_active_users}
              onChange={(e) => setForm(f => ({ ...f, max_active_users: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Status de assinatura</label>
            <select value={form.subscription_status} onChange={(e) => setForm(f => ({ ...f, subscription_status: e.target.value }))}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700">
              {['incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────

function AuditLogsSection({ accountId }) {
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [modelFilter, setModelFilter] = useState('')
  const [models, setModels] = useState([])

  const load = async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, per_page: 20, ...(modelFilter && { model: modelFilter }) }
      const response = await apiService.getAdminAuditLogs(accountId, params)
      setAudits(response.audits || [])
      setTotalPages(response.pagination?.total_pages || 1)
      setTotalCount(response.pagination?.total_count || 0)
      setModels(response.models || [])
      setLoaded(true)
    } catch (e) {
      toast.error('Erro ao carregar auditoria')
    } finally {
      setLoading(false)
    }
  }

  const handleLoad = () => { load(1); setCurrentPage(1) }

  useEffect(() => {
    if (loaded) load(currentPage)
  }, [currentPage, modelFilter])

  const ACTION_COLORS = { create: 'text-green-600', update: 'text-blue-600', destroy: 'text-red-600' }

  const formatChanges = (changes) => {
    if (!changes || Object.keys(changes).length === 0) return null
    return Object.entries(changes)
      .filter(([k]) => !['created_at', 'updated_at'].includes(k))
      .slice(0, 5)
      .map(([key, value]) => {
        const [from, to] = Array.isArray(value) ? value : [null, value]
        return (
          <span key={key} className="inline-flex items-center gap-1 mr-2">
            <span className="font-semibold">{key}:</span>
            {from !== null && <span className="line-through text-gray-400">{String(from).slice(0, 30)}</span>}
            {from !== null && <span>→</span>}
            <span className="text-gray-800 dark:text-gray-200">{String(to).slice(0, 30)}</span>
          </span>
        )
      })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Auditoria {totalCount > 0 && <span className="text-xs font-normal text-gray-500">({totalCount} registros)</span>}
        </h2>
        <div className="flex items-center gap-2">
          {models.length > 0 && (
            <select value={modelFilter} onChange={(e) => { setModelFilter(e.target.value); setCurrentPage(1) }}
              className="text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700">
              <option value="">Todos os modelos</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          {!loaded ? (
            <Button size="sm" variant="outline" onClick={handleLoad}>
              <ChevronDown className="h-3.5 w-3.5 mr-1" />
              Carregar
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={handleLoad}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {!loaded && !loading && (
        <div className="px-6 py-8 text-center text-gray-400 text-sm">
          Clique em "Carregar" para ver o histórico de alterações desta conta
        </div>
      )}

      {loading && (
        <div className="px-6 py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
        </div>
      )}

      {loaded && !loading && (
        <>
          {audits.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500 text-sm">Nenhum registro de auditoria</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {audits.map((audit) => (
                <div key={audit.id} className="px-6 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold uppercase ${ACTION_COLORS[audit.action] || 'text-gray-500'}`}>
                          {audit.action}
                        </span>
                        <span className="text-xs text-gray-500">{audit.auditable_type}</span>
                        {audit.auditable_id && (
                          <span className="text-xs text-gray-400">#{audit.auditable_id}</span>
                        )}
                        {audit.username && (
                          <span className="text-xs text-gray-500">por <strong>{audit.username}</strong></span>
                        )}
                      </div>
                      {audit.audited_changes && Object.keys(audit.audited_changes).length > 0 && (
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 font-mono">
                          {formatChanges(audit.audited_changes)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(audit.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-xs text-gray-500">Página {currentPage} de {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próxima</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export function AdminAccountDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { impersonate } = useAuth()
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [impersonating, setImpersonating] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const loadAll = async () => {
    try {
      setLoading(true)
      const [detailResp, subResp] = await Promise.all([
        apiService.getAdminAccountDetails(id),
        apiService.getAdminAccountSubscriptions(id).catch(() => ({ subscriptions: [] }))
      ])
      setAccount(detailResp.account)
      setDetailData(detailResp)
      setSubscriptions(subResp.subscriptions || [])
    } catch (error) {
      toast.error(error.message || 'Não foi possível carregar os detalhes')
      navigate('/admin')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [id])

  const handleSuspend = async () => {
    if (!confirm('Suspender esta conta?')) return
    try {
      await apiService.suspendAdminAccount(id)
      toast.success('Conta suspensa')
      loadAll()
    } catch (e) { toast.error(e.message) }
  }

  const handleActivate = async () => {
    try {
      await apiService.activateAdminAccount(id)
      toast.success('Conta ativada')
      loadAll()
    } catch (e) { toast.error(e.message) }
  }

  const handleImpersonate = async () => {
    if (!confirm('Entrar como este usuário para suporte?')) return
    try {
      setImpersonating(true)
      const result = await impersonate(id)
      if (result.success) {
        toast.success('Modo de suporte ativado')
        navigate('/')
      } else {
        toast.error(result.error || 'Erro ao entrar como usuário')
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setImpersonating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!account) {
    return (
      <div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800 dark:text-red-200">Conta não encontrada</p>
        </div>
        <Button onClick={() => navigate('/admin')} className="mt-4"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
      </div>
    )
  }

  const stats = detailData?.statistics
  const users = detailData?.users || []

  return (
    <div className="space-y-4">
      {showEdit && (
        <EditAccountModal account={account} onClose={() => setShowEdit(false)} onSaved={loadAll} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              {account.name || 'Sem nome'}
            </h1>
            <p className="text-sm text-gray-500">{account.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Edit2 className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <Button onClick={handleImpersonate} disabled={impersonating} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <LogIn className="h-4 w-4 mr-1" />
            {impersonating ? 'Entrando...' : 'Suporte'}
          </Button>
          {account.suspended ? (
            <Button onClick={handleActivate} size="sm" className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-1" />
              Ativar
            </Button>
          ) : (
            <Button onClick={handleSuspend} variant="destructive" size="sm">
              <Ban className="h-4 w-4 mr-1" />
              Suspender
            </Button>
          )}
        </div>
      </div>

      {/* Status banner */}
      <div className="flex items-center gap-3">
        <AccountStatusBadge account={account} />
        <Badge variant="outline">{account.account_type === 'business' ? 'Empresa' : 'Pessoal'}</Badge>
        {account.free && <Badge className="bg-purple-500 text-white">Gratuita</Badge>}
      </div>

      {/* Stats rápidas */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-2xl font-bold">{stats.users_count}</p>
            <p className="text-xs text-gray-500 mt-1">Usuários</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-2xl font-bold">{stats.transactions_count}</p>
            <p className="text-xs text-gray-500 mt-1">Transações</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-2xl font-bold">{stats.subscriptions_count}</p>
            <p className="text-xs text-gray-500 mt-1">Assinaturas</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-2xl font-bold">{stats.balance?.formatted || 'R$ 0,00'}</p>
            <p className="text-xs text-gray-500 mt-1">Saldo</p>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Informações da conta */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Informações
          </h2>
          <div className="space-y-3">
            <InfoRow label="ID" value={account.prefix_id || account.id} />
            <InfoRow label="Nome" value={account.name} />
            <InfoRow label="Email" value={account.email} />
            <InfoRow label="Telefone" value={account.company?.phone_number} />
            <InfoRow label="Tipo" value={account.account_type === 'business' ? 'Empresa' : 'Pessoal'} />
            <InfoRow label="Criada em" value={new Date(account.created_at).toLocaleString('pt-BR')} />
            <InfoRow label="Atualizada em" value={new Date(account.updated_at).toLocaleString('pt-BR')} />
            <InfoRow label="Owner" value={account.owner?.name || account.owner?.email} />
          </div>
        </div>

        {/* Assinatura */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-green-500" />
            Assinatura
          </h2>
          <div className="space-y-3">
            <InfoRow label="Status" value={account.subscription_status || 'N/A'} />
            <InfoRow label="Plano" value={account.processor_plan_name} />
            <InfoRow label="ID do plano" value={account.processor_plan_id} />
            <InfoRow label="Customer ID (Stripe)" value={account.processor_customer_id} />
            <InfoRow label="Máx. usuários" value={account.max_active_users} />
            <InfoRow label="Usuários usados" value={account.consumed_active_users} />
          </div>
        </div>

        {/* Trial */}
        <TrialSection account={account} onRefresh={loadAll} />

        {/* Usuários da conta */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários da Conta ({users.length})
          </h2>
          {users.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum usuário associado</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{user.name || user.email}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {user.confirmed_at ? 'Confirmado' : <span className="text-orange-500">Não confirmado</span>}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Auditoria */}
      <AuditLogsSection accountId={account.id} />

      {/* Histórico de Assinaturas */}
      {subscriptions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Histórico de Assinaturas ({subscriptions.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {['Plano', 'Status', 'Acesso', 'Período', 'Cancel. no Fim', 'Criada em'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm">{sub.plan?.nickname || sub.name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <Badge className={`${STATUS_COLORS[sub.status] || 'bg-gray-400'} text-white text-xs`}>{sub.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {sub.access_granted
                        ? <Badge className="bg-green-100 text-green-700 text-xs">Liberado</Badge>
                        : <Badge className="bg-red-100 text-red-700 text-xs">Bloqueado</Badge>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {sub.cancel_at_period_end
                        ? <span className="text-orange-600">Sim</span>
                        : <span className="text-gray-400">Não</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(sub.created_at).toLocaleDateString('pt-BR')}
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
