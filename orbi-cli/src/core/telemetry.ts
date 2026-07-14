/**
 * Observability: a lightweight tracer that records every model round-trip
 * (tokens, cache usage, latency, estimated cost) grouped by a scope label
 * (an agent name, "planner", "reviewer", …). The orchestrator prints a summary
 * so prompt/harness changes can be judged on cost and behavior, not faith.
 */

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export interface Span extends Usage {
  label: string;
  ms: number;
  costUSD: number;
}

interface Aggregate extends Usage {
  label: string;
  ms: number;
  calls: number;
  costUSD: number;
}

/** USD per 1M tokens. cacheRead ≈ 0.1× input, cacheWrite ≈ 1.25× input. */
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

const FALLBACK = { input: 5, output: 25 };

export function estimateCost(model: string, u: Usage): number {
  const p = PRICING[model] ?? FALLBACK;
  return (
    (u.inputTokens * p.input +
      u.cacheReadTokens * p.input * 0.1 +
      u.cacheWriteTokens * p.input * 1.25 +
      u.outputTokens * p.output) /
    1_000_000
  );
}

export class Tracer {
  private readonly byLabel = new Map<string, Aggregate>();

  constructor(
    private readonly emitter?: import("./emitter.js").Emitter,
    private readonly runId?: string,
  ) {}

  record(span: Span): void {
    const agg =
      this.byLabel.get(span.label) ??
      {
        label: span.label,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        ms: 0,
        calls: 0,
        costUSD: 0,
      };
    agg.inputTokens += span.inputTokens;
    agg.outputTokens += span.outputTokens;
    agg.cacheReadTokens += span.cacheReadTokens;
    agg.cacheWriteTokens += span.cacheWriteTokens;
    agg.ms += span.ms;
    agg.costUSD += span.costUSD;
    agg.calls += 1;
    this.byLabel.set(span.label, agg);

    if (this.emitter && this.runId) {
      this.emitter.emit({
        kind: "span",
        runId: this.runId,
        label: span.label,
        inputTokens: span.inputTokens,
        outputTokens: span.outputTokens,
        cacheReadTokens: span.cacheReadTokens,
        cacheWriteTokens: span.cacheWriteTokens,
        costUSD: span.costUSD,
        ms: span.ms,
        ts: Date.now(),
      });
    }
  }

  scopes(): Aggregate[] {
    return [...this.byLabel.values()].sort((a, b) => b.costUSD - a.costUSD);
  }

  totalCostUSD(): number {
    return this.scopes().reduce((sum, s) => sum + s.costUSD, 0);
  }

  /** Human-readable trace table, or null when nothing was recorded. */
  render(): string | null {
    const scopes = this.scopes();
    if (scopes.length === 0) return null;
    const rows = scopes.map(
      (s) =>
        `  ${s.label.padEnd(12)} ${String(s.calls).padStart(3)} calls  ` +
        `in ${fmt(s.inputTokens)}  cache ${fmt(s.cacheReadTokens)}  out ${fmt(s.outputTokens)}  ` +
        `${(s.ms / 1000).toFixed(1)}s  $${s.costUSD.toFixed(4)}`,
    );
    rows.push(`  ${"TOTAL".padEnd(12)} ${" ".repeat(10)}$${this.totalCostUSD().toFixed(4)}`);
    return rows.join("\n");
  }
}

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
