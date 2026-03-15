/**
 * File watcher — tails JSONL files and emits new lines as they're appended.
 * Uses fs.watch for change detection and reads from byte offset.
 */

import { watch, readFileSync, openSync, readSync, closeSync, statSync, type FSWatcher } from "fs";
import { parseLine, type SpectatorEvent } from "./parser";

export type EventCallback = (events: SpectatorEvent[]) => void;

export class JsonlWatcher {
  private path: string;
  private offset: number;
  private watcher: FSWatcher | null = null;
  private callback: EventCallback;
  private buffer: string = "";
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(path: string, callback: EventCallback) {
    this.path = path;
    this.offset = 0;
    this.callback = callback;
  }

  /**
   * Read all existing content and emit events (backfill).
   * Returns the number of events emitted.
   */
  backfill(): number {
    let total = 0;
    try {
      const content = readFileSync(this.path, "utf-8");
      this.offset = Buffer.byteLength(content, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        const events = parseLine(line);
        if (events.length > 0) {
          this.callback(events);
          total += events.length;
        }
      }
    } catch {
      // File doesn't exist yet — that's fine
    }
    return total;
  }

  /**
   * Start watching for new lines appended to the file.
   */
  start(): void {
    if (this.watcher) return;

    try {
      this.watcher = watch(this.path, () => {
        // Debounce rapid writes
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.readNew(), 50);
      });
    } catch {
      // File might not exist yet — retry periodically
      setTimeout(() => this.start(), 1000);
    }
  }

  /**
   * Read new bytes from the file since last offset.
   */
  private readNew(): void {
    try {
      const stat = statSync(this.path);
      if (stat.size <= this.offset) return;

      // Read only new bytes synchronously
      const bytesToRead = stat.size - this.offset;
      const buf = Buffer.alloc(bytesToRead);
      const fd = openSync(this.path, "r");
      readSync(fd, buf, 0, bytesToRead, this.offset);
      closeSync(fd);

      this.offset = stat.size;
      this.buffer += buf.toString("utf-8");

      // Split on newlines, keeping incomplete last line in buffer
      const lines = this.buffer.split("\n");
      this.buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const events = parseLine(line);
        if (events.length > 0) {
          this.callback(events);
        }
      }
    } catch {
      // File might have been rotated — reset
    }
  }

  /**
   * Stop watching.
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}
