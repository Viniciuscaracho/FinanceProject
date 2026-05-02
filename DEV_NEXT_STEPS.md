# BarberManagement — Como rodar & próximos passos

## Pré-requisitos

- Ruby 3.2.3 (via rbenv)
- Bundler 2.x
- Node / pnpm 10+
- Docker + Docker Compose

---

## Como subir o ambiente de desenvolvimento

### 1. Infraestrutura (Docker)

```bash
# Sobe Redis e Mailcatcher
# NÃO inclua o serviço barber-management-db — a porta 9999 já está ocupada por outro projeto.
# O banco barber_management_development já existe no postgres rodando na porta 5432.
docker-compose up -d barber-management-redis barber-management-mail
```

### 2. Dependências Ruby

```bash
bundle install
```

### 3. Banco de dados

```bash
# Rodar migrações pendentes
bundle exec rails db:migrate

# (Opcional) Popular com dados de exemplo
bundle exec rails db:seed
```

### 4. Backend Rails

```bash
# Terminal 1 — servidor web principal
bundle exec rails server -p 3000 -b '0.0.0.0'
```

```bash
# Terminal 2 — worker Sidekiq (jobs em background: WhatsApp, lembretes, etc.)
SIDEKIQ_SERVER=true bundle exec sidekiq
```

### 5. Frontend React

```bash
# Terminal 3
cd FrontEnd
pnpm install
pnpm dev
```

---

## URLs

| Serviço | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Rails API | http://localhost:3000 |
| Health check | http://localhost:3000/health_check |
| Mailcatcher (e-mails) | http://localhost:1080 |

---

## Variáveis de ambiente

O arquivo `.env` já existe na raiz. As principais:

```env
# Banco — usa os defaults do database.yml (localhost:5432, user: postgres, pass: postgres)
# Não precisa setar nada para desenvolvimento local

# Supabase (autenticação)
SUPABASE_URL=...
SUPABASE_ANON_KEY=...

# WhatsApp Evolution API (opcional para dev)
# EVOLUTION_API_URL=...
# EVOLUTION_API_KEY=...

# Stripe (opcional para dev)
# STRIPE_SECRET_KEY=...
# STRIPE_WEBHOOK_SECRET=...
```

---

## O que mudou neste branch (ainda sem commit)

### Backend (Rails)

| Arquivo | O que mudou |
|---|---|
| `app/controllers/api/v1/application_controller.rb` | Autenticação refatorada: suporta Supabase JWT, token base64 legado e api_token |
| `app/controllers/api/v1/appointments_controller.rb` | Novos actions: `send_reminder`, `generate_google_meet`, `generate_professional_document`, `professional_document_templates`, `check_recurrence_expiry`, `extend_recurrence` |
| `app/controllers/api/v1/public/appointment_data_controller.rb` | Novos endpoints: `link_config` (GET `/:token/config`), `full` (GET `/:token/full`), `ping` |
| `app/controllers/api/v1/public_controller.rb` | **DELETADO** — movido para o namespace correto |
| `app/controllers/api/v1/whats_app_webhook_controller.rb` | Identificação de account melhorada: por `account_id`, `account_token` ou `instance_name` (Evolution API) |
| `config/routes/api.rb` | Novos routes: `payment_plans#installments`, `whatsapp_config`, actions de appointment (reminder, google meet, documento) |
| `config/initializers/rails_admin.rb` | Novo initializer adicionado |
| `config/initializers/redis_client.rb` | Configuração do Redis atualizada |
| `db/schema.rb` | Schema atualizado (rodar `rails db:migrate` se necessário) |

### Frontend (React/Vite)

| Arquivo | O que mudou |
|---|---|
| `FrontEnd/src/lib/api.js` | Camada de API completamente refatorada (~520 linhas de diff) |
| `FrontEnd/src/pages/Appointments.jsx` | Grande refatoração do calendário e sheet de eventos |
| `FrontEnd/src/pages/FinancialReports.jsx` | Refatoração dos relatórios financeiros |
| `FrontEnd/src/pages/Transactions.jsx` | Refatoração da listagem de transações |
| `FrontEnd/src/pages/LandingPage.jsx` | Redesign completo da landing page |
| `FrontEnd/src/pages/PublicAppointmentBooking.jsx` | Fluxo de agendamento público atualizado |
| `FrontEnd/src/contexts/AuthContext.jsx` | Context de autenticação refatorado |
| `FrontEnd/src/components/layout/Layout.jsx` | Layout geral ajustado |

---

## Problemas conhecidos a resolver

### 1. Console.logs de debug no Appointments.jsx
O arquivo `FrontEnd/src/pages/Appointments.jsx` tem dezenas de `console.log` com emojis adicionados para debug.
**Ação:** remover todos antes do commit.

```bash
grep -n "console\.log" FrontEnd/src/pages/Appointments.jsx
```

### 2. Rota `/api/v1/public/health` apontando para controller deletado
O arquivo `config/routes/api.rb` tem:
```ruby
get 'health', to: 'public#health_check'
```
Mas `Api::V1::Public::PublicController` não existe mais (o `public_controller.rb` foi deletado).
**Ação:** remover essa linha da rota ou criar o controller `app/controllers/api/v1/public/public_controller.rb`.

### 3. WhatsApp — controller existe mas precisa de testes
`whatsapp_configs_controller.rb` foi criado mas o fluxo de configuração da Evolution API ainda não foi testado end-to-end.

### 4. Google Meet — integração pendente
`generate_google_meet` no `appointments_controller.rb` foi adicionado à rota mas a lógica real de geração do link provavelmente ainda precisa ser validada.

### 5. Recorrência de agendamentos
Novos endpoints `check_recurrence_expiry` e `extend_recurrence` foram adicionados mas não há testes cobrindo esse fluxo.

### 6. `docker-compose.yml` — porta do banco
Alterar o port mapping do `barber-management-db` de `9999:5432` para `9998:5432` para evitar conflito, ou remover o serviço do docker-compose e documentar que o postgres local é usado.

---

## Checklist antes do próximo commit

- [ ] Remover `console.log` de debug do `Appointments.jsx`
- [ ] Corrigir/remover rota `public#health_check` sem controller
- [ ] Testar login via Supabase JWT no frontend
- [ ] Testar fluxo de agendamento público (`/api/v1/public/appointment_data/:token/full`)
- [ ] Testar envio de reminder via WhatsApp
- [ ] Testar geração de Google Meet em agendamento
- [ ] Corrigir porta do banco no `docker-compose.yml`
- [ ] Commitar mudanças em PRs separados por feature (backend / frontend / infra)
