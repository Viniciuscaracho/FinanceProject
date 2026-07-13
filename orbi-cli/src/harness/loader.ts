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

const here = path.dirname(fileURLToPath(import.meta.url));
const HARNESS_ROOT = here; // harness files live alongside this loader

async function readIfPresent(file: string): Promise<string> {
  try {
    return (await readFile(file, "utf8")).trim();
  } catch {
    return "";
  }
}

/** Reads and composes the full system prompt for an agent. */
export async function loadHarness(agent: AgentName): Promise<string> {
  const shared = await readIfPresent(path.join(HARNESS_ROOT, "shared", "guidelines.md"));
  const specific = await readIfPresent(path.join(HARNESS_ROOT, agent, "system.md"));

  if (!specific) {
    throw new Error(
      `no harness found for agent "${agent}" (expected harness/${agent}/system.md)`,
    );
  }

  return [shared, specific].filter(Boolean).join("\n\n---\n\n");
}
