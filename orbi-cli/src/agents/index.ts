/** Agent registry: maps an agent name to a constructed instance. */

import type { LLMProvider } from "../llm/provider.js";
import type { AgentName } from "../core/types.js";
import type { BaseAgent } from "./base.js";
import { BackendAgent } from "./backend.js";
import { FrontendAgent } from "./frontend.js";
import { QAAgent } from "./qa.js";
import { DocsAgent } from "./docs.js";

export const ALL_AGENTS: AgentName[] = ["backend", "frontend", "qa", "docs"];

export function createAgent(name: AgentName, llm: LLMProvider): BaseAgent {
  switch (name) {
    case "backend":
      return new BackendAgent(llm);
    case "frontend":
      return new FrontendAgent(llm);
    case "qa":
      return new QAAgent(llm);
    case "docs":
      return new DocsAgent(llm);
  }
}
