# 📝 Como Editar as Credenciais do Stripe

## Método 1: Usando o Script (Mais Fácil)

Execute:

```bash
bin/edit-stripe-credentials.sh
```

O script abrirá o editor automaticamente.

## Método 2: Manualmente

### Opção A: Com Nano (Recomendado)

```bash
EDITOR=nano rails credentials:edit --environment development
```

**No editor nano:**
1. Use as setas para navegar
2. Localize a seção `stripe:` ou adicione uma nova
3. Adicione/atualize as chaves conforme mostrado abaixo
4. Para salvar: `Ctrl+X`, depois `Y`, depois `Enter`

### Opção B: Com Vim

```bash
EDITOR=vim rails credentials:edit --environment development
```

**No editor vim:**
1. Pressione `i` para entrar no modo de inserção
2. Edite o arquivo
3. Para salvar: `Esc`, depois `:wq`, depois `Enter`

### Opção C: Com VS Code

```bash
EDITOR="code --wait" rails credentials:edit --environment development
```

## 📋 O Que Adicionar no Arquivo

Adicione ou atualize estas seções:

```yaml
barber_management:
  stripe:
    api_key: sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U
    webhook_secret: ""

stripe:
  private_key: sk_test_51Sac5GDeZMTSsvwKXEctUqrhNxl5ExDNabJ2im0389GriFibit8FWedhMkUGfZR3VBaCYITjwFP1hAsTrzVuRwRq001gyTAr8U
  public_key: pk_test_51Sac5GDeZMTSsvwKnZ62hmavvFVr9Pvppo5sgp5Hgj2KpkyOS0sxqxazq3k88uh8ubaNowGGj1glv3wCFkkJNiYI004etEsVO3
  webhook_secret: ""
```

## ✅ Verificar se Funcionou

Após salvar, execute:

```bash
rails console
```

No console:

```ruby
BarberManagement::Stripe::Client.configured?
# Deve retornar: true

BarberManagement::Stripe::Client.api_key[0..20]
# Deve mostrar: sk_test_51Sac5GDeZMTSsvwK
```

## 🔄 Reiniciar o Servidor

**IMPORTANTE**: Após editar as credenciais, reinicie o servidor:

```bash
# Parar o servidor (Ctrl+C)
rails server
# ou
bin/dev
```

## 🐛 Problemas Comuns

### "No $EDITOR to open file"

Configure um editor:

```bash
export EDITOR=nano
rails credentials:edit --environment development
```

Ou use o script:

```bash
bin/edit-stripe-credentials.sh
```

### "File encrypted and saved" mas não editou

Isso significa que você fechou o editor sem salvar. Tente novamente e certifique-se de salvar:
- Nano: `Ctrl+X`, `Y`, `Enter`
- Vim: `Esc`, `:wq`, `Enter`

