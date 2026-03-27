/**
 * Tests for the subagent JSONL parser — verifies that direct agent-to-agent
 * messages are extracted while parent-JSONL duplicates are skipped.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import {
  parseSubagentLine,
  createSubagentParser,
  resetSubagentParserState,
} from "../lib/subagent-parser";

// Helper: build a JSONL line for an assistant with SendMessage tool_use
function sendMsg(to: string, content: string, opts: { type?: string } = {}): string {
  return JSON.stringify({
    type: "assistant",
    timestamp: "2026-03-26T19:00:00Z",
    message: {
      content: [
        {
          type: "tool_use",
          id: "tool_sub_1",
          name: "SendMessage",
          input: {
            to,
            content,
            ...(opts.type ? { type: opts.type } : {}),
          },
        },
      ],
    },
  });
}

beforeEach(() => {
  resetSubagentParserState();
});

describe("subagent parser — direct messages", () => {
  it("extracts PLAYER_TO_PLAYER message", () => {
    const line = sendMsg(
      "drakkenne",
      "[PLAYER_TO_PLAYER]\nfrom: verdakho\nto: drakkenne\n\n*whispers* I saw something in the tunnel."
    );
    const events = parseSubagentLine(line, "verdakho");
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("player_to_player");
    expect(events[0].from).toBe("verdakho");
    expect(events[0].to).toBe("drakkenne");
    expect(events[0].content).toContain("I saw something in the tunnel");
    expect(events[0].content).not.toContain("[PLAYER_TO_PLAYER]");
    expect(events[0].content).not.toContain("from: verdakho");
  });

  it("extracts PLAYER_TO_GM message", () => {
    const line = sendMsg(
      "gm",
      "[PLAYER_TO_GM]\ntype: ACTION\ncharacter: verdakho\n\nI search the room carefully."
    );
    const events = parseSubagentLine(line, "verdakho");
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("player_to_gm");
    expect(events[0].from).toBe("verdakho");
    expect(events[0].to).toBe("gm");
    expect(events[0].content).toBe("I search the room carefully.");
  });

  it("extracts GM_TO_PLAYER from GM subagent", () => {
    const line = sendMsg(
      "verdakho",
      "[GM_TO_PLAYER]\ncharacter: verdakho\nrequest_type: FULL_CONTEXT\n\n## Request\nWhat do you do?"
    );
    const events = parseSubagentLine(line, "gm");
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("gm_to_player");
    expect(events[0].from).toBe("gm");
    expect(events[0].to).toBe("verdakho");
    expect(events[0].parsed.requestType).toBe("FULL_CONTEXT");
  });

  it("extracts dice rolls from content", () => {
    const line = sendMsg(
      "gm",
      "[PLAYER_TO_GM]\ncharacter: eamon\n\nAttack: 1d20+5 = [18]+5 = 23"
    );
    const events = parseSubagentLine(line, "eamon");
    expect(events).toHaveLength(1);
    expect(events[0].parsed.diceRolls).toHaveLength(1);
  });
});

describe("subagent parser — deduplication", () => {
  it("skips messages to team-lead", () => {
    const line = sendMsg("team-lead", "Verdakho is ready.");
    const events = parseSubagentLine(line, "verdakho");
    expect(events).toHaveLength(0);
  });

  it("skips broadcast messages", () => {
    const line = sendMsg("*", "[NARRATIVE]\n\nThe sun rises.");
    const events = parseSubagentLine(line, "gm");
    expect(events).toHaveLength(0);
  });

  it("skips shutdown_approved messages", () => {
    const line = JSON.stringify({
      type: "assistant",
      timestamp: "2026-03-26T19:00:00Z",
      message: {
        content: [
          {
            type: "tool_use",
            id: "tool_sd_app",
            name: "SendMessage",
            input: { to: "narrator", type: "shutdown_approved" },
          },
        ],
      },
    });
    const events = parseSubagentLine(line, "gm");
    expect(events).toHaveLength(0);
  });

  it("skips shutdown_request messages", () => {
    const line = JSON.stringify({
      type: "assistant",
      timestamp: "2026-03-26T19:00:00Z",
      message: {
        content: [
          {
            type: "tool_use",
            id: "tool_sd",
            name: "SendMessage",
            input: { to: "narrator", type: "shutdown_request" },
          },
        ],
      },
    });
    const events = parseSubagentLine(line, "gm");
    expect(events).toHaveLength(0);
  });
});

describe("subagent parser — non-assistant records", () => {
  it("skips user records (incoming teammate messages)", () => {
    const line = JSON.stringify({
      type: "user",
      timestamp: "2026-03-26T19:00:00Z",
      message: {
        content: '<teammate-message teammate_id="gm">\n[GM_TO_PLAYER]\nSomething\n</teammate-message>',
      },
    });
    const events = parseSubagentLine(line, "verdakho");
    expect(events).toHaveLength(0);
  });

  it("skips malformed lines", () => {
    expect(parseSubagentLine("not json", "verdakho")).toEqual([]);
    expect(parseSubagentLine("", "verdakho")).toEqual([]);
  });
});

describe("createSubagentParser", () => {
  it("creates a bound parser function", () => {
    const parser = createSubagentParser("drakkenne");
    const line = sendMsg("gm", "[PLAYER_TO_GM]\ncharacter: drakkenne\n\nI stand guard.");
    const events = parser(line);
    expect(events).toHaveLength(1);
    expect(events[0].from).toBe("drakkenne");
  });

  it("returns LineParser-compatible function", () => {
    const parser = createSubagentParser("lasinne");
    // Should accept a single string argument and return SpectatorEvent[]
    expect(typeof parser).toBe("function");
    expect(parser("{}")).toEqual([]);
  });
});

describe("subagent parser — multiple SendMessages in one line", () => {
  it("extracts multiple direct messages, skips team-lead messages", () => {
    const line = JSON.stringify({
      type: "assistant",
      timestamp: "2026-03-26T19:00:00Z",
      message: {
        content: [
          {
            type: "tool_use",
            id: "t1",
            name: "SendMessage",
            input: { to: "team-lead", content: "Ready." },
          },
          {
            type: "tool_use",
            id: "t2",
            name: "SendMessage",
            input: { to: "drakkenne", content: "[PLAYER_TO_PLAYER]\nfrom: verdakho\nto: drakkenne\n\nWatch the door." },
          },
          {
            type: "tool_use",
            id: "t3",
            name: "SendMessage",
            input: { to: "gm", content: "[PLAYER_TO_GM]\ncharacter: verdakho\n\nI signal Drakkenne." },
          },
        ],
      },
    });
    const events = parseSubagentLine(line, "verdakho");
    expect(events).toHaveLength(2);
    expect(events[0].to).toBe("drakkenne");
    expect(events[1].to).toBe("gm");
  });
});
