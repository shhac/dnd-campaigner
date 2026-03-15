#!/usr/bin/env bun
/**
 * Spectator Input CLI
 *
 * Thin wrapper around lib/player-input.ts. Called by teammate agents via the
 * Bash tool. Outputs JSON to stdout, logs to stderr.
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
import { askPlayer, checkInterrupt, clearInterrupt, type PlayerInputConfig } from "./lib/player-input";

const REPO_ROOT = resolve(import.meta.dir, "../..");
const DEFAULT_TIMEOUT = 180;
const HEALTH_TIMEOUT = 1000;

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

const config: PlayerInputConfig = {
  repoRoot: REPO_ROOT,
  pollIntervalMs: 500,
  spectatorCheck: spectatorIsUp,
};

function parseArgs(argv: string[]): { command: string; args: Record<string, string> } {
  const command = argv[0];
  const args: Record<string, string> = {};
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--") && i + 1 < argv.length) {
      args[arg.slice(2)] = argv[++i];
    }
  }
  return { command, args };
}

const { command, args } = parseArgs(process.argv.slice(2));

switch (command) {
  case "ask-player": {
    if (!args.campaign || !args.character || !args.prompt) {
      log("Usage: cli.ts ask-player --campaign <name> --character <id> --prompt <text> [--timeout <seconds>] [--deadline <epoch-ms>]");
      process.exit(1);
    }
    const timeoutSeconds = parseInt(args.timeout || String(DEFAULT_TIMEOUT), 10);
    const deadlineMs = args.deadline
      ? parseInt(args.deadline, 10)
      : Date.now() + timeoutSeconds * 1000;

    const result = await askPlayer(config, {
      campaign: args.campaign,
      character: args.character,
      prompt: args.prompt,
      deadlineMs,
    });
    log(`${args.character}: ${result.mode}`);
    process.stdout.write(JSON.stringify(result) + "\n");
    break;
  }

  case "check-interrupt": {
    if (!args.campaign) {
      log("Usage: cli.ts check-interrupt --campaign <name>");
      process.exit(1);
    }
    const result = await checkInterrupt(config, args.campaign);
    if (result.interrupted) {
      log(`Interrupt: ${result.message || "(mode change)"}${result.character ? ` [${result.character}]` : ""}${result.mode_change ? ` mode→${result.mode_change}` : ""}`);
    }
    process.stdout.write(JSON.stringify(result) + "\n");
    break;
  }

  case "clear-interrupt": {
    if (!args.campaign || !args.id) {
      log("Usage: cli.ts clear-interrupt --campaign <name> --id <hash>");
      process.exit(1);
    }
    const result = await clearInterrupt(config, args.campaign, args.id);
    if (!result.cleared) {
      log(`Clear failed: ${result.reason}`);
    }
    process.stdout.write(JSON.stringify(result) + "\n");
    break;
  }

  default:
    log(`Unknown command: ${command}`);
    log("Commands: ask-player, check-interrupt, clear-interrupt");
    process.exit(1);
}
