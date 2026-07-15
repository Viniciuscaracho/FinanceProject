---
name: project-next-steps
description: "Roadmap priorizado da camada de coaching Orbi — Fatias A-D concluídas, próximas features E-G definidas pelo Panorama Estratégico 2026"
metadata: 
  node_type: memory
  type: project
  originSessionId: bbee4e34-5e20-44b4-9d46-ac7be7f82c0d
---

## Fatias A–D *(TODAS COMPLETAS — 2026-07-09)*
- A: Alertas inteligentes (DetectorService + 3 novos tipos)
- B: Áudio → Whisper → TimelineEvent
- C: Sumário pré-consulta enriquecido (perfil + frequência + alertas + tendência sono/carga)
- D: Botão "Preparar atendimento" no frontend com modal formatado

139 testes, zero falhas.

---

## Próximas features — derivadas do Panorama Estratégico 2026

### Feature E — Nova Home operacional *(COMPLETA — 2026-07-14)*
**Resolve:** "Quem precisa da minha atenção hoje? O que mudou desde ontem?"
Implementada em chat separado. Mudanças:
- Removido: widgets financeiros (Fluxo do mês, Transações recentes, Cobranças pendentes, KPIs Recebido/Pendente, ação "Nova transação")
- Adicionado (grid 65fr/35fr):
  - `SmartSummaryBanner` (topo): texto dinâmico com contagem de atletas que exigem atenção + motivos
  - `CoachingPanel` (esq): atletas que precisam de atenção — agora primeiro bloco
  - `ActivityFeedPanel` (esq): consultas de hoje confirmadas/concluídas
  - `DayQueue` (esq): consultas pendentes de confirmação (some se vazia)
  - `ConsultancyIndicators` (dir): 4 KPIs — atletas ativos, check-ins pendentes, aderência %, reavaliações na semana
  - `InsightsCard` (dir): insights automáticos — desaparecidos, dor, reavaliações próximas
- Coaching state liftado para o Dashboard pai — sem fetches duplicados entre os componentes

### Feature F — Importação de arquivos externos *(COMPLETA — 2026-07-14)*
- `ExtractFileService` (PDF via pdftotext, DOCX via rubyzip+Nokogiri, TXT direto) — sem gems novas
- `FileImportsController` POST `.../file_imports` → TimelineEvent (source: 'import')
- Botão "Arquivo" no PatientProfile ao lado de "Voz"
- 18 testes, zero falhas

### Feature G — WhatsApp como fonte de contexto (validação manual primeiro)
**Resolve:** "Trabalho real que acontece no WhatsApp"
- NÃO retomar Cloud API ainda (validação pendente)
- Próximo passo: campo "colar conversa" no frontend → StructureNoteService → TimelineEvent (source: 'whatsapp_manual')
- Valida o padrão antes de integrar API real
- Esforço mínimo

**Why:** Ordem E→F→G: E é composição de existente, F captura contexto externo, G valida WhatsApp sem risco de banimento.
**How to apply:** Checar alinhamento com [[project-strategic-positioning]] antes de qualquer feature nova — pergunta filtro: "isso preserva contexto ou conecta informação espalhada?"
