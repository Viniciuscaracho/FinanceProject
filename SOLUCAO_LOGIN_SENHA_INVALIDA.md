# 🔐 Solução: Erro "Email ou senha inválidos"

## 📋 Problema Identificado

O erro "Email ou senha inválidos" pode ocorrer por várias razões:

1. **Usuários criados via OAuth (Supabase/Firebase)**: Estes usuários recebem senhas aleatórias que não são conhecidas
2. **Senha incorreta**: A senha digitada não corresponde à senha armazenada
3. **Usuário não confirmado**: Alguns sistemas requerem confirmação de email
4. **Problemas com criptografia**: Raro, mas pode acontecer

## 🔍 Como Diagnosticar

### 1. Listar todos os usuários
```bash
rails auth:list_users
```

Isso mostrará todos os usuários com suas informações de autenticação, incluindo se foram criados via OAuth.

### 2. Diagnosticar um usuário específico
```bash
rails auth:diagnose_password EMAIL=admin@exemplo.com PASSWORD=password
```

Isso vai:
- Verificar se o usuário existe
- Testar se a senha está correta
- Identificar se é um usuário OAuth
- Fornecer instruções específicas para resolver

## ✅ Soluções

### Solução 1: Resetar Senha de Usuário OAuth

Se o usuário foi criado via OAuth (Supabase, Firebase, Google), você precisa resetar a senha:

```bash
rails auth:reset_password EMAIL=email@exemplo.com PASSWORD=nova_senha
```

**Exemplo:**
```bash
rails auth:reset_password EMAIL=admin@exemplo.com PASSWORD=password123
```

### Solução 2: Verificar e Corrigir Usuários

Execute o comando para corrigir problemas comuns:

```bash
rails auth:fix_issues
```

Isso vai:
- Confirmar usuários não confirmados
- Aceitar termos para usuários que não aceitaram
- Identificar usuários sem conta

### Solução 3: Recriar Usuário Admin

Se o usuário admin principal não está funcionando, você pode recriá-lo:

```bash
rails db:seed
```

Ou criar um novo usuário:

```bash
rails users:create_confirmed_user USER_EMAIL=admin@exemplo.com USER_PASSWORD=password123
```

## 📝 Usuários Padrão do Sistema

### Usuário Admin Principal
- **Email**: `admin@exemplo.com`
- **Senha**: `password`
- **Criado por**: `db/seeds.rb`

### Profissionais (se criados via appointments_data.rb)
- **Email**: `joao@barbershop.com`, `maria@barbershop.com`, etc.
- **Senha**: `password123`

## 🚨 Mensagens de Erro Melhoradas

O sistema agora fornece mensagens mais claras:

- **Usuário OAuth**: "Este usuário foi criado via autenticação social. Use o login via [Provider] ou redefina sua senha."
- **Senha inválida**: "Email ou senha inválidos"
- **Usuário não encontrado**: "Email ou senha inválidos"

## 🔧 Comandos Úteis

### Verificar login de um usuário
```bash
rails auth:test_login
```

### Criar usuário de teste
```bash
rails auth:create_test_user
```

### Listar todos os usuários
```bash
rails auth:list_users
```

### Diagnosticar senha
```bash
rails auth:diagnose_password EMAIL=email@exemplo.com PASSWORD=senha
```

### Resetar senha
```bash
rails auth:reset_password EMAIL=email@exemplo.com PASSWORD=nova_senha
```

## 💡 Dicas

1. **Sempre use `rails auth:diagnose_password` primeiro** para entender o problema
2. **Usuários OAuth** não podem fazer login tradicional sem resetar a senha primeiro
3. **Verifique os logs** do Rails para mais detalhes sobre erros de autenticação
4. **Use `rails auth:list_users`** para ver todos os usuários e seus tipos de autenticação

## 📚 Arquivos Relacionados

- `app/controllers/api/v1/auth_controller.rb` - Controller de autenticação
- `lib/tasks/test_auth.rake` - Tasks para diagnóstico e correção
- `app/models/user.rb` - Modelo de usuário
- `db/seeds.rb` - Seeds com usuários padrão

---

**Criado em**: $(date)
**Versão**: 1.0

