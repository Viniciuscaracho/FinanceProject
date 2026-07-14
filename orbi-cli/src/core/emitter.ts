/**
 * Fire-and-forget HTTP emitter: posts structured events to the orbi dashboard
 * server (localhost:3000). If the server is not running, errors are silently
 * swallowed — the CLI works normally whether or not the dashboard is up.
 */

export type EventKind =
  | "run:start"
  | "run:end"
  | "stage:start"
  | "stage:end"
  | "agent:start"
  | "agent:end"
  | "tool:call"
  | "span";

export type StageName = "plan" | "execute" | "review" | "validate" | "apply";

export interface RunStartEvent {
  kind: "run:start";
  runId: string;
  taskKind: string;
  description: string;
  repoRoot: string;
  ts: number;
}

export interface RunEndEvent {
  kind: "run:end";
  runId: string;
  applied: boolean;
  validationPassed: boolean;
  ts: number;
}

export interface StageStartEvent {
  kind: "stage:start";
  runId: string;
  stage: StageName;
  ts: number;
}

export interface StageEndEvent {
  kind: "stage:end";
  runId: string;
  stage: StageName;
  durationMs: number;
  ts: number;
}

export interface AgentStartEvent {
  kind: "agent:start";
  runId: string;
  agent: string;
  ts: number;
}

export interface AgentEndEvent {
  kind: "agent:end";
  runId: string;
  agent: string;
  summary: string;
  changeCount: number;
  noteCount: number;
  error?: string;
  ts: number;
}

export interface ToolCallEvent {
  kind: "tool:call";
  runId: string;
  agent: string;
  tool: string;
  ts: number;
}

export interface SpanEvent {
  kind: "span";
  runId: string;
  label: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUSD: number;
  ms: number;
  ts: number;
}

export type OrbEvent =
  | RunStartEvent
  | RunEndEvent
  | StageStartEvent
  | StageEndEvent
  | AgentStartEvent
  | AgentEndEvent
  | ToolCallEvent
  | SpanEvent;

const SERVER_URL = process.env.ORBI_SERVER ?? "http://localhost:3000";

export class Emitter {
  constructor(private readonly runId: string) {}

  emit(event: OrbEvent): void {
    // Fire-and-forget: never block the CLI, never throw.
    fetch(`${SERVER_URL}/api/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(2000),
    }).catch(() => {
      // Dashboard not running — silently ignore.
    });
  }

  stageTimer(stage: StageName): () => void {
    const started = Date.now();
    this.emit({ kind: "stage:start", runId: this.runId, stage, ts: started });
    return () => {
      this.emit({
        kind: "stage:end",
        runId: this.runId,
        stage,
        durationMs: Date.now() - started,
        ts: Date.now(),
      });
    };
  }
}

/** Generate a short run ID (8 hex chars from crypto). */
export function newRunId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
