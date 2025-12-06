# Configuração da Stack - BarberManagement

## Stack Implementada

✅ **Frontend**: React com Tailwind CSS e ShadCN UI
✅ **Backend**: Rails (API Mode compatível)
✅ **Deploy**: Render
✅ **Background Jobs**: Sidekiq + Redis
✅ **Banco**: Supabase (Postgres) - Configurado
✅ **Storage**: Supabase Storage - Configurado
✅ **Auth**: Supabase Auth - Configurado
✅ **Pagamentos**: Stripe (webhooks processados no Rails)

## Arquivos Modificados/Criados

### Backend (Rails)

1. **Gemfile** - Já possui todas as gems necessárias (JWT, Stripe, Sidekiq, Redis)

2. **config/initializers/supabase.rb** - Configuração do Supabase
   - Lê variáveis de ambiente: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`

3. **lib/supabase/auth.rb** - Módulo de autenticação Supabase
   - `verify_token(token)` - Valida token JWT do Supabase
   - `get_user_from_token(token)` - Obtém/cria usuário a partir do token
   - `generate_access_token(user)` - Gera token de acesso para o sistema

4. **lib/supabase/storage.rb** - Módulo de storage Supabase
   - `upload(bucket, path, file)` - Upload de arquivo
   - `download(bucket, path)` - Download de arquivo
   - `delete(bucket, path)` - Deletar arquivo
   - `public_url(bucket, path)` - Obter URL pública

5. **app/controllers/api/v1/auth_controller.rb** - Adicionado método `supabase_login`
   - Endpoint: `POST /api/v1/auth/supabase_login`
   - Recebe `access_token` do Supabase e valida/cria usuário

6. **app/controllers/api/v1/application_controller.rb** - Atualizado `authenticate_user!`
   - Agora suporta autenticação via Supabase além do sistema legado

7. **config/routes/web.rb** - Adicionada rota `supabase_login`

8. **config/database.yml** - Suporte para Supabase Postgres
   - Aceita `DATABASE_URL` ou variáveis `SUPABASE_DB_*`

9. **config/storage.yml** - Configuração para Supabase Storage
   - Serviço `supabase` configurado como S3-compatible

10. **render.yaml** - Variáveis de ambiente do Supabase adicionadas
    - Configurado para web e worker services

### Frontend (React)

1. **package.json** - Adicionado `@supabase/supabase-js`

2. **src/lib/supabase.js** - Cliente Supabase
   - Configuração do cliente Supabase
   - Helpers: `getCurrentUser()`, `getCurrentSession()`

3. **src/lib/api.js** - Adicionado método `supabaseLogin(accessToken)`

4. **src/contexts/AuthContext.jsx** - Integração com Supabase Auth
   - `loginWithSupabase(email, password)` - Login via Supabase
   - `signUpWithSupabase(email, password, metadata)` - Cadastro via Supabase
   - Listener para mudanças de autenticação
   - Sincronização automática com backend

## Variáveis de Ambiente Necessárias

### Backend (Render)

```bash
# Supabase Auth
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-here

# Supabase Database (opcional, se usando Supabase Postgres)
SUPABASE_DB_HOST=db.xxxxx.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-password

# Supabase Storage
SUPABASE_STORAGE_ACCESS_KEY=your-access-key
SUPABASE_STORAGE_SECRET_KEY=your-secret-key
SUPABASE_STORAGE_REGION=us-east-1
SUPABASE_STORAGE_BUCKET=your-bucket-name
SUPABASE_STORAGE_ENDPOINT=https://xxxxx.supabase.co/storage/v1
```

### Frontend (.env)

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Próximos Passos

1. **Instalar dependências do frontend**:
   ```bash
   cd FrontEnd
   pnpm install
   ```

2. **Configurar variáveis de ambiente**:
   - Adicionar no Render (backend)
   - Criar `.env` no frontend

3. **Criar projeto no Supabase**:
   - Acessar https://supabase.com
   - Criar novo projeto
   - Copiar credenciais

4. **Configurar banco de dados**:
   - Usar Supabase Postgres ou manter banco atual
   - Executar migrations

5. **Configurar Storage**:
   - Criar buckets no Supabase
   - Configurar políticas RLS

6. **Testar autenticação**:
   - Testar login/cadastro no frontend
   - Verificar sincronização com backend

## Documentação Adicional

- Ver `SUPABASE_SETUP.md` para guia completo de configuração
- Ver documentação do Supabase: https://supabase.com/docs

## Notas Importantes

- ⚠️ **NUNCA** exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend
- ✅ Use `SUPABASE_ANON_KEY` apenas no frontend
- ✅ Configure RLS (Row Level Security) no Supabase
- ✅ O sistema mantém compatibilidade com autenticação legada
- ✅ Stripe webhooks continuam funcionando normalmente

