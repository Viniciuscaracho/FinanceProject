import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Check, 
  Loader2, 
  CreditCard, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Crown,
  Zap,
  Building2,
  Sparkles,
  ArrowRight,
  Settings,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiService } from '../lib/api'
import { useIsMobile } from '@/hooks/use-mobile'
import { StatCard, FluidSection } from '@/components/design'
import { toast } from 'sonner'

const formatCurrency = (amount, currency = 'BRL') => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount / 100)
}

const formatInterval = (interval, intervalCount = 1) => {
  const intervals = {
    day: 'dia',
    week: 'semana',
    month: 'mês',
    year: 'ano'
  }
  
  if (intervalCount === 1) {
    return `/${intervals[interval] || interval}`
  }
  
  return ` a cada ${intervalCount} ${intervals[interval] || interval}`
}

export function Subscription() {
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(true)
  const [plansLoading, setPlansLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const [plans, setPlans] = useState([])
  const [error, setError] = useState(null)
  const [processingCheckout, setProcessingCheckout] = useState(false)

  useEffect(() => {
    loadData()
    
    // Verificar se veio do checkout do Stripe
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      toast.success('Assinatura criada com sucesso! Aguardando confirmação...')
      // Limpar URL
      window.history.replaceState({}, '', '/subscription')
      // Recarregar dados após um delay para dar tempo do webhook processar
      // O webhook do Stripe pode levar alguns segundos para processar
      setTimeout(() => {
        loadData().then(() => {
          // Verificar se a subscription foi atualizada após 5 segundos
          setTimeout(() => {
            loadData()
          }, 5000)
        })
      }, 3000)
    } else if (urlParams.get('canceled') === 'true') {
      toast.info('Checkout cancelado')
      // Limpar URL
      window.history.replaceState({}, '', '/subscription')
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Carregando dados de assinatura...')
      
      const [subscriptionData, plansData] = await Promise.all([
        apiService.getSubscription().catch(err => {
          console.warn('Erro ao carregar subscription:', err)
          return { subscription: null, subscribed: false }
        }),
        apiService.getSubscriptionPlans().catch(err => {
          console.error('Erro ao carregar planos:', err)
          throw err
        })
      ])

      console.log('📦 Dados recebidos:', {
        subscription: subscriptionData,
        plansData: plansData
      })
      console.log('📦 Subscription detalhada:', JSON.stringify(subscriptionData, null, 2))

      setSubscription(subscriptionData)
      const plansList = plansData?.plans || []
      console.log('📋 Planos carregados:', plansList.length, plansList)
      console.log('📋 Estrutura plansData:', plansData)
      console.log('📋 Tipo de plansList:', typeof plansList, Array.isArray(plansList))
      setPlans(plansList)
      
      if (plansList.length === 0) {
        console.warn('⚠️ Nenhum plano encontrado. Verifique se os planos foram criados no Stripe.')
        console.warn('Resposta completa da API:', plansData)
        toast.warning('Nenhum plano disponível no momento. Verifique o console para mais detalhes.')
      } else {
        console.log('✅ Planos serão renderizados:', plansList.length)
      }
    } catch (err) {
      console.error('❌ Error loading subscription data:', err)
      console.error('Erro completo:', {
        message: err.message,
        stack: err.stack,
        data: err.data
      })
      setError(err.message || 'Erro ao carregar dados de assinatura')
      toast.error(`Erro ao carregar dados: ${err.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
      setPlansLoading(false)
    }
  }

  const handleSubscribe = async (planId) => {
    try {
      setProcessingCheckout(true)
      const response = await apiService.createSubscriptionCheckout(planId)
      
      if (response.checkout_url) {
        // Redirecionar para o checkout do Stripe
        window.location.href = response.checkout_url
      } else {
        throw new Error('URL de checkout não retornada')
      }
    } catch (err) {
      console.error('Error creating checkout:', err)
      
      // Extrair mensagem de erro mais detalhada
      let errorMessage = 'Erro ao criar sessão de checkout. Tente novamente.'
      
      if (err.message) {
        // Tentar extrair mensagem do erro
        const errorData = err.message
        if (typeof errorData === 'string' && errorData.includes('message')) {
          try {
            const parsed = JSON.parse(errorData)
            errorMessage = parsed.message || parsed.error || errorMessage
          } catch {
            // Se não for JSON, usar a mensagem diretamente
            if (errorData.includes('Stripe não está configurado')) {
              errorMessage = 'Stripe não está configurado. Entre em contato com o suporte.'
            } else if (errorData.includes('Account é obrigatório')) {
              errorMessage = 'Erro de autenticação. Faça login novamente.'
            } else {
              errorMessage = errorData
            }
          }
        } else {
          errorMessage = errorData
        }
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        description: 'Verifique os logs do console para mais detalhes.'
      })
    } finally {
      setProcessingCheckout(false)
    }
  }

  const handleBillingPortal = async () => {
    try {
      const returnUrl = window.location.origin + '/subscription'
      const response = await apiService.getBillingPortal(returnUrl)
      
      if (response.portal_url) {
        window.location.href = response.portal_url
      } else {
        throw new Error('URL do portal não retornada')
      }
    } catch (err) {
      console.error('Error opening billing portal:', err)
      toast.error('Erro ao abrir portal de billing. Tente novamente.')
    }
  }


  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Ativa', variant: 'default', icon: CheckCircle2, color: 'bg-green-500' },
      trialing: { label: 'Período de Teste', variant: 'default', icon: Sparkles, color: 'bg-blue-500' },
      past_due: { label: 'Pagamento Pendente', variant: 'destructive', icon: AlertCircle, color: 'bg-yellow-500' },
      canceled: { label: 'Cancelada', variant: 'secondary', icon: X, color: 'bg-gray-500' },
      incomplete: { label: 'Incompleta', variant: 'secondary', icon: AlertCircle, color: 'bg-orange-500' },
      incomplete_expired: { label: 'Expirada', variant: 'destructive', icon: X, color: 'bg-red-500' },
      unpaid: { label: 'Não Paga', variant: 'destructive', icon: X, color: 'bg-red-500' }
    }

    const config = statusConfig[status] || statusConfig.incomplete
    const Icon = config.icon

    return (
      <Badge className={cn("flex items-center gap-1", config.color, "text-white")}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const currentSubscription = subscription?.subscription
  const isSubscribed = subscription?.subscribed || false
  const currentPlanId = currentSubscription?.plan?.id

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie sua assinatura e escolha o plano ideal para você
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Assinatura Atual
                </CardTitle>
                <CardDescription className="mt-2">
                  {currentSubscription.name || 'Plano Ativo'}
                </CardDescription>
              </div>
              {getStatusBadge(currentSubscription.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{getStatusBadge(currentSubscription.status)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Período Atual</p>
                <p className="font-medium">
                  {formatDate(currentSubscription.current_period_start)} - {formatDate(currentSubscription.current_period_end)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Cancelamento</p>
                <p className="font-medium">
                  {currentSubscription.cancel_at_period_end 
                    ? 'Será cancelada ao final do período'
                    : 'Não programado'}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleBillingPortal}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar Assinatura
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* No Subscription Message */}
      {!currentSubscription && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Nenhuma assinatura ativa</h3>
                <p className="text-muted-foreground mt-2">
                  Escolha um plano abaixo para começar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Planos Disponíveis</h2>
          <p className="text-muted-foreground">
            Escolha o plano que melhor se adapta às suas necessidades
          </p>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-2 bg-yellow-100 text-xs rounded">
            <p>Debug: plansLoading={String(plansLoading)}, plans.length={plans?.length || 0}</p>
            <p>plans type: {Array.isArray(plans) ? 'array' : typeof plans}</p>
          </div>
        )}

        {plansLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando planos...</span>
          </div>
        ) : !plans || plans.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">Nenhum plano disponível</h3>
                  <p className="text-muted-foreground mt-2">
                    Não há planos configurados no momento.
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Para criar planos de teste, execute no terminal:
                  </p>
                  <code className="block mt-2 p-2 bg-muted rounded text-xs">
                    rails stripe:plans:create_test
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={cn(
            "grid gap-6",
            isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          )}>
            {plans && plans.length > 0 && plans.map((plan) => {
              const isCurrentPlan = currentPlanId === plan.id
              const isPopular = plan.metadata?.popular === 'true' || plan.metadata?.featured === 'true'
              
              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col",
                    isCurrentPlan && "border-2 border-primary",
                    isPopular && "border-2 border-yellow-500 shadow-lg"
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-yellow-500 text-white px-3 py-1">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {plan.description || 'Plano de assinatura'}
                        </CardDescription>
                      </div>
                      {isCurrentPlan && (
                        <Badge variant="default" className="ml-2">
                          <Check className="h-3 w-3 mr-1" />
                          Atual
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          {formatCurrency(plan.amount, plan.currency)}
                        </span>
                        {plan.interval && (
                          <span className="text-muted-foreground">
                            {formatInterval(plan.interval, plan.interval_count)}
                          </span>
                        )}
                      </div>
                    </div>

                    {plan.metadata && Object.keys(plan.metadata).length > 0 && (
                      <div className="space-y-2 pt-4 border-t">
                        {Object.entries(plan.metadata)
                          .filter(([key]) => !['popular', 'featured'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="text-muted-foreground">
                                <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span> {value}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter>
                    {isCurrentPlan ? (
                      <Button
                        onClick={handleBillingPortal}
                        variant="outline"
                        className="w-full"
                        disabled={processingCheckout}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Gerenciar Assinatura
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={processingCheckout || isSubscribed}
                        className="w-full"
                        variant={isPopular ? "default" : "outline"}
                      >
                        {processingCheckout ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            {isSubscribed ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Já Assinado
                              </>
                            ) : (
                              <>
                                Assinar Agora
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </>
                            )}
                          </>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Info Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Informações de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Pagamentos processados de forma segura através do Stripe
          </p>
          <p>
            • Você pode cancelar sua assinatura a qualquer momento
          </p>
          <p>
            • O acesso continuará até o final do período pago
          </p>
          <p>
            • Suporte a cartão de crédito e boleto bancário
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

