import { runCommand, type CliOptions } from "./runner.js";

/** `orbi fix "<description>"` — targeted bug fix with test coverage. */
export function fix(description: string, options: CliOptions): Promise<void> {
  return runCommand("fix", description, options);
}
