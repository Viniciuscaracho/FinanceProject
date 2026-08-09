# harness.md — trilhos do agente (Orbi)

> Leia este arquivo ANTES de qualquer ação. Ele tem prioridade sobre suposições.
> Contexto profundo do produto: `.claude/memory/` (não repita aqui, consulte).

## 0. Os 2 filtros de produto — aplique a TODA feature/mudança
Antes de escrever código, responda em 1 linha cada:
1. **Pode ser regra determinística?** Se sim, NÃO use IA.
   (IA só é permitida em 2 pontos: estruturar nota de voz→JSON; gerar texto do resumo pré-atendimento.)
2. **Isso preserva contexto ou conecta informação espalhada?** Se não → questione a prioridade antes de continuar.

Se a mudança não passar nos dois, PARE e me pergunte em vez de construir.

## 1. Ordem obrigatória
PRODUCT CONTEXT (filtros acima) → DEVELOPMENT → CODE REVIEW → BUILD & DEPLOY.
Nunca pular do código pro deploy sem review + testes verdes.

## 2. Roteamento — qual fluxo usar
- Mudança de código/feature → fluxo **/dev**
- Anúncios / campanhas / criativos → fluxo **/meta-ads**
- Config de servidor, Cloudflare, Supabase, deploy infra → fluxo **/infra**

## 3. Invariantes (não invente, não viole)
- Stack: Rails 7.0.8 + React/Vite (pnpm) + PostgreSQL + Sidekiq. Branch principal: `stage`.
- Meta Ads: tudo nasce `PAUSED`, ativação é MANUAL, endpoints são admin-only. Nunca ative campanha sozinho.
- Infra: **Cloudflare** = backend server + frontend pages · **Supabase** = database cloud.
- Infra: nunca `apply` sem `validate` antes.
- WhatsApp Cloud API está pausado conscientemente — NÃO retomar sem validação real com usuários.

## 4. Antes de construir qualquer feature nova — defina (1 linha cada)
- **Sinal de sucesso:** o que preciso ver pra dizer "funciona"? (métrica + prazo)
- **Critério de kill:** o que me faria matar isso?
Sem esses dois, a feature não sai do PRODUCT CONTEXT.

---

## 5. Operações de infra — runbooks

### 5.1 Google Auth em produção

#### Causa raiz do bug (2026-08-09)

`dotenv-rails` está no grupo `development, :test` do Gemfile. Em staging/produção o `.env` **não** é lido automaticamente. Qualquer variável que existia só em `.env` fica `nil` no container de produção.

As credenciais afetadas:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Com essas vars `nil`, `google_oauth_url` retornava um `auth_url` inválido (client_id vazio), e `exchange_code_for_token` recebia `invalid_client` do Google → o callback redirecionava para `/login?google_error=1`.

#### Correção aplicada

`app/controllers/api/v1/auth_controller.rb` — adicionados helpers que lêem `ENV` primeiro e, se vazio, buscam nas credentials Rails:

```ruby
def google_client_id
  ENV['GOOGLE_CLIENT_ID'].presence ||
    Rails.application.credentials.dig(:google, :client_id)
end

def google_client_secret
  ENV['GOOGLE_CLIENT_SECRET'].presence ||
    Rails.application.credentials.dig(:google, :client_secret)
end
```

Também adicionado `open_timeout` e `read_timeout` de 10 s no `Net::HTTP` para evitar hang silencioso.

#### Gravar credenciais nas credentials Rails (única vez por ambiente)

```bash
# Na raiz do projeto, com .env carregado:
source .env
RAILS_ENV=staging bundle exec rake credentials:add_google

# O arquivo config/credentials/staging.yml.enc será atualizado.
# Comitar e fazer deploy:
git add config/credentials/staging.yml.enc
git commit -m "chore: adiciona Google OAuth às credentials de staging"
git push origin stage
```

> A rake task `credentials:add_google` está em `lib/tasks/credentials_google.rake`.

#### Variáveis de ambiente necessárias em produção (EasyPanel / Docker)

| Variável | Obrigatória | Fonte |
|---|---|---|
| `GOOGLE_CLIENT_ID` | sim (OU credentials) | Google Cloud Console → OAuth 2.0 Client |
| `GOOGLE_CLIENT_SECRET` | sim (OU credentials) | Google Cloud Console → OAuth 2.0 Client |
| `API_BASE_URL` | sim | `https://backend.orbinutri.com.br` |
| `FRONTEND_URL` | sim | `https://orbinutri.com.br` |

#### URI de redirect que DEVE estar no Google Cloud Console

```
https://backend.orbinutri.com.br/api/v1/auth/google_oauth_callback
```

Caminho: Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs → Authorized redirect URIs.

#### Diagnóstico rápido (checklist)

**1. Endpoint de health check (abrir no browser ou curl)**
```
GET https://backend.orbinutri.com.br/api/v1/auth/google_auth_health
```
Retorna JSON com:
- `ok: true/false` — se client_id está configurado
- `callback_uri` — URI exata que deve estar no Google Console
- `frontend_url` — para onde o backend redireciona pós-auth
- `request_ssl`, `x_forwarded_proto` — diagnóstico do Cloudflare

**2. Se `ok: false`** → credentials ou env var faltando → rode `bin/fix_google_credentials`

**3. Se `ok: true` mas login falha em "iniciar login com Google"**
```bash
curl https://backend.orbinutri.com.br/api/v1/oauth/google_oauth_url
# OK: { "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=840..." }
# ERRO: { "error": "Autenticação Google não configurada no servidor" } (HTTP 503)
```

**4. Se o Google mostra erro "redirect_uri_mismatch"**
→ A URI `https://backend.orbinutri.com.br/api/v1/auth/google_oauth_callback` não está cadastrada no Google Console.
→ Google Console → APIs & Services → Credentials → OAuth 2.0 Client IDs → Authorized redirect URIs

**5. Se callback redireciona para `/login?google_error=1&detail=...`**
- `token_exchange: The OAuth client was not found.` → client_id ou secret errado
- `token_exchange: redirect_uri_mismatch` → URI não cadastrada no Console
- `no_code` → Google rejeitou antes do callback (scope, consent, etc.)

**6. Verificar SSL/Cloudflare no health check**
- `request_ssl: false` + `x_forwarded_proto: null` → Cloudflare não está passando `X-Forwarded-Proto`
  → Adicionar no EasyPanel/Cloudflare: header `X-Forwarded-Proto: https`
- `frontend_url: "http://localhost:5173"` → FRONTEND_URL não configurado em produção
  → Rode novamente `bin/fix_google_credentials`

#### Regra permanente para vars novas

**Toda var de ambiente usada em produção DEVE estar em pelo menos um de:**
1. EasyPanel → Env Variables do serviço, OU
2. `config/credentials/staging.yml.enc` (via `Rails.application.credentials.dig(...)`)

`.env` sozinho → só funciona em desenvolvimento local.

Para adicionar novas vars às credentials:
```bash
# Edite .env com o novo valor, depois:
RAILS_ENV=staging bundle exec ruby bin/fix_google_credentials
git add config/credentials/staging.yml.enc
git commit -m "chore: atualiza credentials staging"
git push origin stage
```
