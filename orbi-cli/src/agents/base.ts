/**
 * Base class shared by every specialized agent.
 *
 * An agent loads its harness (system prompt), then runs an agentic loop: it may
 * call read tools (list_dir, read_file, grep) to explore the repository, and
 * finally calls `propose_changes` to submit a structured `AgentResult`. Nothing
 * is dumped into the prompt upfront — the agent pulls the context it needs.
 * Subclasses only declare their `name`; specialization lives in the harness.
 */

import { loadHarness } from "../harness/loader.js";
import { createRepoTools, type AgentTool } from "../llm/tools.js";
import type { FinalTool, LLMProvider } from "../llm/provider.js";
import type { AgentName, AgentResult, FileChange, Task } from "../core/types.js";

/** JSON schema for the `propose_changes` final tool — mirrors `AgentResult`. */
const RESULT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "changes", "notes"],
  properties: {
    summary: { type: "string", description: "One-paragraph summary of the work." },
    changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["path", "op", "rationale"],
        properties: {
          path: { type: "string", description: "Repo-relative file path." },
          op: { type: "string", enum: ["create", "modify", "delete"] },
          contents: {
            type: "string",
            description: "Full new file contents (omit for delete).",
          },
          rationale: { type: "string" },
        },
      },
    },
    notes: { type: "array", items: { type: "string" } },
    memories: {
      type: "array",
      items: { type: "string" },
      description:
        "Durable lessons or conventions worth remembering across runs (e.g. 'this repo uses RSpec, not Minitest'). Omit if nothing generalizable was learned.",
    },
  },
};

const FINAL_TOOL: FinalTool = {
  name: "propose_changes",
  description:
    "Submit your final result. Call this once you have explored enough and decided on the changes (or that none are needed). In review mode, leave `changes` empty and put findings in `notes`.",
  inputSchema: RESULT_SCHEMA,
};

interface RawAgentOutput {
  summary?: string;
  changes?: FileChange[];
  notes?: string[];
  memories?: string[];
}

export abstract class BaseAgent {
  abstract readonly name: AgentName;

  constructor(protected readonly llm: LLMProvider) {}

  /**
   * Run this agent against a task.
   * @param opts.brief shared context from the planning stage.
   * @param opts.onToolCall observability hook fired for each read-tool call.
   */
  async run(
    task: Task,
    opts: {
      brief?: string;
      memory?: string;
      mcpTools?: AgentTool[];
      onToolCall?: (label: string) => void;
    } = {},
  ): Promise<AgentResult> {
    let system: string;
    try {
      system = await loadHarness(this.name);
    } catch (err) {
      return this.failure((err as Error).message);
    }

    try {
      const raw = await this.llm.runAgentLoop<RawAgentOutput>({
        system,
        prompt: this.buildPrompt(task, opts.brief, opts.memory),
        tools: [...createRepoTools(task.repoRoot), ...(opts.mcpTools ?? [])],
        finalTool: FINAL_TOOL,
        traceLabel: this.name,
        onToolCall: opts.onToolCall,
      });
      return {
        agent: this.name,
        summary: raw.summary ?? "",
        changes: (raw.changes ?? []).map((c) => ({ ...c, path: normalize(c.path) })),
        notes: raw.notes ?? [],
        memories: raw.memories ?? [],
      };
    } catch (err) {
      return this.failure((err as Error).message);
    }
  }

  protected buildPrompt(task: Task, brief?: string, memory?: string): string {
    const reviewOnly =
      task.kind === "review"
        ? "\nThis is a REVIEW task: do not propose file changes; report findings as notes.\n"
        : "";
    const sharedBrief = brief ? `\nShared plan brief:\n${brief}\n` : "";
    const knownMemory = memory
      ? `\nKnown conventions & lessons from past runs (trust these):\n${memory}\n`
      : "";
    return [
      `Task kind: ${task.kind}`,
      `Task: ${task.description}`,
      sharedBrief,
      knownMemory,
      reviewOnly,
      "Explore the repository with the read tools (list_dir, read_file, grep) to",
      "ground your work in the actual code, then call propose_changes.",
      "If you learn something durable about this repo, add it to `memories`.",
    ].join("\n");
  }

  private failure(message: string): AgentResult {
    return { agent: this.name, summary: "", changes: [], notes: [], memories: [], error: message };
  }
}

function normalize(p: string): string {
  return p.replace(/^\.\//, "").replace(/^\/+/, "");
}
