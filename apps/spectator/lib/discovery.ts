/**
 * JSONL session discovery — finds the Claude Code project directory
 * and active session files for this repo.
 */

import { homedir } from "os";
import { join, resolve } from "path";
import { readdirSync, statSync } from "fs";

export interface SessionInfo {
  sessionId: string;
  jsonlPath: string;
  modifiedAt: Date;
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
        };
      })
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
  } catch {
    return [];
  }
}

/**
 * Find the most recent session, optionally filtering by campaign name.
 */
export function findActiveSession(
  cwd: string,
  sessionId?: string
): SessionInfo | null {
  const sessions = listSessions(cwd);
  if (sessionId) {
    return sessions.find((s) => s.sessionId === sessionId) ?? null;
  }
  return sessions[0] ?? null;
}
