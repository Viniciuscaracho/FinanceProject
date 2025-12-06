# Segurança de Variáveis de Ambiente

Este documento descreve como as variáveis de ambiente estão sendo gerenciadas e as práticas de segurança aplicadas.

## ⚠️ Status Atual

### ✅ Implementado
- Arquivos `.env` criados para desenvolvimento local
- Variáveis de ambiente configuradas no `render.yaml` para produção/staging
- Uso de `ENV.fetch` com valores padrão seguros
- Separação entre chaves públicas (anon) e privadas (service_role)
- Validação de configuração em produção/staging

### ⚠️ Problemas Identificados e Corrigidos
1. **Arquivos `.env` não estavam no `.gitignore`** ✅ CORRIGIDO
   - Criado `.gitignore` na raiz do projeto
   - Atualizado `.gitignore` do FrontEnd
   - Arquivos `.env` agora estão protegidos

2. **Falta de documentação sobre segurança** ✅ CORRIGIDO
   - Este documento foi criado

## 📋 Como as Variáveis são Carregadas

### Backend (Rails)
O Rails **NÃO carrega automaticamente** arquivos `.env`. Você precisa:

**Opção 1: Carregar manualmente via shell**
```bash
export SUPABASE_URL=https://zcsxyzywwsciyuyjogbi.supabase.co
export SUPABASE_ANON_KEY=...
```

**Opção 2: Usar dotenv (recomendado para desenvolvimento)**
Adicione ao `Gemfile`:
```ruby
gem 'dotenv-rails', groups: [:development, :test]
```

Depois execute:
```bash
bundle install
```

**Opção 3: Usar Rails Credentials (recomendado para produção)**
```bash
rails credentials:edit
```

E adicione:
```yaml
supabase:
  url: https://zcsxyzywwsciyuyjogbi.supabase.co
  anon_key: ...
  service_role_key: ...
```

### Frontend (React/Vite)
O Vite carrega automaticamente arquivos `.env` que começam com `VITE_*`.

## 🔒 Práticas de Segurança Aplicadas

### 1. Separação de Chaves
- **`SUPABASE_ANON_KEY`**: Chave pública, pode ser exposta no frontend
- **`SUPABASE_SERVICE_ROLE_KEY`**: Chave privada, **NUNCA** expor no frontend
- **`SUPABASE_JWT_SECRET`**: Secret para validação de tokens, apenas backend

### 2. Proteção no Git
- ✅ Arquivos `.env` estão no `.gitignore`
- ✅ Arquivos `.env.example` podem ser commitados (sem valores reais)
- ✅ Credenciais do Rails (`config/credentials/*.key`) estão protegidas

### 3. Validação em Produção
O inicializador `config/initializers/supabase.rb` valida se as variáveis necessárias estão presentes em produção/staging:

```ruby
if Rails.env.production? || Rails.env.staging?
  required_keys = %w[SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY]
  missing_keys = required_keys.reject { |key| ENV[key].present? }
  
  if missing_keys.any?
    Rails.logger.warn "⚠️  Supabase: Variáveis de ambiente faltando: #{missing_keys.join(', ')}"
  end
end
```

### 4. Uso de `ENV.fetch` com Valores Padrão
O código usa `ENV.fetch` que permite valores padrão seguros:

```ruby
url: ENV.fetch('SUPABASE_URL', ''),
anon_key: ENV.fetch('SUPABASE_ANON_KEY', ''),
```

### 5. Configuração no Render
No `render.yaml`, variáveis sensíveis usam `sync: false` para não serem sincronizadas automaticamente:

```yaml
- key: SUPABASE_SERVICE_ROLE_KEY
  sync: false
- key: SUPABASE_JWT_SECRET
  sync: false
```

## 🚨 Checklist de Segurança

Antes de fazer commit, verifique:

- [ ] Arquivos `.env` estão no `.gitignore`
- [ ] Nenhum arquivo `.env` está sendo rastreado pelo Git
- [ ] Credenciais não estão hardcoded no código
- [ ] Chaves privadas não estão expostas no frontend
- [ ] Variáveis de produção estão configuradas no Render/plataforma de deploy
- [ ] Arquivos `.env.example` existem como template (sem valores reais)

## 📝 Como Verificar se Está Seguro

### Verificar se arquivos .env estão sendo rastreados:
```bash
git status --porcelain | grep .env
```

Se aparecer algo, os arquivos estão sendo rastreados! Remova-os:
```bash
git rm --cached .env FrontEnd/.env
```

### Verificar se há credenciais hardcoded:
```bash
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" --exclude-dir=node_modules --exclude-dir=.git
```

### Verificar se .env está no .gitignore:
```bash
git check-ignore .env FrontEnd/.env
```

Se não retornar nada, os arquivos não estão sendo ignorados!

## 🔧 Recomendações de Melhoria

### 1. Adicionar dotenv-rails (Desenvolvimento)
```ruby
# Gemfile
group :development, :test do
  gem 'dotenv-rails'
end
```

### 2. Criar arquivos .env.example
Crie templates sem valores reais:
```bash
# .env.example
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Usar Rails Credentials para Produção
Para dados muito sensíveis, considere usar `rails credentials:edit` em vez de variáveis de ambiente.

### 4. Implementar Validação Mais Rigorosa
Adicionar validação que impede a aplicação de iniciar sem variáveis críticas em produção.

## 📚 Referências

- [Rails Credentials](https://guides.rubyonrails.org/security.html#custom-credentials)
- [12-Factor App: Config](https://12factor.net/config)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

## ⚠️ Avisos Importantes

1. **NUNCA** commite arquivos `.env` no Git
2. **NUNCA** exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend
3. **SEMPRE** use variáveis de ambiente em produção, nunca hardcode
4. **SEMPRE** valide se as variáveis necessárias estão presentes antes de usar
5. **SEMPRE** use HTTPS em produção
6. **SEMPRE** configure RLS (Row Level Security) no Supabase

## 🔄 Próximos Passos

1. [ ] Adicionar `dotenv-rails` ao Gemfile
2. [ ] Criar arquivos `.env.example` como templates
3. [ ] Implementar validação mais rigorosa em produção
4. [ ] Revisar todas as variáveis de ambiente e documentar
5. [ ] Configurar alertas para variáveis faltando em produção

