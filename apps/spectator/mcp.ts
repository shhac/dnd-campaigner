#!/usr/bin/env bun
/**
 * Spectator Input MCP Server
 *
 * Provides two tools for D&D session orchestration:
 *   - ask_player:      blocks until human responds via spectator web UI (or falls back)
 *   - check_interrupt:  non-blocking check for unprompted human input
 *
 * Spawned automatically by Claude Code at session start (registered in .mcp.json).
 * Communicates with the spectator web app via shared lock files in campaigns/{campaign}/tmp/.
 *
 * Per-character design: any player agent can call ask_player for its character.
 * The MCP server uses per-character lock files ({character}-prompt.json, {character}.auto)
 * so multiple human players can be active simultaneously.
 */

import { resolve } from "path";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "fs";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const REPO_ROOT = resolve(import.meta.dir, "../..");
const DEFAULT_TIMEOUT = 180; // 3 minutes
const POLL_INTERVAL = 500; // ms
const HEALTH_TIMEOUT = 1000; // ms

// --- Helpers ---

function tmpDir(campaign: string): string {
  const dir = resolve(REPO_ROOT, "campaigns", campaign, "tmp");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function filePath(campaign: string, name: string): string {
  return resolve(tmpDir(campaign), name);
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

function deleteIfExists(path: string): void {
  try {
    unlinkSync(path);
  } catch {
    // Already gone
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function spectatorIsUp(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);
    const resp = await fetch("http://localhost:3333/api/health", {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return resp.ok;
  } catch {
    return false;
  }
}

async function waitForFile(
  path: string,
  timeoutMs: number
): Promise<unknown | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (existsSync(path)) {
      try {
        return readJson(path);
      } catch {
        // Partial write — retry
      }
    }
    await sleep(POLL_INTERVAL);
  }
  return null;
}

async function waitWhileExists(path: string): Promise<void> {
  while (existsSync(path)) {
    await sleep(POLL_INTERVAL);
  }
}

// --- MCP Server ---

const server = new Server(
  { name: "spectator-input", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "ask_player",
      description:
        "Ask a human-controlled character's player for input. Any player agent can call this " +
        "for its own character. Auto-detects the best input channel: spectator web UI " +
        "(blocks with countdown), terminal (AskUserQuestion fallback), or full-auto " +
        "(AI controls this character). Supports multiple simultaneous human players.",
      inputSchema: {
        type: "object" as const,
        properties: {
          campaign: {
            type: "string",
            description: "Campaign directory name (e.g., 'the-dimming')",
          },
          character: {
            type: "string",
            description:
              "Character ID (hyphenated, e.g., 'eamon-lightward'). " +
              "Used for per-character prompt routing and mode tracking.",
          },
          prompt: {
            type: "string",
            description: "The prompt/question to show the player",
          },
          options: {
            type: "array",
            items: { type: "string" },
            description: "Optional suggested response options",
          },
          timeout_seconds: {
            type: "number",
            description:
              "Seconds to wait before AI takes over this turn (default: 180)",
          },
        },
        required: ["campaign", "character", "prompt"],
      },
    },
    {
      name: "check_interrupt",
      description:
        "Check if a human player wants to interrupt or change mode. " +
        "Call this at every beat boundary (before each narrative broadcast), " +
        "regardless of current mode. Returns immediately if no interrupt pending. " +
        "This is how humans re-enter the game from full-auto or signal the GM.",
      inputSchema: {
        type: "object" as const,
        properties: {
          campaign: {
            type: "string",
            description: "Campaign directory name",
          },
        },
        required: ["campaign"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "ask_player") {
      return await handleAskPlayer(args as Record<string, unknown>);
    }
    if (name === "check_interrupt") {
      return await handleCheckInterrupt(args as Record<string, unknown>);
    }
    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Error in ${name}: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
});

// --- Tool Handlers ---

async function handleAskPlayer(args: Record<string, unknown>) {
  const campaign = args.campaign as string;
  const character = args.character as string;
  const prompt = args.prompt as string;
  const options = (args.options as string[]) || [];
  const timeoutSeconds = (args.timeout_seconds as number) || DEFAULT_TIMEOUT;

  const pausePath = filePath(campaign, "player.pause");
  const promptPath = filePath(campaign, `${character}-prompt.json`);
  const responsePath = filePath(campaign, `${character}-response.json`);
  const autoFlagPath = filePath(campaign, `${character}.auto`);

  // 1. Check per-character auto mode first (fast path)
  if (existsSync(autoFlagPath)) {
    console.error(
      `[spectator-input] ${character} is in full-auto mode`
    );
    return result({ mode: "full_auto", character });
  }

  // 2. Wait if session is paused
  if (existsSync(pausePath)) {
    console.error("[spectator-input] Session paused, waiting...");
    await waitWhileExists(pausePath);
    console.error("[spectator-input] Session resumed");
  }

  // 3. Check spectator availability
  const spectatorUp = await spectatorIsUp();

  if (!spectatorUp) {
    console.error(
      `[spectator-input] Spectator not running, falling back to terminal`
    );
    return result({ mode: "terminal", character });
  }

  // 4. Write prompt for spectator to pick up
  writeJson(promptPath, {
    character,
    prompt,
    options,
    timestamp: Date.now(),
    timeout_seconds: timeoutSeconds,
  });
  console.error(
    `[spectator-input] ${character}: prompt written, waiting up to ${timeoutSeconds}s`
  );

  // 5. Wait for response
  const response = await waitForFile(responsePath, timeoutSeconds * 1000);

  // 6. Clean up
  deleteIfExists(promptPath);
  deleteIfExists(responsePath);

  if (!response) {
    console.error(
      `[spectator-input] ${character}: timeout — AI takeover this turn`
    );
    return result({ mode: "ai_takeover", character });
  }

  const data = response as Record<string, unknown>;

  if (data.skip) {
    console.error(
      `[spectator-input] ${character}: skipped — AI takeover this turn`
    );
    return result({ mode: "ai_takeover", character });
  }

  console.error(`[spectator-input] ${character}: got human response`);
  return result({ mode: "web", character, response: data.message });
}

async function handleCheckInterrupt(args: Record<string, unknown>) {
  const campaign = args.campaign as string;
  const lockPath = filePath(campaign, "player.lock");
  const interruptPath = filePath(campaign, "player-interrupt.json");
  const pausePath = filePath(campaign, "player.pause");

  // Fast path — no interrupt
  if (!existsSync(lockPath)) {
    return result({ interrupted: false });
  }

  // Read interrupt
  let data: Record<string, unknown> = {};
  try {
    data = readJson(interruptPath) as Record<string, unknown>;
  } catch {
    // Lock exists but no content — treat as empty interrupt
  }

  // Clean up
  deleteIfExists(lockPath);
  deleteIfExists(interruptPath);

  // Handle mode changes (per-character or global)
  const modeChange = data.mode_change as string | undefined;
  const character = data.character as string | undefined;

  if (modeChange === "full_auto" && character) {
    writeFileSync(filePath(campaign, `${character}.auto`), "");
  } else if (modeChange === "human" && character) {
    deleteIfExists(filePath(campaign, `${character}.auto`));
  } else if (modeChange === "pause") {
    writeFileSync(pausePath, "");
  }

  console.error(
    `[spectator-input] Interrupt: ${data.message || "(mode change)"}` +
      (character ? ` [${character}]` : "") +
      (modeChange ? ` mode→${modeChange}` : "")
  );

  return result({
    interrupted: true,
    message: data.message || null,
    character: character || null,
    mode_change: modeChange || null,
  });
}

// --- Utility ---

function result(data: Record<string, unknown>) {
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
  };
}

// --- Start ---

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[spectator-input] MCP server running");
