/**
 * Planning stage.
 *
 * Uses the LLM (with repo read tools) to decide which agents should work a task
 * and to write a shared brief that keeps them coherent. Falls back gracefully:
 * if planning fails, the orchestrator uses static routing and an empty brief.
 */

import { loadHarness } from "../harness/loader.js";
import { createRepoTools, type AgentTool } from "../llm/tools.js";
import type { FinalTool, LLMProvider } from "../llm/provider.js";
import { ALL_AGENTS } from "./index.js";
import type { AgentName, Plan, Task } from "../core/types.js";

const PLAN_TOOL: FinalTool = {
  name: "submit_plan",
  description: "Submit the execution plan: which agents run and a shared brief.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["agents", "brief"],
    properties: {
      agents: {
        type: "array",
        items: { type: "string", enum: [...ALL_AGENTS] },
        description: "Agents that have real work to do for this task.",
      },
      brief: {
        type: "string",
        description: "Shared context injected into every selected agent's prompt.",
      },
    },
  },
};

export class Planner {
  constructor(private readonly llm: LLMProvider) {}

  async plan(
    task: Task,
    memory?: string,
    mcpTools: AgentTool[] = [],
    onToolCall?: (label: string) => void,
  ): Promise<Plan> {
    const system = await loadHarness("planner");
    const prompt = [
      `Task kind: ${task.kind}`,
      `Task: ${task.description}`,
      memory ? `\nKnown conventions & lessons from past runs:\n${memory}\n` : "",
      "Inspect the repository, then submit a plan.",
    ].join("\n");

    const raw = await this.llm.runAgentLoop<Plan>({
      system,
      prompt,
      tools: [...createRepoTools(task.repoRoot), ...mcpTools],
      finalTool: PLAN_TOOL,
      traceLabel: "planner",
      onToolCall,
    });

    // Keep only known agent names; drop anything the model invented.
    const agents = (raw.agents ?? []).filter((a): a is AgentName =>
      (ALL_AGENTS as string[]).includes(a),
    );
    return { agents, brief: raw.brief ?? "" };
  }
}
