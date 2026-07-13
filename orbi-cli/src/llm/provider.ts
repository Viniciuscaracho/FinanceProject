/**
 * LLM provider abstraction.
 *
 * Everything the agents need from the model goes through `LLMProvider`, so the
 * rest of the codebase never imports the Anthropic SDK directly. Swapping in a
 * different backend (a mock for tests, another vendor) means implementing this
 * one interface.
 */

import Anthropic from "@anthropic-ai/sdk";

export interface CompletionRequest {
  /** The agent's system prompt (its loaded harness). */
  system: string;
  /** The user turn — task description plus any repository context. */
  prompt: string;
  /**
   * When provided, the model is constrained to emit JSON matching this schema
   * and the raw JSON text is returned. Callers parse it.
   */
  jsonSchema?: Record<string, unknown>;
}

export interface LLMProvider {
  /** Free-text completion. */
  complete(req: CompletionRequest): Promise<string>;
  /**
   * Structured completion: returns the model's JSON text validated against
   * `schema`. Throws if the model produced no usable JSON.
   */
  completeJSON<T>(req: CompletionRequest & { jsonSchema: Record<string, unknown> }): Promise<T>;
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

export class AnthropicProvider implements LLMProvider {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly effort: NonNullable<AnthropicProviderOptions["effort"]>;
  private readonly maxTokens: number;

  constructor(opts: AnthropicProviderOptions = {}) {
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
    const message = await this.send(req);
    return this.extractText(message);
  }

  async completeJSON<T>(
    req: CompletionRequest & { jsonSchema: Record<string, unknown> },
  ): Promise<T> {
    const message = await this.send(req);
    const text = this.extractText(message).trim();
    if (!text) {
      throw new Error("model returned no content for a structured request");
    }
    try {
      return JSON.parse(text) as T;
    } catch (err) {
      throw new Error(
        `model output was not valid JSON: ${(err as Error).message}\n---\n${text.slice(0, 500)}`,
      );
    }
  }

  private async send(req: CompletionRequest): Promise<Anthropic.Message> {
    const outputConfig: Record<string, unknown> = { effort: this.effort };
    if (req.jsonSchema) {
      outputConfig.format = { type: "json_schema", schema: req.jsonSchema };
    }

    // `output_config` and adaptive `thinking` are newer than some pinned SDK
    // type definitions, so the request body is assembled untyped and cast once
    // here. Stream so a large max_tokens never trips the non-streaming HTTP
    // timeout; get the accumulated message back with finalMessage().
    const params = {
      model: this.model,
      max_tokens: this.maxTokens,
      thinking: { type: "adaptive" },
      output_config: outputConfig,
      system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: req.prompt }],
    } as unknown as Anthropic.MessageStreamParams;

    const stream = this.client.messages.stream(params);
    return stream.finalMessage();
  }

  private extractText(message: Anthropic.Message): string {
    return message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  }
}
