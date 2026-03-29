#!/usr/bin/env bun
/**
 * Spectator Input CLI
 *
 * Thin wrapper around lib/player-input.ts. Called by teammate agents via the
 * Bash tool. Outputs JSON to stdout, logs to stderr.
 *
 * Player input state lives in {playthrough}/spectator/. Agents pass the
 * directory via --dir.
 *
 * Usage:
 *   bun apps/spectator/cli.ts ask-player \
 *     --dir playthroughs/the-dimming/playthrough-1/spectator \
 *     --character eamon-lightward \
 *     --prompt "What do you do?" \
 *     --timeout 180 \
 *     --deadline 1710500000000
 *
 *   bun apps/spectator/cli.ts check-interrupt --dir playthroughs/the-dimming/playthrough-1/spectator
 *   bun apps/spectator/cli.ts check-interrupt --dir playthroughs/the-dimming/playthrough-1/spectator --id def456 --clear
 */

import { askPlayer, checkInterrupt, clearInterrupt, type PlayerInputConfig } from "./lib/player-input";

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

const BOOLEAN_FLAGS = new Set(["clear"]);

function parseArgs(argv: string[]): { command: string; args: Record<string, string> } {
  const command = argv[0];
  const args: Record<string, string> = {};
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (BOOLEAN_FLAGS.has(key)) {
        args[key] = "true";
      } else if (i + 1 < argv.length) {
        args[key] = argv[++i];
      }
    }
  }
  return { command, args };
}

const { command, args } = parseArgs(process.argv.slice(2));

if (!args.dir) {
  log(`Missing --dir. Usage: cli.ts <command> --dir <playthrough/spectator/path> ...`);
  process.exit(1);
}

const config: PlayerInputConfig = {
  sessionDir: args.dir,
  pollIntervalMs: 500,
  spectatorCheck: spectatorIsUp,
};

switch (command) {
  case "ask-player": {
    if (!args.character || !args.prompt) {
      log("Usage: cli.ts ask-player --dir <path> --character <id> --prompt <text> [--choices <json-array>] [--timeout <seconds>] [--deadline <epoch-ms>]");
      process.exit(1);
    }
    const timeoutSeconds = parseInt(args.timeout || String(DEFAULT_TIMEOUT), 10);
    const deadlineMs = args.deadline
      ? parseInt(args.deadline, 10)
      : Date.now() + timeoutSeconds * 1000;

    let choices: string[] | undefined;
    if (args.choices) {
      try { choices = JSON.parse(args.choices); } catch {
        log(`Invalid --choices JSON: ${args.choices}`);
        process.exit(1);
      }
    }

    const result = await askPlayer(config, {
      character: args.character,
      prompt: args.prompt,
      deadlineMs,
      choices,
    });
    log(`${args.character}: ${result.mode}`);
    process.stdout.write(JSON.stringify(result) + "\n");
    break;
  }

  case "check-interrupt": {
    if (args.clear !== undefined) {
      if (!args.id) {
        log("--clear requires --id");
        process.exit(1);
      }
      const result = await clearInterrupt(config, args.id);
      if (!result.cleared) {
        log(`Clear failed: ${result.reason}`);
      }
      process.stdout.write(JSON.stringify(result) + "\n");
    } else {
      const result = await checkInterrupt(config);
      if (result.interrupted) {
        log(`Interrupt: ${result.message || "(mode change)"}${result.character ? ` [${result.character}]` : ""}${result.mode_change ? ` mode→${result.mode_change}` : ""}`);
      }
      process.stdout.write(JSON.stringify(result) + "\n");
    }
    break;
  }

  default:
    log(`Unknown command: ${command}`);
    log("Commands: ask-player, check-interrupt");
    process.exit(1);
}
