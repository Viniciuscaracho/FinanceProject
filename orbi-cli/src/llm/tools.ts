/**
 * Repository read tools handed to agents so they can explore the codebase
 * before proposing changes, instead of receiving a large upfront context dump.
 *
 * Every tool is sandboxed to `repoRoot`: a model-supplied path is resolved and
 * rejected if it escapes the repository. Tools are read-only by design — agents
 * observe through them and propose changes separately.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

/** A read tool the model can call during the exploration loop. */
export interface AgentTool {
  name: string;
  description: string;
  /** JSON Schema for the tool input. */
  inputSchema: Record<string, unknown>;
  /** Runs the tool and returns a string result for the model. */
  execute(input: Record<string, unknown>): Promise<string>;
  /** Short human label for logging, e.g. `read_file(src/app.ts)`. */
  label(input: Record<string, unknown>): string;
}

const MAX_READ_LINES = 400;
const MAX_LIST_ENTRIES = 200;
const MAX_GREP_LINES = 100;

/** Resolve a repo-relative path and confine it to the repository root. */
function safeResolve(repoRoot: string, rel: string): string {
  const resolved = path.resolve(repoRoot, rel ?? ".");
  if (resolved !== repoRoot && !resolved.startsWith(repoRoot + path.sep)) {
    throw new Error(`path "${rel}" escapes the repository root`);
  }
  return resolved;
}

function listDir(repoRoot: string): AgentTool {
  return {
    name: "list_dir",
    description:
      "List the entries of a directory in the repository. Directories end with '/'. Use this to discover where relevant files live.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["path"],
      properties: {
        path: { type: "string", description: "Repo-relative directory (use '.' for the root)." },
      },
    },
    label: (input) => `list_dir(${input.path})`,
    async execute(input) {
      const rel = String(input.path ?? ".");
      const dir = safeResolve(repoRoot, rel);
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch (err) {
        return `Error listing "${rel}": ${(err as Error).message}`;
      }
      const lines = entries
        .filter((e) => e.name !== ".git" && e.name !== "node_modules")
        .slice(0, MAX_LIST_ENTRIES)
        .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
        .sort();
      const suffix =
        entries.length > MAX_LIST_ENTRIES ? `\n… ${entries.length - MAX_LIST_ENTRIES} more` : "";
      return lines.length ? lines.join("\n") + suffix : "(empty)";
    },
  };
}

function readFileTool(repoRoot: string): AgentTool {
  return {
    name: "read_file",
    description:
      "Read a file from the repository, optionally a line range. Output is line-numbered. Large files are truncated — request a range to see more.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["path"],
      properties: {
        path: { type: "string", description: "Repo-relative file path." },
        start_line: { type: "integer", description: "1-based first line (optional)." },
        end_line: { type: "integer", description: "1-based last line (optional)." },
      },
    },
    label: (input) => `read_file(${input.path})`,
    async execute(input) {
      const rel = String(input.path ?? "");
      const file = safeResolve(repoRoot, rel);
      try {
        if ((await stat(file)).isDirectory()) {
          return `"${rel}" is a directory — use list_dir.`;
        }
      } catch (err) {
        return `Error reading "${rel}": ${(err as Error).message}`;
      }
      const content = await readFile(file, "utf8");
      const allLines = content.split("\n");
      const start = Math.max(1, Number(input.start_line ?? 1));
      const end = Math.min(
        allLines.length,
        Number(input.end_line ?? start + MAX_READ_LINES - 1),
      );
      const slice = allLines.slice(start - 1, end);
      const truncated = end - start + 1 >= MAX_READ_LINES && end < allLines.length;
      const numbered = slice.map((l, i) => `${start + i}\t${l}`).join("\n");
      const note = truncated
        ? `\n… truncated at line ${end} of ${allLines.length}; request a later range to continue.`
        : "";
      return numbered + note;
    },
  };
}

function grepTool(repoRoot: string): AgentTool {
  return {
    name: "grep",
    description:
      "Search tracked files for a regular expression (git grep). Returns matching lines as path:line:text. Optionally restrict to a pathspec.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["pattern"],
      properties: {
        pattern: { type: "string", description: "Regular expression to search for." },
        pathspec: { type: "string", description: "Optional path/glob to restrict the search." },
      },
    },
    label: (input) => `grep(${input.pattern})`,
    async execute(input) {
      const pattern = String(input.pattern ?? "");
      if (!pattern) return "Error: empty pattern.";
      const pathspec = input.pathspec ? String(input.pathspec) : ".";
      // Args are passed directly to git (shell:false) — no shell injection.
      const res = spawnSync(
        "git",
        ["grep", "-n", "-I", "-E", "-e", pattern, "--", pathspec],
        { cwd: repoRoot, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
      );
      if (res.status === 1) return "(no matches)";
      if (res.status !== 0) {
        return `Error running grep: ${res.stderr?.trim() || "unknown error"}`;
      }
      const lines = res.stdout.split("\n").filter(Boolean);
      const shown = lines.slice(0, MAX_GREP_LINES).join("\n");
      const suffix =
        lines.length > MAX_GREP_LINES ? `\n… ${lines.length - MAX_GREP_LINES} more matches` : "";
      return shown + suffix;
    },
  };
}

/** Build the read-only tool set bound to a repository. */
export function createRepoTools(repoRoot: string): AgentTool[] {
  return [listDir(repoRoot), readFileTool(repoRoot), grepTool(repoRoot)];
}
