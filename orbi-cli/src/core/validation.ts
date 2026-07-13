/**
 * Validation layer.
 *
 * Before the orchestrator accepts a change set it runs a list of `Validator`s.
 * Two built-in validators cover the structural checks that don't need the code
 * to be applied first; `commandValidator` wraps an arbitrary shell command
 * (typecheck, lint, tests) for use *after* changes are written to disk.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import type {
  ChangeSet,
  ValidationIssue,
  ValidationReport,
  Validator,
} from "./types.js";

/** Runs every validator and aggregates the issues. */
export async function runValidators(
  validators: Validator[],
  changeSet: ChangeSet,
  repoRoot: string,
): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];
  for (const v of validators) {
    const found = await v.validate(changeSet, repoRoot);
    issues.push(...found);
  }
  return { passed: issues.length === 0, issues };
}

/** Rejects overlapping edits from different agents so nothing is silently lost. */
export const noConflictsValidator: Validator = {
  name: "no-conflicts",
  async validate(changeSet) {
    return changeSet.conflicts.map((p) => ({
      validator: "no-conflicts",
      message: `multiple agents edited "${p}" — resolve before applying`,
    }));
  },
};

/** Every non-delete change must actually carry file contents, and stay in-repo. */
export const wellFormedChangesValidator: Validator = {
  name: "well-formed-changes",
  async validate(changeSet, repoRoot) {
    const issues: ValidationIssue[] = [];
    for (const c of changeSet.changes) {
      if (c.op !== "delete" && (c.contents === undefined || c.contents === "")) {
        issues.push({
          validator: "well-formed-changes",
          message: `"${c.path}" is a ${c.op} but has no contents`,
        });
      }
      const resolved = path.resolve(repoRoot, c.path);
      if (resolved !== repoRoot && !resolved.startsWith(repoRoot + path.sep)) {
        issues.push({
          validator: "well-formed-changes",
          message: `"${c.path}" escapes the repository root`,
        });
      }
    }
    return issues;
  },
};

/**
 * Wraps a shell command as a validator. Runs it in `repoRoot`; a non-zero exit
 * fails validation with the captured output. Use for post-apply checks like
 * `npm run typecheck` or `npm test`.
 */
export function commandValidator(name: string, command: string): Validator {
  return {
    name,
    async validate(_changeSet, repoRoot) {
      const { code, output } = await runShell(command, repoRoot);
      if (code === 0) return [];
      return [
        {
          validator: name,
          message: `\`${command}\` exited ${code}\n${output.trim().slice(-2000)}`,
        },
      ];
    },
  };
}

function runShell(
  command: string,
  cwd: string,
): Promise<{ code: number; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, { cwd, shell: true });
    let output = "";
    child.stdout.on("data", (d) => (output += d.toString()));
    child.stderr.on("data", (d) => (output += d.toString()));
    child.on("close", (code) => resolve({ code: code ?? 1, output }));
    child.on("error", (err) => resolve({ code: 1, output: err.message }));
  });
}
