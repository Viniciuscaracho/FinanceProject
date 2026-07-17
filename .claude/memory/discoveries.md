---
name: discoveries
description: Descobertas técnicas e de produto encontradas durante implementação — consultar antes de cada sessão de trabalho
metadata: 
  node_type: memory
  type: project
  originSessionId: 18e782dc-7d09-4fbd-929c-51a0163f8e8a
---

# Descobertas

Arquivo cumulativo. Cada entrada tem data, contexto e impacto prático.

---

## 2026-07-14 — Validação da Nova Home vs. Posicionamento Estratégico

### O que foi validado
Cruzamento entre `project_strategic_positioning.md` e o `Dashboard.jsx` implementado (Feature E).

### Alinhamentos confirmados

| Pergunta do posicionamento | Componente implementado | Status |
|---|---|---|
| "Quem precisa da minha atenção hoje?" | `CoachingPanel` + `SmartSummaryBanner` | ✅ Pleno |
| "Quais atletas estão em risco?" | `CoachingPanel` (urgente/atenção) | ✅ Pleno |
| "Quais tarefas devo executar?" | `DayQueue` | ✅ Pleno |
| "Quais insights merecem ação imediata?" | `InsightsCard` | ✅ Pleno |
| "Resumo inteligente da consultoria" | `ConsultancyIndicators` + `SmartSummaryBanner` | ✅ Pleno |
| "O que mudou desde ontem?" | `ActivityFeedPanel` | ⚠️ Parcial |

### Gap real: "O que mudou desde ontem?"

`ActivityFeedPanel` mostra apenas consultas de hoje com status `completed` ou `confirmed`. Não captura:
- Novos `TimelineEvents` criados nas últimas 24h (registros manuais, áudio, WhatsApp)
- Atletas cujo status de alerta mudou
- Check-ins novos recebidos

**O que seria necessário:** endpoint `/api/v1/coaching/recent_activity?since=24h` retornando `TimelineEvents` recentes por atleta. O modelo já existe (`TimelineEvent`), só falta o endpoint e a query `where(created_at: 24.hours.ago..)`.

**Impacto:** a pergunta mais diferenciadora do posicionamento ("o que mudou desde ontem?") é a menos respondida. Deve ser Feature F.1 antes de importação de arquivos.

---

## 2026-07-14 — Métrica de aderência é uma aproximação

### Contexto
`ConsultancyIndicators` exibe "Aderência %" calculada como:
```js
(activeContacts.length - pendingCheckins) / activeContacts.length * 100
```

### Problema
Isso mede "% de atletas SEM alerta `sem_feedback`", não aderência real (frequência de check-ins vs. frequência esperada). Um atleta pode não ter alerta mas também não ter feito check-in essa semana.

**Aderência real precisaria de:** `timeline_events.count WHERE created_at >= 7.days.ago` dividido por `coaching_profiles.expected_weekly_checkins`. `expected_weekly_checkins` não existe no modelo ainda.

**Recomendação:** por ora manter o proxy; quando Feature G (WhatsApp) estiver ativo, a frequência real de check-ins vai naturalmente emergir dos `TimelineEvents`.

---

## 2026-07-14 — Port 3000 vs. processo Node legado

### Contexto
O servidor Rails web (port 3000) falhou em subir silenciosamente porque um processo Node.js de `/tmp/orbi-dashboard/orbi-cli` já estava ocupando a porta desde a sessão anterior. O Vite proxy envia `/api` para `localhost:3000`, então todos os requests de login retornavam 404 (respondidos pelo Node, não pelo Rails).

### Diagnóstico
```bash
ss -tlnp | grep :3000
# usuário: node, pid 28602 — não era Rails
```

### Fix
```bash
kill 28602
bin/rails server -p 3000 -b '0.0.0.0' >> log/development.log 2>&1 &
```

**Aprendizado:** ao subir os servidores, sempre verificar `ss -tlnp` se login retornar 404 mas a rota existir no `bin/rails routes`. O Vite proxy mascara o problema — retorna 404 sem revelar de onde veio.

---

## 2026-07-14 — Coaching state liftado para Dashboard pai

### Contexto
`CoachingPanel` antes fazia seu próprio fetch de `getCoachingDashboard()`. Com a Nova Home, 3 componentes novos (`SmartSummaryBanner`, `ConsultancyIndicators`, `InsightsCard`) precisam dos mesmos dados.

### Decisão
State liftado para `Dashboard()`:
```js
const [coachingData, setCoachingData] = useState(null)
// único fetch compartilhado por todos os componentes
```

**Impacto:** `CoachingPanel` agora recebe `{ alerts, urgent, attention, activeContacts, loading }` via props. Sem fetches duplicados, sem inconsistência de estado entre os cards.

**Padrão a repetir:** sempre que 2+ componentes da mesma página consumirem o mesmo endpoint, liftar o state para o pai.

---

## 2026-07-14 — "O que mudou desde ontem?" → resolvido com recent_activity

### O que foi feito
- **Controller:** `app/controllers/api/v1/coaching/recent_activity_controller.rb`
  — query `TimelineEvent.where(created_at: N.hours.ago..)`, inclui `:contact`, retorna `summary` (observacao ou raw_input truncado em 120 chars), `source`, `contact_name`, `created_at`.
- **Rota:** `GET /api/v1/coaching/recent_activity?hours=N` (N máx 72)
- **api.js:** `getRecentActivity(hours = 24)`
- **Frontend:** `ActivityFeedPanel` reescrito — faz seu próprio fetch, exibe eventos com badge por fonte (`Áudio`, `WhatsApp`, `Importado`, `Registro`), clique navega para `/contacts/:id`

### Padrão estabelecido para o feed
Source → badge colorido:
- `whisper` → roxo `#8B5CF6`
- `whatsapp_manual` → verde `#25D366`
- `import` → azul `#0EA5E9`
- `manual` → `T.brand`

### Impacto
Gap estratégico "O que mudou desde ontem?" agora coberto. Todas as 5 perguntas da Nova Home respondidas.

---

## 2026-07-14 — Validação das telas vs. posicionamento estratégico

### Resultado geral
Das 47 rotas mapeadas, o produto tem 3 camadas misturadas sem hierarquia clara:
1. **Coaching/contexto** (core do posicionamento): `/coaching`, `/contacts/:id`, `/appointments`, fluxos públicos de paciente
2. **ERP de suporte** (necessário mas não diferencial): `/transactions`, `/reports`, `/commissions`
3. **Módulo de nutrição** (sub-produto diferente): `/meal-plan-templates`, `/plano/:token`, SEO pages de nutricionistas

### Problemas concretos encontrados e status

| Problema | Impacto | Resolvido? |
|---|---|---|
| Coaching em 4ª posição no sidebar | Produto core aparece atrás de ERP | ✅ Movido para 2ª posição |
| "Nova transação" no quick action (+) do BottomNav | Inconsistente com direção de produto | ✅ Removido |
| `AppointmentNotes` silo desconectado da timeline | Fragmenta contexto exatamente no ponto que Orbi promete resolver | ⚠️ Pendente (Feature H) |
| Módulos de nutrição no sidebar de produto de coaching | Ruído para o target de treinadores | ⚠️ Decisão pendente |

### Decisões abertas que precisam de alinhamento com o fundador
- **"Pacientes" → "Atletas"**: depende de se o produto é mono-segmento (treinador) ou multi (nutricionista + treinador)
- **Vitrine**: grupo principal (exposição máxima) ou grupo Configurar (periférico)?
- **AppointmentNotes**: absorver na timeline de coaching ou deprecar?
- **Módulos de nutrição**: manter como módulo embutido ou separar como produto distinto?

### Novo sidebar order (após fix)
Início → **Coaching** → Pacientes → Agendamentos → Vitrine

---

## 2026-07-14 — Feature F: ExtractFileService sem gems novas

### Contexto
Implementação da importação de arquivos (PDF/DOCX/TXT) → StructureNoteService → TimelineEvent.

### O que foi descoberto
- `pdftotext` (poppler-utils) já está instalado no sistema (`/usr/bin/pdftotext`) — extrai PDF via `Open3.capture3('pdftotext', '-', '-', stdin_data: data)` sem gem adicional
- `rubyzip` (2.4.1) já está no lockfile como dependência transitiva — extrai DOCX via `Zip::File.open_buffer + Nokogiri::XML`
- `Nokogiri` já disponível (dependência do Rails) — parseia `word/document.xml` com `doc.remove_namespaces!; doc.xpath('//t').map(&:text)`
- TXT: `@file.read.force_encoding('UTF-8').scrub` — simples e robusto

### Padrão estabelecido (Feature F)
`ExtractFileService.supported?(content_type, filename)` — detecta por content_type com fallback por extensão (`.pdf`, `.docx`, `.txt`). Fonte: `'import'` no TimelineEvent.

### Impacto prático
Feature F entregue com 18 testes sem adicionar nenhuma gem ao Gemfile.

---

## 2026-07-14 — Coverage/ rastreado no git (intencional)

### Contexto
`coverage/` estava no `.gitignore` mas os arquivos já estavam sendo rastreados. Ao tentar remover do rastreamento, o usuário confirmou que quer o coverage sempre commitado.

### Decisão
Removida a regra `/coverage` do `.gitignore`. Os arquivos `coverage/.last_run.json`, `coverage/.resultset.json` e `coverage/index.html` devem ser commitados junto com as alterações de código.

**Impacto prático:** ao rodar testes, sempre commitar os 3 arquivos de coverage junto. Não remover essa regra do `.gitignore`.

---

## 2026-07-14 — Panorama Estratégico 2026 lido e indexado

### Contexto
Arquivo `Panorama_Estrategico_Orbi_2026.docx` compartilhado pelo fundador.

### O que foi descoberto
- Documento confirma que o posicionamento correto é **camada de contexto acima dos ERPs**, não ERP concorrente
- Dores que NÃO existem: agenda, cobrança, anamnese, prontuário (já resolvidos pelo mercado)
- Dores reais: recuperar contexto, alternar ferramentas, perder informação no WhatsApp, reconstruir histórico manualmente
- Proposta de valor exata salva em `[[project-strategic-positioning]]`
- Filtro de feature: "isso preserva contexto ou conecta informação espalhada?" — se não, questionar prioridade

---

## 2026-07-17 — Migração do inbound WhatsApp para a Cloud API oficial (Meta)

### Contexto
Decisão de WhatsApp mudou: `project-orbi.md` dizia "próximo passo NÃO é Cloud API";
agora vamos para a **Cloud API oficial (Meta-hosted)**. O inbound rodava só via
Evolution API (não-oficial). Branch: `claude/whatsapp-cloud-api` (a partir de `stage`).

### O que foi descoberto / decidido
- **Bug no handshake:** a Meta manda `hub.mode`/`hub.challenge`/`hub.verify_token`
  **com ponto**. No Rack a chave é `params['hub.mode']`, NUNCA `params[:hub_mode]`.
  O `verify` antigo (underscore) nunca confirmaria a assinatura do webhook no painel.
- **Parsing correto da Cloud API:** iterar `entry[].changes[].value.messages[]`;
  **ignorar** notificações sem `messages` (status callbacks de sent/delivered/read
  vêm em `value.statuses` e quebravam com 500 → a Meta reentrega e desabilita o webhook).
- **Sempre 200** no caminho Meta — qualquer não-2xx faz a Meta reentregar/desabilitar.
- **Dedupe por wamid** via `Rails.cache.write(key, 1, unless_exist: true, expires_in: 3.days)`
  (atômico). O model `WhatsappMessage` é de SAÍDA (exige `contact_id`/`event_type`),
  não serve para dedupe de inbound — por isso cache, sem migration.
- **Roteamento:** plataforma unidirecional → toda msg recebida é nota do treinador →
  `Coaching::ProcessWhatsappMessageJob`. Conta resolvida por `account_from_sender_phone`.
- Detecção do caminho oficial: `params[:object] == 'whatsapp_business_account'`.
- Assinatura (`X-Hub-Signature-256`, HMAC-SHA256 sobre `request.raw_post`) já estava
  correta — mantida.

### Impacto prático / pendências
- **Áudio (PTT) ainda NÃO migrado.** A Cloud API entrega áudio como `media id`; o
  download exige a **Graph media API** (endpoint separado + bearer token), diferente do
  `EvolutionApiClient.download_media`. Hoje o webhook loga e ignora áudio (200). Próximo
  passo: um client Cloud de mídia + adaptar `Coaching::ProcessWhatsappAudioJob`. Como o
  áudio é o input principal do coaching, isso é prioridade do follow-up.
- **Envio (outbound)** continua no `EvolutionApiClient` — migrar para a Cloud API é
  trabalho à parte.
- **Limitação do ambiente:** a suíte Rails NÃO roda neste sandbox (bundle quebrado —
  falta o checkout do gem git `city-state`; `bundle install` não completa). Validei só
  `ruby -c` (sintaxe OK). Os testes de request (`whats_app_webhook_cloud_test.rb`)
  precisam ser rodados em ambiente com bundle íntegro antes do merge.
- ENV necessárias: `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`.

---

## 2026-07-17 — Runbook: testar o webhook Cloud API localmente (sem VPS)

### Contexto
Domínio `orbinutri.com.br` registrado mas **sem VPS paga** — sem servidor no ar.
Objetivo: validar o inbound da Cloud API rodando o Rails **na máquina local**, com
a Meta alcançando via túnel HTTPS. Branch com o fix: `claude/whatsapp-cloud-api`.

### Fatos do projeto que destravam o teste local
- `config/environments/development.rb`: **`config.hosts = nil`** → host authorization
  desligado em dev; o hostname do túnel (ngrok/cloudflare) NÃO é bloqueado.
- **dotenv-rails** presente → env vars vão no `.env` (gitignored).
- `Procfile.dev` sobe web:3000 + `worker` (Sidekiq) + js. O job de coaching é
  `perform_later`, então o Sidekiq precisa estar de pé para processar.
- Rota do webhook: `POST/GET /api/v1/whatsapp/webhook`.

### Runbook (rodar na máquina do dev, não no sandbox)
1. `git checkout claude/whatsapp-cloud-api`
2. `.env`: `WHATSAPP_VERIFY_TOKEN=<token que você escolhe>` e
   `WHATSAPP_APP_SECRET=<App Secret: Meta → App settings → Basic>`
3. `foreman start -f Procfile.dev`  (Rails :3000 + Sidekiq + js)
4. Túnel HTTPS público (uma das opções):
   - Rápido/temporário: `cloudflared tunnel --url http://localhost:3000`
     (URL `*.trycloudflare.com`) — ou `ngrok http 3000`.
   - Fixo no domínio, ainda local (sem VPS): DNS de `orbinutri.com.br` na
     Cloudflare → `cloudflared tunnel create orbi-wa` →
     `cloudflared tunnel route dns orbi-wa wa.orbinutri.com.br` →
     `cloudflared tunnel run --url http://localhost:3000 orbi-wa`.
5. Meta → WhatsApp → Configuration → Webhooks:
   Callback URL = `https://<host-do-túnel>/api/v1/whatsapp/webhook`;
   Verify token = mesmo valor do `WHATSAPP_VERIFY_TOKEN` → **Verify and save**;
   assinar o campo **`messages`**.
6. Banco local: o treinador (User) precisa de `whatsapp_number` = número do
   remetente (só dígitos, ex.: `5511999999999`), senão o webhook responde 200 mas
   "conta não encontrada" (`account_from_sender_phone`).
7. Do WhatsApp do treinador (destinatário de teste) → manda `Nome: texto` para o
   número de teste → `Coaching::ProcessWhatsappMessageJob` → cria `TimelineEvent`.

### Ciladas
- Handshake só valida com o fix `hub.*` no ar → o túnel/deploy tem que apontar
  para ESTA branch.
- Só `WHATSAPP_VERIFY_TOKEN` é preciso para o handshake; `WHATSAPP_APP_SECRET` é
  necessário para as mensagens (senão 401 na validação da assinatura).
- ngrok/trycloudflare grátis trocam a URL ao reiniciar → reatualizar na Meta.
- Túnel Cloudflare **não precisa de VPS**: liga o localhost à borda da Cloudflare;
  o DNS fica lá. VPS/Render só quando quiser online 24/7 sem a máquina ligada.
- Número de teste da Meta funciona em modo desenvolvimento (até 5 destinatários);
  publicar o app só é necessário para número real em produção.

---

## Template para novas descobertas

```
## YYYY-MM-DD — [título curto]

### Contexto
[onde/quando foi encontrado]

### O que foi descoberto
[fato técnico ou de produto]

### Impacto prático
[o que muda, o que deve ser feito]
```
