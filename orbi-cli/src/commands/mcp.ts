/**
 * `orbi mcp` — connect to the servers in `.orbi/mcp.json` and list the tools
 * each one exposes. Useful for confirming a server starts and to see the tool
 * names the agents will be offered.
 */

import path from "node:path";
import { loadMcpConfig } from "../mcp/config.js";
import { McpManager } from "../mcp/manager.js";
import { logger } from "../core/logger.js";

export interface McpCliOptions {
  repo?: string;
}

export async function mcpCommand(options: McpCliOptions): Promise<void> {
  const repoRoot = path.resolve(options.repo ?? process.cwd());

  let config;
  try {
    config = await loadMcpConfig(repoRoot);
  } catch (err) {
    logger.error((err as Error).message);
    process.exitCode = 1;
    return;
  }
  if (!config) {
    logger.info("No .orbi/mcp.json found. Create one to give agents MCP tools.");
    return;
  }

  const manager = new McpManager(repoRoot, config);
  logger.step("Connecting MCP servers…");
  try {
    const tools = await manager.connect((msg) => logger.dim(`  ${msg}`));
    logger.info("");
    if (tools.length === 0) {
      logger.warn("No tools available (servers failed to start or exposed none).");
      return;
    }
    logger.step(`Available MCP tools (${tools.length})`);
    for (const t of tools) {
      logger.info(`  ${t.name}`);
      logger.dim(`    ${t.description}`);
    }
  } finally {
    await manager.dispose();
  }
}
