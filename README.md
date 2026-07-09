# Orbi

Plataforma de agendamento e gestão para profissionais que atendem clientes de
forma recorrente (personal trainers, nutricionistas, e a base histórica de
barbearias/salões). Rails + React (Vite) + wrapper Android WebView.

> **Nota sobre o nome do repositório:** o repo se chama `FinanceProject` e a
> documentação operacional antiga (`BACKLOG.md`, `DEV_NEXT_STEPS.md`) ainda
> fala em "BarberManagement". Isso é histórico — o produto atual é o **Orbi**,
> e o foco descrito abaixo é a direção pra onde ele está indo.

---

## Novo foco: uma camada de IA sobre a relação treinador–atleta

O Orbi já resolve o **agendamento, financeiro e o diretório público** (ver
`/descobrir`). O próximo passo do produto é subir uma camada fina de IA em cima
do relacionamento contínuo entre o profissional e cada cliente — começando pelo
caso **treinador ↔ atleta**.

**A tese, em uma frase:** validar, com o menor investimento possível, se um
registro de voz estruturado por IA é algo que um treinador usa de verdade — não
construir "mais um CRM de coaching com IA e WhatsApp".

O valor central é **reduzir o atrito do treinador em registrar e recuperar
informação sobre cada atleta**. A feature que "vende sozinha" é o **resumo
pré-atendimento**: o profissional chega para o atendimento com um resumo pronto
do histórico recente do atleta, sem ter que garimpar conversas.

Essa camada está sendo construída num scaffold isolado (`orbi-work`, um app
Rails enxuto) e será **mesclada nesta plataforma** depois de validada. Este
README fixa a direção para que os dois lados convirjam.

---

## Como a visão chegou aqui (decisões conscientes)

- Começou como uma lista ampla de ~10 features (dashboard, timeline, resumo por
  IA, alertas, feedback automático, evolução visual, busca inteligente...).
- Foi cortada para caber no orçamento: **regra determinística sempre que
  possível, IA só nos dois pontos que realmente precisam** — estruturar o
  registro de voz e gerar texto (resumo/feedback).
- Descartada a ideia de "grupo de uma pessoa só" no WhatsApp (conexão não
  oficial = risco real de banimento).
- Migrou para **número único da plataforma** (CNPJ da Orbi, não do treinador) —
  elimina a maior barreira de onboarding.
- Restringida a **unidirecional**: só o treinador fala com o número, o atleta
  nunca. Isso cortou pela metade a complexidade (sem inbox de atendimento, sem
  opt-in do atleta, sem risco de mensagem sem resposta).
- Rebaixada de "construir a integração real do WhatsApp" para **"validar
  primeiro com piloto manual"**. A arquitetura de Cloud API está desenhada e o
  ponto de entrada (`WebhooksController`) já existe, mas conscientemente não é o
  próximo passo.

---

## Escopo do MVP da camada de IA

### Já codado no scaffold (`orbi-work`, a mesclar aqui)

- Model `Coach` + roteamento por telefone
- Model `Athlete` (CRUD básico: index, new, create, show)
- Model `TimelineEvent` + busca simples (`LIKE`)
- `Alerts::DetectorService` — sem feedback há X dias, reavaliação próxima
  (regra pura, zero IA)
- Dashboard com lista de alertas
- Registro rápido manual (formulário no perfil do atleta)
- `Ai::StructureNoteService` — estrutura texto em sono/carga/observação/próxima
  ação (Haiku, barato de propósito)
- `Ai::PreVisitSummaryService` — resumo pré-atendimento com dados pré-agregados
- `Ai::FeedbackDraftService` — rascunho de feedback
- `WebhooksController#whatsapp` — ponto de entrada pronto (roteia coach → atleta
  por nome; vira "pendência" no dashboard quando a IA não identifica o nome)
- Confirmação manual de atleta não identificado (tela de pendências no dashboard)
- Views mínimas (dashboard, perfil/timeline, busca, novo atleta)

### Falta codar para fechar o MVP

| Feature | O que falta | Prioridade |
|---|---|---|
| **Piloto manual (Fase 0)** | Formulário simples para a equipe colar a transcrição — hoje só existe o endpoint que recebe | **Alta** — próximo passo antes de qualquer coisa de WhatsApp real |
| **Registro rápido por voz** | Captura de áudio no navegador (Web Speech API) — hoje só aceita texto já transcrito colado | **Alta** — é o coração do produto |
| **Estilo visual** | Aplicar os mockups desenhados (dashboard + perfil) nas telas reais | Média — cosmético, não bloqueia teste funcional |
| **Athlete edit/update/destroy** | Hoje só cria e lê | Média |
| **Job diário de alertas** | `Alerts::DetectorService` roda sob demanda ao abrir o dashboard; falta virar tarefa agendada (cron / Sidekiq) | Baixa para o MVP, mas barato de fazer |

**Ordem sugerida:** formulário do piloto manual → Web Speech API no registro
rápido → estilo visual → edit/update/destroy de atleta → job agendado.

### Fora do MVP — decisão consciente

- Autenticação/login dedicado da camada (a plataforma já tem auth própria)
- Atleta responder mensagem (bidirecional) — decisão tomada
- Importação de histórico antigo do WhatsApp
- Busca semântica / embeddings (pgvector) — `LIKE` simples resolve no volume do MVP
- Conexão real com Cloud API / BSP — infraestrutura de conta, não código
- Evolução visual (peso, fotos, bioimpedância) — não desenhado ainda
- Número dedicado por treinador — usa-se o número único da plataforma

---

## Plano em fases

1. **Fase 0 — piloto manual** (próximo): rodar com 3–5 treinadores reais. Alguém
   da equipe cola a transcrição do áudio num formulário → o mesmo pipeline da
   Fase 1 estrutura e grava. Valida a tese antes de qualquer integração.
2. **Fase 1 — WhatsApp Cloud API**: se validar, registrar número no Meta Business
   Manager com o CNPJ da Orbi e conectar via BSP. O `WebhooksController` já é o
   ponto de entrada; o body passa a vir do BSP em vez de colado à mão.
3. **Pós-MVP**: job agendado de alertas, evolução visual, busca semântica —
   conforme a demanda validar.

---

## O ponto de decisão em aberto

Nada disso foi testado com um treinador de verdade ainda. Número único, IA
barata e restrição a unidirecional são apostas bem fundamentadas, mas ainda
apostas. A Fase 0 (piloto manual) existe exatamente para resolver isso, e é a
peça que falta codar antes de qualquer coisa de WhatsApp real.

---

## Rodar o projeto

O setup de desenvolvimento da plataforma (Rails + React + Android, Docker,
Supabase, Sidekiq) está em [`DEV_NEXT_STEPS.md`](DEV_NEXT_STEPS.md). O backlog
detalhado de UX/fluxo da plataforma está em [`BACKLOG.md`](BACKLOG.md).
