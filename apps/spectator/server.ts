#!/usr/bin/env bun
/**
 * Spectator Mode — a local web app for watching D&D sessions unfold in real-time.
 *
 * Usage:
 *   bun apps/spectator/server.ts [--session <id>] [--port <port>]
 *
 * Reads Claude Code JSONL transcripts from ~/.claude/projects/ and serves
 * a live play-script view of all agent communication.
 */

import { resolve, join } from "path";
import { readFileSync } from "fs";
import { findActiveSession, listSessions } from "./lib/discovery";
import { JsonlWatcher } from "./lib/watcher";
import { SessionManager } from "./lib/session";
import { readCampaign } from "./lib/campaign";
import type { SpectatorEvent } from "./lib/parser";

// Parse CLI args
const args = process.argv.slice(2);
let sessionId: string | undefined;
let port = 3333;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--session" && args[i + 1]) sessionId = args[++i];
  if (args[i] === "--port" && args[i + 1]) port = parseInt(args[++i], 10);
}

const repoRoot = resolve(import.meta.dir, "../..");
const wsClients = new Set<any>();

// Find session
const session = findActiveSession(repoRoot, sessionId);
if (!session) {
  const available = listSessions(repoRoot);
  console.error("No active session found.");
  if (available.length > 0) {
    console.error("\nAvailable sessions:");
    for (const s of available.slice(0, 5)) {
      console.error(`  --session ${s.sessionId}  (${s.modifiedAt.toLocaleString()})`);
    }
  }
  process.exit(1);
}

console.log(`Session: ${session.sessionId}`);
console.log(`JSONL:   ${session.jsonlPath}`);

// Initialize session manager
const manager = new SessionManager(session.sessionId);

// Broadcast events to all connected WebSocket clients
function broadcast(type: string, data: unknown): void {
  const msg = JSON.stringify({ type, data });
  for (const ws of wsClients) {
    try {
      ws.send(msg);
    } catch {
      wsClients.delete(ws);
    }
  }
}

// Event handler — processes events and broadcasts to clients
function onEvents(events: SpectatorEvent[]): void {
  for (const event of events) {
    manager.processEvent(event);
    broadcast("event", event);
  }
  // Broadcast updated agent states
  broadcast(
    "agents",
    Object.fromEntries(manager.state.agents)
  );
}

// Try to detect campaign from session content and load character data
function detectAndLoadCampaign(): void {
  for (const event of manager.state.events) {
    if (event.type === "session_command" || event.type === "system") {
      const match = event.content.match(/campaign:\s*([a-z0-9-]+)/i);
      if (match) {
        const campaignName = match[1];
        console.log(`Campaign: ${campaignName}`);
        const campaign = readCampaign(repoRoot, campaignName);
        manager.setCampaign(campaign);
        return;
      }
    }
  }
  // Also check the very first team-lead message which often contains campaign name
  for (const event of manager.state.events.slice(0, 10)) {
    const match = event.content.match(
      /(?:campaign|"([a-z][\w-]+)")\s*(?:campaign)?/i
    );
    if (match) {
      const name = match[1];
      if (name) {
        const campaign = readCampaign(repoRoot, name);
        if (campaign.characters.length > 0) {
          console.log(`Campaign: ${name} (inferred)`);
          manager.setCampaign(campaign);
          return;
        }
      }
    }
  }
}

// Backfill existing content
const watcher = new JsonlWatcher(session.jsonlPath, onEvents);
const backfillCount = watcher.backfill();
console.log(`Backfilled ${backfillCount} events`);

detectAndLoadCampaign();

// Start watching for new content
watcher.start();
console.log("Watching for new events...");

// Serve static files and WebSocket
const publicDir = join(import.meta.dir, "public");

const server = Bun.serve({
  port,
  fetch(req, server) {
    // WebSocket upgrade
    if (req.headers.get("upgrade") === "websocket") {
      const success = server.upgrade(req);
      return success
        ? undefined
        : new Response("WebSocket upgrade failed", { status: 400 });
    }

    // Static file serving
    const url = new URL(req.url);
    let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    const fullPath = join(publicDir, filePath);

    try {
      const file = Bun.file(fullPath);
      return new Response(file);
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  },
  websocket: {
    open(ws) {
      wsClients.add(ws);
      // Send full state on connect
      ws.send(JSON.stringify({ type: "init", data: manager.toJSON() }));
    },
    message(_ws, _msg) {
      // No client->server messages needed for now
    },
    close(ws) {
      wsClients.delete(ws);
    },
  },
});

console.log(`\n  Spectator Mode: http://localhost:${server.port}\n`);

// Graceful shutdown
process.on("SIGINT", () => {
  watcher.stop();
  server.stop();
  process.exit(0);
});
