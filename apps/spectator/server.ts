#!/usr/bin/env bun
/**
 * Spectator Mode — a local web app for watching D&D sessions unfold in real-time.
 *
 * Usage:
 *   bun apps/spectator/server.ts                    # session picker UI
 *   bun apps/spectator/server.ts --session <id>     # go straight to session
 *   bun apps/spectator/server.ts --port <port>      # custom port (default: 3333)
 *
 * Reads Claude Code JSONL transcripts from ~/.claude/projects/ and serves
 * a live play-script view of all agent communication.
 */

import { resolve, join } from "path";
import { existsSync, writeFileSync, readFileSync, unlinkSync, mkdirSync } from "fs";
import {
  findSession,
  listSessionSummaries,
  type SessionInfo,
} from "./lib/discovery";
import { JsonlWatcher } from "./lib/watcher";
import { SessionManager } from "./lib/session";
import { readCampaign } from "./lib/campaign";
import type { SpectatorEvent } from "./lib/parser";

// Parse CLI args
const args = process.argv.slice(2);
let cliSessionId: string | undefined;
let port = 3333;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--session" && args[i + 1]) cliSessionId = args[++i];
  if (args[i] === "--port" && args[i + 1]) port = parseInt(args[++i], 10);
}

const repoRoot = resolve(import.meta.dir, "../..");
const publicDir = join(import.meta.dir, "public");

// --- Active session state (null until a session is selected) ---

let activeSession: SessionInfo | null = null;
let manager: SessionManager | null = null;
let watcher: JsonlWatcher | null = null;
const wsClients = new Set<any>();

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

function onEvents(events: SpectatorEvent[]): void {
  if (!manager) return;
  for (const event of events) {
    manager.processEvent(event);
    broadcast("event", event);
  }
  broadcast("agents", Object.fromEntries(manager.state.agents));
}

function detectAndLoadCampaign(): void {
  if (!manager) return;
  for (const event of manager.state.events) {
    if (event.type === "session_command" || event.type === "system") {
      const match = event.content.match(/campaign:\s*([a-z0-9-]+)/i);
      if (match) {
        console.log(`Campaign: ${match[1]}`);
        manager.setCampaign(readCampaign(repoRoot, match[1]));
        return;
      }
    }
  }
}

function loadSession(sessionId: string): boolean {
  const session = findSession(repoRoot, sessionId);
  if (!session) return false;

  // Clean up previous session
  if (watcher) watcher.stop();
  wsClients.clear();

  activeSession = session;
  manager = new SessionManager(session.sessionId);

  console.log(`Session: ${session.sessionId}`);
  console.log(`JSONL:   ${session.jsonlPath}`);

  watcher = new JsonlWatcher(session.jsonlPath, onEvents);
  const count = watcher.backfill();
  console.log(`Backfilled ${count} events`);

  detectAndLoadCampaign();
  watcher.start();
  console.log("Watching for new events...");

  return true;
}

// If --session was given, load immediately
if (cliSessionId) {
  if (!loadSession(cliSessionId)) {
    console.error(`Session not found: ${cliSessionId}`);
    process.exit(1);
  }
}

// --- Player input helpers ---

function campaignTmpDir(): string | null {
  const name = manager?.state.campaign?.name;
  if (!name) return null;
  const dir = join(repoRoot, "campaigns", name, "tmp");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function tmpFile(name: string): string | null {
  const dir = campaignTmpDir();
  return dir ? join(dir, name) : null;
}

function handlePlayerApi(req: Request, url: URL): Response | null {
  // Health check — always available
  if (url.pathname === "/api/health") {
    const dir = campaignTmpDir();
    // Scan for per-character auto flags and pending prompts
    const characters: Record<string, { mode: string; hasPrompt: boolean }> = {};
    if (dir && manager) {
      const humanControlled = manager.state.humanControlled;
      for (const [id, agent] of manager.state.agents) {
        if (!agent.character) continue;
        // .auto file overrides session detection (user toggled via UI)
        const hasAutoFile = existsSync(join(dir, `${id}.auto`));
        const hasHumanFile = existsSync(join(dir, `${id}.human`));
        const mode = hasAutoFile ? "full_auto"
          : hasHumanFile ? "human"
          : humanControlled.has(id) ? "human" : "full_auto";
        characters[id] = {
          mode,
          hasPrompt: existsSync(join(dir, `${id}-prompt.json`)),
        };
      }
    }
    return Response.json({
      ok: true,
      session: activeSession?.sessionId ?? null,
      campaign: manager?.state.campaign?.name ?? null,
      characters,
      isPaused: dir ? existsSync(join(dir, "player.pause")) : false,
    });
  }

  // All other player APIs need an active campaign
  const dir = campaignTmpDir();
  if (!dir) {
    return Response.json({ error: "No active campaign" }, { status: 503 });
  }

  // GET /api/prompt — browser polls for pending prompts (per-character)
  if (url.pathname === "/api/prompt" && req.method === "GET") {
    const character = url.searchParams.get("character");
    // If character specified, return that character's prompt
    if (character) {
      const promptPath = join(dir, `${character}-prompt.json`);
      if (existsSync(promptPath)) {
        try {
          return Response.json(JSON.parse(readFileSync(promptPath, "utf-8")));
        } catch {
          return Response.json({ prompt: null });
        }
      }
      return Response.json({ prompt: null });
    }
    // No character specified — return all pending prompts
    const prompts: Record<string, unknown> = {};
    const campaign = manager?.state.campaign;
    if (campaign) {
      for (const char of campaign.characters) {
        const path = join(dir, `${char.id}-prompt.json`);
        if (existsSync(path)) {
          try {
            prompts[char.id] = JSON.parse(readFileSync(path, "utf-8"));
          } catch {}
        }
      }
    }
    return Response.json({ prompts });
  }

  // POST /api/respond, /api/interrupt, /api/mode — handled async (need body parsing)
  // These are routed in the fetch handler below, not here.

  // POST /api/pause — pause session
  if (url.pathname === "/api/pause" && req.method === "POST") {
    writeFileSync(join(dir, "player.pause"), "");
    broadcast("pause", { paused: true });
    return Response.json({ ok: true, paused: true });
  }

  // DELETE /api/pause — resume session
  if (url.pathname === "/api/pause" && req.method === "DELETE") {
    try { unlinkSync(join(dir, "player.pause")); } catch {}
    broadcast("pause", { paused: false });
    return Response.json({ ok: true, paused: false });
  }

  return null; // Not a player API route (or needs async body parsing)
}

// Async body handlers (need await for req.json())
async function handlePlayerApiAsync(req: Request, url: URL): Promise<Response | null> {
  const dir = campaignTmpDir();
  if (!dir) return null;

  if (url.pathname === "/api/respond" && req.method === "POST") {
    const body = await req.json() as Record<string, unknown>;
    const character = body.character as string;
    if (!character) return Response.json({ error: "character required" }, { status: 400 });
    writeFileSync(
      join(dir, `${character}-response.json`),
      JSON.stringify({ message: body.message, skip: body.skip ?? false, timestamp: Date.now() })
    );
    return Response.json({ ok: true, character });
  }

  if (url.pathname === "/api/interrupt" && req.method === "POST") {
    const body = await req.json() as Record<string, unknown>;
    const character = body.character as string | undefined;
    writeFileSync(join(dir, "player.lock"), "");
    writeFileSync(
      join(dir, "player-interrupt.json"),
      JSON.stringify({
        message: body.message,
        character: character ?? null,
        mode_change: body.mode_change ?? null,
        timestamp: Date.now(),
      })
    );
    // Handle per-character mode changes immediately
    if (body.mode_change === "full_auto" && character) {
      writeFileSync(join(dir, `${character}.auto`), "");
    } else if (body.mode_change === "human" && character) {
      try { unlinkSync(join(dir, `${character}.auto`)); } catch {}
    }
    broadcast("interrupt", { message: body.message, character, mode_change: body.mode_change });
    return Response.json({ ok: true });
  }

  if (url.pathname === "/api/mode" && req.method === "POST") {
    const body = await req.json() as Record<string, unknown>;
    const character = body.character as string;
    const mode = body.mode as string;
    if (!character) return Response.json({ error: "character required" }, { status: 400 });
    if (mode === "full_auto") {
      writeFileSync(join(dir, `${character}.auto`), "");
    } else {
      try { unlinkSync(join(dir, `${character}.auto`)); } catch {}
    }
    // Create interrupt so GM picks up the mode change
    writeFileSync(join(dir, "player.lock"), "");
    writeFileSync(
      join(dir, "player-interrupt.json"),
      JSON.stringify({ message: null, character, mode_change: mode, timestamp: Date.now() })
    );
    broadcast("mode", { character, mode });
    return Response.json({ ok: true, character, mode });
  }

  return null;
}

// --- HTTP + WebSocket server ---

const server = Bun.serve({
  port,
  async fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (req.headers.get("upgrade") === "websocket") {
      const success = server.upgrade(req);
      return success
        ? undefined
        : new Response("WebSocket upgrade failed", { status: 400 });
    }

    // Player input API (sync handlers)
    const syncResult = handlePlayerApi(req, url);
    if (syncResult) return syncResult;

    // Player input API (async handlers — need body parsing)
    if (
      (url.pathname === "/api/respond" ||
        url.pathname === "/api/interrupt" ||
        url.pathname === "/api/mode") &&
      req.method === "POST"
    ) {
      return handlePlayerApiAsync(req, url).then(
        (r) => r || new Response("Not Found", { status: 404 })
      );
    }

    // API: list sessions for picker
    if (url.pathname === "/api/sessions") {
      const summaries = listSessionSummaries(repoRoot);
      return Response.json(summaries);
    }

    // API: select a session (from picker)
    if (url.pathname === "/api/select" && url.searchParams.get("session")) {
      const id = url.searchParams.get("session")!;
      if (loadSession(id)) {
        return Response.json({ ok: true, sessionId: id });
      }
      return Response.json({ ok: false, error: "Session not found" }, { status: 404 });
    }

    // Main page routing
    let filePath = url.pathname;

    if (filePath === "/") {
      // If a session is active (via CLI or API select), serve spectator
      // If a ?session= param is in the URL, try to load it
      const urlSession = url.searchParams.get("session");
      if (urlSession && !activeSession) {
        loadSession(urlSession);
      }

      filePath = activeSession ? "/index.html" : "/picker.html";
    }

    // Serve static files (no-cache in dev to avoid stale JS/CSS)
    const fullPath = join(publicDir, filePath);
    const file = Bun.file(fullPath);
    if (await file.exists()) {
      return new Response(file, {
        headers: { "Cache-Control": "no-cache" },
      });
    }
    return new Response("Not Found", { status: 404 });
  },
  websocket: {
    open(ws) {
      wsClients.add(ws);
      if (manager) {
        ws.send(JSON.stringify({ type: "init", data: manager.toJSON() }));
      }
    },
    message(_ws, _msg) {},
    close(ws) {
      wsClients.delete(ws);
    },
  },
});

if (activeSession) {
  console.log(`\n  Spectator Mode: http://localhost:${server.port}\n`);
} else {
  console.log(`\n  Session Picker: http://localhost:${server.port}\n`);
  console.log("  No session specified. Open the URL to choose one.");
  console.log("  Or use: bun apps/spectator/server.ts --session <id>\n");
}

process.on("SIGINT", () => {
  if (watcher) watcher.stop();
  server.stop();
  process.exit(0);
});
