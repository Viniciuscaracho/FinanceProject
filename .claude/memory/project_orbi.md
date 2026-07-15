---
name: project-orbi-context
description: Orbi é uma plataforma Rails+React para profissionais recorrentes; foco atual é camada de IA coaching treinador-atleta
metadata: 
  node_type: memory
  type: project
  originSessionId: 2ae33f34-32db-4dfc-b2e4-5e89cf92dbd3
---

Produto: Orbi — agendamento, financeiro e diretório para personal trainers, nutricionistas, etc.
Stack: Rails 7.0.8 + React/Vite (pnpm) + PostgreSQL + Sidekiq.
Repo: FinanceProject (nome histórico, produto atual = Orbi).
Branch principal: `stage`.

**Foco atual:** camada fina de IA sobre relação treinador-atleta.
Feature que "vende sozinha": resumo pré-atendimento.

**Princípio de simplificação:** regra determinística sempre que possível. IA SOMENTE em 2 pontos:
1. Estruturar nota de voz/texto do treinador → JSON estruturado
2. Gerar texto do resumo pré-atendimento

**WhatsApp — decisões fixadas:**
- Número único da plataforma (CNPJ da Orbi, não do treinador) — elimina barreira de onboarding
- Unidirecional: só o treinador fala com o número, atleta nunca — corta metade da complexidade
- Próximo passo NÃO é integrar Cloud API — é validar com piloto manual (treinador → formulário web)
- Arquitetura Cloud API desenhada e WebhooksController parcialmente codado, mas conscientemente pausado

**Why:** começou com 10 features, cortou para o essencial; WhatsApp "grupo de uma pessoa" descartado por risco de banimento.
**How to apply:** ao sugerir qualquer feature nova, checar se pode ser regra determinística. Se sim, não usar IA. Não retomar WhatsApp Cloud API sem validação real com usuários.
