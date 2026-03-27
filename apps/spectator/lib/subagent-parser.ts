/**
 * Subagent JSONL parser — extracts direct agent-to-agent messages
 * from subagent transcripts that aren't visible in the parent JSONL.
 */

import { extractTag, extractFields, extractDiceRolls, cleanContent, tagToEventType } from "./parser";
import type { SpectatorEvent } from "./parser";

let subEventCounter = 0;

function nextSubId(): string {
  return `sub-evt-${++subEventCounter}`;
}

/**
 * Create a line parser bound to a specific agent identity.
 * Returns a function compatible with JsonlWatcher's LineParser type.
 */
export function createSubagentParser(agentType: string): (line: string) => SpectatorEvent[] {
  return (line: string) => parseSubagentLine(line, agentType);
}

/**
 * Parse a single JSONL line from a subagent transcript.
 * Only extracts outgoing SendMessage blocks (the agent's own messages).
 * Skips messages to "team-lead" (already captured in parent JSONL).
 */
export function parseSubagentLine(line: string, agentType: string): SpectatorEvent[] {
  const events: SpectatorEvent[] = [];

  try {
    const record = JSON.parse(line);
    const timestamp = record.timestamp || new Date().toISOString();

    // Only process assistant messages (outgoing tool calls from this agent)
    if (record.type !== "assistant") return events;

    const content = record.message?.content;
    if (!Array.isArray(content)) return events;

    for (const block of content) {
      if (block.type !== "tool_use" || block.name !== "SendMessage") continue;

      const input = block.input || {};
      const to = (input.to || input.recipient || "*") as string;
      const rawContent = (input.content || input.message || "") as string;
      const msgType = (input.type || "message") as string;

      if (msgType === "shutdown_request") continue;

      // Skip messages to team-lead — these are already in the parent JSONL
      if (to === "team-lead") continue;

      // Skip broadcasts — these are relayed through the parent JSONL
      if (to === "*") continue;

      const tag = extractTag(rawContent);
      const fields = extractFields(rawContent);
      const eventType = tagToEventType(tag, agentType, to);
      const cleaned = cleanContent(rawContent);

      events.push({
        id: nextSubId(),
        timestamp,
        type: eventType,
        from: agentType,
        to,
        content: cleaned,
        parsed: {
          tag,
          requestType: fields.request_type,
          character: fields.character,
          sceneNumber: fields.scene_number,
          sceneSlug: fields.scene_slug,
          actionType: fields.type,
          diceRolls: extractDiceRolls(rawContent),
        },
      });
    }
  } catch {
    // Skip malformed lines
  }

  return events;
}

/** Reset subagent parser state for testing. */
export function resetSubagentParserState(): void {
  subEventCounter = 0;
}
