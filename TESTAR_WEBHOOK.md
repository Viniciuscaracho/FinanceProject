# 🧪 Como Testar Webhooks do Stripe Localmente

## Método 1: Usando o Script Rake (Recomendado)

### Listar eventos disponíveis:
```bash
rails stripe:webhook:list_events
```

### Simular um evento:
```bash
# Simular checkout completado
rails stripe:webhook:simulate[checkout.session.completed,ACCOUNT_ID]

# Simular subscription criada
rails stripe:webhook:simulate[customer.subscription.created,ACCOUNT_ID]

# Simular pagamento bem-sucedido
rails stripe:webhook:simulate[invoice.payment_succeeded,ACCOUNT_ID]
```

**Exemplo:**
```bash
rails stripe:webhook:simulate[checkout.session.completed,1]
```

## Método 2: Usando Stripe CLI (Mais Realista)

### 1. Instalar Stripe CLI:
```bash
# Linux
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe

# Ou via snap
sudo snap install stripe
```

### 2. Fazer login:
```bash
stripe login
```

### 3. Escutar eventos e encaminhar para localhost:
```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Isso vai:
- Mostrar um webhook secret (começa com `whsec_`)
- Encaminhar TODOS os eventos do Stripe para seu servidor local

### 4. Configurar o secret nas credentials:
```bash
EDITOR="nano" rails credentials:edit
```

Adicione:
```yaml
barber_management:
  stripe:
    webhook_secret: whsec_COLE_O_SECRET_AQUI
```

### 5. Em outro terminal, disparar um evento de teste:
```bash
# Simular checkout completado
stripe trigger checkout.session.completed

# Simular subscription criada
stripe trigger customer.subscription.created

# Simular pagamento bem-sucedido
stripe trigger invoice.payment_succeeded
```

## Método 3: Testar com Pagamento Real (Modo Teste)

1. Configure o Stripe CLI como no Método 2
2. Faça um pagamento de teste no frontend
3. O webhook será automaticamente encaminhado para localhost

## 📋 Verificar Resultado

Após simular o webhook, verifique:

### No console do Rails:
```ruby
account = Account.find(ACCOUNT_ID)
account.subscription
account.subscription_id
account.subscriptions
```

### Nos logs:
```bash
tail -f log/development.log | grep -i "stripe\|webhook\|subscription"
```

Você deve ver:
- `BarberManagement::Stripe: Checkout completado`
- `Subscriptions::Upsert`
- `Account X atualizado com subscription Y`

## 🐛 Troubleshooting

### Erro: "Account não encontrado"
- Verifique se o ACCOUNT_ID está correto
- Verifique se o account tem `processor_customer_id` definido

### Erro: "Subscription não encontrada no Stripe"
- Para `checkout.session.completed`, o script tenta criar uma subscription real
- Certifique-se de ter pelo menos um price/plano criado no Stripe

### Webhook não processa
- Verifique se o `webhook_secret` está configurado corretamente
- Verifique os logs do Rails para erros específicos

