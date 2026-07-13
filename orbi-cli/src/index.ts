#!/usr/bin/env node
/**
 * orbi-cli entry point.
 *
 * A local orchestrator that instantiates specialized in-memory agents, loads a
 * per-agent harness, runs them in parallel, consolidates their proposed changes,
 * and validates before accepting.
 */

import { Command } from "commander";
import { feature } from "./commands/feature.js";
import { fix } from "./commands/fix.js";
import { review } from "./commands/review.js";
import { evalCommand } from "./commands/eval.js";
import { logger } from "./core/logger.js";

const program = new Command();

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

program
  .name("orbi")
  .description(
    "Local multi-agent orchestrator: specialized agents run in parallel and are validated before changes are accepted.",
  )
  .version("0.1.0");

// Options shared by every task command.
function withCommonOptions(cmd: Command): Command {
  return cmd
    .option("-a, --agents <list>", "restrict to a comma-separated set of agents")
    .option("-r, --repo <path>", "repository root (default: current directory)")
    .option("--no-plan", "skip the LLM planning stage (use static routing)")
    .option("--no-review", "skip the adversarial review stage")
    .option(
      "-v, --validate <command>",
      "post-apply validation command (repeatable, e.g. 'npm test')",
      collect,
      [],
    );
}

withCommonOptions(
  program
    .command("feature <description>")
    .description("Build a new feature across backend, frontend, tests, and docs")
    .option("--apply", "write changes to disk after validation passes"),
).action(feature);

withCommonOptions(
  program
    .command("fix <description>")
    .description("Fix a bug and add regression coverage")
    .option("--apply", "write changes to disk after validation passes"),
).action(fix);

withCommonOptions(
  program
    .command("review <description>")
    .description("Read-only multi-agent review — reports findings, writes nothing"),
).action(review);

program
  .command("eval [file]")
  .description("Run golden tasks through the pipeline and score them (dry run)")
  .option("-r, --repo <path>", "repository root (default: current directory)")
  .action(evalCommand);

program.parseAsync(process.argv).catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
