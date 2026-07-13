/**
 * `orbi memory [--clear]` — inspect or reset the long-term memory the agents
 * accumulate in `.orbi/memory.md`.
 */

import path from "node:path";
import { MemoryStore } from "../core/memory.js";
import { logger } from "../core/logger.js";

export interface MemoryCliOptions {
  repo?: string;
  clear?: boolean;
}

export async function memoryCommand(options: MemoryCliOptions): Promise<void> {
  const repoRoot = path.resolve(options.repo ?? process.cwd());
  const store = new MemoryStore(repoRoot);
  await store.load();

  if (options.clear) {
    await store.clear();
    logger.success("Cleared .orbi/memory.md");
    return;
  }

  const entries = store.all();
  if (entries.length === 0) {
    logger.info("No memories yet. They accumulate as you run tasks.");
    return;
  }

  logger.step(`Memory (${entries.length} entries)`);
  const byScope = new Map<string, string[]>();
  for (const e of entries) {
    const list = byScope.get(e.scope) ?? [];
    list.push(e.text);
    byScope.set(e.scope, list);
  }
  for (const [scope, texts] of byScope) {
    logger.info(`  [${scope}]`);
    for (const t of texts) logger.dim(`    · ${t}`);
  }
}
