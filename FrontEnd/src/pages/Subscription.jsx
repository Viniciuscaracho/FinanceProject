import { useState, useEffect } from 'react'
import {
  Check, Loader2, CreditCard, AlertCircle,
  Crown, Sparkles, ArrowRight, Settings, X, RefreshCw,
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { T, DISPLAY } from '@/lib/tokens'

/* ─── helpers ────────────────────────────────────── */
const fmtBRL = (cents, currency = 'BRL') =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency.toUpperCase() })
    .format((cents ?? 0) / 100)

const fmtInterval = (interval, count = 1) => {
  const map = { day: 'dia', week: 'semana', month: 'mês', year: 'ano' }
  return count === 1 ? `/${map[interval] || interval}` : ` a cada ${count} ${map[interval] || interval}`
}

const fmtDate = (s) =>
  s ? new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

const STATUS_META = {
  active:             { label: 'Ativa',               color: T.green  },
  trialing:           { label: 'Período de teste',    color: T.brand  },
  past_due:           { label: 'Pagamento pendente',  color: T.amber  },
  canceled:           { label: 'Cancelada',           color: '#9CA3AF' },
  incomplete:         { label: 'Incompleta',          color: T.amber  },
  incomplete_expired: { label: 'Expirada',            color: T.red    },
  unpaid:             { label: 'Não paga',            color: T.red    },
}

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.incomplete
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
      color: meta.color, background: meta.color + '18',
      borderRadius: 20, padding: '3px 10px',
    }}>
      {meta.label}
    </span>
  )
}

function Panel({ children, style }) {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, ...style }}>
      {children}
    </div>
  )
}

function Btn({ children, onClick, disabled, variant = 'primary', style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 600, borderRadius: 8,
    padding: '8px 16px', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', border: 'none', opacity: disabled ? 0.55 : 1,
    transition: 'opacity 120ms', ...style,
  }
  const variants = {
    primary:  { background: T.brand,   color: '#fff' },
    outline:  { background: 'transparent', color: T.brand, border: `1px solid ${T.brand}` },
    ghost:    { background: T.chip,    color: T.text, border: `1px solid ${T.border}` },
    danger:   { background: T.red,     color: '#fff' },
    'danger-outline': { background: 'transparent', color: T.red, border: `1px solid ${T.red}` },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  )
}

/* ─── Page ───────────────────────────────────────── */
export function Subscription() {
  const isMobile = useIsMobile()
  const { user }  = useAuth()
  const isAdmin   = user?.account?.admin === true
  const [loading,      setLoading]      = useState(true)
  const [subscription, setSubscription] = useState(null)
  const [plans,        setPlans]        = useState([])
  const [plansError,   setPlansError]   = useState(null)
  const [busy,         setBusy]         = useState(null) // 'checkout:planId' | 'portal' | 'cancel' | 'reactivate' | 'sync'

  /* ── load ──────────────────────────────────────── */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('success') === 'true') {
      window.history.replaceState({}, '', '/subscription')
      toast.success('Assinatura criada! Carregando dados...')
    } else if (p.get('canceled') === 'true') {
      toast.info('Checkout cancelado.')
      window.history.replaceState({}, '', '/subscription')
    }
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    const [subResult, plansResult] = await Promise.allSettled([
      apiService.getSubscription(),
      apiService.getSubscriptionPlans(),
    ])

    if (subResult.status === 'fulfilled') {
      setSubscription(subResult.value)
    }

    if (plansResult.status === 'fulfilled') {
      setPlans(plansResult.value?.plans || [])
      setPlansError(null)
    } else {
      setPlansError('Não foi possível carregar os planos no momento.')
    }

    setLoading(false)
  }

  /* ── actions ───────────────────────────────────── */
  const handleCheckout = async (planId) => {
    try {
      setBusy(`checkout:${planId}`)
      const res = await apiService.createSubscriptionCheckout(planId)
      if (res.checkout_url) window.location.href = res.checkout_url
      else throw new Error('URL de checkout não retornada')
    } catch (err) {
      toast.error(err.message || 'Erro ao criar sessão de checkout.')
    } finally {
      setBusy(null)
    }
  }

  const handlePortal = async () => {
    try {
      setBusy('portal')
      const res = await apiService.getBillingPortal(window.location.origin + '/subscription')
      if (res.portal_url) window.location.href = res.portal_url
      else throw new Error('URL do portal não retornada')
    } catch (err) {
      toast.error('Erro ao abrir portal de cobrança.')
    } finally {
      setBusy(null)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Confirma o cancelamento ao final do período atual?')) return
    try {
      setBusy('cancel')
      const res = await apiService.cancelSubscription()
      setSubscription(res)
      toast.success('Assinatura será cancelada ao final do período.')
    } catch (err) {
      toast.error('Erro ao cancelar assinatura.')
    } finally {
      setBusy(null)
    }
  }

  const handleReactivate = async () => {
    try {
      setBusy('reactivate')
      const res = await apiService.reactivateSubscription()
      setSubscription(res)
      toast.success('Assinatura reativada com sucesso!')
    } catch (err) {
      toast.error('Erro ao reativar assinatura.')
    } finally {
      setBusy(null)
    }
  }

  const handleSync = async () => {
    try {
      setBusy('sync')
      const res = await apiService.syncSubscription()
      setSubscription(res)
      toast.success('Assinatura sincronizada com o Stripe.')
    } catch (err) {
      toast.error('Erro ao sincronizar com o Stripe.')
    } finally {
      setBusy(null)
    }
  }

  /* ── derived ───────────────────────────────────── */
  const sub        = subscription?.subscription
  const subscribed = subscription?.subscribed || false
  const isBusy     = (key) => busy === key
  const anyBusy    = busy !== null

  /* ── render ────────────────────────────────────── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360, ...DISPLAY }}>
      <Loader2 size={24} style={{ color: T.brand, animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, ...DISPLAY }}>

      {/* ── Header ──────────────────────────────── */}
      <div>
        <p style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
          Assinatura
        </p>
        <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
          Gerencie seu plano e dados de cobrança
        </p>
      </div>

      {/* ── Plano atual ─────────────────────────── */}
      {sub ? (
        <Panel>
          <div style={{ padding: '18px 20px' }}>
            {/* título + badge */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Crown size={15} style={{ color: T.brand }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>
                    {sub.name || 'Plano ativo'}
                  </p>
                  <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Assinatura atual</p>
                </div>
              </div>
              <StatusPill status={sub.status} />
            </div>

            {/* métricas */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Início do período',   value: fmtDate(sub.current_period_start) },
                { label: 'Fim do período',      value: fmtDate(sub.current_period_end) },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: T.bg, borderRadius: 8, padding: '10px 12px' }}>
                  <p style={{ fontSize: 11, color: T.muted, margin: '0 0 2px' }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* aviso cancelamento agendado */}
            {sub.cancel_at_period_end && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: T.amber + '14', border: `1px solid ${T.amber}40`,
                borderRadius: 8, padding: '10px 14px', marginBottom: 14,
              }}>
                <AlertCircle size={14} style={{ color: T.amber, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: T.amber, margin: 0, fontWeight: 600 }}>
                  Cancelamento agendado — acesso até {fmtDate(sub.current_period_end)}
                </p>
              </div>
            )}

            {/* ações */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Btn onClick={handlePortal} disabled={anyBusy} variant="ghost">
                {isBusy('portal') ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Settings size={13} />}
                Gerenciar cobrança
              </Btn>

              {isAdmin && (
                <Btn onClick={handleSync} disabled={anyBusy} variant="ghost">
                  {isBusy('sync') ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
                  Sincronizar
                </Btn>
              )}

              {sub.cancel_at_period_end ? (
                <Btn onClick={handleReactivate} disabled={anyBusy} variant="outline">
                  {isBusy('reactivate') ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
                  Reativar assinatura
                </Btn>
              ) : (
                <Btn onClick={handleCancel} disabled={anyBusy} variant="danger-outline">
                  {isBusy('cancel') ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <X size={13} />}
                  Cancelar assinatura
                </Btn>
              )}
            </div>
          </div>
        </Panel>
      ) : (
        <Panel>
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={18} style={{ color: T.muted }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 4px' }}>Sem assinatura ativa</p>
              <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Escolha um plano abaixo ou sincronize se já assinou</p>
            </div>
            {isAdmin && (
              <Btn onClick={handleSync} disabled={anyBusy} variant="ghost">
                {isBusy('sync') ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
                Sincronizar com Stripe
              </Btn>
            )}
          </div>
        </Panel>
      )}

      {/* ── Planos ──────────────────────────────── */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted, margin: '0 0 10px' }}>
          Planos disponíveis
        </p>

        {plansError ? (
          <Panel>
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
              <AlertCircle size={20} style={{ color: T.red }} />
              <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>{plansError}</p>
              <Btn onClick={loadAll} variant="ghost">
                <RefreshCw size={13} /> Tentar novamente
              </Btn>
            </div>
          </Panel>
        ) : plans.length === 0 ? (
          <Panel>
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: T.muted, margin: '0 0 8px' }}>Nenhum plano configurado no momento.</p>
              <code style={{ fontSize: 11, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', color: T.muted }}>
                rails stripe:plans:create_test
              </code>
            </div>
          </Panel>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : `repeat(${Math.min(plans.length, 3)}, 1fr)`,
            gap: 10,
          }}>
            {plans.map(plan => {
              const isCurrent = sub?.plan?.id === plan.id
              const isPopular = plan.metadata?.popular === 'true' || plan.metadata?.featured === 'true'
              const INTERNAL_KEYS = ['popular', 'featured', 'billing_interval', 'plan_type', 'project', 'source', 'timestamp', 'version', 'interval', 'currency']
              const features  = Object.entries(plan.metadata || {})
                .filter(([k]) => !INTERNAL_KEYS.includes(k))

              return (
                <Panel
                  key={plan.id}
                  style={{
                    position: 'relative',
                    display: 'flex', flexDirection: 'column',
                    border: isCurrent
                      ? `2px solid ${T.brand}`
                      : isPopular
                        ? `2px solid ${T.amber}`
                        : `1px solid ${T.border}`,
                  }}
                >
                  {/* badge popular */}
                  {isPopular && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 11, fontWeight: 700, color: '#fff',
                        background: T.amber, borderRadius: 20, padding: '3px 10px',
                      }}>
                        <Sparkles size={10} /> Popular
                      </span>
                    </div>
                  )}

                  <div style={{ padding: '20px 20px 0', flex: 1 }}>
                    {/* nome + badge atual */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>{plan.name}</p>
                        <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{plan.description || 'Plano de assinatura'}</p>
                      </div>
                      {isCurrent && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 10, fontWeight: 700, color: T.brand,
                          background: T.brand + '18', borderRadius: 20, padding: '3px 8px', flexShrink: 0,
                        }}>
                          <Check size={9} /> Atual
                        </span>
                      )}
                    </div>

                    {/* preço */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: features.length ? 14 : 4 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {fmtBRL(plan.amount, plan.currency)}
                      </span>
                      {plan.interval && (
                        <span style={{ fontSize: 12, color: T.muted }}>
                          {fmtInterval(plan.interval, plan.interval_count)}
                        </span>
                      )}
                    </div>

                    {/* features do metadata */}
                    {features.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 12, borderTop: `1px solid ${T.border}`, marginBottom: 0 }}>
                        {features.map(([key, value]) => (
                          <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                            <Check size={12} style={{ color: T.green, flexShrink: 0, marginTop: 2 }} />
                            <span style={{ fontSize: 12, color: T.muted }}>
                              <strong style={{ color: T.text, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</strong>: {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div style={{ padding: 16 }}>
                    {isCurrent ? (
                      <Btn onClick={handlePortal} disabled={anyBusy} variant="ghost" style={{ width: '100%', justifyContent: 'center' }}>
                        {isBusy('portal') ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Settings size={13} />}
                        Gerenciar
                      </Btn>
                    ) : (
                      <Btn
                        onClick={() => handleCheckout(plan.id)}
                        disabled={anyBusy || subscribed}
                        variant={isPopular ? 'primary' : 'outline'}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {isBusy(`checkout:${plan.id}`)
                          ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Processando...</>
                          : subscribed
                            ? <><Check size={13} /> Já assinado</>
                            : <>Assinar agora <ArrowRight size={13} /></>
                        }
                      </Btn>
                    )}
                  </div>
                </Panel>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Rodapé info ─────────────────────────── */}
      <Panel style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <CreditCard size={13} style={{ color: T.muted }} />
          <p style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: 0 }}>Informações de pagamento</p>
        </div>
        {[
          'Pagamentos processados com segurança pelo Stripe',
          'Cancele a qualquer momento — acesso continua até o fim do período',
          'Suporte a cartão de crédito e boleto bancário',
        ].map(t => (
          <p key={t} style={{ fontSize: 12, color: T.muted, margin: '0 0 3px' }}>• {t}</p>
        ))}
      </Panel>

    </div>
  )
}
