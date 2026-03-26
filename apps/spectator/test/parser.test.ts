/**
 * Tests for the JSONL parser — verifies event extraction, agent attribution,
 * content stripping, and deduplication logic.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import {
  parseLine,
  resetParserState,
  extractTag,
  extractFields,
  extractDiceRolls,
  stripMetadataFields,
} from "../lib/parser";

// Helper: build a JSONL line for a teammate-message
function teammateMsg(
  id: string,
  content: string,
  opts: { color?: string; summary?: string } = {}
): string {
  const color = opts.color ? ` color="${opts.color}"` : "";
  const summary = opts.summary ? ` summary="${opts.summary}"` : "";
  return JSON.stringify({
    type: "user",
    timestamp: "2026-03-26T18:30:00Z",
    message: {
      content: `<teammate-message teammate_id="${id}"${color}${summary}>\n${content}\n</teammate-message>`,
    },
  });
}

// Helper: build a JSONL line for an assistant with tool_use blocks
function assistantMsg(blocks: object[]): string {
  return JSON.stringify({
    type: "assistant",
    timestamp: "2026-03-26T18:30:00Z",
    message: { content: blocks },
  });
}

// Helper: build a JSONL line for a user message with tool_result blocks
function userToolResult(blocks: object[]): string {
  return JSON.stringify({
    type: "user",
    timestamp: "2026-03-26T18:31:00Z",
    message: { content: blocks },
  });
}

beforeEach(() => {
  resetParserState();
});

// === Helper functions ===

describe("extractTag", () => {
  it("extracts protocol tag from content", () => {
    expect(extractTag("[NARRATIVE]\nSome content")).toBe("NARRATIVE");
    expect(extractTag("[GM_TO_PLAYER]\ncharacter: eamon")).toBe("GM_TO_PLAYER");
    expect(extractTag("[SESSION_COMMAND]\ncommand: start")).toBe("SESSION_COMMAND");
  });

  it("returns undefined for no tag", () => {
    expect(extractTag("Just plain content")).toBeUndefined();
    expect(extractTag("")).toBeUndefined();
  });

  it("only matches at start of string", () => {
    expect(extractTag("Some text [NARRATIVE] here")).toBeUndefined();
  });
});

describe("extractFields", () => {
  it("extracts key-value pairs", () => {
    const fields = extractFields("character: eamon\nrequest_type: FULL_CONTEXT\n\nBody text");
    expect(fields.character).toBe("eamon");
    expect(fields.request_type).toBe("FULL_CONTEXT");
  });

  it("handles fields with colons in values", () => {
    const fields = extractFields('doing: journaling the encounter — writing: "thoughts"');
    expect(fields.doing).toBe('journaling the encounter — writing: "thoughts"');
  });

  it("returns empty for no fields", () => {
    expect(extractFields("Just plain text\nMore text")).toEqual({});
  });
});

describe("extractDiceRolls", () => {
  it("extracts result patterns", () => {
    const rolls = extractDiceRolls("Attack: 1d20+5 = [14]+5 = 19");
    expect(rolls).toHaveLength(1);
    expect(rolls[0]).toContain("1d20+5");
  });

  it("extracts Roll Required patterns", () => {
    const rolls = extractDiceRolls("Roll Required: Persuasion (1d20+4)");
    expect(rolls).toHaveLength(1);
    expect(rolls[0]).toContain("Persuasion");
  });

  it("returns empty for no dice", () => {
    expect(extractDiceRolls("No dice here")).toEqual([]);
  });
});

describe("stripMetadataFields", () => {
  it("strips metadata lines from the top", () => {
    const result = stripMetadataFields("character: eamon\nrequest_type: FULL_CONTEXT\n\nThe actual body");
    expect(result).toBe("The actual body");
  });

  it("strips blank lines between metadata and body", () => {
    const result = stripMetadataFields("type: ACTION\n\n\nBody here");
    expect(result).toBe("Body here");
  });

  it("preserves content when no metadata", () => {
    const result = stripMetadataFields("Just body text\nMore text");
    expect(result).toBe("Just body text\nMore text");
  });

  it("strips all known metadata keys", () => {
    const input = "type: x\ncharacter: y\nscene_number: 1\nscene_slug: test\nrequest_type: z\nrecipient: a\nto: b\n\nBody";
    expect(stripMetadataFields(input)).toBe("Body");
  });
});

// === Teammate messages ===

describe("teammate-message parsing", () => {
  it("parses NARRATIVE broadcast", () => {
    const events = parseLine(teammateMsg("gm", "[NARRATIVE]\n\nThe sun rises over the hills."));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("narrative");
    expect(events[0].from).toBe("gm");
    expect(events[0].to).toBe("*");
    expect(events[0].parsed.tag).toBe("NARRATIVE");
    expect(events[0].content).not.toContain("[NARRATIVE]");
  });

  it("parses PLAYER_TO_GM with metadata stripped", () => {
    const content = "[PLAYER_TO_GM]\ntype: ACTION\ncharacter: eamon\n\nI draw my sword and charge.";
    const events = parseLine(teammateMsg("eamon", content));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("player_to_gm");
    expect(events[0].from).toBe("eamon");
    expect(events[0].to).toBe("gm");
    expect(events[0].content).toBe("I draw my sword and charge.");
    expect(events[0].content).not.toContain("character:");
    expect(events[0].parsed.actionType).toBe("ACTION");
    expect(events[0].parsed.character).toBe("eamon");
  });

  it("parses GM_TO_PLAYER with character as recipient", () => {
    const content = "[GM_TO_PLAYER]\ncharacter: eamon\nrequest_type: FULL_CONTEXT\n\nWhat do you do?";
    const events = parseLine(teammateMsg("gm", content));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("gm_to_player");
    expect(events[0].from).toBe("gm");
    expect(events[0].to).toBe("eamon");
  });

  it("resolves GM recipient from character field when no to field", () => {
    const content = "character: verdakho\n\nYou see the stables ahead.";
    const events = parseLine(teammateMsg("gm", content));
    expect(events).toHaveLength(1);
    expect(events[0].from).toBe("gm");
    expect(events[0].to).toBe("verdakho");
  });

  it("defaults to gm as recipient for non-GM senders", () => {
    const content = "Ready to go. Waiting for the GM.";
    const events = parseLine(teammateMsg("eamon", content));
    expect(events).toHaveLength(1);
    expect(events[0].to).toBe("gm");
  });

  it("parses idle notification JSON", () => {
    const json = JSON.stringify({
      type: "idle_notification",
      from: "eamon",
      timestamp: "2026-03-26T18:30:00Z",
      idleReason: "available",
      summary: "[to gm] Eamon watches the road",
    });
    const events = parseLine(teammateMsg("eamon", json));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("idle");
    expect(events[0].from).toBe("eamon");
    expect(events[0].summary).toBe("[to gm] Eamon watches the road");
  });

  it("parses teammate_terminated JSON", () => {
    const json = JSON.stringify({
      type: "teammate_terminated",
      teammate_id: "narrator",
    });
    const events = parseLine(teammateMsg("narrator", json));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("terminated");
    expect(events[0].from).toBe("narrator");
  });

  it("parses ACTIVITY events", () => {
    const content = "[ACTIVITY]\ncharacter: drakkenne\ndoing: journaling the encounter";
    const events = parseLine(teammateMsg("drakkenne", content));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("activity");
    expect(events[0].from).toBe("drakkenne");
  });

  it("emits ASK_PLAYER teammate-messages as ask_player events", () => {
    const content = "[ASK_PLAYER]\ncharacter: verdakho\n\nWhat do you do?";
    const events = parseLine(teammateMsg("verdakho", content));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("ask_player");
    expect(events[0].from).toBe("verdakho");
    expect(events[0].to).toBe("human");
    expect(events[0].content).toBe("What do you do?");
    expect(events[0].content).not.toContain("[ASK_PLAYER]");
    expect(events[0].content).not.toContain("character:");
  });

  it("handles multiple teammate-messages in one line", () => {
    const line = JSON.stringify({
      type: "user",
      timestamp: "2026-03-26T18:30:00Z",
      message: {
        content:
          '<teammate-message teammate_id="eamon">\nReady.\n</teammate-message>' +
          '<teammate-message teammate_id="narrator">\n' +
          JSON.stringify({ type: "idle_notification", from: "narrator", summary: "idle" }) +
          "\n</teammate-message>",
      },
    });
    const events = parseLine(line);
    expect(events).toHaveLength(2);
    expect(events[0].from).toBe("eamon");
    expect(events[1].from).toBe("narrator");
    expect(events[1].type).toBe("idle");
  });

  it("preserves color from teammate-message attributes", () => {
    const events = parseLine(teammateMsg("eamon", "Hello", { color: "yellow" }));
    expect(events[0].color).toBe("yellow");
  });
});

// === SendMessage tool_use ===

describe("SendMessage parsing", () => {
  it("parses NARRATIVE SendMessage", () => {
    const events = parseLine(
      assistantMsg([
        {
          type: "tool_use",
          id: "tool_1",
          name: "SendMessage",
          input: {
            to: "*",
            content: "[NARRATIVE]\n\nThe tavern is quiet tonight.",
          },
        },
      ])
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("narrative");
    expect(events[0].from).toBe("gm");
    expect(events[0].to).toBe("*");
    expect(events[0].content).not.toContain("[NARRATIVE]");
  });

  it("parses SESSION_COMMAND SendMessage", () => {
    const events = parseLine(
      assistantMsg([
        {
          type: "tool_use",
          id: "tool_2",
          name: "SendMessage",
          input: {
            to: "gm",
            content: "[SESSION_COMMAND]\ncommand: start\ncampaign: the-ember-tithe",
          },
        },
      ])
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("session_command");
    expect(events[0].from).toBe("team-lead");
  });

  it("hides shutdown_request messages", () => {
    const events = parseLine(
      assistantMsg([
        {
          type: "tool_use",
          id: "tool_3",
          name: "SendMessage",
          input: { to: "narrator", type: "shutdown_request" },
        },
      ])
    );
    expect(events).toHaveLength(0);
  });
});

// === AskUserQuestion ===

describe("AskUserQuestion parsing", () => {
  it("creates ask_player event with options", () => {
    const events = parseLine(
      assistantMsg([
        {
          type: "tool_use",
          id: "ask_1",
          name: "AskUserQuestion",
          input: {
            questions: [
              {
                question: "What do you do?",
                header: "Your Move",
                options: [
                  { label: "Fight", description: "Attack the goblin" },
                  { label: "Run", description: "Flee" },
                ],
              },
            ],
          },
        },
      ])
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("ask_player");
    expect(events[0].to).toBe("human");
    expect(events[0].content).toContain("What do you do?");
    expect(events[0].content).toContain("**Fight**");
    expect(events[0].summary).toBe("Your Move");
  });

  it("suppresses AskUserQuestion when preceding ASK_PLAYER already emitted", () => {
    // First: teammate-message emits the ask_player event
    const tmEvents = parseLine(teammateMsg("verdakho", "[ASK_PLAYER]\ncharacter: verdakho\n\nWhat do you do?"));
    expect(tmEvents).toHaveLength(1);
    expect(tmEvents[0].from).toBe("verdakho");

    // Then: AskUserQuestion is suppressed (duplicate)
    const events = parseLine(
      assistantMsg([
        {
          type: "tool_use",
          id: "ask_2",
          name: "AskUserQuestion",
          input: { questions: [{ question: "What do you do?" }] },
        },
      ])
    );
    expect(events).toHaveLength(0);
  });

  it("expires stale ASK_PLAYER tracking after several lines", () => {
    // ASK_PLAYER sets the flag
    parseLine(teammateMsg("verdakho", "[ASK_PLAYER]\ncharacter: verdakho\n\nQ?"));

    // Simulate several unrelated lines passing (expire the flag)
    for (let i = 0; i < 6; i++) {
      parseLine(JSON.stringify({ type: "user", timestamp: "2026-03-26T18:30:00Z", message: { content: "noop" } }));
    }

    // AskUserQuestion should NOT be suppressed — the flag expired
    const events = parseLine(
      assistantMsg([
        {
          type: "tool_use",
          id: "ask_stale",
          name: "AskUserQuestion",
          input: { questions: [{ question: "Unrelated setup question" }] },
        },
      ])
    );
    expect(events).toHaveLength(1);
    expect(events[0].from).toBe("gm"); // standalone, not attributed to verdakho
  });

  it("falls back to gm when no preceding ASK_PLAYER", () => {
    const events = parseLine(
      assistantMsg([
        {
          type: "tool_use",
          id: "ask_3",
          name: "AskUserQuestion",
          input: { questions: [{ question: "Choose a campaign" }] },
        },
      ])
    );
    expect(events).toHaveLength(1);
    expect(events[0].from).toBe("gm");
  });
});

// === AskUserQuestion answers ===

describe("AskUserQuestion answer parsing", () => {
  it("parses tool_result as human response", () => {
    // Register the pending ask
    parseLine(teammateMsg("verdakho", "[ASK_PLAYER]\ncharacter: verdakho\n\nWhat?"));
    parseLine(
      assistantMsg([
        {
          type: "tool_use",
          id: "ask_ans_1",
          name: "AskUserQuestion",
          input: { questions: [{ question: "What do you do?" }] },
        },
      ])
    );

    // Now the answer
    const events = parseLine(
      userToolResult([
        {
          type: "tool_result",
          tool_use_id: "ask_ans_1",
          content: 'User has answered your questions: "What do you do?"="I attack the goblin"',
        },
      ])
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("player_to_gm");
    expect(events[0].from).toBe("human");
    expect(events[0].to).toBe("verdakho");
    expect(events[0].content).toBe("I attack the goblin");
    expect(events[0].parsed.actionType).toBe("RESPONSE");
  });

  it("ignores tool_result for unknown tool IDs", () => {
    const events = parseLine(
      userToolResult([
        {
          type: "tool_result",
          tool_use_id: "unknown_id",
          content: "Some result",
        },
      ])
    );
    expect(events).toHaveLength(0);
  });
});

// === Additional protocol tags ===

describe("additional teammate-message tags", () => {
  it("parses PLAYER_TO_PLAYER", () => {
    const content = "[PLAYER_TO_PLAYER]\nto: lasinne\ncharacter: eamon\n\n*whispers* Keep your eyes on the innkeeper.";
    const events = parseLine(teammateMsg("eamon", content));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("player_to_player");
    expect(events[0].from).toBe("eamon");
    expect(events[0].to).toBe("lasinne");
    expect(events[0].content).toContain("Keep your eyes on the innkeeper");
    expect(events[0].content).not.toContain("[PLAYER_TO_PLAYER]");
  });

  it("parses PLAYER_TO_PARTY", () => {
    const content = "[PLAYER_TO_PARTY]\ncharacter: eamon\ntype: ACTION\n\nEveryone, we need to move.";
    const events = parseLine(teammateMsg("eamon", content));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("player_to_party");
    expect(events[0].from).toBe("eamon");
    expect(events[0].content).toBe("Everyone, we need to move.");
  });

  it("parses DICE_RESULT", () => {
    const content = "[DICE_RESULT]\ncharacter: eamon\n\nPersuasion: 1d20+4 = [17]+4 = 21";
    const events = parseLine(teammateMsg("eamon", content));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("dice_result");
    expect(events[0].parsed.diceRolls).toHaveLength(1);
    expect(events[0].parsed.diceRolls![0]).toContain("1d20+4");
  });

  it("parses SESSION_END", () => {
    const content = "[SESSION_END]\n\nSession complete. 4 beats, 12 rolls.";
    const events = parseLine(teammateMsg("gm", content));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("session_end");
    expect(events[0].from).toBe("gm");
  });

  it("parses NARRATOR_NOTE", () => {
    const content = "[NARRATOR_NOTE]\n\nScene 3 written to scenes/003-the-well.md";
    const events = parseLine(teammateMsg("narrator", content));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("narrator_note");
    expect(events[0].from).toBe("narrator");
  });

  it("parses COMMAND_ACK", () => {
    const content = "[COMMAND_ACK]\ncommand: start";
    const events = parseLine(teammateMsg("gm", content));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("command_ack");
  });

  it("parses SESSION_COMMAND", () => {
    const content = "[SESSION_COMMAND]\ncommand: end";
    const events = parseLine(teammateMsg("gm", content));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("session_command");
  });

  it("infers gm_to_player for untagged GM messages", () => {
    const events = parseLine(teammateMsg("gm", "You notice a shadow moving."));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("gm_to_player");
  });

  it("infers player_to_gm for untagged player messages", () => {
    const events = parseLine(teammateMsg("eamon", "I look around carefully."));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("player_to_gm");
  });
});

// === SendMessage additional tags ===

describe("SendMessage additional tags", () => {
  it("parses GM_TO_PLAYER SendMessage", () => {
    const events = parseLine(
      assistantMsg([
        {
          type: "tool_use",
          id: "tool_gm",
          name: "SendMessage",
          input: {
            to: "eamon",
            content: "[GM_TO_PLAYER]\ncharacter: eamon\nrequest_type: FULL_CONTEXT\n\n## Request\nWhat do you do?",
          },
        },
      ])
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("gm_to_player");
    expect(events[0].from).toBe("gm");
    expect(events[0].to).toBe("eamon");
    expect(events[0].parsed.requestType).toBe("FULL_CONTEXT");
    expect(events[0].content).not.toContain("[GM_TO_PLAYER]");
    expect(events[0].content).not.toContain("request_type:");
  });

  it("parses ASK_PLAYER SendMessage as gm", () => {
    const events = parseLine(
      assistantMsg([
        {
          type: "tool_use",
          id: "tool_ask",
          name: "SendMessage",
          input: {
            to: "verdakho",
            content: "[ASK_PLAYER]\ncharacter: verdakho\n\nHow do you respond?",
          },
        },
      ])
    );
    expect(events).toHaveLength(1);
    expect(events[0].from).toBe("gm");
  });

  it("parses NARRATOR_NOTE SendMessage", () => {
    const events = parseLine(
      assistantMsg([
        {
          type: "tool_use",
          id: "tool_narr",
          name: "SendMessage",
          input: {
            to: "narrator",
            content: "[NARRATOR_NOTE]\n\nScene written.",
          },
        },
      ])
    );
    expect(events).toHaveLength(1);
    expect(events[0].from).toBe("gm");
    expect(events[0].type).toBe("narrator_note");
  });

  it("attributes untagged SendMessage to team-lead", () => {
    const events = parseLine(
      assistantMsg([
        {
          type: "tool_use",
          id: "tool_lead",
          name: "SendMessage",
          input: {
            to: "gm",
            content: "Session starting. All agents ready.",
          },
        },
      ])
    );
    expect(events).toHaveLength(1);
    expect(events[0].from).toBe("team-lead");
  });

  it("extracts dice rolls from SendMessage content", () => {
    const events = parseLine(
      assistantMsg([
        {
          type: "tool_use",
          id: "tool_dice",
          name: "SendMessage",
          input: {
            to: "*",
            content: "[NARRATIVE]\n\nThe attack lands. 1d20+5 = [18]+5 = 23",
          },
        },
      ])
    );
    expect(events).toHaveLength(1);
    expect(events[0].parsed.diceRolls).toHaveLength(1);
  });
});

// === Agents module ===

describe("agents module", () => {
  // Import agents functions for direct testing
  let agents: typeof import("../lib/agents");
  beforeEach(async () => {
    agents = await import("../lib/agents");
  });

  it("isSystemAgent identifies system agents", () => {
    expect(agents.isSystemAgent("gm")).toBe(true);
    expect(agents.isSystemAgent("narrator")).toBe(true);
    expect(agents.isSystemAgent("team-lead")).toBe(true);
    expect(agents.isSystemAgent("human")).toBe(true);
    expect(agents.isSystemAgent("eamon")).toBe(false);
    expect(agents.isSystemAgent("verdakho")).toBe(false);
  });

  it("isVisibleAgent hides team-lead and human", () => {
    expect(agents.isVisibleAgent("gm")).toBe(true);
    expect(agents.isVisibleAgent("narrator")).toBe(true);
    expect(agents.isVisibleAgent("team-lead")).toBe(false);
    expect(agents.isVisibleAgent("human")).toBe(false);
    expect(agents.isVisibleAgent("eamon")).toBe(true);
  });

  it("inferRole returns correct roles", () => {
    expect(agents.inferRole("gm")).toBe("gm");
    expect(agents.inferRole("narrator")).toBe("narrator");
    expect(agents.inferRole("team-lead")).toBe("lead");
    expect(agents.inferRole("eamon")).toBe("player");
  });

  it("getIdentity returns records for system agents, null for others", () => {
    expect(agents.getIdentity("gm")?.shortName).toBe("GM");
    expect(agents.getIdentity("human")?.shortName).toBe("Human");
    expect(agents.getIdentity("eamon")).toBeNull();
  });

  it("formatAgentName handles system and player agents", () => {
    expect(agents.formatAgentName("gm")).toBe("Game Master");
    expect(agents.formatAgentName("narrator")).toBe("Narrator");
    expect(agents.formatAgentName("eamon-lightward")).toBe("Eamon Lightward");
    expect(agents.formatAgentName("verdakho")).toBe("Verdakho");
  });

  it("getAgentMetadata returns all system agents", () => {
    const meta = agents.getAgentMetadata();
    expect(Object.keys(meta)).toEqual(["gm", "narrator", "team-lead", "human"]);
    expect(meta.gm.role).toBe("gm");
    expect(meta.gm.color).toBe("gm");
    expect(meta.human.isSystem).toBe(true);
  });
});

// === Edge cases ===

describe("edge cases", () => {
  it("returns empty for malformed JSON", () => {
    expect(parseLine("not json")).toEqual([]);
    expect(parseLine("")).toEqual([]);
    expect(parseLine("{}")).toEqual([]);
  });

  it("returns empty for empty teammate-message", () => {
    const line = JSON.stringify({
      type: "user",
      timestamp: "2026-03-26T18:30:00Z",
      message: {
        content: '<teammate-message teammate_id="gm">\n</teammate-message>',
      },
    });
    expect(parseLine(line)).toEqual([]);
  });

  it("resetParserState clears all module state", () => {
    // Set up some state
    parseLine(teammateMsg("verdakho", "[ASK_PLAYER]\ncharacter: verdakho\n\nQ?"));
    parseLine(
      assistantMsg([
        { type: "tool_use", id: "reset_test", name: "AskUserQuestion", input: { questions: [{ question: "Q?" }] } },
      ])
    );

    resetParserState();

    // After reset, the pending ask ID should be gone
    const events = parseLine(
      userToolResult([
        { type: "tool_result", tool_use_id: "reset_test", content: 'User has answered your questions: "Q?"="A"' },
      ])
    );
    expect(events).toHaveLength(0);
  });
});
