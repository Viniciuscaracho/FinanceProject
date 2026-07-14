# orbi-cli — project notes

## Standing rule: capture discoveries here

Whenever you figure something out that would otherwise have to be re-discovered —
a data shape, a file's structure, a build/tooling quirk, a non-obvious workflow,
a gotcha, a decision and its rationale — **append it to this file** as part of the
same task, before finishing. Treat it as a required step, not an afterthought.

- Add a concise, dated-agnostic note under an existing section, or create a new
  `##` section if it doesn't fit.
- Write it so a future session can act without repeating the investigation
  (include the concrete details: paths, shapes, commands, values).
- Keep it factual and current — update or remove a note when it goes stale rather
  than letting it rot.

## Dashboard preview as an Artifact (reusable procedure)

When asked to "subir o dashboard" / show the screens / publish the UI for review,
**skip the discovery** — the structure and data shape are captured here. Do this:

1. **Don't redesign.** The dashboard (`server/dashboard.html`) is the existing,
   deliberate design: a single-theme dark "terminal" UI. Honor it — reuse its
   CSS/markup/JS verbatim. Only swap the data source.
2. **Load the `artifact-design` skill** before writing the page (Artifact requires it).
3. **The Artifact sandbox can't reach the live server**, so the real dashboard's
   `EventSource('/stream')` renders empty. Publish a **self-contained copy seeded
   with sample runs** instead, and label it as static (`sample data`, not `live`).
4. Adapt the page for the Artifact skeleton (it wraps the file in
   `<!doctype><head><body>`): drop the outer `<html>/<head>/<body>`, keep `<title>`,
   `<style>`, markup and `<script>`, and wrap the layout in a `<div class="app">`
   grid instead of styling `body` as the grid (robust against injected siblings).
5. Publish with the Artifact tool; to revise, republish the **same file path** to
   keep the URL.

A ready-made seeded copy lives at (scratchpad, regenerate if gone):
`orbi-dashboard-preview.html` — 3 runs covering the states below.

### Data shape the UI consumes (RunRecord — from `server/store.ts`)

One run object per `data:` SSE frame / `/api/runs` entry:

```
RunRecord {
  runId, taskKind, description, repoRoot,
  startedAt, endedAt?,                         // epoch ms
  status: 'running' | 'done' | 'failed',       // done if validationPassed||applied
  stages: [{ stage, startedAt, endedAt?, durationMs? }],  // stage ∈ plan|execute|review|validate|apply
  agents: { [name]: AgentRecord },             // name ∈ backend|frontend|qa|docs
  spans: [SpanRecord],
  totalCostUSD, applied, validationPassed,
}
AgentRecord { name, startedAt, endedAt?, status:'running'|'done'|'failed',
              summary, changeCount, noteCount, error?, toolCalls:[{tool, ts}] }
SpanRecord  { label, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, costUSD, ms }
```

Cover these three states so every screen is exercised:
- **running** — plan done, execute active (pulsing stage, spinner badge, streaming tool calls).
- **done + applied** — full pipeline (plan→execute→review→validate→apply), agents with
  summaries + tools, populated token-trace table.
- **failed** — `validationPassed:false`, no apply stage.

Cost model (opus-4-8): `costUSD = (in*5 + cacheRead*0.5 + out*25)/1e6`; `totalCostUSD` = sum of span costs.

## Tooling reminders

- `npm run typecheck` uses `tsconfig.check.json` (covers `src/` **and** `server/`).
  `npm run build` emits from `src/` only; the `server/` dir runs via tsx.
- No `ANTHROPIC_API_KEY` in the sandbox — runs fail at the API call but the whole
  pipeline (and dashboard event flow) still exercises; that's the expected smoke path.
