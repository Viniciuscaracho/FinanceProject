import { BaseAgent } from "./base.js";
import type { AgentName } from "../core/types.js";

export class FrontendAgent extends BaseAgent {
  readonly name: AgentName = "frontend";
}
