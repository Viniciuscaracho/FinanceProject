import { runCommand, type CliOptions } from "./runner.js";

/** `orbi feature "<description>"` — build a new capability across the stack. */
export function feature(description: string, options: CliOptions): Promise<void> {
  return runCommand("feature", description, options);
}
