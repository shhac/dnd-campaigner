/**
 * Core logic for player input: ask-player and check-interrupt.
 *
 * Extracted from cli.ts for testability. All I/O goes through injected config
 * so tests can use temp dirs, mock the spectator check, and control timing.
 *
 * Player input state lives in {playthrough}/spectator/ — scoped to the
 * playthrough and persisted across sessions.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import { createHash } from "crypto";

export interface PlayerInputConfig {
  sessionDir: string;
  pollIntervalMs: number;
  spectatorCheck: () => Promise<boolean>;
}

export interface AskPlayerArgs {
  character: string;
  prompt: string;
  deadlineMs: number;
  choices?: string[];
}

export type AskPlayerResult =
  | { mode: "full_auto"; character: string }
  | { mode: "ai_takeover"; character: string }
  | { mode: "terminal"; character: string }
  | { mode: "web"; character: string; response: string };

export interface CheckInterruptResult {
  interrupted: boolean;
  id?: string | null;
  message?: string | null;
  character?: string | null;
  mode_change?: string | null;
}

export interface ClearInterruptResult {
  cleared: boolean;
  reason?: string;
  /** On id_mismatch, includes the newer interrupt so the caller doesn't need another round trip */
  new_interrupt?: CheckInterruptResult;
}

// --- Helpers ---

function ensureDir(config: PlayerInputConfig): string {
  mkdirSync(config.sessionDir, { recursive: true });
  return config.sessionDir;
}

function fp(config: PlayerInputConfig, name: string): string {
  return join(ensureDir(config), name);
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
        return JSON.parse(readFileSync(path, "utf-8"));
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

function hashContent(raw: string): string {
  return createHash("sha1").update(raw).digest("hex").slice(0, 12);
}

// --- Commands ---

export async function askPlayer(
  config: PlayerInputConfig,
  args: AskPlayerArgs
): Promise<AskPlayerResult> {
  const { character, prompt, deadlineMs, choices } = args;

  const pausePath = fp(config, "player.pause");
  const promptPath = fp(config, `${character}-prompt.json`);
  const responsePath = fp(config, `${character}-response.json`);
  const autoFlagPath = fp(config, `${character}.auto`);

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
  const promptData: Record<string, unknown> = { character, prompt, deadline: deadlineMs };
  if (choices?.length) promptData.choices = choices;
  writeJson(promptPath, promptData);

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
  config: PlayerInputConfig
): Promise<CheckInterruptResult> {
  const lockPath = fp(config, "player.lock");
  const interruptPath = fp(config, "player-interrupt.json");

  // Fast path — no interrupt
  if (!existsSync(lockPath)) {
    return { interrupted: false };
  }

  // Read interrupt — do NOT delete files (that's clearInterrupt's job)
  let raw = "";
  let data: Record<string, unknown> = {};
  try {
    raw = readFileSync(interruptPath, "utf-8");
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Lock exists but no content — treat as empty interrupt
  }

  const id = raw ? hashContent(raw) : null;

  return {
    interrupted: true,
    id,
    message: (data.message as string) || null,
    character: (data.character as string) || null,
    mode_change: (data.mode_change as string) || null,
  };
}

export async function clearInterrupt(
  config: PlayerInputConfig,
  id: string
): Promise<ClearInterruptResult> {
  const lockPath = fp(config, "player.lock");
  const interruptPath = fp(config, "player-interrupt.json");
  const pausePath = fp(config, "player.pause");

  // Verify the interrupt hasn't changed since check
  let raw = "";
  try {
    raw = readFileSync(interruptPath, "utf-8");
  } catch {
    // File already gone
    deleteIfExists(lockPath);
    return { cleared: true, reason: "files_already_gone" };
  }

  const currentId = hashContent(raw);
  if (currentId !== id) {
    let newData: Record<string, unknown> = {};
    try { newData = JSON.parse(raw) as Record<string, unknown>; } catch {}
    return {
      cleared: false,
      reason: "id_mismatch_newer_interrupt",
      new_interrupt: {
        interrupted: true,
        id: currentId,
        message: (newData.message as string) || null,
        character: (newData.character as string) || null,
        mode_change: (newData.mode_change as string) || null,
      },
    };
  }

  // Parse for mode change processing
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Malformed — clear anyway since ID matched
  }

  // Handle mode changes (per-character or global)
  const modeChange = data.mode_change as string | undefined;
  const character = data.character as string | undefined;

  if (modeChange === "full_auto" && character) {
    writeFileSync(fp(config, `${character}.auto`), "");
  } else if (modeChange === "human" && character) {
    deleteIfExists(fp(config, `${character}.auto`));
  } else if (modeChange === "pause") {
    writeFileSync(pausePath, "");
  }

  // Now delete the interrupt files
  deleteIfExists(lockPath);
  deleteIfExists(interruptPath);
  return { cleared: true };
}

