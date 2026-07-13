import { runCommand, type CliOptions } from "./runner.js";

/** `orbi review "<description>"` — read-only multi-agent review, no changes. */
export function review(description: string, options: CliOptions): Promise<void> {
  return runCommand("review", description, options);
}
