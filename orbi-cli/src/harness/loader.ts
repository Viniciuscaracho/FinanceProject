/**
 * Loads the harness (system prompt) for a given agent.
 *
 * A harness is composed of two markdown files, concatenated in order:
 *   1. harness/shared/guidelines.md   — rules every agent obeys
 *   2. harness/<agent>/system.md      — the agent's specialization
 *
 * Harness files are plain markdown so they can be edited without touching code.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AgentName } from "../core/types.js";

/** Roles that have a harness on disk: the four agents plus planner/reviewer. */
export type HarnessName = AgentName | "planner" | "reviewer";

const here = path.dirname(fileURLToPath(import.meta.url));
const HARNESS_ROOT = here; // harness files live alongside this loader

async function readIfPresent(file: string): Promise<string> {
  try {
    return (await readFile(file, "utf8")).trim();
  } catch {
    return "";
  }
}

/**
 * Reads and composes the full system prompt for a role. The shared guidelines
 * are prepended for the four specialized agents; the planner and reviewer are
 * orchestration roles and use their own standalone harness.
 */
export async function loadHarness(name: HarnessName): Promise<string> {
  const specific = await readIfPresent(path.join(HARNESS_ROOT, name, "system.md"));
  if (!specific) {
    throw new Error(
      `no harness found for "${name}" (expected harness/${name}/system.md)`,
    );
  }

  const isAgent = name !== "planner" && name !== "reviewer";
  if (!isAgent) return specific;

  const shared = await readIfPresent(path.join(HARNESS_ROOT, "shared", "guidelines.md"));
  return [shared, specific].filter(Boolean).join("\n\n---\n\n");
}
