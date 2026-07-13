/**
 * Shared domain types for the orbi-cli orchestrator.
 *
 * The flow is: a `Task` is handed to the Orchestrator, which fans out to one or
 * more `Agent`s. Each agent returns an `AgentResult` containing a set of
 * proposed `FileChange`s. The orchestrator consolidates those into a single
 * `ChangeSet`, runs `Validator`s against it, and only then accepts the changes.
 */

export type AgentName = "backend" | "frontend" | "qa" | "docs";

export type CommandKind = "feature" | "fix" | "review";

/** A unit of work handed to the orchestrator. */
export interface Task {
  kind: CommandKind;
  /** Free-text description of what the user wants. */
  description: string;
  /** Absolute path of the repository the agents operate on. */
  repoRoot: string;
  /** Agents explicitly requested on the CLI; empty means "let the router decide". */
  requestedAgents: AgentName[];
  /** When false, the orchestrator only proposes changes and never writes to disk. */
  apply: boolean;
}

/** A single file the agent wants to create, modify, or delete. */
export interface FileChange {
  /** Repo-relative path. */
  path: string;
  op: "create" | "modify" | "delete";
  /** Full new contents for create/modify. Omitted for delete. */
  contents?: string;
  /** One-line explanation of why this change is needed. */
  rationale: string;
}

/** What a single agent produced for a task. */
export interface AgentResult {
  agent: AgentName;
  /** Short natural-language summary of the work. */
  summary: string;
  changes: FileChange[];
  /** Non-fatal notes, open questions, or follow-ups the agent surfaced. */
  notes: string[];
  /** Durable lessons/conventions worth remembering across runs. */
  memories: string[];
  /** Populated when the agent failed to run or returned unusable output. */
  error?: string;
}

/** The merged, deduplicated set of changes across all agents. */
export interface ChangeSet {
  changes: FileChange[];
  /** Paths touched by more than one agent — flagged for human attention. */
  conflicts: string[];
}

export interface ValidationIssue {
  validator: string;
  message: string;
}

export interface ValidationReport {
  passed: boolean;
  issues: ValidationIssue[];
}

/** A check run against a change set before it is accepted. */
export interface Validator {
  name: string;
  /**
   * @param changeSet the consolidated changes under review
   * @param repoRoot absolute repo path
   * @returns the issues found; an empty array means the validator passed
   */
  validate(changeSet: ChangeSet, repoRoot: string): Promise<ValidationIssue[]>;
}

/** Output of the planning stage: which agents run and a shared brief. */
export interface Plan {
  agents: AgentName[];
  /** Shared context injected into every selected agent's prompt. */
  brief: string;
}

/** The reviewer's adversarial verdict on a single proposed change. */
export interface ReviewVerdict {
  path: string;
  verdict: "accept" | "reject";
  reason: string;
}

export interface Review {
  verdicts: ReviewVerdict[];
  summary: string;
  /** Durable lessons the reviewer surfaced (e.g. a recurring mistake). */
  memories: string[];
}

/** Everything the orchestrator produces for one task. */
export interface OrchestrationResult {
  task: Task;
  /** Present when the planning stage ran. */
  plan?: Plan;
  agentResults: AgentResult[];
  /** Consolidated changes that survived review. */
  changeSet: ChangeSet;
  /** Present when the review stage ran. */
  review?: Review;
  /** Changes the reviewer rejected (removed from `changeSet`). */
  rejected: FileChange[];
  validation: ValidationReport;
  /** True when changes passed validation and were written to disk. */
  applied: boolean;
}
