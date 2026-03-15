#!/usr/bin/env bun
/**
 * Spectator Input CLI
 *
 * Provides two commands for D&D session orchestration:
 *   ask-player:       blocks until human responds via spectator web UI (or falls back)
 *   check-interrupt:  non-blocking check for unprompted human input
 *
 * Called by teammate agents via the Bash tool. Outputs JSON to stdout.
 * Communicates with the spectator web app via shared lock files in campaigns/{campaign}/tmp/.
 *
 * Per-character design: any player agent can call ask-player for its character.
 * Uses per-character lock files ({character}-prompt.json, {character}.auto)
 * so multiple human players can be active simultaneously.
 *
 * Usage:
 *   bun apps/spectator/cli.ts ask-player \
 *     --campaign the-dimming \
 *     --character eamon-lightward \
 *     --prompt "What do you do?" \
 *     --timeout 180 \
 *     --deadline 1710500000000
 *
 *   bun apps/spectator/cli.ts check-interrupt --campaign the-dimming
 */

import { resolve } from "path";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "fs";

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

function fp(campaign: string, name: string): string {
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

function output(data: Record<string, unknown>): void {
  process.stdout.write(JSON.stringify(data) + "\n");
}

function log(msg: string): void {
  process.stderr.write(`[spectator-cli] ${msg}\n`);
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
  deadlineMs: number
): Promise<unknown | null> {
  while (Date.now() < deadlineMs) {
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

async function waitWhileExists(path: string, deadlineMs: number): Promise<boolean> {
  while (existsSync(path)) {
    if (Date.now() >= deadlineMs) return false;
    await sleep(POLL_INTERVAL);
  }
  return true;
}

// --- Commands ---

async function askPlayer(args: Record<string, string>): Promise<void> {
  const campaign = args.campaign;
  const character = args.character;
  const prompt = args.prompt;
  const timeoutSeconds = parseInt(args.timeout || String(DEFAULT_TIMEOUT), 10);

  // Deadline: explicit --deadline (epoch ms) takes priority, else computed from --timeout
  const deadlineMs = args.deadline
    ? parseInt(args.deadline, 10)
    : Date.now() + timeoutSeconds * 1000;

  const pausePath = fp(campaign, "player.pause");
  const promptPath = fp(campaign, `${character}-prompt.json`);
  const responsePath = fp(campaign, `${character}-response.json`);
  const autoFlagPath = fp(campaign, `${character}.auto`);

  // 1. Check per-character auto mode first (fast path)
  if (existsSync(autoFlagPath)) {
    log(`${character} is in full-auto mode`);
    output({ mode: "full_auto", character });
    return;
  }

  // 2. Wait if session is paused
  if (existsSync(pausePath)) {
    log("Session paused, waiting...");
    const resumed = await waitWhileExists(pausePath, deadlineMs);
    if (!resumed) {
      log("Timeout while paused — AI takeover");
      output({ mode: "ai_takeover", character });
      return;
    }
    log("Session resumed");
  }

  // 3. Check spectator availability
  const spectatorUp = await spectatorIsUp();

  if (!spectatorUp) {
    log("Spectator not running, falling back to terminal");
    output({ mode: "terminal", character });
    return;
  }

  // 4. Write prompt for spectator to pick up
  writeJson(promptPath, {
    character,
    prompt,
    deadline: deadlineMs,
  });
  log(`${character}: prompt written, deadline ${new Date(deadlineMs).toISOString()}`);

  // 5. Wait for response
  const response = await waitForFile(responsePath, deadlineMs);

  // 6. Clean up
  deleteIfExists(promptPath);
  deleteIfExists(responsePath);

  if (!response) {
    log(`${character}: timeout — AI takeover this turn`);
    output({ mode: "ai_takeover", character });
    return;
  }

  const data = response as Record<string, unknown>;

  if (data.skip) {
    log(`${character}: skipped — AI takeover this turn`);
    output({ mode: "ai_takeover", character });
    return;
  }

  log(`${character}: got human response`);
  output({ mode: "web", character, response: data.message });
}

async function checkInterrupt(args: Record<string, string>): Promise<void> {
  const campaign = args.campaign;
  const lockPath = fp(campaign, "player.lock");
  const interruptPath = fp(campaign, "player-interrupt.json");
  const pausePath = fp(campaign, "player.pause");

  // Fast path — no interrupt
  if (!existsSync(lockPath)) {
    output({ interrupted: false });
    return;
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
    writeFileSync(fp(campaign, `${character}.auto`), "");
  } else if (modeChange === "human" && character) {
    deleteIfExists(fp(campaign, `${character}.auto`));
  } else if (modeChange === "pause") {
    writeFileSync(pausePath, "");
  }

  log(
    `Interrupt: ${data.message || "(mode change)"}` +
      (character ? ` [${character}]` : "") +
      (modeChange ? ` mode→${modeChange}` : "")
  );

  output({
    interrupted: true,
    message: data.message || null,
    character: character || null,
    mode_change: modeChange || null,
  });
}

// --- CLI Argument Parsing ---

function parseArgs(argv: string[]): { command: string; args: Record<string, string> } {
  const command = argv[0];
  const args: Record<string, string> = {};

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--") && i + 1 < argv.length) {
      const key = arg.slice(2);
      args[key] = argv[++i];
    }
  }

  return { command, args };
}

// --- Main ---

const { command, args } = parseArgs(process.argv.slice(2));

switch (command) {
  case "ask-player":
    if (!args.campaign || !args.character || !args.prompt) {
      log("Usage: cli.ts ask-player --campaign <name> --character <id> --prompt <text> [--timeout <seconds>] [--deadline <epoch-ms>]");
      process.exit(1);
    }
    await askPlayer(args);
    break;

  case "check-interrupt":
    if (!args.campaign) {
      log("Usage: cli.ts check-interrupt --campaign <name>");
      process.exit(1);
    }
    await checkInterrupt(args);
    break;

  default:
    log(`Unknown command: ${command}`);
    log("Commands: ask-player, check-interrupt");
    process.exit(1);
}
