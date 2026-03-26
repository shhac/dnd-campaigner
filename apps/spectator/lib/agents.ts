/**
 * Agent identity registry — single source of truth for agent metadata
 * in the spectator app. Maps agent IDs to display names, colors, and roles.
 */

export const SYSTEM_AGENT_IDS = ["gm", "narrator", "team-lead", "human"] as const;

export type SystemAgentId = (typeof SYSTEM_AGENT_IDS)[number];

export type AgentRole = "gm" | "narrator" | "lead" | "player";

export interface AgentIdentity {
  id: string;
  displayName: string;
  shortName: string;
  color: string;
  role: AgentRole;
  isSystem: boolean;
}

const SYSTEM_AGENTS: Record<SystemAgentId, AgentIdentity> = {
  gm: {
    id: "gm",
    displayName: "Game Master",
    shortName: "GM",
    color: "gm",
    role: "gm",
    isSystem: true,
  },
  narrator: {
    id: "narrator",
    displayName: "Narrator",
    shortName: "Narrator",
    color: "narrator",
    role: "narrator",
    isSystem: true,
  },
  "team-lead": {
    id: "team-lead",
    displayName: "Team Lead",
    shortName: "Lead",
    color: "lead",
    role: "lead",
    isSystem: true,
  },
  human: {
    id: "human",
    displayName: "Human Player",
    shortName: "Human",
    color: "human",
    role: "player",
    isSystem: true,
  },
};

/** True if the agent ID is one of the system-level agents (gm, narrator, team-lead, human). */
export function isSystemAgent(id: string): boolean {
  return (SYSTEM_AGENT_IDS as readonly string[]).includes(id);
}

/**
 * True if the agent should appear in the spectator event stream.
 * Visible: gm, narrator, and any non-system ID (player characters).
 * Hidden: team-lead (orchestration only) and human (input relay, not a character).
 */
export function isVisibleAgent(id: string): boolean {
  if (id === "team-lead" || id === "human") return false;
  return true;
}

/** Infer the role for an agent by ID. Non-system agents are players. */
export function inferRole(id: string): AgentRole {
  return SYSTEM_AGENTS[id as SystemAgentId]?.role ?? "player";
}

/** Get the full identity record for a system agent, or null for player agents. */
export function getIdentity(id: string): AgentIdentity | null {
  return SYSTEM_AGENTS[id as SystemAgentId] ?? null;
}

/**
 * Format an agent ID for display.
 * System agents return their displayName; kebab-case IDs get title-cased.
 * "eamon-lightward" -> "Eamon Lightward"
 */
export function formatAgentName(id: string): string {
  const known = SYSTEM_AGENTS[id as SystemAgentId];
  if (known) return known.displayName;
  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Serializable snapshot of the system agent registry, suitable for
 * sending to the browser frontend over WebSocket.
 */
export function getAgentMetadata(): Record<string, AgentIdentity> {
  return { ...SYSTEM_AGENTS };
}
