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

```bash
# 1. O controller vai retornar 503 se client_id não estiver configurado:
curl https://backend.orbinutri.com.br/api/v1/oauth/google_oauth_url

# Resposta OK:  { "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=840..." }
# Resposta ERRO: { "error": "Autenticação Google não configurada no servidor" } (HTTP 503)

# 2. Se o callback redirecionar para /login?google_error=1&detail=..., o detail diz a causa:
#    - "token_exchange: The OAuth client was not found." → client_id ou secret errado
#    - "token_exchange: redirect_uri_mismatch"           → URI não cadastrada no Console
#    - "no_code"                                         → Google rejeitou antes do callback
```

#### Regra permanente para vars novas

**Toda var de ambiente usada em produção DEVE estar em pelo menos um de:**
1. EasyPanel → Env Variables do serviço, OU
2. `config/credentials/staging.yml.enc` (acessada via `Rails.application.credentials.dig(...)`)

`.env` sozinho → só funciona em desenvolvimento local.
