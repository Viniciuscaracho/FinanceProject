#!/bin/bash
# SessionStart hook — prepara o ambiente (Claude Code na web) para rodar
# testes e linters dos dois ecossistemas do repo:
#   - Rails (bundler + PostgreSQL + minitest + rubocop)
#   - FrontEnd/ (pnpm + eslint + vitest)
# Idempotente e não-interativo. Só roda no ambiente remoto.
set -euo pipefail

# Rodar apenas em Claude Code na web (evita mexer na máquina local do dev).
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

echo "[session-start] 1/5 Instalando gems (Rails)…"
bundle install

echo "[session-start] 2/5 Instalando deps do FrontEnd (pnpm)…"
( cd FrontEnd && corepack pnpm install )

echo "[session-start] 3/5 Deps de asset da raiz (yarn, best-effort)…"
# A raiz já vem com node_modules; o yarn 3.5.1 exige download do registry, que
# pode estar bloqueado pela política de rede. Não é necessário p/ testes/linters.
corepack yarn install >/dev/null 2>&1 \
  || echo "[session-start]   yarn pulado (registry indisponível; node_modules já presente)."

echo "[session-start] 4/5 Subindo PostgreSQL…"
# O cluster pode não persistir entre sessões; subir é idempotente.
pg_ctlcluster 16 main start >/dev/null 2>&1 || true
# Garante a senha do role postgres batendo com o default de config/database.yml.
su - postgres -c "psql -tc \"ALTER USER postgres PASSWORD 'postgres';\"" >/dev/null 2>&1 || true

echo "[session-start] 5/5 Preparando banco de teste (schema, sem seeds)…"
RAILS_ENV=test bin/rails db:test:prepare

echo "[session-start] Pronto. Testes: 'RAILS_ENV=test bin/rails test' e (em FrontEnd/) 'corepack pnpm test'."
