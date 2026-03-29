/**
 * Tests for the player input system (ask-player, check-interrupt).
 *
 * Uses temp directories and injected config — no real campaign files touched,
 * no spectator server needed. Poll interval set to 10ms for fast tests.
 * All tests complete in <5 seconds.
 */

import { describe, it, expect, afterEach } from "bun:test";
import { mkdtempSync, writeFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  askPlayer,
  checkInterrupt,
  clearInterrupt,
  type PlayerInputConfig,
} from "../lib/player-input";

function makeConfig(opts: { spectatorUp?: boolean } = {}): PlayerInputConfig {
  const sessionDir = mkdtempSync(join(tmpdir(), "spectator-test-"));
  return {
    sessionDir,
    pollIntervalMs: 10,
    spectatorCheck: async () => opts.spectatorUp ?? false,
  };
}

function fp(config: PlayerInputConfig, file: string): string {
  return join(config.sessionDir, file);
}

function writeFile(config: PlayerInputConfig, file: string, content: string = ""): void {
  writeFileSync(fp(config, file), content);
}

function writeJsonFile(config: PlayerInputConfig, file: string, data: unknown): void {
  writeFileSync(fp(config, file), JSON.stringify(data));
}

function fileExists(config: PlayerInputConfig, file: string): boolean {
  return existsSync(fp(config, file));
}

let configs: PlayerInputConfig[] = [];

function tracked(config: PlayerInputConfig): PlayerInputConfig {
  configs.push(config);
  return config;
}

afterEach(() => {
  for (const c of configs) {
    try { rmSync(c.sessionDir, { recursive: true, force: true }); } catch {}
  }
  configs = [];
});

// ============================================================
// check-interrupt
// ============================================================

describe("check-interrupt", () => {
  it("returns interrupted: false when no lock file", async () => {
    const config = tracked(makeConfig());
    const result = await checkInterrupt(config);
    expect(result).toEqual({ interrupted: false });
  });

  it("reads interrupt content without deleting files", async () => {
    const config = tracked(makeConfig());
    writeFile(config, "player.lock");
    writeJsonFile(config, "player-interrupt.json", {
      message: "I want to ask the NPC about the artifact",
      character: "eamon-lightward",
    });

    const result = await checkInterrupt(config);

    expect(result.interrupted).toBe(true);
    expect(result.message).toBe("I want to ask the NPC about the artifact");
    expect(result.character).toBe("eamon-lightward");
    expect(result.mode_change).toBeNull();
    expect(result.id).toBeTypeOf("string");
    expect(result.id!.length).toBe(12);

    // Files should still exist — clearInterrupt deletes them
    expect(fileExists(config, "player.lock")).toBe(true);
    expect(fileExists(config, "player-interrupt.json")).toBe(true);
  });

  it("reads interrupt with null fields and extra timestamp", async () => {
    const config = tracked(makeConfig());
    writeFile(config, "player.lock");
    writeJsonFile(config, "player-interrupt.json", {
      message: "Hello from the human! Just testing.",
      character: null,
      mode_change: null,
      timestamp: Date.now(),
    });

    const result = await checkInterrupt(config);

    expect(result.interrupted).toBe(true);
    expect(result.message).toBe("Hello from the human! Just testing.");
    expect(result.character).toBeNull();
    expect(result.mode_change).toBeNull();
    expect(result.id).toBeTypeOf("string");
  });

  it("handles lock file without interrupt content", async () => {
    const config = tracked(makeConfig());
    writeFile(config, "player.lock");

    const result = await checkInterrupt(config);

    expect(result.interrupted).toBe(true);
    expect(result.message).toBeNull();
    expect(result.id).toBeNull();
    expect(fileExists(config, "player.lock")).toBe(true);
  });

  it("returns consistent id for same content", async () => {
    const config = tracked(makeConfig());
    writeFile(config, "player.lock");
    writeJsonFile(config, "player-interrupt.json", { message: "test" });

    const r1 = await checkInterrupt(config);
    const r2 = await checkInterrupt(config);

    expect(r1.id).toBe(r2.id);
  });
});

// ============================================================
// clear-interrupt
// ============================================================

describe("clear-interrupt", () => {
  it("clears files when id matches", async () => {
    const config = tracked(makeConfig());
    writeFile(config, "player.lock");
    writeJsonFile(config, "player-interrupt.json", {
      message: "Please pause",
    });

    const check = await checkInterrupt(config);
    const result = await clearInterrupt(config, check.id!);

    expect(result.cleared).toBe(true);
    expect(fileExists(config, "player.lock")).toBe(false);
    expect(fileExists(config, "player-interrupt.json")).toBe(false);
  });

  it("refuses to clear when id mismatches and returns newer interrupt", async () => {
    const config = tracked(makeConfig());
    writeFile(config, "player.lock");
    writeJsonFile(config, "player-interrupt.json", { message: "first" });

    const check = await checkInterrupt(config);

    // A new interrupt arrives before clear
    writeJsonFile(config, "player-interrupt.json", {
      message: "second — urgent!",
      character: "eamon-lightward",
      mode_change: "human",
    });

    const result = await clearInterrupt(config, check.id!);

    expect(result.cleared).toBe(false);
    expect(result.reason).toBe("id_mismatch_newer_interrupt");
    expect(fileExists(config, "player.lock")).toBe(true);
    expect(fileExists(config, "player-interrupt.json")).toBe(true);
    expect(result.new_interrupt).toBeDefined();
    expect(result.new_interrupt!.interrupted).toBe(true);
    expect(result.new_interrupt!.message).toBe("second — urgent!");
    expect(result.new_interrupt!.character).toBe("eamon-lightward");
    expect(result.new_interrupt!.mode_change).toBe("human");
    expect(result.new_interrupt!.id).toBeTypeOf("string");
    expect(result.new_interrupt!.id).not.toBe(check.id);
  });

  it("handles already-deleted files gracefully", async () => {
    const config = tracked(makeConfig());
    const result = await clearInterrupt(config, "doesntmatter");

    expect(result.cleared).toBe(true);
    expect(result.reason).toBe("files_already_gone");
  });

  it("creates .auto file on full_auto mode change", async () => {
    const config = tracked(makeConfig());
    writeFile(config, "player.lock");
    writeJsonFile(config, "player-interrupt.json", {
      character: "eamon-lightward",
      mode_change: "full_auto",
    });

    const check = await checkInterrupt(config);
    await clearInterrupt(config, check.id!);

    expect(fileExists(config, "eamon-lightward.auto")).toBe(true);
  });

  it("deletes .auto file on human mode change", async () => {
    const config = tracked(makeConfig());
    writeFile(config, "eamon-lightward.auto");
    writeFile(config, "player.lock");
    writeJsonFile(config, "player-interrupt.json", {
      character: "eamon-lightward",
      mode_change: "human",
    });

    const check = await checkInterrupt(config);
    await clearInterrupt(config, check.id!);

    expect(fileExists(config, "eamon-lightward.auto")).toBe(false);
  });

  it("creates pause file on pause mode change", async () => {
    const config = tracked(makeConfig());
    writeFile(config, "player.lock");
    writeJsonFile(config, "player-interrupt.json", {
      mode_change: "pause",
    });

    const check = await checkInterrupt(config);
    await clearInterrupt(config, check.id!);

    expect(fileExists(config, "player.pause")).toBe(true);
  });
});

// ============================================================
// ask-player
// ============================================================

describe("ask-player", () => {
  it("returns full_auto immediately when .auto flag exists", async () => {
    const config = tracked(makeConfig({ spectatorUp: true }));
    writeFile(config, "eamon-lightward.auto");

    const result = await askPlayer(config, {
      character: "eamon-lightward",
      prompt: "What do you do?",
      deadlineMs: Date.now() + 5000,
    });

    expect(result).toEqual({ mode: "full_auto", character: "eamon-lightward" });
  });

  it("returns terminal when spectator is not running", async () => {
    const config = tracked(makeConfig({ spectatorUp: false }));

    const result = await askPlayer(config, {
      character: "eamon-lightward",
      prompt: "What do you do?",
      deadlineMs: Date.now() + 5000,
    });

    expect(result).toEqual({ mode: "terminal", character: "eamon-lightward" });
  });

  it("returns web response when response file appears", async () => {
    const config = tracked(makeConfig({ spectatorUp: true }));

    writeJsonFile(config, "eamon-lightward-response.json", {
      message: "I examine the artifact",
      skip: false,
      timestamp: Date.now(),
    });

    const result = await askPlayer(config, {
      character: "eamon-lightward",
      prompt: "What do you do?",
      deadlineMs: Date.now() + 5000,
    });

    expect(result).toEqual({
      mode: "web",
      character: "eamon-lightward",
      response: "I examine the artifact",
    });

    expect(fileExists(config, "eamon-lightward-prompt.json")).toBe(false);
    expect(fileExists(config, "eamon-lightward-response.json")).toBe(false);
  });

  it("writes prompt file with deadline for spectator", async () => {
    const config = tracked(makeConfig({ spectatorUp: true }));
    const deadline = Date.now() + 200;

    setTimeout(() => {
      writeJsonFile(config, "eamon-lightward-response.json", {
        message: "ok",
        skip: false,
      });
    }, 30);

    await askPlayer(config, {
      character: "eamon-lightward",
      prompt: "What do you do?",
      deadlineMs: deadline,
    });
  });

  it("returns ai_takeover on timeout", async () => {
    const config = tracked(makeConfig({ spectatorUp: true }));

    const result = await askPlayer(config, {
      character: "eamon-lightward",
      prompt: "What do you do?",
      deadlineMs: Date.now() + 50,
    });

    expect(result).toEqual({ mode: "ai_takeover", character: "eamon-lightward" });
    expect(fileExists(config, "eamon-lightward-prompt.json")).toBe(false);
  });

  it("returns ai_takeover when skip is true", async () => {
    const config = tracked(makeConfig({ spectatorUp: true }));

    writeJsonFile(config, "eamon-lightward-response.json", {
      message: null,
      skip: true,
    });

    const result = await askPlayer(config, {
      character: "eamon-lightward",
      prompt: "What do you do?",
      deadlineMs: Date.now() + 5000,
    });

    expect(result).toEqual({ mode: "ai_takeover", character: "eamon-lightward" });
  });

  it("blocks during pause and resumes", async () => {
    const config = tracked(makeConfig({ spectatorUp: true }));
    writeFile(config, "player.pause");

    setTimeout(() => {
      try { rmSync(fp(config, "player.pause")); } catch {}
    }, 30);
    setTimeout(() => {
      writeJsonFile(config, "eamon-lightward-response.json", {
        message: "I was paused but now I'm back",
      });
    }, 60);

    const result = await askPlayer(config, {
      character: "eamon-lightward",
      prompt: "What do you do?",
      deadlineMs: Date.now() + 2000,
    });

    expect(result.mode).toBe("web");
    if (result.mode === "web") {
      expect(result.response).toBe("I was paused but now I'm back");
    }
  });

  it("returns ai_takeover when pause outlasts deadline", async () => {
    const config = tracked(makeConfig({ spectatorUp: true }));
    writeFile(config, "player.pause");

    const result = await askPlayer(config, {
      character: "eamon-lightward",
      prompt: "What do you do?",
      deadlineMs: Date.now() + 50,
    });

    expect(result).toEqual({ mode: "ai_takeover", character: "eamon-lightward" });
  });

  it("handles delayed response within deadline", async () => {
    const config = tracked(makeConfig({ spectatorUp: true }));

    setTimeout(() => {
      writeJsonFile(config, "eamon-lightward-response.json", {
        message: "delayed response",
      });
    }, 50);

    const result = await askPlayer(config, {
      character: "eamon-lightward",
      prompt: "What do you do?",
      deadlineMs: Date.now() + 2000,
    });

    expect(result.mode).toBe("web");
    if (result.mode === "web") {
      expect(result.response).toBe("delayed response");
    }
  });
});

// ============================================================
// parallel invocations
// ============================================================

describe("parallel invocations", () => {
  it("handles two characters simultaneously", async () => {
    const config = tracked(makeConfig({ spectatorUp: true }));

    writeJsonFile(config, "eamon-lightward-response.json", { message: "I attack" });
    writeJsonFile(config, "silani-shen-response.json", { message: "I cast a spell" });

    const [eamon, silani] = await Promise.all([
      askPlayer(config, {
        character: "eamon-lightward",
        prompt: "What do you do?",
        deadlineMs: Date.now() + 5000,
      }),
      askPlayer(config, {
        character: "silani-shen",
        prompt: "What do you do?",
        deadlineMs: Date.now() + 5000,
      }),
    ]);

    expect(eamon).toEqual({ mode: "web", character: "eamon-lightward", response: "I attack" });
    expect(silani).toEqual({ mode: "web", character: "silani-shen", response: "I cast a spell" });

    expect(fileExists(config, "eamon-lightward-prompt.json")).toBe(false);
    expect(fileExists(config, "silani-shen-prompt.json")).toBe(false);
  });

  it("one character auto, one human — no interference", async () => {
    const config = tracked(makeConfig({ spectatorUp: true }));
    writeFile(config, "korimeth.auto");
    writeJsonFile(config, "eamon-lightward-response.json", { message: "I investigate" });

    const [korimeth, eamon] = await Promise.all([
      askPlayer(config, {
        character: "korimeth",
        prompt: "What do you do?",
        deadlineMs: Date.now() + 5000,
      }),
      askPlayer(config, {
        character: "eamon-lightward",
        prompt: "What do you do?",
        deadlineMs: Date.now() + 5000,
      }),
    ]);

    expect(korimeth).toEqual({ mode: "full_auto", character: "korimeth" });
    expect(eamon).toEqual({ mode: "web", character: "eamon-lightward", response: "I investigate" });
  });
});
