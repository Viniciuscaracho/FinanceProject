# Camada de Coaching com IA — Próximos Passos de Integração

Guia de engenharia para portar o MVP de coaching (scaffold `orbi-work`) para
dentro desta plataforma (Orbi). Complementa o [`README.md`](README.md), que fixa
a visão. Aqui está o **como**.

**Princípio:** integrar não é "merge". O `orbi-work` é a especificação de
referência; o que se reaproveita direto é o corpo dos 3 services de IA (chamadas
Anthropic + prompts) e a lógica de regras (detector de alertas, agregação do
resumo). O resto se dissolve nos padrões que a plataforma já tem.

---

## Decisões arquiteturais travadas

| Conceito | Decisão | Detalhe |
|---|---|---|
| **Treinador (Coach)** | `AccountUser` já autenticado (Supabase JWT) | O login por sessão do `orbi-work` é descartado — a plataforma já autentica. |
| **Atleta** | Reusar **`Contact`** (STI em `people`) | Aproveita telefone, agendamentos e financeiro. Campos de coaching vão numa extensão `coaching_profile`. |
| **Registro estruturado** | Modelo novo **`TimelineEvent`** | Campos `sono/carga/observacao/proxima_acao` + `raw_input` + `source`, escopado por `account_id`/`contact_id`. |
| **Resumo pré-atendimento** | Ancorado no **`Appointment`** existente | Botão "preparar atendimento" no agendamento; usa o `contact` do appointment. |

**O que a integração tornou desnecessário para a Fase 0:** login de treinador,
roteamento coach→atleta por telefone e tela de pendência. Dentro do app
autenticado o treinador já é conhecido e escolhe o atleta na UI. Essas peças só
voltam na Fatia 6 (WhatsApp real).

---

## Fatias de implementação (nesta ordem)

### Fatia 1 — Fundação de dados (backend)
- [ ] Migration `coaching_profiles`: `contact_id`, `account_id`, `goal`,
      `limitations`, `next_reassessment_at`, `last_feedback_at`. `belongs_to :contact`.
- [ ] Migration `timeline_events`: `account_id`, `contact_id`, `account_user_id`
      (autor), `raw_input`, `source`, `sono`, `carga`, `observacao`,
      `proxima_acao`, timestamps. Índice `(account_id, contact_id, created_at)`.
- [ ] `TimelineEvent` `after_create` → atualiza `coaching_profile.last_feedback_at`
      (mesma mecânica de `orbi-work`).
- [ ] Scopes de alerta em `CoachingProfile`: `sem_feedback_ha(dias)`,
      `reavaliacoes_proximas(dias)`, escopados por `account_id`.

### Fatia 2 — IA + registro manual (= Fase 0 do produto, prioridade Alta)
- [ ] Portar services para `app/services/coaching/`:
      `structure_note_service.rb`, `pre_visit_summary_service.rb`,
      `feedback_draft_service.rb` (corpo ~1:1, trocando `Coach/Athlete` por
      `Current.account`/`Contact`). Modelo `claude-haiku-4-5-20251001`.
- [ ] Endpoints `api/v1` (seguir padrão `render json` + helpers `*_json` de
      `contacts_controller.rb`/`patient_notes_controller.rb`):
  - `POST /coaching/contacts/:id/timeline_events` — recebe `raw_input`, roda
    StructureNote, cria evento. Coach = `Current.user`; atleta vem da URL.
  - `GET  /coaching/contacts/:id/timeline_events` (+ `?q=` para busca `LIKE`).
  - `POST /appointments/:id/pre_visit_summary` — resumo do contato do appointment.
  - `POST /coaching/contacts/:id/feedback_draft`.
  - `GET  /coaching/alerts` — `Coaching::DetectorService` sobre `Current.account`.

### Fatia 3 — Frontend seção "Coaching"
- [ ] Item no `FrontEnd/src/components/layout/Sidebar.jsx` (array `NAV`) →
      página `/coaching` registrada em `src/config/routes.jsx`.
- [ ] Página `/coaching`: dashboard de alertas.
- [ ] `PatientProfile.jsx`: painel "Registro rápido" (cola transcrição → POST) +
      timeline estruturada.
- [ ] Detalhe do `Appointment`: botão "Preparar atendimento" → resumo.
- [ ] Estender `FrontEnd/src/lib/api.js` (singleton `ApiService`) com os métodos.
- [ ] UI em shadcn/Tailwind (`src/components/ui/`). Aplicar os mockups de
      dashboard e perfil aqui.

### Fatia 4 — Voz no navegador (item 3, Alta)
- [ ] Componente `VoiceRecorder` com Web Speech API (`SpeechRecognition`),
      transcrição pt-BR no cliente preenchendo o `raw_input`. Fallback
      `MediaRecorder` + transcrição server-side fica para depois.

### Fatia 5 — Job diário de alertas (item 6, barato)
- [ ] `CoachingAlertsJob` recorrente via `config/sidekiq_scheduler.yml` (cron
      diário), mesmo padrão de `AppointmentReminderJob`.

### Fatia 6 — WhatsApp real (Fase 1 do produto, pós-validação)
- [ ] Estender o inbound da Evolution API
      (`app/controllers/api/v1/whats_app_webhook_controller.rb` →
      `WhatsApp::ProcessMessageJob`): detectar que o número remetente é de um
      `AccountUser` (coach) e desviar para o fluxo de estruturação.
- [ ] **Aqui voltam** o roteamento coach→atleta por nome e a tela de pendência
      (confirmação manual de atleta não identificado).
- [ ] Transcrição de áudio server-side (Whisper/Deepgram) — a Evolution recebe
      áudio, mas hoje não transcreve.

---

## Sequência recomendada de entrega

Começar por uma **fatia vertical fina** — Fatia 1 + o registro manual e a
timeline (parte de 2 e 3) ponta-a-ponta em um contato real. Isso valida o loop
"grava → IA estrutura → aparece na timeline" dentro da plataforma. Só então:
resumo pré-atendimento → alertas → voz → WhatsApp.

---

## Pontos em aberto (decidir antes de codar a fatia correspondente)

1. **Chave/custo da IA** — provisionar `ANTHROPIC_API_KEY` no ambiente (Haiku,
   barato de propósito). Bloqueia a Fatia 2.
2. **Serviço de coaching** — os `Appointment` precisam de um `service`/offer que
   represente "atendimento de coaching" para o botão de resumo fazer sentido.
   Bloqueia a parte de resumo da Fatia 2/3.
3. **Gating** — a seção Coaching aparece para todas as contas ou só para as que
   ativarem (feature flag / role)? Afeta a Fatia 3.

---

## Referências de padrão na plataforma

- Auth/contexto: `app/controllers/api/v1/application_controller.rb`
  (`@current_user`, `Current.account`).
- CRUD por contato: `app/controllers/api/v1/patient_notes_controller.rb`
  (rota aninhada `contacts/:contact_id/...`, `render json` + helper).
- Job recorrente: `AppointmentReminderJob` + `config/sidekiq_scheduler.yml`.
- WhatsApp: `whats_app_webhook_controller.rb`, `WhatsApp::ProcessMessageJob`,
  `WhatsApp::EvolutionApiClient`, modelo `WhatsappMessage`.
- Frontend: rotas `FrontEnd/src/config/routes.jsx`, API `src/lib/api.js`,
  auth `src/contexts/AuthContext.jsx`, menu `Sidebar.jsx`, UI `components/ui/`.
