# 🔑 Adicionar Chaves do Stripe - Guia Rápido

## Suas Chaves do Stripe

- **Chave Secreta**: `sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U`
- **Chave Pública**: `pk_test_51Sac5GDeZMTSsvwKnZ62hmavvFVr9Pvppo5sgp5Hgj2KpkyOS0sxqxazq3k88uh8ubaNowGGj1glv3wCFkkJNiYI004etEsVO3`

## 📝 Como Adicionar

### Opção 1: Usando o Editor de Credenciais (Recomendado)

Execute no terminal:

```bash
rails credentials:edit --environment development
```

Isso abrirá o editor. Adicione ou atualize as seguintes linhas:

```yaml
barber_management:
  stripe:
    api_key: sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U
    webhook_secret: ""

stripe:
  private_key: sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U
  webhook_secret: ""
```

**Salve e feche o editor:**
- Nano: `Ctrl+X`, `Y`, `Enter`
- Vim: `:wq`, `Enter`
- VS Code: Salve normalmente

### Opção 2: Usando Variáveis de Ambiente (Alternativa)

Se preferir usar variáveis de ambiente, adicione ao seu `.env` ou `.env.development`:

```bash
BARBER_MANAGEMENT_STRIPE_API_KEY=sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U
STRIPE_PRIVATE_KEY=sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U
```

E atualize o código para ler dessas variáveis (mas a Opção 1 é mais segura).

## ✅ Verificar se Funcionou

Após adicionar as credenciais, execute:

```bash
rails console
```

No console, execute:

```ruby
# Verificar configuração
BarberManagement::Stripe::Client.configured?
# Deve retornar: true

# Ver a chave (primeiros caracteres)
BarberManagement::Stripe::Client.api_key[0..20]
# Deve mostrar: sk_test_51Sac5GDeZMTSsvwK
```

## 🔄 Reiniciar o Servidor

Após configurar, **reinicie o servidor Rails**:

```bash
# Parar o servidor atual (Ctrl+C)
# Iniciar novamente
rails server
# ou
bin/dev
```

## 🧪 Testar

1. Acesse a página de assinatura: `/subscription`
2. Clique em "Assinar Agora" em um plano
3. Deve redirecionar para o checkout do Stripe

## ⚠️ Importante

- ✅ As chaves de teste (`sk_test_...`) são seguras para desenvolvimento
- ❌ **NUNCA** commite as chaves no Git
- ✅ O arquivo `config/credentials/development.yml.enc` já está criptografado e pode ser commitado
- ❌ O arquivo `config/credentials/development.key` **NÃO** deve ser commitado

## 🐛 Se Ainda Não Funcionar

1. Verifique os logs: `tail -f log/development.log`
2. Verifique se salvou o arquivo corretamente
3. Verifique se reiniciou o servidor
4. Tente novamente no console do Rails:

```ruby
BarberManagement::Stripe::Client.api_key
# Deve mostrar a chave completa
```

