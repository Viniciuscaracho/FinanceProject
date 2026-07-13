/**
 * Applies a change set to disk with all-or-nothing semantics.
 *
 * `applyChangeSet` snapshots every file it is about to touch, writes the
 * changes, and returns a `rollback()` that restores the exact prior state
 * (including re-deleting files that were newly created). The orchestrator uses
 * this to undo changes when post-apply validation fails.
 */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ChangeSet } from "./types.js";

interface Snapshot {
  path: string;
  /** Prior contents, or null if the file did not exist. */
  previous: string | null;
}

export interface AppliedChanges {
  rollback(): Promise<void>;
}

async function readOrNull(file: string): Promise<string | null> {
  try {
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}

export async function applyChangeSet(
  changeSet: ChangeSet,
  repoRoot: string,
): Promise<AppliedChanges> {
  const snapshots: Snapshot[] = [];

  for (const change of changeSet.changes) {
    const abs = path.resolve(repoRoot, change.path);
    snapshots.push({ path: abs, previous: await readOrNull(abs) });

    if (change.op === "delete") {
      await rm(abs, { force: true });
    } else {
      await mkdir(path.dirname(abs), { recursive: true });
      await writeFile(abs, change.contents ?? "", "utf8");
    }
  }

  return {
    async rollback() {
      for (const snap of snapshots) {
        if (snap.previous === null) {
          await rm(snap.path, { force: true });
        } else {
          await mkdir(path.dirname(snap.path), { recursive: true });
          await writeFile(snap.path, snap.previous, "utf8");
        }
      }
    },
  };
}
