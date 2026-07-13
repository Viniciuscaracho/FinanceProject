/**
 * Evals: golden tasks with deterministic assertions over an orchestration
 * result. Lets you change a harness or the pipeline and measure the effect
 * instead of trusting it. Scoring is pure; the `eval` command drives the runs.
 */

import type { AgentName, CommandKind, OrchestrationResult } from "./types.js";

export interface EvalExpectation {
  /** Each listed agent must produce at least one accepted change. */
  agents?: AgentName[];
  /** Each regex must match at least one accepted change path. */
  pathMatches?: string[];
  /** Fail if any path was touched by more than one agent (default: true). */
  noConflicts?: boolean;
  minChanges?: number;
  maxChanges?: number;
  /** Each substring must appear in some agent note (case-insensitive). */
  notesInclude?: string[];
  /** Structural validation must pass (default: true). */
  validationPasses?: boolean;
}

export interface GoldenTask {
  name: string;
  kind: CommandKind;
  description: string;
  /** Restrict to these agents (skips planning). */
  agents?: AgentName[];
  plan?: boolean;
  review?: boolean;
  expect: EvalExpectation;
}

export interface EvalResult {
  name: string;
  passed: boolean;
  failures: string[];
}

/** Compare an orchestration result against a golden task's expectations. */
export function scoreTask(task: GoldenTask, result: OrchestrationResult): EvalResult {
  const failures: string[] = [];
  const e = task.expect;
  const changes = result.changeSet.changes;
  const paths = changes.map((c) => c.path);

  for (const agent of e.agents ?? []) {
    // A change "survived" if the agent proposed it and it wasn't reviewer-rejected.
    const survived = result.agentResults
      .find((r) => r.agent === agent)
      ?.changes.some((c) => paths.includes(c.path));
    if (!survived) {
      failures.push(`expected agent "${agent}" to produce an accepted change`);
    }
  }

  for (const pattern of e.pathMatches ?? []) {
    const re = new RegExp(pattern);
    if (!paths.some((p) => re.test(p))) {
      failures.push(`no accepted change path matched /${pattern}/`);
    }
  }

  if ((e.noConflicts ?? true) && result.changeSet.conflicts.length > 0) {
    failures.push(`unexpected conflicts: ${result.changeSet.conflicts.join(", ")}`);
  }

  if (e.minChanges !== undefined && changes.length < e.minChanges) {
    failures.push(`expected ≥ ${e.minChanges} changes, got ${changes.length}`);
  }
  if (e.maxChanges !== undefined && changes.length > e.maxChanges) {
    failures.push(`expected ≤ ${e.maxChanges} changes, got ${changes.length}`);
  }

  const allNotes = result.agentResults
    .flatMap((r) => r.notes)
    .join("\n")
    .toLowerCase();
  for (const needle of e.notesInclude ?? []) {
    if (!allNotes.includes(needle.toLowerCase())) {
      failures.push(`expected a note containing "${needle}"`);
    }
  }

  if ((e.validationPasses ?? true) && !result.validation.passed) {
    failures.push("structural validation failed");
  }

  const anyAgentError = result.agentResults.find((r) => r.error);
  if (anyAgentError) {
    failures.push(`agent error: ${anyAgentError.agent} — ${anyAgentError.error}`);
  }

  return { name: task.name, passed: failures.length === 0, failures };
}
