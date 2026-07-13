/**
 * Long-term memory: a human-readable `.orbi/memory.md` in the target repo that
 * persists conventions and lessons across runs. Agents read the relevant slice
 * before working and propose new lessons (via their `memories` output), which
 * the orchestrator persists once at the end of a run — deduplicated and capped.
 *
 * Short-term memory (within a single run) is threaded by the orchestrator: the
 * plan brief and agent notes flow into the reviewer's prompt.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface MemoryEntry {
  /** "repo" for repo-wide facts, or a role name (backend, frontend, …). */
  scope: string;
  text: string;
}

const MEMORY_DIR = ".orbi";
const MEMORY_FILE = "memory.md";
const MAX_ENTRIES = 200;

const LINE_RE = /^-\s*\[([^\]]+)\]\s*(.+)$/;

export class MemoryStore {
  private readonly file: string;
  private entries: MemoryEntry[] = [];
  private loaded = false;

  constructor(private readonly repoRoot: string) {
    this.file = path.join(repoRoot, MEMORY_DIR, MEMORY_FILE);
  }

  async load(): Promise<void> {
    try {
      const raw = await readFile(this.file, "utf8");
      this.entries = raw
        .split("\n")
        .map((line) => LINE_RE.exec(line.trim()))
        .filter((m): m is RegExpExecArray => m !== null)
        .map((m) => ({ scope: m[1].trim(), text: m[2].trim() }));
    } catch {
      this.entries = [];
    }
    this.loaded = true;
  }

  /** Formatted memory for a role: repo-wide entries plus that role's own. */
  forScope(scope: string): string {
    const relevant = this.entries.filter((e) => e.scope === "repo" || e.scope === scope);
    if (relevant.length === 0) return "";
    return relevant.map((e) => `- [${e.scope}] ${e.text}`).join("\n");
  }

  /** Persist new lessons: dedupe (by scope+text), cap, and rewrite the file. */
  async remember(newEntries: MemoryEntry[]): Promise<number> {
    if (!this.loaded) await this.load();
    const seen = new Set(this.entries.map(key));
    let added = 0;
    for (const entry of newEntries) {
      const text = entry.text.trim();
      if (!text) continue;
      const e = { scope: (entry.scope || "repo").trim(), text };
      if (seen.has(key(e))) continue;
      seen.add(key(e));
      this.entries.push(e);
      added += 1;
    }
    if (added === 0) return 0;

    // Keep the most recent entries when over the cap.
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(this.entries.length - MAX_ENTRIES);
    }
    await this.write();
    return added;
  }

  async clear(): Promise<void> {
    this.entries = [];
    await this.write();
  }

  all(): MemoryEntry[] {
    return [...this.entries];
  }

  private async write(): Promise<void> {
    const header =
      "# orbi memory\n\nLessons and conventions learned across runs. " +
      "Edit freely — one `- [scope] text` entry per line.\n\n";
    const body = this.entries.map((e) => `- [${e.scope}] ${e.text}`).join("\n");
    await mkdir(path.dirname(this.file), { recursive: true });
    await writeFile(this.file, header + body + "\n", "utf8");
  }
}

function key(e: MemoryEntry): string {
  return `${e.scope}::${e.text.toLowerCase()}`;
}
