# Configuração do Supabase

Este documento descreve como configurar o Supabase para o sistema BarberManagement.

## Stack Configurada

- **Frontend**: React com Tailwind/ShadCN
- **Backend**: Rails (API Mode)
- **Deploy**: Render
- **Background Jobs**: Sidekiq + Redis
- **Banco**: Supabase (Postgres)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth
- **Pagamentos**: Stripe (webhooks processados no Rails)

## 1. Configuração do Supabase

### 1.1 Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Crie um novo projeto
4. Anote as seguintes informações:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: Chave pública (pode ser exposta no frontend)
   - **Service Role Key**: Chave privada (NUNCA expor no frontend)
   - **JWT Secret**: Secret usado para assinar tokens JWT

### 1.2 Configurar Banco de Dados

O Supabase já fornece um banco PostgreSQL. Você pode:

**Opção A: Usar o banco do Supabase diretamente**
- Use as credenciais de conexão do Supabase
- Configure as variáveis de ambiente `SUPABASE_DB_*`

**Opção B: Usar banco separado (Render, etc.)**
- Mantenha as variáveis `DATABASE_*` existentes
- O sistema suporta ambos

### 1.3 Configurar Storage

1. No dashboard do Supabase, vá para **Storage**
2. Crie buckets conforme necessário (ex: `avatars`, `documents`, `uploads`)
3. Configure políticas de acesso (RLS - Row Level Security)
4. Anote as credenciais de acesso S3-compatível (se disponível)

## 2. Variáveis de Ambiente

### 2.1 Backend (Rails)

Configure as seguintes variáveis no Render ou no seu ambiente:

```bash
# Supabase Auth
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-here

# Supabase Database (se usando)
SUPABASE_DB_HOST=db.xxxxx.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-password

# Supabase Storage (S3-compatible)
SUPABASE_STORAGE_ACCESS_KEY=your-access-key
SUPABASE_STORAGE_SECRET_KEY=your-secret-key
SUPABASE_STORAGE_REGION=us-east-1
SUPABASE_STORAGE_BUCKET=your-bucket-name
SUPABASE_STORAGE_ENDPOINT=https://xxxxx.supabase.co/storage/v1
```

### 2.2 Frontend (React)

Crie um arquivo `.env` na pasta `FrontEnd/`:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE**: Nunca exponha a `SUPABASE_SERVICE_ROLE_KEY` no frontend!

## 3. Configuração do Banco de Dados

### 3.1 Usando Supabase Postgres

Se você está usando o banco do Supabase, atualize `config/database.yml` ou use `DATABASE_URL`:

```bash
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

### 3.2 Migrations

Execute as migrations normalmente:

```bash
rails db:migrate
```

## 4. Autenticação

### 4.1 Backend

O sistema já está configurado para aceitar tokens do Supabase. O endpoint `/api/v1/auth/supabase_login` valida o token e cria/atualiza o usuário local.

### 4.2 Frontend

Use o `AuthContext` que já está configurado:

```jsx
import { useAuth } from '../contexts/AuthContext';

function LoginComponent() {
  const { loginWithSupabase, signUpWithSupabase } = useAuth();

  const handleLogin = async () => {
    const result = await loginWithSupabase(email, password);
    if (result.success) {
      // Usuário autenticado
    }
  };

  const handleSignUp = async () => {
    const result = await signUpWithSupabase(email, password, {
      first_name: 'John',
      last_name: 'Doe'
    });
  };
}
```

## 5. Storage

### 5.1 Usando Supabase Storage

O módulo `Supabase::Storage` está disponível no backend:

```ruby
# Upload
result = Supabase::Storage.upload('avatars', 'user-123.jpg', file)
if result[:success]
  url = result[:url]
end

# Download
result = Supabase::Storage.download('avatars', 'user-123.jpg')

# Delete
result = Supabase::Storage.delete('avatars', 'user-123.jpg')

# URL pública
url = Supabase::Storage.public_url('avatars', 'user-123.jpg')
```

### 5.2 Configurar Active Storage (Opcional)

Para usar Supabase Storage com Active Storage, atualize `config/storage.yml`:

```yaml
supabase:
  service: S3
  access_key_id: <%= ENV.fetch('SUPABASE_STORAGE_ACCESS_KEY') %>
  secret_access_key: <%= ENV.fetch('SUPABASE_STORAGE_SECRET_KEY') %>
  region: <%= ENV.fetch('SUPABASE_STORAGE_REGION', 'us-east-1') %>
  bucket: <%= ENV.fetch('SUPABASE_STORAGE_BUCKET') %>
  endpoint: <%= ENV.fetch('SUPABASE_STORAGE_ENDPOINT') %>
```

E em `config/environments/production.rb`:

```ruby
config.active_storage.service = :supabase
```

## 6. Stripe Webhooks

Os webhooks do Stripe continuam funcionando normalmente. Eles são processados no Rails em `app/controllers/webhooks/stripe_controller.rb`.

## 7. Deploy no Render

O `render.yaml` já está configurado com as variáveis do Supabase. Você só precisa:

1. Adicionar os valores das variáveis no dashboard do Render
2. Para variáveis sensíveis, use `sync: false` (já configurado)

## 8. Testes

### 8.1 Testar Autenticação

```bash
# No frontend
curl -X POST http://localhost:5173/api/v1/auth/supabase_login \
  -H "Content-Type: application/json" \
  -d '{"access_token": "seu-token-aqui"}'
```

### 8.2 Testar Storage

```ruby
# No console Rails
file = File.open('test.jpg')
result = Supabase::Storage.upload('test-bucket', 'test.jpg', file)
puts result
```

## 9. Troubleshooting

### Erro: "Supabase não configurado"
- Verifique se as variáveis de ambiente estão definidas
- Verifique se o inicializador `config/initializers/supabase.rb` está carregando corretamente

### Erro: "Token inválido"
- Verifique se o `SUPABASE_JWT_SECRET` está correto
- Verifique se o token não expirou

### Erro: "Erro na comunicação com Supabase"
- Verifique se a `SUPABASE_URL` está correta
- Verifique se há problemas de rede/firewall

## 10. Segurança

- ✅ Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend
- ✅ Use `SUPABASE_ANON_KEY` apenas no frontend
- ✅ Configure RLS (Row Level Security) no Supabase
- ✅ Use HTTPS em produção
- ✅ Valide tokens no backend antes de processar requisições

## 11. Próximos Passos

1. Configure as variáveis de ambiente no Render
2. Execute as migrations no banco do Supabase
3. Teste a autenticação
4. Configure os buckets de storage
5. Teste o upload/download de arquivos

## Suporte

Para mais informações, consulte:
- [Documentação do Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

