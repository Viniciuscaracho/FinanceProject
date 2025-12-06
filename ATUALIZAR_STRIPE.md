# 🔄 Atualizar Chaves do Stripe

## ⚠️ Situação Atual

Você já tem chaves do Stripe configuradas, mas precisa **atualizar** com as novas chaves que você recebeu.

## 📝 Passo a Passo para Atualizar

### 1. Editar as Credenciais de Desenvolvimento

Execute:

```bash
rails credentials:edit --environment development
```

### 2. Localizar a Seção do Stripe

Procure por:

```yaml
stripe:
  private_key: sk_test_51M2JARGwf430BbLJ3EeOoIGpUDDELLBUJnCuJgO4LUjidYITjvNeli5kxVMRqRpwzg5AEcdbfq31WLUDIxUbfXuU00AUe2sqUr
  public_key: pk_test_51M2JARGwf430BbLJX3nhVvG340lsirPGxkmHBCYhTfpZYEBNWIwm22opuTYlpirQqLytsKei41kq3Lh6tqjLT9kS00ndPGfbwG
  webhook_secret: whsec_4636d4205a1d4dc3604458759bfc4fd9dae572caa6575f61d8bc425bda4be1cc
```

### 3. Adicionar/Atualizar com as Novas Chaves

**Adicione** a seção `barber_management` (se não existir) e **atualize** a seção `stripe`:

```yaml
barber_management:
  stripe:
    api_key: sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U
    webhook_secret: "" # Adicione quando configurar o webhook

stripe:
  private_key: sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U
  public_key: pk_test_51Sac5GDeZMTSsvwKnZ62hmavvFVr9Pvppo5sgp5Hgj2KpkyOS0sxqxazq3k88uh8ubaNowGGj1glv3wCFkkJNiYI004etEsVO3
  webhook_secret: "" # Mantenha o antigo ou adicione novo quando configurar
```

### 4. Salvar e Fechar

- **Nano**: `Ctrl+X`, depois `Y`, depois `Enter`
- **Vim**: `:wq` e `Enter`
- **VS Code**: Salve normalmente

### 5. Reiniciar o Servidor

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
rails server
# ou
bin/dev
```

## ✅ Verificar se Funcionou

Execute no console do Rails:

```bash
rails console
```

Depois:

```ruby
# Verificar se está configurado
BarberManagement::Stripe::Client.configured?
# Deve retornar: true

# Ver os primeiros caracteres da chave
BarberManagement::Stripe::Client.api_key[0..20]
# Deve mostrar: sk_test_51Sac5GDeZMTSsvwK
```

## 🧪 Testar

1. Acesse: `http://localhost:5173/subscription`
2. Clique em "Assinar Agora" em um plano
3. Deve redirecionar para o checkout do Stripe

## 📋 Resumo das Chaves

- **Chave Secreta (Backend)**: `sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U`
- **Chave Pública (Frontend)**: `pk_test_51Sac5GDeZMTSsvwKnZ62hmavvFVr9Pvppo5sgp5Hgj2KpkyOS0sxqxazq3k88uh8ubaNowGGj1glv3wCFkkJNiYI004etEsVO3`

## 🐛 Se Ainda Não Funcionar

1. Verifique se salvou o arquivo corretamente
2. Verifique se reiniciou o servidor
3. Verifique os logs: `tail -f log/development.log`
4. Tente no console:

```ruby
Rails.application.credentials.dig(:barber_management, :stripe, :api_key)
# Deve mostrar a nova chave
```

