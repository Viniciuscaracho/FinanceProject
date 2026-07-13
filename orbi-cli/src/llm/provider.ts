/**
 * LLM provider abstraction.
 *
 * Everything the agents need from the model goes through `LLMProvider`, so the
 * rest of the codebase never imports the Anthropic SDK directly. Swapping in a
 * different backend (a mock for tests, another vendor) means implementing this
 * one interface.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { AgentTool } from "./tools.js";
import { estimateCost, type Tracer } from "../core/telemetry.js";

export interface CompletionRequest {
  /** System prompt (the agent's loaded harness, or a planner prompt). */
  system: string;
  /** The user turn. */
  prompt: string;
  /** Scope label for the tracer (e.g. an agent name). */
  traceLabel?: string;
}

/** The tool the model calls to end the loop; its input is the structured result. */
export interface FinalTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolLoopRequest extends CompletionRequest {
  /** Read tools the model may call while exploring. */
  tools: AgentTool[];
  /** Calling this tool ends the loop; its input is returned to the caller. */
  finalTool: FinalTool;
  /** Safety cap on tool-use iterations. */
  maxSteps?: number;
  /** Optional hook fired on each tool call, for logging/observability. */
  onToolCall?: (label: string) => void;
}

export interface LLMProvider {
  /** Free-text completion (used by the planner). */
  complete(req: CompletionRequest): Promise<string>;
  /**
   * Run an agentic loop: the model may call the read tools to explore, then
   * calls `finalTool` to submit its structured answer. Returns that input.
   */
  runAgentLoop<T>(req: ToolLoopRequest): Promise<T>;
}

export interface AnthropicProviderOptions {
  /** Defaults to ORBI_MODEL or claude-opus-4-8. */
  model?: string;
  /** Reasoning effort. Defaults to ORBI_EFFORT or "high". */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  /** Streaming upper bound on output tokens. */
  maxTokens?: number;
}

const DEFAULT_MODEL = "claude-opus-4-8";
const DEFAULT_EFFORT = "high" as const;
const DEFAULT_MAX_TOKENS = 32000;
const DEFAULT_MAX_STEPS = 12;

export class AnthropicProvider implements LLMProvider {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly effort: NonNullable<AnthropicProviderOptions["effort"]>;
  private readonly maxTokens: number;

  constructor(
    opts: AnthropicProviderOptions = {},
    private readonly tracer?: Tracer,
  ) {
    // The SDK resolves credentials from ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN,
    // or an `ant auth login` profile — no key needs to be passed here.
    this.client = new Anthropic();
    this.model = opts.model ?? process.env.ORBI_MODEL ?? DEFAULT_MODEL;
    this.effort =
      opts.effort ??
      (process.env.ORBI_EFFORT as AnthropicProviderOptions["effort"]) ??
      DEFAULT_EFFORT;
    this.maxTokens = opts.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  async complete(req: CompletionRequest): Promise<string> {
    const message = await this.stream(
      req.system,
      [{ role: "user", content: req.prompt }],
      undefined,
      req.traceLabel ?? "complete",
    );
    return this.extractText(message);
  }

  async runAgentLoop<T>(req: ToolLoopRequest): Promise<T> {
    const toolsByName = new Map(req.tools.map((t) => [t.name, t]));
    const toolDefs = [
      ...req.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      })),
      {
        name: req.finalTool.name,
        description: req.finalTool.description,
        input_schema: req.finalTool.inputSchema,
      },
    ];

    const messages: Anthropic.MessageParam[] = [{ role: "user", content: req.prompt }];
    const maxSteps = req.maxSteps ?? DEFAULT_MAX_STEPS;
    const label = req.traceLabel ?? req.finalTool.name;

    for (let step = 0; step < maxSteps; step++) {
      const message = await this.stream(req.system, messages, toolDefs, label);

      const toolUses = message.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      // The model finished exploring and submitted its structured answer.
      const final = toolUses.find((b) => b.name === req.finalTool.name);
      if (final) {
        return final.input as T;
      }

      // No tool calls at all — nothing more to do; surface the text as an error.
      if (toolUses.length === 0) {
        throw new Error(
          `agent ended without calling ${req.finalTool.name}: ${this.extractText(message).slice(0, 300)}`,
        );
      }

      // Execute every requested read tool and feed the results back.
      messages.push({ role: "assistant", content: message.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const use of toolUses) {
        const tool = toolsByName.get(use.name);
        const input = (use.input ?? {}) as Record<string, unknown>;
        req.onToolCall?.(tool ? tool.label(input) : `${use.name}(?)`);
        let content: string;
        let isError = false;
        try {
          content = tool ? await tool.execute(input) : `unknown tool: ${use.name}`;
          isError = !tool;
        } catch (err) {
          content = (err as Error).message;
          isError = true;
        }
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content,
          is_error: isError,
        });
      }
      messages.push({ role: "user", content: results });
    }

    throw new Error(`agent exceeded ${maxSteps} steps without submitting a result`);
  }

  private async stream(
    system: string,
    messages: Anthropic.MessageParam[],
    tools: unknown[] | undefined,
    label: string,
  ): Promise<Anthropic.Message> {
    // `output_config`, adaptive `thinking`, and tool params are newer than some
    // pinned SDK type definitions, so the request body is assembled untyped and
    // cast once here. Stream so a large max_tokens never trips the non-streaming
    // HTTP timeout; get the accumulated message back with finalMessage().
    const params = {
      model: this.model,
      max_tokens: this.maxTokens,
      thinking: { type: "adaptive" },
      output_config: { effort: this.effort },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages,
      ...(tools ? { tools } : {}),
    } as unknown as Anthropic.MessageStreamParams;

    const started = Date.now();
    const message = await this.client.messages.stream(params).finalMessage();
    this.trace(label, message, Date.now() - started);
    return message;
  }

  private trace(label: string, message: Anthropic.Message, ms: number): void {
    if (!this.tracer) return;
    const u = message.usage as unknown as {
      input_tokens?: number;
      output_tokens?: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
    const usage = {
      inputTokens: u.input_tokens ?? 0,
      outputTokens: u.output_tokens ?? 0,
      cacheReadTokens: u.cache_read_input_tokens ?? 0,
      cacheWriteTokens: u.cache_creation_input_tokens ?? 0,
    };
    this.tracer.record({
      label,
      ms,
      ...usage,
      costUSD: estimateCost(this.model, usage),
    });
  }

  private extractText(message: Anthropic.Message): string {
    return message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  }
}
