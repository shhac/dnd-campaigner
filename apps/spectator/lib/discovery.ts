/**
 * JSONL session discovery — finds the Claude Code project directory
 * and active session files for this repo.
 */

import { homedir } from "os";
import { join } from "path";
import { readdirSync, statSync, readFileSync } from "fs";

export interface SessionInfo {
  sessionId: string;
  jsonlPath: string;
  modifiedAt: Date;
  sizeBytes: number;
}

export interface SessionSummary extends SessionInfo {
  campaign?: string;
  hasTeam: boolean;
  isOrchestrator: boolean;
  eventCount: number;
  agents: string[];
  firstTimestamp?: string;
}

/**
 * Derive the Claude projects directory slug from a working directory path.
 * Claude Code mangles `/Users/paul/projects-personal/dnd-campaigner`
 * into `-Users-paul-projects-personal-dnd-campaigner`.
 */
export function projectSlug(cwd: string): string {
  return cwd.replace(/\//g, "-");
}

/**
 * Get the Claude projects base directory for this repo.
 */
export function projectDir(cwd: string): string {
  return join(homedir(), ".claude", "projects", projectSlug(cwd));
}

/**
 * List all JSONL session files, sorted by modification time (newest first).
 */
export function listSessions(cwd: string): SessionInfo[] {
  const dir = projectDir(cwd);
  try {
    const files = readdirSync(dir).filter((f) => f.endsWith(".jsonl"));
    return files
      .map((f) => {
        const fullPath = join(dir, f);
        const stat = statSync(fullPath);
        return {
          sessionId: f.replace(".jsonl", ""),
          jsonlPath: fullPath,
          modifiedAt: stat.mtime,
          sizeBytes: stat.size,
        };
      })
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
  } catch {
    return [];
  }
}

/**
 * Find a specific session by ID.
 */
export function findSession(
  cwd: string,
  sessionId: string
): SessionInfo | null {
  const sessions = listSessions(cwd);
  // Exact match first, then prefix match
  const exact = sessions.find((s) => s.sessionId === sessionId);
  if (exact) return exact;
  const prefixMatches = sessions.filter((s) => s.sessionId.startsWith(sessionId));
  if (prefixMatches.length === 1) return prefixMatches[0];
  return null;
}

/**
 * Quick-scan a JSONL file for metadata: campaign name, team presence,
 * agent names, orchestrator detection. Reads only the first ~200 lines.
 *
 * Orchestrator detection: The team lead's JSONL has teammate-messages
 * from 3+ different agent IDs (GM, narrator, players). Subagent JSONLs
 * only receive messages from "team-lead".
 */
export function scanSessionMeta(session: SessionInfo): SessionSummary {
  const summary: SessionSummary = {
    ...session,
    hasTeam: false,
    isOrchestrator: false,
    eventCount: 0,
    agents: [],
  };

  try {
    const content = readFileSync(session.jsonlPath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());
    summary.eventCount = lines.length;

    const agentSet = new Set<string>();
    let hasSendMessage = false;

    for (let i = 0; i < Math.min(lines.length, 200); i++) {
      try {
        const record = JSON.parse(lines[i]);

        if (!summary.firstTimestamp && record.timestamp) {
          summary.firstTimestamp = record.timestamp;
        }

        const msgContent = record.message?.content;

        // Check for SendMessage tool_use (outgoing messages — team lead does this)
        if (record.type === "assistant" && Array.isArray(msgContent)) {
          for (const block of msgContent) {
            if (block.type === "tool_use" && block.name === "SendMessage") {
              hasSendMessage = true;
            }
          }
        }

        if (typeof msgContent !== "string") continue;

        // Detect team usage and extract agent IDs
        if (msgContent.includes("<teammate-message")) {
          summary.hasTeam = true;
          const idMatches = msgContent.matchAll(/teammate_id="([^"]+)"/g);
          for (const m of idMatches) {
            if (m[1] !== "team-lead") agentSet.add(m[1]);
          }
        }

        // Detect campaign name
        if (!summary.campaign) {
          const campMatch = msgContent.match(
            /campaign:\s*([a-z][a-z0-9-]+)/i
          );
          if (campMatch) summary.campaign = campMatch[1];
        }
      } catch {
        // Skip malformed lines
      }
    }

    summary.agents = [...agentSet];

    // Orchestrator = has team + receives messages from 3+ agents + sends messages
    // Subagent = has team but only receives from team-lead
    summary.isOrchestrator =
      summary.hasTeam && summary.agents.length >= 3 && hasSendMessage;
  } catch {
    // File read error
  }

  return summary;
}

/**
 * List all sessions with metadata summaries.
 * Filters to show only orchestrator sessions for team sessions,
 * and solo sessions. Subagent transcripts are hidden.
 */
export function listSessionSummaries(cwd: string): SessionSummary[] {
  const sessions = listSessions(cwd);
  const summaries = sessions.map(scanSessionMeta);

  // Filter: show orchestrators + non-team sessions, hide subagent transcripts
  return summaries.filter((s) => !s.hasTeam || s.isOrchestrator);
}

/**
 * Get the subagents directory path for a session, if it exists.
 */
export function subagentsDir(cwd: string, sessionId: string): string | null {
  const dir = join(projectDir(cwd), sessionId, "subagents");
  try {
    const stat = statSync(dir);
    if (stat.isDirectory()) return dir;
  } catch {}
  return null;
}
