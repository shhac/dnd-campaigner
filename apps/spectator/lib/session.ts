/**
 * Session state manager — maintains the running state of a spectator session
 * including character registry, event buffer, and derived state.
 */

import type { SpectatorEvent } from "./parser";
import type { CharacterInfo, CampaignInfo } from "./campaign";
import {
  isVisibleAgent,
  inferRole,
  formatAgentName,
  getAgentMetadata,
} from "./agents";

export interface AgentState {
  id: string;
  name: string;
  color?: string;
  status: "active" | "thinking" | "idle" | "terminated";
  lastActivity?: string;
  lastActivityTime?: string;
  role: "gm" | "player" | "narrator" | "npc" | "lead";
  character?: CharacterInfo;
}

export interface SessionState {
  sessionId: string;
  campaign?: CampaignInfo;
  agents: Map<string, AgentState>;
  humanControlled: Set<string>;
  events: SpectatorEvent[];
  currentScene?: string;
  status: "starting" | "active" | "ending" | "ended";
  startTime?: string;
}

export class SessionManager {
  state: SessionState;
  private maxEvents: number;
  private characterLookup = new Map<string, CharacterInfo>();

  constructor(sessionId: string, maxEvents = 5000) {
    this.maxEvents = maxEvents;
    this.state = {
      sessionId,
      agents: new Map(),
      humanControlled: new Set(),
      events: [],
      status: "starting",
    };
  }

  setCampaign(campaign: CampaignInfo): void {
    this.state.campaign = campaign;
    // Store character data as a lookup — agents are created dynamically
    // from session events so only active participants appear
    for (const char of campaign.characters) {
      this.characterLookup.set(char.id, char);
    }
    // Enrich any agents already discovered from events
    for (const [id, agent] of this.state.agents) {
      if (!agent.character && this.characterLookup.has(id)) {
        agent.character = this.characterLookup.get(id);
        agent.name = agent.character!.name;
      }
    }
  }

  /**
   * Process a new event and update session state.
   */
  processEvent(event: SpectatorEvent): void {
    // Insert in timestamp order (live events from multiple watchers may arrive out of order)
    const events = this.state.events;
    if (events.length === 0 || event.timestamp >= events[events.length - 1].timestamp) {
      events.push(event);
    } else {
      // Binary search for insertion point
      let lo = 0, hi = events.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (events[mid].timestamp <= event.timestamp) lo = mid + 1;
        else hi = mid;
      }
      events.splice(lo, 0, event);
    }
    if (events.length > this.maxEvents) {
      this.state.events = events.slice(-this.maxEvents);
    }

    // Update agent states
    this.updateAgentFromEvent(event);

    // ask_player events identify human-controlled characters
    if (event.type === "ask_player" && event.from !== "gm") {
      this.state.humanControlled.add(event.from);
    }

    // Update session status
    if (event.type === "session_command") {
      if (event.content.includes("command: start")) {
        this.state.status = "active";
        this.state.startTime = event.timestamp;
        // Try to extract campaign name
        const campaignMatch = event.content.match(/campaign:\s*(.+)/);
        if (campaignMatch && !this.state.campaign) {
          // Campaign will be set externally by server
        }
      }
      if (event.content.includes("command: end")) {
        this.state.status = "ending";
      }
    }

    if (event.type === "session_end") {
      this.state.status = "ended";
    }

    // Update current scene
    if (event.parsed.sceneNumber) {
      this.state.currentScene = event.parsed.sceneSlug || event.parsed.sceneNumber;
    }
  }

  private updateAgentFromEvent(event: SpectatorEvent): void {
    const fromId = event.from;
    if (!fromId || !isVisibleAgent(fromId)) return;

    // Ensure agent exists
    if (!this.state.agents.has(fromId)) {
      const character = this.characterLookup.get(fromId);
      this.state.agents.set(fromId, {
        id: fromId,
        name: character?.name || formatAgentName(fromId),
        color: event.color,
        status: "active",
        role: inferRole(fromId),
        character,
      });
    }

    const agent = this.state.agents.get(fromId)!;

    // Update color if we got one
    if (event.color) agent.color = event.color;

    // Update status based on event type
    if (event.type === "terminated") {
      agent.status = "terminated";
    } else if (event.type === "idle") {
      agent.status = "idle";
      if (event.summary) {
        agent.lastActivity = event.summary;
        agent.lastActivityTime = event.timestamp;
      }
    } else if (event.type === "activity") {
      agent.status = "active";
      // Extract "doing" field
      const doingMatch = event.content.match(/doing:\s*(.+)/);
      if (doingMatch) {
        agent.lastActivity = doingMatch[1].trim();
        agent.lastActivityTime = event.timestamp;
      }
    } else {
      agent.status = "active";
      agent.lastActivityTime = event.timestamp;
    }

    // Also mark the "to" agent as active if it's a direct message
    if (event.to && event.to !== "*" && this.state.agents.has(event.to)) {
      const toAgent = this.state.agents.get(event.to)!;
      if (toAgent.status !== "terminated") {
        toAgent.status = "active";
      }
    }
  }

  /**
   * Sort events by timestamp and remove duplicates.
   * Call after all backfill sources (parent + subagents) are loaded.
   */
  sortAndDeduplicate(): void {
    this.state.events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    // Deduplicate by (from, to, timestamp, content prefix)
    const seen = new Set<string>();
    this.state.events = this.state.events.filter((e) => {
      const key = `${e.from}|${e.to}|${e.timestamp}|${e.content.slice(0, 80)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Serialize state for WebSocket transmission.
   */
  toJSON(): object {
    return {
      sessionId: this.state.sessionId,
      campaign: this.state.campaign,
      agents: Object.fromEntries(this.state.agents),
      agentMeta: getAgentMetadata(),
      humanControlled: [...this.state.humanControlled],
      events: this.state.events,
      currentScene: this.state.currentScene,
      status: this.state.status,
      startTime: this.state.startTime,
    };
  }
}
