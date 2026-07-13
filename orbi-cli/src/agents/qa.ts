import { BaseAgent } from "./base.js";
import type { AgentName } from "../core/types.js";

export class QAAgent extends BaseAgent {
  readonly name: AgentName = "qa";
}
