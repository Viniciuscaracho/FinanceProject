/**
 * Shared command plumbing: turns parsed CLI options into a `Task`, runs the
 * orchestrator with observability, and prints a human-readable report.
 */

import path from "node:path";
import { Orchestrator } from "../agents/orchestrator.js";
import { AnthropicProvider } from "../llm/provider.js";
import { commandValidator } from "../core/validation.js";
import { Tracer } from "../core/telemetry.js";
import { Emitter, newRunId } from "../core/emitter.js";
import { logger } from "../core/logger.js";
import { ALL_AGENTS } from "../agents/index.js";
import type {
  AgentName,
  CommandKind,
  OrchestrationResult,
  Task,
} from "../core/types.js";

export interface CliOptions {
  /** Comma-separated agent names to restrict the run to. */
  agents?: string;
  /** Write changes to disk (default: dry run). */
  apply?: boolean;
  /** Repository root (default: cwd). */
  repo?: string;
  /** Post-apply validation commands (repeatable). */
  validate?: string[];
  /** Commander sets these to false via --no-plan / --no-review / --no-memory / --no-mcp. */
  plan?: boolean;
  review?: boolean;
  memory?: boolean;
  mcp?: boolean;
}

function parseAgents(value: string | undefined): AgentName[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is AgentName => (ALL_AGENTS as string[]).includes(s));
}

export async function runCommand(
  kind: CommandKind,
  description: string,
  options: CliOptions,
): Promise<void> {
  if (!description || !description.trim()) {
    logger.error("A task description is required.");
    process.exitCode = 1;
    return;
  }

  const repoRoot = path.resolve(options.repo ?? process.cwd());
  const runId = newRunId();
  const emitter = new Emitter(runId);

  const task: Task = {
    kind,
    runId,
    description: description.trim(),
    repoRoot,
    requestedAgents: parseAgents(options.agents),
    apply: kind === "review" ? false : Boolean(options.apply),
  };

  // Announce run to dashboard before anything else.
  emitter.emit({
    kind: "run:start",
    runId,
    taskKind: kind,
    description: task.description,
    repoRoot,
    ts: Date.now(),
  });

  const tracer = new Tracer(emitter, runId);
  const postApplyValidators = (options.validate ?? []).map((cmd, i) =>
    commandValidator(`validate-${i + 1}`, cmd),
  );

  const orchestrator = new Orchestrator(new AnthropicProvider({}, tracer), {
    postApplyValidators,
    plan: options.plan,
    review: options.review,
    memory: options.memory,
    mcp: options.mcp,
    tracer,
    emitter,
  });

  logger.step(`orbi ${kind}: ${task.description}`);
  const result = await orchestrator.execute(task);
  report(result, tracer);
}

function report(result: OrchestrationResult, tracer: Tracer): void {
  logger.info("");
  logger.step("Summary");

  for (const r of result.agentResults) {
    if (r.error) {
      logger.agent(r.agent, `error — ${r.error}`);
      continue;
    }
    if (r.summary) logger.agent(r.agent, r.summary);
    for (const note of r.notes) logger.dim(`    · ${note}`);
  }

  const { changes, conflicts } = result.changeSet;
  if (result.task.kind !== "review") {
    logger.info("");
    logger.step(`Accepted changes (${changes.length})`);
    for (const c of changes) {
      logger.info(`  ${c.op.padEnd(6)} ${c.path}  — ${c.rationale}`);
    }
    if (conflicts.length > 0) logger.warn(`Conflicting paths: ${conflicts.join(", ")}`);

    if (result.rejected.length > 0) {
      logger.info("");
      logger.step(`Rejected by reviewer (${result.rejected.length})`);
      for (const c of result.rejected) {
        const reason = result.review?.verdicts.find((v) => v.path === c.path)?.reason ?? "";
        logger.warn(`  ${c.path}  — ${reason}`);
      }
    }
  }

  logger.info("");
  if (result.validation.passed) {
    logger.success("Validation passed.");
  } else {
    logger.error("Validation failed:");
    for (const issue of result.validation.issues) {
      logger.error(`  [${issue.validator}] ${issue.message}`);
    }
    process.exitCode = 1;
  }

  const trace = tracer.render();
  if (trace) {
    logger.info("");
    logger.step("Trace (tokens / cost)");
    logger.info(trace);
  }

  logger.info("");
  if (result.task.kind === "review") {
    logger.info("Review complete (no changes written).");
  } else if (result.applied) {
    logger.success("Changes applied to disk.");
  } else if (result.task.apply) {
    logger.warn("Changes were NOT applied (see validation output).");
  } else {
    logger.info("Dry run — re-run with --apply to write changes.");
  }
}
