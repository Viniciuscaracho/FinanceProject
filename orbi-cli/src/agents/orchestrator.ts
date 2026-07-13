/**
 * Orchestrator — a plan → execute → review pipeline.
 *
 *   1. Plan     — a planner decides which agents run and writes a shared brief.
 *   2. Execute  — the selected agents run in parallel, each exploring the repo.
 *   3. Consolidate — merge changes, flag paths two agents both touched.
 *   4. Review   — an adversarial reviewer tries to refute each change; rejected
 *                 changes are dropped before anything is written.
 *   5. Validate & apply — structural + post-apply validators gate the write,
 *                 with all-or-nothing rollback.
 *
 * The four specialized agents are untouched by this pipeline; planning and
 * review are separate orchestration roles.
 */

import { logger } from "../core/logger.js";
import type { LLMProvider } from "../llm/provider.js";
import type { Tracer } from "../core/telemetry.js";
import {
  runValidators,
  noConflictsValidator,
  wellFormedChangesValidator,
} from "../core/validation.js";
import { applyChangeSet } from "../core/workspace.js";
import { MemoryStore, type MemoryEntry } from "../core/memory.js";
import type {
  AgentName,
  AgentResult,
  ChangeSet,
  CommandKind,
  FileChange,
  OrchestrationResult,
  Plan,
  Review,
  Task,
  Validator,
} from "../core/types.js";
import { ALL_AGENTS, createAgent } from "./index.js";
import { Planner } from "./planner.js";
import { Reviewer } from "./reviewer.js";

/** Fallback routing when planning is off or fails. */
const DEFAULT_ROUTING: Record<CommandKind, AgentName[]> = {
  feature: ["backend", "frontend", "qa", "docs"],
  fix: ["backend", "frontend", "qa"],
  review: ["backend", "frontend", "qa"],
};

export interface OrchestratorOptions {
  /** Validators run *after* changes are written to disk (typecheck, tests). */
  postApplyValidators?: Validator[];
  /** Run the LLM planning stage (default true). */
  plan?: boolean;
  /** Run the adversarial review stage (default true). */
  review?: boolean;
  /** Read/write long-term memory in `.orbi/memory.md` (default true). */
  memory?: boolean;
  /** Observability sink for token/cost tracing. */
  tracer?: Tracer;
}

export class Orchestrator {
  private readonly planner: Planner;
  private readonly reviewer: Reviewer;

  constructor(
    private readonly llm: LLMProvider,
    private readonly opts: OrchestratorOptions = {},
  ) {
    this.planner = new Planner(llm);
    this.reviewer = new Reviewer(llm);
  }

  async execute(task: Task): Promise<OrchestrationResult> {
    // Long-term memory: load once, inject the relevant slice into each stage.
    const memoryEnabled = this.opts.memory !== false;
    const store = new MemoryStore(task.repoRoot);
    if (memoryEnabled) await store.load();
    const mem = (scope: string) => (memoryEnabled ? store.forScope(scope) : "");

    // 1. Plan.
    const { plan, agents, brief } = await this.planStage(task, mem("planner"));
    logger.step(`Agents: ${agents.join(", ")}`);
    if (brief) logger.dim(`  brief: ${brief}`);

    // 2. Execute — agents run concurrently, each with the shared brief + memory.
    const results = await Promise.all(
      agents.map(async (name) => {
        const agent = createAgent(name, this.llm);
        logger.agent(name, "working…");
        const result = await agent.run(task, {
          brief,
          memory: mem(name),
          onToolCall: (label) => logger.dim(`  [${name}] ${label}`),
        });
        if (result.error) logger.agent(name, `failed: ${result.error}`);
        else
          logger.agent(
            name,
            `${result.changes.length} change(s), ${result.notes.length} note(s)`,
          );
        return result;
      }),
    );

    // 3. Consolidate.
    let changeSet = this.consolidate(results, task);

    // 4. Adversarial review (short-term memory: brief + agent notes flow in).
    let review: Review | undefined;
    let rejected: FileChange[] = [];
    if (task.kind !== "review" && changeSet.changes.length > 0 && this.opts.review !== false) {
      const agentNotes = results
        .flatMap((r) => r.notes.map((n) => `[${r.agent}] ${n}`))
        .join("\n");
      const outcome = await this.reviewStage(task, changeSet, {
        brief,
        agentNotes,
        memory: mem("reviewer"),
      });
      review = outcome.review;
      changeSet = outcome.accepted;
      rejected = outcome.rejected;
    }

    // Persist lessons learned this run (deduped, capped) at the very end.
    if (memoryEnabled) await this.persistMemory(store, results, review);

    // 5. Validate.
    const preValidators: Validator[] = [noConflictsValidator, wellFormedChangesValidator];
    let validation = await runValidators(preValidators, changeSet, task.repoRoot);

    // 6. Apply.
    let applied = false;
    if (task.apply && task.kind !== "review") {
      if (!validation.passed) {
        logger.warn("Pre-apply validation failed — not writing changes.");
      } else if (changeSet.changes.length === 0) {
        logger.info("No changes to apply.");
      } else {
        applied = await this.applyAndVerify(changeSet, task, (report) => {
          validation = report;
        });
      }
    }

    return { task, plan, agentResults: results, changeSet, review, rejected, validation, applied };
  }

  /** Decide which agents run, and produce a shared brief when planning. */
  private async planStage(
    task: Task,
    memory: string,
  ): Promise<{ plan?: Plan; agents: AgentName[]; brief: string }> {
    if (task.requestedAgents.length > 0) {
      return { agents: task.requestedAgents.filter((a) => ALL_AGENTS.includes(a)), brief: "" };
    }
    if (this.opts.plan === false) {
      return { agents: DEFAULT_ROUTING[task.kind], brief: "" };
    }
    logger.step("Planning…");
    try {
      const plan = await this.planner.plan(task, memory, (label) =>
        logger.dim(`  [planner] ${label}`),
      );
      const agents = plan.agents.length > 0 ? plan.agents : DEFAULT_ROUTING[task.kind];
      return { plan, agents, brief: plan.brief };
    } catch (err) {
      logger.warn(`Planning failed (${(err as Error).message}); using default routing.`);
      return { agents: DEFAULT_ROUTING[task.kind], brief: "" };
    }
  }

  /** Run the reviewer and split the change set into accepted vs rejected. */
  private async reviewStage(
    task: Task,
    changeSet: ChangeSet,
    ctx: { brief?: string; agentNotes?: string; memory?: string },
  ): Promise<{ review?: Review; accepted: ChangeSet; rejected: FileChange[] }> {
    logger.step("Adversarial review…");
    let review: Review;
    try {
      review = await this.reviewer.review(task, changeSet, ctx, (label) =>
        logger.dim(`  [reviewer] ${label}`),
      );
    } catch (err) {
      logger.warn(`Review failed (${(err as Error).message}); proceeding without it.`);
      return { accepted: changeSet, rejected: [] };
    }

    const rejectedPaths = new Set(
      review.verdicts.filter((v) => v.verdict === "reject").map((v) => v.path),
    );
    const accepted: FileChange[] = [];
    const rejected: FileChange[] = [];
    for (const change of changeSet.changes) {
      (rejectedPaths.has(change.path) ? rejected : accepted).push(change);
    }
    for (const v of review.verdicts) {
      if (v.verdict === "reject") logger.warn(`reviewer rejected ${v.path}: ${v.reason}`);
    }

    return {
      review,
      accepted: { changes: accepted, conflicts: changeSet.conflicts },
      rejected,
    };
  }

  /** Merge per-agent changes, flagging any path touched by more than one agent. */
  private consolidate(results: AgentResult[], task: Task): ChangeSet {
    if (task.kind === "review") {
      return { changes: [], conflicts: [] };
    }

    const byPath = new Map<string, string>(); // path -> owning agent
    const merged = new Map<string, FileChange>();
    const conflicts = new Set<string>();

    for (const result of results) {
      if (result.error) continue;
      for (const change of result.changes) {
        const owner = byPath.get(change.path);
        if (owner && owner !== result.agent) conflicts.add(change.path);
        byPath.set(change.path, result.agent);
        merged.set(change.path, change);
      }
    }

    return { changes: [...merged.values()], conflicts: [...conflicts] };
  }

  /**
   * Persist lessons learned this run. Agent memories are scoped to that agent's
   * domain; the reviewer sees everything, so its lessons are repo-wide.
   */
  private async persistMemory(
    store: MemoryStore,
    results: AgentResult[],
    review: Review | undefined,
  ): Promise<void> {
    const entries: MemoryEntry[] = [];
    for (const r of results) {
      if (r.error) continue;
      for (const text of r.memories) entries.push({ scope: r.agent, text });
    }
    for (const text of review?.memories ?? []) entries.push({ scope: "repo", text });

    const added = await store.remember(entries);
    if (added > 0) logger.dim(`  learned ${added} new memory item(s) → .orbi/memory.md`);
  }

  /** Write changes, run post-apply validators, and roll back on failure. */
  private async applyAndVerify(
    changeSet: ChangeSet,
    task: Task,
    onReport: (report: OrchestrationResult["validation"]) => void,
  ): Promise<boolean> {
    logger.step(`Applying ${changeSet.changes.length} change(s)…`);
    const applied = await applyChangeSet(changeSet, task.repoRoot);

    const post = this.opts.postApplyValidators ?? [];
    if (post.length === 0) {
      logger.success("Changes applied (no post-apply validators configured).");
      return true;
    }

    logger.step(`Running ${post.length} post-apply validator(s)…`);
    const report = await runValidators(post, changeSet, task.repoRoot);
    onReport(report);

    if (report.passed) {
      logger.success("Post-apply validation passed. Changes kept.");
      return true;
    }

    logger.error("Post-apply validation failed — rolling back.");
    await applied.rollback();
    return false;
  }
}
