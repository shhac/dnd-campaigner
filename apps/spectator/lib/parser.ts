/**
 * JSONL line parser — extracts D&D spectator events from Claude Code transcripts.
 *
 * Three data sources in the JSONL:
 * 1. SendMessage tool_use blocks (assistant messages) — GM/player outbound messages
 * 2. <teammate-message> elements (user messages) — incoming messages from teammates
 * 3. Idle notifications — brief summaries of agent status
 */

export interface SpectatorEvent {
  id: string;
  timestamp: string;
  type:
    | "narrative"
    | "gm_to_player"
    | "player_to_gm"
    | "player_to_player"
    | "player_to_party"
    | "activity"
    | "dice_result"
    | "session_command"
    | "command_ack"
    | "session_end"
    | "ask_player"
    | "narrator_note"
    | "idle"
    | "spawn"
    | "terminated"
    | "system";
  from: string;
  to: string;
  content: string;
  summary?: string;
  color?: string;
  parsed: {
    tag?: string;
    requestType?: string;
    character?: string;
    sceneNumber?: string;
    sceneSlug?: string;
    actionType?: string;
    diceRolls?: string[];
  };
}

let eventCounter = 0;

function nextId(): string {
  return `evt-${++eventCounter}`;
}

/**
 * Extract protocol tag from message content.
 * e.g., "[NARRATIVE]" or "[GM_TO_PLAYER]"
 */
function extractTag(content: string): string | undefined {
  const match = content.match(/^\[([A-Z_]+)\]/);
  return match ? match[1] : undefined;
}

/**
 * Map a protocol tag to a SpectatorEvent type.
 */
function tagToEventType(
  tag: string | undefined,
  from: string,
  to: string
): SpectatorEvent["type"] {
  switch (tag) {
    case "NARRATIVE":
      return "narrative";
    case "GM_TO_PLAYER":
      return "gm_to_player";
    case "PLAYER_TO_GM":
      return "player_to_gm";
    case "PLAYER_TO_PLAYER":
      return "player_to_player";
    case "PLAYER_TO_PARTY":
      return "player_to_party";
    case "ACTIVITY":
      return "activity";
    case "DICE_RESULT":
      return "dice_result";
    case "SESSION_COMMAND":
      return "session_command";
    case "COMMAND_ACK":
      return "command_ack";
    case "SESSION_END":
      return "session_end";
    case "ASK_PLAYER":
      return "ask_player";
    case "NARRATOR_NOTE":
      return "narrator_note";
    default:
      // Infer from sender/recipient
      if (from === "gm" && to !== "*") return "gm_to_player";
      if (to === "gm" && from !== "gm") return "player_to_gm";
      return "system";
  }
}

/**
 * Extract YAML-like fields from protocol message content.
 */
function extractFields(content: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^(\w[\w_]*)\s*:\s*(.+)$/);
    if (match) {
      fields[match[1]] = match[2].trim();
    }
  }
  return fields;
}

/**
 * Extract dice roll expressions from content.
 * Looks for patterns like "1d20+5 = [14]+5 = 19" or "Roll: 1d20+3"
 */
function extractDiceRolls(content: string): string[] {
  const rolls: string[] = [];
  // Match "NdN+N = [result]" patterns
  const resultPattern = /\d+d\d+(?:[+-]\d+)?\s*=\s*\[\d+\][^\n]*/g;
  let match;
  while ((match = resultPattern.exec(content)) !== null) {
    rolls.push(match[0]);
  }
  // Match "Roll Required: Skill (NdN+N)" patterns
  if (rolls.length === 0) {
    const reqPattern = /Roll\s*(?:Required)?:\s*[^\n]+\(\d+d\d+[^\)]*\)/gi;
    while ((match = reqPattern.exec(content)) !== null) {
      rolls.push(match[0]);
    }
  }
  return rolls;
}

/**
 * Parse a <teammate-message> element into SpectatorEvent(s).
 */
function parseTeammateMessage(
  xml: string,
  timestamp: string
): SpectatorEvent | null {
  // Extract attributes
  const idMatch = xml.match(/teammate_id="([^"]+)"/);
  const colorMatch = xml.match(/color="([^"]+)"/);
  const summaryMatch = xml.match(/summary="([^"]+)"/);

  if (!idMatch) return null;

  const from = idMatch[1];
  const color = colorMatch?.[1];
  const summary = summaryMatch?.[1];

  // Extract content between tags
  const contentMatch = xml.match(
    /<teammate-message[^>]*>\n?([\s\S]*?)(?:<\/teammate-message>|$)/
  );
  const content = contentMatch?.[1]?.trim() ?? "";

  if (!content) return null;

  // Check for idle notification JSON
  if (content.startsWith("{")) {
    try {
      const data = JSON.parse(content);
      if (data.type === "idle_notification") {
        return {
          id: nextId(),
          timestamp,
          type: "idle",
          from: data.from || from,
          to: "*",
          content: data.summary || "",
          summary: data.summary,
          color,
          parsed: {},
        };
      }
      if (data.type === "teammate_terminated") {
        return {
          id: nextId(),
          timestamp,
          type: "terminated",
          from: data.teammate_id || from,
          to: "*",
          content: `${data.teammate_id} terminated`,
          parsed: {},
        };
      }
    } catch {
      // Not JSON, continue
    }
  }

  const tag = extractTag(content);
  const fields = extractFields(content);

  // [ASK_PLAYER] teammate-messages are followed by AskUserQuestion tool calls
  // with cleaner content. Record the sender and suppress the duplicate.
  if (tag === "ASK_PLAYER") {
    lastAskPlayerFrom = from;
    return null;
  }

  // GM messages use "character:" to identify the recipient
  const to = fields.to || fields.recipient
    || (from === "gm" && fields.character ? fields.character : null)
    || "gm";
  const eventType = tagToEventType(tag, from, to);

  return {
    id: nextId(),
    timestamp,
    type: eventType,
    from,
    to: tag === "NARRATIVE" ? "*" : to,
    content,
    summary,
    color,
    parsed: {
      tag,
      requestType: fields.request_type,
      character: fields.character,
      sceneNumber: fields.scene_number,
      sceneSlug: fields.scene_slug,
      actionType: fields.type,
      diceRolls: extractDiceRolls(content),
    },
  };
}

/**
 * Parse a SendMessage tool_use block into a SpectatorEvent.
 */
function parseSendMessage(
  input: Record<string, unknown>,
  timestamp: string
): SpectatorEvent | null {
  const to = (input.to || input.recipient || "*") as string;
  const content = (input.content || input.message || "") as string;
  const msgType = (input.type || "message") as string;

  if (msgType === "shutdown_request") {
    return null; // Hide shutdown internals
  }

  const tag = extractTag(content);
  const fields = extractFields(content);

  // Attribute sender based on protocol tag — the team lead relays GM messages
  const inferredFrom =
    tag === "NARRATIVE" || tag === "GM_TO_PLAYER" || tag === "ASK_PLAYER" || tag === "NARRATOR_NOTE"
      ? "gm"
      : tag === "SESSION_COMMAND"
        ? "team-lead"
        : "team-lead";

  const eventType = tagToEventType(tag, inferredFrom, to);

  return {
    id: nextId(),
    timestamp,
    type: eventType,
    from: inferredFrom,
    to: to === "*" ? "*" : to,
    content,
    summary: (input.summary as string) || undefined,
    parsed: {
      tag,
      requestType: fields.request_type,
      character: fields.character,
      sceneNumber: fields.scene_number,
      sceneSlug: fields.scene_slug,
      diceRolls: extractDiceRolls(content),
    },
  };
}

/**
 * Parse an AskUserQuestion tool_use block into a SpectatorEvent.
 */
function parseAskUserQuestion(
  input: Record<string, unknown>,
  toolUseId: string,
  timestamp: string
): SpectatorEvent | null {
  const questions = input.questions as Array<Record<string, unknown>> | undefined;
  if (!questions?.length) return null;

  const q = questions[0];
  const header = (q.header as string) || "";
  const question = (q.question as string) || "";
  const options = q.options as Array<Record<string, unknown>> | undefined;

  let content = question;
  if (options?.length) {
    const optionLines = options.map(
      (o) => `- **${o.label}**: ${o.description || ""}`
    );
    content += "\n\n" + optionLines.join("\n");
  }

  const sender = lastAskPlayerFrom || "gm";
  lastAskPlayerFrom = null;

  return {
    id: nextId(),
    timestamp,
    type: "ask_player",
    from: sender,
    to: "human",
    content,
    summary: header || question.slice(0, 80),
    parsed: {
      tag: "ASK_PLAYER",
      character: sender,
    },
  };
}

// Track AskUserQuestion tool IDs → sender character for matching answers
const pendingAskIds = new Map<string, string>();

// Track the last character that sent [ASK_PLAYER] so we can attribute
// the subsequent AskUserQuestion tool call to the right agent
let lastAskPlayerFrom: string | null = null;

/**
 * Parse a single JSONL line into zero or more SpectatorEvents.
 */
export function parseLine(line: string): SpectatorEvent[] {
  const events: SpectatorEvent[] = [];

  try {
    const record = JSON.parse(line);
    const timestamp =
      record.timestamp || new Date().toISOString();

    // Handle user messages (incoming teammate messages + AskUserQuestion answers)
    if (record.type === "user") {
      const content = record.message?.content;
      if (typeof content === "string" && content.includes("<teammate-message")) {
        // Split multiple teammate messages in one line
        const parts = content.split(/<\/teammate-message>/);
        for (const part of parts) {
          if (part.includes("<teammate-message")) {
            const event = parseTeammateMessage(
              part + "</teammate-message>",
              timestamp
            );
            if (event) events.push(event);
          }
        }
      }

      // Check for AskUserQuestion tool_result answers
      if (Array.isArray(content)) {
        for (const block of content) {
          if (
            block.type === "tool_result" &&
            pendingAskIds.has(block.tool_use_id)
          ) {
            const answerTo = pendingAskIds.get(block.tool_use_id) || "gm";
            pendingAskIds.delete(block.tool_use_id);
            let text = block.content ?? "";
            if (Array.isArray(text)) {
              for (const t of text) {
                if (t.type === "text") { text = t.text; break; }
              }
            }
            if (typeof text !== "string") continue;
            // Extract the answer from "User has answered your questions: "Q"="A""
            const answerMatch = text.match(/="([^]*?)(?:"|$)/);
            const answer = answerMatch ? answerMatch[1] : text;
            if (!answer.trim()) continue;

            events.push({
              id: nextId(),
              timestamp,
              type: "player_to_gm",
              from: "human",
              to: answerTo,
              content: answer,
              parsed: {
                tag: "PLAYER_TO_GM",
                actionType: "RESPONSE",
              },
            });
          }
        }
      }
    }

    // Handle assistant messages (outgoing tool calls)
    if (record.type === "assistant") {
      const content = record.message?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type !== "tool_use") continue;
          if (block.name === "SendMessage") {
            const event = parseSendMessage(block.input || {}, timestamp);
            if (event) events.push(event);
          }
          if (block.name === "AskUserQuestion") {
            pendingAskIds.set(block.id, lastAskPlayerFrom || "gm");
            const event = parseAskUserQuestion(
              block.input || {},
              block.id,
              timestamp
            );
            if (event) events.push(event);
          }
        }
      }
    }
  } catch {
    // Skip malformed lines
  }

  return events;
}

/**
 * Determine the "from" agent for a SendMessage in the team lead's JSONL.
 * The team lead sends messages on behalf of itself. But the GM also sends
 * messages that appear in ITS OWN subagent JSONL. In the main JSONL,
 * SendMessage calls are from the team lead. Teammate messages are from
 * their respective teammate_id.
 */
export function inferSender(event: SpectatorEvent): SpectatorEvent {
  // teammate-message already has the correct from
  // SendMessage from main JSONL is from team-lead (orchestrator)
  // The GM's SendMessage calls appear as teammate-message in the main JSONL
  return event;
}
