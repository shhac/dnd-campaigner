/**
 * Subagent watcher — discovers and tails all subagent JSONL files
 * within a session's subagents directory.
 */

import { readdirSync, readFileSync, existsSync, statSync, watch, type FSWatcher } from "fs";
import { join, basename } from "path";
import { JsonlWatcher, type EventCallback } from "./watcher";
import { createSubagentParser } from "./subagent-parser";

export class SubagentWatcher {
  private dir: string;
  private callback: EventCallback;
  private watchers: Map<string, JsonlWatcher> = new Map();
  private dirWatcher: FSWatcher | null = null;

  constructor(dir: string, callback: EventCallback) {
    this.dir = dir;
    this.callback = callback;
  }

  /**
   * Discover all subagent JSONL files, backfill existing content,
   * and start watching for new lines and new files.
   * Returns total number of backfilled events.
   */
  start(): number {
    let totalBackfilled = 0;

    try {
      const files = readdirSync(this.dir).filter((f) => f.endsWith(".jsonl"));
      for (const file of files) {
        totalBackfilled += this.addFile(file);
      }
    } catch {
      // Directory might not exist yet
    }

    // Watch for new subagent files appearing
    try {
      this.dirWatcher = watch(this.dir, (eventType, filename) => {
        if (!filename || !filename.endsWith(".jsonl")) return;
        if (this.watchers.has(filename)) return;
        this.addFile(filename);
      });
    } catch {
      // Directory might not exist yet
    }

    return totalBackfilled;
  }

  /**
   * Stop all file watchers and the directory watcher.
   */
  stop(): void {
    for (const watcher of this.watchers.values()) {
      watcher.stop();
    }
    this.watchers.clear();

    if (this.dirWatcher) {
      this.dirWatcher.close();
      this.dirWatcher = null;
    }
  }

  /**
   * Add a single subagent JSONL file: resolve its agentType,
   * create a watcher, backfill, and start tailing.
   * Returns number of backfilled events.
   */
  private addFile(filename: string): number {
    const filePath = join(this.dir, filename);

    try {
      const stat = statSync(filePath);
      if (!stat.isFile()) return 0;
    } catch {
      return 0;
    }

    const agentType = this.resolveAgentType(filename);
    if (!agentType) return 0;

    const parser = createSubagentParser(agentType);
    const watcher = new JsonlWatcher(filePath, this.callback, parser);
    const backfilled = watcher.backfill();
    watcher.start();

    this.watchers.set(filename, watcher);
    return backfilled;
  }

  /**
   * Determine the agent type for a subagent JSONL file.
   * First checks for a companion .meta.json file, then falls back
   * to inferring from the JSONL content itself.
   */
  private resolveAgentType(filename: string): string | null {
    const baseName = filename.replace(/\.jsonl$/, "");

    // Try companion .meta.json
    const metaPath = join(this.dir, `${baseName}.meta.json`);
    if (existsSync(metaPath)) {
      try {
        const meta = JSON.parse(readFileSync(metaPath, "utf-8"));
        if (meta.agentType) return meta.agentType;
      } catch {
        // Malformed meta — fall through to inference
      }
    }

    // Infer from JSONL content: scan first 50 lines for a SendMessage
    // with a character: field
    return this.inferAgentType(join(this.dir, filename));
  }

  /**
   * Scan the first 50 lines of a JSONL file looking for a SendMessage
   * tool_use block whose content contains a `character:` field.
   * Returns the character name as the agentType, or null.
   */
  private inferAgentType(filePath: string): string | null {
    try {
      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      const limit = Math.min(lines.length, 50);

      for (let i = 0; i < limit; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const record = JSON.parse(line);
          if (record.type !== "assistant") continue;

          const msgContent = record.message?.content;
          if (!Array.isArray(msgContent)) continue;

          for (const block of msgContent) {
            if (block.type !== "tool_use" || block.name !== "SendMessage") continue;

            const input = block.input || {};
            const rawContent = (input.content || input.message || "") as string;

            const charMatch = rawContent.match(/^character\s*:\s*(.+)$/m);
            if (charMatch) return charMatch[1].trim();
          }
        } catch {
          // Skip malformed lines
        }
      }
    } catch {
      // File read error
    }

    return null;
  }
}
