---
name: coaching-layer-progress
description: Status das fatias da camada de coaching já implementadas no Orbi
metadata: 
  node_type: memory
  type: project
  originSessionId: 2ae33f34-32db-4dfc-b2e4-5e89cf92dbd3
---

Implementação iniciada em 2026-07-09. Tudo construído do zero (o scaffold `orbi-work` não existia em disco).

## Fatia 1 — Fundação (COMPLETA)
- Migration `coaching_profiles` + model `CoachingProfile`
- Migration `timeline_events` + model `TimelineEvent`
- `has_one :coaching_profile` e `has_many :timeline_events` em `Contact`
- `after_create` no `TimelineEvent` atualiza `last_feedback_at` do `CoachingProfile`

## Fatia 2 — Services de IA + endpoints (COMPLETA)
- `app/services/coaching/structure_note_service.rb` — httparty → Anthropic Haiku
- `app/services/coaching/pre_visit_summary_service.rb`
- `app/services/coaching/feedback_draft_service.rb`
- `app/services/coaching/detector_service.rb` — regras puras de alerta
- Controllers em `app/controllers/api/v1/coaching/`:
  - `timeline_events_controller.rb` (GET/POST)
  - `alerts_controller.rb` (GET)
  - `pre_visit_summaries_controller.rb` (POST aninhado em appointments)
  - `feedback_drafts_controller.rb` (POST)
- Rotas em `config/routes/api.rb` — namespace `:coaching`

## Fatia 3 — Frontend (COMPLETA)
- `CoachingDashboard.jsx` — página `/coaching` com alertas
- `PatientProfile.jsx` — painel Coaching: registro rápido (textarea + voz Web Speech API), timeline estruturada, busca, rascunho de feedback
- Sidebar: item "Coaching" com ícone `Brain`
- `routes.jsx`: rota `/coaching`
- `api.js`: 5 métodos novos (`getCoachingAlerts`, `getTimelineEvents`, `createTimelineEvent`, `getPreVisitSummary`, `createFeedbackDraft`)

## Bloqueador ativo
- **`ANTHROPIC_API_KEY`** precisa ser provisionada no `.env` para os services de IA funcionarem.

## Fatia A — Alertas inteligentes (COMPLETA — 2026-07-09)
`DetectorService` expandido com 3 novos tipos de alerta:
- `sumiu`: sem feedback há 21+ dias (não sobrepõe com sem_feedback 7-20 dias)
- `reclamou_de_dor`: keywords de dor/lesão em TimelineEvents dos últimos 7 dias
- `perdeu_frequencia`: teve appointment completed, nenhum nos últimos 14 dias
- `pain_where_clause` helper DRY com 12 keywords em raw_input e observacao
- 25 testes verdes, zero regressão nos 82 testes de coaching

## Fatia B — Áudio → Whisper → TimelineEvent (COMPLETA — 2026-07-09)
- `app/services/coaching/transcribe_audio_service.rb` — Net::HTTP multipart → OpenAI Whisper, `language: pt`, `response_format: text`
- `app/controllers/api/v1/coaching/audio_notes_controller.rb` — POST /api/v1/coaching/contacts/:contact_id/audio_notes; chama TranscribeAudioService → StructureNoteService → cria TimelineEvent com `source: 'whisper'`
- Rota adicionada em `config/routes/api.rb`: `resource :audio_notes, only: [:create]`
- `FrontEnd/src/lib/api.js`: método `uploadAudioNote(contactId, audioBlob)` — FormData sem Content-Type para multipart correto
- `FrontEnd/src/pages/PatientProfile.jsx`: botão "Voz" trocado de Web Speech API → MediaRecorder + upload; estados `isTranscribing` + spinner durante transcrição; evento adicionado diretamente à timeline
- 11 testes (5 serviço + 6 controller), 65 total de coaching, zero falhas
- **Gotcha:** dentro de namespace `Api::V1::Coaching`, usar `::Coaching::ServiceName` (não `Coaching::`) para evitar NameError

## Fatia C — Sumário pré-consulta enriquecido (COMPLETA — 2026-07-09)
`PreVisitSummaryService` reescrito com 4 seções no prompt:
- **Perfil**: nome, objetivo, limitações, data de reavaliação (com dias restantes)
- **Frequência**: consultas concluídas nos últimos 30d / 60d / total histórico
- **Alertas ativos**: filtra DetectorService para o contato específico, inline no prompt
- **Tendência sono/carga**: último registro vs referência dos até 5 eventos anteriores
- 16 testes, 55 assertions, zero falhas

## Fatia D — Botão "Preparar atendimento" no frontend (COMPLETA — 2026-07-09)
Melhorias sobre a infraestrutura existente em `Appointments.jsx`:
- Botão na tabela: de ícone Brain sem label → `"Preparar"` + Brain colorido (violet), visível e descobrível
- Modal: `whitespace-pre-wrap` → componente `SummaryContent` que renderiza seções `===`, bullets `•-*→`, e alertas com emoji em fundo âmbar
- Footer do modal: adicionado botão "Ver perfil do atleta" → navega para `/contacts/:id`; desabilitado quando contact_id não disponível

## Feature E — Nova Home operacional (COMPLETA — 2026-07-14)
Dashboard reorientado para coaching: SmartSummaryBanner, CoachingPanel, ActivityFeedPanel, DayQueue (esquerda, 65fr) + ConsultancyIndicators, InsightsCard (direita, 35fr). Widgets financeiros removidos. Coaching state liftado para o pai — sem fetches duplicados.

## Status geral (2026-07-14)
Camada de coaching (Fatias A–D) + Nova Home (Feature E) entregues.

**Why:** fatias 1-3 são o thin vertical slice; validar o loop "cola texto → IA estrutura → aparece na timeline" antes de qualquer coisa.
**How to apply:** ao retomar, checar se ANTHROPIC_API_KEY foi provisionada; se sim, testar o fluxo ponta-a-ponta.
