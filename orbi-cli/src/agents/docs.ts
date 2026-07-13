import { BaseAgent } from "./base.js";
import type { AgentName } from "../core/types.js";

export class DocsAgent extends BaseAgent {
  readonly name: AgentName = "docs";
}
