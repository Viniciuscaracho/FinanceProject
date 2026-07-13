# orbi-cli

A local, in-memory **multi-agent orchestrator** for code tasks. You give it a
task; it **plans** which specialized agents (backend, frontend, QA, docs) to run,
executes them in **parallel** (each with its own harness and repo read tools),
consolidates their changes, runs an **adversarial review** that tries to refute
each change, and **validates before accepting** — with long-term **memory** it
carries across runs, a token/cost trace, and a golden-task eval harness so you
can iterate on prompts with feedback.

```
orbi-cli/
├── src/
│   ├── index.ts                 # CLI entry (commander)
│   ├── commands/
│   │   ├── feature.ts fix.ts review.ts   # task commands
│   │   ├── eval.ts              # orbi eval — score golden tasks
│   │   ├── memory.ts            # orbi memory — inspect/clear long-term memory
│   │   └── runner.ts            # shared: task setup + report + trace
│   ├── agents/
│   │   ├── orchestrator.ts      # plan → execute → review → validate → apply
│   │   ├── planner.ts           # LLM planning stage (routing + shared brief)
│   │   ├── reviewer.ts          # adversarial "verify before accept" stage
│   │   ├── base.ts              # shared agent behavior
│   │   ├── backend.ts frontend.ts qa.ts docs.ts
│   │   └── index.ts             # agent registry
│   ├── harness/
│   │   ├── loader.ts            # composes shared + per-role prompts
│   │   ├── shared/guidelines.md
│   │   ├── backend/ frontend/ qa/ docs/ planner/ reviewer/   # system.md each
│   ├── llm/
│   │   ├── provider.ts          # Anthropic provider + agentic tool loop + tracing
│   │   └── tools.ts             # repo-scoped read tools (list_dir/read_file/grep)
│   ├── mcp/
│   │   ├── config.ts            # load .orbi/mcp.json
│   │   └── manager.ts           # connect MCP servers, wrap their tools as AgentTools
│   └── core/
│       ├── types.ts  logger.ts
│       ├── telemetry.ts         # token/cost tracer (Observability)
│       ├── evals.ts             # golden-task scoring (Evals)
│       ├── memory.ts            # long-term memory store (.orbi/memory.md)
│       ├── validation.ts        # validators run before/after accepting changes
│       └── workspace.ts         # apply changes with rollback
└── evals/sample.json            # example golden tasks
```

## How it works

The orchestrator runs a **plan → execute → review → validate → apply** pipeline:

1. **Plan** — a planner inspects the repo (with the read tools) and decides which
   agents actually have work to do, plus a short shared *brief* to keep them
   aligned. Skip with `--no-plan` (falls back to static routing) or override with
   `--agents`.
2. **Execute** — the selected agents run **concurrently** (`Promise.all`), each
   loading its own harness from `harness/<agent>/` and running an **agentic tool
   loop**: it explores the repository with read-only tools (`list_dir`,
   `read_file`, `grep`, all sandboxed to the repo root), then submits a structured
   result via the `propose_changes` tool. Nothing is dumped into the prompt
   upfront — the agent pulls only the context it needs (Context Engineering).
3. **Consolidate** — merge the changes, flagging any path two agents both touched.
4. **Review (adversarial)** — a skeptical reviewer inspects the *current* repo and
   tries to **refute** each change; rejected changes are dropped before anything
   is written. Skip with `--no-review`.
5. **Validate & apply** — structural validators always run; add post-apply
   commands (typecheck, lint, tests) with `--validate`. Changes are written to
   disk only with `--apply` **and** only if validation passes — otherwise they are
   rolled back all-or-nothing.

Two layers of **memory** run alongside the pipeline:

- **Long-term** — a human-readable `.orbi/memory.md` in the target repo. Every
  stage reads the relevant slice before working (repo-wide facts plus its own
  scope), and each role proposes new lessons, which are persisted (deduped,
  capped) at the end of the run. Skip with `--no-memory`.
- **Short-term** — within one run, the plan brief and the agents' notes flow into
  the reviewer's prompt so it verifies with the full reasoning context.

Agents reach external tools over **MCP** (Model Context Protocol). Configure
servers in `.orbi/mcp.json` and orbi connects at the start of a run, lists each
server's tools, and exposes them as first-class tools **alongside** the built-in
read tools — the agents don't know or care which is which. Connections are shared
across the parallel agents and closed when the run ends. Skip with `--no-mcp`.

Every model round-trip is traced (tokens, cache, latency, estimated cost) and a
per-stage summary is printed at the end (Observability).

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

# Skip pipeline stages (faster / cheaper):
npm run orbi -- fix "Off-by-one in pagination" --no-plan --no-review

# Run the eval suite (golden tasks, scored, with a cost trace):
npm run orbi -- eval               # uses evals/sample.json
npm run orbi -- eval evals/my-suite.json

# Inspect or reset what the agents have learned:
npm run orbi -- memory
npm run orbi -- memory --clear

# List the tools your configured MCP servers expose:
npm run orbi -- mcp
```

## MCP servers

Give the agents extra tools (git, filesystem, GitHub, your own servers) by
dropping an `.orbi/mcp.json` in the target repo — see `mcp.example.json`:

```json
{
  "servers": {
    "git": { "command": "uvx", "args": ["mcp-server-git", "--repository", "."] }
  }
}
```

Each server is launched over stdio (in the repo root), its tools are namespaced
as `<server>__<tool>`, and they join the agents' tool set for the run. Per
server, `tools` allowlists which tools to expose (**restrict to read-only tools**
to keep agents exploring rather than mutating), and `disabled` turns one off.
`orbi mcp` connects and lists what's available; a server that fails to start is
warned and skipped, never aborting the run.

Build a standalone binary:

```bash
npm run build && node dist/index.js feature "..."
```

## Evals & observability

`orbi eval [file]` runs a suite of **golden tasks** (JSON) through the full
pipeline in dry-run mode and scores each with deterministic assertions —
expected agents, path patterns, change counts, notes, conflict-freedom,
validation. It prints a pass/fail table plus the total token/cost trace, so you
can change a harness or the pipeline and *measure* the effect. See
`evals/sample.json` for the format (`core/evals.ts` for all assertion fields).

## Extending it

- **New agent**: add `harness/<name>/system.md`, a subclass in `agents/<name>.ts`,
  and register it in `agents/index.ts` + `core/types.ts` (`AgentName`).
- **New read tool**: implement the `AgentTool` interface in `llm/tools.ts` and
  add it to `createRepoTools`.
- **External tools via MCP**: add a server to `.orbi/mcp.json` — no code change.
- **New validator**: implement the `Validator` interface in `core/validation.ts`.
- **Tune planning/review**: edit `harness/planner/system.md` and
  `harness/reviewer/system.md` — no code change needed.
- **Seed memory**: hand-edit `.orbi/memory.md` (one `- [scope] text` per line;
  scope is `repo` or an agent name) to teach the agents your conventions.
- **New golden tasks**: add a JSON suite (see `evals/sample.json`) and run
  `orbi eval <file>`.
- **Different LLM backend**: implement `LLMProvider` in `llm/provider.ts`.
