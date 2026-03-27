/**
 * Spectator Mode — frontend client
 * Connects via WebSocket, renders play-script view of D&D session.
 */

// State
let state = {
  sessionId: null,
  campaign: null,
  agents: {},
  events: [],
  status: "starting",
};

let autoScroll = true;
let eventCount = 0;

// Filter state — which event types are visible
const filters = {
  narrative: true,
  gm_to_player: true,
  player_to_gm: true,
  player_to_player: true,
  activity: false,
  idle: false,
  session: true,
};

// Agent identity metadata (populated from server on init)
let agentMeta = {};

function getAgentColor(id, color) {
  const meta = agentMeta[id];
  if (meta) return `var(--color-${meta.color})`;
  if (color) return `var(--color-${color})`;
  const colors = ["yellow", "purple", "orange", "pink", "blue", "green", "cyan", "red"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return `var(--color-${colors[Math.abs(hash) % colors.length]})`;
}

function getAgentShortName(id) {
  const meta = agentMeta[id];
  if (meta) return meta.shortName;
  if (id === "*") return "All";
  const parts = id.split("-");
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
}

function getAgentFullName(id) {
  const agent = state.agents[id];
  if (agent?.character?.name) return agent.character.name;
  const meta = agentMeta[id];
  if (meta) return meta.displayName;
  if (id === "*") return "All";
  return id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatTimestamp(ts) {
  try {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
  } catch { return ""; }
}

// === GM Prompt Extraction ===

/**
 * Extract the interesting parts of a GM→Player message:
 * - ## Request (what the GM is asking the character to do)
 * - ## Dice (what rolls are needed)
 * Skips ## Scene and ## Just Happened (redundant with narrative).
 */
function extractGmPromptSummary(content) {
  const sections = {};
  let currentSection = null;
  let currentLines = [];

  for (const line of content.split("\n")) {
    const heading = line.match(/^##\s+(.+)/);
    if (heading) {
      if (currentSection) sections[currentSection] = currentLines.join("\n").trim();
      currentSection = heading[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentSection) sections[currentSection] = currentLines.join("\n").trim();

  // The interesting bits — request + dice
  const request = sections["Request"] || sections["Question"] || null;
  const dice = sections["Dice"] || null;

  // Scene is redundant with narrative — only show in expanded view
  const hasScene = "Scene" in sections || "Just Happened" in sections;

  return { request, dice, hasScene, sections };
}

// === Rendering ===

function renderAgentCards() {
  const container = document.getElementById("agent-cards");
  const agents = Object.values(state.agents);

  const order = { gm: 0, narrator: 1, lead: 2 };
  agents.sort(
    (a, b) => (order[a.role] ?? 3) - (order[b.role] ?? 3) || a.id.localeCompare(b.id)
  );

  container.innerHTML = agents
    .filter((a) => a.role !== "lead")
    .map((agent) => {
      const color = getAgentColor(agent.id, agent.color);
      const char = agent.character;
      return `
      <div class="agent-card" style="border-left: 3px solid ${color}">
        <div class="agent-name" style="color: ${color}">${getAgentFullName(agent.id)}</div>
        ${char
          ? `<div class="agent-info">${char.race} ${char.class_} ${char.level}</div>
             <div class="hp-bar-container">
               <div class="hp-bar" style="width: ${(char.hp.current / char.hp.max) * 100}%"></div>
             </div>
             <div class="agent-info">${char.hp.current}/${char.hp.max} HP · AC ${char.ac}</div>`
          : agent.role === "gm"
            ? `<div class="agent-info">Game Master</div>`
            : agent.role === "narrator"
              ? `<div class="agent-info">Narrator</div>`
              : ""
        }
        <div class="agent-status">
          <span class="status-dot ${agent.status}"></span>
          <span>${agent.status}</span>
        </div>
        ${agent.lastActivity ? `<div class="agent-activity" title="${escapeHtml(agent.lastActivity)}">${escapeHtml(agent.lastActivity)}</div>` : ""}
        ${char ? (() => {
          const mode = characterModes[agent.id] || "human";
          const hasPrompt = activePrompts[agent.id];
          return `<button class="mode-toggle ${mode === "human" ? "human" : "auto"}" data-character="${agent.id}" title="Click to toggle">
            ${mode === "human" ? "Human" : "Auto"}${hasPrompt ? " ●" : ""}
          </button>`;
        })() : ""}
      </div>`;
    })
    .join("");
}

function shouldShow(event) {
  switch (event.type) {
    case "narrative": return filters.narrative;
    case "gm_to_player": return filters.gm_to_player;
    case "player_to_gm": return filters.player_to_gm;
    case "player_to_player":
    case "player_to_party": return filters.player_to_player;
    case "activity": return filters.activity;
    case "idle": return filters.idle && !!event.summary;
    case "session_command":
    case "session_end": return filters.session;
    case "system":
    case "command_ack":
    case "terminated": return false;
    case "ask_player":
    case "narrator_note": return filters.gm_to_player;
    default: return false;
  }
}

function renderEvent(event) {
  if (!shouldShow(event)) return null;
  // Skip team-lead internal chatter
  if (agentMeta[event.from]?.role === "lead" && !["narrative", "session_command", "gm_to_player"].includes(event.type)) return null;

  const el = document.createElement("div");
  el.className = `event ${event.type}`;
  el.dataset.eventId = event.id;

  const color = getAgentColor(event.from, event.color);

  switch (event.type) {
    case "narrative":
      el.innerHTML = renderNarrative(event);
      break;
    case "gm_to_player":
    case "ask_player":
      el.innerHTML = renderGmPrompt(event);
      break;
    case "player_to_gm":
      el.innerHTML = renderPlayerAction(event, color);
      break;
    case "player_to_player":
    case "player_to_party":
      el.innerHTML = renderPlayerAction(event, color);
      break;
    case "activity":
      el.innerHTML = renderActivity(event, color);
      break;
    case "session_command":
      el.innerHTML = renderSessionCommand(event);
      break;
    case "session_end":
      el.innerHTML = renderSessionEnd(event);
      break;
    case "idle":
      el.innerHTML = `<span style="color: #555">⟳ ${getAgentShortName(event.from)}: ${escapeHtml(event.summary)}</span>`;
      break;
    default:
      return null;
  }

  return el;
}

// --- Narrative (always full) ---

function renderNarrative(event) {
  const activityIdx = event.content.indexOf("## Party Activity");
  const narrative = activityIdx > -1 ? event.content.substring(0, activityIdx) : event.content;
  const activity = activityIdx > -1 ? event.content.substring(activityIdx) : null;

  return `
    <div class="event-header">
      <span class="event-from" style="color: var(--color-gm)">⬥ NARRATIVE</span>
      ${event.parsed.sceneSlug ? `<span class="event-tag">${event.parsed.sceneSlug}</span>` : ""}
      <span class="event-meta">${formatTimestamp(event.timestamp)}</span>
    </div>
    <div class="event-content">${formatNarrativeText(narrative.trim())}</div>
    ${activity ? `<div class="party-activity">${formatMarkdown(activity)}</div>` : ""}
  `;
}

// --- GM → Player (collapsed, shows request + dice only) ---

function renderGmPrompt(event) {
  const toName = getAgentShortName(event.to);
  const toColor = getAgentColor(event.to);
  const reqType = event.parsed.requestType;
  const { request, dice, hasScene } = extractGmPromptSummary(event.content);

  // Build the collapsed summary
  let summaryHtml = "";

  if (request) {
    summaryHtml += `<div class="gm-prompt-request">${formatInlineMarkdown(request)}</div>`;
  }

  if (dice) {
    summaryHtml += `<div class="gm-prompt-dice">${formatInlineMarkdown(dice)}</div>`;
  }

  // If no request/dice extracted, show a brief excerpt
  if (!summaryHtml) {
    const excerpt = event.content.split("\n").filter(l => l.trim() && !l.startsWith("request_type") && !l.startsWith("scene_number") && !l.startsWith("scene_slug")).slice(0, 3).join("\n");
    summaryHtml = `<div class="gm-prompt-request">${formatInlineMarkdown(excerpt)}</div>`;
  }

  const expandId = `expand-${event.id}`;

  return `
    <div class="event-header">
      <span class="event-from" style="color: ${getAgentColor(event.from)}">${getAgentShortName(event.from).toUpperCase()}</span>
      <span class="event-arrow">→</span>
      <span class="event-to" style="color: ${toColor}">${toName}</span>
      ${reqType ? `<span class="event-tag">${reqType}</span>` : ""}
      ${hasScene ? `<button class="expand-btn" onclick="toggleExpand('${expandId}')" title="Show full scene briefing">▸ scene</button>` : ""}
      <span class="event-meta">${formatTimestamp(event.timestamp)}</span>
    </div>
    ${summaryHtml}
    ${hasScene ? `<div id="${expandId}" class="expandable collapsed"><div class="expandable-content">${formatInlineMarkdown(event.content)}</div></div>` : ""}
  `;
}

// --- Player → GM / Player → Player (full content, formatted) ---

function renderPlayerAction(event, fromColor) {
  const fromName = getAgentShortName(event.from);
  const toName = event.to === "*" ? "All" : getAgentShortName(event.to);
  const toColor = getAgentColor(event.to);

  // Format the body with inline markdown
  let rendered = formatInlineMarkdown(event.content);

  // Action type badge
  const actionType = event.parsed.actionType;
  const badge = actionType && actionType !== "ACTION"
    ? `<span class="event-tag">${actionType}</span>`
    : "";

  return `
    <div class="event-header">
      <span class="event-from" style="color: ${fromColor}">${fromName}</span>
      <span class="event-arrow">→</span>
      <span class="event-to" style="color: ${toColor}">${toName}</span>
      ${badge}
      <span class="event-meta">${formatTimestamp(event.timestamp)}</span>
    </div>
    <div class="event-content">${rendered}</div>
  `;
}

// --- Activity (compact inline) ---

function renderActivity(event, color) {
  const doingMatch = event.content.match(/doing:\s*(.+)/);
  const charMatch = event.content.match(/character:\s*(.+)/);
  const doing = doingMatch ? doingMatch[1].trim() : event.content;
  const name = charMatch
    ? getAgentShortName(charMatch[1].trim())
    : getAgentShortName(event.from);

  return `<span style="color: ${color}">⟐ ${name}</span> <span>${escapeHtml(doing)}</span>`;
}

// --- Session events ---

function renderSessionCommand(event) {
  // Show a clean one-liner
  const cmdMatch = event.content.match(/command:\s*(\w+)/);
  const cmd = cmdMatch ? cmdMatch[1] : "unknown";
  return `<span class="session-marker">▶ SESSION ${cmd.toUpperCase()}</span>`;
}

function renderSessionEnd(event) {
  const expandId = `expand-${event.id}`;
  // Show summary line, expandable for full metrics
  return `
    <div class="event-header">
      <span class="event-from" style="color: var(--color-gm)">◼ SESSION END</span>
      <button class="expand-btn" onclick="toggleExpand('${expandId}')">▸ metrics</button>
      <span class="event-meta">${formatTimestamp(event.timestamp)}</span>
    </div>
    <div id="${expandId}" class="expandable collapsed">
      <div class="expandable-content">${formatInlineMarkdown(event.content)}</div>
    </div>
  `;
}

// === Expand/collapse ===

function toggleExpand(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("collapsed");
  // Update button text
  const btn = el.previousElementSibling?.querySelector?.(".expand-btn")
    || el.parentElement.querySelector(".expand-btn");
  if (btn) {
    const isCollapsed = el.classList.contains("collapsed");
    btn.textContent = btn.textContent.replace(/^[▸▾]/, isCollapsed ? "▸" : "▾");
  }
}
// Make toggleExpand globally accessible
window.toggleExpand = toggleExpand;

// === Flow panel ===

function addFlowEntry(event) {
  if (!shouldShow(event)) return;

  const container = document.getElementById("flow-log");
  const entry = document.createElement("div");
  entry.className = "flow-entry";

  const fromColor = getAgentColor(event.from, event.color);
  const toColor = event.to === "*" ? "var(--text-dim)" : getAgentColor(event.to);

  const typeLabel = event.type === "narrative" ? "NARR"
    : event.type === "gm_to_player" ? (event.parsed.requestType || "GM").substring(0, 6)
    : event.type === "player_to_gm" ? (event.parsed.actionType || "ACT").substring(0, 6)
    : event.type === "player_to_player" ? "TALK"
    : event.type === "session_end" ? "END"
    : (event.parsed.tag || event.type).substring(0, 8);

  entry.dataset.eventId = event.id;
  entry.innerHTML = `
    <span class="flow-from" style="color: ${fromColor}">${getAgentShortName(event.from)}</span>
    <span class="flow-arrow">→</span>
    <span class="flow-to" style="color: ${toColor}">${event.to === "*" ? "ALL" : getAgentShortName(event.to)}</span>
    <span class="flow-type">${typeLabel}</span>
  `;

  entry.addEventListener("click", () => {
    const target = document.querySelector(`[data-event-id="${event.id}"]`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("flash");
      setTimeout(() => target.classList.remove("flash"), 1500);
    }
  });

  container.appendChild(entry);
  while (container.children.length > 500) container.removeChild(container.firstChild);
  container.scrollTop = container.scrollHeight;
}

// === Filter toggles ===

function initFilters() {
  const container = document.getElementById("filter-toggles");
  const filterDefs = [
    { key: "narrative", label: "Narrative", icon: "⬥" },
    { key: "gm_to_player", label: "GM Prompts", icon: "⬦" },
    { key: "player_to_gm", label: "Actions", icon: "◆" },
    { key: "player_to_player", label: "Crosstalk", icon: "◇" },
    { key: "activity", label: "Activity", icon: "⟐" },
    { key: "idle", label: "Idle", icon: "⟳" },
    { key: "session", label: "Session", icon: "▶" },
  ];

  container.innerHTML = filterDefs.map(({ key, label, icon }) => `
    <button class="filter-btn ${filters[key] ? "active" : ""}" data-filter="${key}" title="Toggle ${label}">
      ${icon} ${label}
    </button>
  `).join("");

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    const key = btn.dataset.filter;
    filters[key] = !filters[key];
    btn.classList.toggle("active", filters[key]);
    rerenderEvents();
  });
}

function rerenderEvents() {
  const container = document.getElementById("events-container");
  container.innerHTML = "";
  const flowLog = document.getElementById("flow-log");
  flowLog.innerHTML = "";

  for (const event of state.events) {
    const el = renderEvent(event);
    if (el) container.appendChild(el);
    addFlowEntry(event);
  }

  if (autoScroll) {
    const script = document.getElementById("play-script");
    script.scrollTop = script.scrollHeight;
  }
}

// === Utilities ===

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function stripTag(content) {
  return content.replace(/^\[[A-Z_]+\]\n?/, "");
}

function wrapSentences(html) {
  // Split on sentence boundaries (. ! ? followed by space or end), preserving delimiters.
  // Avoids splitting on abbreviations, decimals, or mid-sentence punctuation.
  return html.replace(
    /([^<>]*?)([.!?]+(?:\s+|&quot;|"|'|&rsquo;|\s*$))/g,
    '<span class="sentence">$1$2</span>'
  );
}

function formatNarrativeText(text) {
  return text
    .split(/\n\n+/)
    .map((para) => {
      let html = escapeHtml(para.trim());
      html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
      html = html.replace(
        /(\d+d\d+(?:[+-]\d+)?\s*=\s*\[\d+\][^\n]*)/g,
        '<span class="dice-roll">🎲 $1</span>'
      );
      html = wrapSentences(html);
      return `<p>${html}</p>`;
    })
    .join("");
}

function formatInlineMarkdown(text) {
  let html = escapeHtml(text);
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic / actions
  html = html.replace(/\*([^*]+)\*/g, '<em style="color: var(--text-dim)">$1</em>');
  // Headings
  html = html.replace(/^##\s+(.+)$/gm, '<div class="inline-heading">$1</div>');
  // Dice rolls
  html = html.replace(
    /(\d+d\d+(?:[+-]\d+)?\s*=\s*\[\d+\][^\n]*)/g,
    '<span class="dice-roll">🎲 $1</span>'
  );
  html = html.replace(
    /Roll\s*Required:\s*([^\n]+)/g,
    '<span class="dice-roll">🎲 Roll Required: $1</span>'
  );
  // Bullet lists
  html = html.replace(/^- (.+)$/gm, '<div class="md-bullet">· $1</div>');
  // Quoted dialogue
  html = html.replace(/&quot;([^&]*?)&quot;/g, '"<span class="dialogue">$1</span>"');
  // Paragraphs — wrap in blocks for hover targeting
  html = html.replace(/\n\n+/g, '</div><div class="para-break"></div><div class="para-block">');
  html = `<div class="para-block">${html}</div>`;
  // Clean up empty blocks
  html = html.replace(/<div class="para-block"><\/div>/g, "");
  // Wrap sentences within para-blocks
  html = html.replace(/(<div class="para-block">)([\s\S]*?)(<\/div>)/g, (_, open, inner, close) => {
    return open + wrapSentences(inner) + close;
  });
  return html;
}

function formatMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/^##\s+(.+)$/gm, "<strong>$1</strong>");
  html = html.replace(/^- (.+)$/gm, "  · $1");
  return html;
}

// === WebSocket ===

function connect() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${protocol}//${location.host}`);

  ws.onopen = () => console.log("Connected to spectator server");

  ws.onmessage = (msg) => {
    const { type, data } = JSON.parse(msg.data);
    switch (type) {
      case "init": handleInit(data); break;
      case "event": handleEvent(data); break;
      case "agents":
        state.agents = data;
        renderAgentCards();
        break;
    }
  };

  ws.onclose = () => {
    console.log("Disconnected. Reconnecting in 2s...");
    setTimeout(connect, 2000);
  };
  ws.onerror = () => ws.close();
}

function handleInit(data) {
  agentMeta = data.agentMeta || {};

  state = {
    sessionId: data.sessionId,
    campaign: data.campaign,
    agents: data.agents || {},
    events: data.events || [],
    status: data.status,
  };

  // Set character modes from server-detected human control
  const humanSet = new Set(data.humanControlled || []);
  for (const [id, agent] of Object.entries(state.agents)) {
    if (agent.character) {
      characterModes[id] = humanSet.has(id) ? "human" : "full_auto";
    }
  }

  if (data.campaign?.title) {
    document.getElementById("campaign-title").textContent = `${data.campaign.title} — Spectator`;
    document.title = `${data.campaign.title} — Spectator`;
  }

  updateSessionStatus(data.status);
  renderAgentCards();
  rerenderEvents();

  eventCount = state.events.length;
  document.getElementById("event-count").textContent = `${eventCount} events`;
}

function handleEvent(event) {
  state.events.push(event);
  eventCount++;
  document.getElementById("event-count").textContent = `${eventCount} events`;

  if (event.type === "session_command" && event.content.includes("command: end")) {
    updateSessionStatus("ending");
  }
  if (event.type === "session_end") updateSessionStatus("ended");

  const container = document.getElementById("events-container");
  const el = renderEvent(event);
  if (el) {
    container.appendChild(el);
    if (autoScroll) {
      document.getElementById("play-script").scrollTop =
        document.getElementById("play-script").scrollHeight;
    }
  }
  addFlowEntry(event);
}

function updateSessionStatus(status) {
  const badge = document.getElementById("session-status");
  badge.textContent = status;
  badge.className = `status-badge ${status}`;
}

// === Scroll lock ===

const scrollBtn = document.getElementById("scroll-lock");
scrollBtn.classList.add("active");

scrollBtn.addEventListener("click", () => {
  autoScroll = !autoScroll;
  scrollBtn.classList.toggle("active", autoScroll);
  if (autoScroll) {
    document.getElementById("play-script").scrollTop =
      document.getElementById("play-script").scrollHeight;
  }
});

document.getElementById("play-script").addEventListener("scroll", (e) => {
  const el = e.target;
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  if (!atBottom && autoScroll) {
    autoScroll = false;
    scrollBtn.classList.remove("active");
  }
});

// === Player Input System ===

let characterModes = {}; // { "eamon-lightward": "human", ... }
let isPaused = false;
let activePrompts = {}; // { "eamon-lightward": { prompt, character, ... }, ... }
let activePromptChar = null; // which character's prompt is currently shown
let countdownInterval = null;

function startPromptPolling() {
  setInterval(async () => {
    try {
      const resp = await fetch("/api/prompt");
      const data = await resp.json();
      const newPrompts = data.prompts || {};

      // Detect new prompts
      for (const [char, prompt] of Object.entries(newPrompts)) {
        if (!activePrompts[char]) {
          activePrompts[char] = prompt;
          // Auto-show the first prompt that appears
          if (!activePromptChar) showPromptBar(char, prompt);
        }
      }
      // Detect removed prompts (response was consumed)
      for (const char of Object.keys(activePrompts)) {
        if (!newPrompts[char]) {
          delete activePrompts[char];
          if (activePromptChar === char) hidePromptBar();
        }
      }
      updatePromptTabs();
    } catch {}

    // Poll health for mode/pause state
    try {
      const resp = await fetch("/api/health");
      const health = await resp.json();
      if (health.characters) {
        characterModes = {};
        for (const [id, info] of Object.entries(health.characters)) {
          characterModes[id] = info.mode;
        }
        updateModeControls();
      }
      if (health.isPaused !== isPaused) {
        isPaused = health.isPaused;
        updatePauseButton();
      }
    } catch {}
  }, 1000);
}

function showPromptBar(character, data) {
  activePromptChar = character;
  const container = document.getElementById("prompt-container");
  const text = document.getElementById("prompt-text");
  const input = document.getElementById("prompt-input");
  const countdown = document.getElementById("prompt-countdown");
  const label = document.getElementById("prompt-label");

  label.textContent = `${getAgentShortName(character)}:`;
  text.textContent = data.prompt;
  input.value = "";
  container.classList.remove("hidden");
  input.focus();

  document.documentElement.style.setProperty("--player-bar-height", "140px");

  // deadline is epoch ms from CLI; show 15s less so UI expires before the CLI does
  const deadline = (data.deadline || Date.now() + 180000) - 15000;
  updateCountdown(deadline, countdown);
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => updateCountdown(deadline, countdown), 1000);
}

function hidePromptBar() {
  activePromptChar = null;
  document.getElementById("prompt-container").classList.add("hidden");
  document.documentElement.style.setProperty("--player-bar-height", "48px");
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  // Show next pending prompt if any
  const next = Object.keys(activePrompts)[0];
  if (next) showPromptBar(next, activePrompts[next]);
}

function updatePromptTabs() {
  // Show character tabs when multiple prompts are pending
  const chars = Object.keys(activePrompts);
  const label = document.getElementById("prompt-label");
  if (chars.length <= 1 && activePromptChar) {
    label.textContent = `${getAgentShortName(activePromptChar)}:`;
    return;
  }
  if (chars.length > 1 && activePromptChar) {
    label.innerHTML = chars.map(c =>
      `<span class="prompt-tab ${c === activePromptChar ? 'active' : ''}" data-char="${c}">` +
      `${getAgentShortName(c)} ${activePrompts[c] ? '●' : ''}` +
      `</span>`
    ).join(" ");
  }
}

function updateCountdown(deadline, el) {
  const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  el.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;
  el.className = remaining <= 10 ? "critical" : remaining <= 30 ? "warning" : "";
  if (remaining <= 0) hidePromptBar();
}

async function sendResponse(message) {
  if (!activePromptChar) return;
  try {
    await fetch("/api/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ character: activePromptChar, message }),
    });
  } catch (e) {
    console.error("Failed to send response:", e);
  }
  delete activePrompts[activePromptChar];
  hidePromptBar();
}

async function skipTurn() {
  if (!activePromptChar) return;
  try {
    await fetch("/api/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ character: activePromptChar, message: null, skip: true }),
    });
  } catch (e) {
    console.error("Failed to skip:", e);
  }
  delete activePrompts[activePromptChar];
  hidePromptBar();
}

async function sendInterrupt(message, modeChange) {
  try {
    await fetch("/api/interrupt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, mode_change: modeChange || null }),
    });
  } catch (e) {
    console.error("Failed to interrupt:", e);
  }
  document.getElementById("interrupt-container").classList.add("hidden");
  document.getElementById("interrupt-input").value = "";
}

async function togglePause() {
  try {
    if (isPaused) {
      await fetch("/api/pause", { method: "DELETE" });
    } else {
      await fetch("/api/pause", { method: "POST" });
    }
    isPaused = !isPaused;
    updatePauseButton();
  } catch (e) {
    console.error("Failed to toggle pause:", e);
  }
}

async function toggleCharacterMode(character) {
  const current = characterModes[character] || "human";
  const newMode = current === "human" ? "full_auto" : "human";
  try {
    await fetch("/api/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ character, mode: newMode }),
    });
    characterModes[character] = newMode;
    updateModeControls();
  } catch (e) {
    console.error("Failed to toggle mode:", e);
  }
}

function updateModeControls() {
  const btn = document.getElementById("btn-mode");
  const humanChars = Object.entries(characterModes).filter(([, m]) => m === "human");
  const autoChars = Object.entries(characterModes).filter(([, m]) => m === "full_auto");
  if (humanChars.length === 0 && autoChars.length > 0) {
    btn.textContent = "All Auto";
    btn.classList.add("active");
  } else if (autoChars.length === 0) {
    btn.textContent = "All Human";
    btn.classList.remove("active");
  } else {
    btn.textContent = `${humanChars.length} Human`;
    btn.classList.remove("active");
  }
  // Re-render sidebar cards to update mode indicators
  renderAgentCards();
}

function updatePauseButton() {
  const btn = document.getElementById("btn-pause");
  btn.textContent = isPaused ? "Resume" : "Pause";
  btn.classList.toggle("danger", isPaused);
}

function initPlayerControls() {
  // Prompt response
  document.getElementById("prompt-send").addEventListener("click", () => {
    const input = document.getElementById("prompt-input");
    if (input.value.trim()) sendResponse(input.value.trim());
  });
  document.getElementById("prompt-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      sendResponse(e.target.value.trim());
    }
  });
  document.getElementById("prompt-skip").addEventListener("click", skipTurn);

  // Interrupt
  document.getElementById("btn-interrupt").addEventListener("click", () => {
    const container = document.getElementById("interrupt-container");
    container.classList.toggle("hidden");
    if (!container.classList.contains("hidden")) {
      document.getElementById("interrupt-input").focus();
    }
  });
  document.getElementById("interrupt-send").addEventListener("click", () => {
    const input = document.getElementById("interrupt-input");
    if (input.value.trim()) sendInterrupt(input.value.trim(), null);
  });
  document.getElementById("interrupt-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      sendInterrupt(e.target.value.trim(), null);
    }
    if (e.key === "Escape") {
      document.getElementById("interrupt-container").classList.add("hidden");
    }
  });
  document.getElementById("interrupt-cancel").addEventListener("click", () => {
    document.getElementById("interrupt-container").classList.add("hidden");
  });

  // Per-character mode toggles in sidebar
  document.getElementById("agent-cards").addEventListener("click", (e) => {
    const btn = e.target.closest(".mode-toggle");
    if (btn && btn.dataset.character) {
      toggleCharacterMode(btn.dataset.character);
    }
  });

  // Prompt tab clicks (switch between characters)
  document.getElementById("prompt-label").addEventListener("click", (e) => {
    const tab = e.target.closest(".prompt-tab");
    if (tab && tab.dataset.char && activePrompts[tab.dataset.char]) {
      showPromptBar(tab.dataset.char, activePrompts[tab.dataset.char]);
      updatePromptTabs();
    }
  });

  // Pause
  document.getElementById("btn-pause").addEventListener("click", togglePause);

  // Mode — cycle through characters or toggle all
  document.getElementById("btn-mode").addEventListener("click", () => {
    const chars = Object.keys(characterModes);
    if (chars.length === 0) return;
    // If all same mode, toggle all
    const allHuman = chars.every(c => characterModes[c] === "human");
    const allAuto = chars.every(c => characterModes[c] === "full_auto");
    if (allHuman || allAuto) {
      const newMode = allHuman ? "full_auto" : "human";
      chars.forEach(c => toggleCharacterMode(c));
    } else {
      // Mixed — set all to human
      chars.filter(c => characterModes[c] !== "human").forEach(c => toggleCharacterMode(c));
    }
  });

  // Set initial layout
  document.documentElement.style.setProperty("--player-bar-height", "48px");
}

// === Start ===
initFilters();
initPlayerControls();
startPromptPolling();
connect();
