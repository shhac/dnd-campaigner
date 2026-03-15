/**
 * Core logic for player input: ask-player and check-interrupt.
 *
 * Extracted from cli.ts for testability. All I/O goes through injected config
 * so tests can use temp dirs, mock the spectator check, and control timing.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "fs";
import { resolve } from "path";

export interface PlayerInputConfig {
  repoRoot: string;
  pollIntervalMs: number;
  spectatorCheck: () => Promise<boolean>;
}

export interface AskPlayerArgs {
  campaign: string;
  character: string;
  prompt: string;
  deadlineMs: number;
}

export type AskPlayerResult =
  | { mode: "full_auto"; character: string }
  | { mode: "ai_takeover"; character: string }
  | { mode: "terminal"; character: string }
  | { mode: "web"; character: string; response: string };

export interface CheckInterruptResult {
  interrupted: boolean;
  message?: string | null;
  character?: string | null;
  mode_change?: string | null;
}

// --- Helpers ---

function tmpDir(config: PlayerInputConfig, campaign: string): string {
  const dir = resolve(config.repoRoot, "campaigns", campaign, "tmp");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function fp(config: PlayerInputConfig, campaign: string, name: string): string {
  return resolve(tmpDir(config, campaign), name);
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

async function waitForFile(
  path: string,
  deadlineMs: number,
  pollMs: number
): Promise<unknown | null> {
  while (Date.now() < deadlineMs) {
    if (existsSync(path)) {
      try {
        return readJson(path);
      } catch {
        // Partial write — retry
      }
    }
    await sleep(pollMs);
  }
  return null;
}

async function waitWhileExists(
  path: string,
  deadlineMs: number,
  pollMs: number
): Promise<boolean> {
  while (existsSync(path)) {
    if (Date.now() >= deadlineMs) return false;
    await sleep(pollMs);
  }
  return true;
}

// --- Commands ---

export async function askPlayer(
  config: PlayerInputConfig,
  args: AskPlayerArgs
): Promise<AskPlayerResult> {
  const { campaign, character, prompt, deadlineMs } = args;

  const pausePath = fp(config, campaign, "player.pause");
  const promptPath = fp(config, campaign, `${character}-prompt.json`);
  const responsePath = fp(config, campaign, `${character}-response.json`);
  const autoFlagPath = fp(config, campaign, `${character}.auto`);

  // 1. Check per-character auto mode first (fast path)
  if (existsSync(autoFlagPath)) {
    return { mode: "full_auto", character };
  }

  // 2. Wait if session is paused
  if (existsSync(pausePath)) {
    const resumed = await waitWhileExists(pausePath, deadlineMs, config.pollIntervalMs);
    if (!resumed) {
      return { mode: "ai_takeover", character };
    }
  }

  // 3. Check spectator availability
  const spectatorUp = await config.spectatorCheck();

  if (!spectatorUp) {
    return { mode: "terminal", character };
  }

  // 4. Write prompt for spectator to pick up
  writeJson(promptPath, {
    character,
    prompt,
    deadline: deadlineMs,
  });

  // 5. Wait for response
  const response = await waitForFile(responsePath, deadlineMs, config.pollIntervalMs);

  // 6. Clean up
  deleteIfExists(promptPath);
  deleteIfExists(responsePath);

  if (!response) {
    return { mode: "ai_takeover", character };
  }

  const data = response as Record<string, unknown>;

  if (data.skip) {
    return { mode: "ai_takeover", character };
  }

  return { mode: "web", character, response: data.message as string };
}

export async function checkInterrupt(
  config: PlayerInputConfig,
  campaign: string
): Promise<CheckInterruptResult> {
  const lockPath = fp(config, campaign, "player.lock");
  const interruptPath = fp(config, campaign, "player-interrupt.json");
  const pausePath = fp(config, campaign, "player.pause");

  // Fast path — no interrupt
  if (!existsSync(lockPath)) {
    return { interrupted: false };
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
    writeFileSync(fp(config, campaign, `${character}.auto`), "");
  } else if (modeChange === "human" && character) {
    deleteIfExists(fp(config, campaign, `${character}.auto`));
  } else if (modeChange === "pause") {
    writeFileSync(pausePath, "");
  }

  return {
    interrupted: true,
    message: (data.message as string) || null,
    character: character || null,
    mode_change: modeChange || null,
  };
}
