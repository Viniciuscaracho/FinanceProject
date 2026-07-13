import { BaseAgent } from "./base.js";
import type { AgentName } from "../core/types.js";

export class BackendAgent extends BaseAgent {
  readonly name: AgentName = "backend";
}
