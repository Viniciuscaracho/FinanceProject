/**
 * Base class shared by every specialized agent.
 *
 * An agent is a thin wrapper: it loads its harness (system prompt), builds a
 * user prompt from the task plus repository context, asks the LLM for a
 * structured result, and normalizes that into an `AgentResult`. Subclasses only
 * declare their `name`; specialization lives entirely in the harness markdown.
 */

import { loadHarness } from "../harness/loader.js";
import type { LLMProvider } from "../llm/provider.js";
import type { AgentName, AgentResult, FileChange, Task } from "../core/types.js";

/** JSON schema the model must satisfy — mirrors `AgentResult` (minus `agent`). */
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
  },
};

interface RawAgentOutput {
  summary: string;
  changes: FileChange[];
  notes: string[];
}

export abstract class BaseAgent {
  abstract readonly name: AgentName;

  constructor(protected readonly llm: LLMProvider) {}

  /** Run this agent against a task with pre-gathered repository context. */
  async run(task: Task, context: string): Promise<AgentResult> {
    let system: string;
    try {
      system = await loadHarness(this.name);
    } catch (err) {
      return this.failure((err as Error).message);
    }

    const prompt = this.buildPrompt(task, context);

    try {
      const raw = await this.llm.completeJSON<RawAgentOutput>({
        system,
        prompt,
        jsonSchema: RESULT_SCHEMA,
      });
      return {
        agent: this.name,
        summary: raw.summary ?? "",
        changes: (raw.changes ?? []).map((c) => ({ ...c, path: normalize(c.path) })),
        notes: raw.notes ?? [],
      };
    } catch (err) {
      return this.failure((err as Error).message);
    }
  }

  protected buildPrompt(task: Task, context: string): string {
    const reviewOnly =
      task.kind === "review"
        ? "\nThis is a REVIEW task: do not propose file changes; report findings as notes.\n"
        : "";
    return [
      `Task kind: ${task.kind}`,
      `Task: ${task.description}`,
      reviewOnly,
      "Repository context:",
      context || "(no context provided)",
    ].join("\n");
  }

  private failure(message: string): AgentResult {
    return { agent: this.name, summary: "", changes: [], notes: [], error: message };
  }
}

function normalize(p: string): string {
  return p.replace(/^\.\//, "").replace(/^\/+/, "");
}
