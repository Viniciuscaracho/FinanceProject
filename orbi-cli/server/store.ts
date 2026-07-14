/**
 * In-memory store for run records. Each incoming event mutates the relevant
 * run; SSE subscribers are notified after every mutation.
 */

import type { OrbEvent, StageName } from "../src/core/emitter.js";

export interface ToolCallRecord {
  tool: string;
  ts: number;
}

export interface AgentRecord {
  name: string;
  startedAt: number;
  endedAt?: number;
  status: "running" | "done" | "failed";
  summary: string;
  changeCount: number;
  noteCount: number;
  error?: string;
  toolCalls: ToolCallRecord[];
}

export interface StageRecord {
  stage: StageName;
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
}

export interface SpanRecord {
  label: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUSD: number;
  ms: number;
}

export interface RunRecord {
  runId: string;
  taskKind: string;
  description: string;
  repoRoot: string;
  startedAt: number;
  endedAt?: number;
  status: "running" | "done" | "failed";
  stages: StageRecord[];
  agents: Record<string, AgentRecord>;
  spans: SpanRecord[];
  totalCostUSD: number;
  applied: boolean;
  validationPassed: boolean;
}

type Subscriber = (run: RunRecord) => void;

const MAX_RUNS = 50;

export class RunStore {
  private runs = new Map<string, RunRecord>();
  private order: string[] = []; // insertion order, newest first
  private subscribers = new Set<Subscriber>();

  apply(event: OrbEvent): void {
    if (event.kind === "run:start") {
      const run: RunRecord = {
        runId: event.runId,
        taskKind: event.taskKind,
        description: event.description,
        repoRoot: event.repoRoot,
        startedAt: event.ts,
        status: "running",
        stages: [],
        agents: {},
        spans: [],
        totalCostUSD: 0,
        applied: false,
        validationPassed: false,
      };
      this.runs.set(event.runId, run);
      this.order = [event.runId, ...this.order.filter((id) => id !== event.runId)];
      // Cap at MAX_RUNS
      if (this.order.length > MAX_RUNS) {
        const removed = this.order.splice(MAX_RUNS);
        removed.forEach((id) => this.runs.delete(id));
      }
      this.notify(run);
      return;
    }

    const run = this.runs.get(event.runId);
    if (!run) return;

    switch (event.kind) {
      case "run:end":
        run.endedAt = event.ts;
        run.applied = event.applied;
        run.validationPassed = event.validationPassed;
        run.status = event.validationPassed || event.applied ? "done" : "failed";
        break;

      case "stage:start":
        run.stages.push({ stage: event.stage, startedAt: event.ts });
        break;

      case "stage:end": {
        const s = run.stages.find((s) => s.stage === event.stage && !s.endedAt);
        if (s) { s.endedAt = event.ts; s.durationMs = event.durationMs; }
        break;
      }

      case "agent:start":
        run.agents[event.agent] = {
          name: event.agent,
          startedAt: event.ts,
          status: "running",
          summary: "",
          changeCount: 0,
          noteCount: 0,
          toolCalls: [],
        };
        break;

      case "agent:end": {
        const a = run.agents[event.agent];
        if (a) {
          a.endedAt = event.ts;
          a.status = event.error ? "failed" : "done";
          a.summary = event.summary;
          a.changeCount = event.changeCount;
          a.noteCount = event.noteCount;
          a.error = event.error;
        }
        break;
      }

      case "tool:call": {
        const ag = run.agents[event.agent];
        if (ag) ag.toolCalls.push({ tool: event.tool, ts: event.ts });
        break;
      }

      case "span": {
        const existing = run.spans.find((s) => s.label === event.label);
        if (existing) {
          existing.inputTokens += event.inputTokens;
          existing.outputTokens += event.outputTokens;
          existing.cacheReadTokens += event.cacheReadTokens;
          existing.cacheWriteTokens += event.cacheWriteTokens;
          existing.costUSD += event.costUSD;
          existing.ms += event.ms;
        } else {
          run.spans.push({
            label: event.label,
            inputTokens: event.inputTokens,
            outputTokens: event.outputTokens,
            cacheReadTokens: event.cacheReadTokens,
            cacheWriteTokens: event.cacheWriteTokens,
            costUSD: event.costUSD,
            ms: event.ms,
          });
        }
        run.totalCostUSD = run.spans.reduce((s, sp) => s + sp.costUSD, 0);
        break;
      }
    }

    this.notify(run);
  }

  all(): RunRecord[] {
    return this.order.map((id) => this.runs.get(id)!);
  }

  get(id: string): RunRecord | undefined {
    return this.runs.get(id);
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  private notify(run: RunRecord): void {
    for (const fn of this.subscribers) fn(run);
  }
}
