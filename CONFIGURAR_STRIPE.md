# 🔧 Como Configurar as Credenciais do Stripe

Você recebeu duas chaves do Stripe:

- **Chave Pública (Publishable Key)**: `pk_test_51Sac5GDeZMTSsvwKnZ62hmavvFVr9Pvppo5sgp5Hgj2KpkyOS0sxqxazq3k88uh8ubaNowGGj1glv3wCFkkJNiYI004etEsVO3`
  - Esta chave é usada no **frontend** (se necessário)
  
- **Chave Secreta (Secret Key)**: `sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U`
  - Esta chave é usada no **backend** (Rails)

## 📝 Passo a Passo

### 1. Editar as Credenciais do Rails

Execute no terminal:

```bash
rails credentials:edit
```

### 2. Adicionar as Credenciais

Adicione o seguinte conteúdo no arquivo (substitua o conteúdo existente ou adicione ao final):

```yaml
barber_management:
  stripe:
    api_key: sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U
    webhook_secret: "" # Adicione quando configurar o webhook no Stripe Dashboard

stripe:
  private_key: sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U
  webhook_secret: "" # Adicione quando configurar o webhook no Stripe Dashboard
```

### 3. Salvar e Sair

- Se estiver usando **nano**: `Ctrl+X`, depois `Y`, depois `Enter`
- Se estiver usando **vim**: `:wq` e `Enter`
- Se estiver usando **VS Code**: Salve o arquivo normalmente

### 4. Verificar a Configuração

Execute no console do Rails:

```bash
rails console
```

Depois execute:

```ruby
# Verificar se está configurado
BarberManagement::Stripe::Client.configured?
# Deve retornar: true

# Ver a chave (primeiros e últimos caracteres)
key = BarberManagement::Stripe::Client.api_key
puts "#{key[0..10]}...#{key[-10..-1]}"
# Deve mostrar: sk_test_51...#TAr8U
```

### 5. (Opcional) Configurar Webhook Secret

Quando você configurar o webhook no Stripe Dashboard:

1. Acesse: https://dashboard.stripe.com/webhooks
2. Crie um novo endpoint apontando para: `https://seu-dominio.com/webhooks/stripe`
3. Copie o "Signing secret" (começa com `whsec_...`)
4. Edite as credenciais novamente e adicione o webhook_secret

## ✅ Testar a Configuração

Após configurar, reinicie o servidor Rails:

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
rails server
```

Ou se estiver usando o Procfile:

```bash
bin/dev
```

## 🐛 Troubleshooting

### Erro: "Missing 'config/master.key'"

Se você não tem o arquivo `config/master.key`, você precisa:

1. Verificar se existe um arquivo `.gitignore` que ignore o `master.key`
2. Se estiver em um repositório Git, verificar se alguém compartilhou o `master.key` de forma segura
3. Ou criar um novo arquivo de credenciais (isso vai invalidar as credenciais antigas)

### Erro: "Stripe não está configurado"

1. Verifique se você salvou o arquivo de credenciais corretamente
2. Verifique se a chave está no formato correto (sem espaços extras)
3. Reinicie o servidor Rails

### Verificar se a chave está correta

```ruby
rails console
BarberManagement::Stripe::Client.api_key
# Deve retornar a chave completa
```

## 📌 Nota Importante

⚠️ **NUNCA** compartilhe suas chaves secretas (`sk_test_...` ou `sk_live_...`) publicamente!

- ✅ As chaves de teste (`sk_test_...`) podem ser usadas em desenvolvimento
- ✅ As chaves de produção (`sk_live_...`) devem ser mantidas em segredo absoluto
- ✅ Use variáveis de ambiente ou Rails credentials (como estamos fazendo)

## 🎯 Próximos Passos

Após configurar as credenciais:

1. ✅ Reinicie o servidor Rails
2. ✅ Tente criar um checkout novamente
3. ✅ Verifique os logs se houver erros
4. ✅ Configure o webhook quando estiver pronto para produção

