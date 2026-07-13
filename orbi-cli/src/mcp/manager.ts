/**
 * MCP manager: connects to the configured MCP servers, lists their tools, and
 * exposes each one as an `AgentTool` so it plugs straight into the same agentic
 * loop that runs the built-in read tools. This is how orbi standardizes tool
 * access — the agents don't know or care whether a tool is built in or provided
 * by an external MCP server.
 *
 * Connections are opened once per run and shared across the parallel agents
 * (the MCP client multiplexes JSON-RPC by id, so concurrent calls are safe),
 * then closed via `dispose()`.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { AgentTool } from "../llm/tools.js";
import type { McpConfig, McpServerConfig } from "./config.js";

export class McpManager {
  private readonly clients: Client[] = [];

  constructor(
    private readonly repoRoot: string,
    private readonly config: McpConfig,
  ) {}

  /**
   * Connect every enabled server and return all of their tools as AgentTools.
   * A server that fails to start is logged and skipped — one broken server
   * never aborts the run.
   */
  async connect(onLog?: (msg: string) => void): Promise<AgentTool[]> {
    const tools: AgentTool[] = [];
    for (const [name, cfg] of Object.entries(this.config.servers)) {
      if (cfg.disabled) continue;
      try {
        const serverTools = await this.connectServer(name, cfg);
        tools.push(...serverTools);
        onLog?.(`connected "${name}" (${serverTools.length} tool(s))`);
      } catch (err) {
        onLog?.(`server "${name}" failed to start: ${(err as Error).message}`);
      }
    }
    return tools;
  }

  private async connectServer(name: string, cfg: McpServerConfig): Promise<AgentTool[]> {
    const transport = new StdioClientTransport({
      command: cfg.command,
      args: cfg.args ?? [],
      cwd: this.repoRoot,
      env: cfg.env ? { ...cleanEnv(process.env), ...cfg.env } : undefined,
    });
    const client = new Client({ name: "orbi-cli", version: "0.1.0" });
    await client.connect(transport);
    this.clients.push(client);

    const { tools } = await client.listTools();
    const allow = cfg.tools ? new Set(cfg.tools) : null;

    return tools
      .filter((t) => !allow || allow.has(t.name))
      .map((t) => this.wrap(client, name, t));
  }

  private wrap(
    client: Client,
    server: string,
    tool: { name: string; description?: string; inputSchema: unknown },
  ): AgentTool {
    const exposedName = sanitize(`${server}__${tool.name}`);
    return {
      name: exposedName,
      description: `[mcp:${server}] ${tool.description ?? tool.name}`,
      inputSchema: (tool.inputSchema as Record<string, unknown>) ?? {
        type: "object",
        properties: {},
      },
      label: (input) => `${exposedName}(${summarize(input)})`,
      async execute(input) {
        const res = (await client.callTool({
          name: tool.name,
          arguments: input,
        })) as { content?: Array<{ type: string; text?: string }>; isError?: boolean };
        const text = (res.content ?? [])
          .map((part) => (part.type === "text" ? (part.text ?? "") : `[${part.type}]`))
          .join("\n");
        if (res.isError) return `Error: ${text || "tool reported an error"}`;
        return text || "(empty result)";
      },
    };
  }

  async dispose(): Promise<void> {
    await Promise.allSettled(this.clients.map((c) => c.close()));
    this.clients.length = 0;
  }
}

/** Drop undefined values so the env is a plain Record<string, string>. */
function cleanEnv(env: NodeJS.ProcessEnv): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/** Anthropic tool names allow [a-zA-Z0-9_-], up to 64 chars. */
function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
}

function summarize(input: Record<string, unknown>): string {
  const keys = Object.keys(input);
  if (keys.length === 0) return "";
  const first = input[keys[0]];
  return typeof first === "string" ? first.slice(0, 40) : keys.join(",");
}
