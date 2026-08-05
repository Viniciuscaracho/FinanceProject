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
