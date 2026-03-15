/**
 * Campaign file reader — extracts character data and campaign metadata
 * from the local campaign directory.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";

export interface CharacterInfo {
  id: string;
  name: string;
  race: string;
  class_: string;
  level: number;
  hp: { current: number; max: number };
  ac: number;
  role: "player" | "gm" | "narrator";
}

export interface CampaignInfo {
  name: string;
  title: string;
  characters: CharacterInfo[];
}

/**
 * Parse a character sheet markdown file for basic stats.
 */
function parseCharacterSheet(filepath: string): Partial<CharacterInfo> {
  try {
    const content = readFileSync(filepath, "utf-8");
    const info: Partial<CharacterInfo> = {};

    // Name from first heading
    const nameMatch = content.match(/^#\s+(.+)/m);
    if (nameMatch) info.name = nameMatch[1].trim();

    // Basic info table: | Race | ... |
    const raceMatch = content.match(
      /\|\s*Race\s*\|\s*([^|]+)\|/i
    );
    if (raceMatch) info.race = raceMatch[1].trim();

    const classMatch = content.match(
      /\|\s*Class\s*\|\s*([^|]+)\|/i
    );
    if (classMatch) info.class_ = classMatch[1].trim();

    const levelMatch = content.match(
      /\|\s*Level\s*\|\s*(\d+)\s*\|/i
    );
    if (levelMatch) info.level = parseInt(levelMatch[1], 10);

    // HP
    const hpMatch = content.match(
      /\|\s*Hit Points\s*\|\s*(\d+)\s*\|/i
    );
    if (hpMatch) {
      const hp = parseInt(hpMatch[1], 10);
      info.hp = { current: hp, max: hp };
    }

    // AC
    const acMatch = content.match(
      /\|\s*Armor Class\s*\|\s*(\d+)\s*\|/i
    );
    if (acMatch) info.ac = parseInt(acMatch[1], 10);

    return info;
  } catch {
    return {};
  }
}

/**
 * Read campaign metadata and character sheets.
 */
export function readCampaign(
  repoRoot: string,
  campaignName: string
): CampaignInfo {
  const campaignDir = join(repoRoot, "campaigns", campaignName);
  const characters: CharacterInfo[] = [];

  // Read character sheets from party/
  const partyDir = join(campaignDir, "party");
  if (existsSync(partyDir)) {
    const files = readdirSync(partyDir).filter(
      (f) =>
        f.endsWith(".md") &&
        !f.endsWith("-brief.md") &&
        !f.endsWith("-journal.md") &&
        !f.endsWith("-relationships.md")
    );
    for (const file of files) {
      const id = basename(file, ".md");
      const info = parseCharacterSheet(join(partyDir, file));
      characters.push({
        id,
        name: info.name || id,
        race: info.race || "Unknown",
        class_: info.class_ || "Unknown",
        level: info.level || 1,
        hp: info.hp || { current: 10, max: 10 },
        ac: info.ac || 10,
        role: "player",
      });
    }
  }

  // Read campaign title from overview.md
  let title = campaignName;
  const overviewPath = join(campaignDir, "overview.md");
  if (existsSync(overviewPath)) {
    try {
      const overview = readFileSync(overviewPath, "utf-8");
      const titleMatch = overview.match(/^#\s+(.+)/m);
      if (titleMatch) title = titleMatch[1].trim();
    } catch {
      // Use default
    }
  }

  return { name: campaignName, title, characters };
}
