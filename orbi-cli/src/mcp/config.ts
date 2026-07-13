/**
 * MCP configuration, loaded from `.orbi/mcp.json` in the target repo.
 *
 * Example:
 * {
 *   "servers": {
 *     "git":        { "command": "uvx", "args": ["mcp-server-git", "--repository", "."] },
 *     "filesystem": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
 *                     "tools": ["read_file", "list_directory", "search_files"] }
 *   }
 * }
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

export interface McpServerConfig {
  /** Executable to launch the stdio MCP server. */
  command: string;
  args?: string[];
  env?: Record<string, string>;
  /** Skip this server without removing it from config. */
  disabled?: boolean;
  /**
   * Allowlist of tool names to expose from this server. Omit to expose all.
   * Restrict to read-only tools to keep agents in "explore, don't mutate" mode.
   */
  tools?: string[];
}

export interface McpConfig {
  servers: Record<string, McpServerConfig>;
}

/** Load `.orbi/mcp.json`, or null when it doesn't exist. Throws on malformed JSON. */
export async function loadMcpConfig(repoRoot: string): Promise<McpConfig | null> {
  const file = path.join(repoRoot, ".orbi", "mcp.json");
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    return null;
  }
  const parsed = JSON.parse(raw) as McpConfig;
  if (!parsed || typeof parsed !== "object" || !parsed.servers) {
    throw new Error(".orbi/mcp.json must have a top-level \"servers\" object");
  }
  return parsed;
}
