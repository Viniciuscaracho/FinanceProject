# orbi-cli

A local, in-memory **multi-agent orchestrator** for code tasks. You give it a
task; it fans out to specialized agents (backend, frontend, QA, docs) running in
parallel, each with its own harness (system prompt), consolidates their proposed
changes, and **validates before accepting** them.

```
orbi-cli/
├── src/
│   ├── index.ts                 # CLI entry (commander)
│   ├── commands/
│   │   ├── feature.ts           # orbi feature "<desc>"
│   │   ├── fix.ts               # orbi fix "<desc>"
│   │   ├── review.ts            # orbi review "<desc>" (read-only)
│   │   └── runner.ts            # shared: task setup + report
│   ├── agents/
│   │   ├── orchestrator.ts      # route → run in parallel → consolidate → validate
│   │   ├── base.ts              # shared agent behavior
│   │   ├── backend.ts frontend.ts qa.ts docs.ts
│   │   └── index.ts             # agent registry
│   ├── harness/
│   │   ├── loader.ts            # composes shared + per-agent prompts
│   │   ├── shared/guidelines.md
│   │   ├── backend/system.md  frontend/system.md  qa/system.md  docs/system.md
│   ├── llm/
│   │   ├── provider.ts          # Anthropic provider + agentic tool loop
│   │   └── tools.ts             # repo-scoped read tools (list_dir/read_file/grep)
│   └── core/
│       ├── types.ts  logger.ts
│       ├── validation.ts        # validators run before/after accepting changes
│       └── workspace.ts         # apply changes with rollback
```

## How it works

1. **Orchestrator** picks the relevant agents for the command (or the ones you
   name with `--agents`).
2. It instantiates each agent in memory and runs them **concurrently**
   (`Promise.all`), each loading its own harness from `harness/<agent>/`.
3. Each agent runs an **agentic tool loop**: it explores the repository with
   read-only tools (`list_dir`, `read_file`, `grep`, all sandboxed to the repo
   root) to ground its work in the actual code, then submits a structured result
   by calling the `propose_changes` tool. Nothing is dumped into the prompt
   upfront — the agent pulls only the context it needs (Context Engineering).
4. The orchestrator **consolidates** the changes, flagging any path two agents
   both touched as a conflict.
5. **Validation** runs. Structural validators always run; you can add post-apply
   commands (typecheck, lint, tests) with `--validate`. Changes are written to
   disk only with `--apply` **and** only if validation passes — otherwise they
   are rolled back.

## Setup

```bash
cd orbi-cli
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY, or use `ant auth login`
```

The Anthropic SDK resolves credentials from `ANTHROPIC_API_KEY`,
`ANTHROPIC_AUTH_TOKEN`, or an `ant auth login` profile — no key is hardcoded.
The default model is `claude-opus-4-8` (override with `ORBI_MODEL`).

## Usage

```bash
# Dry run (proposes changes, writes nothing):
npm run orbi -- feature "Add CSV export to the transactions report"

# Restrict to specific agents:
npm run orbi -- fix "Totals row double-counts refunds" --agents backend,qa

# Apply changes, gated on tests passing:
npm run orbi -- feature "Add a health-check endpoint" \
  --apply --validate "npm run typecheck" --validate "npm test"

# Read-only review — findings only, no changes:
npm run orbi -- review "Audit the auth middleware for missing checks"
```

Build a standalone binary:

```bash
npm run build && node dist/index.js feature "..."
```

## Extending it

- **New agent**: add `harness/<name>/system.md`, a subclass in `agents/<name>.ts`,
  and register it in `agents/index.ts` + `core/types.ts` (`AgentName`).
- **New read tool**: implement the `AgentTool` interface in `llm/tools.ts` and
  add it to `createRepoTools`.
- **New validator**: implement the `Validator` interface in `core/validation.ts`.
- **Different LLM backend**: implement `LLMProvider` in `llm/provider.ts`.
