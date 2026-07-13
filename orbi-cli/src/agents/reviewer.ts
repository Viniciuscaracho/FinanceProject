/**
 * Adversarial review stage.
 *
 * Given the consolidated change set, the reviewer inspects the actual repository
 * with read tools and tries to refute each change. Changes it rejects are
 * dropped before validation and apply. This is the "verify before accept" gate.
 */

import { loadHarness } from "../harness/loader.js";
import { createRepoTools } from "../llm/tools.js";
import type { FinalTool, LLMProvider } from "../llm/provider.js";
import type { ChangeSet, Review, Task } from "../core/types.js";

const REVIEW_TOOL: FinalTool = {
  name: "submit_review",
  description: "Submit one verdict per proposed change, plus a one-line summary.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["verdicts", "summary"],
    properties: {
      verdicts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["path", "verdict", "reason"],
          properties: {
            path: { type: "string", description: "The change's file path." },
            verdict: { type: "string", enum: ["accept", "reject"] },
            reason: {
              type: "string",
              description: "For reject, the specific concrete defect.",
            },
          },
        },
      },
      summary: { type: "string" },
    },
  },
};

export class Reviewer {
  constructor(private readonly llm: LLMProvider) {}

  async review(
    task: Task,
    changeSet: ChangeSet,
    onToolCall?: (label: string) => void,
  ): Promise<Review> {
    const system = await loadHarness("reviewer");
    const prompt = [
      `Task: ${task.description}`,
      "",
      "Proposed changes to scrutinize:",
      serializeChanges(changeSet),
      "",
      "Inspect the current repository and return one verdict per change.",
    ].join("\n");

    const raw = await this.llm.runAgentLoop<Review>({
      system,
      prompt,
      tools: createRepoTools(task.repoRoot),
      finalTool: REVIEW_TOOL,
      traceLabel: "reviewer",
      onToolCall,
    });

    return { verdicts: raw.verdicts ?? [], summary: raw.summary ?? "" };
  }
}

function serializeChanges(changeSet: ChangeSet): string {
  return changeSet.changes
    .map((c) => {
      const body =
        c.op === "delete"
          ? "(deletion)"
          : `\n\`\`\`\n${(c.contents ?? "").slice(0, 6000)}\n\`\`\``;
      return `### ${c.op} ${c.path}\nRationale: ${c.rationale}${body}`;
    })
    .join("\n\n");
}
