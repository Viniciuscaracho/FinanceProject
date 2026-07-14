/**
 * `orbi eval [file]` — run golden tasks through the full pipeline (dry run) and
 * score each against its expectations. Prints a pass/fail table and the total
 * token/cost trace so harness changes can be judged with feedback.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { Orchestrator } from "../agents/orchestrator.js";
import { AnthropicProvider } from "../llm/provider.js";
import { Tracer } from "../core/telemetry.js";
import { newRunId } from "../core/emitter.js";
import { scoreTask, type EvalResult, type GoldenTask } from "../core/evals.js";
import { logger } from "../core/logger.js";
import type { Task } from "../core/types.js";

export interface EvalCliOptions {
  repo?: string;
}

const DEFAULT_SUITE = "evals/sample.json";

export async function evalCommand(file: string | undefined, options: EvalCliOptions): Promise<void> {
  const repoRoot = path.resolve(options.repo ?? process.cwd());
  const suitePath = path.resolve(file ?? path.join(repoRoot, DEFAULT_SUITE));

  let tasks: GoldenTask[];
  try {
    tasks = JSON.parse(await readFile(suitePath, "utf8")) as GoldenTask[];
  } catch (err) {
    logger.error(`Could not load eval suite at ${suitePath}: ${(err as Error).message}`);
    process.exitCode = 1;
    return;
  }

  logger.step(`Running ${tasks.length} golden task(s) from ${path.relative(repoRoot, suitePath)}`);
  const tracer = new Tracer();
  const results: EvalResult[] = [];

  for (const golden of tasks) {
    logger.info("");
    logger.step(`eval: ${golden.name}`);
    const task: Task = {
      kind: golden.kind,
      runId: newRunId(),
      description: golden.description,
      repoRoot,
      requestedAgents: golden.agents ?? [],
      apply: false, // evals never write to disk
    };
    const orchestrator = new Orchestrator(new AnthropicProvider({}, tracer), {
      plan: golden.plan,
      review: golden.review,
      memory: false, // evals stay deterministic — no memory read/write
      mcp: false, // evals don't depend on external MCP servers
      tracer,
    });

    try {
      const outcome = await orchestrator.execute(task);
      const scored = scoreTask(golden, outcome);
      results.push(scored);
      if (scored.passed) logger.success(`${golden.name} passed`);
      else {
        logger.error(`${golden.name} failed`);
        for (const f of scored.failures) logger.error(`    - ${f}`);
      }
    } catch (err) {
      results.push({ name: golden.name, passed: false, failures: [(err as Error).message] });
      logger.error(`${golden.name} errored: ${(err as Error).message}`);
    }
  }

  const passed = results.filter((r) => r.passed).length;
  logger.info("");
  logger.step(`Results: ${passed}/${results.length} passed`);
  const trace = tracer.render();
  if (trace) {
    logger.step("Trace (tokens / cost)");
    logger.info(trace);
  }

  if (passed < results.length) process.exitCode = 1;
}
