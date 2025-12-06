# 🔗 Configuração do Webhook do Stripe

## 📍 URL do Endpoint

A URL do webhook que você deve configurar no Stripe é:

### Para Desenvolvimento Local:
```
http://localhost:3000/webhooks/stripe
```

### Para Produção:
```
https://SEU_DOMINIO.com/webhooks/stripe
```

**Exemplo:** Se seu domínio for `barbermanagement.com`, a URL seria:
```
https://barbermanagement.com/webhooks/stripe
```

## 📋 Eventos que Devem Ser Configurados

No painel do Stripe, você deve selecionar os seguintes eventos para enviar ao webhook:

### Eventos Essenciais (Obrigatórios):
1. ✅ **`checkout.session.completed`** - Quando o checkout é completado
2. ✅ **`customer.subscription.created`** - Quando uma subscription é criada
3. ✅ **`customer.subscription.updated`** - Quando uma subscription é atualizada
4. ✅ **`customer.subscription.deleted`** - Quando uma subscription é cancelada
5. ✅ **`invoice.payment_succeeded`** - Quando um pagamento de invoice é bem-sucedido
6. ✅ **`invoice.payment_failed`** - Quando um pagamento de invoice falha

### Eventos Opcionais (Recomendados):
7. ⚠️ **`invoice.created`** - Quando uma invoice é criada
8. ⚠️ **`invoice.payment_action_required`** - Quando uma ação é necessária no pagamento

## 🔧 Como Configurar no Stripe Dashboard

### Passo 1: Acessar Webhooks
1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em **"Add endpoint"** ou **"Adicionar endpoint"**

### Passo 2: Configurar o Endpoint
1. **Endpoint URL**: Cole a URL do seu webhook (veja acima)
2. **Description**: "BarberManagement - Webhook de Assinaturas"
3. **Events to send**: Selecione "Select events" e escolha os eventos listados acima

### Passo 3: Obter o Webhook Secret
1. Após criar o endpoint, clique nele
2. Na seção **"Signing secret"**, clique em **"Reveal"** ou **"Revelar"**
3. Copie o secret (começa com `whsec_...`)

### Passo 4: Configurar no Rails
Adicione o secret nas suas credentials do Rails:

```bash
# Editar credentials
EDITOR="nano" rails credentials:edit

# Ou se preferir vim:
EDITOR="vim" rails credentials:edit
```

Adicione ou atualize:

```yaml
barber_management:
  stripe:
    webhook_secret: whsec_SEU_SECRET_AQUI
    api_key: sk_test_SEU_API_KEY_AQUI  # ou sk_live_ para produção
```

**OU** (para compatibilidade com configuração antiga):

```yaml
stripe:
  webhook_secret: whsec_SEU_SECRET_AQUI
  private_key: sk_test_SEU_API_KEY_AQUI
```

## 🧪 Testando o Webhook Localmente

Para testar webhooks localmente, você pode usar o Stripe CLI:

```bash
# Instalar Stripe CLI (se ainda não tiver)
# macOS: brew install stripe/stripe-cli/stripe
# Linux: https://stripe.com/docs/stripe-cli

# Fazer login
stripe login

# Escutar eventos e encaminhar para localhost
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Isso vai:
1. Criar um webhook endpoint temporário no Stripe
2. Mostrar o webhook secret (começa com `whsec_`)
3. Encaminhar todos os eventos para seu servidor local

**Importante:** Use o secret mostrado pelo Stripe CLI nas suas credentials para desenvolvimento.

## 🔍 Verificando se Está Funcionando

### 1. Verificar Logs do Rails
Após fazer um pagamento de teste, verifique os logs:

```bash
tail -f log/development.log | grep -i "stripe\|webhook\|subscription"
```

Você deve ver mensagens como:
- `BarberManagement::Stripe: Checkout completado para account X`
- `BarberManagement::Stripe: Sincronizando subscription Y após checkout`
- `Account X atualizado com subscription Y`

### 2. Verificar no Stripe Dashboard
1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique no seu endpoint
3. Vá na aba **"Events"** ou **"Eventos"**
4. Verifique se os eventos estão sendo recebidos e processados com sucesso (status 200)

### 3. Verificar no Banco de Dados
Execute no Rails console:

```ruby
# Verificar webhooks recebidos
SubscriptionWebhook.order(created_at: :desc).limit(5)

# Verificar subscriptions criadas
Account.find(SEU_ACCOUNT_ID).subscriptions
```

## ⚠️ Troubleshooting

### Webhook retorna 400 Bad Request
- Verifique se o `webhook_secret` está correto nas credentials
- Verifique se o endpoint está acessível (não bloqueado por firewall)

### Webhook retorna 200 mas subscription não atualiza
- Verifique os logs do Rails para erros
- Verifique se o `processor_customer_id` está correto no account
- Execute o diagnóstico: `rails subscription:diagnose[ACCOUNT_ID]`

### Eventos não estão sendo recebidos
- Verifique se os eventos estão selecionados no Stripe Dashboard
- Verifique se o endpoint está ativo (não desabilitado)
- Teste enviando um evento de teste do Stripe Dashboard

## 📝 Resumo Rápido

**URL do Webhook:**
```
https://SEU_DOMINIO.com/webhooks/stripe
```

**Eventos Principais:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Configuração:**
1. Criar endpoint no Stripe Dashboard
2. Copiar o webhook secret
3. Adicionar nas Rails credentials
4. Testar com um pagamento de teste

