# Configuração de Variáveis de Ambiente

## Configurar Supabase

Para usar o Supabase Auth, você precisa configurar as variáveis de ambiente:

1. **Copie o arquivo de exemplo**:
   ```bash
   cp .env.example .env
   ```

2. **Obtenha suas credenciais do Supabase**:
   - Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Crie um novo projeto ou selecione um existente
   - Vá em **Settings** > **API**
   - Copie:
     - **Project URL** → `VITE_SUPABASE_URL`
     - **anon public** key → `VITE_SUPABASE_ANON_KEY`

3. **Edite o arquivo `.env`** e adicione as credenciais:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Reinicie o servidor de desenvolvimento**:
   ```bash
   pnpm dev
   ```

## Sem Supabase

Se você não quiser usar o Supabase agora, a aplicação continuará funcionando normalmente usando o sistema de autenticação tradicional (login/email e senha).

O código está preparado para funcionar com ou sem Supabase configurado.

## Notas

- ⚠️ O arquivo `.env` não deve ser commitado no Git (já está no .gitignore)
- ✅ O arquivo `.env.example` serve como template e pode ser commitado
- ✅ As variáveis `VITE_*` são expostas no frontend, então use apenas chaves públicas

