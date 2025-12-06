# Integração Stripe - BarberManagement

Esta é uma integração dedicada do Stripe especificamente para o projeto BarberManagement, separada de outras integrações (como Procfy).

## Características

- ✅ **Namespace dedicado**: `BarberManagement::Stripe`
- ✅ **Metadata específica**: Todas as operações são marcadas com `source: 'barber_management'`
- ✅ **Isolamento**: Não interfere com outras integrações Stripe
- ✅ **Configuração flexível**: Suporta credenciais específicas ou genéricas

## Configuração

### 1. Credenciais do Stripe

Execute no terminal:

```bash
rails credentials:edit
```

Adicione as credenciais do Stripe (recomendado - específico para BarberManagement):

```yaml
barber_management:
  stripe:
    api_key: sk_test_... # ou sk_live_... para produção
    webhook_secret: whsec_...
```

**OU** use as credenciais genéricas (compatibilidade):

```yaml
stripe:
  private_key: sk_test_...
  webhook_secret: whsec_...
```

### 2. Variáveis de Ambiente (Opcional)

```bash
# URL do frontend
export FRONTEND_URL="http://localhost:5173"

# URLs de callback customizadas
export BARBER_MANAGEMENT_CHECKOUT_SUCCESS_URL="https://seu-dominio.com/subscription?success=true"
export BARBER_MANAGEMENT_CHECKOUT_CANCEL_URL="https://seu-dominio.com/subscription?canceled=true"
export BARBER_MANAGEMENT_BILLING_PORTAL_RETURN_URL="https://seu-dominio.com/subscription"
```

### 3. Configurar Webhook no Stripe Dashboard

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em "Add endpoint"
3. URL: `https://seu-dominio.com/webhooks/stripe`
4. Eventos para escutar:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copie o "Signing secret" e adicione nas credenciais

## Estrutura da Integração

```
app/services/barber_management/stripe/
├── client.rb                          # Cliente principal com configuração
├── create_checkout_session.rb          # Cria sessões de checkout
├── create_billing_portal_session.rb   # Cria sessões do portal de billing
└── webhook_handler.rb                  # Processa webhooks do Stripe
```

## Como Usar

### Criar Checkout Session

```ruby
result = BarberManagement::Stripe::CreateCheckoutSession.call(
  account: account,
  user: user,
  plan_id: 'price_xxxxx'
)

if result.success?
  checkout_url = result.session.url
  # Redirecionar usuário para checkout_url
end
```

### Criar Billing Portal Session

```ruby
result = BarberManagement::Stripe::CreateBillingPortalSession.call(
  account: account,
  return_url: 'https://seu-dominio.com/subscription'
)

if result.success?
  portal_url = result.session.url
  # Redirecionar usuário para portal_url
end
```

### Processar Webhooks

Os webhooks são processados automaticamente pelo `Webhooks::StripeController`, que:
1. Primeiro tenta processar com `BarberManagement::Stripe::WebhookHandler`
2. Se não for do BarberManagement, processa com handlers genéricos

## Metadata

Todas as operações incluem metadata para identificação:

```ruby
{
  source: 'barber_management',
  project: 'BarberManagement',
  version: '1.0',
  account_id: '123',
  user_id: '456',
  timestamp: '2024-01-01T00:00:00Z'
}
```

Isso permite:
- Filtrar eventos no Stripe Dashboard
- Identificar operações do BarberManagement
- Separar de outras integrações

## Testes

Para testar em modo de desenvolvimento:

1. Use as chaves de teste do Stripe (`sk_test_...`)
2. Use o Stripe CLI para testar webhooks localmente:

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

## Troubleshooting

### Erro: "Stripe não está configurado"

Verifique se as credenciais estão configuradas:
```bash
rails credentials:show | grep barber_management
```

### Webhooks não estão sendo processados

1. Verifique se o webhook secret está correto
2. Verifique se o endpoint está acessível publicamente
3. Verifique os logs: `tail -f log/development.log`

### Eventos não são identificados como BarberManagement

Certifique-se de que as operações estão usando os serviços do namespace `BarberManagement::Stripe`, não os genéricos.

## Migração de Integração Antiga

Se você estava usando a integração genérica, a nova integração é compatível:
- Mantém compatibilidade com credenciais em `stripe.private_key`
- Processa eventos antigos e novos
- Metadata permite identificar origem

## Suporte

Para problemas ou dúvidas, verifique:
- Logs: `log/development.log` ou `log/production.log`
- Stripe Dashboard: Eventos e logs de webhook
- Documentação do Stripe: https://stripe.com/docs

