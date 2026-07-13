/**
 * Orchestrator.
 *
 * Responsibilities:
 *   1. Route a task to the relevant specialized agents.
 *   2. Instantiate those agents in memory and run them in parallel.
 *   3. Consolidate their proposed changes into one conflict-aware change set.
 *   4. Validate the change set, and only apply it to disk when validation passes.
 */

import { spawnSync } from "node:child_process";
import { logger } from "../core/logger.js";
import type { LLMProvider } from "../llm/provider.js";
import {
  runValidators,
  noConflictsValidator,
  wellFormedChangesValidator,
} from "../core/validation.js";
import { applyChangeSet } from "../core/workspace.js";
import type {
  AgentName,
  AgentResult,
  ChangeSet,
  CommandKind,
  OrchestrationResult,
  Task,
  Validator,
} from "../core/types.js";
import { ALL_AGENTS, createAgent } from "./index.js";

/** Which agents each command fans out to when none are named explicitly. */
const DEFAULT_ROUTING: Record<CommandKind, AgentName[]> = {
  feature: ["backend", "frontend", "qa", "docs"],
  fix: ["backend", "frontend", "qa"],
  review: ["backend", "frontend", "qa"],
};

export interface OrchestratorOptions {
  /** Validators run *after* changes are written to disk (typecheck, tests). */
  postApplyValidators?: Validator[];
  /** Cap on repository files listed in the context sent to agents. */
  contextFileLimit?: number;
}

export class Orchestrator {
  constructor(
    private readonly llm: LLMProvider,
    private readonly opts: OrchestratorOptions = {},
  ) {}

  async execute(task: Task): Promise<OrchestrationResult> {
    const agents = this.route(task);
    logger.step(`Routing to agents: ${agents.join(", ")}`);

    const context = this.buildContext(task);

    // Fan out — every agent works the same task concurrently.
    const results = await Promise.all(
      agents.map(async (name) => {
        const agent = createAgent(name, this.llm);
        logger.agent(name, "working…");
        const result = await agent.run(task, context);
        if (result.error) {
          logger.agent(name, `failed: ${result.error}`);
        } else {
          logger.agent(
            name,
            `${result.changes.length} change(s), ${result.notes.length} note(s)`,
          );
        }
        return result;
      }),
    );

    const changeSet = this.consolidate(results, task);

    // In review mode we never write; validation only surfaces structural issues.
    const preValidators: Validator[] = [noConflictsValidator, wellFormedChangesValidator];
    let validation = await runValidators(preValidators, changeSet, task.repoRoot);

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

    return { task, agentResults: results, changeSet, validation, applied };
  }

  /** Decide which agents run. Explicit `requestedAgents` overrides the default. */
  private route(task: Task): AgentName[] {
    if (task.requestedAgents.length > 0) {
      return task.requestedAgents.filter((a) => ALL_AGENTS.includes(a));
    }
    return DEFAULT_ROUTING[task.kind];
  }

  /** Merge per-agent changes, flagging any path touched by more than one agent. */
  private consolidate(results: AgentResult[], task: Task): ChangeSet {
    if (task.kind === "review") {
      return { changes: [], conflicts: [] };
    }

    const byPath = new Map<string, string>(); // path -> owning agent
    const merged = new Map<string, ChangeSet["changes"][number]>();
    const conflicts = new Set<string>();

    for (const result of results) {
      if (result.error) continue;
      for (const change of result.changes) {
        const owner = byPath.get(change.path);
        if (owner && owner !== result.agent) {
          conflicts.add(change.path);
        }
        byPath.set(change.path, result.agent);
        merged.set(change.path, change);
      }
    }

    return { changes: [...merged.values()], conflicts: [...conflicts] };
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

  /** Lightweight repo context: the tracked file tree (bounded). */
  private buildContext(task: Task): string {
    const limit = this.opts.contextFileLimit ?? 400;
    const res = spawnSync("git", ["ls-files"], {
      cwd: task.repoRoot,
      encoding: "utf8",
    });
    if (res.status !== 0 || !res.stdout) {
      return "(not a git repository — no file listing available)";
    }
    const files = res.stdout.split("\n").filter(Boolean);
    const shown = files.slice(0, limit);
    const suffix = files.length > limit ? `\n… and ${files.length - limit} more` : "";
    return `Tracked files (${files.length}):\n${shown.join("\n")}${suffix}`;
  }
}
